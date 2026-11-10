import { createApp, h } from 'vue'
import FieldList from '../components/FieldList.vue'
import { useElement } from '../element'
import type { FieldItem } from '../types'

/**
 * 单帧渲染成本对照组：同样一批字段，分别用 el-button 和 span 渲染，
 * 量出「创建 N 个字段」的同步耗时，用来对比 mini 组件的收益。
 */
export function installBench(pickFields: (count: number) => FieldItem[]) {
  const run = (mode: 'ep' | 'mini', count: number) => {
    const fields = pickFields(count)
    const host = document.createElement('div')
    host.style.cssText = 'position:absolute;left:-9999px;top:0;width:900px'
    document.body.appendChild(host)

    const app = createApp({
      render: () => h(FieldList, { fields, mode, tooltip: 'lazy' })
    })
    useElement(app)

    const startedAt = performance.now()
    app.mount(host)
    void host.offsetHeight
    const cost = performance.now() - startedAt

    app.unmount()
    host.remove()
    return Math.round(cost * 10) / 10
  }

  ;(window as unknown as Record<string, unknown>).__fieldBench = {
    run,
    sample: (count = 500, times = 3) => {
      const pick = (mode: 'ep' | 'mini') => {
        const list: number[] = []
        for (let i = 0; i < times; i++) list.push(run(mode, count))
        return list.sort((a, b) => a - b)[Math.floor(times / 2)]
      }
      return { ep: pick('ep'), mini: pick('mini'), count }
    }
  }
}
