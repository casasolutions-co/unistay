export interface UnifiedListing {
  id: string
  source: 'casa' | 'partner' | 'host'
  badge: 'CASA' | 'PARTNER' | 'HOST'
  title: string
  address: string
  city: string
  area: number
  beds: string
  price: number
  type: string
  avail: string
  availFrom: string | null
  now: boolean
  incl: boolean
  featured: boolean
  lat: number
  lng: number
  coverPhoto: string | null
  externalLink: string | null
  rank: number
}

export interface ListingFilters {
  minPrice?: number
  maxPrice?: number
  type?: string
  moveIn?: string
  source?: string
}
