# Final Review · beautiful-article

## Visual Review

### Pass 项

1. **全面零斜体**：全部 8 个 Section 文件及 Cover/Article 中，`fontStyle: "italic"` 或 `font-style: italic` 出现 0 次，严格遵守 Bayer 协议级禁用斜体的规则。
2. **无阴影 / 无圆角 / 无渐变**：全篇 Raw 中 `boxShadow` / `shadow` 出现 0 次；除蓝圆编号的 `borderRadius: "50%"` 外，无任何 `borderRadius` 非零值；无紫粉渐变或霓虹色系。
3. **黄色绝不作文本色**：全篇 `var(--ra-color-warning)` 仅出现在 `background` 属性上，所有黄底块上的文字均使用 `var(--ra-color-fg)` 或 `var(--ra-color-heading)`（深色），符合「黄只作色块」约束。
4. **蓝实心圆编号体系**：Section 02/03/04/05/06 全部使用蓝色实心圆 `background: "var(--ra-color-accent)"` + `borderRadius: "50%"` 承载编号数字，Bayer 标识度极高。
5. **红色 = 风险语义准确**：`var(--ra-color-risk)` 仅用于缓存断裂点、失效指示、错误做法标注，未泛化为装饰色。
6. **无野生字体名**：全篇 Raw 中 `fontFamily` 均为 `var(--ra-font-mono)` / `var(--ra-font-sans)` / `var(--ra-font-body)` / `var(--ra-font-heading)`，零处写死字体名字符串。
7. **无野生独立 hex 颜色**：全部 hex 值（`#1d4ed8`、`#dc2626`、`#eab308`、`#faf8f2` 等）仅作为 `var(--ra-color-*, fallback)` 的第二参数出现，未出现独立写死的颜色。
8. **封面图文并茂、主题忠实**：Cover.tsx 用缓存条带 + 断裂点 + 几何点缀（蓝圆/黄方）直接表达"前缀匹配缓存断裂"概念，标题"差一个字节，毁一条链"与 Hero 标题无重复，所有颜色走 `--ra-*` token，比例用 `aspectRatio: "3/4"` + `maxWidth` 自适应。
9. **硬边方块气质一致**：全篇 Raw 中的色块、工具标签、数据大字报均为 `borderRadius: 0`（默认），无一处圆角矩形卡。
10. **代码块与表格风格统一**：CodeBlock 由 reacticle 组件库按 bayer 主题渲染（暖浅 surface + 发丝线、无暗窗），Table 组件风格一致，单元格内仅用 `--ra-color-risk` / `--ra-color-accent` 做语义着色。

### Fail 项

1. **`--by-yellow` 非标自定义变量 / 野生回退色**（`E:/first-cc-02/pomodoro/article/article/sections/03-layout.tsx`）
   - **行 33**：`borderBottom: "2px solid var(--by-yellow, #ffce1f)"`
   - **行 136**：`borderBottom: "2px solid var(--by-yellow, #ffce1f)"`
   - **行 177**：`borderBottom: "2px solid var(--by-yellow, #ffce1f)"`
   - **行 277**：`borderBottom: "2px solid var(--by-yellow, #ffce1f)"`
   - **行 377**：`borderBottom: "2px solid var(--by-yellow, #ffce1f)"`
   - **行 446**：`background: "var(--by-yellow, #ffce1f)"`
   - **行 538**：`color="var(--by-yellow, #ffce1f)"`（Legend 色块）
   - 共 7 处。`--by-yellow` 不在 ra-theme 标准 token 体系内；若主题未定义此变量，回退到硬编码 `#ffce1f`。应统一替换为 `var(--ra-color-warning, #eab308)`。

2. **硬编码 rgba 颜色（非 token 化）**（`E:/first-cc-02/pomodoro/article/article/sections/03-layout.tsx`）
   - **行 176**：`background: "rgba(31, 73, 192, 0.09)"`（CLAUDE.md 层背景）
   - **行 276**：`background: "rgba(31, 73, 192, 0.05)"`（会话上下文层背景）
   - **行 526**：`color="rgba(31, 73, 192, 0.09)"`（Legend：项目级缓存层）
   - **行 530**：`color="rgba(31, 73, 192, 0.05)"`（Legend：会话级缓存层）
   - 共 4 处。`rgba(31, 73, 192, ...)` 与 `#1f49c0`（accent fallback）近似但不一致。应统一为 `var(--ra-color-accent)` 配合 `opacity` 属性，或使用主题层的半透明 token（如 `--ra-color-accent-soft` / `--ra-color-accent-muted`）。

3. **移动端：固定 2 列 Grid 无响应式断点**（`E:/first-cc-02/pomodoro/article/article/sections/04-lesson-1-2.tsx`）
   - **行 51**：`gridTemplateColumns: "1fr 1fr"`。「错误 vs 正确」两栏对比在窄视口（<480px）将被挤压到每栏不足 200px，代码级伪代码文字不可读。应增加 `@media` 或使用 `auto-fill / minmax` 使窄屏自动坍缩为单列。

4. **移动端：固定 2 列 Flex 无 wrap**（`E:/first-cc-02/pomodoro/article/article/sections/06-lesson-5-6.tsx`）
   - **行 86-89**：两栏流程对比（天真做法 vs Cache-Safe Forking）使用 `display: "flex"` + `flex: 1`，无 `flexWrap`、无响应式回退。在 <600px 视口下 FlowStep 文字被压缩至难以阅读。

5. **移动端：固定 3 列 Grid 无响应式断点**（`E:/first-cc-02/pomodoro/article/article/sections/07-economics.tsx`）
   - **行 21**：`gridTemplateColumns: "repeat(3, 1fr)"`。三块数据大字报（3 亿 / 9100 万 / 10%）在 <640px 视口下将被挤压到极窄，大数字 display 字体无法正常展示。应增加响应式断点（如 `min(100%, ...)` 或 `@media` 媒体查询坍缩为单列）。

### 必须修复

1. **替换 `--by-yellow` → `--ra-color-warning`**：`E:/first-cc-02/pomodoro/article/article/sections/03-layout.tsx` 行 33、136、177、277、377、446、538，共 7 处。回退色同步改为 `#eab308`（与全篇其他 warning fallback 一致）。

2. **替换硬编码 rgba → token + opacity**：`E:/first-cc-02/pomodoro/article/article/sections/03-layout.tsx` 行 176、276、526、530，共 4 处。改为 `background: "var(--ra-color-accent)"` 配合 `opacity: 0.09`（或 0.05），或在主题层确保 `--ra-color-accent-soft` / `--ra-color-accent-muted` 存在并使用之。

3. **为全篇 Raw 中的多列布局添加响应式回退**：
   - `04-lesson-1-2.tsx:51`：Grid 双列 → 添加 `min(100%, ...)` 或 CSS `@media (max-width: 480px) { gridTemplateColumns: 1fr }`。
   - `06-lesson-5-6.tsx:86-89`：Flex 双列 → 添加 `flexWrap: "wrap"` 并为子元素设 `minWidth`（如 `minWidth: "280px"`）。
   - `07-economics.tsx:21`：Grid 三列 → 改为 `gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))"` 或同等响应式语法。

### 建议改进

1. **黄圆编号偏离蓝圆体系**（`E:/first-cc-02/pomodoro/article/article/sections/05-lesson-3-4.tsx`，行 214）：计划模式步骤编号 2 使用了黄色圆形 `background: "var(--ra-color-warning, #eab308)"`。全篇其他所有步骤编号均用蓝圆（accent），此处虽语义上是"模式状态"而非"章节序号"，但视觉上仍构成不一致。建议改为蓝圆，或使用方形标记区分模式状态（方形可区分于圆形的章节编号体系）。

2. **`CacheLegend` 函数中脆弱字符串匹配**（`E:/first-cc-02/pomodoro/article/article/sections/04-lesson-1-2.tsx`，行 317-318）：`color.includes("accent") || color.includes("1d4ed8")` 通过检查颜色字符串内容来判断类型，对 token 重命名或 fallback 值变更敏感。建议改为传入显式的 `variant` prop（如 `"hit" | "miss" | "new"`）。

3. **03-layout 层叠结构 Overflow**（`E:/first-cc-02/pomodoro/article/article/sections/03-layout.tsx`，行 23）：外层容器设 `overflow: "hidden"`，右侧元信息列 `minWidth: "10rem"`（约 160px），在视口 <540px 时左侧编号圆 + 中间内容 + 右侧 10rem 元信息将超出容器导致内容被裁剪。建议将 `overflow: "hidden"` 改为 `overflow: "auto"`，或为右侧元信息列添加 `@media` 下隐藏/折叠规则。

4. **Cover.tsx 中 `borderRadius` 存在圆角风险**（`E:/first-cc-02/pomodoro/article/article/Cover.tsx`，行 22）：`borderRadius: "var(--ra-radius-md, 0)"`。若主题层 `--ra-radius-md` 被意外设为非零值，封面会出现圆角矩形，破坏 Bayer 硬边气质。建议直接写死 `borderRadius: 0`，此为 Bayer 协议级硬约束。

5. **数据大字报缺少数字单位可达性**（`E:/first-cc-02/pomodoro/article/article/sections/07-economics.tsx`，行 40-174）："3 亿" "9100 万" "10%" 作为装饰性大字存在，但对屏幕阅读器仅呈现为视觉文字。建议为每个数据块添加 `aria-label`（如 `aria-label="每周通过缓存节省约 3 亿 token"`）以确保可访问性。
