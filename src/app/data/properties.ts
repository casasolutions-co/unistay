export interface PropertyPhoto {
  a: string;
  b: string;
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
  rating: number;
  reviewsCount: number;
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

const DEFAULT_PHOTOS: PropertyPhoto[] = [
  { a: '#e9e3f5', b: '#f1ecfa', label: 'living room — wide shot' },
  { a: '#e3ecf2', b: '#edf3f7', label: 'kitchen' },
  { a: '#f0e8e2', b: '#f7f1ec', label: 'bedroom' },
  { a: '#e6eee8', b: '#f0f5f1', label: 'bathroom' },
  { a: '#ece4f0', b: '#f4eef7', label: 'courtyard' },
  { a: '#e3e8f2', b: '#eef1f7', label: 'second bedroom' },
  { a: '#f2ece3', b: '#f7f3ec', label: 'hallway' },
  { a: '#e8e3f0', b: '#f2eef7', label: 'building facade' },
];

const DEFAULT_AMENITIES: PropertyAmenity[] = [
  { label: 'High-speed Wi-Fi', icon: ICON_PATHS.wifi },
  { label: 'Fully furnished', icon: ICON_PATHS.furnished },
  { label: 'Renovated kitchen', icon: ICON_PATHS.kitchen },
  { label: 'Washing machine', icon: ICON_PATHS.washer },
  { label: 'Central heating', icon: ICON_PATHS.heating },
  { label: 'Lift access', icon: ICON_PATHS.floor },
  { label: 'Balcony', icon: ICON_PATHS.balcony },
  { label: 'Bike storage', icon: ICON_PATHS.bike },
];

const DEFAULT_NEARBY: NearbyTransit[] = [
  { label: 'Technical University of Munich', dist: '12 min', icon: ICON_PATHS.uni },
  { label: 'U-Bahn Station', dist: '6 min walk', icon: ICON_PATHS.transit },
  { label: 'City Park', dist: '4 min walk', icon: ICON_PATHS.park },
];

export const PROPERTIES: Property[] = [
  {
    id: 'munich-1',
    title: 'One bedroom free in Munich',
    address: 'Karl-Marx-Ring 90, Munich',
    city: 'Munich',
    area: 35,
    beds: '1 bed',
    price: 500,
    badge: 'CASA',
    type: '1-bedroom apartment',
    avail: 'From 1 Jul',
    now: false,
    incl: false,
    featured: true,
    lat: 48.118,
    lng: 11.540,
    description: 'A cozy, fully-furnished one-bedroom apartment on Karl-Marx-Ring in Munich. Perfect for a single student looking for a comfortable space close to public transport. The apartment features high-speed internet, a small private kitchen, and laundry facilities on site.',
    coldRent: 400,
    utilities: 100,
    deposit: 800,
    serviceFee: 60,
    bathrooms: '1 bath',
    floor: '2nd floor',
    photos: DEFAULT_PHOTOS,
    amenities: DEFAULT_AMENITIES,
    nearby: DEFAULT_NEARBY,
    hostName: 'Casa Munich East',
    hostType: 'Casa Verified',
    hostReplies: 'Replies within 2 hours',
    hostListings: '45 listings',
    rating: 4.65,
    reviewsCount: 14,
  },
  {
    id: 'munich-2',
    title: 'Studio near TU Munich',
    address: 'Arcisstr. 55, Maxvorstadt, Munich',
    city: 'Munich',
    area: 28,
    beds: '1 bed',
    price: 950,
    badge: 'CASA',
    type: 'Studio',
    avail: 'From 1 Jul',
    now: false,
    incl: false,
    featured: true,
    lat: 48.148,
    lng: 11.568,
    description: 'Modern studio apartment located directly opposite the Technical University of Munich (TUM) main campus. This high-end studio has smart space-saving furniture, a private study corner, high-speed fiber internet, and a sleek contemporary bathroom. Ideal for academic focused students.',
    coldRent: 800,
    utilities: 150,
    deposit: 1600,
    serviceFee: 85,
    bathrooms: '1 bath',
    floor: '1st floor',
    photos: DEFAULT_PHOTOS,
    amenities: DEFAULT_AMENITIES,
    nearby: [
      { label: 'TU Munich (TUM)', dist: '1 min walk', icon: ICON_PATHS.uni },
      { label: 'U-Bahn Theresienstraße', dist: '4 min walk', icon: ICON_PATHS.transit },
      { label: 'Pinakotheken Museums', dist: '5 min walk', icon: ICON_PATHS.park },
    ],
    hostName: 'Maxvorstadt Student Living',
    hostType: 'Casa Verified',
    hostReplies: 'Replies within 15 mins',
    hostListings: '12 listings',
    rating: 4.91,
    reviewsCount: 22,
  },
  {
    id: 'munich-3',
    title: '3-Room Apartment – Schwabing',
    address: 'Leopoldstr. 112, Schwabing, Munich',
    city: 'Munich',
    area: 85,
    beds: '3 bed',
    price: 1800,
    badge: 'CASA',
    type: '2+ bedrooms',
    avail: 'Available now',
    now: true,
    incl: true,
    featured: false,
    lat: 48.162,
    lng: 11.581,
    description: 'Bright, fully furnished 3-room apartment in the heart of Schwabing — a 6-minute walk to the U-Bahn and 12 minutes to LMU\'s main campus. The flat sits on the third floor of a quiet pre-war building with a renovated kitchen, a spacious living room facing the courtyard, and two double bedrooms perfect for sharing. Rent is all-inclusive: heating, water, electricity, and high-speed internet are covered.',
    coldRent: 1500,
    utilities: 300,
    deposit: 3000,
    serviceFee: 90,
    bathrooms: '1 bath',
    floor: '3rd floor',
    photos: DEFAULT_PHOTOS,
    amenities: DEFAULT_AMENITIES,
    nearby: [
      { label: 'LMU Munich', dist: '12 min', icon: ICON_PATHS.uni },
      { label: 'U-Bahn Giselastr.', dist: '6 min walk', icon: ICON_PATHS.transit },
      { label: 'Englischer Garten', dist: '4 min walk', icon: ICON_PATHS.park },
    ],
    hostName: 'Casa Schwabing Group',
    hostType: 'Casa Verified',
    hostReplies: 'Replies within an hour',
    hostListings: '240+ listings',
    rating: 4.86,
    reviewsCount: 32,
  },
  {
    id: 'munich-4',
    title: 'Private Room – Maxvorstadt',
    address: 'Türkenstr. 23, Maxvorstadt, Munich',
    city: 'Munich',
    area: 20,
    beds: '1 bed',
    price: 720,
    badge: 'CASA',
    type: 'Shared flat (WG)',
    avail: 'Available now',
    now: true,
    incl: true,
    featured: false,
    lat: 48.151,
    lng: 11.573,
    description: 'Spacious private room in a friendly 3-person student shared flat (WG) in the lively Maxvorstadt district. The room is 20 sqm, filled with natural light, and comes fully furnished. You will share a modern fully equipped kitchen, a cozy dining space, and a clean bathroom with two other LMU students.',
    coldRent: 600,
    utilities: 120,
    deposit: 1200,
    serviceFee: 70,
    bathrooms: '1 shared bath',
    floor: '4th floor (no lift)',
    photos: DEFAULT_PHOTOS,
    amenities: DEFAULT_AMENITIES,
    nearby: [
      { label: 'LMU Munich', dist: '5 min walk', icon: ICON_PATHS.uni },
      { label: 'U-Bahn Universität', dist: '3 min walk', icon: ICON_PATHS.transit },
      { label: 'Local Cafes & Bars', dist: '1 min walk', icon: ICON_PATHS.park },
    ],
    hostName: 'WG Living Munich',
    hostType: 'Casa Verified',
    hostReplies: 'Replies within 3 hours',
    hostListings: '4 listings',
    rating: 4.78,
    reviewsCount: 9,
  },
  {
    id: 'munich-5',
    title: 'Apartment – Munich Neuhausen',
    address: 'Nymphenburger Str. 8, Neuhausen',
    city: 'Munich',
    area: 52,
    beds: '2 bed',
    price: 1350,
    badge: 'CASA',
    type: '1-bedroom apartment',
    avail: 'From 15 Jul',
    now: false,
    incl: false,
    featured: false,
    lat: 48.149,
    lng: 11.530,
    description: 'Charming 1-bedroom apartment in the stylish Neuhausen district. Features a double bedroom, separate living room with dining area, fully equipped kitchen with dishwasher, and bathroom with washing machine. Great connection to the city center and universities.',
    coldRent: 1150,
    utilities: 200,
    deposit: 2300,
    serviceFee: 90,
    bathrooms: '1 bath',
    floor: 'Ground floor',
    photos: DEFAULT_PHOTOS,
    amenities: DEFAULT_AMENITIES,
    nearby: [
      { label: 'Munich Central Station', dist: '10 min tram', icon: ICON_PATHS.transit },
      { label: 'Nymphenburg Canal', dist: '5 min walk', icon: ICON_PATHS.park },
      { label: 'HM Munich University', dist: '8 min bike', icon: ICON_PATHS.uni },
    ],
    hostName: 'Casa West Properties',
    hostType: 'Casa Verified',
    hostReplies: 'Replies within an hour',
    hostListings: '80 listings',
    rating: 4.70,
    reviewsCount: 19,
  },
  {
    id: 'munich-6',
    title: 'Bright Studio – Sendling',
    address: 'Plinganserstr. 40, Sendling, Munich',
    city: 'Munich',
    area: 31,
    beds: '1 bed',
    price: 880,
    badge: 'PARTNER',
    type: 'Studio',
    avail: 'Available now',
    now: true,
    incl: true,
    featured: false,
    lat: 48.116,
    lng: 11.551,
    description: 'A beautifully bright, self-contained studio apartment in Sendling. Fully furnished with high-end fixtures, private bathroom, and fully integrated kitchenette. Shared features in the building include a fitness room, bike cellar, and a rooftop terrace with views of the Alps.',
    coldRent: 730,
    utilities: 150,
    deposit: 1460,
    serviceFee: 80,
    bathrooms: '1 bath',
    floor: '5th floor (with lift)',
    photos: DEFAULT_PHOTOS,
    amenities: DEFAULT_AMENITIES,
    nearby: [
      { label: 'S-Bahn Harras', dist: '4 min walk', icon: ICON_PATHS.transit },
      { label: 'Sendlinger Park', dist: '8 min walk', icon: ICON_PATHS.park },
      { label: 'LMU Medical Campus', dist: '15 min bus', icon: ICON_PATHS.uni },
    ],
    hostName: 'Neon Student Housing',
    hostType: 'Partner Verified',
    hostReplies: 'Replies within 2 hours',
    hostListings: '110 listings',
    rating: 4.52,
    reviewsCount: 41,
  },
  {
    id: 'munich-7',
    title: 'Shared flat – Haidhausen',
    address: 'Wörthstr. 12, Haidhausen, Munich',
    city: 'Munich',
    area: 24,
    beds: '1 bed',
    price: 640,
    badge: 'CASA',
    type: 'Shared flat (WG)',
    avail: 'From 1 Aug',
    now: false,
    incl: false,
    featured: false,
    lat: 48.130,
    lng: 11.600,
    description: 'Rent a private bedroom in a premium 2-room shared flat located in one of Munich\'s most sought-after neighborhoods, Haidhausen. The flat features high ceilings, parquet flooring, shared high-spec kitchen, dishwasher, and washing machine. You will be sharing with one postgrad student.',
    coldRent: 540,
    utilities: 100,
    deposit: 1080,
    serviceFee: 70,
    bathrooms: '1 bath',
    floor: '2nd floor',
    photos: DEFAULT_PHOTOS,
    amenities: DEFAULT_AMENITIES,
    nearby: [
      { label: 'Ostbahnhof Station', dist: '5 min walk', icon: ICON_PATHS.transit },
      { label: 'TU Munich East Campus', dist: '8 min bike', icon: ICON_PATHS.uni },
      { label: 'Isar River Banks', dist: '8 min walk', icon: ICON_PATHS.park },
    ],
    hostName: 'Casa East Properties',
    hostType: 'Casa Verified',
    hostReplies: 'Replies within an hour',
    hostListings: '80 listings',
    rating: 4.80,
    reviewsCount: 15,
  },
  {
    id: 'munich-8',
    title: '4-Room family flat – Bogenhausen',
    address: 'Ismaninger Str. 90, Bogenhausen',
    city: 'Munich',
    area: 110,
    beds: '4 bed',
    price: 2400,
    badge: 'PARTNER',
    type: '2+ bedrooms',
    avail: 'Available now',
    now: true,
    incl: true,
    featured: true,
    lat: 48.147,
    lng: 11.615,
    description: 'Extremely spacious 4-room apartment ideal for groups of students or families wishing to live in premium Bogenhausen. Contains 3 bedrooms, a large living salon, high-end kitchen, guest toilet, and main bathroom. Very close to nature and central Munich.',
    coldRent: 2000,
    utilities: 400,
    deposit: 4000,
    serviceFee: 100,
    bathrooms: '1.5 baths',
    floor: '1st floor (with lift)',
    photos: DEFAULT_PHOTOS,
    amenities: DEFAULT_AMENITIES,
    nearby: [
      { label: 'U-Bahn Böhmerwaldplatz', dist: '3 min walk', icon: ICON_PATHS.transit },
      { label: 'Isar River / English Garden', dist: '10 min walk', icon: ICON_PATHS.park },
      { label: 'TUM Main Campus', dist: '14 min tram', icon: ICON_PATHS.uni },
    ],
    hostName: 'Isar Rentals Group',
    hostType: 'Partner Verified',
    hostReplies: 'Replies within 4 hours',
    hostListings: '15 listings',
    rating: 4.67,
    reviewsCount: 8,
  },
];
