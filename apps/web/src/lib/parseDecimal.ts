/**
 * Parses a decimal number typed by a user. Returns `undefined` for blank, non-numeric or
 * non-finite input (`Infinity`, `NaN`) instead of throwing, so callers can turn it into a friendly
 * validation message. Shared by every tool that accepts a free-text number (yen amounts, GPA
 * credits, percentages, ...).
 */
export function parseDecimal(input: string): number | undefined {
  const trimmed = input.trim();
  if (trimmed === '') return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}
