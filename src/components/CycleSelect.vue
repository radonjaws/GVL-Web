<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  modelValue: number
  options: number[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function select(val: number) {
  emit('update:modelValue', val)
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<template>
  <div class="cs-root" ref="root">
    <button class="cs-btn" :class="{ open }" @click="open = !open" aria-haspopup="listbox" :aria-expanded="open">
      Cyc. {{ modelValue }} {{ modelValue <= 4 ? '↑' : '↓' }}<span class="cs-arrow">▾</span>
    </button>
    <Transition name="cs-drop">
      <ul v-if="open" class="cs-menu" role="listbox">
        <li
          v-for="opt in options"
          :key="opt"
          class="cs-option"
          :class="{ selected: opt === modelValue }"
          role="option"
          :aria-selected="opt === modelValue"
          @mousedown.prevent="select(opt)"
        >
          Cyc. {{ opt }} {{ opt <= 4 ? '↑' : '↓' }}
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.cs-root {
  position: relative;
  flex-shrink: 0;
}

.cs-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: system-ui, -apple-system, sans-serif;
  padding: 5px 8px;
  cursor: pointer;
  white-space: nowrap;
  line-height: 1.4;
}
.cs-btn:hover { background: rgba(255, 255, 255, 0.16); }
.cs-btn.open  { background: rgba(255, 255, 255, 0.14); border-color: rgba(255, 255, 255, 0.32); }

.cs-arrow {
  font-size: 0.7rem;
  opacity: 0.7;
  transition: transform 0.15s;
}
.cs-btn.open .cs-arrow { transform: rotate(180deg); }

/* Menu opens upward since the cycle bar is at the bottom */
.cs-menu {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 0;
  min-width: 100%;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  background: #1e1e1e;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  z-index: 100;
  overflow: hidden;
}

.cs-option {
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: system-ui, -apple-system, sans-serif;
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
}
.cs-option:hover    { background: rgba(255, 255, 255, 0.1); }
.cs-option.selected { background: rgba(255, 255, 255, 0.14); color: #fff; }

/* Subtle pop-in */
.cs-drop-enter-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.cs-drop-leave-active { transition: opacity 0.08s ease; }
.cs-drop-enter-from  { opacity: 0; transform: translateY(4px); }
.cs-drop-leave-to    { opacity: 0; }
</style>
