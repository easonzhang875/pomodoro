#!/usr/bin/env python3
"""
网页数据监控 — 自动检测网页变化并通知

功能：
  - 定时检查指定网页的内容变化
  - 支持关键词匹配（出现/消失时告警）
  - 支持 CSS 选择器精确监控
  - 变化时输出到控制台（可配合邮件/微信通知）

使用示例：
  python web_monitor.py --url "https://example.com/data" --keyword "价格"
  python web_monitor.py --url "https://example.com" --selector ".price" --interval 300
  python web_monitor.py --url "https://example.com" --hash --interval 600
"""

import argparse
import hashlib
import json
import time
from datetime import datetime
from pathlib import Path
import requests
from bs4 import BeautifulSoup

STATE_FILE = "web_monitor_state.json"


def load_state() -> dict:
    """加载上次监控状态"""
    if Path(STATE_FILE).exists():
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    return {}


def save_state(state: dict):
    """保存监控状态"""
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def fetch_page(url: str) -> str:
    """获取网页内容"""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/120.0.0.0 Safari/537.36"
    }
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.text


def get_content_hash(html: str, selector: str = None) -> str:
    """计算网页内容的哈希值"""
    if selector:
        soup = BeautifulSoup(html, "lxml")
        elements = soup.select(selector)
        content = "".join(e.get_text() for e in elements)
    else:
        soup = BeautifulSoup(html, "lxml")
        content = soup.get_text()
    return hashlib.md5(content.encode()).hexdigest()


def search_keyword(html: str, keyword: str, selector: str = None) -> bool:
    """搜索关键词是否存在"""
    if selector:
        soup = BeautifulSoup(html, "lxml")
        elements = soup.select(selector)
        content = " ".join(e.get_text() for e in elements)
    else:
        content = html
    return keyword.lower() in content.lower()


def monitor(url: str, keyword: str = None, selector: str = None,
            use_hash: bool = False, interval: int = 300,
            once: bool = False):
    """监控网页变化"""
    print(f"🔍 开始监控: {url}")
    print(f"   间隔: {interval}s | "
          f"模式: {'哈希对比' if use_hash else '关键词' if keyword else '基础'}")
    print(f"   按 Ctrl+C 停止\n")

    state = load_state()
    url_state = state.get(url, {})

    try:
        while True:
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            try:
                html = fetch_page(url)

                if keyword:
                    found = search_keyword(html, keyword, selector)
                    was_found = url_state.get("keyword_found", False)

                    if found and not was_found:
                        print(f"🚨 [{now}] 关键词出现: '{keyword}'")
                    elif not found and was_found:
                        print(f"⚠️  [{now}] 关键词消失: '{keyword}'")
                    else:
                        print(f"✅ [{now}] 无变化 (关键词{'存在' if found else '不存在'})")

                    url_state["keyword_found"] = found

                elif use_hash:
                    new_hash = get_content_hash(html, selector)
                    old_hash = url_state.get("content_hash", "")

                    if old_hash and new_hash != old_hash:
                        print(f"🚨 [{now}] 内容已变化！")
                    else:
                        print(f"✅ [{now}] 无变化")

                    url_state["content_hash"] = new_hash

                else:
                    # 基础模式：每次打印状态
                    soup = BeautifulSoup(html, "lxml")
                    text = soup.get_text()
                    print(f"📄 [{now}] 页面大小: {len(html)} 字符 | "
                          f"文本: {len(text)} 字符")

                state[url] = url_state
                save_state(state)

            except requests.RequestException as e:
                print(f"❌ [{now}] 请求失败: {e}")

            if once:
                break

            time.sleep(interval)

    except KeyboardInterrupt:
        print(f"\n👋 监控已停止。状态已保存到 {STATE_FILE}")


def main():
    parser = argparse.ArgumentParser(
        description="网页数据监控 — 检测内容变化并告警"
    )
    parser.add_argument("--url", required=True,
                        help="要监控的网页 URL")
    parser.add_argument("--keyword", default=None,
                        help="监控关键词（出现或消失时告警）")
    parser.add_argument("--selector", default=None,
                        help="CSS 选择器（只监控页面特定区域）")
    parser.add_argument("--hash", action="store_true",
                        help="使用内容哈希对比模式（检测任何变化）")
    parser.add_argument("--interval", type=int, default=300,
                        help="检查间隔秒数（默认: 300）")
    parser.add_argument("--once", action="store_true",
                        help="只检查一次后退出")
    args = parser.parse_args()

    monitor(args.url, args.keyword, args.selector,
            args.hash, args.interval, args.once)


if __name__ == "__main__":
    main()
