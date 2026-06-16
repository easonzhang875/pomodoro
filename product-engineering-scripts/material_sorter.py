#!/usr/bin/env python3
"""
材料表自动分类汇总

功能：
  - 读取材料清单 Excel
  - 按类别/规格自动分类
  - 汇总每类的数量和总价
  - 输出分类汇总表 + 饼图

使用示例：
  python material_sorter.py --input 材料清单.xlsx --category "类别" --qty "数量" --price "单价"
  python material_sorter.py --input materials.xlsx --category "Type" --qty "Qty" --price "UnitPrice" --plot
"""

import argparse
from pathlib import Path
import pandas as pd


def sort_materials(input_file: str, cat_col: str, qty_col: str,
                   price_col: str, output: str, plot: bool = False):
    """材料表分类汇总"""
    input_path = Path(input_file)
    if not input_path.exists():
        print(f"❌ 文件不存在: {input_file}")
        return

    df = pd.read_excel(input_path) if input_path.suffix in (".xlsx", ".xls") \
         else pd.read_csv(input_path)

    print(f"📂 读取: {len(df)} 条材料记录")
    print(f"   列: {list(df.columns)}")

    # 验证列
    for col, name in [(cat_col, "分类"), (qty_col, "数量"), (price_col, "单价")]:
        if col not in df.columns:
            print(f"❌ 找不到{name}列: '{col}'。可用列: {list(df.columns)}")
            return

    df["_金额"] = pd.to_numeric(df[qty_col], errors="coerce") * \
                  pd.to_numeric(df[price_col], errors="coerce")

    # 分类汇总
    summary = df.groupby(cat_col).agg(
        数量=(qty_col, "sum"),
        平均单价=(price_col, "mean"),
        总金额=("_金额", "sum"),
        条目数=(qty_col, "count")
    ).reset_index()

    summary = summary.sort_values("总金额", ascending=False)

    # 加总计行
    total = {
        cat_col: "【合计】",
        "数量": summary["数量"].sum(),
        "平均单价": summary["平均单价"].mean(),
        "总金额": summary["总金额"].sum(),
        "条目数": summary["条目数"].sum()
    }
    summary = pd.concat([summary, pd.DataFrame([total])], ignore_index=True)

    # 格式化输出
    summary["总金额"] = summary["总金额"].round(2)
    summary["平均单价"] = summary["平均单价"].round(2)

    summary.to_excel(output, index=False)
    print(f"\n📊 分类汇总表已保存: {output}")
    print(f"\n{'='*50}")
    print(f"{'类别':<15} {'数量':>8} {'总金额':>12} {'条目':>6}")
    print(f"{'-'*50}")
    for _, row in summary.iterrows():
        print(f"{str(row[cat_col]):<15} {row['数量']:>8.1f} "
              f"{row['总金额']:>12.2f} {row['条目数']:>6}")

    # 饼图
    if plot:
        try:
            import matplotlib
            matplotlib.use("Agg")
            import matplotlib.pyplot as plt

            plot_data = summary[summary[cat_col] != "【合计】"].head(8)
            plt.figure(figsize=(8, 8))
            plt.pie(plot_data["总金额"], labels=plot_data[cat_col],
                    autopct="%1.1f%%", startangle=90,
                    colors=plt.cm.Set3(range(len(plot_data))))
            plt.title("材料分类 — 金额占比", fontsize=14)
            plot_path = Path(output).with_suffix(".png")
            plt.savefig(plot_path, dpi=150, bbox_inches="tight")
            plt.close()
            print(f"📊 饼图已保存: {plot_path}")
        except ImportError:
            print("⚠️  未安装 matplotlib，跳过图表")


def main():
    parser = argparse.ArgumentParser(
        description="材料表自动分类汇总 — 按类别汇总数量/金额"
    )
    parser.add_argument("--input", required=True, help="材料清单 Excel/CSV 文件")
    parser.add_argument("--category", required=True, help="分类列名")
    parser.add_argument("--qty", required=True, help="数量列名")
    parser.add_argument("--price", required=True, help="单价列名")
    parser.add_argument("--output", default="材料分类汇总.xlsx",
                        help="输出文件路径")
    parser.add_argument("--plot", action="store_true",
                        help="生成金额占比饼图")
    args = parser.parse_args()

    sort_materials(args.input, args.category, args.qty, args.price,
                   args.output, args.plot)


if __name__ == "__main__":
    main()
