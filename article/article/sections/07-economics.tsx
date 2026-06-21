import { Section, Raw, Table } from "reacticle";

export function SectionEconomics() {
  return (
    <Section index="07" title="经济效益与缓存 TTL">
      <p>
        提示词缓存的经济账非常清晰。缓存读取的成本仅为常规输入 token 的{" "}
        <strong>10%</strong>（以 Sonnet 为例：$0.30/百万 token vs{" "}
        $3.00/百万 token），缓存写入成本为基准输入价格的{" "}
        <strong>1.25 倍</strong>（一次性开销，用于填充缓存）。这意味着只要缓存在一轮对话中被命中超过一次，就已经开始省钱。
      </p>

      <p>
        来自 Claude Code 开发过程的真实数据更加震撼：
      </p>

      <Raw title="缓存经济效益 · 三个数据大字报">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 14rem), 1fr))",
            gap: "var(--ra-space-3, 0.75rem)",
            margin: "var(--ra-space-4, 1rem) 0",
          }}
        >
          {/* 蓝色块：3 亿 token / 周 */}
          <div
            style={{
              background: "var(--ra-color-accent, #1d4ed8)",
              color: "var(--ra-color-bg, #faf8f2)",
              padding: "var(--ra-space-5, 1.5rem) var(--ra-space-3, 0.75rem)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              border: "1px solid var(--ra-color-accent, #1d4ed8)",
            }}
          >
            <span
              style={{
                fontSize: "clamp(2.4rem, 6vw, var(--ra-text-5xl, 4rem))",
                fontWeight: "var(--ra-font-weight-bold, 700)",
                lineHeight: 1,
                marginBottom: "var(--ra-space-2, 0.5rem)",
                letterSpacing: "-0.02em",
              }}
            >
              3 亿
            </span>
            <span
              style={{
                fontSize: "var(--ra-text-sm, 0.95rem)",
                fontWeight: "var(--ra-font-weight-bold, 700)",
                opacity: 0.85,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              token / 周
            </span>
            <span
              style={{
                fontSize: "var(--ra-text-xs, 0.75rem)",
                marginTop: "var(--ra-space-2, 0.5rem)",
                opacity: 0.65,
                lineHeight: 1.4,
              }}
            >
              一位工程师一周内
              <br />
              通过缓存节省的 token 量
            </span>
          </div>

          {/* 红色块：9100 万 / 日 */}
          <div
            style={{
              background: "var(--ra-color-risk, #dc2626)",
              color: "var(--ra-color-bg, #faf8f2)",
              padding: "var(--ra-space-5, 1.5rem) var(--ra-space-3, 0.75rem)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              border: "1px solid var(--ra-color-risk, #dc2626)",
            }}
          >
            <span
              style={{
                fontSize: "clamp(2.4rem, 6vw, var(--ra-text-5xl, 4rem))",
                fontWeight: "var(--ra-font-weight-bold, 700)",
                lineHeight: 1,
                marginBottom: "var(--ra-space-2, 0.5rem)",
                letterSpacing: "-0.02em",
              }}
            >
              9100 万
            </span>
            <span
              style={{
                fontSize: "var(--ra-text-sm, 0.95rem)",
                fontWeight: "var(--ra-font-weight-bold, 700)",
                opacity: 0.85,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              单日缓存
            </span>
            <span
              style={{
                fontSize: "var(--ra-text-xs, 0.75rem)",
                marginTop: "var(--ra-space-2, 0.5rem)",
                opacity: 0.65,
                lineHeight: 1.4,
              }}
            >
              实际计费仅约
              <br />
              900 万 token
            </span>
          </div>

          {/* 黄色块：10% 成本占比 */}
          <div
            style={{
              background: "var(--ra-color-warning, #eab308)",
              color: "var(--ra-color-fg, #1a1a1a)",
              padding: "var(--ra-space-5, 1.5rem) var(--ra-space-3, 0.75rem)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              border: "1px solid var(--ra-color-warning, #eab308)",
            }}
          >
            <span
              style={{
                fontSize: "clamp(2.4rem, 6vw, var(--ra-text-5xl, 4rem))",
                fontWeight: "var(--ra-font-weight-bold, 700)",
                lineHeight: 1,
                marginBottom: "var(--ra-space-2, 0.5rem)",
                letterSpacing: "-0.02em",
              }}
            >
              10%
            </span>
            <span
              style={{
                fontSize: "var(--ra-text-sm, 0.95rem)",
                fontWeight: "var(--ra-font-weight-bold, 700)",
                opacity: 0.75,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              成本占比
            </span>
            <span
              style={{
                fontSize: "var(--ra-text-xs, 0.75rem)",
                marginTop: "var(--ra-space-2, 0.5rem)",
                opacity: 0.55,
                lineHeight: 1.4,
              }}
            >
              缓存读取成本
              <br />
              仅为常规输入的 1/10
            </span>
          </div>
        </div>
      </Raw>

      <p>
        这组数字背后是一个简单的事实：没有缓存，同样一天的成本将是{" "}
        <strong>10 倍</strong>。团队表示，他们的缓存节省量常常超过实际处理的 token
        数量——在某些维度上甚至超出很多。这并非偶然：在长时间运行的 Agent
        会话中，系统提示词、工具定义和 CLAUDE.md
        等静态内容被反复复用，缓存命中带来的节省是乘法级别的。
      </p>

      <p>
        理解缓存的经济效益之后，下一个问题是：{" "}
        <strong>缓存能活多久？</strong>
        不同的上下文对应不同的缓存生存时间（TTL），了解这些差异对设计 Agent
        会话策略至关重要。
      </p>

      <Table
        caption="缓存 TTL 对照表"
        columns={[
          { key: "context", label: "上下文", width: "60%" },
          { key: "ttl", label: "缓存 TTL", align: "center", width: "40%" },
        ]}
        rows={[
          {
            context: (
              <span>
                Claude Code 订阅
                <span
                  style={{
                    fontSize: "var(--ra-text-xs, 0.75rem)",
                    color: "var(--ra-color-muted, inherit)",
                    display: "block",
                    marginTop: "0.15em",
                  }}
                >
                  系统提示词 + 工具定义
                </span>
              </span>
            ),
            ttl: <strong>1 小时</strong>,
          },
          {
            context: "Claude API（默认）",
            ttl: <strong>5 分钟</strong>,
          },
          {
            context: "子 Agent",
            ttl: <strong>始终 5 分钟</strong>,
          },
        ]}
      />

      <p>
        订阅会话的 1 小时 TTL 意味着，只要你持续对话（或在 1
        小时内恢复会话），系统提示词和工具定义就始终在缓存中——这是 Claude Code
        能在长时间会话中维持低成本的基石。对话消息的 5 分钟 TTL
        则意味着短暂停顿不会破坏缓存，但间隔过长就需要重建。子 Agent
        的缓存始终只有 5 分钟，这决定了子 Agent
        的设计必须更短、更聚焦——长任务不适合分叉给子 Agent，否则缓存优势荡然无存。
      </p>

      <p>
        这三个数字——<strong>3 亿</strong>、<strong>9100 万</strong>、<strong>10%</strong>——加上
        TTL 的时间维度，共同构成了 Agent
        产品经济可行性的基本方程。缓存不是一个锦上添花的优化，它就是产品本身。
      </p>
    </Section>
  );
}
