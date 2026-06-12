# 新电脑快速配置

回家在新电脑上按顺序执行：

## 1. 克隆项目

```bash
git clone git@github.com:easonzhang875/pomodoro.git
cd pomodoro
```

## 2. 安装 PaperSpine（论文写作 skill 套件）

```bash
git clone git@github.com:WUBING2023/PaperSpine.git
cd PaperSpine && bash install.sh claude && cd ..
```

## 3. 配置 DeepSeek API Key（如果还没设）

```bash
setx DEEPSEEK_API_KEY "你的key"
```

## 4. 安装 jq（statusLine 依赖）

```bash
winget install jqlang.jq
```

重启 Claude Code，一切就绪。
