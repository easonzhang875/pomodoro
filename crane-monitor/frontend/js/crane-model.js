/**
 * 起重机 3D 程序化模型构建
 * 使用 Three.js 基本几何体构建汽车吊模型
 *
 * 模型结构:
 *   craneGroup (根)
 *   ├── chassisGroup (底盘 + 支腿 + 垫板 — 不动)
 *   │   ├── chassisBody (卡车底盘)
 *   │   ├── outriggerFL / FR / RL / RR (支腿液压缸)
 *   │   └── padFL / FR / RL / RR (支腿垫板)
 *   ├── turntableGroup (回转平台 — 绕 Y 轴旋转)
 *   │   ├── turntable (回转台圆柱)
 *   │   └── cab (操作室)
 *   └── boomGroup (臂架系统 — 绕 Z 轴俯仰)
 *       ├── boomSections[] (伸缩臂节)
 *       ├── hookWire (吊钩钢丝绳)
 *       └── loadSphere (吊物)
 */

import * as THREE from 'three';

// 材质颜色常量
const COLOR_CHASSIS = 0x3d4f5f;       // 底盘深灰蓝
const COLOR_OUTRIGGER = 0x6b7b8b;     // 支腿钢灰色
const COLOR_PAD_NORMAL = 0x27ae60;    // 垫板-正常绿
const COLOR_PAD_WARNING = 0xf39c12;   // 垫板-警告黄
const COLOR_PAD_DANGER = 0xe74c3c;    // 垫板-危险红
const COLOR_TURNTABLE = 0x2c3e50;     // 回转平台深灰
const COLOR_BOOM = 0xf5c842;          // 吊臂工程黄
const COLOR_BOOM_TIP = 0xe0b030;      // 臂头
const COLOR_CAB = 0x4a6fa5;           // 操作室蓝灰
const COLOR_HOOK = 0x888888;          // 吊钩灰
const COLOR_LOAD = 0xe67e22;          // 吊物橙色

/**
 * 创建整个起重机模型
 * @returns {{ group: THREE.Group, parts: object }}
 */
export function createCraneModel(craneParams) {
    const craneGroup = new THREE.Group();

    // ── 底盘组（不动）──
    const chassisGroup = new THREE.Group();
    chassisGroup.name = 'chassis';

    // 底盘主体
    const chassisLength = craneParams.chassis_length_m || 10;
    const chassisWidth = craneParams.chassis_width_m || 2.5;
    const chassisHeight = 1.2;

    const chassisBodyGeo = new THREE.BoxGeometry(chassisWidth, chassisHeight, chassisLength);
    const chassisBodyMat = new THREE.MeshStandardMaterial({
        color: COLOR_CHASSIS,
        roughness: 0.6,
        metalness: 0.3,
    });
    const chassisBody = new THREE.Mesh(chassisBodyGeo, chassisBodyMat);
    chassisBody.position.y = chassisHeight / 2;
    chassisBody.castShadow = true;
    chassisBody.receiveShadow = true;
    chassisGroup.add(chassisBody);

    // 驾驶室（前方）
    const cabGeo = new THREE.BoxGeometry(chassisWidth * 0.85, chassisHeight * 0.8, chassisLength * 0.18);
    const cabMat = new THREE.MeshStandardMaterial({
        color: COLOR_CAB,
        roughness: 0.4,
        metalness: 0.2,
    });
    const cabMesh = new THREE.Mesh(cabGeo, cabMat);
    cabMesh.position.set(0, chassisHeight * 0.85, chassisLength * 0.35);
    cabMesh.castShadow = true;
    chassisGroup.add(cabMesh);

    // ── 支腿组 ──
    const a = craneParams.outrigger_long_m || 5.6;   // 纵向跨距
    const b = craneParams.outrigger_trans_m || 6.0;  // 横向跨距
    const padSize = Math.sqrt(craneParams.outrigger_pad_area_m2 || 0.25);

    const outriggerPositions = [
        { name: 'FL', x: -b / 2, z: +a / 2 },
        { name: 'FR', x: +b / 2, z: +a / 2 },
        { name: 'RL', x: -b / 2, z: -a / 2 },
        { name: 'RR', x: +b / 2, z: -a / 2 },
    ];

    const outriggers = {};
    const pads = {};

    outriggerPositions.forEach(({ name, x, z }) => {
        // 水平伸出的支腿梁
        const beamLength = 0.8;
        const beamGeo = new THREE.BoxGeometry(beamLength, 0.25, 0.35);
        const beamMat = new THREE.MeshStandardMaterial({
            color: COLOR_OUTRIGGER,
            roughness: 0.3,
            metalness: 0.7,
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(
            x > 0 ? x - beamLength / 2 + 0.1 : x + beamLength / 2 - 0.1,
            0.3,
            z
        );
        beam.castShadow = true;
        chassisGroup.add(beam);

        // 垂直液压缸
        const cylGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.7, 8);
        const cylMat = new THREE.MeshStandardMaterial({
            color: COLOR_OUTRIGGER,
            roughness: 0.2,
            metalness: 0.8,
        });
        const cylinder = new THREE.Mesh(cylGeo, cylMat);
        cylinder.position.set(x, -0.25, z);
        cylinder.castShadow = true;
        cylinder.name = `outrigger-${name}`;
        chassisGroup.add(cylinder);
        outriggers[name] = cylinder;

        // 支腿垫板
        const padGeo = new THREE.BoxGeometry(padSize, 0.08, padSize);
        const padMat = new THREE.MeshStandardMaterial({
            color: COLOR_PAD_NORMAL,
            roughness: 0.7,
            metalness: 0.1,
        });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(x, -0.64, z);
        pad.receiveShadow = true;
        pad.name = `pad-${name}`;
        pad.material = padMat;  // 保留引用以便更新颜色
        chassisGroup.add(pad);
        pads[name] = pad;
    });

    craneGroup.add(chassisGroup);

    // ── 回转平台（可旋转）──
    const turntableGroup = new THREE.Group();
    turntableGroup.name = 'turntable';

    const ttRadius = craneParams.turntable_radius_m || 1.3;
    const ttGeo = new THREE.CylinderGeometry(ttRadius, ttRadius * 1.05, 0.5, 32);
    const ttMat = new THREE.MeshStandardMaterial({
        color: COLOR_TURNTABLE,
        roughness: 0.4,
        metalness: 0.5,
    });
    const turntable = new THREE.Mesh(ttGeo, ttMat);
    turntable.position.y = chassisHeight + 0.25;
    turntable.castShadow = true;
    turntable.receiveShadow = true;
    turntableGroup.add(turntable);

    // 回转平台上的 A 字架
    const aFrameGeo = new THREE.BoxGeometry(0.3, 1.8, 0.3);
    const aFrame = new THREE.Mesh(aFrameGeo, new THREE.MeshStandardMaterial({
        color: COLOR_OUTRIGGER,
        roughness: 0.3,
        metalness: 0.6,
    }));
    aFrame.position.set(0, chassisHeight + 0.25 + 0.9, -ttRadius * 0.3);
    aFrame.castShadow = true;
    turntableGroup.add(aFrame);

    craneGroup.add(turntableGroup);

    // ── 臂架系统（可俯仰 + 伸缩）──
    const boomGroup = new THREE.Group();
    boomGroup.name = 'boom';

    // 臂架铰点（在回转平台上方）
    boomGroup.position.set(0, chassisHeight + 0.5, 0);

    // 基本臂（最外层）
    const baseBoomLength = 10;
    const baseBoomGeo = new THREE.BoxGeometry(0.5, 0.55, baseBoomLength);
    const baseBoomMat = new THREE.MeshStandardMaterial({
        color: COLOR_BOOM,
        roughness: 0.35,
        metalness: 0.4,
    });
    const baseBoom = new THREE.Mesh(baseBoomGeo, baseBoomMat);
    baseBoom.position.z = baseBoomLength / 2;
    baseBoom.castShadow = true;
    baseBoom.name = 'boom-base';
    boomGroup.add(baseBoom);

    // 第二节臂
    const secondBoomGeo = new THREE.BoxGeometry(0.38, 0.43, 8);
    const secondBoom = new THREE.Mesh(secondBoomGeo, new THREE.MeshStandardMaterial({
        color: COLOR_BOOM,
        roughness: 0.35,
        metalness: 0.4,
    }));
    secondBoom.position.z = 4 + 4;  // 从基本臂伸出 4m
    secondBoom.castShadow = true;
    secondBoom.name = 'boom-section-2';
    boomGroup.add(secondBoom);

    // 第三节臂
    const thirdBoomGeo = new THREE.BoxGeometry(0.28, 0.33, 8);
    const thirdBoom = new THREE.Mesh(thirdBoomGeo, new THREE.MeshStandardMaterial({
        color: COLOR_BOOM,
        roughness: 0.35,
        metalness: 0.4,
    }));
    thirdBoom.position.z = 8 + 4;
    thirdBoom.castShadow = true;
    thirdBoom.name = 'boom-section-3';
    boomGroup.add(thirdBoom);

    // 臂头
    const tipGeo = new THREE.BoxGeometry(0.25, 0.3, 0.6);
    const tipMat = new THREE.MeshStandardMaterial({
        color: COLOR_BOOM_TIP,
        roughness: 0.3,
        metalness: 0.5,
    });
    const boomTip = new THREE.Mesh(tipGeo, tipMat);
    boomTip.position.z = baseBoomLength;
    boomTip.name = 'boom-tip';
    boomGroup.add(boomTip);

    // ── 吊钩钢丝绳 ──
    const wireGroup = new THREE.Group();
    wireGroup.name = 'hook-wire';

    const wireGeo = new THREE.CylinderGeometry(0.03, 0.03, 3, 8);
    const wireMat = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.5,
        metalness: 0.6,
    });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    wire.position.y = -1.5;
    wireGroup.add(wire);

    // 吊钩
    const hookGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.6, 8);
    const hook = new THREE.Mesh(hookGeo, new THREE.MeshStandardMaterial({
        color: COLOR_HOOK,
        roughness: 0.3,
        metalness: 0.8,
    }));
    hook.position.y = -3.3;
    wireGroup.add(hook);

    // 吊物
    const loadGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const loadMat = new THREE.MeshStandardMaterial({
        color: COLOR_LOAD,
        roughness: 0.5,
        metalness: 0.1,
    });
    const loadSphere = new THREE.Mesh(loadGeo, loadMat);
    loadSphere.position.y = -4.0;
    loadSphere.castShadow = true;
    loadSphere.name = 'load';
    wireGroup.add(loadSphere);

    wireGroup.position.z = baseBoomLength;
    boomGroup.add(wireGroup);

    craneGroup.add(boomGroup);

    // ── 组装返回值 ──
    const parts = {
        chassisGroup,
        turntableGroup,
        boomGroup,
        wireGroup,
        baseBoom,
        secondBoom,
        thirdBoom,
        boomTip,
        loadSphere,
        pads,
        outriggers,
        outriggerSpan: { a, b, padSize },
    };

    return { group: craneGroup, parts };
}

/**
 * 更新支腿垫板颜色（根据压力状态）
 */
export function updatePadColors(pads, reactions) {
    const statusColors = {
        normal: COLOR_PAD_NORMAL,
        warning: COLOR_PAD_WARNING,
        danger: COLOR_PAD_DANGER,
    };
    const nameMap = {
        '左前 (FL)': 'FL',
        '右前 (FR)': 'FR',
        '左后 (RL)': 'RL',
        '右后 (RR)': 'RR',
    };

    for (const r of reactions) {
        const key = nameMap[r.name];
        if (key && pads[key]) {
            const color = statusColors[r.status] || COLOR_PAD_NORMAL;
            pads[key].material.color.setHex(color);
            // 压力越大，垫板略微下沉
            const sinkAmount = Math.max(0, (r.force_kn / 500) * 0.15);  // max ~0.15m
            pads[key].position.y = -0.64 - sinkAmount;
        }
    }
}

/**
 * 更新臂架姿态
 */
export function updateBoomPose(parts, boomAngleDeg, boomLengthM, slewAngleDeg) {
    const { turntableGroup, boomGroup, baseBoom, secondBoom, thirdBoom, boomTip, wireGroup, loadSphere } = parts;

    // 回转（绕 Y 轴）
    turntableGroup.rotation.y = THREE.MathUtils.degToRad(slewAngleDeg);

    // 俯仰（绕 X 轴）
    const pitchRad = THREE.MathUtils.degToRad(boomAngleDeg);
    boomGroup.rotation.x = -pitchRad;  // 负号使仰角向上

    // 伸缩：根据 boomLengthM 调整臂节伸出量
    const baseLen = 10;
    const totalExtend = Math.max(0, boomLengthM - baseLen);
    const extend2 = Math.min(totalExtend, 7.5);
    const extend3 = Math.max(0, totalExtend - 7.5);

    secondBoom.position.z = baseLen * 0.55 + extend2 / 2;
    secondBoom.scale.z = Math.max(0.1, extend2 / 8);

    thirdBoom.position.z = baseLen * 0.55 + extend2 + extend3 / 2;
    thirdBoom.scale.z = Math.max(0.1, extend3 / 8);

    // 臂头位置
    const tipZ = baseLen + totalExtend;
    boomTip.position.z = tipZ;
    wireGroup.position.z = tipZ;

    // 工作幅度
    const radius = boomLengthM * Math.cos(THREE.MathUtils.degToRad(boomAngleDeg));
    loadSphere.position.y = -4.0;  // 简化：保持吊物在钢丝绳末端
}

/**
 * 更新吊物可见性和大小
 */
export function updateLoadVisual(parts, loadMassKg) {
    const { loadSphere } = parts;
    if (loadMassKg <= 0) {
        loadSphere.visible = false;
    } else {
        loadSphere.visible = true;
        // 球体半径粗略关联到质量 (V ∝ m)
        const radius = 0.15 * Math.cbrt(loadMassKg / 1000);  // 10t → r≈0.33m
        loadSphere.scale.setScalar(Math.max(0.3, Math.min(3, radius / 0.4)));
    }
}
