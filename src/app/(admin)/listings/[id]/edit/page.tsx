import { notFound } from 'next/navigation'
import { getListingForEdit } from '@/lib/data'
import CasaListingForm, { type ListingFormInitial } from '../../new/CasaListingForm'

const PTYPES = ['studio', 'apartment', 'room', 'house'] as const

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getListingForEdit(id)
  if (!data) notFound()
  const r = data.row
  const str = (k: string) => (r[k] == null ? '' : String(r[k]))
  const num = (k: string, d: number) => (r[k] == null ? d : Number(r[k]))

  // Stored as one string ("Musterstraße 12a"); the form has separate fields.
  const m = str('street').match(/^(.*?)\s+(\d+\s*[a-zA-Z]?(?:\s*[-/]\s*\d+\s*[a-zA-Z]?)?)$/)

  const initial: ListingFormInitial = {
    id,
    ptype: (PTYPES as readonly string[]).includes(str('ptype')) ? str('ptype') as ListingFormInitial['ptype'] : 'studio',
    title: str('title'),
    streetName: m ? m[1] : str('street'),
    houseNumber: m ? m[2] : '',
    city: str('city'), postcode: str('postcode'),
    bedrooms: num('bedrooms', 1), bathrooms: num('bathrooms', 1),
    roomSize: num('room_size_sqm', 15), aptSize: num('size_sqm', 50),
    amenities: Object.fromEntries(data.amenities.map(a => [a, true])),
    desc: str('description'), mates: str('mate_notes'), numMates: num('mate_count', 0),
    mateGender: str('mate_gender'), prefGender: str('pref_gender') || 'any',
    rent: str('cold_rent'), utilities: str('utilities'), deposit: str('deposit'), adminFee: str('admin_fee'),
    availFrom: str('avail_from'), availTo: str('avail_to'), openEnded: !!r.open_ended,
    minPeriod: str('min_period'), maxPeriod: str('max_period'),
    photoKeys: data.photoKeys,
  }
  return <CasaListingForm initial={initial} />
}
