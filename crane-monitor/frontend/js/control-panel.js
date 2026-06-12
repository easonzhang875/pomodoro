/**
 * 控制面板模块
 * 管理起重机选型下拉框、滑块交互、结果显示更新、计算书弹窗
 */

import { fetchCranes, fetchCraneDetail, fetchCalculation, fetchReport } from './api.js';
import { buildCrane, updatePads, updateBoom, updateLoad, toggleAutoRotate, isAutoRotating, getSlewAngle } from './three-view.js';

// 当前状态
let currentCraneId = 'qy25k5';
let currentCraneParams = null;
let currentReactions = null;
let calcThrottleTimer = null;
const CALC_THROTTLE_MS = 150;  // 滑块拖拽时计算节流

// DOM 引用缓存
const dom = {};

/**
 * 初始化控制面板
 */
export async function initPanel() {
    cacheDomElements();
    bindEvents();
    await loadCraneList();
    await selectCrane(currentCraneId);
    await refreshCalculation();
}

// ═══════════════════════════════════════════════════════
//  起重机列表
// ═══════════════════════════════════════════════════════

async function loadCraneList() {
    try {
        const cranes = await fetchCranes();
        dom.craneSelect.innerHTML = '';
        cranes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.model_name} (${c.rated_capacity_t}t)`;
            dom.craneSelect.appendChild(opt);
        });
        dom.craneSelect.value = currentCraneId;
        setStatus('ready', '起重机列表加载完成');
    } catch (err) {
        setStatus('error', `加载起重机列表失败: ${err.message}`);
    }
}

async function selectCrane(craneId) {
    try {
        setStatus('loading', '加载起重机参数...');
        currentCraneParams = await fetchCraneDetail(craneId);
        currentCraneId = craneId;

        // 更新参数展示
        updateCraneSpecs(currentCraneParams);

        // 更新滑块范围
        dom.boomLength.min = currentCraneParams.boom_min_m;
        dom.boomLength.max = currentCraneParams.boom_max_m;
        dom.loadMass.max = currentCraneParams.rated_capacity_kg / 1000;

        // 如果当前值超出范围，调整
        if (parseFloat(dom.boomLength.value) > currentCraneParams.boom_max_m) {
            dom.boomLength.value = currentCraneParams.boom_max_m;
            updateSliderLabel('boom-length', 'val-boom-length', currentCraneParams.boom_max_m, 'm', 1);
        }
        if (parseFloat(dom.boomLength.value) < currentCraneParams.boom_min_m) {
            dom.boomLength.value = currentCraneParams.boom_min_m;
            updateSliderLabel('boom-length', 'val-boom-length', currentCraneParams.boom_min_m, 'm', 1);
        }

        // 重建 3D 模型
        buildCrane(currentCraneParams);

        setStatus('ready', `已选择: ${currentCraneParams.model_name}`);
        await refreshCalculation();
    } catch (err) {
        setStatus('error', `加载起重机失败: ${err.message}`);
    }
}

function updateCraneSpecs(params) {
    dom.craneSpecs.innerHTML = `
        <span>额定起重量</span><span class="val">${(params.rated_capacity_kg / 1000).toFixed(0)} t</span>
        <span>工作质量</span><span class="val">${(params.operating_mass_kg / 1000).toFixed(1)} t</span>
        <span>支腿纵向跨距</span><span class="val">${params.outrigger_long_m} m</span>
        <span>支腿横向跨距</span><span class="val">${params.outrigger_trans_m} m</span>
        <span>垫板面积</span><span class="val">${params.outrigger_pad_area_m2} m²</span>
        <span>臂长范围</span><span class="val">${params.boom_min_m}–${params.boom_max_m} m</span>
        <span>最大起重力矩</span><span class="val">${params.max_load_moment_knm} kN·m</span>
        <span>铰点高度</span><span class="val">${params.boom_pivot_height_m} m</span>
    `;
}

// ═══════════════════════════════════════════════════════
//  计算 & 更新显示
// ═══════════════════════════════════════════════════════

function getCalcParams() {
    return {
        crane_id: currentCraneId,
        boom_angle_deg: parseFloat(dom.boomAngle.value),
        boom_length_m: parseFloat(dom.boomLength.value),
        slew_angle_deg: parseFloat(dom.slewAngle.value),
        load_mass_kg: parseFloat(dom.loadMass.value) * 1000,
        dynamic_factor: parseFloat(dom.dynFactor.value),
        ground_bearing_capacity_kpa: parseFloat(dom.groundCapacity.value),
    };
}

async function refreshCalculation() {
    const params = getCalcParams();
    try {
        const data = await fetchCalculation(params);
        currentReactions = data.result.reactions;
        updateResultCards(data.result);
        updateSafetyIndicator(data.result);
        update3D(data.result, params);
        setStatus('ready', `计算完成 | 工作幅度: ${data.result.working_radius_m} m | 总载荷: ${data.result.total_weight_kn} kN`);
    } catch (err) {
        setStatus('error', `计算失败: ${err.message}`);
    }
}

function throttledRefresh() {
    if (calcThrottleTimer) clearTimeout(calcThrottleTimer);
    calcThrottleTimer = setTimeout(refreshCalculation, CALC_THROTTLE_MS);
}

function updateResultCards(result) {
    const reactions = result.reactions;
    const cardMap = {
        '左前 (FL)': 'card-fl',
        '右前 (FR)': 'card-fr',
        '左后 (RL)': 'card-rl',
        '右后 (RR)': 'card-rr',
    };

    for (const r of reactions) {
        const cardId = cardMap[r.name];
        if (!cardId) continue;
        const card = document.getElementById(cardId);
        if (!card) continue;

        // 更新状态类
        card.className = `result-card status-${r.status}`;
        card.querySelector('.card-force').textContent = `${r.force_kn.toFixed(1)} kN`;
        card.querySelector('.card-pressure').textContent = `地基: ${r.ground_pressure_kpa.toFixed(0)} kPa`;
    }
}

function updateSafetyIndicator(result) {
    const indicator = dom.safetyIndicator;
    const detail = dom.safetyDetail;

    indicator.className = 'safety-indicator';
    if (result.tipping_risk) {
        indicator.classList.add('danger');
        indicator.innerHTML = '🚨 倾覆风险！支腿已离地';
    } else if (!result.stability_check_pass) {
        indicator.classList.add('caution');
        indicator.innerHTML = '⚠️ 稳定性不足';
    } else if (!result.ground_check_pass) {
        indicator.classList.add('caution');
        indicator.innerHTML = '⚠️ 地基承载力不足';
    } else {
        indicator.classList.add('safe');
        indicator.innerHTML = '✅ 状态正常 — 所有校核通过';
    }

    detail.innerHTML = `
        工作幅度: ${result.working_radius_m} m |
        总载荷: ${result.total_weight_kn} kN |
        稳定系数: K=${result.stability_factor} (需≥1.2) |
        地基: σ=${result.max_ground_pressure_kpa} kPa / [f_a]
    `;
}

function update3D(result, params) {
    // 更新支腿垫板
    updatePads(result.reactions);

    // 更新臂架姿态
    updateBoom(params.boom_angle_deg, params.boom_length_m, params.slew_angle_deg);

    // 更新吊物
    updateLoad(params.load_mass_kg);
}

// ═══════════════════════════════════════════════════════
//  计算书
// ═══════════════════════════════════════════════════════

async function openReport() {
    const params = getCalcParams();
    setStatus('loading', '正在生成计算书...');
    try {
        const html = await fetchReport('某工程吊装作业', params);
        const iframe = dom.reportIframe;
        iframe.srcdoc = html;
        dom.reportModal.style.display = 'flex';
        setStatus('ready', '计算书生成完成，可直接打印 (Ctrl+P)');
    } catch (err) {
        setStatus('error', `生成计算书失败: ${err.message}`);
    }
}

// ═══════════════════════════════════════════════════════
//  事件绑定
// ═══════════════════════════════════════════════════════

function bindEvents() {
    // 起重机选型
    dom.craneSelect.addEventListener('change', () => {
        selectCrane(dom.craneSelect.value);
    });

    // 所有滑块
    const sliders = [
        { id: 'slew-angle', labelId: 'val-slew', unit: '°', decimals: 0,
            onInput: () => {
                // 自动旋转时也更新 3D
                updateBoom(
                    parseFloat(dom.boomAngle.value),
                    parseFloat(dom.boomLength.value),
                    parseFloat(dom.slewAngle.value)
                );
            },
            onChange: throttledRefresh
        },
        { id: 'boom-angle', labelId: 'val-boom-angle', unit: '°', decimals: 0 },
        { id: 'boom-length', labelId: 'val-boom-length', unit: ' m', decimals: 1 },
        { id: 'load-mass', labelId: 'val-load', unit: ' t', decimals: 1 },
        { id: 'dyn-factor', labelId: 'val-dyn-factor', unit: '', decimals: 2 },
        { id: 'ground-capacity', labelId: 'val-ground', unit: ' kPa', decimals: 0 },
    ];

    for (const s of sliders) {
        const el = document.getElementById(s.id);
        if (!el) continue;

        // 初始化标签值
        updateSliderLabel(s.id, s.labelId, parseFloat(el.value), s.unit, s.decimals);

        el.addEventListener('input', () => {
            updateSliderLabel(s.id, s.labelId, parseFloat(el.value), s.unit, s.decimals);
            if (s.onInput) s.onInput();
            throttledRefresh();
        });

        if (s.onChange) {
            el.addEventListener('change', s.onChange);
        }
    }

    // 自动演示
    dom.btnAnimate.addEventListener('click', () => {
        const active = toggleAutoRotate();
        dom.btnAnimate.textContent = active ? '⏸ 停止演示' : '🔄 自动演示';
        if (active) {
            dom.btnAnimate.classList.add('btn-danger');
            // 定时同步回转角度滑块
            startAutoRotateSync();
        } else {
            dom.btnAnimate.classList.remove('btn-danger');
            stopAutoRotateSync();
            // 同步最终角度
            const angle = getSlewAngle() % 360;
            dom.slewAngle.value = angle < 0 ? angle + 360 : angle;
            updateSliderLabel('slew-angle', 'val-slew', dom.slewAngle.value, '°', 0);
            refreshCalculation();
        }
    });

    // 输出计算书
    dom.btnReport.addEventListener('click', openReport);

    // ESC 关闭弹窗
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            dom.reportModal.style.display = 'none';
        }
    });

    // 弹窗点击遮罩关闭
    dom.reportModal.addEventListener('click', (e) => {
        if (e.target === dom.reportModal) {
            dom.reportModal.style.display = 'none';
        }
    });
}

let autoRotateSyncTimer = null;

function startAutoRotateSync() {
    function sync() {
        if (!isAutoRotating()) {
            stopAutoRotateSync();
            return;
        }
        let angle = getSlewAngle() % 360;
        if (angle < 0) angle += 360;
        dom.slewAngle.value = angle;
        updateSliderLabel('slew-angle', 'val-slew', angle, '°', 0);
        throttledRefresh();
        autoRotateSyncTimer = setTimeout(sync, 100);
    }
    sync();
}

function stopAutoRotateSync() {
    if (autoRotateSyncTimer) {
        clearTimeout(autoRotateSyncTimer);
        autoRotateSyncTimer = null;
    }
}

// ═══════════════════════════════════════════════════════
//  工具函数
// ═══════════════════════════════════════════════════════

function updateSliderLabel(sliderId, labelId, value, unit, decimals) {
    const label = document.getElementById(labelId);
    if (label) {
        label.textContent = value.toFixed(decimals) + unit;
    }
}

function cacheDomElements() {
    dom.craneSelect = document.getElementById('crane-select');
    dom.craneSpecs = document.getElementById('crane-specs');
    dom.slewAngle = document.getElementById('slew-angle');
    dom.boomAngle = document.getElementById('boom-angle');
    dom.boomLength = document.getElementById('boom-length');
    dom.loadMass = document.getElementById('load-mass');
    dom.dynFactor = document.getElementById('dyn-factor');
    dom.groundCapacity = document.getElementById('ground-capacity');
    dom.safetyIndicator = document.getElementById('safety-indicator');
    dom.safetyDetail = document.getElementById('safety-detail');
    dom.btnAnimate = document.getElementById('btn-animate');
    dom.btnReport = document.getElementById('btn-report');
    dom.reportModal = document.getElementById('report-modal');
    dom.reportIframe = document.getElementById('report-iframe');
    dom.statusDot = document.getElementById('status-dot');
    dom.statusText = document.getElementById('status-text');
}

function setStatus(state, message) {
    dom.statusDot.className = 'status-dot';
    if (state === 'error') dom.statusDot.classList.add('error');
    if (state === 'loading') dom.statusDot.classList.add('loading');
    dom.statusText.textContent = message;
}

export { getSlewAngle };
