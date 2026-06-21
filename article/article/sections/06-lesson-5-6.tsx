import { Section, Quote, Raw } from "reacticle";

export function SectionLesson56() {
  return (
    <Section index="06" title="经验五 & 六：安全压缩 + 像监控可用性一样监控缓存">
      {/* ── 经验五：缓存安全的分叉 ── */}
      <p>
        当一个 Claude Code 会话填满上下文窗口时，必须进行压缩（compaction）——将对话历史总结为
        摘要，以便在新会话中继续。这个操作看似简单，实则暗藏一个巨大的成本陷阱。
      </p>

      <p>
        天真的做法：发起一个独立 API 调用，使用不同于主会话的系统提示词，比如一句简单的
        "请总结以下对话"。逻辑上毫无问题——但经济上是一场灾难。因为提示词缓存是前缀匹配的，
        使用不同的系统提示词意味着<strong>没有任何</strong>已缓存的对话内容能被复用，
        你将为整个对话历史支付全额的、未经缓存的输入价格。对于可能长达数十万 token 的对话，
        这足以将一次压缩变成一笔可观的账单。
      </p>

      <p>
        Claude Code 的解决方案称为<strong>缓存安全的分叉（Cache-Safe Forking）</strong>，
        其核心思想极具巧思——压缩请求使用与父会话<strong>完全相同的</strong>系统提示词、
        用户上下文、系统上下文和工具定义。它将父会话的对话消息作为前缀，
        然后在末尾以一条新的用户消息的形式追加压缩指令。从 API 的视角来看，
        这个请求和父会话的最后一次请求几乎一模一样——相同的前缀、相同的工具、相同的历史——
        因此<strong>缓存前缀被完整复用</strong>。唯一新增的 token 开销就是压缩指令本身。
      </p>

      <Raw title="Cache-Safe Forking 流程对比 · 天真做法 vs 缓存安全分叉">
        <div
          style={{
            fontFamily: "var(--ra-font-sans, sans-serif)",
            fontSize: "var(--ra-text-sm, 0.9rem)",
            lineHeight: 1.7,
            padding: "var(--ra-space-5, 1.5rem)",
            background: "var(--ra-color-surface, #f5f2e8)",
            border: "1px solid var(--ra-color-border, currentColor)",
            overflow: "auto",
          }}
        >
          {/* 标题行 */}
          <div
            style={{
              display: "flex",
              gap: "var(--ra-space-3, 0.75rem)",
              marginBottom: "var(--ra-space-5, 1.5rem)",
            }}
          >
            <div style={{ flex: 1 }}>
              <span
                style={{
                  display: "inline-block",
                  background: "var(--ra-color-risk, #dc2626)",
                  color: "var(--ra-color-bg, #faf8f2)",
                  padding: "2px 10px",
                  fontSize: "var(--ra-text-xs, 0.75rem)",
                  fontWeight: "var(--ra-font-weight-bold, 700)",
                  letterSpacing: "0.06em",
                  marginBottom: "var(--ra-space-2, 0.5rem)",
                }}
              >
                天真做法 · 昂贵
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <span
                style={{
                  display: "inline-block",
                  background: "var(--ra-color-accent, #1d4ed8)",
                  color: "var(--ra-color-bg, #faf8f2)",
                  padding: "2px 10px",
                  fontSize: "var(--ra-text-xs, 0.75rem)",
                  fontWeight: "var(--ra-font-weight-bold, 700)",
                  letterSpacing: "0.06em",
                  marginBottom: "var(--ra-space-2, 0.5rem)",
                }}
              >
                Cache-Safe Forking · 高效
              </span>
            </div>
          </div>

          {/* 流程对比 */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--ra-space-3, 0.75rem)",
            }}
          >
            {/* 左侧：天真做法 */}
            <div
              style={{
                flex: 1,
                border: "2px solid var(--ra-color-risk, #dc2626)",
                padding: "var(--ra-space-3, 0.75rem)",
                background: "var(--ra-color-bg, #faf8f2)",
              }}
            >
              <div
                style={{
                  fontSize: "var(--ra-text-xs, 0.78rem)",
                  fontWeight: "var(--ra-font-weight-bold, 700)",
                  color: "var(--ra-color-fg, #1a1a1a)",
                  marginBottom: "var(--ra-space-3, 0.75rem)",
                  paddingBottom: "var(--ra-space-2, 0.5rem)",
                  borderBottom: "1px solid var(--ra-color-border, currentColor)",
                }}
              >
                独立 API 调用
              </div>

              {/* 步骤 1：新系统提示词 */}
              <FlowStep
                index="1"
                bg="var(--ra-color-risk, #dc2626)"
                label="不同的系统提示词"
                detail="「请总结以下对话」"
              />
              <FlowArrow color="var(--ra-color-risk, #dc2626)" />

              {/* 步骤 2：全量对话 */}
              <FlowStep
                index="2"
                bg="var(--ra-color-risk, #dc2626)"
                label="全量对话历史"
                detail="全部 token 按未缓存价格计费"
              />
              <FlowArrow color="var(--ra-color-risk, #dc2626)" />

              {/* 结果 */}
              <div
                style={{
                  background: "var(--ra-color-risk, #dc2626)",
                  color: "var(--ra-color-bg, #faf8f2)",
                  padding: "var(--ra-space-2, 0.5rem)",
                  fontSize: "var(--ra-text-xs, 0.75rem)",
                  fontWeight: "var(--ra-font-weight-bold, 700)",
                  textAlign: "center",
                }}
              >
                缓存命中 0% · 全额付费
              </div>
            </div>

            {/* 中间分隔 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "2rem",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: "var(--ra-text-xl, 1.5rem)",
                  fontWeight: "var(--ra-font-weight-bold, 700)",
                  color: "var(--ra-color-muted, #999)",
                }}
              >
                vs
              </span>
            </div>

            {/* 右侧：Cache-Safe Forking */}
            <div
              style={{
                flex: 1,
                border: "2px solid var(--ra-color-accent, #1d4ed8)",
                padding: "var(--ra-space-3, 0.75rem)",
                background: "var(--ra-color-bg, #faf8f2)",
              }}
            >
              <div
                style={{
                  fontSize: "var(--ra-text-xs, 0.78rem)",
                  fontWeight: "var(--ra-font-weight-bold, 700)",
                  color: "var(--ra-color-fg, #1a1a1a)",
                  marginBottom: "var(--ra-space-3, 0.75rem)",
                  paddingBottom: "var(--ra-space-2, 0.5rem)",
                  borderBottom: "1px solid var(--ra-color-border, currentColor)",
                }}
              >
                复用父会话上下文
              </div>

              {/* 步骤 1：相同前缀 */}
              <FlowStep
                index="1"
                bg="var(--ra-color-accent, #1d4ed8)"
                label="复用父会话前缀"
                detail="系统提示词 / 工具 / CLAUDE.md / 上下文完全相同"
              />
              <FlowArrow color="var(--ra-color-accent, #1d4ed8)" />

              {/* 步骤 2：缓存命中 */}
              <FlowStep
                index="2"
                bg="var(--ra-color-accent, #1d4ed8)"
                label="对话历史命中缓存"
                detail="前缀完全匹配，缓存完整复用"
              />
              <FlowArrow color="var(--ra-color-accent, #1d4ed8)" />

              {/* 步骤 3：仅追加 */}
              <FlowStep
                index="3"
                bg="var(--ra-color-warning, #eab308)"
                fg="var(--ra-color-fg, #1a1a1a)"
                label="末尾追加压缩指令"
                detail="唯一新增 token：压缩指令本身"
              />
              <FlowArrow color="var(--ra-color-warning, #eab308)" />

              {/* 结果 */}
              <div
                style={{
                  background: "var(--ra-color-accent, #1d4ed8)",
                  color: "var(--ra-color-bg, #faf8f2)",
                  padding: "var(--ra-space-2, 0.5rem)",
                  fontSize: "var(--ra-text-xs, 0.75rem)",
                  fontWeight: "var(--ra-font-weight-bold, 700)",
                  textAlign: "center",
                }}
              >
                缓存最大化 · 仅为压缩指令付费
              </div>
            </div>
          </div>

          {/* 补充说明 */}
          <div
            style={{
              marginTop: "var(--ra-space-4, 1rem)",
              fontSize: "var(--ra-text-xs, 0.78rem)",
              color: "var(--ra-color-muted, inherit)",
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: "var(--ra-color-fg, #1a1a1a)" }}>关键前提：</strong>
            需预留「压缩缓冲区」——在上下文窗口中留出足够空间来容纳压缩指令和摘要输出 token。
            节省是巨大的：不需要为长达数十万 token 的对话历史支付全价，
            只需为压缩指令和摘要输出付费。
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
          <Legend color="var(--ra-color-risk, #dc2626)" label="天真做法（全量付费）" />
          <Legend color="var(--ra-color-accent, #1d4ed8)" label="Cache-Safe Forking（缓存复用）" />
          <Legend color="var(--ra-color-warning, #eab308)" label="唯一新增开销（压缩指令）" />
        </div>
      </Raw>

      {/* ── 经验六：像监控可用性一样监控缓存命中率 ── */}
      <p>
        如果说前五条经验讲的是"如何设计以维持缓存"，那么第六条经验讲的是一个更深层的问题：
        <strong>你如何知道自己正在赢？</strong>
      </p>

      <p>
        缓存命中率下降几个百分点，就能对成本和延迟造成显著影响。在长对话场景下，
        一次缓存未命中不仅仅是"贵一点"——它可能贵上 10 倍，同时慢得多，
        因为整个前缀都需要从头重新计算。对于每天处理数亿 token 的 Agent 产品来说，
        这种差异在账单上体现得极为赤裸。
      </p>

      <Quote who="Claude Code 团队" source="来源：claude.com/blog">
        我们确实在监控提示词缓存的命中率，一旦命中率过低，就会触发告警，甚至会宣布 SEV
        级别的事故。
      </Quote>

      <p>
        这种运维姿态——把缓存断裂当作生产事故来对待——反映了缓存对产品经济的根本性影响。
        没有高缓存命中率，订阅模式根本跑不通。它不是一项锦上添花的优化，
        而是决定产品能否在商业上存活的<strong>基础设施级指标</strong>。
      </p>

      <p>
        这也意味着，缓存命中率不应被视为一个"后端优化指标"交由基础设施团队自行打理。
        它必须成为<strong>产品开发全流程的一等公民</strong>——每一个新功能、每一次提示词修改、
        每一轮工具定义调整，在上线前都必须回答同一个问题：这会破坏缓存吗？
      </p>

      <p>
        将缓存命中率提升到 SEV 级别，本质上是一种组织架构的自我约束：
        它让"缓存断裂"不再是一个模糊的"可能会有性能影响"的问题，
        而是一个硬性的、不可协商的质量门禁。这也是为什么 Claude Code
        团队能在规模化过程中持续维持高缓存命中率——不是因为有什么神奇的技术，
        而是因为他们把缓存当成了一道<strong>生产红线</strong>。
      </p>
    </Section>
  );
}

/** 流程图步骤块 */
function FlowStep({
  index,
  bg,
  fg,
  label,
  detail,
}: {
  index: string;
  bg: string;
  fg?: string;
  label: string;
  detail: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--ra-space-2, 0.5rem)",
        padding: "var(--ra-space-2, 0.5rem)",
        background: bg,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "1.5em",
          height: "1.5em",
          borderRadius: "50%",
          background: fg ?? "var(--ra-color-bg, #faf8f2)",
          color: fg ? bg : "var(--ra-color-fg, #1a1a1a)",
          fontSize: "var(--ra-text-xs, 0.7rem)",
          fontWeight: "var(--ra-font-weight-bold, 700)",
          flexShrink: 0,
          opacity: fg ? 0.9 : 1,
        }}
      >
        {index}
      </span>
      <div>
        <div
          style={{
            fontWeight: "var(--ra-font-weight-bold, 700)",
            fontSize: "var(--ra-text-xs, 0.78rem)",
            color: fg ?? "var(--ra-color-bg, #faf8f2)",
            lineHeight: 1.3,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: "var(--ra-text-xs, 0.7rem)",
            color: fg ?? "var(--ra-color-bg, #faf8f2)",
            opacity: 0.75,
            lineHeight: 1.4,
            marginTop: 2,
          }}
        >
          {detail}
        </div>
      </div>
    </div>
  );
}

/** 流程箭头 */
function FlowArrow({ color }: { color: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "2px 0",
        color,
        fontSize: "var(--ra-text-sm, 0.9rem)",
        lineHeight: 1,
        fontWeight: "var(--ra-font-weight-bold, 700)",
      }}
      aria-hidden="true"
    >
      ↓
    </div>
  );
}

/** 图例：色块 + 标签 */
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35em" }}>
      <span
        style={{
          display: "inline-block",
          width: "0.85em",
          height: "0.85em",
          background: color,
          opacity: 0.85,
        }}
      />
      {label}
    </span>
  );
}
