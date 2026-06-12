"""
SAP2000 吊装分析模型生成器
根据汽车吊吊装钢结构平台工况，生成 .s2k 文件

工况参数：
  - 被吊物：钢结构平台 12m × 6m × 1.5m，25t，Q345B
  - 吊点：4 点，距边缘 1.5m，吊索与水平面夹角 60°
  - 起重机：100t 级，工作幅度 14m，臂长 30m

规范依据：
  - GB 50017-2017《钢结构设计标准》
  - GB/T 3811-2008《起重机设计规范》
  - GB 50661-2011《钢结构焊接规范》
"""

import math
import os

# ═══════════════════════════════════════════════════════
#  参数定义
# ═══════════════════════════════════════════════════════

# 平台几何
PLATFORM_L = 12.0       # 长度 X 方向 (m)
PLATFORM_W = 6.0        # 宽度 Y 方向 (m)
PLATFORM_H = 1.5        # 高度 Z 方向 (m)
PICK_EDGE_DIST = 1.5    # 吊点距边缘距离 (m)
SLING_ANGLE_DEG = 60    # 吊索与水平面夹角 (°)

# 荷载
PLATFORM_MASS_KG = 25000    # 平台总质量 (kg)
GRAVITY = 9.80665           # 重力加速度 (m/s²)
DYNAMIC_FACTOR = 1.25       # 动载系数 φ (GB/T 3811-2008 表4)
TOTAL_WEIGHT_KN = PLATFORM_MASS_KG * GRAVITY / 1000 * DYNAMIC_FACTOR

# 网格划分
NX = 5  # X 方向节点数 (12m → 间距 3m)
NY = 5  # Y 方向节点数 (6m → 间距 1.5m)

# 钢结构截面 (Q345B, fy=345MPa)
# 主梁 HN400×200×8×12
# 次梁 HN300×150×6.5×9
# 立柱 HW200×200×8×12
# 支撑 L100×100×10

# ── 生成节点坐标 ──
def generate_joints():
    """生成所有节点坐标"""
    joints = {}
    jid = 1

    # 底部节点 z=0
    for ix in range(NX):
        for iy in range(NY):
            x = -PLATFORM_L/2 + ix * PLATFORM_L/(NX-1)
            y = -PLATFORM_W/2 + iy * PLATFORM_W/(NY-1)
            z = 0.0
            joints[jid] = (f"B_{ix}_{iy}", x, y, z)
            jid += 1

    # 顶部节点 z=PLATFORM_H
    for ix in range(NX):
        for iy in range(NY):
            x = -PLATFORM_L/2 + ix * PLATFORM_L/(NX-1)
            y = -PLATFORM_W/2 + iy * PLATFORM_W/(NY-1)
            z = PLATFORM_H
            joints[jid] = (f"T_{ix}_{iy}", x, y, z)
            jid += 1

    num_struct_joints = jid - 1

    # 吊点 (4个，在顶部平面上方略微抬高，距边 PICK_EDGE_DIST)
    pick_half_l = PLATFORM_L/2 - PICK_EDGE_DIST  # = 6 - 1.5 = 4.5m
    pick_half_w = PLATFORM_W/2 - PICK_EDGE_DIST  # = 3 - 1.5 = 1.5m
    pick_points = [
        ("PICK_FL", -pick_half_l, -pick_half_w, PLATFORM_H),
        ("PICK_FR",  pick_half_l, -pick_half_w, PLATFORM_H),
        ("PICK_RL", -pick_half_l,  pick_half_w, PLATFORM_H),
        ("PICK_RR",  pick_half_l,  pick_half_w, PLATFORM_H),
    ]
    pick_ids = []
    for name, x, y, z in pick_points:
        joints[jid] = (name, x, y, z)
        pick_ids.append(jid)
        jid += 1

    # 吊钩点 (虚拟汇交点)
    # 吊索水平投影距离最大 = sqrt(pick_half_l² + pick_half_w²)
    max_horiz = math.sqrt(pick_half_l**2 + pick_half_w**2)
    # 吊索角 60° → 钩高 = pick_z + max_horiz * tan(60°)
    hook_z = PLATFORM_H + max_horiz * math.tan(math.radians(SLING_ANGLE_DEG))
    joints[jid] = ("HOOK", 0.0, 0.0, hook_z)
    hook_id = jid

    return joints, num_struct_joints, pick_ids, hook_id


# ── 生成框架单元 ──
def generate_frames(num_struct_joints, pick_ids, hook_id):
    """
    生成框架连接
    NX × NY = 5 × 5 = 25 个底部节点 + 25 个顶部节点 = 50 个结构节点
    """
    frames = {}
    fid = 1
    n_per_level = NX * NY  # 25

    # 辅助函数
    def top_id(ix, iy):
        """顶部节点 ID"""
        return n_per_level + ix * NY + iy + 1

    def bot_id(ix, iy):
        """底部节点 ID"""
        return ix * NY + iy + 1

    # ── 顶部纵梁 (X 方向) ──
    for iy in range(NY):
        for ix in range(NX - 1):
            frames[fid] = (f"TOP_LONG_X{ix}_{iy}", top_id(ix, iy), top_id(ix+1, iy), "MAIN_BEAM")
            fid += 1

    # ── 顶部横梁 (Y 方向) ──
    for ix in range(NX):
        for iy in range(NY - 1):
            section_type = "MAIN_BEAM" if (ix == 0 or ix == NX-1) else "SEC_BEAM"
            frames[fid] = (f"TOP_TRANS_X{ix}_{iy}", top_id(ix, iy), top_id(ix, iy+1), section_type)
            fid += 1

    # ── 底部纵梁 (X 方向) ──
    for iy in range(NY):
        for ix in range(NX - 1):
            frames[fid] = (f"BOT_LONG_X{ix}_{iy}", bot_id(ix, iy), bot_id(ix+1, iy), "BOT_BEAM")
            fid += 1

    # ── 底部横梁 (Y 方向) ──
    for ix in range(NX):
        for iy in range(NY - 1):
            frames[fid] = (f"BOT_TRANS_X{ix}_{iy}", bot_id(ix, iy), bot_id(ix, iy+1), "BOT_BEAM")
            fid += 1

    # ── 竖向立柱 ──
    for ix in range(NX):
        for iy in range(NY):
            section = "COLUMN" if (ix == 0 or ix == NX-1 or iy == 0 or iy == NY-1) else "COLUMN_INNER"
            frames[fid] = (f"COL_X{ix}_{iy}", bot_id(ix, iy), top_id(ix, iy), section)
            fid += 1

    # ── 竖向斜撑 (周边 X-Z 平面) ──
    for iy in [0, NY-1]:  # 两侧
        for ix in range(NX - 1):
            # 正斜撑
            frames[fid] = (f"BRC_XZ_P_{ix}_{iy}", bot_id(ix, iy), top_id(ix+1, iy), "BRACING")
            fid += 1
            # 反斜撑
            frames[fid] = (f"BRC_XZ_N_{ix}_{iy}", top_id(ix, iy), bot_id(ix+1, iy), "BRACING")
            fid += 1

    # ── 竖向斜撑 (周边 Y-Z 平面) ──
    for ix in [0, NX-1]:  # 两端
        for iy in range(NY - 1):
            frames[fid] = (f"BRC_YZ_P_{ix}_{iy}", bot_id(ix, iy), top_id(ix, iy+1), "BRACING")
            fid += 1
            frames[fid] = (f"BRC_YZ_N_{ix}_{iy}", top_id(ix, iy), bot_id(ix, iy+1), "BRACING")
            fid += 1

    # ── 顶部水平撑 (角部) ──
    for ix, iy in [(0, 0), (NX-2, 0), (0, NY-2), (NX-2, NY-2)]:
        frames[fid] = (f"HBRC_TOP_{ix}_{iy}", top_id(ix, iy), top_id(ix+1, iy+1), "H_BRACING")
        fid += 1
        frames[fid] = (f"HBRC_TOP_X_{ix}_{iy}", top_id(ix+1, iy), top_id(ix, iy+1), "H_BRACING")
        fid += 1

    # ── 底部水平撑 (角部) ──
    for ix, iy in [(0, 0), (NX-2, 0), (0, NY-2), (NX-2, NY-2)]:
        frames[fid] = (f"HBRC_BOT_{ix}_{iy}", bot_id(ix, iy), bot_id(ix+1, iy+1), "H_BRACING")
        fid += 1
        frames[fid] = (f"HBRC_BOT_X_{ix}_{iy}", bot_id(ix+1, iy), bot_id(ix, iy+1), "H_BRACING")
        fid += 1

    # ── 吊点刚性连接 (吊点连到最近的顶部节点) ──
    # 吊点位于 (±4.5, ±1.5)，对应网格索引
    pick_connections = [
        (pick_ids[0], top_id(0, 1)),   # FL → (x=-6, y=-1.5) → ix=0, iy=1
        (pick_ids[1], top_id(NX-1, 1)), # FR → (x=+6, y=-1.5) → ix=4, iy=1
        (pick_ids[2], top_id(0, NY-2)), # RL → (x=-6, y=+1.5) → ix=0, iy=3
        (pick_ids[3], top_id(NX-1, NY-2)), # RR → (x=+6, y=+1.5) → ix=4, iy=3
    ]
    for pick_jid, top_jid in pick_connections:
        frames[fid] = (f"RIGID_PICK_{pick_jid}", pick_jid, top_jid, "RIGID_LINK")
        fid += 1

    # ── 吊索 (吊点到吊钩，设为零长度索单元) ──
    for i, pick_jid in enumerate(pick_ids):
        frames[fid] = (f"SLING_{i+1}", pick_jid, hook_id, "SLING")
        fid += 1

    return frames


# ═══════════════════════════════════════════════════════
#  S2K 文件写入
# ═══════════════════════════════════════════════════════

def write_s2k(filepath):
    joints, num_struct, pick_ids, hook_id = generate_joints()
    frames = generate_frames(num_struct, pick_ids, hook_id)

    with open(filepath, 'w', encoding='utf-8') as f:
        w = f.write

        # ── 文件头 ──
        w("""$ -------------------------------------------------------------
$ SAP2000 吊装分析模型 — 钢结构平台 4 点吊装
$
$ 工程参数:
$   被吊物: 钢结构平台 12m × 6m × 1.5m, 25t, Q345B
$   吊点: 4 点，距边缘 1.5m，索角 60°
$   动载系数: 1.25 (GB/T 3811-2008 表4)
$   起重机: 100t 级, 工作幅度 14m, 臂长 30m
$
$ 规范依据:
$   GB 50017-2017 钢结构设计标准
$   GB/T 3811-2008 起重机设计规范
$   GB 50661-2011 钢结构焊接规范
$
$ 生成时间: 自动生成
$ -------------------------------------------------------------

""")
        # ── 单位制 ──
        # SAP2000 v26 兼容格式 — CurUnits 是两个 r！
        w("""TABLE: "PROGRAM CONTROL"
  ProgramName=SAP2000  Version=26.0.0  CurrUnits="KN, m, C"  SteelCode="Chinese 2018"  ConcCode="Chinese 2010"  AlumCode="AA 2015"  ColdCode=AISI-16  RegenHinge=Yes

""")

        # ── 自由度控制 ──
        w("""TABLE: "ACTIVE DEGREES OF FREEDOM"
  UX=Yes  UY=Yes  UZ=Yes  RX=Yes  RY=Yes  RZ=Yes

""")

        # ── 材料定义 (v26 多表格式，每材料一行) ──
        # 表 01: 基本信息
        w("""TABLE: "MATERIAL PROPERTIES 01 - GENERAL"
  Material=Q345B  Type=Steel  Grade=Q345B  SymType=Isotropic  TempDepend=No  Color=Red
  Material=WIRE  Type=Steel  Grade="WireRope"  SymType=Isotropic  TempDepend=No  Color=Blue

""")
        # 表 02: 基本力学属性 (KN,m,C 单位制)
        # Q345B: E=206GPa, ν=0.3, α=1.2e-5, ρ=76.97KN/m³
        w("""TABLE: "MATERIAL PROPERTIES 02 - BASIC MECHANICAL PROPERTIES"
  Material=Q345B  UnitWeight=76.9729  UnitMass=7.849  E1=206000000  G12=79230769  U12=0.3  A1=0.000012
  Material=WIRE  UnitWeight=78.5  UnitMass=8.005  E1=110000000  G12=42307692  U12=0.3  A1=0.000012

""")
        # 表 03A: 钢材数据
        w("""TABLE: "MATERIAL PROPERTIES 03A - STEEL DATA"
  Material=Q345B  Fy=345000  Fu=490000  EffFy=380000  EffFu=520000  SSCurveOpt=Simple  SSHysType=Kinematic  SHard=0.015  SMax=0.11  SRup=0.17  FinalSlope=-0.1  CoupModType="Von Mises"
  Material=WIRE  Fy=1570000  Fu=1770000  EffFy=1650000  EffFu=1850000  SSCurveOpt=Simple  SSHysType=Kinematic  SHard=0.01  SMax=0.05  SRup=0.08  FinalSlope=-0.1  CoupModType="Von Mises"

""")

        # ── 截面定义 (v26: 每截面一行，不用续行) ──
        # 主梁 HN400×200×8×12
        d1, b1, tw1, tf1 = 0.400, 0.200, 0.008, 0.012
        # 次梁 HN300×150×6.5×9
        d2, b2, tw2, tf2 = 0.300, 0.150, 0.0065, 0.009
        # 立柱 HW200×200×8×12
        d3, b3, tw3, tf3 = 0.200, 0.200, 0.008, 0.012
        # 支撑 L100×100×10
        l_leg, l_thk = 0.100, 0.010
        # 吊索 φ40mm, A=1257mm²
        s_area = 0.0012566
        s_diam = math.sqrt(s_area * 4 / math.pi)

        # 预计算各截面属性
        main_area = 2*b1*tf1 + (d1-2*tf1)*tw1
        main_tc = 2*b1*tf1**3/3 + (d1-tf1)*tw1**3/3
        main_i33 = (b1*d1**3 - (b1-tw1)*(d1-2*tf1)**3)/12
        main_i22 = 2*tf1*b1**3/12 + (d1-2*tf1)*tw1**3/12

        sec_area = 2*b2*tf2 + (d2-2*tf2)*tw2
        sec_tc = 2*b2*tf2**3/3 + (d2-tf2)*tw2**3/3
        sec_i33 = (b2*d2**3 - (b2-tw2)*(d2-2*tf2)**3)/12
        sec_i22 = 2*tf2*b2**3/12 + (d2-2*tf2)*tw2**3/12

        col_area = 2*b3*tf3 + (d3-2*tf3)*tw3
        col_tc = 2*b3*tf3**3/3 + (d3-tf3)*tw3**3/3
        col_i33 = (b3*d3**3 - (b3-tw3)*(d3-2*tf3)**3)/12
        col_i22 = 2*tf3*b3**3/12 + (d3-2*tf3)*tw3**3/12

        ang_area = 2*l_leg*l_thk - l_thk*l_thk

        sling_tc = math.pi*s_diam**4/32
        sling_i = math.pi*s_diam**4/64
        sling_as = s_area * 0.9

        w(f"""TABLE: "FRAME SECTION PROPERTIES 01 - GENERAL"
  SectionName=MAIN_BEAM  Material=Q345B  Shape="I/Wide Flange"  t3={d1:.4f}  t2={b1:.4f}  tf={tf1:.4f}  tw={tw1:.4f}  t2b={b1:.4f}  tfb={tf1:.4f}  Area={main_area:.6f}  TorsConst={main_tc:.8f}  I33={main_i33:.8f}  I22={main_i22:.8f}  AS2={(d1-2*tf1)*tw1:.6f}  AS3={2*b1*tf1:.6f}
  SectionName=SEC_BEAM  Material=Q345B  Shape="I/Wide Flange"  t3={d2:.4f}  t2={b2:.4f}  tf={tf2:.4f}  tw={tw2:.4f}  t2b={b2:.4f}  tfb={tf2:.4f}  Area={sec_area:.6f}  TorsConst={sec_tc:.8f}  I33={sec_i33:.8f}  I22={sec_i22:.8f}  AS2={(d2-2*tf2)*tw2:.6f}  AS3={2*b2*tf2:.6f}
  SectionName=BOT_BEAM  Material=Q345B  Shape="I/Wide Flange"  t3={d2:.4f}  t2={b2:.4f}  tf={tf2:.4f}  tw={tw2:.4f}  t2b={b2:.4f}  tfb={tf2:.4f}  Area={sec_area:.6f}  TorsConst={sec_tc:.8f}  I33={sec_i33:.8f}  I22={sec_i22:.8f}  AS2={(d2-2*tf2)*tw2:.6f}  AS3={2*b2*tf2:.6f}
  SectionName=COLUMN  Material=Q345B  Shape="I/Wide Flange"  t3={d3:.4f}  t2={b3:.4f}  tf={tf3:.4f}  tw={tw3:.4f}  t2b={b3:.4f}  tfb={tf3:.4f}  Area={col_area:.6f}  TorsConst={col_tc:.8f}  I33={col_i33:.8f}  I22={col_i22:.8f}  AS2={(d3-2*tf3)*tw3:.6f}  AS3={2*b3*tf3:.6f}
  SectionName=COLUMN_INNER  Material=Q345B  Shape="I/Wide Flange"  t3={d3:.4f}  t2={b3:.4f}  tf={tf3:.4f}  tw={tw3:.4f}  t2b={b3:.4f}  tfb={tf3:.4f}  Area={col_area:.6f}  TorsConst={col_tc:.8f}  I33={col_i33:.8f}  I22={col_i22:.8f}  AS2={(d3-2*tf3)*tw3:.6f}  AS3={2*b3*tf3:.6f}
  SectionName=BRACING  Material=Q345B  Shape="Angle"  t3={l_leg:.4f}  t2={l_leg:.4f}  tf={l_thk:.4f}  tw={l_thk:.4f}  t2b={l_leg:.4f}  tfb={l_thk:.4f}  Area={ang_area:.6f}
  SectionName=H_BRACING  Material=Q345B  Shape="Angle"  t3={l_leg:.4f}  t2={l_leg:.4f}  tf={l_thk:.4f}  tw={l_thk:.4f}  t2b={l_leg:.4f}  tfb={l_thk:.4f}  Area={ang_area:.6f}
  SectionName=SLING  Material=WIRE  Shape="Circle"  t3={s_diam:.4f}  Area={s_area:.8f}  TorsConst={sling_tc:.10f}  I33={sling_i:.10f}  I22={sling_i:.10f}  AS2={sling_as:.8f}  AS3={sling_as:.8f}
  SectionName=RIGID_LINK  Material=Q345B  Shape="Rectangular"  t3=0.2  t2=0.2  Area=0.04  TorsConst=1  I33=1  I22=1  AS2=1  AS3=1

""")

        # ── 节点坐标 ──
        w("""TABLE: "JOINT COORDINATES"
""")
        for jid in sorted(joints.keys()):
            name, x, y, z = joints[jid]
            w(f"  Joint={jid}  CoordSys=GLOBAL  CoordType=Cartesian  XorR={x:.4f}  Y={y:.4f}  Z={z:.4f}\n")

        w("\n")

        # ── 框架连接 ──
        w("""TABLE: "CONNECTIVITY - FRAME"
""")
        for fid in sorted(frames.keys()):
            name, ji, jj, _ = frames[fid]
            w(f"  Frame={fid}  JointI={ji}  JointJ={jj}  IsCurved=No\n")

        w("\n")

        # ── 截面指定 ──
        w("""TABLE: "FRAME SECTION ASSIGNMENTS"
""")
        for fid in sorted(frames.keys()):
            name, ji, jj, section = frames[fid]
            w(f"  Frame={fid}  SectionName={section}\n")

        w("\n")

        # ── 吊索设为拉/压属性 → 仅受拉 ──
        w("""TABLE: "FRAME TENSION/COMPRESSION ASSIGNMENTS"
""")
        for fid in sorted(frames.keys()):
            name, _, _, section = frames[fid]
            if section == "SLING":
                w(f"  Frame={fid}  TCLimitType=TensionOnly\n")

        w("\n")

        # ── 端部释放 (斜撑两端铰接, v26 字段名 M2I/M3I/M2J/M3J) ──
        w("""TABLE: "FRAME RELEASE ASSIGNMENTS 1 - GENERAL"
""")
        for fid in sorted(frames.keys()):
            name, _, _, section = frames[fid]
            if section in ("BRACING", "H_BRACING", "SLING", "RIGID_LINK"):
                w(f"  Frame={fid}  M2I=Yes  M3I=Yes  M2J=Yes  M3J=Yes\n")

        w("\n")

        # ── 约束 ──
        w("""TABLE: "JOINT RESTRAINTS"
""")
        # 吊钩点固接 (模拟起重机吊钩)
        w(f"  Joint={hook_id}  U1=Yes  U2=Yes  U3=Yes  R1=Yes  R2=Yes  R3=Yes\n")

        # 虚拟软弹簧约束 (底部 4 角极弱弹簧防止刚体位移 — 用于初始求解)
        # 仅在初始静力分析中使用极小刚度
        for ix, iy in [(0, 0), (0, NY-1), (NX-1, 0), (NX-1, NY-1)]:
            bot_jid = ix * NY + iy + 1
            # 只约束 UZ 用于防止刚体位移（极小弹簧，实际反力应≈0）
            # 不写入硬约束，改用弹簧单元
            pass

        w("\n")

        # ── 荷载模式 (v26: SelfWtMult 不是 SelfWtMultiplier) ──
        w("""TABLE: "LOAD PATTERN DEFINITIONS"
  LoadPat=DEAD  DesignType=Dead  SelfWtMult=1
  LoadPat=LIFT  DesignType=Other  SelfWtMult=0

""")

        # ── 荷载工况 (v26: LinStatic 不是 LinearStatic) ──
        w("""TABLE: "LOAD CASE DEFINITIONS"
  Case=DEAD  Type=LinStatic  InitialCond=Zero  DesTypeOpt="Prog Det"  DesignType=Dead  DesActOpt="Prog Det"  DesignAct=Non-Composite  AutoType=None  RunCase=Yes
  Case=LIFT  Type=LinStatic  InitialCond=Zero  DesTypeOpt="Prog Det"  DesignType=Other  DesActOpt="Prog Det"  DesignAct=Other  AutoType=None  RunCase=Yes

""")

        # ── 荷载组合 (v26: 每行必须带 ComboName) ──
        w("""TABLE: "COMBINATION DEFINITIONS"
  ComboName=COMB1  ComboType=LinearAdd
  ComboName=COMB1  CaseName=DEAD  ScaleFactor=1.0
  ComboName=COMB1  CaseName=LIFT  ScaleFactor=1.0
  ComboName=COMB2  ComboType=LinearAdd
  ComboName=COMB2  CaseName=DEAD  ScaleFactor=1.0
  ComboName=COMB2  CaseName=LIFT  ScaleFactor=1.25

""")

        # ── 吊索预张力/吊点荷载 (LIFT 工况) ──
        # 4 吊点垂直力 (向上) + 水平力 (指向吊钩投影点)
        # 总重 = 25t × 9.81 × 1.25 = 306.6 kN
        # 每吊点垂直力 = 306.6 / 4 = 76.64 kN (向上，在 LIFT 工况)
        # 水平力 = 76.64 / tan(60°) = 44.25 kN (指向中心)
        total_v = TOTAL_WEIGHT_KN  # 306.56 kN
        per_v = total_v / 4        # 76.64 kN
        per_h = per_v / math.tan(math.radians(SLING_ANGLE_DEG))  # 44.25 kN

        # 各吊点方向
        pick_coords = []
        for pid in pick_ids:
            _, x, y, z = joints[pid]
            pick_coords.append((pid, x, y, z))

        # 吊钩投影 = (0, 0)
        hook_x, hook_y = 0.0, 0.0

        w("""TABLE: "JOINT LOADS - FORCE"
""")
        for pid, px, py, pz in pick_coords:
            # 水平力方向：从吊点指向吊钩投影 (中心)
            dx = hook_x - px
            dy = hook_y - py
            dist = math.sqrt(dx**2 + dy**2)
            if dist > 0.001:
                hx = per_h * dx / dist  # X 分量
                hy = per_h * dy / dist  # Y 分量
            else:
                hx = hy = 0

            # LIFT 工况：向上的垂直力 + 指向中心的水平力
            w(f"  Joint={pid}  LoadPat=LIFT  CoordSys=GLOBAL  F1={hx:.2f}  F2={hy:.2f}  F3={per_v:.2f}\n")

        w("\n")

        # ── 分析选项 (v26 完整字段) ──
        w("""TABLE: "ANALYSIS OPTIONS"
  Solver=Advanced  SolverProc=Auto  Force32Bit=No  StiffCase=None  GeomMod=None  HingeOpt="In Elements"  NumAThreads=0  MaxFileSize=0  NumDThreads=0  NumRThreads=0  UseMMFiles="Program Determined"  AllowDiff=No

""")

        # ── 输出选项 ──
        w("""TABLE: "OUTPUT OPTIONS"
  JointDisp=Yes  JointReact=Yes  FrameForce=Yes  FrameDesign=Yes

""")

        # ── 钢结构设计偏好 (v26: 中国规范 Chinese 2018) ──
        w("""TABLE: "PREFERENCES - STEEL DESIGN - CHINESE 2018"
  THDesign=Envelopes  FrameType="NonSway Moment Frame, NMF"  PatLLF=0  SRatioLimit=1  MaxIter=1  TallBldg=Yes  SDG="Grade II"  Gamma0=1  IgnoreBoT=Yes  BeamMandN=No  IgnorePhiB=No  AnaMethod="Direct Analysis"  StabEta_cr=0  CheckDefl=No  DLRat=120  SDLAndLLRat=120  LLRat=500  TotalRat=400  NetRat=500

TABLE: "DESIGN GROUPS 1 - GENERAL"
  GroupName=ALL  DesignType=SteelFrame

""")

        # ── 自重质量源 (v26 字段名) ──
        w("""TABLE: "MASS SOURCE"
  MassSource=MSSSRC1  Elements=Yes  Masses=Yes  Loads=No  IsDefault=Yes

""")

        # ── 结束 ──
        w("""TABLE: "END TABLE DATA"

""")

    print(f"✅ SAP2000 模型文件已生成: {filepath}")
    print(f"   节点数: {len(joints)}")
    print(f"   框架单元数: {len(frames)}")
    print(f"   总重: {TOTAL_WEIGHT_KN:.2f} kN (含动载系数 {DYNAMIC_FACTOR})")
    print(f"   每吊点垂直力: {per_v:.2f} kN")
    print(f"   每吊点水平力: {per_h:.2f} kN")
    print(f"   吊钩高度: {joints[hook_id][3]:.2f} m")


if __name__ == "__main__":
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(output_dir, "lifting_platform.s2k")
    write_s2k(output_path)
    print(f"\n📂 文件路径: {output_path}")
    print(f"   在 SAP2000 中: File → Import → SAP2000 .s2k Text File")
