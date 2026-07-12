import { NextResponse } from 'next/server';
import { d1Query } from '@/lib/d1';

// GET /api/faqs — public, no auth. Returns published FAQs grouped by category,
// ordered by each row's admin-curated `position` within its category.
export async function GET() {
  const faqs = await d1Query<{
    id: string;
    category: string;
    question: string;
    answer: string;
  }>(
    `SELECT id, category, question, answer
     FROM faqs
     WHERE published = 1
     ORDER BY category, position`
  );

  return NextResponse.json({ faqs });
}
