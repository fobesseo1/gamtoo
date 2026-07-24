export const DEFAULT_DATE_FORMAT = "yyyy/mm/dd";

/**
 * Formats a date using a literal token format string: "yyyy" (4-digit year),
 * "yy" (2-digit year), "mm", "dd". Any other characters (separators like
 * "/" or ".") are kept as-is. Omitting a year token entirely (e.g. "mm/dd")
 * simply leaves the year out.
 */
export function formatDate(date: Date, format: string = DEFAULT_DATE_FORMAT): string {
  const yyyy = String(date.getFullYear());
  const yy = yyyy.slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return format
    .replace(/yyyy/gi, yyyy)
    .replace(/yy/gi, yy)
    .replace(/mm/gi, mm)
    .replace(/dd/gi, dd);
}
