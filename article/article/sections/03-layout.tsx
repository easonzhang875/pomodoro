import { Section, Raw } from "reacticle";

export function SectionLayout() {
  return (
    <Section index="03" title="最优提示词布局">
      <p>
        Claude Code 在每个 API 请求中遵循一条不可动摇的排序原则：
        <strong>静态内容放在最前面，动态内容放在最后面</strong>。这不是一个经验建议，而是由前缀匹配机制推导出的必然结论——任何放在前面的动态内容，都意味着每次请求从第一个字节就开始分叉，整条缓存链从源头被摧毁。
      </p>

      <p>
        基于这条原则，Claude Code 将每个请求的提示词组织为四层架构。从上到下，稳定性逐层递减；从前到后，缓存共享域逐层收窄。下图展示了这四层结构及其 TTL 时长、失效条件。
      </p>

      <Raw title="四层分层缓存架构 · 静态在前、动态在后">
        <div
          style={{
            fontFamily: "var(--ra-font-body)",
            fontSize: "var(--ra-text-sm, 0.85rem)",
            lineHeight: 1.5,
            background: "var(--ra-color-bg, #f4f0e6)",
            border: "1px solid var(--ra-color-border, #d4cdb8)",
            overflow: "hidden",
          }}
        >
          {/* ====== 层 1：系统提示词 + 工具定义 ====== */}
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              minHeight: "5.5rem",
              background: "var(--ra-color-accent-soft, #dfe5f6)",
              borderBottom: "2px solid var(--ra-color-warning, #ffce1f)",
            }}
          >
            {/* 左侧蓝色编号圆 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 var(--ra-space-4, 1rem)",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "2em",
                  height: "2em",
                  borderRadius: "50%",
                  background: "var(--ra-color-accent, #1f49c0)",
                  color: "var(--ra-color-accent-contrast, #ffffff)",
                  fontSize: "var(--ra-text-xs, 0.74rem)",
                  fontWeight: "var(--ra-weight-bold, 700)",
                  fontFamily: "var(--ra-font-heading)",
                  flexShrink: 0,
                }}
              >
                1
              </span>
            </div>
            {/* 主体内容 */}
            <div
              style={{
                flex: 1,
                padding: "var(--ra-space-3, 0.75rem) var(--ra-space-3, 0.75rem) var(--ra-space-3, 0.75rem) 0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontWeight: "var(--ra-weight-bold, 700)",
                  color: "var(--ra-color-heading, #100f0c)",
                  fontFamily: "var(--ra-font-heading)",
                  fontSize: "var(--ra-text-base, 1.04rem)",
                  marginBottom: "var(--ra-space-1, 0.25rem)",
                }}
              >
                系统提示词 + 工具定义
              </div>
              <div style={{ color: "var(--ra-color-muted, #57534a)" }}>
                核心 Agent 指令 · 全部工具 schema · 输出风格设定
              </div>
            </div>
            {/* 右侧元信息 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-end",
                padding: "var(--ra-space-3, 0.75rem) var(--ra-space-4, 1rem) var(--ra-space-3, 0.75rem) 0",
                gap: "var(--ra-space-1, 0.25rem)",
                flexShrink: 0,
                minWidth: "10rem",
              }}
            >
              <span
                style={{
                  background: "var(--ra-color-accent, #1f49c0)",
                  color: "var(--ra-color-accent-contrast, #ffffff)",
                  padding: "0.15em 0.55em",
                  fontSize: "var(--ra-text-xs, 0.74rem)",
                  fontWeight: "var(--ra-weight-semibold, 600)",
                  fontFamily: "var(--ra-font-heading)",
                }}
              >
                TTL 1 小时
              </span>
              <span
                style={{
                  fontSize: "var(--ra-text-xs, 0.74rem)",
                  color: "var(--ra-color-risk, #cf2a22)",
                  textAlign: "right",
                  lineHeight: 1.35,
                  maxWidth: "12rem",
                }}
              >
                升级 Claude Code · 修改工具定义 · 调整 deny 规则 → 缓存失效
              </span>
            </div>
          </div>

          {/* ====== cache_control 断点标记 ① ====== */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "var(--ra-space-2, 0.5rem) var(--ra-space-4, 1rem)",
              background: "var(--ra-color-risk-soft, #f8ddd9)",
              borderBottom: "2px solid var(--ra-color-warning, #ffce1f)",
              gap: "var(--ra-space-2, 0.5rem)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "1.4em",
                height: "1.4em",
                borderRadius: "50%",
                background: "var(--ra-color-risk, #cf2a22)",
                color: "var(--ra-color-accent-contrast, #ffffff)",
                fontSize: "var(--ra-text-xs, 0.74rem)",
                fontWeight: "var(--ra-weight-bold, 700)",
                fontFamily: "var(--ra-font-heading)",
                flexShrink: 0,
              }}
            >
              !
            </span>
            <span
              style={{
                fontSize: "var(--ra-text-xs, 0.74rem)",
                fontWeight: "var(--ra-weight-semibold, 600)",
                color: "var(--ra-color-risk, #cf2a22)",
                fontFamily: "var(--ra-font-mono)",
              }}
            >
              cache_control 断点 ① — TTL 1 小时
            </span>
          </div>

          {/* ====== 层 2：CLAUDE.md ====== */}
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              minHeight: "5rem",
              background: "var(--ra-color-accent-soft, #e0e6f5)",
              borderBottom: "2px solid var(--ra-color-warning, #ffce1f)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 var(--ra-space-4, 1rem)",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "2em",
                  height: "2em",
                  borderRadius: "50%",
                  background: "var(--ra-color-accent, #1f49c0)",
                  color: "var(--ra-color-accent-contrast, #ffffff)",
                  fontSize: "var(--ra-text-xs, 0.74rem)",
                  fontWeight: "var(--ra-weight-bold, 700)",
                  fontFamily: "var(--ra-font-heading)",
                  flexShrink: 0,
                }}
              >
                2
              </span>
            </div>
            <div
              style={{
                flex: 1,
                padding: "var(--ra-space-3, 0.75rem) var(--ra-space-3, 0.75rem) var(--ra-space-3, 0.75rem) 0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontWeight: "var(--ra-weight-bold, 700)",
                  color: "var(--ra-color-heading, #100f0c)",
                  fontFamily: "var(--ra-font-heading)",
                  fontSize: "var(--ra-text-base, 1.04rem)",
                  marginBottom: "var(--ra-space-1, 0.25rem)",
                }}
              >
                CLAUDE.md（项目配置）
              </div>
              <div style={{ color: "var(--ra-color-muted, #57534a)" }}>
                目录层级 CLAUDE.md · 自动记忆（MEMORY.md 前 200 行）· 无作用域规则
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-end",
                padding: "var(--ra-space-3, 0.75rem) var(--ra-space-4, 1rem) var(--ra-space-3, 0.75rem) 0",
                gap: "var(--ra-space-1, 0.25rem)",
                flexShrink: 0,
                minWidth: "10rem",
              }}
            >
              <span
                style={{
                  background: "var(--ra-color-accent, #1f49c0)",
                  color: "var(--ra-color-accent-contrast, #ffffff)",
                  padding: "0.15em 0.55em",
                  fontSize: "var(--ra-text-xs, 0.74rem)",
                  fontWeight: "var(--ra-weight-semibold, 600)",
                  fontFamily: "var(--ra-font-heading)",
                }}
              >
                项目级缓存
              </span>
              <span
                style={{
                  fontSize: "var(--ra-text-xs, 0.74rem)",
                  color: "var(--ra-color-risk, #cf2a22)",
                  textAlign: "right",
                  lineHeight: 1.35,
                  maxWidth: "12rem",
                }}
              >
                修改后需 /clear · /compact · 重启会话 → 方能生效
              </span>
            </div>
          </div>

          {/* ====== 层 3：会话上下文 ====== */}
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              minHeight: "5rem",
              background: "var(--ra-color-surface-2, #f2efe5)",
              borderBottom: "2px solid var(--ra-color-warning, #ffce1f)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 var(--ra-space-4, 1rem)",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "2em",
                  height: "2em",
                  borderRadius: "50%",
                  background: "var(--ra-color-accent, #1f49c0)",
                  color: "var(--ra-color-accent-contrast, #ffffff)",
                  fontSize: "var(--ra-text-xs, 0.74rem)",
                  fontWeight: "var(--ra-weight-bold, 700)",
                  fontFamily: "var(--ra-font-heading)",
                  flexShrink: 0,
                }}
              >
                3
              </span>
            </div>
            <div
              style={{
                flex: 1,
                padding: "var(--ra-space-3, 0.75rem) var(--ra-space-3, 0.75rem) var(--ra-space-3, 0.75rem) 0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontWeight: "var(--ra-weight-bold, 700)",
                  color: "var(--ra-color-heading, #100f0c)",
                  fontFamily: "var(--ra-font-heading)",
                  fontSize: "var(--ra-text-base, 1.04rem)",
                  marginBottom: "var(--ra-space-1, 0.25rem)",
                }}
              >
                会话上下文（环境信息）
              </div>
              <div style={{ color: "var(--ra-color-muted, #57534a)" }}>
                Git 状态快照 · 工作目录 · OS 与 Shell 版本 · 自动记忆路径
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-end",
                padding: "var(--ra-space-3, 0.75rem) var(--ra-space-4, 1rem) var(--ra-space-3, 0.75rem) 0",
                gap: "var(--ra-space-1, 0.25rem)",
                flexShrink: 0,
                minWidth: "10rem",
              }}
            >
              <span
                style={{
                  background: "var(--ra-color-accent, #1f49c0)",
                  color: "var(--ra-color-accent-contrast, #ffffff)",
                  padding: "0.15em 0.55em",
                  fontSize: "var(--ra-text-xs, 0.74rem)",
                  fontWeight: "var(--ra-weight-semibold, 600)",
                  fontFamily: "var(--ra-font-heading)",
                }}
              >
                会话级缓存
              </span>
              <span
                style={{
                  fontSize: "var(--ra-text-xs, 0.74rem)",
                  color: "var(--ra-color-risk, #cf2a22)",
                  textAlign: "right",
                  lineHeight: 1.35,
                  maxWidth: "12rem",
                }}
              >
                不同目录的会话前缀分叉 · 无法共享缓存
              </span>
            </div>
          </div>

          {/* ====== 层 4：对话消息 ====== */}
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              minHeight: "5.5rem",
              background: "var(--ra-color-surface, #ece7d8)",
              borderBottom: "2px solid var(--ra-color-warning, #ffce1f)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 var(--ra-space-4, 1rem)",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "2em",
                  height: "2em",
                  borderRadius: "50%",
                  background: "var(--ra-color-muted, #57534a)",
                  color: "var(--ra-color-accent-contrast, #ffffff)",
                  fontSize: "var(--ra-text-xs, 0.74rem)",
                  fontWeight: "var(--ra-weight-bold, 700)",
                  fontFamily: "var(--ra-font-heading)",
                  flexShrink: 0,
                }}
              >
                4
              </span>
            </div>
            <div
              style={{
                flex: 1,
                padding: "var(--ra-space-3, 0.75rem) var(--ra-space-3, 0.75rem) var(--ra-space-3, 0.75rem) 0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontWeight: "var(--ra-weight-bold, 700)",
                  color: "var(--ra-color-heading, #100f0c)",
                  fontFamily: "var(--ra-font-heading)",
                  fontSize: "var(--ra-text-base, 1.04rem)",
                  marginBottom: "var(--ra-space-1, 0.25rem)",
                }}
              >
                对话消息（动态层）
              </div>
              <div style={{ color: "var(--ra-color-muted, #57534a)" }}>
                用户消息 · Claude 回复 · 工具执行结果 · &lt;system-reminder&gt; 标签
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-end",
                padding: "var(--ra-space-3, 0.75rem) var(--ra-space-4, 1rem) var(--ra-space-3, 0.75rem) 0",
                gap: "var(--ra-space-1, 0.25rem)",
                flexShrink: 0,
                minWidth: "10rem",
              }}
            >
              <span
                style={{
                  background: "var(--ra-color-warning, #ffce1f)",
                  color: "var(--ra-color-heading, #100f0c)",
                  padding: "0.15em 0.55em",
                  fontSize: "var(--ra-text-xs, 0.74rem)",
                  fontWeight: "var(--ra-weight-semibold, 600)",
                  fontFamily: "var(--ra-font-heading)",
                }}
              >
                TTL 5 分钟
              </span>
              <span
                style={{
                  fontSize: "var(--ra-text-xs, 0.74rem)",
                  color: "var(--ra-color-muted, #57534a)",
                  textAlign: "right",
                  lineHeight: 1.35,
                  maxWidth: "12rem",
                }}
              >
                唯一每轮增长的层 · 所有动态内容在此汇聚
              </span>
            </div>
          </div>

          {/* ====== cache_control 断点标记 ② ====== */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "var(--ra-space-2, 0.5rem) var(--ra-space-4, 1rem)",
              background: "var(--ra-color-risk-soft, #f8ddd9)",
              gap: "var(--ra-space-2, 0.5rem)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "1.4em",
                height: "1.4em",
                borderRadius: "50%",
                background: "var(--ra-color-risk, #cf2a22)",
                color: "var(--ra-color-accent-contrast, #ffffff)",
                fontSize: "var(--ra-text-xs, 0.74rem)",
                fontWeight: "var(--ra-weight-bold, 700)",
                fontFamily: "var(--ra-font-heading)",
                flexShrink: 0,
              }}
            >
              !
            </span>
            <span
              style={{
                fontSize: "var(--ra-text-xs, 0.74rem)",
                fontWeight: "var(--ra-weight-semibold, 600)",
                color: "var(--ra-color-risk, #cf2a22)",
                fontFamily: "var(--ra-font-mono)",
              }}
            >
              cache_control 断点 ② — TTL 5 分钟（位于最后一条用户消息之后）
            </span>
          </div>

          {/* ====== 图例 ====== */}
          <div
            style={{
              display: "flex",
              gap: "var(--ra-space-5, 1.5rem)",
              padding: "var(--ra-space-4, 1rem)",
              fontSize: "var(--ra-text-xs, 0.74rem)",
              flexWrap: "wrap",
              borderTop: "1px solid var(--ra-color-border, #d4cdb8)",
            }}
          >
            <Legend
              color="var(--ra-color-accent-soft, #dfe5f6)"
              label="全局缓存层（所有会话共享）"
            />
            <Legend
              color="var(--ra-color-accent-soft, #e0e6f5)"
              label="项目级缓存层"
            />
            <Legend
              color="var(--ra-color-surface-2, #f2efe5)"
              label="会话级缓存层"
            />
            <Legend
              color="var(--ra-color-surface, #ece7d8)"
              label="动态层（每轮追加）"
            />
            <Legend
              color="var(--ra-color-warning, #ffce1f)"
              label="层间分隔（黄）"
            />
            <Legend
              color="var(--ra-color-risk-soft, #f8ddd9)"
              label="cache_control 断点（红）"
            />
          </div>
        </div>
      </Raw>

      <p>
        下面逐层展开每层的含义、为什么占据当前这个位置、以及什么条件会触发缓存失效。
      </p>

      <p>
        <strong>第一层——系统提示词 + 工具定义（全局缓存）。</strong>
        这是整个请求中最稳定的一层，包含核心 Agent 指令、全部工具 schema 和输出风格设定。它的缓存
        TTL 为 1 小时，且覆盖范围最广：<strong>所有会话、所有用户共享</strong>。
        你在项目 A 的会话中热过的系统提示词缓存，切换到项目 B 时只要系统提示词相同，缓存前缀依然命中。这意味着这一层的缓存利用率不依赖于单个用户的行为——它由整个用户群体的并发会话共同"养热"。触发这一层失效的操作包括：升级 Claude Code 版本（系统提示词内容变更）、修改工具定义（schema 变化）、调整内置工具的 deny 规则。
      </p>

      <p>
        <strong>第二层——CLAUDE.md（项目级缓存）。</strong>
        内容来自目录层级中的 <code>CLAUDE.md</code> 文件、自动记忆（<code>MEMORY.md</code>{" "}
        前 200 行）以及无作用域规则。这一层在会话启动时一次性加载——会话中途对{" "}
        <code>CLAUDE.md</code> 的修改，需要执行 <code>/clear</code>、<code>/compact</code>{" "}
        或重启会话才能生效。它被放在系统提示词之后、会话上下文之前——这个位置是精心设计的：它比系统提示词更易变（同一台机器上不同项目有各自的 CLAUDE.md），但比会话上下文更稳定（同一个项目的所有会话共享相同的 CLAUDE.md）。
      </p>

      <p>
        <strong>第三层——会话上下文（会话级缓存）。</strong>
        包含 Git 状态快照、工作目录、操作系统与 Shell 版本、自动记忆路径等环境信息。这里有一个容易被忽略的架构后果：这些信息被嵌入到提示词中，意味着<strong>不同目录下的会话无法共享缓存</strong>——前缀从工作目录这一项就开始分叉了。换一个项目目录打开 Claude Code，即使系统提示词和 CLAUDE.md 完全相同，缓存链也必须重新开始。缓存的"共享域"不仅受内容稳定性的影响，还受嵌入位置的约束——越靠前的内容，其变化影响的缓存范围越大。
      </p>

      <p>
        <strong>第四层——对话消息（动态层）。</strong>
        用户消息、Claude 的回复、工具执行结果以及{" "}
        <code>&lt;system-reminder&gt;</code>{" "}
        标签都在这一层。这是唯一每轮都会增长的一层，也是整个请求中"最动态"的部分。所有可能在不同请求间发生变化的内容都被刻意推到这里，目的只有一个：<strong>保护前面三层不被破坏</strong>。动态时间戳、文件变更通知、模式切换提示——这些信息不修改提示词本身，而是通过消息注入的方式追加到这一层末尾，从而维持前缀的稳定。
      </p>

      <p>
        <code>cache_control</code> 断点有两个位置：第一个设置在系统提示词块之后（TTL 1
        小时），第二个设置在最后一条用户消息之后（TTL 5 分钟）。Anthropic API 有一项硬性要求：<strong>1
        小时 TTL 的内容必须位于 5 分钟 TTL 内容之前</strong>——这一顺序不可颠倒。这个 API
        约束与"静态在前、动态在后"的布局原则完全同构：它进一步强化了这种排序的必要性，把"最佳实践"提升为"如果不遵守请求直接报错"的硬约束。
      </p>

      <p>
        综合来看，这四层布局不是某个人"设计"出来的——它是从前缀匹配的物理约束和 API 的 TTL
        排序规则中推导出的唯一解。越靠前的内容，稳定性要求越高，但共享范围也越大；越靠后的内容，灵活度越高，但共享范围也越窄。理解这种"稳定性换取共享性"的权衡，是设计任何长时间运行 Agent
        系统的起点。
      </p>
    </Section>
  );
}

/** Bayer 风格图例：硬边色块 + 标签。黄块绝不用于文字色。 */
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4em",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: "0.9em",
          height: "0.9em",
          background: color,
        }}
      />
      <span style={{ color: "var(--ra-color-muted, #57534a)" }}>{label}</span>
    </span>
  );
}
