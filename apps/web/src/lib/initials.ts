/** Two letters for avatar fallbacks. Skips titles like "Coach" / "كوتش" / "كابتن". */
export function initials(name: string) {
  const words = name
    .split(/\s+/)
    .filter((w) => w && !/^(coach|كوتش|كابتن|captain)$/i.test(w));
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
