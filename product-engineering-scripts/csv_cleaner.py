#!/usr/bin/env python3
"""
CSV 数据清洗 + 自动绘图

功能：
  - 自动检测并删除空行/空列
  - 缺失值填充（均值/中位数/固定值）
  - 数值列自动检测异常值（超出 3σ 范围标记）
  - 自动生成数据分布图表（直方图 + 箱线图）

使用示例：
  python csv_cleaner.py --input raw_data.csv --output clean_data.csv
  python csv_cleaner.py --input data.csv --fill median --plot
"""

import argparse
from pathlib import Path
import pandas as pd
import numpy as np


def clean_csv(input_file: str, output_file: str,
              fill_method: str = "none", plot: bool = False):
    """清洗 CSV 数据"""
    input_path = Path(input_file)
    if not input_path.exists():
        print(f"❌ 文件不存在: {input_file}")
        return

    df = pd.read_csv(input_path)
    original_rows, original_cols = df.shape
    print(f"📂 读取: {original_rows} 行 × {original_cols} 列")

    # ── 1. 删除全空行和全空列 ──
    df = df.dropna(how="all")
    df = df.dropna(axis=1, how="all")
    print(f"   删除空行/空列后: {df.shape[0]} 行 × {df.shape[1]} 列")

    # ── 2. 数值列分析 ──
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    # ── 3. 缺失值填充 ──
    if fill_method != "none" and numeric_cols:
        for col in numeric_cols:
            if df[col].isna().sum() > 0:
                if fill_method == "mean":
                    df[col] = df[col].fillna(df[col].mean())
                elif fill_method == "median":
                    df[col] = df[col].fillna(df[col].median())
                elif fill_method == "zero":
                    df[col] = df[col].fillna(0)
                print(f"   🔧 {col}: 填充 {df[col].isna().sum()} 个缺失值 ({fill_method})")

    # ── 4. 异常值检测 ──
    outliers_summary = {}
    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) < 10:
            continue
        mean, std = series.mean(), series.std()
        lower, upper = mean - 3 * std, mean + 3 * std
        outlier_mask = (df[col] < lower) | (df[col] > upper)
        outlier_count = outlier_mask.sum()
        if outlier_count > 0:
            outliers_summary[col] = {
                "count": int(outlier_count),
                "range": f"[{lower:.2f}, {upper:.2f}]",
                "values": df.loc[outlier_mask, col].tolist()[:5]
            }
            print(f"   ⚠️  {col}: {outlier_count} 个异常值 (正常范围: {lower:.2f} ~ {upper:.2f})")

    # 保存清洗数据
    df.to_csv(output_file, index=False, encoding="utf-8-sig")
    print(f"\n✅ 清洗完成: {output_file}")
    print(f"   原始: {original_rows}行 → 清洗后: {df.shape[0]}行")

    # ── 5. 自动绘图 ──
    if plot and numeric_cols:
        try:
            import matplotlib
            matplotlib.use("Agg")
            import matplotlib.pyplot as plt

            plot_cols = numeric_cols[:4]  # 最多画 4 个
            fig, axes = plt.subplots(len(plot_cols), 2,
                                     figsize=(12, 3 * len(plot_cols)))
            if len(plot_cols) == 1:
                axes = axes.reshape(1, -1)

            for i, col in enumerate(plot_cols):
                data = df[col].dropna()
                # 直方图
                axes[i, 0].hist(data, bins=30, color="#3498db", edgecolor="white")
                axes[i, 0].set_title(f"{col} — Distribution")
                axes[i, 0].axvline(data.mean(), color="red", linestyle="--",
                                   label=f"Mean={data.mean():.2f}")
                axes[i, 0].legend(fontsize=8)
                # 箱线图
                axes[i, 1].boxplot(data, vert=True, patch_artist=True,
                                   boxprops=dict(facecolor="#2ecc71"))
                axes[i, 1].set_title(f"{col} — Box Plot")

            plt.tight_layout()
            plot_path = Path(output_file).with_suffix(".png")
            plt.savefig(plot_path, dpi=150, bbox_inches="tight")
            plt.close()
            print(f"📊 图表已保存: {plot_path}")
        except ImportError:
            print("⚠️  未安装 matplotlib，跳过绘图（pip install matplotlib）")


def main():
    parser = argparse.ArgumentParser(
        description="CSV 数据清洗 + 自动异常检测 + 可视化"
    )
    parser.add_argument("--input", required=True, help="输入 CSV 文件路径")
    parser.add_argument("--output", default="cleaned_data.csv",
                        help="输出清洗后 CSV 文件路径")
    parser.add_argument("--fill", default="none",
                        choices=["none", "mean", "median", "zero"],
                        help="缺失值填充方法")
    parser.add_argument("--plot", action="store_true",
                        help="自动生成数据分布图表")
    args = parser.parse_args()

    clean_csv(args.input, args.output, args.fill, args.plot)


if __name__ == "__main__":
    main()
