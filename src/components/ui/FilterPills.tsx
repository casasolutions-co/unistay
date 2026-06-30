import Link from 'next/link'

interface Pill {
  label: string
  value: string
  href: string
}

interface FilterPillsProps {
  pills: Pill[]
  current: string
}

export default function FilterPills({ pills, current }: FilterPillsProps) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
      {pills.map(p => {
        const active = p.value === current
        return (
          <Link
            key={p.value}
            href={p.href}
            style={{
              fontSize: 13,
              fontWeight: 700,
              padding: '7px 15px',
              borderRadius: 999,
              border: `1.5px solid ${active ? '#6d28d9' : '#ece8f3'}`,
              background: active ? '#6d28d9' : '#fff',
              color: active ? '#fff' : '#4a4654',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {p.label}
          </Link>
        )
      })}
    </div>
  )
}
