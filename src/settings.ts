import { reactive, computed, watch } from 'vue'
import type { ScaleMode, Tuning, KeySignature } from './types'
import {
  ALL_KEYS, FLAT_KEYS, FLAT_NOTE_NAMES, SHARP_NOTE_NAMES,
  SCALE_INTERVALS, TUNINGS, SCALE_DEGREE_LABELS,
} from './constants'

// ── localStorage helpers ──────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (raw === null) return fallback
  try { return JSON.parse(raw) as T } catch { return fallback }
}

function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

// ── Singleton reactive state ──────────────────────────────────────────────────
// (module-level so all useSettings() calls share the same object)

const state = reactive({
  selectedKey:        load<string>('selectedKey', 'C'),
  selectedScaleMode:  load<ScaleMode>('selectedScaleMode', 'maj'),
  strings:            load<number>('strings', 6),
  selectedTuningId:   load<string>('selectedTuningId', 'standard'),
  fretCount:          load<number>('fretCount', 22),
  hiddenStrings:      load<number[]>('hiddenStrings', []),
  hiddenTriadDegrees: load<number[]>('hiddenTriadDegrees', []),
})

// Persist every change automatically
watch(
  () => ({ ...state }),
  (s) => {
    save('selectedKey', s.selectedKey)
    save('selectedScaleMode', s.selectedScaleMode)
    save('strings', s.strings)
    save('selectedTuningId', s.selectedTuningId)
    save('fretCount', s.fretCount)
    save('hiddenStrings', s.hiddenStrings)
    save('hiddenTriadDegrees', s.hiddenTriadDegrees)
  },
  { deep: true }
)

// ── Composable ────────────────────────────────────────────────────────────────

export function useSettings() {
  const keySignature = computed<KeySignature>(() => {
    const root = ALL_KEYS.indexOf(state.selectedKey)
    const intervals = SCALE_INTERVALS[state.selectedScaleMode]
    return {
      root,
      scale: intervals.map(i => (i + root) % 12),
    }
  })

  const tuning = computed<Tuning>(() =>
    TUNINGS.find(t => t.id === state.selectedTuningId) ?? TUNINGS[0]!
  )

  const hiddenStringsSet = computed(() => new Set(state.hiddenStrings))
  const hiddenDegreesSet = computed(() => new Set(state.hiddenTriadDegrees))

  const scaleDegreeLabels = computed(() => SCALE_DEGREE_LABELS[state.selectedScaleMode])

  const noteNamesForKey = computed(() =>
    FLAT_KEYS.includes(state.selectedKey) ? FLAT_NOTE_NAMES : SHARP_NOTE_NAMES
  )

  function toggleString(index: number) {
    const s = new Set(state.hiddenStrings)
    s.has(index) ? s.delete(index) : s.add(index)
    state.hiddenStrings = [...s]
  }

  function toggleDegree(degree: number) {
    const s = new Set(state.hiddenTriadDegrees)
    s.has(degree) ? s.delete(degree) : s.add(degree)
    state.hiddenTriadDegrees = [...s]
  }

  return {
    state,
    keySignature,
    tuning,
    hiddenStringsSet,
    hiddenDegreesSet,
    scaleDegreeLabels,
    noteNamesForKey,
    toggleString,
    toggleDegree,
    ALL_KEYS,
    TUNINGS,
  }
}
