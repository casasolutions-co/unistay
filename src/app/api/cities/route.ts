import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

let cachedCities: { name: string }[] | null = null

export async function GET() {
  if (!cachedCities) {
    const filePath = path.join(process.cwd(), 'public', 'german-cities.json')
    const names: string[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    cachedCities = names.map(name => ({ name }))
  }
  return NextResponse.json(cachedCities)
}
