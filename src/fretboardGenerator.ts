// Mirrors FretboardGenerator.swift

import type { NoteData, KeySignature, Tuning } from './types'
import { TRIAD_COLORS } from './constants'

/**
 * Returns the slice position order for a given string index.
 * This rotates the root/3rd/5th assignment across strings so adjacent
 * strings show different voicing orientations.
 */
function triadSlicePositions(stringIndex: number): [number, number, number] {
  switch (stringIndex) {
    case 0: case 3: return [0, 1, 2]  // root→top-left, 3rd→top-right, 5th→bottom
    case 2: case 5: return [1, 2, 0]  // 3rd→top-left, 5th→top-right, root→bottom
    case 1: case 4: return [2, 0, 1]  // 5th→top-left, root→top-right, 3rd→bottom
    default: return [0, 1, 2]
  }
}

const TRIAD_ROLE_LABELS: [number, number, number] = [1, 3, 5]

/**
 * Generates a map of "stringIndex-fret" → NoteData for every in-scale note
 * on the fretboard.
 */
export function generateNoteMap(
  key: KeySignature,
  tuning: Tuning,
  fretCount: number
): Map<string, NoteData> {
  const map = new Map<string, NoteData>()

  // Build triads for each of the 7 scale degrees
  // triads[degree] = [rootPC, thirdPC, fifthPC]
  const triads: [number, number, number][] = key.scale.map((rootPC, degree) => [
    rootPC,
    key.scale[(degree + 2) % 7]!,
    key.scale[(degree + 4) % 7]!,
  ])

  for (let si = 0; si < tuning.openStrings.length; si++) {
    const openPitch = tuning.openStrings[si]!

    for (let fret = 0; fret <= fretCount; fret++) {
      const midiNum = openPitch + fret
      const pc = midiNum % 12

      const scaleDegreeIndex = key.scale.indexOf(pc)
      if (scaleDegreeIndex === -1) continue  // not in scale

      const scaleDegree = scaleDegreeIndex + 1

      // Default slot arrays (indexed by triad role 0=root, 1=3rd, 2=5th)
      const triadColors: string[] = ['transparent', 'transparent', 'transparent']
      const triadLabels: (number | null)[] = [null, null, null]
      const triadDegrees: (number | null)[] = [null, null, null]

      // Fill slots: for each scale degree's triad, check if this pc is in it
      for (let chordIndex = 0; chordIndex < triads.length; chordIndex++) {
        const triad = triads[chordIndex]!
        for (let position = 0; position < 3; position++) {
          if (triad[position] === pc) {
            triadColors[position] = TRIAD_COLORS[chordIndex]!
            triadLabels[position] = TRIAD_ROLE_LABELS[position]!
            triadDegrees[position] = chordIndex + 1
          }
        }
      }

      // Reorder slots according to string-specific visual rotation
      const positions = triadSlicePositions(si)
      const reorderedColors: string[] = ['transparent', 'transparent', 'transparent']
      const reorderedLabels: (number | null)[] = [null, null, null]
      const reorderedDegrees: (number | null)[] = [null, null, null]

      for (let i = 0; i < 3; i++) {
        const visualIndex = positions[i]!
        reorderedColors[visualIndex] = triadColors[i]!
        reorderedLabels[visualIndex] = triadLabels[i]!
        reorderedDegrees[visualIndex] = triadDegrees[i]!
      }

      map.set(`${si}-${fret}`, {
        string: si,
        fret,
        pitchClass: pc,
        triadColors: reorderedColors,
        triadLabels: reorderedLabels,
        midiNum,
        scaleDegree,
        triadDegrees: reorderedDegrees,
      })
    }
  }

  return map
}

/** Returns a copy of a NoteData with slices belonging to hidden degrees cleared. */
export function filterNote(note: NoteData, hiddenDegrees: Set<number>): NoteData {
  return {
    ...note,
    triadColors: note.triadDegrees.map((deg, i) =>
      deg !== null && !hiddenDegrees.has(deg) ? (note.triadColors[i] ?? 'transparent') : 'transparent'
    ),
    triadLabels: note.triadDegrees.map((deg, i) =>
      deg !== null && !hiddenDegrees.has(deg) ? (note.triadLabels[i] ?? null) : null
    ),
    triadDegrees: note.triadDegrees.map(deg =>
      deg !== null && !hiddenDegrees.has(deg) ? deg : null
    ),
  }
}
