#!/usr/bin/env python3
"""
建材价格数据采集 — 公开数据源价格汇总

从公开的建材信息价网站采集价格数据，汇总到 Excel。
⚠️ 仅用于合法数据采集，请遵守目标网站的 robots.txt 和使用条款。

使用示例：
  python steel_price_scraper.py --source demo --output 钢材价格.xlsx
  python steel_price_scraper.py --source demo --category "螺纹钢" --days 30
"""

import argparse
from datetime import datetime, timedelta
from pathlib import Path
import pandas as pd
import requests


# ─── 示例数据源（公开的工程材料价格参考） ───

DEMO_STEEL_PRICES = {
    "螺纹钢 HRB400 Φ16-25mm": {
        "unit": "元/吨",
        "prices": [
            ("2026-06-10", 3880), ("2026-06-11", 3875), ("2026-06-12", 3890),
            ("2026-06-13", 3910), ("2026-06-14", 3920), ("2026-06-15", 3905),
            ("2026-06-09", 3865), ("2026-06-08", 3850), ("2026-06-07", 3840),
            ("2026-06-06", 3835), ("2026-06-05", 3820), ("2026-06-04", 3810),
            ("2026-06-03", 3830), ("2026-06-02", 3845), ("2026-06-01", 3860),
        ]
    },
    "盘螺 HRB400 Φ8-10mm": {
        "unit": "元/吨",
        "prices": [
            ("2026-06-10", 4010), ("2026-06-11", 4005), ("2026-06-12", 4020),
            ("2026-06-13", 4035), ("2026-06-14", 4040), ("2026-06-15", 4030),
            ("2026-06-09", 3995), ("2026-06-08", 3980), ("2026-06-07", 3970),
            ("2026-06-06", 3965), ("2026-06-05", 3950), ("2026-06-04", 3940),
            ("2026-06-03", 3960), ("2026-06-02", 3975), ("2026-06-01", 3990),
        ]
    },
    "线材 HPB300 Φ6.5-10mm": {
        "unit": "元/吨",
        "prices": [
            ("2026-06-10", 3760), ("2026-06-11", 3755), ("2026-06-12", 3770),
            ("2026-06-13", 3785), ("2026-06-14", 3790), ("2026-06-15", 3780),
            ("2026-06-09", 3745), ("2026-06-08", 3730), ("2026-06-07", 3720),
            ("2026-06-06", 3715), ("2026-06-05", 3700), ("2026-06-04", 3685),
            ("2026-06-03", 3710), ("2026-06-02", 3725), ("2026-06-01", 3740),
        ]
    },
    "中厚板 Q235B 14-20mm": {
        "unit": "元/吨",
        "prices": [
            ("2026-06-10", 4150), ("2026-06-11", 4140), ("2026-06-12", 4160),
            ("2026-06-13", 4175), ("2026-06-14", 4180), ("2026-06-15", 4170),
            ("2026-06-09", 4130), ("2026-06-08", 4120), ("2026-06-07", 4105),
            ("2026-06-06", 4095), ("2026-06-05", 4080), ("2026-06-04", 4070),
            ("2026-06-03", 4090), ("2026-06-02", 4100), ("2026-06-01", 4120),
        ]
    },
    "热轧卷板 Q235B 4.75mm": {
        "unit": "元/吨",
        "prices": [
            ("2026-06-10", 3920), ("2026-06-11", 3910), ("2026-06-12", 3930),
            ("2026-06-13", 3945), ("2026-06-14", 3950), ("2026-06-15", 3935),
            ("2026-06-09", 3900), ("2026-06-08", 3885), ("2026-06-07", 3870),
            ("2026-06-06", 3860), ("2026-06-05", 3850), ("2026-06-04", 3835),
            ("2026-06-03", 3855), ("2026-06-02", 3870), ("2026-06-01", 3885),
        ]
    },
}


def scrape_demo(category: str = None, days: int = 30,
                output: str = "steel_prices.xlsx"):
    """使用演示数据生成价格表"""
    print("📊 使用示例建材价格数据\n")
    print("⚠️  提示：这是演示数据，真实使用时请对接实际数据源")
    print("   如：我的钢铁网(www.mysteel.com)、西本新干线(www.96369.net) 等\n")

    all_data = []
    cutoff_date = datetime.now() - timedelta(days=days)

    for material, info in DEMO_STEEL_PRICES.items():
        if category and category not in material:
            continue

        for date_str, price in info["prices"]:
            price_date = datetime.strptime(date_str, "%Y-%m-%d")
            if price_date >= cutoff_date:
                all_data.append({
                    "品种": material,
                    "日期": date_str,
                    "价格": price,
                    "单位": info["unit"],
                })

    if not all_data:
        print(f"❌ 未找到匹配 '{category}' 的材料数据")
        return

    df = pd.DataFrame(all_data)
    df = df.sort_values(["品种", "日期"])

    # 统计分析
    print(f"📈 统计摘要（近 {days} 天）\n")
    for material in df["品种"].unique():
        subset = df[df["品种"] == material]
        print(f"  {material}")
        print(f"    最高: ¥{subset['价格'].max()} | "
              f"最低: ¥{subset['价格'].min()} | "
              f"平均: ¥{subset['价格'].mean():.0f} | "
              f"最新: ¥{subset.iloc[-1]['价格']}")

    # 保存到 Excel（多个 Sheet）
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        # 详细数据
        df.to_excel(writer, sheet_name="价格明细", index=False)

        # 汇总表
        pivot = df.pivot_table(
            values="价格", index="日期", columns="品种", aggfunc="mean"
        )
        pivot.to_excel(writer, sheet_name="价格走势")

        # 统计表
        stats = df.groupby("品种")["价格"].agg(["count", "mean", "min", "max", "std"])
        stats.columns = ["数据条数", "平均价", "最低价", "最高价", "标准差"]
        stats.to_excel(writer, sheet_name="统计分析")

    print(f"\n✅ 数据已保存: {output}")
    print(f"   Sheet 1: 价格明细 ({len(df)} 条)")
    print(f"   Sheet 2: 价格走势 (透视表)")
    print(f"   Sheet 3: 统计分析")


def main():
    parser = argparse.ArgumentParser(
        description="建材价格数据采集 — 公开数据源价格汇总"
    )
    parser.add_argument("--source", default="demo",
                        choices=["demo"],
                        help="数据源（默认: demo 演示数据）")
    parser.add_argument("--category", default=None,
                        help="材料类别筛选，如 '螺纹钢'")
    parser.add_argument("--days", type=int, default=30,
                        help="采集最近多少天的数据（默认: 30）")
    parser.add_argument("--output", default="建材价格汇总.xlsx",
                        help="输出 Excel 文件路径")
    args = parser.parse_args()

    if args.source == "demo":
        scrape_demo(args.category, args.days, args.output)


if __name__ == "__main__":
    main()
