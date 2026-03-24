<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useSettings } from './settings'
import { generateNoteMap, filterNote } from './fretboardGenerator'
import { TRIAD_COLORS } from './constants'
import { CYCLE_SEQUENCES } from './cycleData'
import {
  NOTE_SIZE, H_SPACING, H_PADDING, FRET_MARKER_WIDTH,
} from './fretboardGeometry'
import FretboardSVG from './components/FretboardSVG.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import CycleSelect from './components/CycleSelect.vue'
import type { NoteData } from './types'

const {
  state,
  keySignature,
  tuning,
  hiddenStringsSet,
  hiddenDegreesSet,
  scaleDegreeLabels,
  noteNamesForKey,
  toggleString,
  toggleDegree,
  advanceCycleStep,
  retreatCycleStep,
} = useSettings()

// ── Note map state ────────────────────────────────────────────────────────────

const rawNoteMap = ref<Map<string, NoteData>>(new Map())

function regenerate() {
  rawNoteMap.value = generateNoteMap(keySignature.value, tuning.value, state.fretCount)
}
regenerate()

watch([keySignature, tuning, () => state.fretCount], regenerate)

const filteredNoteMap = computed(() => {
  const hidden = hiddenDegreesSet.value
  const out = new Map<string, NoteData>()
  for (const [k, v] of rawNoteMap.value) {
    out.set(k, filterNote(v, hidden))
  }
  return out
})

// In cycle mode use rawNoteMap (cycle props own visibility); otherwise filteredNoteMap
const displayNoteMap = computed(() =>
  state.cycleMode ? rawNoteMap.value : filteredNoteMap.value
)

// ── Cycle chord label helpers ─────────────────────────────────────────────────

const currentDiatonicIdx = computed(() =>
  CYCLE_SEQUENCES[state.cycleNumber]![state.cycleStep]!
)
const nextDiatonicIdx = computed(() =>
  CYCLE_SEQUENCES[state.cycleNumber]![(state.cycleStep + 1) % 7]!
)

// Chord degrees (1–7) for each shown chord — passed to FretboardSVG for slice filtering
const activeChordDegree = computed(() =>
  state.cycleMode ? currentDiatonicIdx.value + 1 : undefined
)
const ghostChord1Degree = computed(() =>
  state.cycleMode ? nextDiatonicIdx.value + 1 : undefined
)
const ghostChord2Degree = computed(() => {
  if (!state.cycleMode || state.cycleLookahead < 2) return undefined
  return CYCLE_SEQUENCES[state.cycleNumber]![(state.cycleStep + 2) % 7]! + 1
})

// ── Auto-play timer ───────────────────────────────────────────────────────────

let autoTimer: ReturnType<typeof setInterval> | null = null

watch(
  [() => state.autoPlay, () => state.autoPlayBPM, () => state.cycleMode],
  () => {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null }
    if (state.cycleMode && state.autoPlay) {
      autoTimer = setInterval(advanceCycleStep, 4 * 60_000 / state.autoPlayBPM)
    }
  },
  { immediate: true }
)

onUnmounted(() => { if (autoTimer) clearInterval(autoTimer) })

// ── Menu ──────────────────────────────────────────────────────────────────────

const menuOpen = ref(false)

// ── String toggle positioning (aligns with SVG string columns) ────────────────
// Each button sits at the same x as noteX(si) in the SVG.
// The first button center is at FRET_MARKER_WIDTH + H_PADDING + NOTE_SIZE/2.

const togglePaddingLeft = computed(() => `${FRET_MARKER_WIDTH + H_PADDING}px`)
const toggleGap = computed(() => `${H_SPACING}px`)
const toggleSize = computed(() => `${NOTE_SIZE}px`)

// ── Degree toggle style ───────────────────────────────────────────────────────

function degreeCircleStyle(degreeIndex: number) {
  const isHidden = hiddenDegreesSet.value.has(degreeIndex + 1)
  const base = TRIAD_COLORS[degreeIndex] ?? 'rgb(128,128,128)'
  return {
    backgroundColor: isHidden
      ? base.replace('rgb(', 'rgba(').replace(')', ',0.2)')
      : base,
    width: `${NOTE_SIZE}px`,
    height: `${NOTE_SIZE}px`,
  }
}

// In cycle mode each degree button fades to match its chord's visibility level
function degreeButtonOpacity(deg: number): number {
  if (deg === activeChordDegree.value) return 1
  if (deg === ghostChord1Degree.value) return 0.5
  if (state.cycleLookahead >= 2 && deg === ghostChord2Degree.value) return 0.3
  return 0.08
}

function degreeButtonStyle(deg: number) {
  const base = degreeCircleStyle(deg - 1)
  if (!state.cycleMode) return base
  return { ...base, opacity: degreeButtonOpacity(deg) }
}
</script>

<template>
  <div class="app-root">

    <!-- ── Main area: fills all space above the cycle bar ── -->
    <div class="main-area">
      <div class="center-wrapper">

        <!-- Fretboard column -->
        <div class="fretboard-column">

          <!-- String name toggles -->
          <div
            class="string-toggles"
            :style="{ paddingLeft: togglePaddingLeft, gap: toggleGap }"
          >
            <button
              v-for="si in state.strings"
              :key="si - 1"
              class="string-btn"
              :class="{ hidden: hiddenStringsSet.has(si - 1) }"
              :style="{ width: toggleSize, height: toggleSize }"
              @click="toggleString(si - 1)"
            >
              {{ noteNamesForKey[(tuning.openStrings[si - 1] ?? 0) % 12] }}
            </button>
          </div>

          <!-- Scrollable fretboard -->
          <div class="fretboard-scroll" :class="{ 'fretboard-scroll--cycle': state.cycleMode }">
            <FretboardSVG
              :noteMap="displayNoteMap"
              :hiddenStrings="hiddenStringsSet"
              :hiddenDegrees="hiddenDegreesSet"
              :stringCount="state.strings"
              :fretCount="state.fretCount"
              :activeChordDegree="activeChordDegree"
              :ghostChordDegree1="ghostChord1Degree"
              :ghostChordDegree2="ghostChord2Degree"
            />
          </div>

        </div>

        <!-- ── Right controls: menu + degree toggles ── -->
        <div class="right-controls">
          <button class="menu-btn" @click="menuOpen = !menuOpen" aria-label="Toggle settings">
            <span>{{ menuOpen ? '✕' : '☰' }}</span>
          </button>
          <div
            class="degree-sidebar"
            :style="{ pointerEvents: state.cycleMode ? 'none' : 'auto' }"
          >
            <button
              v-for="deg in 7"
              :key="deg"
              class="degree-btn"
              :class="{ dimmed: !state.cycleMode && hiddenDegreesSet.has(deg) }"
              :style="degreeButtonStyle(deg)"
              @click="toggleDegree(deg)"
            >
              <span :class="{ 'label-hidden': !state.cycleMode && hiddenDegreesSet.has(deg) }">
                {{ scaleDegreeLabels[deg - 1] }}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Cycle bar: full-width, pinned to bottom ── -->
    <Transition name="cycle-bar">
      <div v-if="state.cycleMode" class="cycle-bar">
        <!-- Row 1: prev / chord label / next -->
        <div class="cycle-nav-row">
          <button class="cycle-btn" @click="retreatCycleStep" aria-label="Previous chord">◀</button>
          <span class="cycle-chord-label">
            {{ scaleDegreeLabels[currentDiatonicIdx] }} → {{ scaleDegreeLabels[nextDiatonicIdx] }}
          </span>
          <button class="cycle-btn" @click="advanceCycleStep" aria-label="Next chord">▶</button>
        </div>
        <!-- Row 2: cycle selector, auto-play, BPM, lookahead -->
        <div class="cycle-config-row">
          <CycleSelect v-model="state.cycleNumber" :options="[2,3,4,5,6,7]" />
          <button
            class="cycle-btn cycle-btn--fixed"
            :class="{ active: state.autoPlay }"
            @click="state.autoPlay = !state.autoPlay"
            aria-label="Toggle auto-play"
          >{{ state.autoPlay ? '⏸︎' : '▶︎' }}</button>
          <button class="cycle-btn" @click="state.autoPlayBPM = Math.max(20, state.autoPlayBPM - 5)" aria-label="Decrease BPM">−</button>
          <span class="bpm-label">♩×4={{ state.autoPlayBPM }}</span>
          <button class="cycle-btn" @click="state.autoPlayBPM = Math.min(240, state.autoPlayBPM + 5)" aria-label="Increase BPM">+</button>
          <button
            class="cycle-btn"
            @click="state.cycleLookahead = state.cycleLookahead === 1 ? 2 : 1"
            aria-label="Toggle lookahead"
          >»{{ state.cycleLookahead }}</button>
        </div>
      </div>
    </Transition>

    <!-- ── Settings overlay ── -->
    <Transition name="settings">
      <div v-if="menuOpen" class="settings-overlay" @click.self="menuOpen = false">
        <div class="overlay-backdrop" @click="menuOpen = false" />
        <SettingsPanel @close="menuOpen = false" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ── Root ─────────────────────────────────────────────────────────── */
.app-root {
  display: flex;
  flex-direction: column;
  height: 100svh;
  width: 100vw;
  background: #111;
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
  position: relative;
  /* Push content clear of notch / Dynamic Island */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  box-sizing: border-box;
}

/* ── Main area: takes all space above cycle bar ───────────────────── */
.main-area {
  flex: 1;
  min-height: 0;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

/* ── Center wrapper ───────────────────────────────────────────────── */
/* Flex row: fretboard + controls side-by-side, whole unit centered. */
.center-wrapper {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  height: 100%;
  flex-shrink: 0;
}

/* ── Fretboard column ─────────────────────────────────────────────── */
.fretboard-column {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.string-toggles {
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  padding-top: 10px;
  padding-bottom: 4px;
}
.string-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  border-radius: 6px;
  flex-shrink: 0;
  transition: color 0.1s;
}
.string-btn:hover { background: rgba(255,255,255,0.08); }
.string-btn.hidden { color: #444; }

.fretboard-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 16px;
}
/* Extra scroll clearance so content doesn't hide behind the fixed cycle bar */
.fretboard-scroll--cycle {
  padding-bottom: 110px;
}

/* ── Right controls ───────────────────────────────────────────────── */
/* Inline flex item, 20px gap from fretboard. Whole row is centered. */
.right-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  gap: 16px;
  margin-left: 20px;
}

/* ── Degree sidebar ───────────────────────────────────────────────── */
.degree-sidebar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transition: opacity 0.2s;
}
.degree-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.15s;
}
.degree-btn span {
  font-size: 0.6rem;
  font-weight: 700;
  color: white;
  pointer-events: none;
}
.degree-btn.dimmed { opacity: 0.4; }
.label-hidden { color: #888 !important; }

/* ── Hamburger ────────────────────────────────────────────────────── */
.menu-btn {
  background: rgba(0,0,0,0.55);
  border: none;
  color: #fff;
  font-size: 1.1rem;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.menu-btn:hover { background: rgba(255,255,255,0.12); }

/* ── Settings overlay ─────────────────────────────────────────────── */
.settings-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  justify-content: flex-end;
}
.overlay-backdrop {
  flex: 1;
  background: rgba(0,0,0,0.55);
}

/* Slide-in / fade transition */
.settings-enter-active,
.settings-leave-active {
  transition: opacity 0.2s ease;
}
.settings-enter-from,
.settings-leave-to {
  opacity: 0;
}

/* ── Cycle bar: fixed to physical screen bottom ───────────────────── */
.cycle-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 16px calc(12px + env(safe-area-inset-bottom));
  background: #1a1a1a;
  border-top: 1px solid rgba(255,255,255,0.1);
  box-sizing: border-box;
}

/* Slide up when cycle mode is toggled on */
.cycle-bar-enter-active { transition: transform 0.2s ease, opacity 0.2s ease; }
.cycle-bar-leave-active { transition: transform 0.15s ease, opacity 0.15s ease; }
.cycle-bar-enter-from, .cycle-bar-leave-to { transform: translateY(100%); opacity: 0; }

.cycle-nav-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.cycle-config-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
}

.cycle-chord-label {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  min-width: 90px;
  text-align: center;
  letter-spacing: 0.04em;
}

.cycle-btn {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 6px;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 5px 10px;
  cursor: pointer;
  flex-shrink: 0;
  min-width: 32px;
  line-height: 1.4;
}
.cycle-btn:hover { background: rgba(255,255,255,0.16); }
/* Fixed width so play ▶ and pause ⏸ don't shift neighbours */
.cycle-btn--fixed { width: 36px; padding-left: 0; padding-right: 0; justify-content: center; }
.cycle-btn.active {
  background: rgba(80,200,120,0.25);
  border-color: rgba(80,200,120,0.55);
}

.bpm-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #ccc;
  min-width: 52px;
  text-align: center;
}
</style>
