#!/usr/bin/env python3
"""
自动生成 PDF 计算书

从 Excel 参数表读取数据，自动生成带页眉页脚的格式化 PDF 计算书。
适用于：结构计算书、工程量清单、检测报告等需要固定格式输出的场景。

使用示例：
  python pdf_calc_report.py --input params.xlsx --output 计算书.pdf --title "基坑支护计算书"
"""

import argparse
from pathlib import Path
from datetime import datetime
import pandas as pd
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer,
                                 Table, TableStyle, PageBreak)
from reportlab.lib.enums import TA_CENTER, TA_LEFT


# 中文字体支持（Windows 系统自带）
try:
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    pdfmetrics.registerFont(TTFont("SimSun", "C:/Windows/Fonts/simsun.ttc"))
    pdfmetrics.registerFont(TTFont("SimHei", "C:/Windows/Fonts/simhei.ttf"))
    CN_FONT = "SimSun"
    CN_FONT_BOLD = "SimHei"
except Exception:
    CN_FONT = "Helvetica"
    CN_FONT_BOLD = "Helvetica-Bold"


def build_styles():
    """构建报告样式"""
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="CNTitle", fontName=CN_FONT_BOLD, fontSize=18,
        alignment=TA_CENTER, spaceAfter=12, leading=24
    ))
    styles.add(ParagraphStyle(
        name="CNHeading", fontName=CN_FONT_BOLD, fontSize=13,
        spaceBefore=12, spaceAfter=6, leading=18
    ))
    styles.add(ParagraphStyle(
        name="CNBody", fontName=CN_FONT, fontSize=10,
        leading=16, spaceAfter=4
    ))
    return styles


def header_footer(canvas, doc):
    """页眉页脚"""
    canvas.saveState()
    # 页眉线
    canvas.setStrokeColor(HexColor("#333333"))
    canvas.setLineWidth(0.5)
    canvas.line(20 * mm, A4[1] - 15 * mm, A4[0] - 20 * mm, A4[1] - 15 * mm)
    canvas.setFont(CN_FONT, 8)
    canvas.drawString(20 * mm, A4[1] - 14 * mm, "工程计算书")
    canvas.drawRightString(A4[0] - 20 * mm, A4[1] - 14 * mm,
                           datetime.now().strftime("%Y-%m-%d"))

    # 页脚
    canvas.setStrokeColor(HexColor("#999999"))
    canvas.line(20 * mm, 15 * mm, A4[0] - 20 * mm, 15 * mm)
    canvas.drawCentredString(A4[0] / 2, 8 * mm, f"— {canvas.getPageNumber()} —")
    canvas.restoreState()


def generate_report(input_file: str, output_file: str, title: str):
    """从 Excel 参数表生成 PDF 计算书"""
    input_path = Path(input_file)
    if not input_path.exists():
        print(f"❌ 输入文件不存在: {input_file}")
        return

    # 读取所有 Sheet
    excel_file = pd.ExcelFile(input_path)
    print(f"📂 读取 {input_file}，共 {len(excel_file.sheet_names)} 个 Sheet")

    styles = build_styles()
    doc = SimpleDocTemplate(
        output_file, pagesize=A4,
        leftMargin=25 * mm, rightMargin=25 * mm,
        topMargin=20 * mm, bottomMargin=20 * mm
    )

    story = []
    # ── 封面 ──
    story.append(Spacer(1, 40 * mm))
    story.append(Paragraph(title, styles["CNTitle"]))
    story.append(Spacer(1, 10 * mm))
    story.append(Paragraph(f"生成日期: {datetime.now().strftime('%Y年%m月%d日')}",
                           styles["CNBody"]))
    story.append(Paragraph(f"数据来源: {input_path.name}", styles["CNBody"]))
    story.append(PageBreak())

    # ── 内容页：每个 Sheet 一个表格 ──
    for sheet_name in excel_file.sheet_names:
        story.append(Paragraph(f"📋 {sheet_name}", styles["CNHeading"]))

        df = pd.read_excel(input_file, sheet_name=sheet_name)
        # 限制显示列数（最多 8 列，太多放不下 A4）
        display_cols = df.columns[:8].tolist()
        df_display = df[display_cols].head(30)  # 最多显示 30 行

        # 构建表格
        table_data = [display_cols] + df_display.values.tolist()
        table_data = [[str(c) for c in row] for row in table_data]

        col_width = (A4[0] - 50 * mm) / len(display_cols)
        tbl = Table(table_data, colWidths=[col_width] * len(display_cols))
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), HexColor("#2c3e50")),
            ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#ffffff")),
            ("FONTNAME", (0, 0), (-1, 0), CN_FONT_BOLD),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("FONTNAME", (0, 1), (-1, -1), CN_FONT),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#cccccc")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [HexColor("#ffffff"),
                                                   HexColor("#f5f6fa")]),
        ]))
        story.append(tbl)
        story.append(Spacer(1, 5 * mm))
        story.append(Paragraph(f"— 共 {len(df)} 行，显示前 {len(df_display)} 行",
                               styles["CNBody"]))

        if len(excel_file.sheet_names) > 1:
            story.append(PageBreak())

    # 生成 PDF
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(f"✅ PDF 计算书已生成: {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description="从 Excel 参数表自动生成格式化 PDF 计算书"
    )
    parser.add_argument("--input", required=True, help="输入 Excel 参数表路径")
    parser.add_argument("--output", default="计算书.pdf", help="输出 PDF 文件路径")
    parser.add_argument("--title", default="工程计算书", help="计算书标题")
    args = parser.parse_args()

    generate_report(args.input, args.output, args.title)


if __name__ == "__main__":
    main()
