/**
 * 汽车吊支腿压力实时监测系统 — 主入口
 * 初始化 3D 场景和控制面板，协调各模块
 */

import { initScene } from './three-view.js';
import { initPanel } from './control-panel.js';

/**
 * 应用启动
 */
async function init() {
    const view3dContainer = document.getElementById('view3d');

    // 1. 初始化 Three.js 3D 场景
    initScene(view3dContainer);

    // 2. 初始化控制面板（加载起重机列表、绑定事件）
    await initPanel();

    console.log('🏗️ 汽车吊支腿压力实时监测系统 启动完成');
    console.log('   规范依据: GB/T 3811-2008 | GB 6067.1-2010 | GB 50007-2011 | ISO 4305:2014');
}

// 启动
init().catch(err => {
    console.error('应用启动失败:', err);
    document.getElementById('status-text').textContent = '启动失败: ' + err.message;
    document.getElementById('status-dot').classList.add('error');
});
