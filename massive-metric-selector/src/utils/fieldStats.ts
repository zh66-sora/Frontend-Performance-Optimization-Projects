import type { FieldItem, FieldStats } from '../types'

/**
 * 模型层：字段详情数据的加载与缓存。
 * 组件只管渲染，数据靠这里加载并缓存，两者解耦，也不需要关系组件的生命周期。
 */
const TTL = 60_000
const cache = new Map<string, { at: number; data: FieldStats }>()

function hash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

function build(field: FieldItem): FieldStats {
  const h = hash(field.id)
  const trend = Array.from({ length: 7 }, (_, i) => 30 + ((h >> (i * 3)) % 70))
  const completeness = Array.from({ length: 5 }, (_, i) => 45 + ((h >> (i * 5)) % 55))
  return {
    used: 120 + (h % 880),
    departments: 3 + (h % 27),
    trend,
    completeness
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** 模拟一次异步取数：首次 260ms，命中缓存瞬间返回 */
export async function loadFieldStats(field: FieldItem): Promise<FieldStats> {
  const hit = cache.get(field.id)
  if (hit && Date.now() - hit.at < TTL) return hit.data

  await sleep(260)
  const data = build(field)
  cache.set(field.id, { at: Date.now(), data })
  return data
}

export const FIELD_STATS_LABELS = ['完整性', '规范率', '填报率', '及时性', '使用率']
