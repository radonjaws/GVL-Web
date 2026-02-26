<script setup lang="ts">
import { useSettings } from '../settings'
import type { ScaleMode } from '../types'

defineEmits<{ close: [] }>()

const { state, ALL_KEYS, TUNINGS } = useSettings()

const MODE_LABELS: Record<ScaleMode, string> = {
  maj: 'Major',
  min: 'Minor',
  hMin: 'Harm. Minor',
}
const ALL_MODES: ScaleMode[] = ['maj', 'min', 'hMin']
</script>

<template>
  <div class="settings-panel">
    <div class="panel-header">
      <span class="panel-title">Settings</span>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>

    <!-- Key selection -->
    <div class="section-label">Key</div>
    <div class="key-grid">
      <button
        v-for="key in ALL_KEYS"
        :key="key"
        class="key-btn"
        :class="{ active: state.selectedKey === key }"
        @click="state.selectedKey = key"
      >{{ key }}</button>
    </div>

    <!-- Scale mode -->
    <div class="section-label">Mode</div>
    <div class="mode-row">
      <button
        v-for="mode in ALL_MODES"
        :key="mode"
        class="mode-btn"
        :class="{ active: state.selectedScaleMode === mode }"
        @click="state.selectedScaleMode = mode"
      >{{ MODE_LABELS[mode] }}</button>
    </div>

    <!-- Tuning -->
    <div class="section-label">Tuning</div>
    <div class="tuning-row">
      <button
        v-for="t in TUNINGS"
        :key="t.id"
        class="tuning-btn"
        :class="{ active: state.selectedTuningId === t.id }"
        @click="state.selectedTuningId = t.id"
      >{{ t.name }}</button>
    </div>
  </div>
</template>

<style scoped>
.settings-panel {
  width: 260px;
  background: #1e1e1e;
  border-left: 1px solid #333;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  height: 100%;
  box-sizing: border-box;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.panel-title {
  font-weight: 700;
  font-size: 1rem;
  color: #fff;
}
.close-btn {
  background: none;
  border: none;
  color: #aaa;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 4px 8px;
}
.close-btn:hover { color: #fff; }

.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #888;
  margin-top: 8px;
}

/* Key grid: 3 columns */
.key-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}
.key-btn {
  padding: 8px 4px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #2a2a2a;
  color: #ccc;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}
.key-btn.active {
  background: #1d6fd8;
  border-color: #1d6fd8;
  color: #fff;
}
.key-btn:hover:not(.active) { background: #333; }

/* Mode row */
.mode-row {
  display: flex;
  gap: 6px;
}
.mode-btn {
  flex: 1;
  padding: 8px 4px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #2a2a2a;
  color: #ccc;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}
.mode-btn.active {
  background: #1a8a42;
  border-color: #1a8a42;
  color: #fff;
}
.mode-btn:hover:not(.active) { background: #333; }

/* Tuning buttons */
.tuning-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.tuning-btn {
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #2a2a2a;
  color: #ccc;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}
.tuning-btn.active {
  background: #555;
  border-color: #888;
  color: #fff;
}
.tuning-btn:hover:not(.active) { background: #333; }
</style>
