/**
 * API 通信模块
 * 封装与后端 FastAPI 的所有 HTTP 通信
 */

// 同源部署时使用相对路径；若独立打开前端，可改为完整 URL
const API_BASE = '';

/**
 * 获取所有起重机型号列表
 */
export async function fetchCranes() {
    const res = await fetch(`${API_BASE}/api/cranes`);
    if (!res.ok) throw new Error(`获取起重机列表失败: ${res.status}`);
    return (await res.json()).cranes;
}

/**
 * 获取指定起重机详细参数
 */
export async function fetchCraneDetail(craneId) {
    const res = await fetch(`${API_BASE}/api/cranes/${craneId}`);
    if (!res.ok) throw new Error(`获取起重机参数失败: ${res.status}`);
    return await res.json();
}

/**
 * 提交工况参数，获取支腿压力计算结果
 */
export async function fetchCalculation(params) {
    const res = await fetch(`${API_BASE}/api/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || `计算请求失败: ${res.status}`);
    }
    return await res.json();
}

/**
 * 生成并获取计算书 HTML
 */
export async function fetchReport(projectName, calcParams) {
    const res = await fetch(`${API_BASE}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            project_name: projectName,
            calculate_request: calcParams,
        }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || `生成计算书失败: ${res.status}`);
    }
    return (await res.json()).html;
}
