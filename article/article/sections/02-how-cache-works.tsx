import { Section, Raw } from "reacticle";

export function SectionHowCacheWorks() {
  return (
    <Section index="02" title="提示词缓存如何工作">
      <p>
        提示词缓存采用<strong>前缀匹配</strong>机制——API
        会缓存从请求开头一直到每个 <code>cache_control</code>{" "}
        断点之间的全部内容。这意味着，提示词中内容的排列顺序，几乎决定了一切。
      </p>

      <p>
        理解前缀匹配的最简单方式，是把它想象成一条很长的字符串。API
        从第一个字节开始逐字节比对：只要连续匹配，就用缓存；一旦在某个位置发现差异，该位置之后
        <strong>全部</strong>需要重新计算。
      </p>

      <Raw title="前缀匹配原理示意 · 一个字节的差异如何摧毁整个缓存链">
        <div
          style={{
            fontFamily: "var(--ra-font-mono, monospace)",
            fontSize: "var(--ra-text-sm, 0.9rem)",
            lineHeight: 1.8,
            padding: "var(--ra-space-5, 1.5rem)",
            background: "var(--ra-color-surface, #f5f2e8)",
            border: "1px solid var(--ra-color-border, currentColor)",
            overflow: "auto",
          }}
        >
          {/* 第一行：完整缓存前缀 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--ra-space-2, 0.5rem)",
              marginBottom: "var(--ra-space-2, 0.5rem)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "1.6em",
                height: "1.6em",
                borderRadius: "50%",
                background: "var(--ra-color-accent, #1d4ed8)",
                color: "var(--ra-color-bg, #faf8f2)",
                fontSize: "var(--ra-text-xs, 0.75rem)",
                fontWeight: "var(--ra-font-weight-bold, 700)",
                flexShrink: 0,
              }}
            >
              1
            </span>
            <span style={{ color: "var(--ra-color-muted, inherit)", fontSize: "var(--ra-text-xs, 0.75rem)" }}>
              请求 A（基线）：
            </span>
          </div>
          <div
            style={{
              padding: "var(--ra-space-3, 0.75rem)",
              background: "var(--ra-color-bg, #faf8f2)",
              marginBottom: "var(--ra-space-4, 1rem)",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <span style={{ color: "var(--ra-color-accent, #1d4ed8)" }}>
              {"{ sys: \"you are an agent\", tools: [read, write, bash], "}
            </span>
            <span style={{ color: "var(--ra-color-muted, inherit)", opacity: 0.6 }}>
              {"claude_md: \"# Project\", ctx: \"git: main\", msgs: [...]"}
            </span>
          </div>

          {/* 第二行：缓存命中 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--ra-space-2, 0.5rem)",
              marginBottom: "var(--ra-space-2, 0.5rem)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "1.6em",
                height: "1.6em",
                borderRadius: "50%",
                background: "var(--ra-color-accent, #1d4ed8)",
                color: "var(--ra-color-bg, #faf8f2)",
                fontSize: "var(--ra-text-xs, 0.75rem)",
                fontWeight: "var(--ra-font-weight-bold, 700)",
                flexShrink: 0,
              }}
            >
              2
            </span>
            <span style={{ color: "var(--ra-color-muted, inherit)", fontSize: "var(--ra-text-xs, 0.75rem)" }}>
              请求 B（缓存命中 ✓）—— 前缀完全一致：
            </span>
          </div>
          <div
            style={{
              padding: "var(--ra-space-3, 0.75rem)",
              background: "var(--ra-color-bg, #faf8f2)",
              marginBottom: "var(--ra-space-4, 1rem)",
            }}
          >
            <span style={{ color: "var(--ra-color-accent, #1d4ed8)" }}>
              {"{ sys: \"you are an agent\", tools: [read, write, bash], "}
            </span>
            <span style={{ color: "var(--ra-color-muted, inherit)", opacity: 0.6 }}>
              {"claude_md: \"# Project\", ctx: \"git: main\", "}
            </span>
            <span
              style={{
                background: "var(--ra-color-warning, #eab308)",
                color: "var(--ra-color-fg, #1a1a1a)",
                padding: "0 2px",
              }}
            >
              {"msgs: [...新的用户消息]"}
            </span>
            <span
              style={{
                marginLeft: "0.5em",
                fontSize: "var(--ra-text-xs, 0.75rem)",
                color: "var(--ra-color-accent, #1d4ed8)",
              }}
            >
              ← 缓存命中，仅新增部分需计算
            </span>
          </div>

          {/* 第三行：缓存断裂 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--ra-space-2, 0.5rem)",
              marginBottom: "var(--ra-space-2, 0.5rem)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "1.6em",
                height: "1.6em",
                borderRadius: "50%",
                background: "var(--ra-color-accent, #1d4ed8)",
                color: "var(--ra-color-bg, #faf8f2)",
                fontSize: "var(--ra-text-xs, 0.75rem)",
                fontWeight: "var(--ra-font-weight-bold, 700)",
                flexShrink: 0,
              }}
            >
              3
            </span>
            <span style={{ color: "var(--ra-color-muted, inherit)", fontSize: "var(--ra-text-xs, 0.75rem)" }}>
              请求 C（缓存断裂 ✗）—— 前缀在某处被修改：
            </span>
          </div>
          <div
            style={{
              padding: "var(--ra-space-3, 0.75rem)",
              background: "var(--ra-color-bg, #faf8f2)",
            }}
          >
            <span style={{ color: "var(--ra-color-accent, #1d4ed8)" }}>
              {"{ sys: \"you are an agent\", tools: [read, write, bash], "}
            </span>
            <span
              style={{
                background: "var(--ra-color-risk, #dc2626)",
                color: "var(--ra-color-bg, #faf8f2)",
                padding: "0 2px",
              }}
            >
              {"timestamp: \"2026-04-30T14:23:01Z\""}
            </span>
            <span style={{ color: "var(--ra-color-muted, inherit)", opacity: 0.3 }}>
              {" claude_md: ... ctx: ... msgs: ..."}
            </span>
            <span
              style={{
                marginLeft: "0.5em",
                fontSize: "var(--ra-text-xs, 0.75rem)",
                color: "var(--ra-color-risk, #dc2626)",
              }}
            >
              ← 时间戳破坏前缀，之后全部失效！
            </span>
          </div>
        </div>

        {/* 图例 */}
        <div
          style={{
            display: "flex",
            gap: "var(--ra-space-4, 1rem)",
            marginTop: "var(--ra-space-4, 1rem)",
            fontSize: "var(--ra-text-xs, 0.78rem)",
            flexWrap: "wrap",
          }}
        >
          <Legend color="var(--ra-color-accent, #1d4ed8)" label="缓存命中（前缀复用）" />
          <Legend color="var(--ra-color-warning, #eab308)" label="新增内容（需计算）" />
          <Legend color="var(--ra-color-risk, #dc2626)" label="破坏点（缓存失效）" />
          <Legend color="var(--ra-color-muted, inherit)" label="失效段（全量重算）" />
        </div>
      </Raw>

      <p>
        这个例子揭示了一个关键事实：缓存断裂的代价不是局部的。如果系统提示词中嵌入了动态时间戳，
        那么每次请求都从第一个字节开始就不同——整条缓存链从源头被摧毁。这就是为什么 Claude Code
        的提示词布局如此重要：<strong>静态内容必须放在最前面，动态内容必须推到末尾</strong>。
        这不仅是性能优化，它是整个 Agent 运行时架构的"重力法则"——任何违反它的设计，最终都会
        在规模化时付出成本代价。
      </p>

      <p>
        正是这个硬约束——逐字节前缀匹配——塑造了 Claude Code
        的几乎每一项架构决策。从工具定义到模型选择，从上下文压缩到会话管理，所有的设计都围绕
        一个核心问题展开：<strong>如何让缓存前缀尽可能长地保持稳定？</strong>
      </p>
    </Section>
  );
}

/** Bayer 风格图例：色块 + 标签 */
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35em" }}>
      <span
        style={{
          display: "inline-block",
          width: "0.85em",
          height: "0.85em",
          background: color,
          opacity: color.includes("muted") ? 0.3 : 0.85,
        }}
      />
      {label}
    </span>
  );
}
