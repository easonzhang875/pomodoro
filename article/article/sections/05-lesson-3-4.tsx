import { Section, Table, Raw } from "reacticle";

export function SectionLesson34() {
  return (
    <Section index="05" title="经验三 & 四：不切换模型 + 不增删工具">
      <p>
        如果说前两条经验讲的是提示词内部的排列与更新策略，那么经验三和四则转向一个更外层的约束：<strong>会话的模型选择和工具集合，一旦确定就不该再变</strong>。这两条规则本质上来自同一个技术事实——提示词缓存是逐字节的前缀匹配，而模型标识和工具定义都坐落在缓存前缀的最前端。
      </p>

      <p>
        提示词缓存是<strong>模型专属的</strong>——KV Cache 与模型权重绑定，Opus、Sonnet、Haiku 的缓存互相完全隔离。这意味着一个反直觉的经济学结论：用 Opus 聊了 10 万 token 之后，切换成更便宜的 Haiku 来回答一个简单问题，反而<strong>比继续用 Opus 更贵</strong>。因为切换模型的那一刻，整个提示词缓存从头重建——你需要为全部对话历史支付全额的、未经缓存的输入价格。Haiku 的单 token 单价确实低，但乘以 10 万 token 后，总账根本划不来。
      </p>

      <Table
        caption="模型切换的三种策略与缓存成本对比"
        columns={[
          { key: "strategy", label: "策略" },
          { key: "cache", label: "缓存行为" },
          { key: "cost", label: "成本影响" },
        ]}
        rows={[
          {
            strategy: <strong>会话中途切换模型</strong>,
            cache: "全量重建缓存——KV Cache 与模型权重绑定，切换模型意味着缓存完全不可复用",
            cost: (
              <span style={{ color: "var(--ra-color-risk, #dc2626)" }}>
                <strong>10-20x</strong>，需为整个对话历史支付全价输入
              </span>
            ),
          },
          {
            strategy: <strong>使用子 Agent 处理子任务</strong>,
            cache: "子 Agent 拥有独立缓存空间；主会话缓存链路完全不受影响",
            cost: (
              <span style={{ color: "var(--ra-color-accent, #1d4ed8)" }}>
                子 Agent 自身成本可控，主会话缓存持续命中
              </span>
            ),
          },
          {
            strategy: <strong>会话全程不切换模型</strong>,
            cache: "缓存前缀完全稳定，每次请求持续命中，无需重建",
            cost: (
              <span style={{ color: "var(--ra-color-accent, #1d4ed8)" }}>
                缓存读取仅 <strong>10%</strong> 价格，成本随会话增长而递减
              </span>
            ),
          },
        ]}
      />

      <p>
        Claude Code 的解决方案是<strong>子 Agent（subagent）</strong>。子 Agent 以独立的 API 调用运行——拥有自己全新的上下文窗口和缓存空间，完成任务后将结果以文本形式传回主会话。主会话的缓存链路毫发无损。Claude Code 内置的 Explore Agent 正是以 Haiku 作为子 Agent 运行的典型例子——它负责代码库搜索和探索，主会话则继续用原模型进行高价值推理。官方建议很明确：<strong>在会话开始时就选好模型，一路用到底</strong>；如果某个子任务确实需要不同的模型或能力，派子 Agent 去处理，而不是在主会话中切换模型。
      </p>

      <p>
        如果模型切换是从类型层面破坏缓存，那么工具的增删则是在定义层面做同样的事——而且更常见。工具定义（tool schema）是缓存前缀的一部分，<strong>添加或移除任何一个工具，会导致整个对话的提示词缓存全部失效</strong>。这是 Claude Code 团队在实际运行中观察到的"最常见的缓存破坏方式之一"。
      </p>

      <Raw title="工具集不变的示意 · 用系统消息切换行为模式，而非替换工具集">
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
          {/* 工具集区域 */}
          <div style={{ marginBottom: "var(--ra-space-4, 1rem)" }}>
            <div
              style={{
                fontSize: "var(--ra-text-xs, 0.75rem)",
                color: "var(--ra-color-muted, inherit)",
                marginBottom: "var(--ra-space-2, 0.5rem)",
                fontWeight: "var(--ra-font-weight-bold, 700)",
              }}
            >
              工具定义（缓存前缀，始终不变）
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--ra-space-2, 0.5rem)",
                padding: "var(--ra-space-3, 0.75rem)",
                background: "var(--ra-color-bg, #faf8f2)",
              }}
            >
              {["read", "write", "bash", "grep", "glob", "Edit", "Task"].map((tool) => (
                <span
                  key={tool}
                  style={{
                    display: "inline-block",
                    padding: "0.15em 0.6em",
                    background: "var(--ra-color-accent, #1d4ed8)",
                    color: "var(--ra-color-bg, #faf8f2)",
                    fontSize: "var(--ra-text-xs, 0.75rem)",
                    fontWeight: "var(--ra-font-weight-bold, 700)",
                  }}
                >
                  {tool}
                </span>
              ))}
              {["EnterPlanMode", "ExitPlanMode"].map((tool) => (
                <span
                  key={tool}
                  style={{
                    display: "inline-block",
                    padding: "0.15em 0.6em",
                    background: "var(--ra-color-warning, #eab308)",
                    color: "var(--ra-color-fg, #1a1a1a)",
                    fontSize: "var(--ra-text-xs, 0.75rem)",
                    fontWeight: "var(--ra-font-weight-bold, 700)",
                  }}
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* 分隔 */}
          <div
            style={{
              borderTop: "1px solid var(--ra-color-border, currentColor)",
              marginBottom: "var(--ra-space-4, 1rem)",
            }}
          />

          {/* 模式切换区域 */}
          <div
            style={{
              fontSize: "var(--ra-text-xs, 0.75rem)",
              color: "var(--ra-color-muted, inherit)",
              marginBottom: "var(--ra-space-3, 0.75rem)",
              fontWeight: "var(--ra-font-weight-bold, 700)",
            }}
          >
            行为模式（通过系统消息切换，非工具集变更）
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ra-space-2, 0.5rem)" }}>
            {/* 正常模式 */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--ra-space-2, 0.5rem)",
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
              <div>
                <span style={{ fontWeight: "var(--ra-font-weight-bold, 700)" }}>
                  正常模式
                </span>
                <span style={{ color: "var(--ra-color-muted, inherit)" }}>
                  {" "}— Agent 可读写文件，完整工具集可用
                </span>
              </div>
            </div>

            {/* 过渡：进入计划模式 */}
            <div
              style={{
                paddingLeft: "calc(1.6em + var(--ra-space-2, 0.5rem))",
                color: "var(--ra-color-muted, inherit)",
                fontSize: "var(--ra-text-xs, 0.75rem)",
              }}
            >
              ↓ 模型自主调用{" "}
              <span style={{ fontWeight: "var(--ra-font-weight-bold, 700)", color: "var(--ra-color-fg, inherit)" }}>
                EnterPlanMode
              </span>{" "}
              → 系统消息："你现在处于计划模式，只能探索代码"
            </div>

            {/* 计划模式 */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--ra-space-2, 0.5rem)",
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
                  background: "var(--ra-color-warning, #eab308)",
                  color: "var(--ra-color-fg, #1a1a1a)",
                  fontSize: "var(--ra-text-xs, 0.75rem)",
                  fontWeight: "var(--ra-font-weight-bold, 700)",
                  flexShrink: 0,
                }}
              >
                2
              </span>
              <div>
                <span style={{ fontWeight: "var(--ra-font-weight-bold, 700)" }}>
                  计划模式
                </span>
                <span style={{ color: "var(--ra-color-muted, inherit)" }}>
                  {" "}— Agent 只能探索代码，不能编辑文件（工具集不变，行为由系统消息约束）
                </span>
              </div>
            </div>

            {/* 过渡：退出计划模式 */}
            <div
              style={{
                paddingLeft: "calc(1.6em + var(--ra-space-2, 0.5rem))",
                color: "var(--ra-color-muted, inherit)",
                fontSize: "var(--ra-text-xs, 0.75rem)",
              }}
            >
              ↓ 模型调用{" "}
              <span style={{ fontWeight: "var(--ra-font-weight-bold, 700)", color: "var(--ra-color-fg, inherit)" }}>
                ExitPlanMode
              </span>{" "}
              → 系统消息："你已退出计划模式，恢复正常编辑权限"
            </div>

            {/* 回到正常模式 */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--ra-space-2, 0.5rem)",
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
              <div>
                <span style={{ fontWeight: "var(--ra-font-weight-bold, 700)" }}>
                  正常模式（恢复）
                </span>
                <span style={{ color: "var(--ra-color-muted, inherit)" }}>
                  {" "}— Agent 恢复完整编辑权限
                </span>
              </div>
            </div>
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
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35em" }}>
            <span
              style={{
                display: "inline-block",
                width: "0.85em",
                height: "0.85em",
                background: "var(--ra-color-accent, #1d4ed8)",
              }}
            />
            常规工具（始终在列表中）
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35em" }}>
            <span
              style={{
                display: "inline-block",
                width: "0.85em",
                height: "0.85em",
                background: "var(--ra-color-warning, #eab308)",
              }}
            />
            模式切换工具（始终在列表中，通过系统消息切换行为）
          </span>
        </div>
      </Raw>

      <p>
        另一个关键设计是 MCP 工具的<strong>延迟加载（defer_loading）</strong>。Claude Code 不会因为用户未使用某个 MCP 工具就从工具列表中移除它——这会破坏缓存。相反，它发送的是轻量级的"桩"：只包含工具名称和 <code>defer_loading: true</code> 标记。完整的工具 schema 只有在模型通过 <code>ToolSearch</code> 工具主动选择后才加载。由于每次请求中相同的桩始终以相同顺序存在，缓存前缀得以保持稳定——无论用户是否实际使用了某个 MCP 工具。
      </p>

      <p>
        核心原则值得反复强调：<strong>用工具来建模状态转换，而不是修改工具集本身</strong>。无论是计划模式的进入与退出、MCP 工具的按需发现，还是其他任何需要在运行时切换行为的需求，都应该通过系统消息传递行为指令，而非通过替换工具集来实现。工具集是缓存前缀的基石——让它稳定，缓存就稳定。
      </p>
    </Section>
  );
}
