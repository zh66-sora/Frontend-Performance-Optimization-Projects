import type { App, Component } from 'vue'
import { ElButton, ElDialog, ElOption, ElSelect, ElTag, ElTooltip } from 'element-plus'

/**
 * 按需注册：只注册用到的 6 个组件，避免整包引入。
 * 样式仍走一次性引入，换成 unplugin-element-plus 可以进一步瘦身。
 */
const COMPONENTS: Component[] = [ElButton, ElDialog, ElOption, ElSelect, ElTag, ElTooltip]

export function useElement(app: App) {
  for (const component of COMPONENTS) {
    const name = (component as { name?: string }).name
    if (name) app.component(name, component)
  }
}
