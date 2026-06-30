import { avatarBg, initials } from '@/lib/utils'

interface AvatarProps {
  name: string
  size?: number
  fontSize?: number
  radius?: string
}

export default function Avatar({ name, size = 34, fontSize = 12.5, radius = '50%' }: AvatarProps) {
  return (
    <span style={{
      width: size, height: size, borderRadius: radius,
      background: avatarBg(name),
      display: 'grid', placeItems: 'center',
      fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize, color: '#fff',
      flex: 'none',
    }}>
      {initials(name)}
    </span>
  )
}
