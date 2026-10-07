import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSignedAmountColorClass(
  value: number,
  variant: 'positive' | 'negative',
) {
  return value >= 0 === (variant === 'positive')
    ? 'text-green-600'
    : 'text-red-600';
}
