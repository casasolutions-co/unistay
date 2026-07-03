import 'server-only'
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

function env(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is not set`)
  return v
}

let client: S3Client | null = null

function r2Client(): S3Client {
  if (client) return client
  client = new S3Client({
    region: 'auto',
    endpoint: `https://${env('CLOUDFLARE_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env('R2_ACCESS_KEY_ID'),
      secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
    },
  })
  return client
}

export async function getPhoto(key: string): Promise<{ body: Uint8Array; contentType: string } | null> {
  try {
    const res = await r2Client().send(
      new GetObjectCommand({ Bucket: env('R2_BUCKET_NAME'), Key: key })
    )
    const body = await res.Body?.transformToByteArray()
    if (!body) return null
    return { body, contentType: res.ContentType ?? 'application/octet-stream' }
  } catch {
    return null
  }
}

export async function putPhoto(key: string, body: Buffer, contentType: string): Promise<void> {
  await r2Client().send(
    new PutObjectCommand({ Bucket: env('R2_BUCKET_NAME'), Key: key, Body: body, ContentType: contentType })
  )
}

// Best-effort — callers should not fail a DB delete over a storage cleanup issue.
export async function deletePhoto(key: string): Promise<void> {
  try {
    await r2Client().send(new DeleteObjectCommand({ Bucket: env('R2_BUCKET_NAME'), Key: key }))
  } catch {
    /* orphaned R2 object — not worth blocking the caller over */
  }
}
