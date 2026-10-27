/** Distinct, readable-on-paper colors for person chips. */
export const PALETTE = [
  "#B3402E", // clay red
  "#C06A1D", // burnt orange
  "#9A7B10", // ochre
  "#6B8E23", // olive green
  "#2E7D4F", // forest
  "#148F77", // teal
  "#1F7A8C", // petrol
  "#2E6DA4", // steel blue
  "#4A5FC1", // indigo
  "#7D4AC1", // violet
  "#A63FA0", // plum
  "#C2185B", // raspberry
  "#8D6E63", // taupe
  "#52796F", // sage
  "#5D6D7E", // slate
  "#A44A3F", // brick
] as const;

export function paletteColor(i: number): string {
  return PALETTE[((i % PALETTE.length) + PALETTE.length) % PALETTE.length];
}

/** Stable fallback for a person without a stored color. */
export function colorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return paletteColor(Math.abs(h));
}

/** Next auto color: the least-used palette entry among existing people. */
export function nextColor(used: (string | undefined)[]): string {
  const counts = PALETTE.map((c) => used.filter((u) => u === c).length);
  const min = Math.min(...counts);
  return PALETTE[counts.indexOf(min)];
}
