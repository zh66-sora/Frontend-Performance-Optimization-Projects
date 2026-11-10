<script setup lang="ts">
import { computed, nextTick, onMounted, provide, ref, watch } from 'vue'
import type { CategoryNode, FieldItem, Stage } from '../types'
import { FIELD_CATEGORIES, MENU_ITEMS, SEARCH_HISTORY } from '../data/fields'
import { defineLazy, SCROLL_ROOT } from '../utils/defineLazy'
import FieldList from './FieldList.vue'

const props = defineProps<{
  stage: Stage
  selected: string[]
}>()

const emit = defineEmits<{
  (e: 'ok', value: string[]): void
  (e: 'cancel'): void
  (e: 'ready'): void
}>()

const TYPE_OPTIONS = ['文本', '数值', '日期', '枚举', '布尔', '编码']

const LazyFieldList = defineLazy(FieldList, { perRow: 8, rowHeight: 30 })

const LABEL_BY_ID = new Map<string, string>()
for (const category of FIELD_CATEGORIES) {
  for (const group of category.children) {
    for (const field of group.children) LABEL_BY_ID.set(field.id, field.label)
  }
}

const scrollRef = ref<HTMLElement | null>(null)
provide(SCROLL_ROOT, () => scrollRef.value)

// 搜索
const kwInput = ref('')
const keyword = ref('')
const typeFilter = ref('all')

let kwTimer: number | undefined
watch(kwInput, (value) => {
  if (kwTimer !== undefined) window.clearTimeout(kwTimer)
  kwTimer = window.setTimeout(() => {
    keyword.value = value.trim().toLowerCase()
  }, 200)
})

const activeKey = ref('history')
const picked = ref(new Set<string>(props.selected))
const pickedSet = computed(() => new Set(picked.value))

// 渲染策略
const fieldMode = computed<'ep' | 'mini'>(() => (props.stage >= 4 ? 'mini' : 'ep'))
const tooltipMode = computed<'static' | 'lazy'>(() => (props.stage === 1 ? 'static' : 'lazy'))
const lazyDelay = computed(() => (props.stage >= 4 ? 80 : 0))

// 过滤
const filtered = computed<CategoryNode[]>(() => {
  const kw = keyword.value
  const type = typeFilter.value
  if (!kw && type === 'all') return FIELD_CATEGORIES

  return FIELD_CATEGORIES.map((category) => {
    const groups = category.children
      .map((group) => ({
        title: group.title,
        children: group.children.filter(
          (field) =>
            (!kw || field.label.toLowerCase().includes(kw)) && (type === 'all' || field.type === type)
        )
      }))
      .filter((group) => group.children.length)

    return {
      ...category,
      children: groups,
      count: groups.reduce((sum, group) => sum + group.children.length, 0)
    }
  }).filter((category) => category.count > 0)
})

const total = computed(() => filtered.value.reduce((sum, category) => sum + category.count, 0))

function toggle(field: FieldItem) {
  const next = new Set(picked.value)
  if (next.has(field.id)) next.delete(field.id)
  else next.add(field.id)
  picked.value = next
}

function confirm() {
  const labels = [...picked.value]
    .map((id) => LABEL_BY_ID.get(id))
    .filter((label): label is string => Boolean(label))
  emit('ok', labels)
}

let ticking = false

function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    ticking = false
    const scroller = scrollRef.value
    if (!scroller) return
    const line = scroller.scrollTop + 60
    let current = 'history'
    for (const category of filtered.value) {
      const el = document.getElementById(`cat-${category.key}`)
      if (el && el.offsetTop <= line) current = category.key
    }
    activeKey.value = current
  })
}

function goto(key: string) {
  activeKey.value = key
  const scroller = scrollRef.value
  if (!scroller) return
  if (key === 'history' || key === 'favorite') {
    scroller.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  const el = document.getElementById(`cat-${key}`)
  if (el) scroller.scrollTo({ top: Math.max(0, el.offsetTop - 8), behavior: 'smooth' })
}

onMounted(() => {
  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => emit('ready'))
    })
  })
})
</script>

<template>
  <div class="selector" :data-stage="stage">
    <div class="sel-head">
      <div class="kw">
        <input v-model="kwInput" class="kw-input" placeholder="请输入关键词查找筛选字段" />
        <button class="kw-btn" type="button" aria-label="搜索">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M16.5 16.5 21 21" stroke-linecap="round" />
          </svg>
        </button>
      </div>
      <span class="count">共 {{ total }} 个字段</span>
      <span class="spacer" />
      <el-select v-model="typeFilter" class="type-select">
        <el-option label="全部字段" value="all" />
        <el-option v-for="type in TYPE_OPTIONS" :key="type" :label="type" :value="type" />
      </el-select>
      <button class="close-x" type="button" aria-label="关闭" @click="emit('cancel')">×</button>
    </div>

    <div class="sel-body">
      <aside class="sel-menu">
        <div
          v-for="item in MENU_ITEMS"
          :key="item.key"
          class="menu-item"
          :class="{ active: activeKey === item.key }"
          @click="goto(item.key)"
        >
          {{ item.title }}
        </div>
      </aside>

      <div ref="scrollRef" class="sel-content" @scroll.passive="onScroll">
        <section class="block">
          <div class="block-head">
            <h3>搜索历史</h3>
            <button class="link-btn" type="button">清空历史</button>
          </div>
          <div class="fields">
            <span v-for="item in SEARCH_HISTORY" :key="item" class="field">{{ item }}</span>
          </div>
        </section>

        <section class="block">
          <h3>收藏信息</h3>
          <div class="fields">
            <span class="fav-tag">标签名称</span>
          </div>
        </section>

        <section v-for="category in filtered" :id="`cat-${category.key}`" :key="category.key" class="cat">
          <h1>{{ category.title }}</h1>
          <div v-for="(group, index) in category.children" :key="`${category.key}-${index}`" class="group">
            <h2>{{ group.title }}</h2>

            <FieldList
              v-if="stage <= 2"
              :fields="group.children"
              :mode="fieldMode"
              :tooltip="tooltipMode"
              :picked-set="pickedSet"
              @pick="toggle"
            />
            <LazyFieldList
              v-else
              :fields="group.children"
              :mode="fieldMode"
              :tooltip="tooltipMode"
              :delay="lazyDelay"
              :picked-set="pickedSet"
              :on-pick="toggle"
            />
          </div>
        </section>
      </div>
    </div>

    <footer class="sel-foot">
      <span class="picked-count">已选 {{ picked.size }} 个字段</span>
      <div class="foot-btns">
        <el-button @click="emit('cancel')">取消</el-button>
        <el-button type="primary" @click="confirm">确定</el-button>
      </div>
    </footer>
  </div>
</template>
