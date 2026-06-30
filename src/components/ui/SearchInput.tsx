'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SearchInputProps {
  placeholder?: string
  paramName?: string
  defaultValue?: string
}

export default function SearchInput({ placeholder = 'Search…', paramName = 'q', defaultValue = '' }: SearchInputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(paramName, value)
      } else {
        params.delete(paramName)
      }
      router.push(`${pathname}?${params.toString()}`)
    }, 300)
    return () => clearTimeout(t)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 42, padding: '0 14px', background: '#f4f2f9', borderRadius: 12, flex: 'none', width: 230 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a94a8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: '#1c1530', minWidth: 0 }}
      />
    </div>
  )
}
