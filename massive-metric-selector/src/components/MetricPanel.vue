<script setup lang="ts">
defineProps<{
  openMs: number
  nodes: number
  maxFrame: number
  longTask: number
  sampling: boolean
}>()
</script>

<template>
  <div class="metrics">
    <div class="metrics-head">
      <span>实时采样</span>
      <i class="dot" :class="{ on: sampling }" />
    </div>
    <div class="metrics-row">
      <span>打开耗时</span>
      <b data-metric="open">{{ openMs }}</b>
      <em>ms</em>
    </div>
    <div class="metrics-row">
      <span>最长任务</span>
      <b data-metric="longtask">{{ longTask }}</b>
      <em>ms</em>
    </div>
    <div class="metrics-row">
      <span>最大帧间隔</span>
      <b data-metric="frame">{{ maxFrame.toFixed(1) }}</b>
      <em>ms</em>
    </div>
    <div class="metrics-row">
      <span>DOM 节点</span>
      <b data-metric="nodes">{{ nodes }}</b>
      <em>个</em>
    </div>
  </div>
</template>

<style scoped>
.metrics {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 3000;
  width: 196px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #ebeef5;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
  font-size: 12px;
  color: #606266;
}

.metrics-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #909399;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #dcdfe6;
}

.dot.on {
  background: #67c23a;
}

.metrics-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 3px 0;
}

.metrics-row span {
  flex: 1;
  color: #909399;
}

.metrics-row b {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  font-variant-numeric: tabular-nums;
}

.metrics-row em {
  font-style: normal;
  color: #c0c4cc;
}
</style>
