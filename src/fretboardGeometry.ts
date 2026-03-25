// Mirrors FretboardGeometry.swift

export const NOTE_SIZE = 32
export const H_SPACING = 12
export const V_SPACING = 20
export const H_PADDING = 10
export const V_PADDING_TOP = 30
export const V_PADDING_BOTTOM = 20
export const FRET_MARKER_WIDTH = 20   // left column for fret marker dots

export const STEP_X = NOTE_SIZE + H_SPACING   // 44
export const STEP_Y = NOTE_SIZE + V_SPACING   // 52

// ── Dimensions ────────────────────────────────────────────────────────────────

export function svgWidth(stringCount: number): number {
  return FRET_MARKER_WIDTH + (stringCount - 1) * STEP_X + NOTE_SIZE + H_PADDING * 2
}

export function svgHeight(fretCount: number): number {
  // Derived directly from fretLineY: last wire is at V_PADDING_TOP + NOTE_SIZE/2 + fretCount*STEP_Y,
  // then add V_PADDING_BOTTOM below it.  The old formula used (fretCount+1)*STEP_Y which
  // over-allocated by STEP_Y - NOTE_SIZE/2 = 36 px at the bottom.
  return V_PADDING_TOP + NOTE_SIZE / 2 + fretCount * STEP_Y + V_PADDING_BOTTOM
}

// ── Position helpers ──────────────────────────────────────────────────────────

/** Horizontal center of a string column */
export function noteX(stringIndex: number): number {
  return FRET_MARKER_WIDTH + H_PADDING + NOTE_SIZE / 2 + stringIndex * STEP_X
}

/** Vertical center of a note between fret wires.
 *  fret 0 = open string (above the nut line)
 *  fret 1 = between nut and 1st fret, etc. */
export function noteY(fret: number): number {
  return V_PADDING_TOP + NOTE_SIZE / 2 + (fret - 0.5) * STEP_Y
}

/** Y coordinate of a fret wire (horizontal line) */
export function fretLineY(fret: number): number {
  return V_PADDING_TOP + NOTE_SIZE / 2 + fret * STEP_Y
}

/** Left and right x extents of fret lines */
export function fretLineX1(): number { return FRET_MARKER_WIDTH + H_PADDING }
export function fretLineX2(stringCount: number): number {
  return FRET_MARKER_WIDTH + H_PADDING + (stringCount - 1) * STEP_X + NOTE_SIZE
}

/** Fret marker dot x (center of marker column) */
export const FRET_MARKER_X = FRET_MARKER_WIDTH / 2
