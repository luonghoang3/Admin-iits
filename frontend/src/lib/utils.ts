import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency (VND or USD)
 * @param amount - The amount to format
 * @param currency - The currency code ('VND' or 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | null | undefined, currency: string = 'VND'): string {
  if (amount === null || amount === undefined || amount === 0) return '';

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency === 'VND' ? 'VND' : 'USD',
    minimumFractionDigits: currency === 'VND' ? 0 : 2,
    maximumFractionDigits: currency === 'VND' ? 0 : 2
  }).format(amount);
}
