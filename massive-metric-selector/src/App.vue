<script setup lang="ts">
import { ref } from 'vue'
import type { SelectorProps, Stage } from './types'
import { createPromiseDialog } from './utils/createPromiseDialog'
import { useMetrics } from './utils/useMetrics'
import { FIELD_TOTAL } from './data/fields'
import FieldSelector from './components/FieldSelector.vue'
import MetricPanel from './components/MetricPanel.vue'

const STAGES: { id: Stage; label: string; desc: string }[] = [
  { id: 1, label: '基线 · EP 全量', desc: 'el-tooltip + el-button × 2235，一次性全部渲染' },
  { id: 2, label: '优化 1 · tooltip 动态化', desc: '浮层 hover 时才挂载，字段仍是 el-button' },
  { id: 3, label: '优化 2 · 惰性分块', desc: '分组按视口渲染，离开视口记高度后隐藏' },
  { id: 4, label: '优化 3 · mini + 防抖', desc: 'span 替代 el-button，快速滚动时延迟渲染' }
]

const openSelector = createPromiseDialog<SelectorProps, string[]>(FieldSelector, {
  width: '900px'
})

const stage = ref<Stage>(1)
const picked = ref<string[]>([])
const current = ref(STAGES[0])

const metrics = useMetrics()

function switchStage(next: Stage) {
  stage.value = next
  current.value = STAGES.find((item) => item.id === next) ?? STAGES[0]
  metrics.reset()
}

async function open() {
  metrics.reset()
  const startedAt = performance.now()
  metrics.startSampling()
  try {
    const result = await openSelector({
      stage: stage.value,
      selected: picked.value.slice(),
      onReady: () => {
        metrics.openMs.value = Math.round(performance.now() - startedAt)
      }
    })
    picked.value = result
  } catch {
    // 取消：不改动已选
  } finally {
    metrics.stopSampling()
  }
}

function remove(label: string) {
  picked.value = picked.value.filter((item) => item !== label)
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div class="page-title">
        <h1>指标选择器 · 性能验证</h1>
        <p>数据集 {{ FIELD_TOTAL }} 个字段，11 个分类，字段悬浮查看详情</p>
      </div>
      <button class="primary-btn" type="button" @click="open">选择字段</button>
    </header>

    <div class="stages">
      <button
        v-for="item in STAGES"
        :key="item.id"
        type="button"
        class="stage-btn"
        :class="{ active: stage === item.id }"
        :data-stage="item.id"
        @click="switchStage(item.id)"
      >
        {{ item.label }}
      </button>
    </div>

    <p class="stage-desc">{{ current.desc }}</p>

    <section class="picked">
      <span class="picked-title">已选字段</span>
      <template v-if="picked.length">
        <el-tag v-for="label in picked" :key="label" closable @close="remove(label)">{{ label }}</el-tag>
      </template>
      <span v-else class="picked-empty">暂无</span>
    </section>

    <MetricPanel
      :open-ms="metrics.openMs.value"
      :nodes="metrics.nodes.value"
      :max-frame="metrics.maxFrame.value"
      :long-task="metrics.longTask.value"
      :sampling="metrics.sampling.value"
    />
  </div>
</template>
