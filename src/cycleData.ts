// Diatonic chord orderings for each of the 6 Goodrick cycles.
// Keys are cycle numbers (2–7); values are 0-based diatonic chord indices (0=I … 6=VII).

export const CYCLE_SEQUENCES: Record<number, readonly number[]> = {
  2: [0, 1, 2, 3, 4, 5, 6],  // ascending 2nds:  I  II  III IV  V   VI  VII
  3: [0, 2, 4, 6, 1, 3, 5],  // ascending 3rds:  I  III V   VII II  IV  VI
  4: [0, 3, 6, 2, 5, 1, 4],  // ascending 4ths:  I  IV  VII III VI  II  V
  5: [0, 4, 1, 5, 2, 6, 3],  // ascending 5ths:  I  V   II  VI  III VII IV
  6: [0, 5, 3, 1, 6, 4, 2],  // ascending 6ths:  I  VI  IV  II  VII V   III
  7: [0, 6, 5, 4, 3, 2, 1],  // ascending 7ths:  I  VII VI  V   IV  III II
}

/**
 * Returns the three scale degrees (1–7) that form the diatonic triad
 * at 0-based diatonic index `d` (0=I, 1=II, … 6=VII).
 *   root  = (d % 7) + 1
 *   third = ((d + 2) % 7) + 1
 *   fifth = ((d + 4) % 7) + 1
 */
export function triadScaleDegrees(d: number): [number, number, number] {
  return [(d % 7) + 1, ((d + 2) % 7) + 1, ((d + 4) % 7) + 1]
}
