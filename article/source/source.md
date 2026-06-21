# Lessons from Building Claude Code: Prompt Caching Is Everything

**Author:** Thariq Shihipar, Member of Technical Staff, Claude Code team, Anthropic
**Published:** April 30, 2026
**Source:** https://claude.com/blog/lessons-from-building-claude-code-prompt-caching-is-everything
**Read time:** ~5 minutes

---

## Introduction

It is often said in engineering that "cache rules everything around me", and the same rule holds for agents.

Long running agentic products like Claude Code are made feasible by prompt caching which allows us to reuse computation from previous roundtrips and significantly decrease latency and cost.

At Claude Code, we build our entire harness around prompt caching. A high prompt cache hit rate decreases costs and helps us create more generous rate limits for our subscription plans, so we run alerts on our prompt cache hit rate and declare SEVs if they're too low.

These are the (often unintuitive) lessons we've learned from optimizing prompt caching at scale.

---

## How Prompt Caching Works

Prompt caching uses **prefix matching** — the API caches everything from the start of the request up to each `cache_control` breakpoint. This means the order of content in your prompt matters enormously.

If any byte anywhere in the prefix changes, everything *after* that point is invalidated and must be recomputed. The cache is a strict byte-for-byte prefix match from the very beginning of the request.

This constraint has shaped nearly every architectural decision in Claude Code.

---

## The Optimal Prompt Layout

Claude Code orders every request with **static content first, dynamic content last**, maximizing how many requests share a cache prefix:

```
┌─────────────────────────────────────────────┐
│ 1. Static system prompt & Tool definitions  │  ← Globally cached (every session, every user)
├─────────────────────────────────────────────┤
│ 2. CLAUDE.md                                │  ← Cached within a project
├─────────────────────────────────────────────┤
│ 3. Session context                          │  ← Cached within a session
├─────────────────────────────────────────────┤
│ 4. Conversation messages                    │  ← Appended each turn (cache breakpoint here)
└─────────────────────────────────────────────┘
```

**Layer 1 — System Prompt & Tools (Globally Cached):** Core agent instructions, all tool definitions (schemas), and output style settings. Cache TTL: 1 hour. Invalidated by: upgrading Claude Code, changing tool definitions, modifying deny rules for built-in tools.

**Layer 2 — CLAUDE.md (Project-Cached):** Project-level instructions from `CLAUDE.md` files in the directory hierarchy, auto memory (`MEMORY.md` first 200 lines), and unscoped rules. Loaded once at session start — mid-session edits don't apply until `/clear`, `/compact`, or restart.

**Layer 3 — Session Context (Session-Cached):** Git status snapshot, working directory, platform, shell, OS version, and auto-memory paths. Because this information is embedded in the system prompt, sessions in different directories don't share caches — the prefixes diverge.

**Layer 4 — Conversation Messages (Dynamic):** User messages, Claude's responses, tool results, and `<system-reminder>` tags. This is the only layer that grows each turn. Dynamic content lives here to avoid invalidating the prefix.

The `cache_control` breakpoints are set after the system prompt blocks (1-hour TTL) and after the last user message (5-minute TTL). The one-hour content must precede the five-minute content in request ordering — this is an API requirement.

---

## Six Lessons from Building Claude Code

### Lesson 1: Lay Out Your Prompt for Caching

The order of content in your prompt is the single most important factor in cache hit rate. **Static content must come first, dynamic content last.**

This ordering is surprisingly fragile. Things that have broken it in practice:

- Putting an in-depth timestamp in the static system prompt (changes every request, destroys the entire cache from the beginning)
- Shuffling tool order definitions non-deterministically (common when generating tool lists from unordered data structures like sets or hash maps)
- Updating parameters of tools mid-development (e.g., changing what agents the `AgentTool` can call)
- Changing effort level (each effort level has a separate cache key)
- Enabling fast mode (adds a header that's part of the cache key)

The rule of thumb: if content changes between requests, push it as far toward the end of the prompt as possible.

---

### Lesson 2: Use Messages for Updates

When information in the prompt becomes stale — the time changes, a file is edited externally, the working directory shifts — **do not modify the prompt itself**. That would cause a full cache miss.

Instead, inject the updated information via messages in the agent's next turn. In Claude Code, this is done with `<system-reminder>` tags inserted into the next user message or tool result:

> *"In Claude Code, we add a `<system-reminder>` tag in the next user message or tool result with the updated information for the model, which helps preserve the cache."*

Examples of information communicated this way:
- Current time/date changes ("it is now Wednesday, 3:45 PM")
- File modifications detected via `mtime` comparison
- Mode transitions (entering/exiting plan mode)
- Updated context from hooks or plugins

This pattern keeps the cached prefix identical turn-over-turn, maintaining high cache hit rates across long sessions.

---

### Lesson 3: Don't Change Models Mid-Session

Prompt caches are **unique to models** — and this makes the economics of model switching deeply unintuitive.

If you're 100k tokens into a conversation with Opus and want to ask a question that's fairly easy to answer, it would actually be **more expensive to switch to Haiku than to have Opus answer**, because switching models requires rebuilding the entire prompt cache from scratch.

The KV cache is bound to model weights. Opus, Sonnet, and Haiku caches are completely isolated from each other. Changing models means the next request reads the entire conversation history with zero cache hits.

**The solution: subagents.** If you need a different model for a subtask, deploy a subagent. The subagent gets its own independent context and cache, does its work, and passes results back without touching the parent session's cache chain. Claude Code's Explore agents use Haiku as subagents specifically to avoid breaking the main session's cache.

The official recommendation: **pick your model at the start of a session and stick with it.**

---

### Lesson 4: Never Add or Remove Tools Mid-Session

Tool definitions are part of the cached prefix. Adding or removing a tool invalidates the prompt cache for the entire conversation. This is described as "one of the most common ways people break prompt caching."

Claude Code handles tool state transitions without modifying the tool set:

**Plan Mode as Tools:** Instead of swapping the tool set when entering Plan Mode (which would break the cache), Claude Code keeps all tools always present and implements plan mode as tools themselves — `EnterPlanMode` and `ExitPlanMode`. When the agent enters plan mode, it receives a system message telling it to explore code, not edit files, and call `ExitPlanMode` when done. Bonus: the model can *autonomously* enter plan mode by calling `EnterPlanMode` when it detects a hard problem.

**MCP Tools with `defer_loading`:** For MCP (Model Context Protocol) tools, Claude Code doesn't remove unused tools. Instead, it sends lightweight stubs containing just the tool name with `defer_loading: true`. The full tool schemas are only loaded when needed, triggered via the `ToolSearch` tool. This keeps the cached prefix stable since the same stubs are always present in the same order.

The principle: **use tools to model state transitions, rather than modifying the tool set itself.**

---

### Lesson 5: Compacting Without Breaking the Cache

When a Claude Code session fills its context window, it must compact — summarizing the conversation history to continue in a new session. The naive approach (a separate API call with a different system prompt like "summarize this conversation") is a cost trap: since prompt caching is a prefix match, using a different system prompt means *none* of the cached conversation applies, and you pay the full, uncached input rate for the entire conversation history.

Claude Code's solution is **cache-safe forking:**

- The compaction request uses the **exact same system prompt, user context, system context, and tool definitions** as the parent conversation.
- It prepends the parent's conversation messages, then appends the compaction prompt as a new user message at the end.
- From the API's perspective, this request looks nearly identical to the parent's last request — same prefix, same tools, same history — so the **cached prefix is reused**. The only new tokens charged are the compaction prompt itself.

This requires saving a "compaction buffer" — room in the context window for both the compact message and the summary output tokens. But the savings are dramatic: instead of paying full price for potentially hundreds of thousands of tokens of conversation history, you pay only for the compaction instruction and the summary output.

---

### Lesson 6: Monitor Your Cache Hit Rate Like Uptime

A few percentage points of cache miss rate can dramatically affect both cost and latency. A cache miss on a long conversation doesn't just cost more — it can be 10× more expensive and significantly slower, because the entire prefix must be recomputed.

The Claude Code team treats cache hit rate as a critical infrastructure metric:

> *"We actually monitor the prompt cache hit rate, and once the hit rate is too low, it triggers an alert, even declaring a SEV level incident."*

This operational posture — treating cache breaks as production incidents — reflects how fundamental caching is to the product's economics. Without high cache hit rates, the subscription model wouldn't work.

---

## The Financial Impact: By the Numbers

The economics of prompt caching are stark:

- **Cached tokens cost only 10%** of regular input tokens (e.g., $0.30/M vs $3.00/M for Sonnet)
- **Cache writes cost 1.25×** the base input price (a one-time cost to populate the cache)

Real-world numbers from the development of Claude Code:
- One engineer on the team saved over **300 million tokens** in a single week through caching
- **91 million cached tokens** in a single day — billed as only ~9 million tokens
- Without caching, that same day would have cost 10× more

The team has reported that their cache savings often exceed the tokens they actually process, and in certain dimensions, by a significant margin.

---

## Cache Time-to-Live (TTL)

Different contexts have different cache lifetimes:

| Context | Cache TTL |
|---|---|
| Claude Code subscription (system prompt, tools) | **1 hour** |
| Claude API (default) | **5 minutes** |
| Sub-agents | **Always 5 minutes** |

The 1-hour TTL for subscription sessions means that as long as you keep the conversation going (or resume within an hour), the system prompt and tool definitions stay cached. The 5-minute TTL for the conversation messages means brief pauses don't break the cache, but longer gaps require rebuilding.

---

## Conclusion

Prompt caching isn't an optimization you add at the end — it's a fundamental constraint that shapes every layer of an agentic product's architecture. From the order of content in every API request, to how tools are designed and loaded, to how models are selected, to how context windows are managed — caching considerations permeate everything.

These lessons — layout for the prefix, use messages for updates, don't switch models or tools mid-session, fork safely for compaction, and monitor cache hit rate like uptime — are the difference between an agent that's economically viable and one that isn't.

As more teams build long-running agentic products, the hope is that these patterns, earned through hard experience building Claude Code at scale, help others avoid the same pitfalls.

---

*Cache rules everything around me.*
