# 示例数据

本目录包含用于测试各脚本的示例数据文件。

## 文件说明

| 文件 | 用于脚本 | 内容 |
|------|----------|------|
| `monthly_data/` | excel_summary.py | 模拟月度工程量 Excel 文件 |
| `material_list.xlsx` | material_sorter.py | 材料清单（含类别/数量/单价） |
| `coordinates.xlsx` | coordinate_converter.py & excel_to_kml.py | 测量点位坐标 |
| `daily_log_data.xlsx` | daily_log_gen.py | 施工进度数据 |
| `params.xlsx` | pdf_calc_report.py | 计算参数表 |

## 使用方式

将本目录中的文件作为脚本的 `--input` 参数即可测试：

```bash
# 测试材料分类汇总
python material_sorter.py --input sample_data/material_list.xlsx --category "类别" --qty "数量" --price "单价" --plot

# 测试坐标转换
python coordinate_converter.py --input sample_data/coordinates.xlsx --col-lat latitude --col-lng longitude --from wgs84 --to gcj02

# 测试 Excel 汇总
python excel_summary.py --folder sample_data/monthly_data --sheet "工程量" --sum-cols "混凝土(m3),钢筋(kg)"

# 测试生成 PDF 计算书
python pdf_calc_report.py --input sample_data/params.xlsx --title "基坑支护计算书"
```
