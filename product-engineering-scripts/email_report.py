#!/usr/bin/env python3
"""
邮件报表自动发送

从 Excel 读取报表数据，自动生成 HTML 邮件并通过 SMTP 发送。
支持定时发送（配合系统任务计划使用）。

使用示例：
  python email_report.py --config email_config.json --data report.xlsx --to manager@example.com
  python email_report.py --config config.json --data weekly.xlsx --cc team@example.com --subject "周报"
"""

import argparse
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from pathlib import Path
from datetime import datetime
import pandas as pd


def load_config(config_file: str) -> dict:
    """加载邮件配置"""
    with open(config_file, "r", encoding="utf-8") as f:
        return json.load(f)


def build_html_table(df: pd.DataFrame, max_rows: int = 50) -> str:
    """将 DataFrame 转为 HTML 表格"""
    display_df = df.head(max_rows)
    html = '<table border="1" cellpadding="6" cellspacing="0" '
    html += 'style="border-collapse:collapse; font-family:Arial; font-size:13px;">'

    # 表头
    html += '<tr style="background-color:#2c3e50; color:white;">'
    for col in display_df.columns:
        html += f"<th>{col}</th>"
    html += "</tr>"

    # 数据行
    for i, (_, row) in enumerate(display_df.iterrows()):
        bg = "#f5f6fa" if i % 2 == 0 else "#ffffff"
        html += f'<tr style="background-color:{bg};">'
        for val in row:
            html += f"<td>{val}</td>"
        html += "</tr>"

    html += "</table>"
    if len(df) > max_rows:
        html += f"<p><i>（共 {len(df)} 行，仅显示前 {max_rows} 行）</i></p>"
    return html


def send_report(config_file: str, data_file: str, to: str,
                cc: str = None, subject: str = None,
                body_text: str = None, attach_data: bool = False):
    """发送报表邮件"""
    config = load_config(config_file)
    data_path = Path(data_file)

    if not data_path.exists():
        print(f"❌ 数据文件不存在: {data_file}")
        return

    # 读取数据
    df = pd.read_excel(data_path) if data_path.suffix in (".xlsx", ".xls") \
         else pd.read_csv(data_path)

    print(f"📂 读取报表数据: {len(df)} 行")

    # 构建邮件
    msg = MIMEMultipart("alternative")
    today = datetime.now().strftime("%Y-%m-%d")
    msg["Subject"] = subject or f"工程数据报表 — {today}"
    msg["From"] = config["sender_email"]
    msg["To"] = to
    if cc:
        msg["Cc"] = cc

    # 构建 HTML 正文
    html_body = f"""
    <html>
    <body style="font-family:Arial,sans-serif;">
      <h2>{msg['Subject']}</h2>
      <p>{body_text or '以下是本期的工程数据汇总，请查收。'}</p>
      <p><b>生成时间:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
      <p><b>数据行数:</b> {len(df)}</p>
      <hr>
      {build_html_table(df)}
      <hr>
      <p style="color:#999;font-size:12px;">
        此邮件由自动报表系统发送。如有疑问，请联系管理员。
      </p>
    </body>
    </html>
    """
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    # 附件（可选）
    if attach_data:
        with open(data_path, "rb") as f:
            attachment = MIMEBase("application", "octet-stream")
            attachment.set_payload(f.read())
            encoders.encode_base64(attachment)
            attachment.add_header(
                "Content-Disposition",
                f"attachment; filename={data_path.name}"
            )
            msg.attach(attachment)

    # 发送
    try:
        server = smtplib.SMTP(config["smtp_server"], config["smtp_port"],
                              timeout=30)
        server.starttls()
        server.login(config["sender_email"], config["sender_password"])
        server.sendmail(config["sender_email"],
                        [to] + ([cc] if cc else []),
                        msg.as_string())
        server.quit()
        print(f"✅ 邮件已发送: {msg['Subject']}")
        print(f"   收件人: {to}")
        if cc:
            print(f"   抄送: {cc}")
    except smtplib.SMTPAuthenticationError:
        print("❌ SMTP 认证失败，请检查邮箱和密码/授权码")
    except Exception as e:
        print(f"❌ 发送失败: {e}")


def create_sample_config(output: str = "email_config.json"):
    """创建示例配置文件"""
    sample = {
        "smtp_server": "smtp.qq.com",
        "smtp_port": 587,
        "sender_email": "your_email@qq.com",
        "sender_password": "your_authorization_code",
        "_note": "QQ邮箱需使用授权码（非登录密码），在QQ邮箱设置→账户→POP3/SMTP中获取"
    }
    with open(output, "w", encoding="utf-8") as f:
        json.dump(sample, f, ensure_ascii=False, indent=2)
    print(f"📝 示例配置文件已创建: {output}")
    print(f"   请修改 sender_email 和 sender_password 后使用")


def main():
    parser = argparse.ArgumentParser(
        description="自动发送报表邮件 — Excel 数据 → HTML 邮件"
    )
    parser.add_argument("--config", required=True,
                        help="邮件配置 JSON 文件（含 SMTP/账号信息）")
    parser.add_argument("--data", required=True,
                        help="报表数据文件（Excel/CSV）")
    parser.add_argument("--to", required=True,
                        help="收件人邮箱")
    parser.add_argument("--cc", default=None,
                        help="抄送邮箱（可选）")
    parser.add_argument("--subject", default=None,
                        help="邮件主题（默认: 工程数据报表_日期）")
    parser.add_argument("--body", default=None,
                        help="邮件正文开头文字")
    parser.add_argument("--attach", action="store_true",
                        help="附加原始数据文件")
    parser.add_argument("--init-config", action="store_true",
                        help="生成示例配置文件后退出")
    args = parser.parse_args()

    if args.init_config:
        create_sample_config()
        return

    send_report(args.config, args.data, args.to, args.cc,
                args.subject, args.body, args.attach)


if __name__ == "__main__":
    main()
