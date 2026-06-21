import { Section, Raw, CodeBlock } from "reacticle";

export function SectionLessonOneTwo() {
  return (
    <Section index="04" title="经验一 & 二：布局即缓存 + 用消息传递更新">
      <p>
        如果说「前缀匹配是缓存的重力法则」是前两章建立起来的理论框架，那么本章和下章要讲的经验，就是这套理论在工程实践中碰撞出来的血肉。每一条经验背后都有至少一次生产事故——缓存命中率曲线在监控面板上垂直坠落，SEV 告警响起，团队放下手头的事冲进 war room。这些经验的共同起点是一个看似简单的问题：
        <strong>我们到底在哪些地方，以哪些方式，破坏了缓存前缀？</strong>
      </p>

      <p>
        答案分散在提示词构建管线的每一个环节里。有些破坏是显性的——你一眼就能看出来自己把时间戳嵌进了系统提示词；有些则是隐性的——数据结构、工具定义、甚至一次看似无害的参数调整，都能在你不经意的时候让缓存链从中间断开。接下来的两条经验分别处理两个层面的问题：<strong>布局（经验一）决定什么内容放在什么位置</strong>；<strong>更新（经验二）决定当内容真的需要变化时，怎么变才不会牵连无辜</strong>。
      </p>

      <SubsectionHeading number="1" title="经验一：布局即缓存" />

      <p>
        提示词中内容的排列顺序，是影响缓存命中率的头号因素。这个结论本身并不反直觉——既然前缀匹配是从第一个字节开始逐字节比对，那「静态的放前面、动态的放后面」就是自然推演。真正反直觉的是<strong>这条规则的脆弱性</strong>：它不只约束你的系统提示词，它约束整个提示词构建管线中的每一个环节，包括一些你根本不会往「缓存」方向上想的角落。
      </p>

      <p>
        先看最明显的坑——<strong>在静态系统提示词里嵌入动态时间戳</strong>。比如一条看似无害的日志记录：「当前请求时间：2026-06-21T14:32:01Z」。这串字符会在每次请求中都变化，而它恰好位于系统提示词的最前面。结果是：从第一个字节开始，缓存前缀就与上一次请求不同。整条缓存链——不管你后面布置了多少个 <code>cache_control</code> 断点——从源头被摧毁。零命中率，全部重算。
      </p>

      <p>
        再看不那么明显的一类——<strong>工具定义的非确定性排列</strong>。工具列表在 API 请求中渲染在系统提示词之前（渲染顺序为 tools → system → messages），这意味着工具定义的任何变化都会让整个缓存归零。问题出在数据结构的实现细节上：如果你的工具集合存储在 Set、HashMap 或任何不保证迭代顺序的数据结构中，两次请求之间工具定义的序列化结果可能不同。哪怕内容完全一样，仅仅是 <code>{'{"type": "bash"}'}</code> 和 <code>{'{"type": "read"}'}</code> 互换了位置，前缀也不匹配。解决方案简洁但容易被忽视：在序列化工具列表之前，按名称做一次确定性排序。
      </p>

      <p>
        第三类坑是<strong>参数层面的微调</strong>。在开发过程中，你可能会调整某个 AgentTool 可调用的 Agent 列表——新增一个子 Agent、移除一个已废弃的工具。从产品逻辑上看这是一次无害的配置更新，从缓存角度看却是灾难：工具定义变了，渲染顺序的位置 0 变了，所有缓存失效。同样的道理适用于切换 <code>effort</code> level——每个 effort level 拥有独立的缓存键，从 <code>high</code> 切换到 <code>xhigh</code> 意味着全新的缓存写入周期。开启快速模式也是同理：快速模式在请求中添加了新的请求头，而这个请求头成为缓存键的一部分——一旦开启或关闭快速模式，缓存链断裂。
      </p>

      <p>
        这些坑的共性是：它们都发生在一个刚好处在缓存前缀范围之内的位置。经验法则简单到可以写在一张便利贴上——<strong>如果某段内容会在请求之间变化，就把它尽可能推到提示词的末尾</strong>。这个法则不仅在写系统提示词时有效，在管理工具定义、选择模型参数、设计请求管线时同样有效。如果一个参数值的变化不应该清空缓存，那它就不应该出现在缓存前缀的任何位置——或者换个说法，它的存在应该被推迟到所有稳定的前缀内容都被缓存完毕之后。
      </p>

      <SubsectionHeading number="2" title="经验二：用消息传递更新" />

      <p>
        经验一告诉你「动态内容往后放」。但世界不是静态的——在 Agent 运行过程中，信息确实会变：时间流逝了，文件被外部编辑器修改了，用户切换了一个目录，Hook 返回了新的上下文。这些变化是真实的，Agent 需要感知到它们。问题变成了：<strong>怎么让 Agent 知道世界变了，同时又不破坏缓存？</strong>
      </p>

      <p>
        工程师的第一反应往往是直接修改系统提示词——把新的时间戳、新的文件状态、新的模式标记拼接进 <code>system</code> 字段，然后发送下一轮请求。这种做法在直觉上完全合理：系统提示词不就是用来描述当前状态的么？但它的代价是<strong>缓存全量失效</strong>。修改系统提示词意味着从 tools → system → messages 渲染链中的第二环发生了变化，前缀不再匹配，之前所有的缓存读取全部白费。对于已经运行了几十轮的 Agent 会话来说，这不是一笔小开销。
      </p>

      <Raw title="缓存破坏 vs 缓存安全 · 两种更新策略的对比">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 18rem), 1fr))",
            gap: "var(--ra-space-4, 1rem)",
            fontFamily: "var(--ra-font-mono, monospace)",
            fontSize: "var(--ra-text-sm, 0.9rem)",
          }}
        >
          {/* 错误做法 */}
          <div
            style={{
              border: "2px solid var(--ra-color-risk, #dc2626)",
              background: "var(--ra-color-bg, #faf8f2)",
            }}
          >
            <div
              style={{
                padding: "var(--ra-space-2, 0.5rem) var(--ra-space-3, 0.75rem)",
                background: "var(--ra-color-risk, #dc2626)",
                color: "var(--ra-color-bg, #faf8f2)",
                fontSize: "var(--ra-text-xs, 0.78rem)",
                fontWeight: "var(--ra-font-weight-bold, 700)",
                letterSpacing: "0.04em",
              }}
            >
              错误：修改 system prompt
            </div>
            <div
              style={{
                padding: "var(--ra-space-3, 0.75rem)",
                lineHeight: 1.7,
                fontSize: "var(--ra-text-xs, 0.78rem)",
              }}
            >
              <div style={{ marginBottom: "0.4em" }}>
                <span style={{ color: "var(--ra-color-risk, #dc2626)", fontWeight: "var(--ra-font-weight-bold, 700)" }}>
                  请求 N：
                </span>
              </div>
              <div style={{ color: "var(--ra-color-muted, inherit)", opacity: 0.6 }}>
                system: &quot;...当前时间 14:30...&quot;
              </div>
              <div style={{ color: "var(--ra-color-muted, inherit)", opacity: 0.6 }}>
                tools: [bash, read, write]
              </div>
              <div style={{ color: "var(--ra-color-muted, inherit)", opacity: 0.6 }}>
                messages: [...]
              </div>

              <div style={{ margin: "0.6em 0 0.4em" }}>
                <span style={{ color: "var(--ra-color-risk, #dc2626)", fontWeight: "var(--ra-font-weight-bold, 700)" }}>
                  请求 N+1：
                </span>
              </div>
              <div style={{
                background: "var(--ra-color-risk, #dc2626)",
                color: "var(--ra-color-bg, #faf8f2)",
                padding: "0 2px",
              }}>
                system: &quot;...当前时间 14:31...&quot;
              </div>
              <div style={{ fontSize: "var(--ra-text-xs, 0.75rem)", color: "var(--ra-color-risk, #dc2626)", marginTop: "0.2em" }}>
                ← 时间变化 → 前缀不匹配
              </div>
              <div style={{ color: "var(--ra-color-muted, inherit)", opacity: 0.3 }}>
                tools: [bash, read, write]
              </div>
              <div style={{ color: "var(--ra-color-muted, inherit)", opacity: 0.3 }}>
                messages: [...
              </div>
              <div style={{
                marginTop: "0.6em",
                padding: "var(--ra-space-2, 0.5rem)",
                background: "var(--ra-color-risk, #dc2626)",
                color: "var(--ra-color-bg, #faf8f2)",
                fontSize: "var(--ra-text-xs, 0.75rem)",
                fontWeight: "var(--ra-font-weight-bold, 700)",
                textAlign: "center",
                letterSpacing: "0.04em",
              }}>
                缓存全量失效
              </div>
            </div>
          </div>

          {/* 正确做法 */}
          <div
            style={{
              border: "2px solid var(--ra-color-accent, #1d4ed8)",
              background: "var(--ra-color-bg, #faf8f2)",
            }}
          >
            <div
              style={{
                padding: "var(--ra-space-2, 0.5rem) var(--ra-space-3, 0.75rem)",
                background: "var(--ra-color-accent, #1d4ed8)",
                color: "var(--ra-color-bg, #faf8f2)",
                fontSize: "var(--ra-text-xs, 0.78rem)",
                fontWeight: "var(--ra-font-weight-bold, 700)",
                letterSpacing: "0.04em",
              }}
            >
              正确：消息注入更新
            </div>
            <div
              style={{
                padding: "var(--ra-space-3, 0.75rem)",
                lineHeight: 1.7,
                fontSize: "var(--ra-text-xs, 0.78rem)",
              }}
            >
              <div style={{ marginBottom: "0.4em" }}>
                <span style={{ color: "var(--ra-color-accent, #1d4ed8)", fontWeight: "var(--ra-font-weight-bold, 700)" }}>
                  请求 N：
                </span>
              </div>
              <div style={{ color: "var(--ra-color-accent, #1d4ed8)" }}>
                system: &quot;...静态核心...&quot;
              </div>
              <div style={{ color: "var(--ra-color-accent, #1d4ed8)" }}>
                tools: [bash, read, write]
              </div>
              <div style={{ color: "var(--ra-color-muted, inherit)", opacity: 0.6 }}>
                messages: [...]
              </div>

              <div style={{ margin: "0.6em 0 0.4em" }}>
                <span style={{ color: "var(--ra-color-accent, #1d4ed8)", fontWeight: "var(--ra-font-weight-bold, 700)" }}>
                  请求 N+1：
                </span>
              </div>
              <div style={{ color: "var(--ra-color-accent, #1d4ed8)" }}>
                system: &quot;...静态核心...&quot;
              </div>
              <div style={{ color: "var(--ra-color-accent, #1d4ed8)" }}>
                tools: [bash, read, write]
              </div>
              <div style={{
                background: "var(--ra-color-warning, #eab308)",
                color: "var(--ra-color-fg, #1a1a1a)",
                padding: "0 2px",
              }}>
                messages: [..., &lt;system-reminder&gt;时间 14:31&lt;/system-reminder&gt;]
              </div>
              <div style={{ fontSize: "var(--ra-text-xs, 0.75rem)", color: "var(--ra-color-accent, #1d4ed8)", marginTop: "0.2em" }}>
                ← 前缀完全一致，动态内容在末尾
              </div>
              <div style={{
                marginTop: "0.6em",
                padding: "var(--ra-space-2, 0.5rem)",
                background: "var(--ra-color-accent, #1d4ed8)",
                color: "var(--ra-color-bg, #faf8f2)",
                fontSize: "var(--ra-text-xs, 0.75rem)",
                fontWeight: "var(--ra-font-weight-bold, 700)",
                textAlign: "center",
                letterSpacing: "0.04em",
              }}>
                tools + system 缓存保留
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
          <CacheLegend color="var(--ra-color-accent, #1d4ed8)" label="缓存命中区域" />
          <CacheLegend color="var(--ra-color-risk, #dc2626)" label="缓存断裂 / 失败" />
          <CacheLegend color="var(--ra-color-warning, #eab308)" label="新增内容（不破坏前缀）" />
        </div>
      </Raw>

      <p>
        正确的做法是：<strong>永远不要直接修改提示词本身</strong>。让系统提示词保持冻结状态——它是一个字节级别的不可变前缀。当信息发生变化需要通知 Agent 时，通过下一轮对话中的<strong>消息</strong>来注入更新信息。消息位于整个 prompt 渲染链的末尾（messages 是最后渲染的），所以只要你不碰前面的 tools 和 system，前缀就毫发无伤。
      </p>

      <p>
        Claude Code 采用的具体方案是在下一条用户消息或工具结果中插入 <code>&lt;system-reminder&gt;</code> 标签。这不是 API 层面的特殊机制——它就是一段普通的文本，被放置在用户消息的内容里。但它的语义是特殊的：它是一条面向 Agent 的系统级提醒，告诉 Agent「世界状态已经发生了变化，请以以下最新信息为准」。
      </p>

      <CodeBlock
        language="xml"
        title="system-reminder 消息注入示例"
        showLineNumbers={true}
        code={`<!-- 下一条用户消息中的 system-reminder 注入 -->
<system-reminder>
  当前日期：2026 年 6 月 21 日。
  文件 CLAUDE.md 于 14:32:05 被外部修改，已重新加载。
  当前目录已切换至 /c/Users/12530/projects/frontend。
  模式切换：已进入计划模式（Plan Mode）。
</system-reminder>

用户消息：请帮我审查最近一次提交的代码变更。`}
      />

      <p>
        在 Claude Code 中，<code>&lt;system-reminder&gt;</code> 标签传递的信息覆盖了 Agent 运行时需要感知的各类状态变化：
      </p>

      <ul>
        <li><strong>时间和日期变化</strong>——Agent 需要知道当前时间才能正确处理日期相关的查询，但时间戳绝不能出现在系统提示词中。</li>
        <li><strong>外部文件变更</strong>——通过文件修改时间（mtime）检测到用户在 IDE 中编辑了文件，Agent 需要刷新它对文件内容的理解。</li>
        <li><strong>模式切换</strong>——用户进入或退出计划模式时，Agent 的行为策略需要相应调整。</li>
        <li><strong>Hook 或插件上下文更新</strong>——外部工具返回了新的上下文信息，需要注入到当前会话中。</li>
      </ul>

      <p>
        这种模式的美妙之处在于它的<strong>缓存语义清晰度</strong>：tools 和 system 在数百轮对话中保持字节级别的完全一致，因此每次请求都能命中缓存，只对 messages 末尾新增的部分进行全量计算。缓存命中率不是靠运气维持的——它是靠架构层面的不变式保证的：<strong>任何动态信息都不能出现在缓存前缀之内，任何需要更新的信息都通过消息层传递</strong>。
      </p>

      <p>
        值得注意的是，在 Claude Opus 4.8 中，Anthropic 进一步将这个模式升级为了一等公民的 API 特性——<strong>中间会话系统消息</strong>（mid-conversation system messages）。不再需要用 <code>&lt;system-reminder&gt;</code> 的文本标签来「伪装」系统级指令，而是可以直接在 <code>messages</code> 数组中追加 <code>&#123;"role": "system", "content": "..."&#125;</code>，它天然携带操作员权限（operator authority），且不会被普通用户消息伪造。对于不支持此特性的模型，回退到 <code>&lt;system-reminder&gt;</code> 文本标签的方案仍然是可靠的工程实践。两种方案的缓存特征完全一致：它们都坐落在消息历史的末尾，不触碰前缀的一分一毫。
      </p>

      <p>
        把经验一和经验二放在一起看，它们共同定义了一条清晰的边界：<strong>缓存前缀之内的一切都是神圣不可侵犯的</strong>。经验一说的是「别把会变的东西放进前缀」——这是预防；经验二说的是「当东西真的得变时，通过消息来变」——这是执行。两条经验加在一起，构成了 Claude Code 缓存策略中最核心的设计约束。违反其中任何一条，最终都会在规模化的某个节点上，以监控曲线跳水的方式让你付出代价。
      </p>
    </Section>
  );
}

/** Bayer 风格子标题：蓝实心圆 + 编号 + 无衬线 */
function SubsectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--ra-space-2, 0.5rem)",
        marginTop: "var(--ra-space-5, 1.5rem)",
        marginBottom: "var(--ra-space-3, 0.75rem)",
        fontFamily: "var(--ra-font-sans, system-ui, sans-serif)",
        fontSize: "var(--ra-text-lg, 1.2rem)",
        fontWeight: "var(--ra-font-weight-bold, 700)",
        color: "var(--ra-color-fg, #1a1a1a)",
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
          fontSize: "var(--ra-text-sm, 0.9rem)",
          fontWeight: "var(--ra-font-weight-bold, 700)",
          flexShrink: 0,
        }}
      >
        {number}
      </span>
      {title}
    </div>
  );
}

/** Bayer 风格图例：方形色块 + 标签 */
function CacheLegend({ color, label }: { color: string; label: string }) {
  const isAccent = color.includes("accent") || color.includes("1d4ed8");
  const isRisk = color.includes("risk") || color.includes("dc2626");
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35em" }}>
      <span
        style={{
          display: "inline-block",
          width: "0.85em",
          height: "0.85em",
          background: color,
          opacity: (isAccent || isRisk) ? 0.85 : 0.3,
        }}
      />
      {label}
    </span>
  );
}
