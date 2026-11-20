// "About me" profile that must be filled in before identity verification.
// Pure data + checks, safe to import from client and server.

export const OCCUPATIONS = [
  { value: 'student', title: 'Student', sub: 'Studying in Germany' },
  { value: 'professional', title: 'Professional', sub: 'Working or relocating' },
  { value: 'landlord', title: 'Landlord', sub: 'I rent out a place' },
] as const;
export type Occupation = (typeof OCCUPATIONS)[number]['value'];

export const TRAITS = [
  '🌅 Early bird', '🦉 Night owl', '🧹 Tidy', '🎉 Social', '🤫 Quiet', '🍳 Loves cooking',
  '🏋️ Fitness fan', '🎮 Gamer', '🎵 Music lover', '📚 Bookworm', '✈️ Traveller', '🐾 Pet lover',
  '🚭 Non-smoker', '🥗 Vegetarian', '🏠 Homebody', '💻 Works from home', '🎨 Creative', '🌱 Eco-minded',
];
export const TRAITS_MIN = 3;
export const TRAITS_MAX = 5;
export const ABOUT_MIN = 30;
export const ABOUT_MAX = 500;

export type AboutMe = { hasPhoto: boolean; occupation: string | null; traits: string[]; about: string };

// Labels of what's still missing, in form order. Empty = ready to verify.
export function aboutMeMissing(a: AboutMe): string[] {
  const missing: string[] = [];
  if (!a.hasPhoto) missing.push('photo');
  if (!OCCUPATIONS.some(o => o.value === a.occupation)) missing.push('what you do');
  if (a.traits.length < TRAITS_MIN || a.traits.length > TRAITS_MAX || a.traits.some(t => !TRAITS.includes(t))) {
    missing.push(`${TRAITS_MIN}–${TRAITS_MAX} things that describe you`);
  }
  const len = a.about.trim().length;
  if (len < ABOUT_MIN || len > ABOUT_MAX) missing.push(`about me (${ABOUT_MIN}–${ABOUT_MAX} characters)`);
  return missing;
}

export function parseTraits(json: string | null | undefined): string[] {
  try {
    const v = JSON.parse(json ?? '[]');
    return Array.isArray(v) ? v.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}
