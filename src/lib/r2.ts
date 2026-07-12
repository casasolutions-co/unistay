import { createHmac, createHash } from 'crypto';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const BUCKET     = process.env.R2_BUCKET_NAME!;
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID!;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const ENDPOINT   = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

function sha256hex(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

export function getSignedUrl(key: string, expiresIn = 3600): string {
  const now       = new Date();
  const amzDate   = now.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
  const dateStamp = amzDate.slice(0, 8);
  const host      = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const objPath   = `/${BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const credScope = `${dateStamp}/auto/s3/aws4_request`;

  const qp: [string, string][] = [
    ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential', `${ACCESS_KEY}/${credScope}`],
    ['X-Amz-Date', amzDate],
    ['X-Amz-Expires', String(expiresIn)],
    ['X-Amz-SignedHeaders', 'host'],
  ].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)) as [string, string][];

  const canonicalQS = qp
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const canonicalReq = ['GET', objPath, canonicalQS, `host:${host}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n');

  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credScope, sha256hex(canonicalReq)].join('\n');

  const signingKey = hmac(
    hmac(hmac(hmac(Buffer.from('AWS4' + SECRET_KEY), dateStamp), 'auto'), 's3'),
    'aws4_request',
  );
  const signature = hmac(signingKey, stringToSign).toString('hex');

  return `${ENDPOINT}${objPath}?${canonicalQS}&X-Amz-Signature=${signature}`;
}

export async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<void> {
  const now       = new Date();
  const amzDate   = now.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
  const dateStamp = amzDate.slice(0, 8);
  const bodyHash  = sha256hex(body);
  const host      = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const path      = `/${BUCKET}/${key}`;

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${bodyHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = [
    'PUT', path, '',
    canonicalHeaders, signedHeaders, bodyHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256', amzDate, credentialScope, sha256hex(canonicalRequest),
  ].join('\n');

  const signingKey = hmac(
    hmac(hmac(hmac(Buffer.from('AWS4' + SECRET_KEY), dateStamp), 'auto'), 's3'),
    'aws4_request',
  );
  const signature    = hmac(signingKey, stringToSign).toString('hex');
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`${ENDPOINT}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'X-Amz-Content-Sha256': bodyHash,
      'X-Amz-Date': amzDate,
      Authorization: authorization,
    },
    body: new Uint8Array(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 upload failed (${res.status}): ${text}`);
  }
}

export async function deleteFromR2(key: string): Promise<void> {
  const now       = new Date();
  const amzDate   = now.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
  const dateStamp = amzDate.slice(0, 8);
  const bodyHash  = sha256hex('');
  const host      = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const path      = `/${BUCKET}/${key}`;

  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-content-sha256:${bodyHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = [
    'DELETE', path, '',
    canonicalHeaders, signedHeaders, bodyHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256', amzDate, credentialScope, sha256hex(canonicalRequest),
  ].join('\n');

  const signingKey = hmac(
    hmac(hmac(hmac(Buffer.from('AWS4' + SECRET_KEY), dateStamp), 'auto'), 's3'),
    'aws4_request',
  );
  const signature    = hmac(signingKey, stringToSign).toString('hex');
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`${ENDPOINT}${path}`, {
    method: 'DELETE',
    headers: {
      'X-Amz-Content-Sha256': bodyHash,
      'X-Amz-Date': amzDate,
      Authorization: authorization,
    },
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`R2 delete failed (${res.status}): ${text}`);
  }
}
