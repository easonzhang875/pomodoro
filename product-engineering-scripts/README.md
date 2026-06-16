# 🛠️ 10 Python Scripts for Engineers

10 个实用 Python 脚本，专为土木/结构/施工工程师设计。每个脚本解决一个具体问题，开箱即用。

---

## 📦 脚本列表

| # | 脚本 | 功能 | 输入 | 输出 |
|---|------|------|------|------|
| 1 | `batch_rename.py` | 批量重命名图纸/文件 | 文件夹路径 + 命名规则 | 重命名后的文件 |
| 2 | `excel_summary.py` | 多Excel工程量自动汇总 | 多个 Excel 文件 | 汇总表 Excel |
| 3 | `pdf_calc_report.py` | 自动生成 PDF 计算书 | Excel 参数表 | 格式化 PDF 报告 |
| 4 | `csv_cleaner.py` | CSV 数据清洗+绘图 | 原始 CSV | 清洗后 CSV + 图表 PNG |
| 5 | `coordinate_converter.py` | 工程坐标批量转换 | 坐标文件 | 转换后坐标文件 |
| 6 | `material_sorter.py` | 材料表自动分类汇总 | 材料清单 Excel | 分类汇总表 |
| 7 | `daily_log_gen.py` | 施工日志自动生成 | 模板 + 数据 | Word 施工日志 |
| 8 | `excel_to_kml.py` | 坐标导出到 Google Earth | Excel 坐标表 | KML 文件 |
| 9 | `email_report.py` | 自动发送邮件报表 | 配置 + 数据 | 邮件发送 |
| 10 | `web_monitor.py` | 网页数据监控 | URL + 监控规则 | 变化通知 |

---

## 🚀 安装

```bash
# 1. 确保安装了 Python 3.8+
python --version

# 2. 安装依赖
pip install -r requirements.txt
```

---

## 📖 使用方法

每个脚本都有详细的命令行参数说明。运行 `python 脚本名.py --help` 查看帮助。

### 示例

```bash
# 批量重命名文件
python batch_rename.py --folder ./drawings --pattern "结构图_" --start 1

# Excel 汇总
python excel_summary.py --folder ./data --output summary.xlsx

# 生成 PDF 计算书
python pdf_calc_report.py --input params.xlsx --output report.pdf
```

---

## 📂 目录结构

```
product-engineering-scripts/
├── README.md
├── requirements.txt
├── batch_rename.py
├── excel_summary.py
├── pdf_calc_report.py
├── csv_cleaner.py
├── coordinate_converter.py
├── material_sorter.py
├── daily_log_gen.py
├── excel_to_kml.py
├── email_report.py
├── web_monitor.py
└── sample_data/          # 示例数据
    ├── drawings/
    ├── monthly_data/
    ├── material_list.xlsx
    ├── coordinates.xlsx
    └── daily_log_template.docx
```

---

## 💰 许可

购买后获得个人使用许可。可用于个人项目和工作项目。
企业和团队使用请联系购买企业许可。

---

## 🆘 支持

使用问题请联系：DM on Reddit u/TemperatureNorth777
