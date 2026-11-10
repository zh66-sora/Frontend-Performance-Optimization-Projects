import { createApp, h, ref, watch, type App, type Component } from 'vue'
import { ElDialog } from 'element-plus'
import { useElement } from '../element'

export interface DialogConfig {
  title?: string
  width?: string
  /** 关闭动画结束后延迟多久销毁，默认 400ms */
  destroyDelay?: number
}

/**
 * 把一个普通弹框内容组件包装成「函数式调用 + Promise 返回值」。
 *
 * 1. createApp + h 动态挂载，宿主节点用完即删，不进主包、不进 for 循环；
 * 2. ok / cancel 通过 resolve / reject 交回调用方，语义等价于 confirm()；
 * 3. 关闭时先 visible=false 走过渡动画，动画结束再 unmount + remove。
 */
export function createPromiseDialog<P extends Record<string, any>, R>(
  component: Component,
  config: DialogConfig = {}
) {
  return (props: P = {} as P): Promise<R> =>
    new Promise<R>((resolve, reject) => {
      const host = document.createElement('div')
      document.body.appendChild(host)

      const visible = ref(true)
      let destroyed = false
      let app: App | null = null

      const destroy = () => {
        if (destroyed) return
        destroyed = true
        app?.unmount()
        host.remove()
      }

      const settle = (value: R | Error, ok: boolean) => {
        visible.value = false
        if (ok) resolve(value as R)
        else reject(value as Error)
      }

      app = createApp({
        setup() {
          watch(visible, (visibleNow) => {
            if (!visibleNow) setTimeout(destroy, config.destroyDelay ?? 400)
          })

          return () =>
            h(
              ElDialog,
              {
                modelValue: visible.value,
                'onUpdate:modelValue': (next: boolean) => (visible.value = next),
                title: config.title ?? '',
                width: config.width ?? '900px',
                top: '6vh',
                appendToBody: false,
                showClose: false,
                closeOnClickModal: false,
                closeOnPressEscape: false,
                class: 'field-dialog',
                onClose: () => {
                  visible.value = false
                  reject(new Error('cancel'))
                }
              },
              {
                default: () =>
                  h(component, {
                    ...props,
                    onOk: (value: R) => settle(value, true),
                    onCancel: () => settle(new Error('cancel'), false)
                  })
              }
            )
        }
      })

      app.use(useElement)
      app.mount(host)
    })
}
