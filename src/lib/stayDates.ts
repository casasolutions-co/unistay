// Move-in/move-out defaults for a booking request. Dates are ISO yyyy-mm-dd strings.
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addMonths(iso: string, months: number) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/**
 * Earliest possible move-in is the later of today and the listing's availability.
 * Dates the user already chose in search (`wanted`) win when they're valid; otherwise
 * move-out defaults to the listing's minimum stay (or 6 months).
 */
export function defaultStay(
  availFrom: string | null | undefined,
  minMonths: number | null | undefined,
  wanted: { moveIn?: string | null; moveOut?: string | null } = {},
) {
  const today = todayIso();
  const earliest = availFrom && ISO.test(availFrom) && availFrom > today ? availFrom : today;
  const moveIn = wanted.moveIn && ISO.test(wanted.moveIn) && wanted.moveIn >= earliest ? wanted.moveIn : earliest;
  const moveOut = wanted.moveOut && ISO.test(wanted.moveOut) && wanted.moveOut > moveIn
    ? wanted.moveOut
    : addMonths(moveIn, minMonths && minMonths > 0 ? minMonths : 6);
  return { earliest, moveIn, moveOut };
}

/** Server-side check for a booking request. Returns an error message or null. */
export function stayError(moveIn: unknown, moveOut: unknown): string | null {
  if (typeof moveIn !== 'string' || !ISO.test(moveIn) || isNaN(Date.parse(moveIn))) return 'Pick a move-in date.';
  if (typeof moveOut !== 'string' || !ISO.test(moveOut) || isNaN(Date.parse(moveOut))) return 'Pick a move-out date.';
  if (moveIn < todayIso()) return 'Move-in date is in the past.';
  if (moveOut <= moveIn) return 'Move-out must be after move-in.';
  return null;
}
