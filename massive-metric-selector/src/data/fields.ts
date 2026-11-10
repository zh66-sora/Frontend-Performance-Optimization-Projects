import type { CategoryNode, FieldGroup, FieldItem, FieldType } from '../types'

interface SeedGroup {
  title: string
  seeds: string[]
}

/** 时点维度：用于可测量、可重复采集的字段 */
const TIME_VARIANTS = [
  '',
  '（入院首次）',
  '（出院末次）',
  '（术前）',
  '（术后第1天）',
  '（24h内）',
  '（近3次）',
  '（异常值）',
  '（长期医嘱）',
  '（临时医嘱）',
  '（首次）',
  '（末次）',
  '（本年度）',
  '（近一季度）',
  '（本月）'
]

/** 来源维度：用于姓名、编码、状态这类不可重复的字段 */
const SOURCE_VARIANTS = [
  '',
  '（HIS）',
  '（EMR）',
  '（LIS）',
  '（PACS）',
  '（门诊）',
  '（住院）',
  '（急诊）',
  '（体检）',
  '（随访）',
  '（护理）',
  '（手术）'
]

const NOMINAL = /姓名|性别|民族|国籍|职业|类型|标志|编码|代码|号码|关系|名称|科室|医师|护士|地址|单位|病名|证候|级别|等级|状态|方式|结论|所见|结果|号$/

const FIELD_TYPES: FieldType[] = ['文本', '数值', '日期', '枚举', '布尔', '编码']
const UNITS = ['次', '天', 'mm', 'ml', 'g/L', 'mmol/L', '%', '岁', 'kg']

function hash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

function split(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  const raw = weights.map((w) => Math.floor((total * w) / sum))
  let rest = total - raw.reduce((a, b) => a + b, 0)
  let i = 0
  while (rest > 0) {
    raw[i % raw.length] += 1
    rest -= 1
    i += 1
  }
  return raw
}

function buildCategory(key: string, title: string, target: number, groups: SeedGroup[]): CategoryNode {
  const quota = split(target, groups.map((g) => g.seeds.length))
  const children: FieldGroup[] = groups.map((group, gi) => {
    const want = Math.max(1, quota[gi])
    const items: FieldItem[] = []
    for (let i = 0; i < want; i++) {
      const base = group.seeds[i % group.seeds.length]
      const pool = NOMINAL.test(base) ? SOURCE_VARIANTS : TIME_VARIANTS
      const variant = pool[Math.floor(i / group.seeds.length) % pool.length]
      const label = variant ? `${base}${variant}` : base
      const h = hash(`${key}|${group.title}|${label}`)
      const type = FIELD_TYPES[h % FIELD_TYPES.length]
      items.push({
        id: `${key}-${gi}-${i}`,
        label,
        categoryKey: key,
        groupTitle: group.title,
        type,
        unit: type === '数值' ? UNITS[h % UNITS.length] : undefined,
        desc: `${label}用于${title}相关筛选与统计，来源 HIS 系统，更新频率 T+1。`
      })
    }
    return { title: group.title, children: items }
  })
  return { key, title, children, count: children.reduce((s, g) => s + g.children.length, 0) }
}

const PATIENT: SeedGroup[] = [
  {
    title: '基础个人信息',
    seeds: ['患者姓名', '年龄', '性别', '联系电话', '出生日期', '民族', '证件类型', '国籍', '职业', '籍贯', '婚姻状况', '文化程度', '现住址', '户口地址', '工作单位', '联系人姓名', '联系人电话', '与联系人关系']
  },
  {
    title: '患者标识',
    seeds: ['患者编号', '住院号', '门诊号', '病案号', '医保卡号', '就诊卡号', '身份证号', '死亡标志', '出生地', '参保类型']
  },
  {
    title: '入院信息',
    seeds: ['入院时间', '入院科室', '入院方式', '入院病情', '入院诊断', '转科次数', '转入科室', '出院时间', '出院科室', '出院方式', '住院天数', '实际住院天数']
  },
  {
    title: '就诊信息',
    seeds: ['就诊类型', '就诊卡类型', '挂号科室', '挂号医生', '挂号时间', '就诊序号', '是否初诊', '是否复诊', '是否急诊', '是否转诊']
  }
]

const FRONTPAGE: SeedGroup[] = [
  {
    title: '首页基本信息',
    seeds: ['病案首页编号', '医疗机构名称', '组织机构代码', '医疗付费方式', '健康卡号', '病案质量等级', '质控医师', '质控护士', '质控日期', '填报日期']
  },
  {
    title: '诊断信息',
    seeds: ['主要诊断名称', '主要诊断编码', '入院诊断编码', '出院诊断名称', '其他诊断名称', '病理诊断名称', '病理诊断编码', '损伤中毒外部原因', '疾病编码版本', '诊断符合情况']
  },
  {
    title: '手术信息',
    seeds: ['主要手术名称', '主要手术编码', '手术日期', '手术级别', '切口类型', '麻醉方式', '麻醉医师', '手术医师', '是否择期手术', '手术并发症']
  },
  {
    title: '费用信息',
    seeds: ['总费用', '自付费用', '医保支付费用', '西药费', '中药费', '手术费', '检查费', '化验费', '床位费', '护理费', '材料费', '输血费']
  },
  {
    title: '医师信息',
    seeds: ['主任医师', '主治医师', '住院医师', '进修医师', '实习医师', '编码员', '责任护士']
  }
]

const RECORD: SeedGroup[] = [
  {
    title: '入院记录',
    seeds: ['主诉', '现病史', '既往史', '个人史', '家族史', '婚育史', '月经史', '体格检查', '专科检查', '初步诊断', '记录时间', '记录医师']
  },
  {
    title: '病程记录',
    seeds: ['首次病程记录', '日常病程记录', '上级医师查房记录', '疑难病例讨论记录', '会诊记录', '抢救记录', '阶段小结', '交班记录', '转科记录', '死亡记录']
  },
  {
    title: '手术记录',
    seeds: ['术前讨论记录', '术前小结', '手术记录', '麻醉记录', '术后首次病程', '手术安全核查', '术中失血量', '术中输血量']
  },
  {
    title: '出院记录',
    seeds: ['出院诊断', '出院情况', '出院医嘱', '出院带药', '复诊时间', '出院记录时间', '随访计划']
  },
  {
    title: '护理记录',
    seeds: ['护理级别', '生命体征记录', '护理评估单', '跌倒风险评分', '压疮风险评分', '疼痛评分', '约束带使用记录']
  }
]

const DIAGNOSIS: SeedGroup[] = [
  {
    title: '西医诊断',
    seeds: ['诊断名称', '诊断编码', '诊断类型', '诊断依据', '确诊日期', '诊断科室', '诊断医师', '是否院内感染', '是否并发症', '转归情况']
  },
  {
    title: '中医诊断',
    seeds: ['中医病名', '中医证候', '中医诊断编码', '证候分类', '治则治法']
  },
  {
    title: '病理诊断',
    seeds: ['病理号', '病理类型', '分化程度', '免疫组化结果', '送检部位', '送检日期', '报告日期', '病理分期']
  },
  {
    title: '并发症',
    seeds: ['并发症名称', '并发症编码', '发生日期', '严重程度', '处理措施', '是否延长住院']
  },
  {
    title: '入院病情',
    seeds: ['入院病情等级', '是否危重', '是否抢救', '抢救次数', '抢救成功次数']
  }
]

const SYMPTOM: SeedGroup[] = [
  {
    title: '一般症状',
    seeds: ['发热', '乏力', '消瘦', '食欲减退', '盗汗', '水肿', '头晕', '头痛', '心悸', '气促']
  },
  {
    title: '呼吸系统',
    seeds: ['咳嗽', '咳痰', '咯血', '胸痛', '呼吸困难', '喘息', '声音嘶哑']
  },
  {
    title: '消化系统',
    seeds: ['腹痛', '腹胀', '恶心', '呕吐', '腹泻', '便秘', '黑便', '呕血', '黄疸']
  },
  {
    title: '神经系统',
    seeds: ['意识障碍', '抽搐', '肢体无力', '感觉异常', '言语不清', '视力下降', '耳鸣']
  },
  {
    title: '体征',
    seeds: ['体温', '脉搏', '呼吸频率', '血压', '身高', '体重', '体质指数', '神志状态', '皮肤黏膜']
  }
]

const ORDER: SeedGroup[] = [
  {
    title: '药品信息',
    seeds: ['药品名称', '药品编码', '药品规格', '剂型', '药品类别', '是否抗菌药物', '是否基药', '是否高值', '生产厂家', '医保等级']
  },
  {
    title: '用法用量',
    seeds: ['单次剂量', '剂量单位', '给药途径', '给药频次', '用药疗程', '滴速', '溶媒名称', '溶媒用量']
  },
  {
    title: '用药时间',
    seeds: ['开嘱时间', '停嘱时间', '执行时间', '首次用药时间', '末次用药时间', '医嘱状态', '医嘱类型', '开嘱医师', '执行护士']
  },
  {
    title: '抗菌药物',
    seeds: ['抗菌药物分级', '使用目的', '联合用药', '微生物送检', '用药前送检', '会诊意见']
  },
  {
    title: '输液',
    seeds: ['输液批次', '输液组号', '输液量', '输液速度', '输液反应', '静脉通路类型']
  }
]

const OPERATION: SeedGroup[] = [
  {
    title: '手术基本信息',
    seeds: ['手术名称', '手术编码', '手术日期', '手术开始时间', '手术结束时间', '手术时长', '手术台次', '手术间', '手术级别', '手术类型']
  },
  {
    title: '麻醉信息',
    seeds: ['麻醉方式', '麻醉开始时间', '麻醉结束时间', '麻醉医师', 'ASA分级', '麻醉并发症']
  },
  {
    title: '术中情况',
    seeds: ['术中出血量', '术中输血量', '术中输液量', '术中用药', '术中意外事件', '植入物名称', '植入物编码']
  },
  {
    title: '术后情况',
    seeds: ['术后去向', '术后镇痛方式', '术后并发症', '切口愈合等级', '拆线日期', '术后住院天数']
  }
]

const LAB: SeedGroup[] = [
  {
    title: '血常规',
    seeds: ['白细胞计数', '红细胞计数', '血红蛋白', '血小板计数', '中性粒细胞百分比', '淋巴细胞百分比', '红细胞压积', '平均红细胞体积']
  },
  {
    title: '生化',
    seeds: ['谷丙转氨酶', '谷草转氨酶', '总胆红素', '直接胆红素', '白蛋白', '肌酐', '尿素氮', '血糖', '血钾', '血钠', '血氯', '总胆固醇']
  },
  {
    title: '凝血',
    seeds: ['凝血酶原时间', '活化部分凝血活酶时间', '纤维蛋白原', 'D-二聚体', '国际标准化比值']
  },
  {
    title: '尿常规',
    seeds: ['尿蛋白', '尿糖', '尿潜血', '尿白细胞', '尿比重', '尿pH值', '尿镜检红细胞']
  },
  {
    title: '免疫',
    seeds: ['乙肝表面抗原', '丙肝抗体', '梅毒抗体', 'HIV抗体', 'C反应蛋白', '降钙素原', '免疫球蛋白E']
  },
  {
    title: '微生物',
    seeds: ['培养标本类型', '培养结果', '菌种名称', '药敏结果', '多重耐药标志']
  }
]

const EXAM: SeedGroup[] = [
  {
    title: '心电图',
    seeds: ['心电图结论', '心率', 'PR间期', 'QRS时限', 'QT间期', 'ST段改变', '检查报告时间']
  },
  {
    title: '超声',
    seeds: ['超声部位', '超声所见', '超声结论', '超声医师', '检查时间', '左室射血分数']
  },
  {
    title: '影像',
    seeds: ['影像检查项目', '影像所见', '影像结论', '影像号', '曝光剂量', '增强扫描标志', '报告医师']
  },
  {
    title: '内镜',
    seeds: ['内镜类型', '内镜所见', '内镜结论', '活检部位', '活检数量']
  },
  {
    title: '病理检查',
    seeds: ['送检标本', '标本性状', '取材部位', '报告时间']
  }
]

export const FIELD_CATEGORIES: CategoryNode[] = [
  buildCategory('patient', '患者', 180, PATIENT),
  buildCategory('frontpage', '病案首页', 240, FRONTPAGE),
  buildCategory('record', '病历', 220, RECORD),
  buildCategory('diagnosis', '诊断', 260, DIAGNOSIS),
  buildCategory('symptom', '症状', 150, SYMPTOM),
  buildCategory('order', '用药医嘱', 320, ORDER),
  buildCategory('operation', '手术', 210, OPERATION),
  buildCategory('lab', '检验', 420, LAB),
  buildCategory('exam', '检查', 235, EXAM)
]

export const FIELD_TOTAL = FIELD_CATEGORIES.reduce((s, c) => s + c.count, 0)

export const MENU_ITEMS = [
  { key: 'history', title: '搜索历史' },
  { key: 'favorite', title: '收藏信息' },
  ...FIELD_CATEGORIES.map((c) => ({ key: c.key, title: c.title }))
]

export const SEARCH_HISTORY = [
  '手术类型',
  '全血',
  '估计失血',
  '主刀医师姓名',
  '心电图-检查报告时间',
  '入院时间（24h内入出院记录）',
  '出生日期',
  '手术优先级',
  '是否做过超声'
]
