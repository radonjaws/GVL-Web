<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSettings } from './settings'
import { generateNoteMap, filterNote } from './fretboardGenerator'
import { TRIAD_COLORS } from './constants'
import {
  NOTE_SIZE, H_SPACING, H_PADDING, FRET_MARKER_WIDTH,
} from './fretboardGeometry'
import FretboardSVG from './components/FretboardSVG.vue'
import SettingsPanel from './components/SettingsPanel.vue'
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
</script>

<template>
  <div class="app-root">

    <!-- ── Main column: string toggles + scrollable fretboard ── -->
    <div class="fretboard-column">

      <!-- String name toggles (above scroll, stays fixed) -->
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
      <div class="fretboard-scroll">
        <FretboardSVG
          :noteMap="filteredNoteMap"
          :hiddenStrings="hiddenStringsSet"
          :hiddenDegrees="hiddenDegreesSet"
          :stringCount="state.strings"
          :fretCount="state.fretCount"
        />
      </div>
    </div>

    <!-- ── Right sidebar: degree toggles ── -->
    <div class="degree-sidebar">
      <button
        v-for="deg in 7"
        :key="deg"
        class="degree-btn"
        :class="{ dimmed: hiddenDegreesSet.has(deg) }"
        :style="degreeCircleStyle(deg - 1)"
        @click="toggleDegree(deg)"
      >
        <span :class="{ 'label-hidden': hiddenDegreesSet.has(deg) }">
          {{ scaleDegreeLabels[deg - 1] }}
        </span>
      </button>
    </div>

    <!-- ── Hamburger button ── -->
    <button class="menu-btn" @click="menuOpen = !menuOpen" aria-label="Toggle settings">
      <span>{{ menuOpen ? '✕' : '☰' }}</span>
    </button>

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
  flex-direction: row;
  height: 100svh;
  width: 100vw;
  background: #111;
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
  position: relative;
}

/* ── Fretboard column ─────────────────────────────────────────────── */
.fretboard-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
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

/* ── Degree sidebar ───────────────────────────────────────────────── */
.degree-sidebar {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 8px 6px;
  flex-shrink: 0;
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
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 20;
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
</style>
