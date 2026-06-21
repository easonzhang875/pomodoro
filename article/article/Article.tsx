import { Article, Hero, Lead, Raw } from "reacticle";
import { SectionOpening } from "./sections/01-opening";
import { SectionHowCacheWorks } from "./sections/02-how-cache-works";
import { SectionLayout } from "./sections/03-layout";
import { SectionLessonOneTwo } from "./sections/04-lesson-1-2";
import { SectionLesson34 } from "./sections/05-lesson-3-4";
import { SectionLesson56 } from "./sections/06-lesson-5-6";
import { SectionEconomics } from "./sections/07-economics";
import { SectionConclusion } from "./sections/08-conclusion";

export function ArticleDoc() {
  return (
    <Article toc width="regular">
      <Hero
        title="从零构建 Claude Code 的经验教训：提示词缓存决定一切"
        subtitle="六条反直觉的 Agent 缓存设计法则 —— 来自 Anthropic 官方的技术深度解读"
        meta={[
          { label: "作者", value: "Thariq Shihipar · Anthropic" },
          { label: "日期", value: "2026 年 4 月 30 日" },
          { label: "来源", value: "claude.com/blog" },
        ]}
      />
      <Lead>
        为什么 Claude Code 这样的 Agent 产品能活下来？答案不在模型本身，而在一项被大多数人忽视的基础设施：<strong>提示词缓存</strong>。它不是一个可以在最后才"加上去"的优化——它是从第一天起就塑造整个架构的根本约束。
      </Lead>

      <SectionOpening />
      <SectionHowCacheWorks />
      <SectionLayout />
      <SectionLessonOneTwo />
      <SectionLesson34 />
      <SectionLesson56 />
      <SectionEconomics />
      <SectionConclusion />

      <Raw title="">
        <footer
          style={{
            marginTop: "var(--ra-space-7, 3rem)",
            paddingTop: "var(--ra-space-4, 1rem)",
            borderTop: "1px solid var(--ra-color-border, currentColor)",
            color: "var(--ra-color-muted, inherit)",
            fontSize: "var(--ra-text-xs, 0.78rem)",
            textAlign: "center",
            letterSpacing: "0.02em",
            opacity: 0.85,
          }}
        >
          Made with{" "}
          <a
            href="https://github.com/ConardLi/garden-skills"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "inherit",
              textDecoration: "underline",
              textUnderlineOffset: "0.2em",
            }}
          >
            beautiful-article
          </a>{" "}
          · bayer theme
        </footer>
      </Raw>
    </Article>
  );
}
