/**
 * Formats a Date object to a YYYY-MM-DD string using local time.
 * This avoids the UTC shift issues caused by .toISOString()
 */
export const toYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};