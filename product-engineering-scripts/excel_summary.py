#!/usr/bin/env python3
"""
多 Excel 工程量自动汇总

功能：
  - 读取一个文件夹下所有 Excel 文件的同名 Sheet
  - 按指定列自动汇总（求和）
  - 输出汇总表到新 Excel 文件
  - 支持自定义汇总列和分组列

使用示例：
  python excel_summary.py --folder ./monthly_data --sheet "工程量" --sum-cols "混凝土(m3),钢筋(kg)"
  python excel_summary.py --folder ./data --sheet "清单" --sum-cols "数量,金额" --group-by "分项"
"""

import argparse
from pathlib import Path
import pandas as pd


def excel_summary(folder: str, sheet: str, sum_cols: list,
                  group_by: str = None, output: str = "summary.xlsx"):
    """汇总文件夹中所有 Excel 文件的指定列"""
    folder_path = Path(folder)
    if not folder_path.exists():
        print(f"❌ 文件夹不存在: {folder}")
        return

    excel_files = list(folder_path.glob("*.xlsx")) + list(folder_path.glob("*.xls"))
    excel_files = sorted(excel_files)

    if not excel_files:
        print("📭 没有找到 Excel 文件")
        return

    print(f"📂 找到 {len(excel_files)} 个 Excel 文件")

    all_data = []
    for f in excel_files:
        try:
            df = pd.read_excel(f, sheet_name=sheet)
            df["_来源文件"] = f.name
            all_data.append(df)
            print(f"  ✅ {f.name}: {len(df)} 行")
        except Exception as e:
            print(f"  ⚠️  {f.name}: 读取失败 — {e}")

    if not all_data:
        print("❌ 没有成功读取任何数据")
        return

    combined = pd.concat(all_data, ignore_index=True)

    # 检查汇总列是否存在
    valid_cols = [c for c in sum_cols if c in combined.columns]
    missing_cols = [c for c in sum_cols if c not in combined.columns]
    if missing_cols:
        print(f"⚠️  以下列不存在，已跳过: {missing_cols}")

    if not valid_cols:
        print("❌ 没有有效的汇总列")
        return

    # 汇总
    if group_by and group_by in combined.columns:
        summary = combined.groupby(group_by)[valid_cols].sum().reset_index()
        summary = summary.sort_values(group_by)
    else:
        summary = pd.DataFrame({col: [combined[col].sum()] for col in valid_cols})
        if group_by:
            print(f"⚠️  分组列 '{group_by}' 不存在，输出总计")

    # 加上总计行
    total_row = {group_by: "【合计】"} if (group_by and group_by in combined.columns) else {}
    for col in valid_cols:
        total_row[col] = combined[col].sum()
    summary = pd.concat([summary, pd.DataFrame([total_row])], ignore_index=True)

    summary.to_excel(output, index=False)
    print(f"\n📊 汇总表已保存: {output}")
    print(f"   总行数: {len(combined)} → 汇总行: {len(summary)}")
    print(f"   汇总列: {valid_cols}")


def main():
    parser = argparse.ArgumentParser(
        description="多 Excel 工程量自动汇总"
    )
    parser.add_argument("--folder", required=True, help="包含 Excel 文件的文件夹")
    parser.add_argument("--sheet", required=True, help="要读取的 Sheet 名称")
    parser.add_argument("--sum-cols", required=True,
                        help="要汇总的列名，用逗号分隔，如 '数量,金额'")
    parser.add_argument("--group-by", default=None, help="分组列名（可选）")
    parser.add_argument("--output", default="summary.xlsx", help="输出文件路径")
    args = parser.parse_args()

    sum_cols = [c.strip() for c in args.sum_cols.split(",")]
    excel_summary(args.folder, args.sheet, sum_cols, args.group_by, args.output)


if __name__ == "__main__":
    main()
