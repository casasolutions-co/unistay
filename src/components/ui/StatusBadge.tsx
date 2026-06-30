interface StatusBadgeProps {
  label: string
  bg: string
  color: string
  size?: 'sm' | 'md'
}

export default function StatusBadge({ label, bg, color, size = 'sm' }: StatusBadgeProps) {
  return (
    <span style={{
      fontSize: size === 'sm' ? 12 : 13,
      fontWeight: 800,
      padding: size === 'sm' ? '4px 11px' : '5px 13px',
      borderRadius: 999,
      background: bg,
      color,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}
