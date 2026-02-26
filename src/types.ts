export interface NoteData {
  string: number
  fret: number
  pitchClass: number
  triadColors: string[]      // CSS color strings ('transparent' or 'rgb(...)' )
  triadLabels: (number | null)[]
  midiNum: number
  scaleDegree: number
  triadDegrees: (number | null)[]
}

export interface Tuning {
  id: string
  openStrings: number[]   // MIDI numbers from string 0 → stringCount-1
  name: string
}

export type ScaleMode = 'maj' | 'min' | 'hMin'

export interface KeySignature {
  root: number
  scale: number[]   // 7 pitch classes (0–11)
}
