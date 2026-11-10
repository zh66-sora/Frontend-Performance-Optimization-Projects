export type Stage = 1 | 2 | 3 | 4

export interface FieldItem {
  id: string 
  label: string
  categoryKey: string
  groupTitle: string
  type: FieldType
  unit?: string
  desc: string
}

export type FieldType = '文本' | '数值' | '日期' | '枚举' | '布尔' | '编码'

export interface FieldGroup {
  title: string
  children: FieldItem[]
}

export interface CategoryNode {
  key: string
  title: string
  children: FieldGroup[]
  count: number
}

export interface FieldStats {
  used: number
  departments: number
  completeness: number[]
  trend: number[]
}

export type SelectorProps = {
  stage: Stage
  selected: string[]
  onReady?: () => void
}
