# Day 1 行动清单

> 你的 Reddit 账号才 2 小时，不能发帖不能 DM。但 Fiverr 今天就能接单。
> 策略：**Fiverr 主攻（立刻赚钱）+ Reddit 养号（5 天后变现）**

---

## ⚡ 现在做：Fiverr 开张（60 分钟赚到第一笔钱）

### 第 1 步：注册 Fiverr（10 分钟）
1. 打开 [fiverr.com](https://www.fiverr.com)
2. 点 "Join" → 用 Google 邮箱注册
3. 用户名建议：`eason_dev` 或 `eason_python`
4. 认证：Settings → 手机验证

### 第 2 步：创建第一个 Gig（20 分钟）

**Gig Title（复制粘贴）:**
```
Write a python script to automate your repetitive tasks
```

**Category 选择:**
Programming & Tech → Support & IT → Convert Files

**定价:**
- Basic: $15
- Standard: $60
- Premium: $180

**Search Tags（最多 5 个）:**
python, automation, web scraping, data processing, scripting

### 第 3 步：Gig Description（复制粘贴英文）

```text
I will write a Python script to automate your boring, repetitive work.

=== WHAT I CAN DO ===

- Extract data from websites into Excel/CSV
- Clean, merge, and process large spreadsheet files
- Batch rename or organize files
- Convert between file formats (JSON, CSV, Excel, PDF)
- Generate reports automatically
- Connect APIs and fetch data

=== WHAT YOU GET ===

- Working Python script file
- Simple instructions to run it
- Clean, readable code
- 1 free revision

=== PRICING ===

BASIC ($15) — Simple script
Example: convert CSV files to JSON, rename files in bulk, scrape one webpage

STANDARD ($60) — Medium script
Example: scrape multiple pages, process Excel data with formulas, generate PDF report

PREMIUM ($180) — Complex automation
Example: full data pipeline, multi-source web scraper, database integration

>>> Message me BEFORE ordering so I can confirm your task is doable.

I reply within 2 hours. Most scripts delivered within 24 hours.
```

### 第 4 步：Gig Gallery（5 分钟）
- 不需要图片，代码服务用文字就够了
- 如果你想加图：截一张你 crane-monitor 项目的截图（API 文档页面）

### 第 5 步：发布 Gig
- 点 "Publish Gig"
- 你的 gig 链接会是 `fiverr.com/eason_dev/...`——把这个链接保存好

---

## 🔴 同时做：Reddit 养号（每天 30 分钟）

### 今天能做的（账号 < 24 小时）

**不要发帖。你会被自动 spam filter 删掉。**

只能做一件事：**回复别人的帖子。**

打开以下 subreddit，按 "New" 排序，找你能回答的帖子：

| Subreddit | 找什么帖子 | 怎么回复 |
|-----------|-----------|---------|
| r/learnpython | 新手问问题 | 用 phase-1-karma.md 帖子 2、帖子 6 的内容回答 |
| r/AskProgramming | 有人问"how to automate X" | 用帖子 4 的内容回答 |
| r/Python | 技术讨论帖 | 用帖子 1 的内容参与讨论 |

**回复模板（简单英语，DeepL 翻译准确）:**

如果你看到有人问 "How do I scrape a website?"，回复：
```text
Here's the simplest way:

```python
import requests
from bs4 import BeautifulSoup

url = "your-website-url"
resp = requests.get(url)
soup = BeautifulSoup(resp.text, "html.parser")

# Find what you need
for item in soup.select(".item-class"):
    print(item.text)
```

Install the tools first:
```
pip install requests beautifulsoup4
```

Add time.sleep(1) between requests so you don't overload the server. 

If the site loads data with JavaScript, use Playwright instead. Happy to explain that if needed.
```

**今天目标：** 回复 10 条，每条 2-3 句话就行。

---

## 📋 接下来 5 天节奏

| 时间 | Fiverr | Reddit |
|------|--------|--------|
| Day 1 | 注册 + 发布第 1 个 Gig | 回复 10 条评论（不主动发帖） |
| Day 2 | 发布第 2 个 Gig（API 开发） | 回复 10 条 + 尝试发 1 篇帖子到 r/learnpython |
| Day 3 | 发布第 3 个 Gig（爬虫） | 继续回复 + 发第 2 篇帖子 |
| Day 4 | 检查 Fiverr 有没有消息 | 发第 3 篇帖子 |
| Day 5 | 优化 Gig 标题/描述 | 检查 karma，准备 [For Hire] 帖子 |

---

## 💬 你收到第一封客户消息时

Fiverr 上的买家消息 → 复制 → 粘贴到 DeepL → 看中文意思 → 写中文回复 → DeepL 翻英文 → 发回去。

或者**直接发给我**，我帮你秒回。

---

## ⚠️ 今天的重要提醒

- Reddit 上 **不要发链接**（新号发链接 = 影子封禁）
- Fiverr 上 **不要在 gig 描述里写你的邮箱/微信**（Fiverr 会删）
- 所有客户沟通 **留在平台内**（Fiverr 消息 / Reddit DM）
- 有人让你免费做 → 直接说 "My schedule is fully booked for free work. Happy to help at my listed rates."
