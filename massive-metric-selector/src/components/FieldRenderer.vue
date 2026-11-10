<script setup lang="ts">
import type { FieldItem } from '../types'
import XTooltip from './XTooltip.vue'

defineProps<{
  field: FieldItem
  mode: 'ep' | 'mini'
  tooltip: 'static' | 'lazy'
  picked?: boolean
}>()

const emit = defineEmits<{ (e: 'pick'): void }>()
</script>

<template>
  <!-- 分叉 根据渲染策略决定浮层如何渲染 -->

  <!-- 基线：每个字段自带一个 el-tooltip，挂载即创建，2235 个一起进来 -->
  <el-tooltip v-if="tooltip === 'static'" :content="field.label" placement="top">
    <el-button link type="primary" class="field field-btn" :class="{ 'is-picked': picked }" @click="emit('pick')">
      {{ field.label }}
    </el-button>
  </el-tooltip>

  <!-- 优化后：浮层在 hover 时才挂载，非悬浮状态零节点 -->
  <XTooltip v-else :field="field" :mode="mode" :picked="picked" @pick="emit('pick')" />
</template>
