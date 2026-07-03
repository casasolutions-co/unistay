import 'server-only'

type D1Value = string | number | null

interface D1QueryResult<T> {
  results: T[]
  success: boolean
  meta: { changes: number; last_row_id: number }
}

function env(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is not set`)
  return v
}

async function d1Fetch<T>(sql: string, params: D1Value[] = []): Promise<D1QueryResult<T>> {
  const accountId = env('CLOUDFLARE_ACCOUNT_ID')
  const databaseId = env('CLOUDFLARE_D1_DATABASE_ID')
  const token = env('CLOUDFLARE_API_TOKEN')

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, params }),
      cache: 'no-store',
    }
  )

  const json = await res.json()
  if (!json.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(json.errors ?? json)}`)
  }
  return json.result[0]
}

export async function d1All<T = Record<string, unknown>>(sql: string, params: D1Value[] = []): Promise<T[]> {
  const result = await d1Fetch<T>(sql, params)
  return result.results
}

export async function d1First<T = Record<string, unknown>>(sql: string, params: D1Value[] = []): Promise<T | null> {
  const rows = await d1All<T>(sql, params)
  return rows[0] ?? null
}

export async function d1Run(sql: string, params: D1Value[] = []): Promise<void> {
  await d1Fetch(sql, params)
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

// Some rows were written with Date.now() (ms) instead of unix seconds — normalize to ms.
export function toMs(timestamp: number | null | undefined): number | null {
  if (timestamp == null) return null
  return timestamp > 10_000_000_000 ? timestamp : timestamp * 1000
}

export function relativeTime(timestamp: number | null | undefined): string {
  if (timestamp == null) return '—'
  const unixSeconds = timestamp > 10_000_000_000 ? Math.floor(timestamp / 1000) : timestamp
  const diff = nowSeconds() - unixSeconds
  if (diff < 60) return 'just now'
  const mins = Math.floor(diff / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  const years = Math.floor(days / 365)
  return `${years} year${years === 1 ? '' : 's'} ago`
}
