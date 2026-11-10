<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { FieldItem } from '../types'
import FieldDetail from './FieldDetail.vue'

defineProps<{
  field: FieldItem
  mode: 'ep' | 'mini'
  picked?: boolean
}>()

const emit = defineEmits<{ (e: 'pick'): void }>()

const visible = ref(false)
const pos = ref({ left: 0, top: 0 })
const triggerRef = ref<any>(null)

let openTimer: number | undefined
let closeTimer: number | undefined

const PANEL_W = 264
const PANEL_H = 300

const posStyle = computed(() => ({
  left: `${pos.value.left}px`,
  top: `${pos.value.top}px`
}))

function hostEl(): HTMLElement | null {
  const target = triggerRef.value
  if (!target) return null
  if (target instanceof HTMLElement) return target
  return target.$el instanceof HTMLElement ? target.$el : null
}

function place() {
  const node = hostEl()
  if (!node) return
  const rect = node.getBoundingClientRect()
  let left = rect.right + 10
  if (left + PANEL_W > window.innerWidth - 8) left = rect.left - PANEL_W - 10
  const top = Math.max(8, Math.min(rect.top - 8, window.innerHeight - PANEL_H))
  pos.value = { left: Math.max(8, left), top }
}

function clearTimers() {
  if (openTimer !== undefined) window.clearTimeout(openTimer)
  if (closeTimer !== undefined) window.clearTimeout(closeTimer)
  openTimer = undefined
  closeTimer = undefined
}

function enter() {
  if (closeTimer !== undefined) window.clearTimeout(closeTimer)
  closeTimer = undefined
  openTimer = window.setTimeout(() => {
    place()
    visible.value = true
    openTimer = undefined
  }, 60)
}

function leave() {
  if (openTimer !== undefined) window.clearTimeout(openTimer)
  openTimer = undefined
  closeTimer = window.setTimeout(() => {
    visible.value = false
    closeTimer = undefined
  }, 80)
}

function keepOpen() {
  if (closeTimer !== undefined) window.clearTimeout(closeTimer)
  closeTimer = undefined
}

function hideNow() {
  clearTimers()
  visible.value = false
}

onMounted(() => window.addEventListener('scroll', hideNow, true))
onBeforeUnmount(() => {
  window.removeEventListener('scroll', hideNow, true)
  clearTimers()
})
</script>

<template>
  <el-button
    v-if="mode === 'ep'"
    ref="triggerRef"
    link
    type="primary"
    class="field field-btn"
    :class="{ 'is-picked': picked }"
    @mouseenter="enter"
    @mouseleave="leave"
    @click="emit('pick')"
  >
    {{ field.label }}
  </el-button>
  <span
    v-else
    ref="triggerRef"
    class="field"
    :class="{ 'is-picked': picked }"
    @mouseenter="enter"
    @mouseleave="leave"
    @click="emit('pick')"
  >
    {{ field.label }}
  </span>

  <Teleport to="body">
    <div v-if="visible" class="x-popover" :style="posStyle" @mouseenter="keepOpen" @mouseleave="leave">
      <FieldDetail :field="field" />
    </div>
  </Teleport>
</template>
