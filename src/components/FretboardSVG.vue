<script setup lang="ts">
import { computed } from 'vue'
import type { NoteData } from '../types'
import {
  NOTE_SIZE,
  FRET_MARKER_X,
  svgWidth, svgHeight, noteX, noteY, fretLineY, fretLineX1, fretLineX2,
} from '../fretboardGeometry'
import { FRET_MARKERS, DOUBLE_DOT_FRET } from '../constants'

const props = defineProps<{
  noteMap: Map<string, NoteData>
  hiddenStrings: Set<number>
  hiddenDegrees: Set<number>
  stringCount: number
  fretCount: number
  // Cycle mode — presence of activeChordDegree activates per-slice rendering.
  // Each note's triadDegrees[i] is matched against these chord degrees to determine
  // which slices to show and at what opacity.  Notes with no matching slices are hidden.
  activeChordDegree?: number   // current chord (1–7): full opacity
  ghostChordDegree1?: number   // next chord: 45% opacity
  ghostChordDegree2?: number   // chord +2: 25% opacity
}>()

// ── SVG dimensions ────────────────────────────────────────────────────────────

const W = computed(() => svgWidth(props.stringCount))
const H = computed(() => svgHeight(props.fretCount))

// ── Fret lines ────────────────────────────────────────────────────────────────

const fretLines = computed(() => {
  const lines = []
  for (let f = 0; f <= props.fretCount; f++) {
    lines.push({
      key: f,
      y: fretLineY(f),
      x1: fretLineX1(),
      x2: fretLineX2(props.stringCount),
      strokeWidth: f === 0 ? 3 : 0.75,
      opacity: f === 0 ? 0.9 : 0.5,
    })
  }
  return lines
})

// ── String lines ──────────────────────────────────────────────────────────────

const stringLines = computed(() => {
  const lines = []
  const yTop = fretLineY(0)
  const yBot = fretLineY(props.fretCount)
  // Always render all string lines — hidden strings only suppress notes, not the string itself
  for (let si = 0; si < props.stringCount; si++) {
    lines.push({ key: si, x: noteX(si), y1: yTop, y2: yBot })
  }
  return lines
})

// ── Fret markers ──────────────────────────────────────────────────────────────

const fretMarkers = computed(() => {
  return FRET_MARKERS.filter(f => f <= props.fretCount).map(f => ({
    fret: f,
    y: noteY(f),
    double: f === DOUBLE_DOT_FRET,
  }))
})

// ── Note circles ──────────────────────────────────────────────────────────────

const notes = computed(() => {
  const result: Array<{
    key: string
    cx: number
    cy: number
    r: number
    ringOpacity: number
    slices: Array<{ path: string; color: string; sliceOpacity: number }>
    labels: Array<{ x: number; y: number; text: string; opacity: number } | null>
  }> = []

  // Cycle mode is active when activeChordDegree is defined.
  // Opacity is resolved per slice by matching each slice's triadDegree[i] against
  // the three chord degrees — a note can show slices from multiple chords simultaneously
  // (common tones share a fret position and belong to several diatonic triads).
  const cycleModeOn = props.activeChordDegree !== undefined

  for (let si = 0; si < props.stringCount; si++) {
    if (props.hiddenStrings.has(si)) continue
    for (let fret = 0; fret <= props.fretCount; fret++) {
      const note = props.noteMap.get(`${si}-${fret}`)
      if (!note) continue

      const cx = noteX(si)
      const cy = noteY(fret)
      const r = NOTE_SIZE / 2

      // Build slices with per-slice opacity based on which chord each slice belongs to.
      // A note whose triadDegrees[i] matches the active chord gets that slice at full
      // opacity; ghost chords get reduced opacity; unmatched slices go transparent.
      // In normal mode every slice is rendered at full opacity (controlled by the noteMap).
      const slices = note.triadColors.map((color, i) => {
        const path = pieSlicePath(i, cx, cy, r)
        if (!cycleModeOn) return { path, color, sliceOpacity: 1 }
        const scd = note.triadDegrees[i]  // chord degree this slice represents
        if (scd === props.activeChordDegree)  return { path, color, sliceOpacity: 1 }
        if (scd === props.ghostChordDegree1)  return { path, color, sliceOpacity: 0.45 }
        if (scd === props.ghostChordDegree2)  return { path, color, sliceOpacity: 0.25 }
        return { path, color: 'transparent', sliceOpacity: 0 }
      })

      // In cycle mode, skip notes where no slice is visible
      const ringOpacity = cycleModeOn
        ? Math.max(...slices.map(s => s.sliceOpacity))
        : 1
      if (cycleModeOn && ringOpacity === 0) continue

      const labels = note.triadLabels.map((label, i) => {
        if (label === null) return null
        if (!cycleModeOn) {
          const pos = labelPosition(i, cx, cy, r)
          return { x: pos.x, y: pos.y, text: String(label), opacity: 1 }
        }
        const scd = note.triadDegrees[i]
        if (scd === props.activeChordDegree) {
          const pos = labelPosition(i, cx, cy, r)
          return { x: pos.x, y: pos.y, text: String(label), opacity: 1 }
        }
        if (scd === props.ghostChordDegree1) {
          const pos = labelPosition(i, cx, cy, r)
          return { x: pos.x, y: pos.y, text: String(label), opacity: 0.45 }
        }
        if (scd === props.ghostChordDegree2) {
          const pos = labelPosition(i, cx, cy, r)
          return { x: pos.x, y: pos.y, text: String(label), opacity: 0.25 }
        }
        return null  // invisible slice → no label
      })

      result.push({ key: `${si}-${fret}`, cx, cy, r, ringOpacity, slices, labels })
    }
  }
  return result
})

// ── SVG path math ─────────────────────────────────────────────────────────────

/** SVG arc path for pie slice i (0, 1, 2), each 120°, starting from top. */
function pieSlicePath(index: number, cx: number, cy: number, r: number): string {
  const startDeg = -90 + index * 120
  const endDeg = startDeg + 120
  const s = toRad(startDeg)
  const e = toRad(endDeg)
  const x1 = cx + r * Math.cos(s)
  const y1 = cy + r * Math.sin(s)
  const x2 = cx + r * Math.cos(e)
  const y2 = cy + r * Math.sin(e)
  return `M${cx},${cy} L${f(x1)},${f(y1)} A${r},${r} 0 0,1 ${f(x2)},${f(y2)} Z`
}

/** Label center at the midpoint angle of slice i, at 50% radius. */
function labelPosition(index: number, cx: number, cy: number, r: number) {
  const mid = toRad(-90 + index * 120 + 60)
  return { x: cx + r * 0.48 * Math.cos(mid), y: cy + r * 0.48 * Math.sin(mid) }
}

function toRad(deg: number) { return deg * Math.PI / 180 }
function f(n: number) { return n.toFixed(2) }

// ── Dot marker size ───────────────────────────────────────────────────────────

const DOT_R = 3
const DOT_GAP = 5
</script>

<template>
  <svg
    :width="W"
    :height="H"
    :viewBox="`0 0 ${W} ${H}`"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Fretboard background: spans exactly the fret line extents -->
    <rect
      :x="fretLineX1()"
      y="0"
      :width="fretLineX2(stringCount) - fretLineX1()"
      :height="H"
      rx="4"
      fill="rgba(255,255,255,0.06)"
    />

    <!-- Fret lines -->
    <line
      v-for="fl in fretLines"
      :key="fl.key"
      :x1="fl.x1"
      :y1="fl.y"
      :x2="fl.x2"
      :y2="fl.y"
      :stroke="`rgba(180,180,180,${fl.opacity})`"
      :stroke-width="fl.strokeWidth"
    />

    <!-- String lines -->
    <line
      v-for="sl in stringLines"
      :key="sl.key"
      :x1="sl.x"
      :y1="sl.y1"
      :x2="sl.x"
      :y2="sl.y2"
      stroke="rgba(160,160,160,0.35)"
      stroke-width="1"
    />

    <!-- Fret marker dots -->
    <g v-for="fm in fretMarkers" :key="fm.fret">
      <!-- single dot -->
      <circle
        v-if="!fm.double"
        :cx="FRET_MARKER_X"
        :cy="fm.y"
        :r="DOT_R"
        fill="rgba(255,255,255,0.55)"
      />
      <!-- double dot (12th fret) -->
      <template v-else>
        <circle
          :cx="FRET_MARKER_X"
          :cy="fm.y - DOT_R - DOT_GAP / 2"
          :r="DOT_R"
          fill="rgba(255,255,255,0.55)"
        />
        <circle
          :cx="FRET_MARKER_X"
          :cy="fm.y + DOT_R + DOT_GAP / 2"
          :r="DOT_R"
          fill="rgba(255,255,255,0.55)"
        />
      </template>
    </g>

    <!--
      Note circles — TransitionGroup fades entire note groups in/out when they
      enter or leave the visible set.  Each slice, ring, and label also carries
      its own inline opacity style so CSS transitions animate them individually
      when the cycle step changes (common tones that stay in the DOM).
    -->
    <TransitionGroup tag="g" name="note">
      <g v-for="n in notes" :key="n.key">
        <!-- Pie slices — per-slice opacity enables multi-chord common-tone rendering -->
        <path
          v-for="(slice, i) in n.slices"
          :key="i"
          :d="slice.path"
          :fill="slice.color"
          class="note-slice"
          :style="{ opacity: slice.sliceOpacity }"
        />
        <!-- White border ring at the max visible-slice opacity -->
        <circle
          :cx="n.cx"
          :cy="n.cy"
          :r="n.r - 0.5"
          fill="none"
          stroke="white"
          stroke-width="1"
          class="note-ring"
          :style="{ opacity: n.ringOpacity }"
        />
        <!-- Labels: use <template v-for> so v-if can reference loop variable -->
        <template v-for="(label, i) in n.labels" :key="i">
          <text
            v-if="label !== null"
            :x="label.x"
            :y="label.y"
            text-anchor="middle"
            dominant-baseline="central"
            font-size="9"
            font-family="system-ui, sans-serif"
            font-weight="600"
            fill="white"
            class="note-label"
            :style="{ opacity: label.opacity }"
          >{{ label.text }}</text>
        </template>
      </g>
    </TransitionGroup>
  </svg>
</template>

<style scoped>
/* ── Per-element opacity transitions (notes that stay in DOM, opacity changes) ── */
/* Applied to slices, ring, and labels whenever Vue updates their inline opacity style */
.note-slice,
.note-ring,
.note-label {
  transition: opacity 0.28s ease-in-out;
}

/* ── TransitionGroup enter/leave (notes appearing or disappearing entirely) ── */
/* The group <g> element fades in/out; SVG opacity is multiplicative, so each  */
/* child's individual opacity is preserved relative to the group level.         */
.note-enter-active,
.note-leave-active {
  transition: opacity 0.28s ease-in-out;
}
.note-enter-from,
.note-leave-to {
  opacity: 0;
}
</style>
