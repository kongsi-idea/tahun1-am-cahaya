import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildHouse } from './house.js';
import * as T from './textures.js';
import { ICON } from './icons.js';
import { makeThumbs } from './thumbs.js';
import { sfx, unlock, setMuted, isMuted, crickets } from './audio.js';

const $ = (s) => document.querySelector(s);
const now = () => performance.now() / 1000;

// ================= 3D 基础 =================
const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#05070f');
const camera = new THREE.PerspectiveCamera(26, 1, 0.5, 200);

const H = buildHouse(scene);
const TORCH_LUX = 1.15;
// 不是题目的东西一律哑光：在手电筒下不该出现亮斑，免得学生以为它会发光。
// 「会骗人的亮东西」（镜子、汤匙、反光条、猫眼）有自己的 glint 材质，不在这里改。
{
  const keep = new Set(Object.values(H.items).flatMap((it) => it.glint.map((g) => g.mat)));
  H.root.traverse((n) => {
    if (!n.isMesh) return;
    for (const m of [].concat(n.material)) {
      if (!m.isMeshStandardMaterial || keep.has(m)) continue;
      m.roughness = Math.max(m.roughness, 0.8);
      m.metalness = Math.min(m.metalness, 0.15);
    }
  });
}
const THUMB = makeThumbs(H);
// 物件一律用 3D 模型拍的小图；介面功能键（声音、眼睛）才用线条图示
const IMG = (k) => { const key = k === 'torch' ? 'torch2' : k; return THUMB[key] ? `<img src="${THUMB[key]}" alt="">` : ICON[k]; };

const hemi = new THREE.HemisphereLight('#fff3e0', '#6b5a48', 0.7);
scene.add(hemi);
// 月光／阳光：从屋后照进窗户
const skyLight = new THREE.DirectionalLight('#8fa8ff', 0.4);
skyLight.position.set(7, 14, -14);
skyLight.target.position.set(0, 2, 0);
skyLight.castShadow = true;
skyLight.shadow.mapSize.set(1024, 1024);
Object.assign(skyLight.shadow.camera, { left: -9, right: 9, top: 10, bottom: -2, near: 1, far: 40 });
skyLight.shadow.bias = -0.0008;
scene.add(skyLight, skyLight.target);

// 手电筒：从观看者的位置照进屋里
const torch = new THREE.SpotLight('#fff1d6', 0, 0, 0.17, 0.5, 1);
torch.castShadow = true;
torch.shadow.mapSize.set(1024, 1024);
torch.shadow.bias = -0.0006;
torch.shadow.camera.near = 5;
scene.add(torch, torch.target);
torch.target.position.set(-3, 1, 0);

let composer = null, bloom = null;
function setupComposer() {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.4, 1.6);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
}

// ================= 画质 =================
const Q = { high: true };
function applyQuality() {
  const pr = Q.high ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  renderer.setPixelRatio(pr);
  skyLight.castShadow = Q.high;
  if (Q.high && !composer) setupComposer();
  resize();
  $('#qualityBtn').textContent = Q.high ? '画质：高' : '画质：省电';
}

// ================= 镜头取景 =================
const REGIONS = {
  all: { cx: 0, cy: 4.75, w: 13.8, h: 10.2, label: '全屋' },
  living: { cx: -3.2, cy: 1.45, w: 5.9, h: 3.2, label: '客厅' },
  stairs: { cx: 1.3, cy: 1.95, w: 4.4, h: 4.2, label: '楼梯' },
  kitchen: { cx: 4.6, cy: 1.5, w: 3.3, h: 3.2, label: '厨房' },
  bedroom: { cx: -3.3, cy: 4.85, w: 5.9, h: 3.2, label: '卧室' },
  study: { cx: 2.7, cy: 4.85, w: 6.6, h: 3.2, label: '楼上' },
};
const cam = { region: 'all', cur: null, compact: false };
let viewW = 1, viewH = 1, dockH = 0, topH = 0;

function frameFor(regionKey) {
  const r = REGIONS[regionKey];
  const availH = Math.max(120, viewH - dockH - topH);
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const aspect = viewW / viewH;
  const needH = Math.max((r.h * 1.06 * viewH) / availH, (r.w * 1.04) / aspect);
  const dist = needH / (2 * tanHalf);
  // 让屋子落在上方可用区域的正中间
  const shift = ((dockH - topH) / 2 / viewH) * needH;
  return { x: r.cx, y: r.cy - shift, dist, needH };
}

function resize() {
  viewW = window.innerWidth; viewH = window.innerHeight;
  renderer.setSize(viewW, viewH, false);
  camera.aspect = viewW / viewH;
  camera.updateProjectionMatrix();
  if (composer) { composer.setSize(viewW, viewH); }
  dockH = $('#dock').offsetHeight + 16;
  topH = $('#topbar').offsetHeight + 8;
  const all = frameFor('all');
  const pxPerUnit = viewH / all.needH;
  cam.compact = pxPerUnit < 44;
  document.body.classList.toggle('compact', cam.compact);
  renderRoomBar();
  if (!cam.cur) cam.cur = { ...frameFor(effectiveRegion()) };
}
function effectiveRegion() { return cam.region; }
function setRegion(key) { cam.region = key; renderRoomBar(); if (state.stage === 'hunt' && state.rerender) state.rerender(); }
function updateCamera(dt) {
  const tgt = frameFor(effectiveRegion());
  const k = 1 - Math.exp(-dt * 4);
  for (const p of ['x', 'y', 'dist']) cam.cur[p] += (tgt[p] - cam.cur[p]) * k;
  camera.position.set(cam.cur.x, cam.cur.y + cam.cur.dist * 0.07, cam.cur.dist + 2.5);
  camera.lookAt(cam.cur.x, cam.cur.y, 0);
  // 手电筒握在观看者手上，比眼睛低一点
  torch.position.set(camera.position.x + 1.2, camera.position.y - cam.cur.dist * 0.12, camera.position.z - 2);
  // 光圈大小固定在屋里约 1.5 格宽，不论镜头远近
  torch.angle = Math.atan((cam.region === 'all' ? 3.0 : 1.0) / torch.position.distanceTo(torch.target.position));
}

function renderRoomBar() {
  const bar = $('#roomBar');
  bar.hidden = !state.roomBar;
  if (bar.hidden) return;
  bar.innerHTML = Object.entries(REGIONS).map(([k, r]) => `<button data-room="${k}" class="${cam.region === k ? 'on' : ''}">${r.label}</button>`).join('');
  bar.querySelectorAll('button').forEach((b) => (b.onclick = () => { sfx.click(); setRegion(b.dataset.room); }));
}

// ================= 环境（灯、手电筒、火、天亮） =================
const env = { lights: 1, torch: 0, flames: 0, torch2: 0, dawn: 0 };      // 目标值
const envNow = { lights: 1, torch: 0, flames: 0, torch2: 0, dawn: 0 };   // 实际（平滑过渡）
const skyNightCol = new THREE.Color('#ffffff');

function applyEnv(dt) {
  for (const k of Object.keys(env)) {
    const speed = k === 'lights' ? 10 : k === 'dawn' ? 0.6 : 8;
    const d = env[k] - envNow[k];
    envNow[k] += Math.sign(d) * Math.min(Math.abs(d), dt * speed);
  }
  const L = envNow.lights, D = envNow.dawn;
  for (const l of H.lamps) { l.light.intensity = l.base * L; l.bulbMat.emissiveIntensity = 4 * L; }
  hemi.intensity = 0.03 + 0.62 * L + 0.75 * D;
  hemi.color.set(L > 0.5 ? '#fff3e0' : D > 0.3 ? '#ffe8c8' : '#4a5a8c');
  hemi.groundColor.set(L > 0.5 ? '#6b5a48' : '#151a2a');
  skyLight.color.set(D > 0.05 ? '#ffd9a0' : '#8fa8ff');
  skyLight.intensity = 0.45 + D * 3.2;
  skyLight.position.set(D > 0.05 ? 10 : 7, 6 + D * 8, -14);
  // 照在东西上的亮度固定（不随镜头远近变亮），白色东西才不会被照到过曝、冒光晕
  torch.intensity = TORCH_LUX * torch.position.distanceTo(torch.target.position) * envNow.torch;
  for (const f of H.flames) {
    f.group.visible = envNow.flames > 0.05 || (f.group === H.items.torch2.flame);
    f.light.intensity = f.base * envNow.flames * (0.85 + Math.sin(now() * 17 + f.base * 9) * 0.08 + Math.sin(now() * 7.3) * 0.07);
    if (f.group.userData.flame) {
      const fl = f.group.userData.flame, s = 1 + Math.sin(now() * 15 + f.base) * 0.06;
      fl.outer.scale.set(s, 2.4 * (2 - s), s);
    }
  }
  H.kettle.visible = envNow.flames > 0.5;
  const t2 = H.items.torch2;
  t2.light.intensity = 14 * envNow.torch2;
  if (envNow.torch2 > 0.5) t2.lens.material.color.set('#fff8e0').multiplyScalar(5); else t2.lens.material.color.set('#555');
  t2.halo.visible = envNow.torch2 > 0.5;
  // 天空：夜 → 天亮
  const skyMat = H.sky.material;
  if (D > 0.5 && skyMat.map !== H.skyDawn) { skyMat.map = H.skyDawn; skyMat.needsUpdate = true; }
  if (D <= 0.5 && skyMat.map !== H.skyNight) { skyMat.map = H.skyNight; skyMat.needsUpdate = true; }
  skyMat.color.copy(skyNightCol).multiplyScalar(0.6 + Math.abs(D - 0.5) * 0.8);
  H.sun.visible = D > 0.02;
  H.sun.position.y = 3 + D * 6.8;
  H.moon.visible = D < 0.6;
  scene.background.set(D > 0.5 ? '#9cc3e8' : '#05070f');
  // 反光的东西：手电筒照到才会亮（这是「会骗人的亮」）
  for (const it of Object.values(H.items)) {
    if (!it.glint.length) continue;
    const b = beamAt(it) * envNow.torch;
    for (const g of it.glint) g.mat.emissiveIntensity = g.k * b * (0.75 + 0.25 * Math.sin(now() * 6 + g.k));
  }
}

const _v = new THREE.Vector3(), _d = new THREE.Vector3(), _p = new THREE.Vector3();
function worldPos(it, out) { return it.focus ? out.copy(it.focus) : it.object.getWorldPosition(out); }
function beamAt(it) {
  worldPos(it, _p);
  _d.copy(torch.target.position).sub(torch.position).normalize();
  _v.copy(_p).sub(torch.position).normalize();
  const c = _d.dot(_v);
  const a = torch.angle;
  return THREE.MathUtils.smoothstep(c, Math.cos(a * 1.25), Math.cos(a * 0.55));
}

const SELF_LIT = new Set(['candle', 'fire', 'torch2', 'pelita']);
function canSee(it) {
  if (it.id === 'moon') return envNow.dawn < 0.6;
  if (it.id === 'sun') return envNow.dawn > 0.3;
  if (SELF_LIT.has(it.id)) return (it.id === 'torch2' ? envNow.torch2 : envNow.flames) > 0.5 || envNow.lights > 0.5;
  if (envNow.lights > 0.5 || envNow.dawn > 0.6) return true;
  return envNow.torch > 0.5 && beamAt(it) > 0.4;
}

// ================= 指针：瞄准与点选 =================
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2(0, 0);
let aimDirty = true, hasPointer = false;
const pickTargets = [H.root, H.moon, H.sun];

function toNdc(e) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
}
function firstSolidHit() {
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(pickTargets, true);
  return hits.find((h) => !h.object.userData.passThrough && h.object.visible) || null;
}
function updateAim() {
  if (!aimDirty) return;
  aimDirty = false;
  if (!hasPointer) {
    const f = frameFor(effectiveRegion());
    torch.target.position.lerp(_p.set(f.x, f.y, -1), 0.2);
    aimDirty = true;
    return;
  }
  const h = firstSolidHit();
  if (h) torch.target.position.copy(h.point);
  else {
    ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 2.5), _p);
    torch.target.position.copy(_p);
  }
}

let downAt = null;
canvas.addEventListener('pointerdown', (e) => { unlock(); hasPointer = true; toNdc(e); aimDirty = true; downAt = { x: e.clientX, y: e.clientY, t: now() }; });
canvas.addEventListener('pointermove', (e) => { hasPointer = true; toNdc(e); aimDirty = true; });
canvas.addEventListener('pointerup', (e) => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  downAt = null;
  if (moved < 14) { toNdc(e); updateAim(); tap(e.clientX, e.clientY); }
});

function itemOfMesh(o) {
  while (o) { if (o.userData.itemId) return o.userData.itemId; o = o.parent; }
  return null;
}
function allItems() { return [...Object.values(H.items), ...H.steps, ...H.toyMeshes]; }
function findItem(id) { return allItems().find((i) => i.id === id); }
function screenPos(it) {
  worldPos(it, _p); _p.project(camera);
  return { x: (_p.x + 1) / 2 * viewW, y: (1 - _p.y) / 2 * viewH };
}
function pick(x, y, candidates) {
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(pickTargets, true);
  for (const h of hits) {
    if (h.object.userData.passThrough) continue;
    const id = itemOfMesh(h.object);
    const it = id && candidates.find((c) => c.id === id);
    if (it) return it;
    break; // 被墙或家具挡住
  }
  // 小东西不好点：在 46px 内找最近的
  let best = null, bd = 46;
  for (const c of candidates) {
    const s = screenPos(c), d = Math.hypot(s.x - x, s.y - y);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

function tap(x, y) {
  // 看全屋时，先点哪个房间就推进到哪个房间（局部放大）
  if (state.zoomTap && cam.region === 'all') {
    const h = firstSolidHit();
    if (h) { sfx.click(); setRegion(regionAt(h.point)); }
    return;
  }
  const cands = state.targets ? state.targets() : [];
  if (!cands.length) return;
  const it = pick(x, y, cands);
  if (!it) return;
  if (!canSee(it)) {
    bubble(x, y, envNow.torch > 0.5 ? '照到它，才看得清' : '太暗了，看不清');
    sfx.soft();
    return;
  }
  state.onTap && state.onTap(it, x, y);
}

function bubble(x, y, text, kind = '') {
  const b = document.createElement('div');
  b.className = 'bubble ' + kind;
  b.textContent = text;
  b.style.left = x + 'px'; b.style.top = y + 'px';
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 1500);
}

// ================= 小动画 =================
const tweens = [];
function tween(dur, fn, done) { tweens.push({ t0: now(), dur, fn, done }); }
function runTweens() {
  const t = now();
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i], k = Math.min(1, (t - tw.t0) / tw.dur);
    tw.fn(k);
    if (k >= 1) { tweens.splice(i, 1); tw.done && tw.done(); }
  }
}
const ease = (k) => 1 - Math.pow(1 - k, 3);

// ================= 介面 =================
const dock = $('#dock'), modal = $('#modal');
function setDock({ kicker = '', title = '', text = '', body = '', actions = [] }) {
  dock.innerHTML = `
    ${kicker ? `<div class="kicker">${kicker}</div>` : ''}
    ${title ? `<h2>${title}</h2>` : ''}
    ${text ? `<p class="lead">${text}</p>` : ''}
    ${body}
    ${actions.length ? `<div class="actions">${actions.map((a, i) => `<button class="btn ${a.primary ? 'primary' : ''} ${a.big ? 'big' : ''}" data-a="${i}">${a.icon ? `<span class="ic">${IMG(a.icon)}</span>` : ''}<span>${a.label}</span></button>`).join('')}</div>` : ''}`;
  dock.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => { unlock(); sfx.click(); actions[+b.dataset.a].onClick(); }));
  requestAnimationFrame(() => { const h = dock.offsetHeight + 16; if (Math.abs(h - dockH) > 2) { dockH = h; } });
}
function openModal(html, cls = '') {
  // 同一张卡重画时（例如分类时每点一下）只换内容，不重播出场动画
  const sheet = !modal.hidden && modal.querySelector('.sheet');
  if (sheet && modal.className === 'modal ' + cls) { sheet.innerHTML = html; return modal; }
  modal.className = 'modal ' + cls;
  modal.innerHTML = `<div class="sheet">${html}</div>`;
  modal.hidden = false;
  return modal;
}
function closeModal() { modal.hidden = true; modal.innerHTML = ''; }

function stageDots(act) {
  $('#actLabel').textContent = act === 1 ? '第一幕 · 停电了' : act === 2 ? '第二幕 · 谁会自己发光？' : '';
}

// ================= 课程流程 =================
const state = { stage: 'intro', targets: null, onTap: null, roomBar: false, zoomTap: false, times: { dark: {}, bright: {} }, round: 'dark', prompt: '' };

const TASKS = [
  { id: 'walk', icon: 'toys', name: '收玩具，走到门口' },
  { id: 'climb', icon: 'stairs', name: '一级一级上楼梯' },
  { id: 'read', icon: 'book', name: '看书上的图' },
];
const PROMPTS = {
  intro: '先问全班：晚上停电的时候，你们会怎么做？',
  cut: '停电了。请学生说说：现在看得见什么？看不见什么？',
  dark: '手电筒照不到的地方，你看得见吗？为什么？',
  bright: '来电以后，做同样的事，有什么不一样？',
  compare: '停电的时候，做什么事最难？在家里试过吗？',
  hunt: '这些东西都亮亮的。它们亮的方法一样吗？',
  sort: '先请全班举手预测，再按「全黑测验」。',
  blackout: '关掉手电筒以前，先猜：哪些还会看得见？',
  moon: '月亮的光从哪里来？白天有时也看得见月亮，那时候亮吗？',
  dawn: '课室里有哪些光源？请学生指出来。',
};
function setPrompt(key) { state.prompt = PROMPTS[key] || ''; $('#promptText').textContent = state.prompt; }

// ---------- 开场 ----------
function stageIntro() {
  state.stage = 'intro'; stageDots(0); setPrompt('intro');
  Object.assign(env, { lights: 1, torch: 0, flames: 0, torch2: 0, dawn: 0 });
  state.targets = null; state.roomBar = false; setRegion('all');
  setDock({});
  dock.hidden = true;
  openModal(`
    <div class="title-card">
      <div class="title-icon">${IMG('torch2')}</div>
      <h1>光的小探险</h1>
      <p class="lead">停电的晚上，我们怎样才看得见？</p>
      <button class="btn primary big" id="startBtn"><span>开始</span></button>
      <p class="tiny">老师投影全班用，或学生自己用都可以。约 15 分钟一幕。</p>
    </div>`, 'center');
  $('#startBtn').onclick = () => { unlock(); sfx.click(); closeModal(); dock.hidden = false; stageTour(); };
}

// ---------- 第一幕 ----------
function stageTour() {
  state.stage = 'tour'; stageDots(1); setPrompt('intro');
  Object.assign(env, { lights: 1, torch: 0, flames: 0, torch2: 0, dawn: 0 });
  resetAct1Objects();
  state.targets = null; state.roomBar = true; setRegion('all'); renderRoomBar();
  crickets(false);
  setDock({
    kicker: '第一幕', title: '这是你的家', text: '楼下有客厅、楼梯和厨房，楼上有卧室和书房。',
    actions: [{ label: '天黑了', primary: true, onClick: stageCut }],
  });
}

function stageCut() {
  state.stage = 'cut'; setPrompt('cut');
  setDock({ kicker: '第一幕', title: '……' });
  // 灯闪两下，然后停电
  const seq = [[0, 0.2], [120, 1], [260, 0.1], [380, 1], [700, 0]];
  seq.forEach(([ms, v]) => setTimeout(() => { env.lights = v; envNow.lights = v; }, ms));
  setTimeout(() => {
    sfx.powerOff(); crickets(true);
    setDock({
      kicker: '第一幕', title: '停电了！', text: '你看得见家里的东西吗？',
      actions: [
        { label: '看得见', onClick: () => cutAnswer(false) },
        { label: '看不见', onClick: () => cutAnswer(true) },
      ],
    });
  }, 760);
}
function cutAnswer(ok) {
  const msg = ok ? '对！没有光，我们就看不见。' : '真的吗？沙发在哪里？楼梯在哪里？好像都看不清楚呢。';
  setDock({
    kicker: '第一幕', title: ok ? '看不见！' : '再看看……', text: msg + '<br>拿出手电筒吧。',
    actions: [{ label: '打开手电筒', icon: 'torch', primary: true, big: true, onClick: () => { sfx.torch(); env.torch = 1; startRound('dark'); } }],
  });
}

function resetAct1Objects() {
  H.doorPivot.rotation.y = 0;
  for (const s of H.steps) { if (s.num) s.num.visible = false; }
  for (const t of H.toyMeshes) { t.object.visible = false; t.object.scale.setScalar(TOY_SCALE); }
  for (const s of H.steps) { if (s.foot) s.foot.visible = false; }
  climb.on = false;
}

function placeToys() {
  const slots = [...H.toySlots].sort(() => Math.random() - 0.5).slice(0, 3);
  H.toyMeshes.forEach((t, i) => {
    t.object.visible = true; t.object.scale.setScalar(TOY_SCALE);
    t.object.position.set(slots[i][0], 0, slots[i][1]);
    t.object.rotation.y = Math.random() * Math.PI * 2;
    t.done = false;
  });
}

const round = { kind: 'dark', idx: 0, t0: 0, picture: 'cat', picturesUsed: [] };
function startRound(kind) {
  round.kind = kind; round.idx = 0;
  state.stage = kind; setPrompt(kind);
  resetAct1Objects(); placeToys();
  const pics = Object.keys(T.PICTURES).filter((p) => !round.picturesUsed.includes(p));
  round.picture = pics[Math.floor(Math.random() * pics.length)];
  round.picturesUsed.push(round.picture);
  H.items.book.pageMat.map = T.bookPages(round.picture);
  H.items.book.pageMat.needsUpdate = true;
  startTask();
}

function taskChips() {
  return `<div class="chips">${TASKS.map((t, i) => `<div class="chip ${i < round.idx ? 'done' : i === round.idx ? 'now' : ''}"><span class="ic">${IMG(t.icon)}</span><span>${t.name}</span>${i < round.idx ? '<b class="ok">✓</b>' : ''}</div>`).join('')}</div>`;
}
function roundTitle() { return round.kind === 'dark' ? '用手电筒完成三件事' : '开着灯，再做一次'; }

function startTask() {
  const task = TASKS[round.idx];
  round.t0 = now();
  state.roomBar = true;
  if (task.id === 'walk') {
    setRegion('living');
    let left = 3;
    const render = () => setDock({ kicker: round.kind === 'dark' ? '停电了 · 只有手电筒' : '来电了 · 灯亮着', title: roundTitle(), body: taskChips() + `<p class="lead">${left > 0 ? `地上有 <b>3</b> 个玩具，会把你绊倒。把它们找出来，点一下收好。<span class="count">${3 - left}/3</span>` : '玩具都收好了。现在走到<b>门口</b>：点一下门。'}</p>` });
    render();
    state.targets = () => (left > 0 ? H.toyMeshes.filter((t) => !t.done) : [H.items.door]);
    state.onTap = (it) => {
      if (it.id === 'door') {
        sfx.door();
        tween(0.6, (k) => (H.doorPivot.rotation.y = -1.1 * ease(k)));
        return finishTask();
      }
      it.done = true; left--; sfx.collect(3 - left);
      const o = it.object, y0 = o.position.y;
      tween(0.45, (k) => { o.position.y = y0 + Math.sin(k * Math.PI) * 0.6; o.scale.setScalar(TOY_SCALE * (1 - ease(k))); }, () => (o.visible = false));
      render();
    };
  } else if (task.id === 'climb') {
    setRegion('stairs');
    const n = H.steps.length;
    Object.assign(climb, { on: false, at: -1, wait: 0, stuck: 0 });
    const render = () => setDock({ kicker: round.kind === 'dark' ? '停电了 · 只有手电筒' : '来电了 · 灯亮着', title: roundTitle(), body: taskChips() + `<p class="lead">${!climb.on && climb.at < 0 ? '点一下<b>最下面</b>那一级楼梯，开始走上楼。' : round.kind === 'dark' ? '用手电筒<b>照着上面一级</b>，脚才敢踩上去。' : '灯亮着，看得清清楚楚，一直走上去！'}<span class="count">${climb.at + 1}/${n}</span></p>` });
    climb.render = render;
    render();
    state.targets = () => (climb.at < 0 ? [H.steps[0]] : []);
    state.onTap = () => { climb.on = true; climb.at = 0; showFoot(H.steps[0]); sfx.step(0); render(); };
  } else {
    setRegion('bedroom');
    setDock({ kicker: round.kind === 'dark' ? '停电了 · 只有手电筒' : '来电了 · 灯亮着', title: roundTitle(), body: taskChips() + '<p class="lead">楼上卧室的<b>书桌</b>上有一本书。找到它，点一下，看看书上画了什么。</p>' });
    state.targets = () => [H.items.book];
    state.onTap = () => openBook();
  }
}

const TOY_SCALE = 1.5;
const climb = { on: false, at: -1, wait: 0, stuck: 0, render: null };
// 脚印：照到上面一级，才往上走一步
function updateClimb(dt) {
  if (!climb.on) return;
  const n = H.steps.length;
  const nxt = H.steps[climb.at + 1];
  if (!nxt) return;
  if (canSee(nxt)) {
    climb.wait += dt; climb.stuck = 0;
    if (climb.wait > (round.kind === 'dark' ? 0.5 : 0.32)) {
      climb.wait = 0; climb.at++;
      showFoot(nxt); sfx.step(climb.at); climb.render();
      if (climb.at === n - 1) { climb.on = false; finishTask(); }
    }
  } else {
    climb.wait = 0; climb.stuck += dt;
    if (climb.stuck > 2.2) { climb.stuck = 0; const s = screenPos(H.steps[climb.at]); bubble(s.x, s.y, '看不见上面，不敢走'); }
  }
}
const footTex = T.footprints();
function showFoot(step) {
  if (!step.foot) {
    step.foot = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ map: footTex, transparent: true, depthWrite: false }));
    step.foot.rotation.x = -Math.PI / 2;
    step.foot.position.copy(step.top).add(new THREE.Vector3(0, 0.02, 0.05));
    scene.add(step.foot);
  }
  step.foot.visible = true;
  tween(0.25, (k) => step.foot.scale.setScalar(0.5 + 0.5 * ease(k)));
}

function openBook() {
  const opts = Object.keys(T.PICTURES).sort(() => Math.random() - 0.5);
  const page = H.items.book.pageMat.map.image.toDataURL();
  openModal(`
    <h2>书上画的是什么？</h2>
    <div class="book-view ${round.kind === 'dark' ? 'torchlit' : ''}"><img src="${page}" alt="打开的书"></div>
    <div class="pic-choices">${opts.map((k) => `<button class="pic" data-k="${k}"><img src="${T.pictureDataURL(k)}" alt=""><span>${T.PICTURES[k].label}</span></button>`).join('')}</div>`);
  modal.querySelectorAll('.pic').forEach((b) => (b.onclick = () => {
    if (b.dataset.k === round.picture) { sfx.success(); closeModal(); finishTask(); }
    else { sfx.soft(); b.classList.add('nope'); setTimeout(() => b.classList.remove('nope'), 500); }
  }));
}

function finishTask() {
  const task = TASKS[round.idx];
  state.times[round.kind][task.id] = Math.max(1, Math.round(now() - round.t0));
  state.targets = null;
  round.idx++;
  if (round.idx < TASKS.length) return setTimeout(startTask, 700);
  setTimeout(() => {
    if (round.kind === 'dark') {
      setRegion('all');
      setDock({
        kicker: '第一幕', title: '三件事都做完了！', text: '咦，好像来电了……',
        actions: [{ label: '来电了', primary: true, onClick: () => { sfx.powerOn(); crickets(false); Object.assign(env, { lights: 1, torch: 0 }); startRound('bright'); } }],
      });
    } else stageCompare();
  }, 800);
}

function stageCompare() {
  state.stage = 'compare'; setPrompt('compare'); setRegion('all');
  state.targets = null;
  const max = Math.max(...TASKS.map((t) => Math.max(state.times.dark[t.id] || 1, state.times.bright[t.id] || 1)));
  const bar = (v, cls) => `<div class="bar ${cls}"><i style="width:${Math.max(8, (v / max) * 100)}%"></i><b>${v} 秒</b></div>`;
  setDock({ kicker: '第一幕', title: '比一比' });
  openModal(`
    <h2>亮的时候 和 暗的时候</h2>
    <div class="compare">
      <div class="crow head"><span></span><span class="tag dark">暗的时候</span><span class="tag light">亮的时候</span></div>
      ${TASKS.map((t) => `<div class="crow"><span class="cname"><span class="ic">${IMG(t.icon)}</span>${t.name}</span>${bar(state.times.dark[t.id] || 0, 'dark')}${bar(state.times.bright[t.id] || 0, 'light')}</div>`).join('')}
    </div>
    <div id="cq"></div>`);
  askQ1();
}
function askQ1() {
  const box = $('#cq');
  box.innerHTML = `<p class="q">什么时候做事比较容易？</p><div class="actions"><button class="btn" data-v="light">亮的时候</button><button class="btn" data-v="dark">暗的时候</button></div>`;
  box.querySelectorAll('button').forEach((b) => (b.onclick = () => {
    if (b.dataset.v === 'light') { sfx.collect(2); askQ2(); }
    else { sfx.soft(); bubbleIn(box, '想一想：暗的时候，你看得清楚吗？'); }
  }));
}
function askQ2() {
  const box = $('#cq');
  const opts = [['see', '有光，我们才看得见'], ['hot', '亮的时候比较热'], ['sleep', '暗的时候想睡觉']].sort(() => Math.random() - 0.5);
  box.innerHTML = `<p class="q">为什么亮的时候比较容易？</p><div class="actions col">${opts.map(([v, l]) => `<button class="btn" data-v="${v}">${l}</button>`).join('')}</div>`;
  box.querySelectorAll('button').forEach((b) => (b.onclick = () => {
    if (b.dataset.v === 'see') {
      sfx.success();
      box.innerHTML = `<div class="sticker"><span class="ic">${ICON.eye}</span><b>光让我们看得见！</b></div><div class="actions"><button class="btn primary" id="toAct2">继续</button></div>`;
      $('#toAct2').onclick = () => { sfx.click(); closeModal(); stageEyeRest(); };
    } else { sfx.soft(); bubbleIn(box, '再想想：暗的时候，为什么会慢？'); }
  }));
}
function bubbleIn(el, text) {
  let n = el.querySelector('.inline-hint');
  if (!n) { n = document.createElement('p'); n.className = 'inline-hint'; el.appendChild(n); }
  n.textContent = text;
}

// ---------- 眼睛休息（5.1.4） ----------
function stageEyeRest() {
  state.stage = 'eyerest';
  setDock({ title: '休息一下' });
  openModal(`
    <div class="eye-rest">
      <div class="ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="track"/><circle cx="60" cy="60" r="52" class="prog" id="eyeRing"/></svg><span class="ic">${ICON.eye}</span><b id="eyeNum">10</b></div>
      <h2>眼睛累了吗？</h2>
      <p class="lead">一直看屏幕，眼睛会累、会不舒服。<br>看看窗外<b>远远的地方</b>，数到 10。</p>
      <button class="btn primary" id="eyeDone" disabled>眼睛休息好了</button>
    </div>`, 'center');
  let n = 10;
  const ringEl = $('#eyeRing');
  ringEl.style.strokeDashoffset = 0;
  const iv = setInterval(() => {
    n--; sfx.tick();
    $('#eyeNum').textContent = Math.max(0, n);
    ringEl.style.strokeDashoffset = (327 * (10 - n)) / 10;
    if (n <= 0) { clearInterval(iv); $('#eyeDone').disabled = false; }
  }, 1000);
  state.cancel = () => clearInterval(iv);
  $('#eyeDone').onclick = () => { sfx.click(); clearInterval(iv); closeModal(); stageAct2(); };
}

// ---------- 第二幕 ----------
const THINGS = {
  candle: { name: '蜡烛', self: true, why: '蜡烛的火，自己会发光。' },
  fire: { name: '炉子的火', self: true, why: '火，自己会发光。' },
  torch2: { name: '手电筒', self: true, why: '打开的手电筒，自己会发光。' },
  pelita: { name: '油灯', sub: 'pelita', self: true, why: '油灯的火，自己会发光。' },
  mirror: { name: '镜子', self: false, why: '手电筒照着它，它才亮。' },
  spoon: { name: '汤匙', self: false, why: '手电筒照着它，它才亮。' },
  bag: { name: '书包反光条', self: false, why: '手电筒照着它，它才亮。' },
  cat: { name: '猫的眼睛', self: false, why: '手电筒照着它，它才亮。' },
  moon: { name: '月亮', self: false, why: '太阳照着它，它才亮。' },
};
const HUNT = Object.keys(THINGS);
const a2 = { found: new Set(), guess: {}, idleAt: 0 };

function stageAct2() {
  state.stage = 'a2intro'; stageDots(2); setPrompt('hunt'); state.zoomTap = false;
  closeModal();
  a2.found = new Set(); a2.guess = {};
  resetAct1Objects();
  H.doorPivot.rotation.y = 0;
  Object.assign(env, { lights: 1, torch: 0, flames: 0, torch2: 0, dawn: 0 });
  setRegion('all'); state.roomBar = true; state.targets = null;
  setDock({ kicker: '第二幕', title: '晚上，又停电了', text: '这一次，家里的人点了<b>蜡烛</b>和<b>油灯</b>，炉子上在煮开水，架子上放着一支打开的<b>手电筒</b>。',
    actions: [{ label: '停电', primary: true, onClick: () => {
      env.lights = 0; envNow.lights = 0; sfx.powerOff(); crickets(true);
      setTimeout(() => { Object.assign(env, { flames: 1, torch2: 1 }); }, 600);
      setTimeout(() => { sfx.torch(); env.torch = 1; stageHunt(); }, 1500);
    } }] });
}

function huntTray() {
  return `<div class="tray">${HUNT.map((k) => `<span class="slot ${a2.found.has(k) ? 'got' : ''}" title="${a2.found.has(k) ? THINGS[k].name : '？'}">${a2.found.has(k) ? IMG(k) : '<i>？</i>'}</span>`).join('')}</div>`;
}
function stageHunt() {
  state.stage = 'hunt'; setPrompt('hunt');
  state.zoomTap = true; setRegion('all');
  a2.idleAt = now();
  const render = () => setDock({
    kicker: '第二幕', title: '亮亮的东西在哪里？',
    text: `家里有 <b>9</b> 样东西看起来亮亮的。${cam.region === 'all' ? '先点一个<b>房间</b>，走进去看看。' : '用手电筒照一照，找到就点一下。'}<span class="count">${a2.found.size}/9</span>`,
    body: huntTray(),
    actions: a2.found.size === 9 ? [{ label: '下一步：猜一猜', primary: true, onClick: stageSort }] : [],
  });
  render();
  state.rerender = render;
  state.targets = () => HUNT.filter((k) => !a2.found.has(k)).map((k) => H.items[k]);
  state.onTap = (it, x, y) => {
    a2.found.add(it.id); a2.idleAt = now();
    sfx.collect(a2.found.size);
    bubble(x, y, THINGS[it.id].name, 'good');
    render();
    if (a2.found.size === 9) { state.targets = null; state.zoomTap = false; setRegion('all'); }
  };
}

// 一次只问一样东西：东西放大，两个大按钮，点了就下一样
function stageSort() {
  state.stage = 'sort'; setPrompt('sort'); state.zoomTap = false;
  state.targets = null;
  setDock({ kicker: '第二幕', title: '猜一猜' });
  a2.guess = {};
  const order = [...HUNT].sort(() => Math.random() - 0.5);
  let i = 0;
  const dots = () => `<div class="dots">${order.map((_, j) => `<i class="${j < i ? 'done' : j === i ? 'now' : ''}"></i>`).join('')}</div>`;
  const ask = () => {
    if (i >= order.length) return summary();
    const k = order[i];
    openModal(`
      <h2>它，自己会发光吗？</h2>
      ${dots()}
      <div class="one" key="${k}"><div class="one-pic">${IMG(k)}</div><b>${THINGS[k].name}</b></div>
      <div class="choose">
        <button class="btn big choice yes" data-v="1"><span class="glow-dot"></span>会自己发光</button>
        <button class="btn big choice no" data-v="0"><span class="dark-dot"></span>不会自己发光</button>
      </div>`, 'sort');
    const one = modal.querySelector('.one'); one.classList.remove('in'); void one.offsetWidth; one.classList.add('in');
    modal.querySelectorAll('.choice').forEach((b) => (b.onclick = () => {
      sfx.collect(i); a2.guess[k] = b.dataset.v === '1'; i++; ask();
    }));
  };
  const summary = () => {
    const row = (v) => HUNT.filter((k) => a2.guess[k] === v).map((k) => `<span class="mini">${IMG(k)}<small>${THINGS[k].name}</small></span>`).join('') || '<small class="tiny">（没有）</small>';
    openModal(`
      <h2>你的猜测</h2>
      <div class="guess-row yes"><h3>会自己发光</h3><div>${row(true)}</div></div>
      <div class="guess-row no"><h3>不会自己发光</h3><div>${row(false)}</div></div>
      <div class="actions"><button class="btn" id="reguess">重新猜</button><button class="btn primary big" id="toBlack">用「全黑测验」检查</button></div>`, 'sort');
    $('#reguess').onclick = () => { sfx.click(); a2.guess = {}; i = 0; ask(); };
    $('#toBlack').onclick = () => { sfx.click(); closeModal(); stageBlackout(); };
  };
  ask();
}

function stageBlackout() {
  state.stage = 'blackout'; setPrompt('blackout');
  setRegion('all');
  setDock({ kicker: '第二幕', title: '全黑测验', text: '关掉手电筒。还看得见的，才是<b>自己会发光</b>的。',
    actions: [{ label: '关掉手电筒', icon: 'torch', primary: true, big: true, onClick: countdown }] });
}
function countdown() {
  setDock({ kicker: '第二幕', title: '全黑测验', text: '准备……' });
  const big = document.createElement('div'); big.className = 'countdown'; document.body.appendChild(big);
  let n = 3;
  const step = () => {
    if (n === 0) {
      big.remove(); sfx.torch(); env.torch = 0;
      setTimeout(() => setDock({ kicker: '第二幕', title: '看一看', text: '现在，还看得见哪些东西？', actions: [{ label: '看结果', primary: true, onClick: stageCheck }] }), 1800);
      return;
    }
    big.textContent = n; big.classList.remove('pop'); void big.offsetWidth; big.classList.add('pop'); sfx.tick();
    n--; setTimeout(step, 850);
  };
  step();
}

function stageCheck() {
  state.stage = 'check'; setPrompt('blackout');
  const visible = HUNT.filter((k) => THINGS[k].self || k === 'moon');
  const gone = HUNT.filter((k) => !visible.includes(k));
  const right = HUNT.filter((k) => k !== 'moon' && a2.guess[k] === THINGS[k].self).length;
  const card = (k) => `<div class="rcard ${k === 'moon' ? 'mystery' : a2.guess[k] === THINGS[k].self ? 'right' : 'wrong'}"><span class="ic">${IMG(k)}</span><b>${THINGS[k].name}</b><small>${k === 'moon' ? '咦？' : THINGS[k].why}</small></div>`;
  setDock({ kicker: '第二幕', title: '结果' });
  openModal(`
    <h2>全黑的时候……</h2>
    <div class="result-cols">
      <div><h3 class="tag light">还看得见</h3>${visible.map(card).join('')}</div>
      <div><h3 class="tag dark">看不见了</h3>${gone.map(card).join('')}</div>
    </div>
    <p class="lead center">你猜对了 <b>${right}</b> 个（月亮先不算）。</p>
    <div class="moon-q"><p class="q">月亮还亮着。月亮是自己会发光的吗？</p>
      <div class="actions"><button class="btn" data-m="y">是</button><button class="btn" data-m="n">不是</button><button class="btn" data-m="u">不知道</button></div></div>`);
  modal.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => { sfx.click(); stageMoon(b.dataset.m); }));
}

// 月亮的秘密：先看一段解说动画，再自己动手「挡住太阳的光」
const MOON_SCENES = [
  ['s1', '太阳自己会发光。它的光，照得很远很远。'],
  ['s2', '月亮自己不会发光。它像一颗很大很大的石头球。'],
  ['s3', '太阳的光照到月亮，月亮就亮了起来。'],
  ['s4', '月亮上的光，再照到我们这里，我们就看见亮亮的月亮。'],
  ['s5', '就像镜子：手电筒照着它，它才亮。月亮的「手电筒」，就是太阳！'],
];
function moonSVG() {
  const stars = Array.from({ length: 46 }, (_, i) => `<circle cx="${(i * 137) % 640}" cy="${(i * 71) % 320}" r="${(i % 3) * 0.6 + 0.6}" fill="#fff" opacity=".55"/>`).join('');
  return `
  <svg viewBox="0 0 640 320" role="img" aria-label="太阳、月亮和地球">
    <defs>
      <radialGradient id="sg"><stop offset="0" stop-color="#fff6c8"/><stop offset=".45" stop-color="#ffc94a"/><stop offset="1" stop-color="#ff9a2e" stop-opacity="0"/></radialGradient>
      <linearGradient id="bm1" x1="0" x2="1"><stop offset="0" stop-color="#ffe9a0" stop-opacity=".75"/><stop offset="1" stop-color="#ffe9a0" stop-opacity=".2"/></linearGradient>
      <linearGradient id="bm2" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff3c4" stop-opacity=".55"/><stop offset="1" stop-color="#fff3c4" stop-opacity=".12"/></linearGradient>
      <radialGradient id="moonLit" cx=".35" cy=".45"><stop offset="0" stop-color="#fffdf2"/><stop offset=".7" stop-color="#ece8d6"/><stop offset="1" stop-color="#bdb8a4"/></radialGradient>
      <radialGradient id="earthG" cx=".4" cy=".35"><stop offset="0" stop-color="#7cc4ff"/><stop offset="1" stop-color="#1d5fa8"/></radialGradient>
    </defs>
    <rect width="640" height="320" rx="20" fill="#0b1230"/>${stars}
    <g class="sunrays">${Array.from({ length: 12 }, (_, i) => `<line x1="95" y1="160" x2="${95 + Math.cos(i * Math.PI / 6) * 120}" y2="${160 + Math.sin(i * Math.PI / 6) * 120}" stroke="#ffd36b" stroke-width="5" stroke-linecap="round" stroke-dasharray="10 14"/>`).join('')}</g>
    <polygon class="beam1" points="135,135 470,70 470,130 135,185" fill="url(#bm1)"/>
    <polygon class="beam2" points="482,118 520,118 545,232 455,232" fill="url(#bm2)"/>
    <circle cx="95" cy="160" r="95" fill="url(#sg)"/><circle class="sun" cx="95" cy="160" r="50" fill="#ffd34d"/>
    <text x="95" y="300" class="lbl sunl" text-anchor="middle">太阳</text>
    <g class="moon">
      <circle class="moon-dark" cx="500" cy="95" r="34" fill="#3b3f4f"/>
      <circle class="moon-lit" cx="500" cy="95" r="34" fill="url(#moonLit)"/>
      <circle cx="490" cy="85" r="6" fill="#000" opacity=".12"/><circle cx="512" cy="106" r="8" fill="#000" opacity=".12"/>
    </g>
    <text x="580" y="100" class="lbl moonl" text-anchor="middle">月亮</text>
    <g class="earth"><circle cx="500" cy="268" r="40" fill="url(#earthG)"/><path d="M478 250c8-6 18-4 22 2s-4 12 6 16-2 14-14 10-18-6-18-14 0-10 4-14z" fill="#5fae5a"/><path d="M490 230l10-9 10 9v9h-20z" fill="#f2e3c6" stroke="#2b2540" stroke-width="1.5"/></g>
    <text x="580" y="290" class="lbl" text-anchor="middle">我们</text>
    <rect class="board" x="270" y="30" width="30" height="190" rx="6" fill="#5b4636"/>
    <g class="mirror-panel">
      <rect x="150" y="40" width="340" height="240" rx="18" fill="#fff6e5"/>
      <rect x="180" y="150" width="70" height="24" rx="6" fill="#d0452f"/><path d="M250 146h14l8-6v44l-8-6h-14z" fill="#2b2b2b"/>
      <polygon points="272,150 400,110 400,200 272,176" fill="#ffe9a0" opacity=".75"/>
      <rect x="400" y="80" width="40" height="150" rx="8" fill="#c7a36a"/><rect x="408" y="90" width="24" height="130" rx="4" fill="#e9f3ff"/>
      <text x="215" y="215" class="lbl dark" text-anchor="middle">手电筒</text><text x="420" y="260" class="lbl dark" text-anchor="middle">镜子</text>
    </g>
  </svg>`;
}
function stageMoon(answer) {
  state.stage = 'moon'; setPrompt('moon');
  const intro = answer === 'n' ? '你想得很仔细！看看为什么。' : '先看一段动画。';
  setDock({ kicker: '第二幕', title: '月亮的秘密' });
  openModal(`
    <h2>月亮为什么会亮？</h2>
    <p class="lead">${intro}</p>
    <div class="space s1" id="space">${moonSVG()}<p class="caption" id="caption"></p></div>
    <div class="player"><button class="btn" id="playBtn">⏸ 暂停</button><button class="btn" id="replayBtn">↺ 重看</button><span class="scene-dots" id="sceneDots"></span></div>
    <div id="tryBox"></div>`, 'moon');
  const space = $('#space');
  let idx = 0, playing = true, timer = null;
  const show = (i) => {
    idx = i;
    space.className = 'space ' + MOON_SCENES[i][0];
    $('#caption').textContent = MOON_SCENES[i][1];
    $('#sceneDots').innerHTML = MOON_SCENES.map((_, j) => `<i class="${j === i ? 'now' : j < i ? 'done' : ''}"></i>`).join('');
    if (i >= 2) offerTry();
  };
  const next = () => {
    clearTimeout(timer);
    if (!playing) return;
    timer = setTimeout(() => {
      if (idx < MOON_SCENES.length - 1) { show(idx + 1); sfx.tick(); next(); }
      else { playing = false; $('#playBtn').textContent = '▶ 播放'; offerTry(); }
    }, 5200);
  };
  const offerTry = () => {
    if ($('#blockBtn')) return;
    $('#tryBox').innerHTML = `<p class="q">自己试试看：</p><div class="actions"><button class="btn primary" id="blockBtn">挡住太阳的光</button></div><p class="lead" id="moonText"></p>`;
    $('#blockBtn').onclick = () => {
      sfx.click(); clearTimeout(timer); playing = false; $('#playBtn').textContent = '▶ 播放';
      const blocked = !space.classList.contains('blocked');
      space.className = 'space s4' + (blocked ? ' blocked' : '');
      $('#caption').textContent = blocked ? '太阳的光照不到月亮，月亮就暗了。' : MOON_SCENES[3][1];
      $('#blockBtn').textContent = blocked ? '拿开木板' : '挡住太阳的光';
      $('#moonText').innerHTML = blocked ? '所以，月亮<b>不是</b>自己会发光的。' : '';
      if (blocked && !$('#moonDone')) {
        const b = document.createElement('button'); b.className = 'btn primary'; b.id = 'moonDone'; b.textContent = '原来如此';
        b.onclick = () => { sfx.success(); clearTimeout(timer); closeModal(); stageDawn(); };
        $('#tryBox .actions').appendChild(b);
      }
    };
  };
  $('#playBtn').onclick = () => {
    sfx.click(); playing = !playing;
    $('#playBtn').textContent = playing ? '⏸ 暂停' : '▶ 播放';
    if (playing) { if (idx >= MOON_SCENES.length - 1) show(0); next(); } else clearTimeout(timer);
  };
  $('#replayBtn').onclick = () => { sfx.click(); playing = true; $('#playBtn').textContent = '⏸ 暂停'; show(0); next(); };
  state.cancel = () => clearTimeout(timer);
  show(0); next();
}

function stageDawn() {
  state.stage = 'dawn'; setPrompt('dawn');
  setRegion('all');
  Object.assign(env, { flames: 0, torch2: 0, torch: 0, dawn: 1 });
  crickets(false); sfx.dawn();
  setTimeout(() => {
    setDock({ kicker: '第二幕', title: '天亮了！', text: '是什么让天变亮了？',
      actions: [['sun', '太阳'], ['moon', '月亮'], ['torch2', '手电筒']].map(([k, l]) => ({ label: l, icon: k, onClick: () => {
        if (k === 'sun') { sfx.success(); stageEnd(); }
        else { sfx.soft(); setDock({ kicker: '第二幕', title: '再看看窗外', text: '窗外升起来的是什么？', actions: [{ label: '再选一次', onClick: stageDawn }] }); }
      } })) });
  }, 2600);
}

function stageEnd() {
  state.stage = 'end';
  const srcs = ['sun', 'candle', 'fire', 'torch2', 'pelita'];
  const names = { sun: '太阳', ...Object.fromEntries(Object.entries(THINGS).map(([k, v]) => [k, v.name])) };
  setDock({ title: '完成！' });
  openModal(`
    <div class="end">
      <h2>你找到的光源</h2>
      <p class="lead">自己会发光的东西，叫做<b>光源</b>。太阳是最大的光源。</p>
      <div class="end-row">${srcs.map((k) => `<div class="end-card src"><span class="ic">${IMG(k)}</span><b>${names[k]}</b></div>`).join('')}</div>
      <h3>亮亮的，但不是光源</h3>
      <div class="end-row">${['mirror', 'spoon', 'bag', 'cat', 'moon'].map((k) => `<div class="end-card"><span class="ic">${IMG(k)}</span><b>${names[k]}</b></div>`).join('')}</div>
      <p class="lead">回家找一找：家里还有什么<b>光源</b>？</p>
      <div class="actions"><button class="btn" id="againAct2">再玩第二幕</button><button class="btn primary" id="restart">从头再玩</button></div>
    </div>`);
  $('#againAct2').onclick = () => { sfx.click(); stageAct2(); };
  $('#restart').onclick = () => { sfx.click(); closeModal(); state.times = { dark: {}, bright: {} }; round.picturesUsed = []; stageTour(); };
}

// ================= 老师控制台 =================
const drawer = $('#teacher');
function openTeacher(open) { drawer.classList.toggle('open', open); drawer.setAttribute('aria-hidden', String(!open)); $('#scrim').hidden = !open; }
$('#teacherBtn').onclick = () => { sfx.click(); openTeacher(true); };
$('#teacherClose').onclick = () => openTeacher(false);
$('#scrim').onclick = () => openTeacher(false);
const JUMPS = {
  act1: () => { closeModal(); dock.hidden = false; stageTour(); },
  compare: () => {
    closeModal(); dock.hidden = false;
    for (const t of TASKS) { state.times.dark[t.id] ||= 20; state.times.bright[t.id] ||= 6; }
    Object.assign(env, { lights: 1, torch: 0 }); crickets(false); stageCompare();
  },
  act2: () => { dock.hidden = false; stageAct2(); },
  blackout: () => {
    closeModal(); dock.hidden = false; stageDots(2);
    Object.assign(env, { lights: 0, torch: 1, flames: 1, torch2: 1, dawn: 0 }); crickets(true);
    HUNT.forEach((k) => { a2.found.add(k); if (a2.guess[k] === undefined) a2.guess[k] = THINGS[k].self; });
    stageBlackout();
  },
  moon: () => { dock.hidden = false; stageDots(2); Object.assign(env, { lights: 0, torch: 0, flames: 1, torch2: 1, dawn: 0 }); stageMoon('u'); },
  dawn: () => { closeModal(); dock.hidden = false; stageDots(2); Object.assign(env, { lights: 0 }); stageDawn(); },
};
document.querySelectorAll('[data-jump]').forEach((b) => (b.onclick = () => { state.cancel && state.cancel(); sfx.click(); JUMPS[b.dataset.jump](); openTeacher(false); }));
$('#pauseBtn').onclick = () => { $('#pause').hidden = false; openTeacher(false); };
$('#pause').onclick = () => { $('#pause').hidden = true; };
$('#qualityBtn').onclick = () => { Q.high = !Q.high; Q.auto = false; applyQuality(); };
function syncSound() { $('#soundBtn').innerHTML = isMuted() ? ICON.mute : ICON.sound; $('#soundBtn').setAttribute('aria-label', isMuted() ? '打开声音' : '关掉声音'); }
$('#soundBtn').onclick = () => { unlock(); setMuted(!isMuted()); syncSound(); };
syncSound();
$('#brandIc').innerHTML = ICON.torch;

// ================= 主循环 =================
let last = now(), fpsAcc = 0, fpsN = 0, fpsChecked = false;
Q.auto = true;
function loop() {
  const t = now(), dt = Math.min(0.1, t - last); last = t;
  updateCamera(dt);
  updateAim();
  applyEnv(dt);
  updateClimb(dt);
  runTweens();
  // 太久没找到：轻轻提示一个还没找到的东西
  if (state.stage === 'hunt' && t - a2.idleAt > 40) {
    a2.idleAt = t;
    const k = HUNT.find((k) => !a2.found.has(k));
    if (k) {
      setRegion(regionOf(H.items[k]));
      setTimeout(() => { const s = screenPos(H.items[k]); bubble(s.x, s.y, '这里看看？', 'hint'); }, 700);
    }
  }
  if (composer && Q.high) composer.render(dt); else renderer.render(scene, camera);
  // 前几秒太卡，自动换省电画质
  if (Q.auto && !fpsChecked) {
    fpsAcc += dt; fpsN++;
    if (fpsAcc > 4) { fpsChecked = true; if (fpsN / fpsAcc < 24 && Q.high) { Q.high = false; applyQuality(); } }
  }
  requestAnimationFrame(loop);
}
function regionOf(it) { return regionAt(worldPos(it, new THREE.Vector3())); }
function regionAt(_p) {
  let best = 'all', bd = 1e9;
  for (const [k, r] of Object.entries(REGIONS)) {
    if (k === 'all') continue;
    const d = Math.abs(_p.x - r.cx) / r.w + Math.abs(_p.y - r.cy) / r.h;
    if (d < bd) { bd = d; best = k; }
  }
  return best;
}

window.addEventListener('resize', resize);
new ResizeObserver(() => { const h = dock.offsetHeight + 16; if (Math.abs(h - dockH) > 2) dockH = h; }).observe(dock);

applyQuality();
stageIntro();
$('#loading').remove();
loop();

// 方便测试：在网址加 ?debug 才挂出来
if (new URLSearchParams(location.search).has('debug')) window.__lab = { IMG, state, env, envNow, JUMPS, H, camera, setRegion, tap, screenPos, a2, round };
