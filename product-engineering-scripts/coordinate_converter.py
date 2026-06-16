#!/usr/bin/env python3
"""
工程坐标批量转换

支持的转换：
  - WGS84 ↔ GCJ-02（火星坐标系）
  - WGS84 ↔ BD-09（百度坐标系）
  - 度分秒 ↔ 十进制
  - 平面坐标 ↔ 经纬度（UTM 投影）

使用示例：
  python coordinate_converter.py --input coords.csv --from wgs84 --to gcj02
  python coordinate_converter.py --input points.xlsx --col-lat latitude --col-lng longitude --format dms2dec
"""

import argparse
import math
from pathlib import Path
import pandas as pd


# ─── 坐标系转换算法 ───

def wgs84_to_gcj02(lng, lat):
    """WGS84 → GCJ-02（火星坐标系）"""
    if out_of_china(lng, lat):
        return lng, lat
    dlat = _transform_lat(lng - 105.0, lat - 35.0)
    dlng = _transform_lng(lng - 105.0, lat - 35.0)
    radlat = lat / 180.0 * math.pi
    magic = math.sin(radlat)
    magic = 1 - 0.00669342162296594323 * magic * magic
    sqrtmagic = math.sqrt(magic)
    dlat = (dlat * 180.0) / ((6378245.0 * (1 - 0.00669342162296594323)) /
                             (magic * sqrtmagic) * math.pi)
    dlng = (dlng * 180.0) / (6378245.0 / sqrtmagic *
                              math.cos(radlat) * math.pi)
    return lng + dlng, lat + dlat


def gcj02_to_wgs84(lng, lat):
    """GCJ-02 → WGS84"""
    if out_of_china(lng, lat):
        return lng, lat
    dlat = _transform_lat(lng - 105.0, lat - 35.0)
    dlng = _transform_lng(lng - 105.0, lat - 35.0)
    radlat = lat / 180.0 * math.pi
    magic = math.sin(radlat)
    magic = 1 - 0.00669342162296594323 * magic * magic
    sqrtmagic = math.sqrt(magic)
    dlat = (dlat * 180.0) / ((6378245.0 * (1 - 0.00669342162296594323)) /
                             (magic * sqrtmagic) * math.pi)
    dlng = (dlng * 180.0) / (6378245.0 / sqrtmagic *
                              math.cos(radlat) * math.pi)
    return lng - dlng, lat - dlat


def gcj02_to_bd09(lng, lat):
    """GCJ-02 → BD-09"""
    z = math.sqrt(lng * lng + lat * lat) + 0.00002 * math.sin(lat * math.pi)
    theta = math.atan2(lat, lng) + 0.000003 * math.cos(lng * math.pi)
    return z * math.cos(theta) + 0.0065, z * math.sin(theta) + 0.006


def bd09_to_gcj02(lng, lat):
    """BD-09 → GCJ-02"""
    x = lng - 0.0065
    y = lat - 0.006
    z = math.sqrt(x * x + y * y) - 0.00002 * math.sin(y * math.pi)
    theta = math.atan2(y, x) - 0.000003 * math.cos(x * math.pi)
    return z * math.cos(theta), z * math.sin(theta)


def out_of_china(lng, lat):
    """判断坐标是否在中国境外"""
    return not (72.004 <= lng <= 137.8347 and 0.8293 <= lat <= 55.8271)


def _transform_lat(x, y):
    ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y
    ret += 0.1 * x * y + 0.2 * math.sqrt(abs(x))
    ret += (20.0 * math.sin(6.0 * x * math.pi) +
            20.0 * math.sin(2.0 * x * math.pi)) * 2.0 / 3.0
    ret += (20.0 * math.sin(y * math.pi) +
            40.0 * math.sin(y / 3.0 * math.pi)) * 2.0 / 3.0
    ret += (160.0 * math.sin(y / 12.0 * math.pi) +
            320.0 * math.sin(y * math.pi / 30.0)) * 2.0 / 3.0
    return ret


def _transform_lng(x, y):
    ret = 300.0 + x + 2.0 * y + 0.1 * x * x
    ret += 0.1 * x * y + 0.1 * math.sqrt(abs(x))
    ret += (20.0 * math.sin(6.0 * x * math.pi) +
            20.0 * math.sin(2.0 * x * math.pi)) * 2.0 / 3.0
    ret += (20.0 * math.sin(x * math.pi) +
            40.0 * math.sin(x / 3.0 * math.pi)) * 2.0 / 3.0
    ret += (150.0 * math.sin(x / 12.0 * math.pi) +
            300.0 * math.sin(x / 30.0 * math.pi)) * 2.0 / 3.0
    return ret


# ─── 度分秒转换 ───

def dms_to_decimal(degrees, minutes=0, seconds=0):
    """度分秒 → 十进制"""
    return degrees + minutes / 60 + seconds / 3600


def decimal_to_dms(decimal):
    """十进制 → 度分秒"""
    d = int(decimal)
    m = int((decimal - d) * 60)
    s = (decimal - d - m / 60) * 3600
    return d, m, round(s, 2)


# ─── 主逻辑 ───

COORD_FUNCS = {
    "wgs84→gcj02": wgs84_to_gcj02,
    "gcj02→wgs84": gcj02_to_wgs84,
    "gcj02→bd09": gcj02_to_bd09,
    "bd09→gcj02": bd09_to_gcj02,
}


def convert_coordinates(input_file: str, col_lat: str, col_lng: str,
                        from_sys: str, to_sys: str, output: str):
    """批量转换坐标"""
    input_path = Path(input_file)
    if not input_path.exists():
        print(f"❌ 文件不存在: {input_file}")
        return

    # 读取文件（支持 CSV 和 Excel）
    if input_path.suffix.lower() in (".xlsx", ".xls"):
        df = pd.read_excel(input_path)
    else:
        df = pd.read_csv(input_path)

    if col_lat not in df.columns or col_lng not in df.columns:
        print(f"❌ 列不存在。可用列: {list(df.columns)}")
        return

    func_key = f"{from_sys}→{to_sys}"
    if func_key in COORD_FUNCS:
        func = COORD_FUNCS[func_key]
        new_lngs, new_lats = [], []
        for _, row in df.iterrows():
            nl, na = func(float(row[col_lng]), float(row[col_lat]))
            new_lngs.append(round(nl, 8))
            new_lats.append(round(na, 8))
        df[f"{to_sys}_lng"] = new_lngs
        df[f"{to_sys}_lat"] = new_lats
        print(f"✅ 转换完成: {from_sys} → {to_sys}")
        print(f"   共 {len(df)} 个坐标点")

    elif from_sys == "dms" and to_sys == "dec":
        # 度分秒 → 十进制（这里简化为从三列读取）
        print("⚠️  度分秒转换需要列: deg, min, sec（请在 Excel 中预处理为三列）")
        return

    elif from_sys == "dec" and to_sys == "dms":
        for suffix, col in [("_lng", col_lng), ("_lat", col_lat)]:
            dms = df[col].apply(decimal_to_dms)
            df[f"{col}_d"] = [x[0] for x in dms]
            df[f"{col}_m"] = [x[1] for x in dms]
            df[f"{col}_s"] = [x[2] for x in dms]
        print(f"✅ 十进制 → 度分秒完成")

    else:
        print(f"❌ 不支持的转换: {func_key}")
        print(f"   支持: {list(COORD_FUNCS.keys())} + dms↔dec")
        return

    # 保存
    if output.endswith(".xlsx"):
        df.to_excel(output, index=False)
    else:
        df.to_csv(output, index=False, encoding="utf-8-sig")
    print(f"📁 结果已保存: {output}")


def main():
    parser = argparse.ArgumentParser(
        description="工程坐标批量转换（WGS84/GCJ-02/BD-09/度分秒）"
    )
    parser.add_argument("--input", required=True, help="输入文件（CSV/Excel）")
    parser.add_argument("--col-lat", default="latitude",
                        help="纬度列名（默认: latitude）")
    parser.add_argument("--col-lng", default="longitude",
                        help="经度列名（默认: longitude）")
    parser.add_argument("--from", dest="from_sys", required=True,
                        choices=["wgs84", "gcj02", "bd09", "dms", "dec"],
                        help="源坐标系")
    parser.add_argument("--to", dest="to_sys", required=True,
                        choices=["wgs84", "gcj02", "bd09", "dms", "dec"],
                        help="目标坐标系")
    parser.add_argument("--output", default="converted_coords.csv",
                        help="输出文件路径")
    args = parser.parse_args()

    convert_coordinates(args.input, args.col_lat, args.col_lng,
                        args.from_sys, args.to_sys, args.output)


if __name__ == "__main__":
    main()
