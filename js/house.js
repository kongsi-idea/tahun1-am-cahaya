// 剖面娃娃屋：一间两层排屋，前墙拿掉，从外面看进去。
// 坐标：x 左右（-6～6），y 上下（地面 0），z 前后（后墙内侧 -2.5，剖面 2.5）。
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as T from './textures.js';

const STD = (opts) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...opts });

export const FLOOR2 = 3.4;          // 二楼地面高度
const H1 = 3.2, H2 = 3.0, WALL = 0.16, X0 = -6, X1 = 6, ZB = -2.5, ZF = 2.5;

export function buildHouse(scene) {
  const refs = { items: {}, lamps: [], flames: [], steps: [], toySlots: [], toyMeshes: [] };
  const root = new THREE.Group();
  scene.add(root);

  const add = (mesh, parent = root) => { mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh; };
  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), parent);
    m.position.set(x, y, z);
    return m;
  };
  const rbox = (w, h, d, r, mat, x, y, z, parent) => {
    const m = add(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat), parent);
    m.position.set(x, y, z);
    return m;
  };

  // ---------- 材质 ----------
  const M = {
    plaster: STD({ color: '#e9e1d2', map: T.paint('#ece4d6', 2) }),
    outer: STD({ color: '#f1e6cf', map: T.paint('#efe2c8', 4) }),
    living: STD({ map: T.paint('#b9c9a7', 5) }),          // 鼠尾草绿
    hall: STD({ map: T.paint('#e8dcc4', 6) }),
    kitchen: STD({ map: T.tiles('#f2f4ef', '#c9cfc9', 42) }),
    bedroom: STD({ map: T.paint('#bcd0e2', 7) }),         // 淡蓝
    study: STD({ map: T.paint('#f0d9b5', 8) }),
    wood: STD({ map: T.woodFloor('#a8754a'), roughness: 0.7 }),
    woodDark: STD({ map: T.woodFloor('#6e4a2e'), roughness: 0.65 }),
    floorTile: STD({ map: T.tiles('#d9c7a8', '#b6a283', 64), roughness: 0.6 }),
    roof: STD({ map: T.roofTiles(), roughness: 0.9 }),
    trim: STD({ color: '#e6ded0', roughness: 0.7 }),
    ceiling: STD({ color: '#f4efe6' }),
    metal: STD({ color: '#a9aeb3', metalness: 0.8, roughness: 0.4 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#cfe3f5', transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0 }),
  };
  M.living.map.repeat.set(2, 1.5);

  // ---------- 地面、草地、天空 ----------
  const ground = add(new THREE.Mesh(new THREE.PlaneGeometry(80, 40), STD({ map: T.grass() })));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.02, 6);
  const porch = box(13, 0.08, 4.2, M.floorTile, 0, 0.02, 4.7);
  porch.material = STD({ map: T.tiles('#bfb6a6', '#9d9585', 64), roughness: 0.7 });

  const skyMat = new THREE.MeshBasicMaterial({ map: T.nightSky(), fog: false });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(160, 80), skyMat);
  sky.position.set(0, 18, -40);
  scene.add(sky);
  refs.sky = sky; refs.skyNight = skyMat.map; refs.skyDawn = T.dawnSky();

  // 月亮：放在书房窗户正后方
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 16), new THREE.MeshBasicMaterial({ map: T.moonFace(), fog: false }));
  moon.position.set(5.2, 5.25, -6.5);
  scene.add(moon);
  const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow('rgba(220,230,255,0.9)', 'rgba(160,180,255,0)'), transparent: true, depthWrite: false, opacity: 0.6 }));
  moonHalo.scale.set(2.4, 2.4, 1); moon.add(moonHalo);
  refs.items.moon = item('moon', moon, [moon]);

  // 太阳（天亮时才出现）
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow('rgba(255,250,220,1)', 'rgba(255,190,90,0)'), transparent: true, depthWrite: false }));
  sun.material.color.setScalar(2.2); sun.scale.set(6, 6, 1); sun.position.set(7.5, 4, -16); sun.visible = false;
  scene.add(sun);
  refs.sun = sun;
  refs.items.sun = item('sun', sun, [sun]);
  refs.root = root; refs.moon = moon;

  // ---------- 外壳 ----------
  // 一楼、二楼地板
  box(X1 - X0, 0.2, ZF - ZB, M.wood, 0, -0.1, 0);
  // 二楼楼板（楼梯口留空：x -0.4～3.0，z -2.5～-1.35）
  const slabY = FLOOR2 - 0.1;
  box(X1 - X0, 0.2, ZF + 1.35, M.wood, 0, slabY, (ZF - 1.35) / 2);
  box(5.6, 0.2, 1.15, M.wood, -3.2, slabY, -1.925);
  box(3.0, 0.2, 1.15, M.wood, 4.5, slabY, -1.925);
  // 天花板（楼板底面颜色）
  box(X1 - X0, 0.02, ZF - ZB, M.ceiling, 0, FLOOR2 - 0.21, 0).receiveShadow = true;
  box(X1 - X0, 0.2, ZF - ZB, M.ceiling, 0, FLOOR2 + H2 + 0.1, 0);

  // 后墙（含门窗洞）
  wallWithHoles(-6, -0.6, 0, H1, M.living, [[-4.95, -3.85, 0, 2.25], [-2.9, -1.5, 1.05, 2.45]]);
  wallWithHoles(-0.6, 3.2, 0, H1, M.hall, []);
  wallWithHoles(3.2, 6, 0, H1, M.kitchen, [[4.0, 5.2, 1.6, 2.6]]);
  wallWithHoles(-6, -0.6, FLOOR2, FLOOR2 + H2, M.bedroom, [[-5.2, -3.9, FLOOR2 + 1.2, FLOOR2 + 2.4]]);
  wallWithHoles(-0.6, 3.2, FLOOR2, FLOOR2 + H2, M.hall, []);
  wallWithHoles(3.2, 6, FLOOR2, FLOOR2 + H2, M.study, [[4.5, 5.9, FLOOR2 + 1.0, FLOOR2 + 2.4]]);
  // 一楼与二楼之间后墙的楼板厚度
  box(12, 0.2, WALL, M.outer, 0, slabY, ZB - WALL / 2);
  box(12, 0.2, WALL, M.outer, 0, FLOOR2 + H2 + 0.1, ZB - WALL / 2);

  // 左右外墙（剖面能看到厚度）
  for (const [x, mat1, mat2] of [[X0 - WALL / 2, M.living, M.bedroom], [X1 + WALL / 2, M.kitchen, M.study]]) {
    box(WALL, H1 + 0.2, ZF - ZB + WALL, mat1, x, H1 / 2, -WALL / 2);
    box(WALL, H2 + 0.4, ZF - ZB + WALL, mat2, x, FLOOR2 + H2 / 2, -WALL / 2);
  }
  // 隔间墙
  box(0.12, H1, ZF - ZB, M.kitchen, 3.2, H1 / 2, 0);
  box(0.12, H2, ZF - ZB, M.bedroom, -0.6, FLOOR2 + H2 / 2, 0);
  box(0.12, H2, ZF - ZB, M.study, 3.2, FLOOR2 + H2 / 2, 0);
  // 剖面边框：外框一圈浅色木条，像娃娃屋
  for (const [w, h, x, y] of [[12.6, 0.24, 0, -0.08], [12.6, 0.24, 0, FLOOR2 - 0.1], [12.6, 0.24, 0, FLOOR2 + H2 + 0.1], [0.24, FLOOR2 + H2 + 0.3, -6.18, (FLOOR2 + H2) / 2], [0.24, FLOOR2 + H2 + 0.3, 6.18, (FLOOR2 + H2) / 2]]) {
    box(w, h, 0.12, M.trim, x, y, ZF + 0.02);
  }

  // 屋顶（人字形，屋脊前后走向，三角面对着镜头）
  const roofH = 2.6, roofTop = FLOOR2 + H2 + 0.2;
  for (const s of [-1, 1]) {
    const len = Math.hypot(6.9, roofH);
    const r = box(len, 0.22, ZF - ZB + 1.0, M.roof, s * 3.2, roofTop + roofH / 2, -0.1);
    r.rotation.z = -s * Math.atan2(roofH, 6.9);
  }
  // 阁楼三角面（深色木）
  const tri = new THREE.Shape();
  tri.moveTo(-6.1, 0); tri.lineTo(6.1, 0); tri.lineTo(0, roofH - 0.1); tri.closePath();
  const gable = add(new THREE.Mesh(new THREE.ShapeGeometry(tri), STD({ color: '#5a3d2a', roughness: 0.9 })));
  gable.position.set(0, roofTop, ZB - 0.1);
  const gableFront = add(new THREE.Mesh(new THREE.ShapeGeometry(tri), STD({ map: T.paint('#efe2c8', 4) })));
  gableFront.position.set(0, roofTop, ZF - 0.05);
  // 阁楼正面的小圆窗
  const oculus = new THREE.Mesh(new THREE.CircleGeometry(0.45, 32), STD({ color: '#1b2238', roughness: 0.3 }));
  oculus.position.set(0, roofTop + 0.95, ZF - 0.03); root.add(oculus);
  const ocRing = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.06, 8, 32), M.trim);
  ocRing.position.copy(oculus.position); root.add(ocRing);

  // 左右邻居（排屋），外墙完整、窗户黑着
  for (const s of [-1, 1]) neighbour(s);

  // ---------- 一楼：客厅 ----------
  // 沙发靠左墙
  const sofaMat = STD({ map: T.fabric('#7b8fa6') });
  rbox(1.0, 0.45, 2.6, 0.08, sofaMat, -5.35, 0.32, 0.2);
  rbox(0.3, 0.8, 2.6, 0.08, sofaMat, -5.75, 0.7, 0.2);
  rbox(1.0, 0.65, 0.28, 0.08, sofaMat, -5.35, 0.45, -1.15);
  rbox(1.0, 0.65, 0.28, 0.08, sofaMat, -5.35, 0.45, 1.55);
  rbox(0.5, 0.5, 0.18, 0.12, STD({ map: T.fabric('#e6b75c', '#d9a443') }), -5.45, 0.75, -0.4).rotation.y = 0.5;
  // 茶几、地毯
  const rug = add(new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), STD({ map: T.fabric('#b35a3c', '#c98a4e'), roughness: 1 })));
  rug.rotation.x = -Math.PI / 2; rug.position.set(-3.0, 0.012, 0.6);
  rbox(1.3, 0.08, 0.7, 0.03, M.woodDark, -3.2, 0.45, 0.5);
  for (const [dx, dz] of [[-0.55, -0.25], [0.55, -0.25], [-0.55, 0.25], [0.55, 0.25]]) box(0.06, 0.42, 0.06, M.woodDark, -3.2 + dx, 0.21, 0.5 + dz);
  // 前门（后墙上）
  const doorPivot = new THREE.Group(); doorPivot.position.set(-4.95, 0, ZB + 0.02); root.add(doorPivot);
  const doorMat = STD({ map: T.woodFloor('#7a4a2b'), roughness: 0.6 });
  const door = box(1.1, 2.25, 0.08, doorMat, 0.55, 1.125, 0, doorPivot);
  const knob = box(0.08, 0.08, 0.12, M.metal, 0.98, 1.1, 0.06, doorPivot);
  for (const [w, h, x, y] of [[1.28, 0.1, -4.4, 2.3], [0.1, 2.3, -5.0, 1.15], [0.1, 2.3, -3.8, 1.15]]) box(w, h, 0.14, M.trim, x, y, ZB + 0.02);
  refs.doorPivot = doorPivot;
  refs.items.door = item('door', door, [door, knob]);
  // 门口地垫
  const mat = add(new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.6), STD({ color: '#6b5b45', roughness: 1 })));
  mat.rotation.x = -Math.PI / 2; mat.position.set(-4.4, 0.013, -2.05);
  // 客厅窗台 + 油灯（pelita）
  box(1.5, 0.08, 0.3, M.trim, -2.2, 1.05, ZB + 0.12);
  windowFrame(-2.9, -1.5, 1.05, 2.45, ZB);
  refs.items.pelita = pelita(-2.2, 1.09, ZB + 0.14);
  // 落地灯（装饰）
  box(0.04, 1.5, 0.04, M.metal, -5.5, 0.75, -1.9);
  // 猫（坐在沙发扶手旁的地毯上）
  refs.items.cat = cat(-4.55, 0, 1.6);

  // 地上玩具的可能位置（每回合随机抽 3 个）
  refs.toySlots = [[-4.3, 1.0], [-2.1, 1.7], [-1.4, -0.3], [-3.7, -1.3], [-2.4, -1.9], [-4.6, 1.9], [-1.1, 1.2], [-3.0, 1.9], [-4.0, -0.4]];
  refs.toyMeshes = [toyCar(), toyBall(), toyBlocks()];

  // ---------- 楼梯（左低右高，靠后墙） ----------
  const stairMat = STD({ map: T.woodFloor('#8c5c37'), roughness: 0.6 });
  const nSteps = 8, run = 0.42, rise = FLOOR2 / nSteps, sx0 = -0.35;
  for (let i = 0; i < nSteps; i++) {
    const y = rise * (i + 1);
    const s = box(run, y, 1.1, stairMat, sx0 + run * i + run / 2, y / 2, -1.95);
    const nose = box(run + 0.04, 0.05, 1.14, M.trim, sx0 + run * i + run / 2, y - 0.02, -1.95);
    const top = new THREE.Vector3(sx0 + run * i + run / 2, y, -1.75);
    refs.steps.push(item('step' + i, s, [s, nose], { index: i, top, focus: top }));
  }
  // 楼梯扶手（一楼侧）与二楼栏杆
  const railMat = STD({ color: '#5a3a24', roughness: 0.5 });
  const railLen = Math.hypot(run * nSteps, FLOOR2);
  const rail = box(railLen, 0.06, 0.06, railMat, sx0 + (run * nSteps) / 2, FLOOR2 / 2 + 0.9, -1.38);
  rail.rotation.z = Math.atan2(FLOOR2, run * nSteps);
  for (let i = 0; i < nSteps; i += 2) box(0.04, 0.9, 0.04, railMat, sx0 + run * i + run / 2, rise * (i + 1) + 0.45, -1.38);
  box(3.4, 0.06, 0.06, railMat, 1.3, FLOOR2 + 0.95, -1.36);
  for (let i = 0; i <= 8; i++) box(0.04, 0.95, 0.04, railMat, -0.4 + i * 0.42, FLOOR2 + 0.475, -1.36);

  // ---------- 一楼：厨房 ----------
  const cabMat = STD({ color: '#d8e2da', roughness: 0.55 });
  box(2.6, 0.9, 0.65, cabMat, 4.6, 0.45, ZB + 0.33);
  const top = box(2.66, 0.06, 0.7, STD({ color: '#3c3f44', roughness: 0.35, metalness: 0.2 }), 4.6, 0.93, ZB + 0.35);
  box(2.6, 0.7, 0.4, cabMat, 4.6, 2.65, ZB + 0.2);
  windowFrame(4.0, 5.2, 1.6, 2.6, ZB);
  // 煤气炉 + 火
  box(0.7, 0.08, 0.45, STD({ color: '#222', roughness: 0.4, metalness: 0.4 }), 4.15, 1.0, ZB + 0.36);
  refs.items.fire = stoveFire(4.15, 1.06, ZB + 0.36);
  const kettle = add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.26, 24), M.metal));
  kettle.position.set(4.15, 1.24, ZB + 0.36); kettle.visible = false; refs.kettle = kettle;
  // 汤匙（放在台面上）
  refs.items.spoon = spoon(5.3, 0.97, ZB + 0.5);
  // 冰箱
  rbox(0.8, 1.9, 0.7, 0.05, STD({ color: '#eef0f2', roughness: 0.3, metalness: 0.1 }), 5.5, 0.95, 1.0);
  box(0.04, 0.5, 0.04, M.metal, 5.12, 1.4, 1.36);
  // 餐桌椅
  rbox(1.1, 0.06, 0.8, 0.02, M.woodDark, 4.4, 0.75, 1.2);
  for (const [dx, dz] of [[-0.45, -0.3], [0.45, -0.3], [-0.45, 0.3], [0.45, 0.3]]) box(0.05, 0.72, 0.05, M.woodDark, 4.4 + dx, 0.36, 1.2 + dz);

  // ---------- 二楼：卧室 ----------
  const bedMat = STD({ map: T.fabric('#f4f1ea', '#e6dccb') });
  box(2.2, 0.35, 1.9, M.woodDark, -4.8, FLOOR2 + 0.18, -1.45);
  rbox(2.1, 0.22, 1.82, 0.08, bedMat, -4.8, FLOOR2 + 0.46, -1.45);
  rbox(0.5, 0.16, 0.9, 0.07, STD({ color: '#fff' }), -5.65, FLOOR2 + 0.64, -1.45);
  rbox(1.2, 0.08, 1.84, 0.04, STD({ map: T.fabric('#6d93c7', '#5a80b4') }), -4.35, FLOOR2 + 0.6, -1.45);
  box(0.12, 1.0, 1.9, M.woodDark, -5.92, FLOOR2 + 0.5, -1.45);
  windowFrame(-5.2, -3.9, FLOOR2 + 1.2, FLOOR2 + 2.4, ZB);
  // 书桌 + 椅子 + 书
  rbox(1.4, 0.06, 0.7, 0.02, M.wood, -2.4, FLOOR2 + 0.78, ZB + 0.4);
  for (const dx of [-0.65, 0.65]) box(0.06, 0.78, 0.66, M.wood, -2.4 + dx, FLOOR2 + 0.39, ZB + 0.4);
  rbox(0.5, 0.06, 0.5, 0.02, M.woodDark, -2.4, FLOOR2 + 0.48, ZB + 1.05);
  box(0.5, 0.6, 0.05, M.woodDark, -2.4, FLOOR2 + 0.8, ZB + 1.3);
  refs.items.book = book(-2.4, FLOOR2 + 0.82, ZB + 0.45);
  // 台灯（停电时也不会亮）
  box(0.04, 0.4, 0.04, M.metal, -1.85, FLOOR2 + 1.0, ZB + 0.25);
  const shade = add(new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.2, 20, 1, true), STD({ color: '#e7d7b6', side: THREE.DoubleSide })));
  shade.position.set(-1.85, FLOOR2 + 1.22, ZB + 0.25);
  // 立镜
  refs.items.mirror = mirror(-1.2, FLOOR2, ZB + 0.15);
  // 书包（地上，反光条朝前）
  refs.items.bag = schoolBag(-3.2, FLOOR2, 1.4);

  // ---------- 二楼：楼梯口平台 ----------
  box(1.4, 0.05, 0.3, M.woodDark, 1.4, FLOOR2 + 1.6, ZB + 0.15);
  refs.items.torch2 = shelfTorch(1.25, FLOOR2 + 1.68, ZB + 0.18);
  // 墙上的画
  box(0.9, 0.6, 0.03, STD({ color: '#d68c5a' }), 0.2, FLOOR2 + 1.9, ZB + 0.02);

  // ---------- 二楼：书房 ----------
  windowFrame(4.5, 5.9, FLOOR2 + 1.0, FLOOR2 + 2.4, ZB);
  box(1.6, 0.06, 0.3, M.trim, 5.2, FLOOR2 + 0.98, ZB + 0.14);
  rbox(0.9, 0.05, 0.6, 0.02, M.wood, 4.2, FLOOR2 + 0.7, 0.4);
  box(0.06, 0.7, 0.06, M.wood, 4.2, FLOOR2 + 0.35, 0.4);
  refs.items.candle = candle(4.2, FLOOR2 + 0.73, 0.4);
  rbox(0.7, 0.4, 0.7, 0.15, STD({ map: T.fabric('#c9734a') }), 4.9, FLOOR2 + 0.2, 1.4);
  // 书架
  box(0.3, 1.8, 1.2, M.woodDark, 3.45, FLOOR2 + 0.9, -1.5);
  const bookCols = ['#c0504d', '#4f81bd', '#9bbb59', '#f2c14e', '#8064a2'];
  for (let sh = 0; sh < 3; sh++) for (let i = 0; i < 6; i++) {
    box(0.22, 0.32, 0.12, STD({ color: bookCols[(i + sh) % 5] }), 3.5, FLOOR2 + 0.25 + sh * 0.55, -1.95 + i * 0.16);
  }

  // ---------- 天花板吊灯 ----------
  for (const [x, y, z] of [[-3.2, H1 - 0.05, 0.2], [1.3, H1 - 0.05, 0.4], [4.6, H1 - 0.05, 0.4], [-3.3, FLOOR2 + H2 - 0.05, 0.2], [1.3, FLOOR2 + H2 - 0.05, 0.6], [4.6, FLOOR2 + H2 - 0.05, 0.4]]) {
    const bulbMat = new THREE.MeshStandardMaterial({ color: '#fffaf0', emissive: '#ffe7b8', emissiveIntensity: 4 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), bulbMat);
    bulb.rotation.x = Math.PI; bulb.position.set(x, y, z); root.add(bulb);
    const light = new THREE.PointLight('#ffe9c9', 9, 0, 1.6);
    light.position.set(x, y - 0.35, z);
    root.add(light);
    refs.lamps.push({ light, bulbMat, base: x > 3.5 ? 5 : 8 });
  }

  return refs;

  // ======== 局部工具函数 ========
  function item(id, object, meshes, extra = {}) {
    const it = { id, object, meshes, glint: [], ...extra };
    for (const m of meshes) m.userData.itemId = id;
    return it;
  }

  function wallWithHoles(x0, x1, y0, y1, mat, holes) {
    const xs = [x0, x1], ys = [y0, y1];
    for (const [hx0, hx1, hy0, hy1] of holes) { xs.push(hx0, hx1); ys.push(hy0, hy1); }
    xs.sort((a, b) => a - b); ys.sort((a, b) => a - b);
    for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
      const cx = (xs[i] + xs[i + 1]) / 2, cy = (ys[j] + ys[j + 1]) / 2;
      const w = xs[i + 1] - xs[i], h = ys[j + 1] - ys[j];
      if (w < 1e-3 || h < 1e-3) continue;
      if (holes.some(([a, b, c, d]) => cx > a && cx < b && cy > c && cy < d)) continue;
      const m = box(w, h, WALL, mat, cx, cy, ZB - WALL / 2);
      // 内墙贴图按面积重复，避免拉伸
      if (mat.map) {
        m.material = mat.clone();
        m.material.map = mat.map.clone();
        m.material.map.repeat.set(w / 2, h / 2);
        m.material.map.needsUpdate = true;
      }
    }
  }

  function windowFrame(x0, x1, y0, y1, z) {
    const w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    for (const [bw, bh, bx, by] of [[w + 0.12, 0.07, cx, y0], [w + 0.12, 0.07, cx, y1], [0.07, h, x0, cy], [0.07, h, x1, cy], [0.05, h, cx, cy], [w, 0.05, cx, cy]]) {
      box(bw, bh, 0.1, M.trim, bx, by, z - WALL / 2);
    }
    const g = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.glass);
    g.userData.passThrough = true;
    g.position.set(cx, cy, z - WALL / 2); root.add(g);
  }

  function neighbour(s) {
    const g = new THREE.Group(); root.add(g);
    const cx = s * 12.6;
    const facade = STD({ map: T.paint(s < 0 ? '#e3d6bd' : '#d9e0cf', 9) });
    box(12.2, FLOOR2 + H2 + 0.2, 5.2, facade, cx, (FLOOR2 + H2 + 0.2) / 2, -0.1, g);
    for (const [wx, wy] of [[-3, 1.6], [3, 1.6], [-3, FLOOR2 + 1.6], [3, FLOOR2 + 1.6]]) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.2), STD({ color: '#111827', roughness: 0.25, metalness: 0.3 }));
      w.position.set(cx + wx, wy, 2.52); g.add(w);
      box(1.6, 0.08, 0.1, M.trim, cx + wx, wy - 0.64, 2.55, g);
    }
    const len = Math.hypot(6.9, roofH);
    for (const k of [-1, 1]) {
      const r = box(len, 0.22, 6.2, M.roof, cx + k * 3.2, FLOOR2 + H2 + 0.2 + roofH / 2, -0.1, g);
      r.rotation.z = -k * Math.atan2(roofH, 6.9);
    }
    const gf = new THREE.Mesh(new THREE.ShapeGeometry(tri), facade);
    gf.position.set(cx, FLOOR2 + H2 + 0.2, 2.55); g.add(gf);
  }

  // ---------- 会发光的东西 ----------
  function flame(scale = 1, color = '#ffd27a') {
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.035 * scale, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff6dc').multiplyScalar(5) }));
    core.scale.set(1, 2.2, 1); core.position.y = 0.06 * scale;
    const outer = new THREE.Mesh(new THREE.SphereGeometry(0.055 * scale, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(3), transparent: true, opacity: 0.85 }));
    outer.scale.set(1, 2.4, 1); outer.position.y = 0.08 * scale;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.scale.set(0.7 * scale, 0.7 * scale, 1); halo.position.y = 0.09 * scale;
    g.add(outer, core, halo);
    g.userData.flame = { outer, core, halo, base: scale };
    return g;
  }

  function candle(x, y, z) {
    const g = new THREE.Group(); g.position.set(x, y, z); root.add(g);
    const dish = add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.03, 24), M.metal), g);
    const body = add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.32, 20), STD({ color: '#fbf6ea', roughness: 0.5 })), g);
    body.position.y = 0.17;
    const f = flame(1); f.position.y = 0.33; g.add(f);
    const light = new THREE.PointLight('#ffb35c', 2.2, 5, 2); light.position.y = 0.5; g.add(light);
    refs.flames.push({ group: f, light, base: 2.2 });
    return item('candle', g, [dish, body], { flame: f, light });
  }

  function pelita(x, y, z) {
    const g = new THREE.Group(); g.position.set(x, y, z); root.add(g);
    const tin = add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.18, 20), STD({ color: '#9aa3a8', metalness: 0.7, roughness: 0.4 })), g);
    tin.position.y = 0.09;
    const neck = add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.08, 10), STD({ color: '#7d6b52' })), g);
    neck.position.y = 0.22;
    const f = flame(0.9, '#ffbd5c'); f.position.y = 0.26; g.add(f);
    const light = new THREE.PointLight('#ffa64d', 1.6, 4, 2); light.position.set(0, 0.45, 0.2); g.add(light);
    refs.flames.push({ group: f, light, base: 1.6 });
    return item('pelita', g, [tin, neck], { flame: f, light });
  }

  function stoveFire(x, y, z) {
    const g = new THREE.Group(); g.position.set(x, y, z); root.add(g);
    const ring = add(new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 8, 24), STD({ color: '#333', metalness: 0.6 })), g);
    ring.rotation.x = Math.PI / 2;
    const flames = new THREE.Group(); g.add(flames);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.09, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(i % 2 ? '#5aa9ff' : '#7cc0ff').multiplyScalar(3), transparent: true, opacity: 0.9 }));
      c.position.set(Math.cos(a) * 0.11, 0.05, Math.sin(a) * 0.11);
      flames.add(c);
    }
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow('rgba(150,200,255,1)', 'rgba(60,120,255,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.scale.set(0.8, 0.5, 1); halo.position.y = 0.06; flames.add(halo);
    flames.userData.stove = true;
    const light = new THREE.PointLight('#8fbfff', 1.4, 3.5, 2); light.position.set(0, 0.3, 0.3); g.add(light);
    refs.flames.push({ group: flames, light, base: 1.4 });
    return item('fire', g, [ring], { flame: flames, light });
  }

  function shelfTorch(x, y, z) {
    const g = new THREE.Group(); g.position.set(x, y, z); root.add(g);
    const body = add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.36, 16), STD({ color: '#d0452f', roughness: 0.4 })), g);
    body.rotation.z = Math.PI / 2;
    const head = add(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.05, 0.1, 16), STD({ color: '#2b2b2b', metalness: 0.5, roughness: 0.3 })), g);
    head.rotation.z = -Math.PI / 2; head.position.x = 0.22;
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.065, 20), new THREE.MeshBasicMaterial({ color: '#fff8e0' }));
    lens.rotation.y = Math.PI / 2; lens.position.x = 0.275; g.add(lens);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow('rgba(255,250,225,1)', 'rgba(255,230,160,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.scale.set(0.5, 0.5, 1); halo.position.x = 0.29; g.add(halo);
    const spot = new THREE.SpotLight('#fff1cf', 14, 6, 0.32, 0.5, 1.5);
    spot.position.set(0.28, 0, 0); g.add(spot);
    const tgt = new THREE.Object3D(); tgt.position.set(2.2, -0.1, 0.05); g.add(tgt); spot.target = tgt;
    return item('torch2', g, [body, head], { lens, halo, light: spot });
  }

  // ---------- 会「骗人」的亮东西（反光，不是自己发光） ----------
  function glintMat(base) {
    return new THREE.MeshStandardMaterial({ ...base, emissive: base.emissive || '#ffffff', emissiveIntensity: 0 });
  }

  function mirror(x, y, z) {
    const g = new THREE.Group(); g.position.set(x, y, z); root.add(g);
    const frame = rbox(0.62, 1.7, 0.06, 0.03, STD({ color: '#c7a36a', metalness: 0.4, roughness: 0.4 }), 0, 0.95, 0, g);
    const glassMat = glintMat({ color: '#c9d6df', metalness: 0.55, roughness: 0.12, emissive: '#e8f1ff' });
    const glass = add(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.56), glassMat), g);
    glass.position.set(0, 0.95, 0.035);
    const it = item('mirror', g, [frame, glass]);
    it.glint.push({ mat: glassMat, k: 0.9 });
    return it;
  }

  function spoon(x, y, z) {
    const g = new THREE.Group(); g.position.set(x, y, z); root.add(g);
    const m = glintMat({ color: '#d7dde2', metalness: 0.6, roughness: 0.25, emissive: '#f4f8ff' });
    const bowl = add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 8), m), g);
    bowl.scale.set(1, 0.3, 1.4);
    const handle = add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.015, 0.3), m), g);
    handle.position.set(0, 0.01, 0.22);
    g.rotation.y = -0.6;
    const it = item('spoon', g, [bowl, handle]);
    it.glint.push({ mat: m, k: 0.8 });
    return it;
  }

  function schoolBag(x, y, z) {
    const g = new THREE.Group(); g.position.set(x, y, z); root.add(g);
    const body = rbox(0.6, 0.72, 0.3, 0.1, STD({ map: T.fabric('#2f5fa8'), roughness: 0.8 }), 0, 0.36, 0, g);
    const pocket = rbox(0.46, 0.3, 0.1, 0.06, STD({ color: '#24508f', roughness: 0.8 }), 0, 0.24, 0.17, g);
    const stripMat = glintMat({ color: '#b9c0c6', metalness: 0.2, roughness: 0.3, emissive: '#f6fbff' });
    const strip = box(0.5, 0.05, 0.02, stripMat, 0, 0.45, 0.16, g);
    const strip2 = box(0.4, 0.04, 0.02, stripMat, 0, 0.3, 0.225, g);
    g.rotation.y = 0.2;
    const it = item('bag', g, [body, pocket, strip, strip2]);
    it.glint.push({ mat: stripMat, k: 1.2 });
    return it;
  }

  function cat(x, y, z) {
    const g = new THREE.Group(); g.position.set(x, y, z); root.add(g);
    const fur = STD({ color: '#3a3330', roughness: 0.95 });
    const body = add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 14), fur), g);
    body.scale.set(1, 1.15, 1.3); body.position.y = 0.26;
    const head = add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), fur), g);
    head.position.set(0, 0.56, 0.16);
    for (const s of [-1, 1]) {
      const ear = add(new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.11, 8), fur), g);
      ear.position.set(s * 0.08, 0.7, 0.14); ear.rotation.z = -s * 0.25;
    }
    const tail = add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.08, -0.25), new THREE.Vector3(0.25, 0.05, -0.2), new THREE.Vector3(0.32, 0.2, 0.05)]), 16, 0.035, 8), fur), g);
    const eyeMat = glintMat({ color: '#1d2a12', roughness: 0.2, emissive: '#9dff6a' });
    const eyes = [];
    for (const s of [-1, 1]) {
      const e = add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), eyeMat), g);
      e.position.set(s * 0.06, 0.59, 0.29); e.scale.set(1, 0.8, 0.5);
      eyes.push(e);
    }
    g.rotation.y = 0.35;
    const it = item('cat', g, [body, head, tail, ...eyes]);
    it.glint.push({ mat: eyeMat, k: 1.4 });
    return it;
  }

  // ---------- 其他 ----------
  function book(x, y, z) {
    const g = new THREE.Group(); g.position.set(x, y, z); root.add(g);
    const cover = add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.02, 0.4), STD({ color: '#8a3b2e' })), g);
    const pageMat = new THREE.MeshStandardMaterial({ map: T.bookPages('cat'), roughness: 0.9 });
    const pages = add(new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.03, 0.36), [STD({ color: '#f3ecdc' }), STD({ color: '#f3ecdc' }), pageMat, STD({ color: '#f3ecdc' }), STD({ color: '#f3ecdc' }), STD({ color: '#f3ecdc' })]), g);
    pages.position.y = 0.025;
    g.rotation.x = -0.12;
    return item('book', g, [cover, pages], { pageMat });
  }

  function toyCar() {
    const g = new THREE.Group(); root.add(g);
    const body = rbox(0.42, 0.14, 0.22, 0.05, STD({ color: '#e0473a', roughness: 0.35 }), 0, 0.12, 0, g);
    const cab = rbox(0.22, 0.12, 0.2, 0.04, STD({ color: '#f4f0e6', roughness: 0.3 }), -0.03, 0.24, 0, g);
    const wheels = [];
    for (const [dx, dz] of [[-0.13, 0.12], [0.13, 0.12], [-0.13, -0.12], [0.13, -0.12]]) {
      const w = add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16), STD({ color: '#222' })), g);
      w.rotation.x = Math.PI / 2; w.position.set(dx, 0.06, dz); wheels.push(w);
    }
    return item('toy0', g, [body, cab, ...wheels]);
  }
  function toyBall() {
    const g = new THREE.Group(); root.add(g);
    const b = add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), STD({ map: T.fabric('#f2c14e', '#3d8fd1'), roughness: 0.5 })), g);
    b.position.y = 0.16;
    return item('toy1', g, [b]);
  }
  function toyBlocks() {
    const g = new THREE.Group(); root.add(g);
    const a = rbox(0.18, 0.18, 0.18, 0.02, STD({ color: '#4caf6a' }), 0, 0.09, 0, g);
    const b = rbox(0.18, 0.18, 0.18, 0.02, STD({ color: '#3d8fd1' }), 0.2, 0.09, 0.02, g);
    const c = rbox(0.18, 0.18, 0.18, 0.02, STD({ color: '#f2c14e' }), 0.1, 0.27, 0.01, g);
    return item('toy2', g, [a, b, c]);
  }
}
