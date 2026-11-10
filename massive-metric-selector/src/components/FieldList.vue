<script setup lang="ts">
import type { FieldItem } from '../types'
import FieldRenderer from './FieldRenderer.vue'

// 规定从父组件接收的props
defineProps<{
  fields: FieldItem[]
  mode: 'ep' | 'mini'
  tooltip: 'static' | 'lazy'
  pickedSet?: Set<string>
}>()

// 规定能触发的父组件句柄
const emit = defineEmits<{ (e: 'pick', field: FieldItem): void }>()
</script>

<template>
  <div class="fields">
    <FieldRenderer
      v-for="field in fields"
      :key="field.id"
      :field="field"
      :mode="mode"
      :tooltip="tooltip"
      :picked="pickedSet?.has(field.id)"
      @pick="emit('pick', field)"
    />
  </div>
</template>
