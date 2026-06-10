
export type CurrencyCode = 'VND' | 'USD' | 'EUR' | 'GBP';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rate: number; // Rate relative to VND
  position: 'prefix' | 'suffix';
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  VND: { code: 'VND', symbol: '₫', rate: 1, position: 'suffix' },
  USD: { code: 'USD', symbol: '$', rate: 0.000040, position: 'prefix' },
  EUR: { code: 'EUR', symbol: '€', rate: 0.000037, position: 'prefix' },
  GBP: { code: 'GBP', symbol: '£', rate: 0.000031, position: 'prefix' },
};

export function getCurrency(): CurrencyConfig {
  if (typeof window === 'undefined') return CURRENCIES.VND;
  const saved = localStorage.getItem('seva_currency') as CurrencyCode;
  return CURRENCIES[saved] || CURRENCIES.VND;
}

export function formatCurrency(amount: number, config?: CurrencyConfig): string {
  const currency = config || getCurrency();
  const converted = amount * currency.rate;
  
  const formatted = new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: currency.code === 'VND' ? 0 : 2,
    maximumFractionDigits: currency.code === 'VND' ? 0 : 2,
  }).format(converted);

  return currency.position === 'prefix' 
    ? `${currency.symbol}${formatted}` 
    : `${formatted}${currency.symbol}`;
}

export function setCurrency(code: CurrencyCode) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('seva_currency', code);
    window.dispatchEvent(new CustomEvent('seva-currency-changed', { detail: { code } }));
  }
}
