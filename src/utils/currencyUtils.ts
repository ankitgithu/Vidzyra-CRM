/**
 * Currency formatting utilities for Indian Rupee (INR).
 * Follows the Indian numbering system (lakhs, crores).
 * Examples:
 * - ₹500
 * - ₹1,000
 * - ₹10,000
 * - ₹1,25,000
 * - ₹10,00,000
 * Avoids unnecessary decimals (e.g. ₹500 instead of ₹500.00),
 * while supporting up to 2 decimal places when cents/paise are present (₹1,500.50).
 */
export function formatINR(val: number): string {
  const num = Number(val) || 0;
  const isNegative = num < 0;
  const abs = Math.abs(num);

  const hasDecimals = abs % 1 !== 0;
  const formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });

  return `${isNegative ? '-' : ''}₹${formatted}`;
}
