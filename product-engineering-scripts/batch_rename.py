#!/usr/bin/env python3
"""
批量重命名文件 — 专为工程图纸/照片/文档设计

功能：
  - 按前缀+序号重命名一批文件
  - 支持过滤特定扩展名（默认处理所有文件）
  - 支持预览模式（--dry-run，只显示将要执行的操作，不实际重命名）
  - 保留原始文件扩展名

使用示例：
  python batch_rename.py --folder ./drawings --prefix "结构图_" --start 1
  python batch_rename.py --folder ./photos --prefix "现场_" --start 10 --ext .jpg
  python batch_rename.py --folder ./docs --prefix "报告_" --dry-run
"""

import argparse
from pathlib import Path


def batch_rename(folder: str, prefix: str, start: int = 1,
                 ext: str = None, dry_run: bool = False):
    """批量重命名指定文件夹中的文件"""
    folder_path = Path(folder)
    if not folder_path.exists():
        print(f"❌ 文件夹不存在: {folder}")
        return

    # 收集要重命名的文件
    files = sorted(folder_path.iterdir())
    if ext:
        files = [f for f in files if f.suffix.lower() == ext.lower()]
    files = [f for f in files if f.is_file()]

    if not files:
        print(f"📭 没有找到匹配的文件（ext={ext or '所有'}）")
        return

    print(f"📂 找到 {len(files)} 个文件")
    if dry_run:
        print("🔍 [预览模式] 不会实际修改文件\n")

    renamed = 0
    for i, file_path in enumerate(files, start=start):
        new_name = f"{prefix}{i:03d}{file_path.suffix}"
        new_path = file_path.parent / new_name

        if new_path.exists() and new_path != file_path:
            print(f"⚠️  跳过（目标已存在）: {file_path.name} → {new_name}")
            continue

        if dry_run:
            print(f"🔍 {file_path.name} → {new_name}")
        else:
            file_path.rename(new_path)
            print(f"✅ {file_path.name} → {new_name}")
        renamed += 1

    print(f"\n🎉 完成: {renamed}/{len(files)} 个文件{' [预览]' if dry_run else ''}")


def main():
    parser = argparse.ArgumentParser(
        description="批量重命名文件 — 工程图纸/照片/文档管理利器"
    )
    parser.add_argument("--folder", required=True, help="目标文件夹路径")
    parser.add_argument("--prefix", required=True, help="文件名前缀，如 '结构图_'")
    parser.add_argument("--start", type=int, default=1, help="起始序号 (默认: 1)")
    parser.add_argument("--ext", default=None, help="只处理指定扩展名，如 .jpg .pdf")
    parser.add_argument("--dry-run", action="store_true",
                        help="预览模式，不实际修改文件")
    args = parser.parse_args()

    batch_rename(args.folder, args.prefix, args.start, args.ext, args.dry_run)


if __name__ == "__main__":
    main()
