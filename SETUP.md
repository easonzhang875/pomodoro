# 新电脑快速配置

回家在新电脑上按顺序执行：

## 1. 克隆项目（全家桶一键到位）

```bash
git clone git@github.com:easonzhang875/pomodoro.git
cd pomodoro
```

PaperSpine（论文 skill）、所有项目配置、skills、commands 已全部内置在仓库里，无需额外安装。

## 2. 配置 DeepSeek API Key

```bash
setx DEEPSEEK_API_KEY "你的key"
```

或者创建 `~/.claude/settings.json`：

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "你的key",
    "ANTHROPIC_BASE_URL": "https://api.deepseek.com/anthropic",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "deepseek-v4-flash",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-v4-pro",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "deepseek-v4-pro",
    "ANTHROPIC_MODEL": "deepseek-v4-pro"
  }
}
```

## 3. 安装 jq（statusLine 进度条依赖）

```bash
winget install jqlang.jq
```

## 完成

重启 Claude Code，一切就绪。

---

## 日常切换电脑

```
离开 A 电脑前：git push                → 手动推一下
回到 B 电脑后：git pull                → 拉最新
```

关 CC 时会自动 commit，但 push 需要你手动敲。
