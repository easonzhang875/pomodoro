# 🚀 工程计算器部署指南（Render 免费方案）

> 部署后获得 `https://xxx.onrender.com` 域名，直接用在 Reddit 帖子里。

---

## 第 1 步：推送到 GitHub（5 分钟）

```bash
cd F:/first-cc
git add crane-monitor/
git commit -m "添加吊车支腿压力在线计算器"
git push origin master
```

---

## 第 2 步：在 Render 上部署（10 分钟）

1. 打开 [render.com](https://render.com) → Sign Up（用 GitHub 账号登录）
2. 点右上角 **New +** → **Web Service**
3. 选择你的仓库 `easonzhang875/pomodoro`
4. 填写配置：

| 字段 | 值 |
|------|-----|
| Name | `crane-calculator`（或任意名字） |
| Root Directory | `crane-monitor/backend` |
| Environment | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

5. 选择 **Free** plan
6. 点 **Create Web Service**
7. 等 2-3 分钟部署完成
8. 你的 URL 是：`https://crane-calculator.onrender.com`

---

## 第 3 步：验证部署

打开浏览器访问 `https://crane-calculator.onrender.com`，应该能看到完整的计算器界面。

---

## ⚠️ 注意事项

- Render 免费层 15 分钟无访问会自动休眠，下次访问需等待 30-60 秒唤醒
- 免费层有 750 小时/月限额（够用）
- 如果有大量用户，可以升级到 $7/月

---

## 🔧 可选：添加自定义域名

1. Render Dashboard → 你的 Web Service → Settings → Custom Domain
2. 添加你的域名（需先在域名商配置 CNAME 指向 `crane-calculator.onrender.com`）
