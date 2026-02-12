/**
 * Calculate pro-rata amount in cents for a partial period.
 * Uses Math.floor for rounding DOWN (NFR18 — truncation per French rental law).
 * Multiplication BEFORE division to preserve precision.
 */
export function calculateProRataAmountCents(
  amountCents: number,
  daysInPeriod: number,
  totalDaysInMonth: number,
): number {
  if (totalDaysInMonth === 0 || daysInPeriod < 0 || amountCents < 0) return 0;
  return Math.floor((daysInPeriod * amountCents) / totalDaysInMonth);
}

/**
 * Return the number of days in a given month.
 * @param year - Full year (e.g. 2026)
 * @param month - 1-indexed month (January=1, February=2, etc.)
 */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Compute the number of days a lease occupies within a given month.
 * Both start and end dates are inclusive.
 * @param leaseStartDate - Lease start date
 * @param leaseEndDate - Lease end date (null = no termination, full month from start)
 * @param year - Full year
 * @param month - 1-indexed month
 */
export function calculateOccupiedDays(
  leaseStartDate: Date,
  leaseEndDate: Date | null,
  year: number,
  month: number,
): number {
  // Use UTC throughout to avoid DST transitions affecting comparisons and day count
  const monthStartUtc = Date.UTC(year, month - 1, 1);
  const monthEndUtc = Date.UTC(year, month, 0); // last day of month

  const startUtc = Date.UTC(leaseStartDate.getFullYear(), leaseStartDate.getMonth(), leaseStartDate.getDate());
  const endUtc = leaseEndDate
    ? Date.UTC(leaseEndDate.getFullYear(), leaseEndDate.getMonth(), leaseEndDate.getDate())
    : null;

  const effectiveStartUtc = startUtc > monthStartUtc ? startUtc : monthStartUtc;
  const effectiveEndUtc = endUtc !== null && endUtc < monthEndUtc ? endUtc : monthEndUtc;

  if (effectiveStartUtc > effectiveEndUtc) return 0;

  return Math.round((effectiveEndUtc - effectiveStartUtc) / (1000 * 60 * 60 * 24)) + 1; // inclusive
}
