/** The key of the marker that goes above the pane's top once the last row of content has reached the body's last row. */
export const END_MARKER = 'scroll:end';

/** How many rows below the end marker each further marker sits: one goes above the pane's top once the view is that many rows past its end. */
export const PAST_END_STEPS = [1, 2, 4, 8, 16, 32, 64] as const;

export const pastEndMarker = (rows: number) => `scroll:past:${rows}`;

/** `rowsPast` is the largest step the view is known to be past its end by, not the distance: 0 at or before the end. */
export type EndReading = { isAtEnd: boolean; rowsPast: number };

/** Null where the end marker's answer is unknown; a later marker's unknown answer ends the count. */
export async function readEnd(
  isDrawn: (key: string) => Promise<boolean | null>,
): Promise<EndReading | null> {
  const isEndDrawn = await isDrawn(END_MARKER);
  if (isEndDrawn === null) return null;
  if (isEndDrawn) return { isAtEnd: false, rowsPast: 0 };
  let rowsPast = 0;
  for (const rows of PAST_END_STEPS) {
    if ((await isDrawn(pastEndMarker(rows))) !== false) break;
    rowsPast = rows;
  }
  return { isAtEnd: true, rowsPast };
}
