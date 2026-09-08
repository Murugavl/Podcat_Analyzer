import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  
  if (diffSecs < 10) return 'Just now';
  
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

const LANGUAGE_MAP: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  ar: 'Arabic',
  unknown: 'Unknown'
};

export function formatLanguage(code: string): string {
  if (!code) return 'Unknown';
  const clean = code.toLowerCase().trim();
  return LANGUAGE_MAP[clean] || clean.toUpperCase();
}

export function formatPercent(num: number): string {
  // If backend returns score directly between 0 and 1, multiply by 100.
  // In app.py, they had `round(sentiment_result['score'] * 100, 2)`.
  // So if it's already > 1, we don't multiply, else we do.
  const val = num > 1 ? num : num * 100;
  return `${val.toFixed(1)}%`;
}
