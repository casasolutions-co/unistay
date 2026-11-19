export interface PropertyPhoto {
  url?: string;
  a?: string;
  b?: string;
  label: string;
}

export interface PropertyAmenity {
  label: string;
  icon: string; // SVG path d attribute
}

export interface NearbyTransit {
  label: string;
  dist: string;
  icon: string; // SVG path d attribute
}

export interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  area: number;
  beds: string;
  price: number; // Monthly warm rent
  badge: 'CASA' | 'PARTNER';
  type: string;
  avail: string;
  now: boolean;
  incl: boolean;
  featured: boolean;
  lat: number;
  lng: number;

  // Details fields
  description: string;
  coldRent: number;
  utilities: number;
  deposit: number;
  serviceFee: number;
  bathrooms: string;
  floor: string;
  photos: PropertyPhoto[];
  amenities: PropertyAmenity[];
  nearby: NearbyTransit[];
  hostName: string;
  hostType: string;
  hostReplies: string;
  hostListings: string;
}

// Icon paths matching design
export const ICON_PATHS = {
  area: 'M21 3 3 21M9 3H3v6M21 15v6h-6',
  bed: 'M2 11h20M2 11V6a2 2 0 0 1 2-2h6v7M22 11v6M2 17h20M4 20v-3M20 20v-3',
  bath: 'M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1ZM6 12V5a2 2 0 0 1 2-2c1 0 1.5.5 2 1',
  floor: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M9 3v18M14 9l3-3 3 3M14 15l3 3 3-3',
  wifi: 'M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0M12 20h.01',
  furnished: 'M3 9V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3M2 11a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5H2zM4 16v3M20 16v3',
  kitchen: 'M6 2v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2M8 10v12M18 2v8M18 10v12M15 6h6',
  washer: 'M3 3h18v18H3zM7 6h.01M11 6h.01M12 18a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z',
  heating: 'M9 22V12M9 12c-2 0-3-1.5-3-3s1-3 3-3M15 22V8M15 8c2 0 3-1.5 3-3.5S17 1 15 1',
  balcony: 'M3 21h18M5 21V8h14v13M9 21v-5h6v5M9 4v4M15 4v4',
  bike: 'M5.5 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM18.5 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5.5 14.5 9 7h4l3 7.5M9 7h6',
  uni: 'M22 10 12 5 2 10l10 5 10-5ZM6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5',
  transit: 'M4 11V5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6M4 11h16M4 11v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6M8 22l-1-3M16 22l1-3',
  park: 'M12 22V12M7 13a5 5 0 0 1 0-8 5 5 0 0 1 10 0 5 5 0 0 1 0 8H7Z'
};
