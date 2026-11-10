import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 性能采样：打开耗时 / DOM 节点数 / 最大帧间隔 / 最长任务。
 * 全部直接读浏览器真实值，不做估算。
 */
export function useMetrics() {
  const openMs = ref(0)
  const nodes = ref(0)
  const maxFrame = ref(0)
  const longTask = ref(0)
  const sampling = ref(false)

  let rafId = 0
  let last = 0
  let nodeTimer = 0
  let observer: PerformanceObserver | null = null

  const countNodes = () => document.getElementsByTagName('*').length

  const tick = (now: number) => {
    if (last) {
      const delta = now - last
      if (delta > maxFrame.value) maxFrame.value = delta
    }
    last = now
    rafId = requestAnimationFrame(tick)
  }

  const reset = () => {
    openMs.value = 0
    maxFrame.value = 0
    longTask.value = 0
    last = 0
    nodes.value = countNodes()
  }

  const startSampling = () => {
    sampling.value = true
    nodeTimer = window.setInterval(() => {
      nodes.value = countNodes()
    }, 400)
  }

  const stopSampling = () => {
    sampling.value = false
    window.clearInterval(nodeTimer)
    nodeTimer = 0
    nodes.value = countNodes()
  }

  onMounted(() => {
    rafId = requestAnimationFrame(tick)
    nodes.value = countNodes()
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > longTask.value) longTask.value = Math.round(entry.duration)
        }
      })
      observer.observe({ entryTypes: ['longtask'] })
    } catch {
      observer = null
    }
  })

  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId)
    window.clearInterval(nodeTimer)
    observer?.disconnect()
  })

  return {
    openMs,
    nodes,
    maxFrame,
    longTask,
    sampling,
    reset,
    startSampling,
    stopSampling,
    countNodes
  }
}
