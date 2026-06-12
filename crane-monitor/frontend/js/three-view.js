/**
 * Three.js 3D 场景管理器
 * 负责场景搭建、渲染循环、相机控制、模型更新
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
    createCraneModel,
    updatePadColors,
    updateBoomPose,
    updateLoadVisual,
} from './crane-model.js';

let scene, camera, renderer, controls;
let craneGroup, craneParts;
let groundPlane, gridHelper;
let clock;
let isInitialized = false;

// 动画状态
let autoRotateActive = false;
let autoRotateSpeed = 15;  // 度/秒

/**
 * 初始化 3D 场景
 */
export function initScene(container) {
    if (isInitialized) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // ── 渲染器 ──
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // ── 场景 ──
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a1520, 15, 60);
    scene.background = new THREE.Color(0x0a1520);

    // ── 相机 ──
    camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 200);
    camera.position.set(12, 10, 14);
    camera.lookAt(0, 0, 0);

    // ── OrbitControls ──
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.2, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 5;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
    };
    controls.update();

    // ── 灯光 ──
    // 环境光
    const ambient = new THREE.AmbientLight(0x4466aa, 1.2);
    scene.add(ambient);

    // 半球光（天空 + 地面）
    const hemi = new THREE.HemisphereLight(0x8899cc, 0x334455, 0.8);
    scene.add(hemi);

    // 主方向光（带阴影）
    const sun = new THREE.DirectionalLight(0xffeedd, 6.0);
    sun.position.set(15, 20, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 80;
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -20;
    sun.shadow.bias = -0.00015;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);

    // 补光（减少暗面过黑）
    const fill = new THREE.DirectionalLight(0x8899cc, 1.5);
    fill.position.set(-5, 3, -5);
    scene.add(fill);

    // ── 地面 ──
    // 大面积草地平面
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({
        color: 0x3a5a40,
        roughness: 0.9,
        metalness: 0.0,
    });
    groundPlane = new THREE.Mesh(groundGeo, groundMat);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.68;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);

    // 网格
    gridHelper = new THREE.GridHelper(40, 40, 0x556677, 0x334455);
    gridHelper.position.y = -0.67;
    scene.add(gridHelper);

    // ── 起重机占位（首次加载时创建默认模型）──
    clock = new THREE.Clock();
    isInitialized = true;

    // 响应窗口大小
    window.addEventListener('resize', () => onResize(container));

    // 开始渲染循环
    animate();
}

/**
 * 构建 / 重建起重机 3D 模型
 */
export function buildCrane(craneParams) {
    // 移除旧模型
    if (craneGroup) {
        scene.remove(craneGroup);
        disposeGroup(craneGroup);
    }

    const { group, parts } = createCraneModel(craneParams);
    craneGroup = group;
    craneParts = parts;
    scene.add(craneGroup);

    // 调整 OrbitControls 目标
    controls.target.set(0, 1.0, 0);
    controls.update();
}

/**
 * 更新支腿垫板颜色
 */
export function updatePads(reactions) {
    if (!craneParts) return;
    updatePadColors(craneParts.pads, reactions);
}

/**
 * 更新臂架姿态
 */
export function updateBoom(boomAngleDeg, boomLengthM, slewAngleDeg) {
    if (!craneParts) return;
    updateBoomPose(craneParts, boomAngleDeg, boomLengthM, slewAngleDeg);
}

/**
 * 更新吊物显示
 */
export function updateLoad(loadMassKg) {
    if (!craneParts) return;
    updateLoadVisual(craneParts, loadMassKg);
}

/**
 * 获取当前起重机参数（从模型）
 */
export function getCraneParts() {
    return craneParts;
}

/**
 * 自动旋转演示开关
 */
export function toggleAutoRotate() {
    autoRotateActive = !autoRotateActive;
    return autoRotateActive;
}

export function isAutoRotating() {
    return autoRotateActive;
}

export function setAutoRotateSpeed(degPerSec) {
    autoRotateSpeed = degPerSec;
}

/**
 * 设置回转角度（用于自动演示同步）
 */
export function getSlewAngle() {
    if (!craneParts) return 0;
    return THREE.MathUtils.radToDeg(craneParts.turntableGroup.rotation.y);
}

// ═══════════════════════════════════════════════════════
//  内部
// ═══════════════════════════════════════════════════════

function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(clock.getDelta(), 0.1);
    controls.update();

    // 自动旋转
    if (autoRotateActive && craneParts) {
        craneParts.turntableGroup.rotation.y += THREE.MathUtils.degToRad(autoRotateSpeed * dt);
        // 保持在 0-2π 范围
        if (craneParts.turntableGroup.rotation.y > Math.PI * 2) {
            craneParts.turntableGroup.rotation.y -= Math.PI * 2;
        }
    }

    renderer.render(scene, camera);
}

function onResize(container) {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function disposeGroup(group) {
    group.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
            } else {
                child.material.dispose();
            }
        }
    });
}
