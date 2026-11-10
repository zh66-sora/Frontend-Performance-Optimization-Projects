<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import type { FieldItem, FieldStats } from '../types'
import { FIELD_STATS_LABELS, loadFieldStats } from '../utils/fieldStats'

const props = defineProps<{ field: FieldItem }>()

const loading = ref(true)
const stats = ref<FieldStats | null>(null)
const lineEl = ref<HTMLCanvasElement | null>(null)
const radarEl = ref<HTMLCanvasElement | null>(null)

function setupCanvas(canvas: HTMLCanvasElement, w: number, h: number) {
  const dpr = window.devicePixelRatio || 1
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.scale(dpr, dpr)
  return ctx
}

function drawLine(canvas: HTMLCanvasElement, values: number[]) {
  const w = 164
  const h = 46
  const ctx = setupCanvas(canvas, w, h)
  if (!ctx) return
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const stepX = w / (values.length - 1)
  const y = (v: number) => h - 6 - ((v - min) / (max - min || 1)) * (h - 12)

  ctx.beginPath()
  values.forEach((v, i) => {
    const px = i * stepX
    const py = y(v)
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
  })
  ctx.strokeStyle = '#409eff'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.lineTo(w, h)
  ctx.lineTo(0, h)
  ctx.closePath()
  ctx.fillStyle = 'rgba(64, 158, 255, 0.12)'
  ctx.fill()
}

function drawRadar(canvas: HTMLCanvasElement, values: number[]) {
  const size = 128
  const ctx = setupCanvas(canvas, size, size)
  if (!ctx) return
  const cx = size / 2
  const cy = size / 2
  const r = 32
  const n = values.length
  const angle = (i: number) => -Math.PI / 2 + (i * Math.PI * 2) / n

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)'
  ctx.lineWidth = 1
  for (let ring = 1; ring <= 4; ring++) {
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const rr = (r * ring) / 4
      const px = cx + Math.cos(angle(i)) * rr
      const py = cy + Math.sin(angle(i)) * rr
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
    }
    ctx.closePath()
    ctx.stroke()
  }

  for (let i = 0; i < n; i++) {
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r)
    ctx.stroke()
  }

  ctx.beginPath()
  values.forEach((v, i) => {
    const rr = (r * v) / 100
    const px = cx + Math.cos(angle(i)) * rr
    const py = cy + Math.sin(angle(i)) * rr
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
  })
  ctx.closePath()
  ctx.fillStyle = 'rgba(64, 158, 255, 0.22)'
  ctx.fill()
  ctx.strokeStyle = '#409eff'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = '#909399'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  FIELD_STATS_LABELS.forEach((label, i) => {
    const px = cx + Math.cos(angle(i)) * (r + 14)
    const py = cy + Math.sin(angle(i)) * (r + 14)
    ctx.fillText(label, px, py)
  })
}

onMounted(async () => {
  const data = await loadFieldStats(props.field)
  stats.value = data
  loading.value = false
  await nextTick()
  if (lineEl.value) drawLine(lineEl.value, data.trend)
  if (radarEl.value) drawRadar(radarEl.value, data.completeness)
})
</script>

<template>
  <div class="detail">
    <div class="detail-head">
      <span class="detail-title">{{ field.label }}</span>
      <span class="detail-type">{{ field.type }}</span>
    </div>
    <p class="detail-desc">{{ field.desc }}</p>

    <div v-if="loading" class="detail-loading">
      <span class="skeleton-line" />
      <span class="skeleton-line short" />
    </div>

    <template v-else-if="stats">
      <div class="detail-row">
        <span class="detail-label">近 7 日填报</span>
        <canvas ref="lineEl" class="detail-line" />
      </div>
      <div class="detail-row column">
        <span class="detail-label">质量画像</span>
        <canvas ref="radarEl" class="detail-radar" />
      </div>
      <div class="detail-foot">
        使用 {{ stats.used }} 次 · 覆盖 {{ stats.departments }} 个科室
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail {
  width: 240px;
  font-size: 12px;
  color: #606266;
}

.detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.detail-title {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.detail-type {
  flex: none;
  padding: 0 6px;
  height: 18px;
  line-height: 18px;
  border-radius: 3px;
  background: #f2f3f5;
  color: #909399;
  font-size: 11px;
}

.detail-desc {
  margin: 0 0 8px;
  line-height: 1.6;
  color: #909399;
}

.detail-loading {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px 0;
}

.skeleton-line {
  height: 8px;
  border-radius: 4px;
  background: #f0f2f5;
}

.skeleton-line.short {
  width: 60%;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.detail-row.column {
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.detail-label {
  width: 66px;
  flex: none;
  color: #909399;
}

.detail-line,
.detail-radar {
  display: block;
}

.detail-foot {
  color: #a8abb2;
  font-size: 11px;
}
</style>
