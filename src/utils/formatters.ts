import { UserPreferences } from '../types';

export const CURRENCIES: Record<UserPreferences['currency'], { symbol: string; label: string; locale: string }> = {
  INR: { symbol: '₹', label: 'Indian Rupee (₹)', locale: 'en-IN' },
  USD: { symbol: '$', label: 'US Dollar ($)', locale: 'en-US' },
  EUR: { symbol: '€', label: 'Euro (€)', locale: 'de-DE' },
  GBP: { symbol: '£', label: 'British Pound (£)', locale: 'en-GB' },
  AED: { symbol: 'AED', label: 'UAE Dirham (AED)', locale: 'en-AE' },
};

/**
 * Format currency with proper Indian / International number formatting
 * e.g. ₹1,25,000 or $125,000
 */
export function formatCurrency(
  amount: number,
  currencyCode: UserPreferences['currency'] = 'INR',
  includeSymbol: boolean = true
): string {
  const currencyInfo = CURRENCIES[currencyCode] || CURRENCIES.INR;
  const absAmount = Math.abs(amount);

  let formattedNumber: string;
  try {
    formattedNumber = new Intl.NumberFormat(currencyInfo.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(absAmount);
  } catch {
    formattedNumber = absAmount.toLocaleString();
  }

  if (!includeSymbol) return formattedNumber;

  if (currencyCode === 'AED') {
    return `${formattedNumber} ${currencyInfo.symbol}`;
  }
  return `${currencyInfo.symbol}${formattedNumber}`;
}

/**
 * Format date based on preference format
 */
export function formatDate(dateString?: string, format: UserPreferences['dateFormat'] = 'DD/MM/YYYY'): string {
  if (!dateString) return '—';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      if (format === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
      if (format === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
      return `${year}-${month}-${day}`;
    }

    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    
    // Nice friendly display like "Aug 28, 2026"
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Friendly relative or short date format for lists (e.g. "Aug 28" or "Today")
 */
export function formatShortDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const today = new Date();
    
    const isToday = 
      today.getFullYear() === d.getFullYear() &&
      today.getMonth() === d.getMonth() &&
      today.getDate() === d.getDate();

    if (isToday) return 'Today';

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = 
      yesterday.getFullYear() === d.getFullYear() &&
      yesterday.getMonth() === d.getMonth() &&
      yesterday.getDate() === d.getDate();

    if (isYesterday) return 'Yesterday';

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Returns consistent avatar color from name
 */
export function getAvatarColor(name: string): string {
  const colors = [
    'bg-emerald-600 text-white',
    'bg-indigo-600 text-white',
    'bg-blue-600 text-white',
    'bg-amber-600 text-white',
    'bg-rose-600 text-white',
    'bg-teal-600 text-white',
    'bg-purple-600 text-white',
    'bg-cyan-600 text-white',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Initials from full name
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
