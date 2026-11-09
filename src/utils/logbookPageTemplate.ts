/** Keep combined/irregular slots intact instead of losing times when splitting columns. */
export function splitLogbookTime(time: string | undefined): [string, string] {
  const value = (time || '').trim();
  const match = value.match(/^(\d{1,2}:\d{2})\s*[-–—→←➔]\s*(\d{1,2}:\d{2})$/);
  return match ? [match[1], match[2]] : [value, ''];
}
