"""
汽车吊支腿压力监测系统 — FastAPI 后端
提供起重机参数查询、支腿压力计算、计算书生成 API
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from pathlib import Path
from typing import Optional

from crane_database import get_all_cranes, get_crane_by_id
from calculator import WorkingCondition, calculate
from report_generator import generate_report_html

app = FastAPI(
    title="汽车吊支腿压力监测系统",
    description="Crane Outrigger Pressure Monitoring System",
    version="1.0.0",
)

# CORS — 允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════
#  API 模型定义
# ═══════════════════════════════════════════════════════

class CalculateRequest(BaseModel):
    crane_id: str = Field(..., description="起重机型号 ID，如 qy25k5")
    boom_angle_deg: float = Field(60.0, ge=0.0, le=89.0, description="吊臂仰角 (°)")
    boom_length_m: float = Field(25.0, ge=1.0, description="吊臂长度 (m)")
    slew_angle_deg: float = Field(0.0, ge=0.0, le=360.0, description="回转角度 (°)")
    load_mass_kg: float = Field(10000.0, ge=0.0, description="吊物质量 (kg)")
    dynamic_factor: float = Field(1.25, ge=1.0, le=3.0, description="动载系数 φ")
    ground_bearing_capacity_kpa: float = Field(200.0, ge=0.0, description="地基容许承载力 (kPa)")
    superlift_mass_kg: float = Field(0.0, ge=0.0, description="超起配重质量 (kg)")
    superlift_radius_m: float = Field(0.0, ge=0.0, description="超起配重半径 (m)")


class ReportRequest(BaseModel):
    project_name: str = Field("某工程吊装作业", description="项目名称")
    calculate_request: CalculateRequest


# ═══════════════════════════════════════════════════════
#  API 端点
# ═══════════════════════════════════════════════════════

@app.get("/api/cranes")
async def list_cranes():
    """获取所有起重机型号列表"""
    return {"cranes": get_all_cranes()}


@app.get("/api/cranes/{crane_id}")
async def get_crane(crane_id: str):
    """获取指定起重机型号的详细参数"""
    crane = get_crane_by_id(crane_id)
    if crane is None:
        raise HTTPException(status_code=404, detail=f"未找到起重机型号: {crane_id}")
    return crane


@app.post("/api/calculate")
async def calc_outrigger_pressure(req: CalculateRequest):
    """
    计算支腿压力
    输入吊装工况参数，返回完整的支腿反力计算结果
    """
    # 1. 加载起重机参数
    crane = get_crane_by_id(req.crane_id)
    if crane is None:
        raise HTTPException(status_code=404, detail=f"未找到起重机型号: {req.crane_id}")

    # 2. 验证吊臂长度在有效范围内
    if req.boom_length_m < crane["boom_min_m"]:
        raise HTTPException(
            status_code=400,
            detail=f"吊臂长度 {req.boom_length_m}m 小于最短臂长 {crane['boom_min_m']}m"
        )
    if req.boom_length_m > crane["boom_max_m"]:
        raise HTTPException(
            status_code=400,
            detail=f"吊臂长度 {req.boom_length_m}m 大于最长臂长 {crane['boom_max_m']}m"
        )

    # 3. 构建工况对象
    cond = WorkingCondition(
        crane_id=req.crane_id,
        crane_model_name=crane["model_name"],
        crane_mass_kg=crane["operating_mass_kg"],
        crane_cg_x_m=crane["cg_x_m"],
        crane_cg_y_m=crane["cg_y_m"],
        outrigger_long_m=crane["outrigger_long_m"],
        outrigger_trans_m=crane["outrigger_trans_m"],
        outrigger_pad_area_m2=crane["outrigger_pad_area_m2"],
        boom_pivot_height_m=crane["boom_pivot_height_m"],
        boom_angle_deg=req.boom_angle_deg,
        boom_length_m=req.boom_length_m,
        slew_angle_deg=req.slew_angle_deg,
        load_mass_kg=req.load_mass_kg,
        dynamic_factor=req.dynamic_factor,
        ground_bearing_capacity_kpa=req.ground_bearing_capacity_kpa,
        superlift_mass_kg=req.superlift_mass_kg,
        superlift_radius_m=req.superlift_radius_m,
    )

    # 4. 执行计算
    result = calculate(cond)

    # 5. 序列化返回
    return {
        "crane": crane,
        "input": {
            "boom_angle_deg": req.boom_angle_deg,
            "boom_length_m": req.boom_length_m,
            "slew_angle_deg": req.slew_angle_deg,
            "load_mass_kg": req.load_mass_kg,
            "dynamic_factor": req.dynamic_factor,
            "ground_bearing_capacity_kpa": req.ground_bearing_capacity_kpa,
        },
        "result": {
            "working_radius_m": result.working_radius_m,
            "load_x_m": result.load_x_m,
            "load_y_m": result.load_y_m,
            "load_height_m": result.load_height_m,
            "total_mass_kg": result.total_mass_kg,
            "total_weight_kn": result.total_weight_kn,
            "cg_x_m": result.cg_x_m,
            "cg_y_m": result.cg_y_m,
            "moment_x_knm": result.moment_x_knm,
            "moment_y_knm": result.moment_y_knm,
            "reactions": [
                {
                    "name": r.name,
                    "force_kn": r.force_kn,
                    "ground_pressure_kpa": r.ground_pressure_kpa,
                    "pressure_ratio": r.pressure_ratio,
                    "status": r.status,
                }
                for r in result.reactions
            ],
            "max_ground_pressure_kpa": result.max_ground_pressure_kpa,
            "ground_pressure_ratio": result.ground_pressure_ratio,
            "ground_check_pass": result.ground_check_pass,
            "stability_factor": result.stability_factor,
            "stability_check_pass": result.stability_check_pass,
            "tipping_risk": result.tipping_risk,
            "tipping_side": result.tipping_side,
            "warnings": result.warnings,
            "dynamic_factor_used": result.dynamic_factor_used,
            "dynamic_factor_note": result.dynamic_factor_note,
        },
    }


@app.post("/api/report")
async def generate_report(req: ReportRequest):
    """
    生成计算书 HTML
    返回完整格式化的计算书，前端可直接弹窗展示并打印
    """
    # 先执行计算
    calc_req = req.calculate_request
    crane = get_crane_by_id(calc_req.crane_id)
    if crane is None:
        raise HTTPException(status_code=404, detail=f"未找到起重机型号: {calc_req.crane_id}")

    cond = WorkingCondition(
        crane_id=calc_req.crane_id,
        crane_model_name=crane["model_name"],
        crane_mass_kg=crane["operating_mass_kg"],
        crane_cg_x_m=crane["cg_x_m"],
        crane_cg_y_m=crane["cg_y_m"],
        outrigger_long_m=crane["outrigger_long_m"],
        outrigger_trans_m=crane["outrigger_trans_m"],
        outrigger_pad_area_m2=crane["outrigger_pad_area_m2"],
        boom_pivot_height_m=crane["boom_pivot_height_m"],
        boom_angle_deg=calc_req.boom_angle_deg,
        boom_length_m=calc_req.boom_length_m,
        slew_angle_deg=calc_req.slew_angle_deg,
        load_mass_kg=calc_req.load_mass_kg,
        dynamic_factor=calc_req.dynamic_factor,
        ground_bearing_capacity_kpa=calc_req.ground_bearing_capacity_kpa,
        superlift_mass_kg=calc_req.superlift_mass_kg,
        superlift_radius_m=calc_req.superlift_radius_m,
    )
    result = calculate(cond)

    # 生成 HTML 报告
    report_html = generate_report_html(req.project_name, crane, cond, result)

    return {"html": report_html}


# ═══════════════════════════════════════════════════════
#  静态文件挂载（必须在所有 API 路由之后）
# ═══════════════════════════════════════════════════════

frontend_path = Path(__file__).parent.parent / "frontend"
if frontend_path.exists():
    app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="frontend")


# ═══════════════════════════════════════════════════════
#  启动入口
# ═══════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
