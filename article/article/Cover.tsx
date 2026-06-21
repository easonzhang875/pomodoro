// Cover.tsx —— Bayer · 包豪斯封面
// 模板 D：三原色几何拼贴，视觉主体 = 前缀匹配缓存概念示意
// 修复：① 视觉元素直接表达"前缀匹配缓存断裂"概念
//       ② 封面标题与 Hero 标题不重复（钩子 ≠ 锚点）
// 外壳（3:4 比例 / 定位 / PDF 分页）不动

export function Cover() {
  return (
    <section
      className="ra-cover"
      aria-label="文章封面 —— 差一个字节，毁一条链"
      data-ra-cover=""
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "min(100%, 48rem, calc((100vh - 8rem) * 3 / 4))",
        margin: "0 auto var(--ra-space-7, 3rem) auto",
        aspectRatio: "3 / 4",
        overflow: "hidden",
        background: "var(--ra-color-bg, #faf8f2)",
        color: "var(--ra-color-fg, inherit)",
        borderRadius: "var(--ra-radius-md, 0)",
        border: "1px solid var(--ra-color-border, currentColor)",
        isolation: "isolate",
      }}
    >
      {/* ── 视觉主体：前缀匹配缓存 —— 令牌条带阵列 ── */}
      {/* 背景：暖纸面 */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: "var(--ra-color-bg, #faf8f2)",
        }}
      />

      {/* —— 缓存前缀带（蓝色）—— 表示成功缓存的 token 段 */}
      <CacheBar
        top="8%"
        left="6%"
        width="88%"
        height="7%"
        color="var(--ra-color-accent, #1d4ed8)"
        label="STATIC SYSTEM PROMPT + TOOLS"
        zIndex={1}
      />
      <CacheBar
        top="17%"
        left="6%"
        width="76%"
        height="7%"
        color="var(--ra-color-accent, #1d4ed8)"
        opacity={0.78}
        label="CLAUDE.MD"
        zIndex={1}
      />
      <CacheBar
        top="26%"
        left="6%"
        width="64%"
        height="7%"
        color="var(--ra-color-accent, #1d4ed8)"
        opacity={0.62}
        label="SESSION CONTEXT"
        zIndex={1}
      />
      <CacheBar
        top="35%"
        left="6%"
        width="52%"
        height="7%"
        color="var(--ra-color-accent, #1d4ed8)"
        opacity={0.48}
        label="CONVERSATION HISTORY"
        zIndex={1}
      />

      {/* —— 断裂点（红色窄条）—— 缓存在此断裂 */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "35%",
          left: "58%",
          width: "1.8%",
          height: "7%",
          background: "var(--ra-color-risk, #dc2626)",
          zIndex: 2,
        }}
      />

      {/* —— 失效段（灰色/低透明）—— 断裂之后全部失效需重算 */}
      <CacheBar
        top="35%"
        left="60%"
        width="32%"
        height="7%"
        color="var(--ra-color-muted, #999)"
        opacity={0.18}
        label=""
        zIndex={1}
      />

      {/* —— 底层额外缓存带（半透明，表现多层缓存的概念） */}
      <CacheBar
        top="46%"
        left="12%"
        width="76%"
        height="5%"
        color="var(--ra-color-accent, #1d4ed8)"
        opacity={0.3}
        label=""
        zIndex={1}
      />
      <CacheBar
        top="53%"
        left="12%"
        width="64%"
        height="5%"
        color="var(--ra-color-accent, #1d4ed8)"
        opacity={0.22}
        label=""
        zIndex={1}
      />
      <CacheBar
        top="60%"
        left="12%"
        width="52%"
        height="5%"
        color="var(--ra-color-accent, #1d4ed8)"
        opacity={0.14}
        label=""
        zIndex={1}
      />

      {/* —— 包豪斯几何点缀 —— */}
      {/* 蓝圆：结构点缀，呼应 Bayer 蓝圆编号 */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "16%",
          right: "8%",
          width: "14%",
          aspectRatio: "1",
          borderRadius: "50%",
          background: "var(--ra-color-accent, #1d4ed8)",
          opacity: 0.85,
          zIndex: 2,
        }}
      />
      {/* 黄方块：填充色块 */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "22%",
          left: "6%",
          width: "clamp(30px, 8vw, 88px)",
          aspectRatio: "1",
          background: "var(--ra-color-warning, #eab308)",
          zIndex: 2,
          opacity: 0.9,
        }}
      />

      {/* ── 文字层 ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "var(--ra-space-8, 4rem) var(--ra-space-6, 2rem) var(--ra-space-7, 3rem) var(--ra-space-6, 2rem)",
        }}
      >
        {/* Kicker */}
        <span
          style={{
            fontSize: "var(--ra-text-xs, 0.75rem)",
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            color: "var(--ra-color-fg, #1a1a1a)",
            opacity: 0.55,
            marginBottom: "var(--ra-space-2, 0.5rem)",
            fontWeight: "var(--ra-font-weight-bold, 700)",
          }}
        >
          Anthropic Claude Code · Engineering Report
        </span>

        {/* 主标题 —— 钩子式短句，与 Hero 完全不同 */}
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(2rem, 5.8vw, var(--ra-text-5xl, 4rem))",
            lineHeight: 1.06,
            fontWeight: "var(--ra-font-weight-bold, 700)",
            color: "var(--ra-color-fg, #1a1a1a)",
            maxWidth: "82%",
            letterSpacing: "-0.015em",
          }}
        >
          差一个字节，
          <br />
          毁一条链
        </h1>

        {/* 副题 —— 简短 teaser，不重复 Hero */}
        <p
          style={{
            margin: 0,
            marginTop: "var(--ra-space-4, 1rem)",
            fontSize: "var(--ra-text-sm, 0.95rem)",
            color: "var(--ra-color-muted, inherit)",
            maxWidth: "70%",
            lineHeight: 1.5,
          }}
        >
          一次缓存未命中 = 成本翻十倍。
          <br />
          读完这篇，你会用全新的眼光看待 Agent 的每一行系统提示词。
        </p>
      </div>

      {/* 底部装饰线 */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "5%",
          left: "6%",
          right: "6%",
          height: "2px",
          background: "var(--ra-color-fg, #1a1a1a)",
          zIndex: 2,
          opacity: 0.3,
        }}
      />
    </section>
  );
}

/** 缓存条带 —— 一条水平色块 + 可选标签 */
function CacheBar({
  top,
  left,
  width,
  height,
  color,
  opacity = 0.85,
  label,
  zIndex,
}: {
  top: string;
  left: string;
  width: string;
  height: string;
  color: string;
  opacity?: number;
  label: string;
  zIndex: number;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top,
        left,
        width,
        height,
        background: color,
        opacity,
        zIndex,
        display: "flex",
        alignItems: "center",
        justifyContent: label ? "flex-start" : "center",
        padding: label ? "0 clamp(6px, 1.2vw, 14px)" : 0,
      }}
    >
      {label ? (
        <span
          style={{
            fontSize: "clamp(0.45rem, 1.1vw, var(--ra-text-xs, 0.7rem))",
            letterSpacing: "0.16em",
            fontWeight: "var(--ra-font-weight-bold, 700)",
            color: "var(--ra-color-bg, #faf8f2)",
            mixBlendMode: "difference",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
