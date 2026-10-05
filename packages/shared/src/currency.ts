/** Currencies the dynamic-data API supports (ISO 4217). Single list: the server validates against it
 *  and the web app can build pickers from it. Adding one is only safe if every provider lists it. */
export const CURRENCY_CODES = [
  'JPY',
  'BDT',
  'USD',
  'EUR',
  'GBP',
  'CNY',
  'KRW',
  'INR',
  'AUD',
  'CAD',
  'SGD',
  'THB',
  'VND',
  'PHP',
  'IDR',
  'MYR',
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export function isCurrencyCode(value: string): value is CurrencyCode {
  return (CURRENCY_CODES as readonly string[]).includes(value);
}

/** Largest amount the converter and `convert()` accept; one limit for the UI and the server. */
export const MAX_CURRENCY_AMOUNT = 1e12;

export interface CurrencyInfo {
  name: string;
  symbol: string;
}

/**
 * Display metadata for every supported currency, kept here so the picker never fetches it. No flags
 * on purpose: a currency can belong to several countries (EUR), and Windows does not render flag
 * emoji, so the ISO code is the neutral, always-correct identifier.
 */
export const CURRENCY_INFO: Record<CurrencyCode, CurrencyInfo> = {
  JPY: { name: 'Japanese Yen', symbol: '¥' },
  BDT: { name: 'Bangladeshi Taka', symbol: '৳' },
  USD: { name: 'US Dollar', symbol: '$' },
  EUR: { name: 'Euro', symbol: '€' },
  GBP: { name: 'British Pound', symbol: '£' },
  CNY: { name: 'Chinese Yuan', symbol: '¥' },
  KRW: { name: 'South Korean Won', symbol: '₩' },
  INR: { name: 'Indian Rupee', symbol: '₹' },
  AUD: { name: 'Australian Dollar', symbol: 'A$' },
  CAD: { name: 'Canadian Dollar', symbol: 'C$' },
  SGD: { name: 'Singapore Dollar', symbol: 'S$' },
  THB: { name: 'Thai Baht', symbol: '฿' },
  VND: { name: 'Vietnamese Dong', symbol: '₫' },
  PHP: { name: 'Philippine Peso', symbol: '₱' },
  IDR: { name: 'Indonesian Rupiah', symbol: 'Rp' },
  MYR: { name: 'Malaysian Ringgit', symbol: 'RM' },
};
