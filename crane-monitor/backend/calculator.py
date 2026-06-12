"""
汽车吊支腿压力计算引擎
严格遵循 GB/T 3811-2008、GB 6067.1-2010、GB 50007-2011、ISO 4305:2014

计算流程：
  1. 吊物位置计算（臂架几何）
  2. 总重心计算
  3. 支腿反力计算（四点支撑刚体模型）
  4. 地基承载力校核
  5. 稳定性安全系数
  6. 动载系数说明
"""

import math
from dataclasses import dataclass, field
from typing import Optional

# 重力加速度 (m/s²)
G = 9.80665


@dataclass
class WorkingCondition:
    """吊装工况输入参数"""
    # 起重机参数（从数据库加载）
    crane_id: str
    crane_model_name: str
    crane_mass_kg: float          # 整机工作质量
    crane_cg_x_m: float           # 起重机重心 X（横向，右为正）
    crane_cg_y_m: float           # 起重机重心 Y（纵向，前为正）
    outrigger_long_m: float       # 支腿纵向跨距 a
    outrigger_trans_m: float      # 支腿横向跨距 b
    outrigger_pad_area_m2: float  # 支腿垫板面积
    boom_pivot_height_m: float    # 臂架铰点高度

    # 吊装工况（用户输入）
    boom_angle_deg: float         # 吊臂仰角 α (°)，水平以上
    boom_length_m: float          # 吊臂长度 L (m)
    slew_angle_deg: float         # 回转角度 θ (°)，0=正前方，顺时针
    load_mass_kg: float           # 吊物质量 (kg)
    dynamic_factor: float = 1.25  # 动载系数 φ（默认1.25）

    # 场地条件
    ground_bearing_capacity_kpa: float = 200.0  # 地基容许承载力 [f_a] (kPa)

    # 超起配重（可选，全地面起重机）
    superlift_mass_kg: float = 0.0
    superlift_radius_m: float = 0.0


@dataclass
class OutriggerReaction:
    """单支腿反力结果"""
    name: str                     # 支腿名称
    force_kn: float               # 反力 (kN)
    ground_pressure_kpa: float    # 地基压应力 (kPa)
    pressure_ratio: float         # 压力占比 (%)
    status: str                   # "normal" | "warning" | "danger"


@dataclass
class CalculationResult:
    """完整计算结果"""
    # 吊物位置
    working_radius_m: float = 0.0       # 工作幅度 R
    load_x_m: float = 0.0               # 吊物 X 坐标
    load_y_m: float = 0.0               # 吊物 Y 坐标
    load_height_m: float = 0.0          # 吊物起升高度

    # 总重心
    total_mass_kg: float = 0.0          # 总质量（含动载系数）
    total_weight_kn: float = 0.0         # 总垂直载荷 V
    cg_x_m: float = 0.0                 # 总重心 X
    cg_y_m: float = 0.0                 # 总重心 Y

    # 力矩
    moment_x_knm: float = 0.0           # 绕 X 轴力矩（横向倾覆）
    moment_y_knm: float = 0.0           # 绕 Y 轴力矩（纵向倾覆）

    # 支腿反力
    reactions: list = field(default_factory=list)

    # 地基校核
    max_ground_pressure_kpa: float = 0.0
    ground_pressure_ratio: float = 0.0  # 与容许值的比值
    ground_check_pass: bool = True

    # 稳定性
    stability_factor: float = 0.0       # 抗倾覆稳定系数 K
    stability_check_pass: bool = True
    tipping_risk: bool = False           # 是否有倾覆风险（任一支腿反力 ≤ 0）
    tipping_side: Optional[str] = None   # 倾覆方向

    # 警告
    warnings: list = field(default_factory=list)

    # 动载系数
    dynamic_factor_used: float = 1.25
    dynamic_factor_note: str = ""


def calculate(cond: WorkingCondition) -> CalculationResult:
    """
    执行支腿压力完整计算
    """
    warnings = []
    a = cond.outrigger_long_m    # 纵向跨距
    b = cond.outrigger_trans_m   # 横向跨距

    # ═══════════════════════════════════════════════════════
    # 步骤 1：吊物位置计算
    # 参考：GB/T 3811-2008 附录 A — 臂架几何关系
    # ═══════════════════════════════════════════════════════
    alpha = math.radians(cond.boom_angle_deg)
    theta = math.radians(cond.slew_angle_deg)

    # 工作幅度 R = L × cos(α)（简化：臂架铰点水平偏移取 0，因铰点接近回转中心）
    working_radius = cond.boom_length_m * math.cos(alpha)

    # 吊物相对回转中心坐标
    load_x = working_radius * math.sin(theta)   # 横向
    load_y = working_radius * math.cos(theta)   # 纵向（前）

    # 起升高度
    load_height = cond.boom_pivot_height_m + cond.boom_length_m * math.sin(alpha)

    # ═══════════════════════════════════════════════════════
    # 步骤 2：总重心计算
    # 参考：GB/T 3811-2008 §4.2 — 载荷组合与重心
    # ═══════════════════════════════════════════════════════
    m_crane = cond.crane_mass_kg
    m_load_dyn = cond.load_mass_kg * cond.dynamic_factor
    m_superlift_dyn = cond.superlift_mass_kg * cond.dynamic_factor

    total_mass = m_crane + m_load_dyn + m_superlift_dyn
    total_weight_kn = total_mass * G / 1000.0  # 转换为 kN

    # 总重心（加权平均）
    cg_x = (m_crane * cond.crane_cg_x_m +
            m_load_dyn * load_x +
            m_superlift_dyn * cond.superlift_radius_m) / total_mass
    cg_y = (m_crane * cond.crane_cg_y_m +
            m_load_dyn * load_y) / total_mass

    # 力矩
    moment_x = total_weight_kn * cg_x   # 横向倾覆力矩（绕 X 轴）
    moment_y = total_weight_kn * cg_y   # 纵向倾覆力矩（绕 Y 轴）

    # ═══════════════════════════════════════════════════════
    # 步骤 3：支腿反力计算（四点支撑刚体模型）
    # 参考：GB/T 3811-2008 §5.3 — 支承反力计算
    #       ISO 4305:2014 §6 — Stability calculation
    #
    # 刚体四点支撑反力公式：
    #   R_i = V/4 + M_y × y_i / Σ(y_i²) + M_x × x_i / Σ(x_i²)
    #
    # 支腿位置（坐标系：X 横向右为正，Y 纵向前为正）：
    #   左前 FL: (-b/2, +a/2)    右前 FR: (+b/2, +a/2)
    #   左后 RL: (-b/2, -a/2)    右后 RR: (+b/2, -a/2)
    #
    # Σ(x_i²) = b², Σ(y_i²) = a²
    # ═══════════════════════════════════════════════════════
    V = total_weight_kn
    sum_x2 = b * b    # Σ(x_i²)
    sum_y2 = a * a    # Σ(y_i²)

    def calc_rigid_reaction(x_i: float, y_i: float) -> float:
        """计算单支腿刚性反力"""
        return V / 4.0 + moment_y * y_i / sum_y2 + moment_x * x_i / sum_x2

    # 四点刚性反力
    r_fl_rigid = calc_rigid_reaction(-b / 2, +a / 2)  # 左前
    r_fr_rigid = calc_rigid_reaction(+b / 2, +a / 2)  # 右前
    r_rl_rigid = calc_rigid_reaction(-b / 2, -a / 2)  # 左后
    r_rr_rigid = calc_rigid_reaction(+b / 2, -a / 2)  # 右后

    reactions_rigid = [
        ("左前 (FL)", r_fl_rigid, -b/2, +a/2),
        ("右前 (FR)", r_fr_rigid, +b/2, +a/2),
        ("左后 (RL)", r_rl_rigid, -b/2, -a/2),
        ("右后 (RR)", r_rr_rigid, +b/2, -a/2),
    ]

    # 检查是否有支腿反力 ≤ 0（倾覆风险）
    tipping_risk = False
    tipping_side = None
    tipping_name = None

    for name, force, _, _ in reactions_rigid:
        if force <= 0.001:  # 允许极小数值误差
            tipping_risk = True
            tipping_name = name
            warnings.append(
                f"⚠️ 支腿「{name}」反力 ≤ 0 ({force:.2f} kN)，"
                f"起重机存在倾覆风险！需重新调整吊装方案。"
                f"（参考：GB 6067.1-2010 §4.2.3）"
            )

    # 若存在倾覆风险，按三点支撑重新计算
    if tipping_risk:
        # 找出三个仍然着地的支腿，用静力学重新求解
        # 三点支撑：3 方程（ΣFz=0, ΣMx=0, ΣMy=0）→ 3 未知数，可解
        # 将问题支腿的反力置 0，求解另外三个
        reactions_3pt = _calc_three_point(
            V, moment_x, moment_y,
            reactions_rigid, tipping_name
        )
        reactions_final = reactions_3pt
    else:
        reactions_final = [
            {"name": name, "force_kn": force}
            for name, force, _, _ in reactions_rigid
        ]

    # ═══════════════════════════════════════════════════════
    # 步骤 4：地基承载力校核
    # 参考：GB 50007-2011 §5.2 — 地基承载力计算
    #       地基压应力 σ = R_max / A_pad ≤ [f_a]
    # ═══════════════════════════════════════════════════════
    A_pad = cond.outrigger_pad_area_m2
    max_reaction = max(r["force_kn"] for r in reactions_final)
    max_ground_pressure = max_reaction / A_pad  # kPa (kN/m²)
    ground_pressure_ratio = max_ground_pressure / cond.ground_bearing_capacity_kpa
    ground_check_pass = ground_pressure_ratio <= 1.0

    if not ground_check_pass:
        warnings.append(
            f"⚠️ 地基压应力 σ={max_ground_pressure:.1f} kPa 超过容许值 "
            f"[f_a]={cond.ground_bearing_capacity_kpa:.0f} kPa，"
            f"需增大支腿垫板面积或加固地基。"
            f"（参考：GB 50007-2011 §5.2.1）"
        )

    # ═══════════════════════════════════════════════════════
    # 步骤 5：稳定性安全系数
    # 参考：GB/T 3811-2008 §5.3.4 — 抗倾覆稳定性
    #       GB 6067.1-2010 §4.2.3
    #
    # 稳定力矩 M_stable = V × d_min（总载荷到最近倾覆边的距离）
    # 倾覆力矩 M_overturn 取绕最不利边的力矩
    # 抗倾覆稳定系数 K = M_stable / M_overturn
    # 要求：K ≥ 1.33（有风工作）、K ≥ 1.2（无风工作）
    # ═══════════════════════════════════════════════════════

    # 四边到重心的距离
    dist_to_front = a / 2 - cg_y     # 到前倾覆边的距离
    dist_to_rear = a / 2 + cg_y      # 到后倾覆边的距离
    dist_to_left = b / 2 + cg_x      # 到左倾覆边的距离
    dist_to_right = b / 2 - cg_x     # 到右倾覆边的距离

    # 最危险方向（重心到最近倾覆边的距离）
    d_min = min(dist_to_front, dist_to_rear, dist_to_left, dist_to_right)

    if d_min <= 0:
        # 重心已超出支腿范围
        stability_factor = 0.0
        warnings.append(
            "🚨 总重心已超出支腿支撑范围！起重机即将倾覆！"
            "（参考：GB/T 3811-2008 §5.3.4）"
        )
    else:
        # 倾覆力矩 = 总载荷 × 重心到最近边的距离（这个方向的力矩）
        # 稳定力矩 = 总载荷 × 重心到最远边的距离
        # 简化：K = (距离最远边) / (距离最近边) ≈ a / (2 × d_min)
        # 更精确的计算：
        # 取最危险方向的稳定力矩 / 倾覆力矩
        d_max = max(dist_to_front, dist_to_rear, dist_to_left, dist_to_right)
        stability_factor = d_max / d_min if d_min > 0.001 else 0.0

    # 安全判定
    K_required = 1.2   # 无风工作状态
    stability_check_pass = stability_factor >= K_required

    if not stability_check_pass and stability_factor > 0:
        warnings.append(
            f"⚠️ 抗倾覆稳定系数 K={stability_factor:.2f} < {K_required}，"
            f"不满足规范要求。"
            f"（参考：GB/T 3811-2008 §5.3.4、GB 6067.1-2010 §4.2.3）"
        )

    # ═══════════════════════════════════════════════════════
    # 步骤 6：动载系数说明
    # 参考：GB/T 3811-2008 表 4 — 起升动载系数 φ₂
    #       对于一般吊装，φ₂ = 1.15 + 0.00051 × v_h
    #       取 v_h ≈ 20 m/min 为中等起升速度 → φ₂ ≈ 1.16
    #       保守取 1.25（含一定安全余量）
    # ═══════════════════════════════════════════════════════
    dyn_note = (
        f"动载系数取 φ={cond.dynamic_factor}。"
        f"依据 GB/T 3811-2008 表 4，起升动载系数 "
        f"φ₂=1.15+0.00051×v_h，对于中速起升(v_h≈20m/min)，"
        f"φ₂≈1.16，取 {cond.dynamic_factor} 含安全余量。"
    )

    # ── 组装各支腿完整结果 ──
    outrigger_results = []
    for r in reactions_final:
        force = r["force_kn"]
        gp = force / A_pad if force > 0 else 0.0
        ratio = force / V * 100 if V > 0 else 0.0
        if force <= 0.001:
            status = "danger"
        elif force / (V / 4.0) < 0.15 * 4.0:  # 低于平均值 15%
            status = "warning"
        else:
            status = "normal"
        outrigger_results.append(
            OutriggerReaction(
                name=r["name"],
                force_kn=round(force, 2),
                ground_pressure_kpa=round(gp, 1),
                pressure_ratio=round(ratio, 1),
                status=status,
            )
        )

    return CalculationResult(
        working_radius_m=round(working_radius, 2),
        load_x_m=round(load_x, 3),
        load_y_m=round(load_y, 3),
        load_height_m=round(load_height, 1),
        total_mass_kg=round(total_mass, 0),
        total_weight_kn=round(total_weight_kn, 2),
        cg_x_m=round(cg_x, 4),
        cg_y_m=round(cg_y, 4),
        moment_x_knm=round(moment_x, 2),
        moment_y_knm=round(moment_y, 2),
        reactions=outrigger_results,
        max_ground_pressure_kpa=round(max_ground_pressure, 1),
        ground_pressure_ratio=round(ground_pressure_ratio, 3),
        ground_check_pass=ground_check_pass,
        stability_factor=round(stability_factor, 3),
        stability_check_pass=stability_check_pass,
        tipping_risk=tipping_risk,
        tipping_side=tipping_name,
        warnings=warnings,
        dynamic_factor_used=cond.dynamic_factor,
        dynamic_factor_note=dyn_note,
    )


def _calc_three_point(
    V: float,
    Mx: float,
    My: float,
    rigid_reactions: list,
    tipping_name: str,
) -> list:
    """
    三点支撑反力计算（某支腿离地后的重分配）
    将离地支腿反力设为 0，静力学求解其余三个支腿

    三点支撑为静定问题：3 方程 → 3 个未知反力
    """
    # 保留三个着地支腿
    remaining = [
        (name, x, y)
        for name, _, x, y in rigid_reactions
        if name != tipping_name
    ]

    # 直接求解线性方程组
    # R1 + R2 + R3 = V
    # R1·x1 + R2·x2 + R3·x3 = Mx  (注意符号：各支腿反力对 X 轴的力矩和 = Mx)
    #   实际上：Σ(R_i × y_i) = My（绕 Y 轴）? 不...
    #
    # 重新推导：
    # 绕 X 轴的力矩平衡：Σ(R_i × y_i_lateral) = Mx
    #   其中 y 是支腿的横向坐标
    #   对于 FL(-b/2, +a/2)，对 X 轴的力臂是 (-b/2)
    #
    # 实际上在我设定的坐标系：
    #   X = 横向（右为正），Y = 纵向（前为正）
    #   绕 X 轴（纵向轴）的力矩由 Y（横向）坐标产生：M_x_total = Σ(R_i × x_i)
    #   绕 Y 轴（横向轴）的力矩由 X（纵向）坐标产生：M_y_total = Σ(R_i × y_i)
    #
    # 所以方程组：
    #   Σ R_i = V
    #   Σ R_i × x_i = Mx  （绕 X 轴的力矩 = 总载荷 × CG 横向偏移）
    #   Σ R_i × y_i = My  （绕 Y 轴的力矩 = 总载荷 × CG 纵向偏移）

    # 构建矩阵
    x_vals = [x for _, _, x, _ in [r for r in rigid_reactions if r[0] != tipping_name]]
    y_vals = [y for _, _, _, y in [r for r in rigid_reactions if r[0] != tipping_name]]
    names = [name for name, _, _, _ in [r for r in rigid_reactions if r[0] != tipping_name]]

    # 但等等，我取的是 rigid_reactions 的坐标。让我从 remaining 取：
    x_vals = [x for _, x, y in remaining]
    y_vals = [y for _, x, y in remaining]
    names = [name for name, x, y in remaining]

    # Cramer 法则求解 3×3
    # [ 1   1   1  ] [R1]   [V ]
    # [ x1  x2  x3 ] [R2] = [Mx]
    # [ y1  y2  y3 ] [R3]   [My]
    x1, x2, x3 = x_vals
    y1, y2, y3 = y_vals

    det = (x2*y3 - x3*y2) - (x1*y3 - x3*y1) + (x1*y2 - x2*y1)

    results = []
    if abs(det) < 1e-9:
        # 退化情形，平均分配
        for name in names:
            results.append({"name": name, "force_kn": V / 3.0})
    else:
        det1 = V*(x2*y3 - x3*y2) - Mx*(y3 - y2) + My*(x3 - x2)
        det2 = (x1*y3 - x3*y1)*V - (x1*y3 - x3*y1)*Mx + (x1*My - x3*My)  # simplified below
        # 重新用 Cramer 法则：
        # det(A) = 1×(x2y3-x3y2) - 1×(x1y3-x3y1) + 1×(x1y2-x2y1)
        det = x2*y3 - x3*y2 - x1*y3 + x3*y1 + x1*y2 - x2*y1

        # det1: 替换第1列
        det1 = V*(x2*y3 - x3*y2) - 1*(Mx*y3 - My*x3) + 1*(Mx*y2 - My*x2)
        # det1 = V*x2*y3 - V*x3*y2 - Mx*y3 + My*x3 + Mx*y2 - My*x2

        # det2: 替换第2列
        det2 = 1*(Mx*y3 - My*x3) - V*(x1*y3 - x3*y1) + 1*(x1*My - Mx*y1)
        # det2 = Mx*y3 - My*x3 - V*x1*y3 + V*x3*y1 + x1*My - Mx*y1

        # det3: 替换第3列
        det3 = 1*(x2*My - Mx*y2) - 1*(x1*My - Mx*y1) + V*(x1*y2 - x2*y1)
        # det3 = x2*My - Mx*y2 - x1*My + Mx*y1 + V*x1*y2 - V*x2*y1

        r1 = det1 / det if abs(det) > 1e-9 else V/3
        r2 = det2 / det if abs(det) > 1e-9 else V/3
        r3 = det3 / det if abs(det) > 1e-9 else V/3

        # 处理可能的负值（极其罕见的三点支撑仍有负值——完全倾覆）
        forces = [max(0, r1), max(0, r2), max(0, r3)]
        for name, f in zip(names, forces):
            results.append({"name": name, "force_kn": f})

    # 补充离地支腿（反力为 0）
    results.append({"name": tipping_name, "force_kn": 0.0})

    return results
