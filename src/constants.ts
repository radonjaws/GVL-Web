import type { ScaleMode, Tuning } from './types'

// ── Scale intervals ───────────────────────────────────────────────────────────

export const SCALE_INTERVALS: Record<ScaleMode, number[]> = {
  maj:  [0, 2, 4, 5, 7, 9, 11],
  min:  [0, 2, 3, 5, 7, 8, 10],
  hMin: [0, 2, 3, 5, 7, 8, 11],
}

// ── Keys ──────────────────────────────────────────────────────────────────────

export const ALL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export const FLAT_KEYS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb']

export const SHARP_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export const FLAT_NOTE_NAMES  = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B']

// ── Triad colors (matches iOS) ────────────────────────────────────────────────

export const TRIAD_COLORS = [
  'rgb(237,28,36)',    // I   – red
  'rgb(132,30,94)',    // ii  – violet
  'rgb(25,62,108)',    // iii – indigo
  'rgb(67,192,192)',   // IV  – teal
  'rgb(0,148,68)',     // V   – green
  'rgb(249,172,45)',   // vi  – gold
  'rgb(155,141,102)',  // vii°– brown
]

// ── Built-in tunings ──────────────────────────────────────────────────────────

export const TUNINGS: Tuning[] = [
  { id: 'standard',   openStrings: [40, 45, 50, 55, 59, 64], name: 'Standard' },
  { id: 'allFourths', openStrings: [40, 45, 50, 55, 60, 65], name: 'All Fourths' },
  { id: 'dropD',      openStrings: [38, 45, 50, 55, 59, 64], name: 'Drop D' },
  { id: 'dadgad',     openStrings: [38, 45, 50, 55, 57, 62], name: 'DADGAD' },
]

// ── Scale degree labels ───────────────────────────────────────────────────────

export const SCALE_DEGREE_LABELS: Record<ScaleMode, string[]> = {
  maj:  ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  min:  ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
  hMin: ['i', 'ii°', 'III+', 'iv', 'V', 'VI', 'vii°'],
}

// ── Fret markers ──────────────────────────────────────────────────────────────

export const FRET_MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21]
export const DOUBLE_DOT_FRET = 12
