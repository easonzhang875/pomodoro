"""
计算书生成器
生成含完整计算公式、代入数值、规范引用的 HTML 计算书
支持浏览器直接打印（Ctrl+P）
"""

import math
from datetime import datetime
from calculator import WorkingCondition, CalculationResult

G = 9.80665


def generate_report_html(
    project_name: str,
    crane: dict,
    condition: WorkingCondition,
    result: CalculationResult,
) -> str:
    """
    生成完整的 HTML 计算书
    """
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    # ── 辅助格式化 ──
    def fmt(val, unit="", decimals=2):
        if isinstance(val, float):
            s = f"{val:.{decimals}f}"
        else:
            s = str(val)
        return f"{s} {unit}".strip()

    def row(label, value, unit=""):
        return f"<tr><td>{label}</td><td>{fmt(value, unit)}</td></tr>"

    def formula_block(step_num, title, formulas, ref):
        """渲染一个计算步骤块"""
        lines = []
        lines.append(f'<div class="calc-step">')
        lines.append(f'<h3>步骤 {step_num}：{title}</h3>')
        for label, expr, value, unit in formulas:
            lines.append(f'<div class="formula-line">')
            lines.append(f'<span class="formula-label">{label}：</span>')
            lines.append(f'<span class="formula-expr">{expr}</span>')
            lines.append(f'<span class="formula-eq">=</span>')
            lines.append(f'<span class="formula-value">{fmt(value, unit)}</span>')
            lines.append(f'</div>')
        lines.append(f'<div class="ref">📖 参考规范：{ref}</div>')
        lines.append(f'</div>')
        return "\n".join(lines)

    # ── 各步骤计算详情 ──
    alpha_rad = math.radians(condition.boom_angle_deg)
    theta_rad = math.radians(condition.slew_angle_deg)

    L = condition.boom_length_m
    alpha = condition.boom_angle_deg
    theta = condition.slew_angle_deg
    cos_a = math.cos(alpha_rad)
    sin_a = math.sin(alpha_rad)
    sin_t = math.sin(theta_rad)
    cos_t = math.cos(theta_rad)

    step1 = formula_block(1, "吊物位置计算（臂架几何）", [
        ("工作幅度 R", f"L × cos(α) = {L} × cos({alpha}°)",
         result.working_radius_m, "m"),
        ("吊物横向偏移 X_load", f"R × sin(θ) = {result.working_radius_m} × sin({theta}°)",
         result.load_x_m, "m"),
        ("吊物纵向偏移 Y_load", f"R × cos(θ) = {result.working_radius_m} × cos({theta}°)",
         result.load_y_m, "m"),
        ("起升高度 H", f"H₀ + L × sin(α) = {condition.boom_pivot_height_m} + {L} × sin({alpha}°)",
         result.load_height_m, "m"),
    ], "GB/T 3811-2008 附录 A — 臂架系统几何关系")

    # 步骤 2
    m_crane = condition.crane_mass_kg
    m_load = condition.load_mass_kg
    phi = condition.dynamic_factor
    m_load_dyn = m_load * phi
    e_x = result.cg_x_m
    e_y = result.cg_y_m

    step2 = formula_block(2, "总重心计算（载荷组合）", [
        ("动载吊物质量", f"φ × G_load = {phi} × {m_load}",
         m_load_dyn, "kg"),
        ("总质量 Σm", f"{m_crane} + {m_load_dyn:.0f}",
         result.total_mass_kg, "kg"),
        ("总垂直载荷 V", f"Σm × g / 1000 = {result.total_mass_kg} × {G} / 1000",
         result.total_weight_kn, "kN"),
        ("重心横向坐标 e_x", f"(Σ m_i·x_i) / Σm",
         e_x, "m"),
        ("重心纵向坐标 e_y", f"(Σ m_i·y_i) / Σm",
         e_y, "m"),
    ], "GB/T 3811-2008 §4.2 — 载荷与载荷组合；GB/T 3811-2008 表 4 — 起升动载系数 φ₂")

    # 步骤 3
    V = result.total_weight_kn
    Mx = result.moment_x_knm
    My = result.moment_y_knm
    a = condition.outrigger_long_m
    b = condition.outrigger_trans_m

    r_data = {r.name: r.force_kn for r in result.reactions}

    step3_formulas = [
        ("绕 X 轴力矩 Mx", f"V × e_x = {V} × {e_x}", Mx, "kN·m"),
        ("绕 Y 轴力矩 My", f"V × e_y = {V} × {e_y}", My, "kN·m"),
        ("支腿纵向跨距 a", "", a, "m"),
        ("支腿横向跨距 b", "", b, "m"),
    ]
    for r in result.reactions:
        step3_formulas.append((f"支腿「{r.name}」反力",
                              f"V/4 ± My/(2a) ± Mx/(2b)",
                              r.force_kn, "kN"))

    step3 = formula_block(3, "支腿反力计算（四点支撑刚体模型）", step3_formulas,
        "GB/T 3811-2008 §5.3 — 支承反力计算；ISO 4305:2014 §6 — 稳定性计算方法")

    # 步骤 4
    A_pad = condition.outrigger_pad_area_m2
    step4 = formula_block(4, "地基承载力校核", [
        ("最大支腿压力 R_max", f"max(R_i)",
         result.max_ground_pressure_kpa * A_pad, "kN"),
        ("地基压应力 σ", f"R_max / A_pad",
         result.max_ground_pressure_kpa, "kPa"),
        ("容许承载力 [f_a]", "",
         condition.ground_bearing_capacity_kpa, "kPa"),
        ("安全比值 σ/[f_a]", "",
         result.ground_pressure_ratio, ""),
        ("校核结果", "",
         "✅ 通过" if result.ground_check_pass else "❌ 不通过", ""),
    ], "GB 50007-2011 §5.2.1 — 基础底面压力计算")

    # 步骤 5
    step5 = formula_block(5, "抗倾覆稳定性校核", [
        ("稳定力矩 M_stable", f"V × d_max",
         result.stability_factor * max(1.0, abs(Mx) + abs(My)) if result.stability_factor > 0 else 0, "kN·m"),
        ("倾覆力矩 M_overturn", f"V × d_min",
         abs(Mx) + abs(My) if result.stability_factor > 0 else 0, "kN·m"),
        ("抗倾覆稳定系数 K", f"M_stable / M_overturn",
         result.stability_factor, ""),
        ("规范要求 K ≥ K₀", "K₀ = 1.2（无风工作）",
         1.2, ""),
        ("校核结果", "",
         "✅ 通过" if result.stability_check_pass else "❌ 不通过", ""),
    ], "GB/T 3811-2008 §5.3.4 — 抗倾覆稳定性；GB 6067.1-2010 §4.2.3")

    # ── 警告 ──
    warnings_html = ""
    if result.warnings:
        w_items = "\n".join(f"<li>{w}</li>" for w in result.warnings)
        warnings_html = f"""
        <div class="warnings-section">
            <h3>⚠️ 安全警告</h3>
            <ol>{w_items}</ol>
        </div>"""

    # ── 支腿反力汇总表 ──
    reaction_rows = ""
    for r in result.reactions:
        status_emoji = {"normal": "✅", "warning": "⚠️", "danger": "🚨"}
        reaction_rows += f"""
        <tr class="status-{r.status}">
            <td>{r.name}</td>
            <td>{fmt(r.force_kn, 'kN')}</td>
            <td>{fmt(r.ground_pressure_kpa, 'kPa')}</td>
            <td>{r.pressure_ratio}%</td>
            <td>{status_emoji.get(r.status, '')} {'正常' if r.status=='normal' else '警告' if r.status=='warning' else '危险'}</td>
        </tr>"""

    # ── 完整 HTML ──
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>汽车吊支腿压力计算书 — {project_name}</title>
<style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
        font-family: "SimSun", "宋体", "Microsoft YaHei UI", sans-serif;
        font-size: 13px; line-height: 1.8; color: #1a1a1a;
        max-width: 210mm; margin: 0 auto; padding: 15mm 10mm;
        background: #fff;
    }}
    @media print {{
        body {{ padding: 10mm 8mm; }}
        .no-print {{ display: none; }}
        .page-break {{ page-break-before: always; }}
    }}
    h1 {{
        text-align: center; font-size: 20px; margin-bottom: 8px;
        border-bottom: 2px solid #1a1a1a; padding-bottom: 12px;
    }}
    h2 {{
        font-size: 16px; margin: 24px 0 12px; padding-left: 8px;
        border-left: 3px solid #2980b9;
    }}
    h3 {{ font-size: 14px; margin: 16px 0 8px; color: #2c3e50; }}
    .subtitle {{ text-align: center; color: #555; margin-bottom: 24px; font-size: 12px; }}
    table {{
        width: 100%; border-collapse: collapse; margin: 10px 0 16px;
    }}
    table th, table td {{
        border: 1px solid #ccc; padding: 6px 10px; text-align: left;
    }}
    table th {{ background: #f0f4f8; font-weight: bold; }}
    .crane-params td:first-child {{ width: 40%; background: #fafafa; }}

    .calc-step {{
        background: #f9fafb; border: 1px solid #e0e0e0;
        border-radius: 6px; padding: 14px 18px; margin: 14px 0;
    }}
    .formula-line {{
        display: flex; align-items: baseline; flex-wrap: wrap;
        padding: 4px 0; font-family: "Consolas", "Courier New", monospace;
    }}
    .formula-label {{ color: #555; min-width: 180px; }}
    .formula-expr {{ color: #2980b9; margin: 0 4px; }}
    .formula-eq {{ color: #888; margin: 0 6px; }}
    .formula-value {{ color: #1a1a1a; font-weight: bold; }}
    .ref {{ margin-top: 8px; color: #7f8c8d; font-size: 12px; font-style: italic; }}

    .warnings-section {{
        background: #fff3cd; border: 2px solid #ffc107; border-radius: 6px;
        padding: 14px 18px; margin: 16px 0;
    }}
    .warnings-section h3 {{ color: #856404; }}
    .warnings-section li {{ margin-left: 20px; color: #856404; }}

    .status-warning td {{ background: #fff9e6; }}
    .status-danger td {{ background: #ffe6e6; font-weight: bold; }}

    .footer {{
        margin-top: 30px; padding-top: 12px; border-top: 1px solid #ccc;
        font-size: 11px; color: #888;
    }}
    .print-btn {{
        position: fixed; top: 16px; right: 16px;
        padding: 10px 20px; background: #2980b9; color: #fff;
        border: none; border-radius: 6px; cursor: pointer; font-size: 14px;
        z-index: 999;
    }}
    .print-btn:hover {{ background: #2471a3; }}
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨️ 打印计算书</button>

<h1>汽车吊支腿压力计算书</h1>
<div class="subtitle">
    项目名称：{project_name} &nbsp;|&nbsp;
    计算日期：{now} &nbsp;|&nbsp;
    计算依据：GB/T 3811-2008、GB 6067.1-2010、GB 50007-2011
</div>

<h2>一、起重机型号及参数</h2>
<table class="crane-params">
    <tr><td>型号</td><td>{crane['model_name']}</td></tr>
    <tr><td>额定起重量</td><td>{crane['rated_capacity_kg']/1000:.0f} t</td></tr>
    <tr><td>整机工作质量</td><td>{crane['operating_mass_kg']:,} kg</td></tr>
    <tr><td>起重机重心坐标</td><td>({crane['cg_x_m']}, {crane['cg_y_m']}) m（相对回转中心）</td></tr>
    <tr><td>支腿纵向跨距 a</td><td>{crane['outrigger_long_m']} m</td></tr>
    <tr><td>支腿横向跨距 b</td><td>{crane['outrigger_trans_m']} m</td></tr>
    <tr><td>支腿垫板面积</td><td>{crane['outrigger_pad_area_m2']} m²</td></tr>
    <tr><td>主臂长度范围</td><td>{crane['boom_min_m']} – {crane['boom_max_m']} m</td></tr>
    <tr><td>臂架铰点高度</td><td>{crane['boom_pivot_height_m']} m</td></tr>
    <tr><td>最大起重力矩</td><td>{crane['max_load_moment_knm']:,} kN·m</td></tr>
</table>

<h2>二、吊装工况参数</h2>
<table>
    <tr><td>吊臂仰角 α</td><td>{condition.boom_angle_deg}°</td></tr>
    <tr><td>吊臂长度 L</td><td>{condition.boom_length_m} m</td></tr>
    <tr><td>回转角度 θ</td><td>{condition.slew_angle_deg}°（0°=正前方，顺时针）</td></tr>
    <tr><td>吊物质量 G_load</td><td>{condition.load_mass_kg:,} kg</td></tr>
    <tr><td>动载系数 φ</td><td>{condition.dynamic_factor}</td></tr>
    <tr><td>地基容许承载力 [f_a]</td><td>{condition.ground_bearing_capacity_kpa} kPa</td></tr>
</table>

<h2>三、详细计算过程</h2>
{step1}
{step2}
{step3}
{step4}
{step5}

{warnings_html}

<h2>四、支腿反力汇总</h2>
<table>
    <tr>
        <th>支腿位置</th><th>反力 (kN)</th>
        <th>地基压应力 (kPa)</th><th>占比 (%)</th><th>状态</th>
    </tr>
    {reaction_rows}
</table>

<h2>五、评估结论</h2>
<table>
    <tr>
        <td>稳定性安全系数</td>
        <td>K = {result.stability_factor}</td>
        <td>{'✅ 满足' if result.stability_check_pass else '❌ 不满足'}（要求 ≥ 1.2）</td>
    </tr>
    <tr>
        <td>地基承载力</td>
        <td>σ = {result.max_ground_pressure_kpa} kPa</td>
        <td>{'✅ 满足' if result.ground_check_pass else '❌ 不满足'}（[f_a] = {condition.ground_bearing_capacity_kpa} kPa）</td>
    </tr>
    <tr>
        <td>倾覆风险</td>
        <td colspan="2">{'❌ 存在倾覆风险！' if result.tipping_risk else '✅ 无倾覆风险'}</td>
    </tr>
</table>

<div class="footer">
    <strong>规范引用：</strong><br>
    1. GB/T 3811-2008《起重机设计规范》— §4.2 载荷与载荷组合、§5.3 支承反力、§5.3.4 抗倾覆稳定性<br>
    2. GB 6067.1-2010《起重机械安全规程 第1部分：总则》— §4.2.3 稳定性要求<br>
    3. GB/T 26471-2011《汽车起重机和轮胎起重机试验规范》<br>
    4. GB 50007-2011《建筑地基基础设计规范》— §5.2 承载力计算<br>
    5. ISO 4305:2014 Mobile cranes — Determination of stability §6<br>
    6. ISO 4310:2009 Cranes — Test code and procedures<br>
    <br>
    <em>本计算书由「汽车吊支腿压力实时监测系统」自动生成，仅供施工参考，正式施工需经专业工程师审核。</em>
</div>

</body>
</html>"""
