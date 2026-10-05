/**
 * Formats an amount for display only. With a currency code the amount uses that currency's own
 * decimals (JPY has none); without one it is a plain number with two decimals. Rounding happens
 * here, never in the calculation, so intermediate values keep full precision.
 */
export function formatMoney(value: number, currency: string): string {
  if (currency === '') {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return value.toLocaleString('en-US', { style: 'currency', currency });
}
