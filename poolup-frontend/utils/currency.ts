// Currency and internationalization utilities
export interface Currency {
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
  exchangeRate?: number; // Rate to USD
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2, exchangeRate: 1.0 },
  { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2, exchangeRate: 0.85 },
  { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2, exchangeRate: 0.73 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimalPlaces: 2, exchangeRate: 1.25 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimalPlaces: 2, exchangeRate: 1.35 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimalPlaces: 0, exchangeRate: 110.0 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimalPlaces: 2, exchangeRate: 0.92 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimalPlaces: 2, exchangeRate: 6.45 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimalPlaces: 2, exchangeRate: 74.5 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimalPlaces: 2, exchangeRate: 5.2 },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', decimalPlaces: 2, exchangeRate: 20.1 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimalPlaces: 0, exchangeRate: 1180.0 },
];

export const DEFAULT_CURRENCY = 'USD';

// Get user's preferred currency from storage or device locale
export const getUserCurrency = (): string => {
  // In a real app, this would check user preferences or device locale
  // For now, return USD as default
  return DEFAULT_CURRENCY;
};

// Format amount in the specified currency
export const formatCurrency = (
  amountCents: number, 
  currencyCode: string = getUserCurrency(),
  showSymbol: boolean = true
): string => {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  if (!currency) {
    console.warn(`Currency ${currencyCode} not supported, falling back to USD`);
    return formatCurrency(amountCents, 'USD', showSymbol);
  }

  const amount = amountCents / 100;
  const formattedAmount = currency.decimalPlaces === 0 
    ? Math.round(amount).toLocaleString()
    : amount.toFixed(currency.decimalPlaces);

  return showSymbol ? `${currency.symbol}${formattedAmount}` : formattedAmount;
};

// Convert between currencies
export const convertCurrency = (
  amountCents: number,
  fromCurrency: string,
  toCurrency: string
): number => {
  if (fromCurrency === toCurrency) return amountCents;

  const fromRate = SUPPORTED_CURRENCIES.find(c => c.code === fromCurrency)?.exchangeRate || 1;
  const toRate = SUPPORTED_CURRENCIES.find(c => c.code === toCurrency)?.exchangeRate || 1;

  // Convert to USD first, then to target currency
  const usdAmount = amountCents / fromRate;
  return Math.round(usdAmount * toRate);
};

// Parse currency input string to cents
export const parseCurrencyInput = (input: string, currencyCode: string = getUserCurrency()): number => {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  if (!currency) return 0;

  // Remove currency symbols and spaces
  const cleanInput = input.replace(/[^\d.,]/g, '');
  const amount = parseFloat(cleanInput.replace(',', '.'));
  
  if (isNaN(amount)) return 0;
  
  return Math.round(amount * 100);
};

// Get currency info
export const getCurrencyInfo = (currencyCode: string): Currency | null => {
  return SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || null;
};

// Detect user's locale-based currency preference
export const detectLocaleCurrency = (): string => {
  try {
    // This would use device locale in a real app
    const locale = 'en-US'; // Default for now
    
    const currencyMap: { [key: string]: string } = {
      'en-US': 'USD',
      'en-GB': 'GBP',
      'en-CA': 'CAD',
      'en-AU': 'AUD',
      'de-DE': 'EUR',
      'fr-FR': 'EUR',
      'es-ES': 'EUR',
      'it-IT': 'EUR',
      'ja-JP': 'JPY',
      'zh-CN': 'CNY',
      'hi-IN': 'INR',
      'pt-BR': 'BRL',
      'es-MX': 'MXN',
      'ko-KR': 'KRW',
    };

    return currencyMap[locale] || DEFAULT_CURRENCY;
  } catch (error) {
    console.warn('Failed to detect locale currency:', error);
    return DEFAULT_CURRENCY;
  }
};
