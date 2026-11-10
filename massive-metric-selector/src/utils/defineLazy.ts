import {
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  ref,
  type Component,
  type InjectionKey,
  type PropType,
  type Ref
} from 'vue'
import type { FieldItem } from '../types'

/** 滚动容器：由选择器 provide，惰性组件靠它判断「是否进入视口」 */
export const SCROLL_ROOT: InjectionKey<() => HTMLElement | null> = Symbol('scroll-root')

export interface LazyOptions {
  /** 视口外多少像素就开始提前渲染，作为缓冲区 */
  rootMargin?: string
  /** 首次占位高度，防塌陷；不传则按字段数估算 */
  placeholderHeight?: number
  /** 每次渲染多少字段为一行，用于估算占位高度 */
  perRow?: number
  rowHeight?: number
}

export function defineLazy(component: Component, options: LazyOptions = {}) {
  const perRow = options.perRow ?? 8
  const rowHeight = options.rowHeight ?? 30

  return defineComponent({
    name: 'LazyProxy',
    props: {
      fields: { type: Array as PropType<FieldItem[]>, default: () => [] },
      mode: { type: String as PropType<'ep' | 'mini'>, default: 'ep' },
      tooltip: { type: String as PropType<'static' | 'lazy'>, default: 'lazy' },
      /** 进入视口后的延迟渲染时间，用于快速滚动时降频（宁可白屏） */
      delay: { type: Number, default: 0 },
      pickedSet: { type: Object as PropType<Set<string>>, default: () => new Set<string>() },
      onPick: { type: Function as PropType<(field: FieldItem) => void>, default: undefined }
    },
    setup(props) {
      const resolvedRoot = inject(SCROLL_ROOT, () => null)

      const show = ref(false)
      const height = ref(
        options.placeholderHeight ??
          Math.ceil(props.fields.length / perRow) * rowHeight + rowHeight
      )

      const host = ref<HTMLElement | null>(null) as Ref<HTMLElement | null>
      let observer: IntersectionObserver | null = null
      let timer: number | undefined

      const clearTimer = () => {
        if (timer !== undefined) {
          window.clearTimeout(timer)
          timer = undefined
        }
      }

      const onIntersect = (entries: IntersectionObserverEntry[]) => {
        const entry = entries[entries.length - 1]
        if (!entry) return

        if (entry.isIntersecting) {
          clearTimer()
          const delay = props.delay
          if (delay > 0) {
            timer = window.setTimeout(() => {
              show.value = true
              timer = undefined
            }, delay)
          } else {
            show.value = true
          }
        } else {
          clearTimer()
          if (show.value) {
            // 离开视口不销毁节点，而是记住真实高度后隐藏，避免高度塌陷引起重排
            height.value = host.value?.offsetHeight || height.value
            show.value = false
          }
        }
      }

      onMounted(() => {
        const root = resolvedRoot()
        observer = new IntersectionObserver(onIntersect, {
          root,
          rootMargin: options.rootMargin ?? '400px 0px',
          threshold: 0
        })
        if (host.value) observer.observe(host.value)
      })

      onBeforeUnmount(() => {
        clearTimer()
        observer?.disconnect()
        observer = null
      })

      return () =>
        h(
          'div',
          {
            ref: host,
            class: 'lazy-host',
            'data-lazy': show.value ? 'on' : 'off',
            style: show.value ? undefined : { height: `${height.value}px` }
          },
          show.value
            ? [
                h(component, {
                  fields: props.fields,
                  mode: props.mode,
                  tooltip: props.tooltip,
                  pickedSet: props.pickedSet,
                  onPick: props.onPick
                })
              ]
            : []
        )
    }
  })
}
