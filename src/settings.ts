import { reactive, computed, watch } from 'vue'
import type { ScaleMode, Tuning, KeySignature } from './types'
import {
  ALL_KEYS, FLAT_KEYS, FLAT_NOTE_NAMES, SHARP_NOTE_NAMES,
  SCALE_INTERVALS, TUNINGS, SCALE_DEGREE_LABELS,
} from './constants'
import { CYCLE_SEQUENCES, triadScaleDegrees } from './cycleData'

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
  // Cycle mode
  cycleMode:          load<boolean>('cycleMode', false),
  cycleNumber:        load<number>('cycleNumber', 4),
  cycleStep:          load<number>('cycleStep', 0),
  cycleLookahead:     load<number>('cycleLookahead', 1),
  autoPlay:           load<boolean>('autoPlay', false),
  autoPlayBPM:        load<number>('autoPlayBPM', 60),
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
    save('cycleMode', s.cycleMode)
    save('cycleNumber', s.cycleNumber)
    save('cycleStep', s.cycleStep)
    save('cycleLookahead', s.cycleLookahead)
    save('autoPlay', s.autoPlay)
    save('autoPlayBPM', s.autoPlayBPM)
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

  // ── Cycle mode ───────────────────────────────────────────────────────────────

  /** Scale degrees (1–7) for the current chord in the active cycle step. */
  const activeCycleScaleDegrees = computed<Set<number>>(() => {
    if (!state.cycleMode) return new Set()
    const seq = CYCLE_SEQUENCES[state.cycleNumber]!
    const d = seq[state.cycleStep]!
    return new Set(triadScaleDegrees(d))
  })

  /** Scale degrees for the next chord (ghost level 1, 25% opacity). */
  const ghostCycleScaleDegrees1 = computed<Set<number>>(() => {
    if (!state.cycleMode) return new Set()
    const seq = CYCLE_SEQUENCES[state.cycleNumber]!
    const d = seq[(state.cycleStep + 1) % 7]!
    return new Set(triadScaleDegrees(d))
  })

  /** Scale degrees for the chord after next (ghost level 2, 12% opacity). */
  const ghostCycleScaleDegrees2 = computed<Set<number>>(() => {
    if (!state.cycleMode || state.cycleLookahead < 2) return new Set()
    const seq = CYCLE_SEQUENCES[state.cycleNumber]!
    const d = seq[(state.cycleStep + 2) % 7]!
    return new Set(triadScaleDegrees(d))
  })

  function advanceCycleStep() {
    state.cycleStep = (state.cycleStep + 1) % 7
  }

  function retreatCycleStep() {
    state.cycleStep = (state.cycleStep + 6) % 7   // +6 mod 7 = −1
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
    activeCycleScaleDegrees,
    ghostCycleScaleDegrees1,
    ghostCycleScaleDegrees2,
    advanceCycleStep,
    retreatCycleStep,
  }
}
