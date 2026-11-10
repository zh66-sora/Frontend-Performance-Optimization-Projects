# 指标选择器 · Vue3 + TS 性能验证

2235 个字段的电子病历字段选择器，同一套业务代码可切换 4 个性能阶段，右下角实时显示浏览器真实指标。
素材来源：`Desktop/前端/项目/指标选择器`（笔记 + 逐字稿），UI 按用户提供的截图复刻。

## 运行

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # vue-tsc --noEmit + vite build
```

## 结构

| 文件 | 作用 |
| --- | --- |
| `src/App.vue` | 对比页：4 阶段切换、已选结果、指标面板 |
| `src/components/FieldSelector.vue` | 弹框内容：搜索、左侧锚点菜单、分组、滚动联动 |
| `src/components/FieldRenderer.vue` | 字段的四种渲染方式（静态 tooltip / 动态浮层 / el-button / span） |
| `src/components/XTooltip.vue` | hover 才挂载的浮层，Teleport + fixed 定位，非悬浮状态零节点 |
| `src/components/FieldDetail.vue` | 浮层内容：文本 + 折线 + 雷达（手写 canvas） |
| `src/utils/createPromiseDialog.ts` | `createApp + h` 动态弹框，ok/cancel → resolve/reject，转场后 unmount |
| `src/utils/defineLazy.ts` | 高阶组件：IntersectionObserver + 高度占位 + 延迟渲染 |
| `src/utils/fieldStats.ts` | 数据层：模拟异步取数 + TTL 缓存，组件与数据解耦 |
| `src/utils/useMetrics.ts` | 打开耗时 / DOM 节点 / 长任务 / 帧间隔采样 |
| `src/data/fields.ts` | 2235 条字段数据（真实病历词汇 + 时点/来源维度扩展） |

## 4 个阶段

1. **基线**：`el-tooltip + el-button × 2235`，一次性渲染。
2. **tooltip 动态化**：浮层 `v-if`，hover 时才创建；字段仍是 `el-button`。
3. **惰性分块**：每个分组包高阶组件，`IntersectionObserver`（rootMargin 400px），离开视口记住真实高度后隐藏，防塌陷。
4. **mini + 防抖**：`span` 替代 `el-button`；进入视口延迟 80ms 渲染，快速滚动时允许白屏换流畅。

## 实测数据（Chrome，本机，单次采样）

| 阶段 | 打开耗时 | 长任务 | 弹框内节点 |
| --- | --- | --- | --- |
| 基线 | 1049 ms | 1014 ms | 4680 |
| 优化 1 | 350 ms | 322 ms | 4680 |
| 优化 2 | 14 ms | 0 | 414 |
| 优化 3 | 17 ms | 0 | 357 |

单帧成本（500 个字段同步渲染取 3 次中位数）：`el-button` 58.9 ms → `span` 25.8 ms。

基线那 1014 ms 长任务 = 点击后整页无响应；阶段 3/4 打开无长任务，成本挪到滚动时按需渲染。
总成本守恒，优化的是「什么时候付」。

复跑基准：页面里 `window.__fieldBench.sample(500, 3)`。

## 与原始笔记的差异

- 笔记里「3000 个 el-tooltip 要 3.6s」是 Vue2 + element-ui 的量级。element-plus 的 el-tooltip 内容本身惰性（实测常驻 popper 只有 1 个），所以基线降到约 1s；要复现 3.6s 得退回 Vue2 + element-ui。
- 笔记用 `el-popover` 虚拟触发做动态浮层，这里手写 `XTooltip`：少一层组件、挂载时机完全可控，性能结论一致。
- 字段数据按截图「共 2235 个字段」生成，共 11 个分类 40 个分组。
