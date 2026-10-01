// 程序生成的材质贴图：不靠外部图档，载入快，也没有授权问题。
import * as THREE from 'three';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

// 简单的可重现随机数，让每次画出来的纹理都一样
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function tex(c, repeatX = 1, repeatY = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 8;
  return t;
}

function noise(ctx, w, h, amount, seed, alpha = 0.06) {
  const r = rng(seed);
  for (let i = 0; i < amount; i++) {
    const v = r() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha * r()})`;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
}

export function woodFloor(base = '#a8754a') {
  const [c, x] = canvas(512, 512);
  const r = rng(7);
  const plankH = 64;
  for (let row = 0; row < 8; row++) {
    let off = (row % 2) * 170 + r() * 60;
    for (let px = -off; px < 512; px += 300 + r() * 120) {
      const len = 300 + r() * 120;
      const shade = 0.82 + r() * 0.3;
      const col = new THREE.Color(base).multiplyScalar(shade);
      x.fillStyle = `#${col.getHexString()}`;
      x.fillRect(px, row * plankH, len, plankH);
      // 木纹
      x.strokeStyle = 'rgba(60,30,10,0.18)';
      for (let g = 0; g < 7; g++) {
        x.lineWidth = 0.6 + r() * 1.2;
        x.beginPath();
        const y0 = row * plankH + 6 + r() * (plankH - 12);
        x.moveTo(px, y0);
        for (let k = 0; k <= 8; k++) x.lineTo(px + (len / 8) * k, y0 + Math.sin(k * 1.3 + g) * 2.2 * r());
        x.stroke();
      }
      x.fillStyle = 'rgba(40,20,8,0.55)';
      x.fillRect(px, row * plankH, 2, plankH);
    }
    x.fillStyle = 'rgba(40,20,8,0.5)';
    x.fillRect(0, row * plankH, 512, 2);
  }
  noise(x, 512, 512, 9000, 3);
  return tex(c, 3, 1.5);
}

export function paint(base, seed = 1) {
  const [c, x] = canvas(256, 256);
  x.fillStyle = base; x.fillRect(0, 0, 256, 256);
  noise(x, 256, 256, 6000, seed, 0.05);
  return tex(c, 3, 2);
}

export function tiles(base = '#eef1ee', grout = '#b9c1bd', size = 64) {
  const [c, x] = canvas(256, 256);
  x.fillStyle = grout; x.fillRect(0, 0, 256, 256);
  const r = rng(11);
  for (let i = 0; i < 256; i += size) for (let j = 0; j < 256; j += size) {
    const col = new THREE.Color(base).multiplyScalar(0.95 + r() * 0.06);
    x.fillStyle = `#${col.getHexString()}`;
    x.fillRect(i + 2, j + 2, size - 4, size - 4);
  }
  noise(x, 256, 256, 2000, 5, 0.04);
  return tex(c, 4, 2);
}

export function roofTiles() {
  const [c, x] = canvas(256, 256);
  const r = rng(21);
  for (let row = 0; row < 8; row++) for (let col = -1; col < 9; col++) {
    const off = (row % 2) * 16;
    const shade = 0.8 + r() * 0.3;
    const cc = new THREE.Color('#9c4a32').multiplyScalar(shade);
    x.fillStyle = `#${cc.getHexString()}`;
    x.beginPath();
    x.roundRect(col * 32 + off, row * 32, 30, 34, [0, 0, 12, 12]);
    x.fill();
    x.fillStyle = 'rgba(0,0,0,0.22)';
    x.fillRect(col * 32 + off, row * 32 + 28, 30, 4);
  }
  return tex(c, 6, 3);
}

export function grass() {
  const [c, x] = canvas(256, 256);
  x.fillStyle = '#3d5a2c'; x.fillRect(0, 0, 256, 256);
  const r = rng(31);
  for (let i = 0; i < 5000; i++) {
    x.strokeStyle = `rgba(${90 + r() * 60},${130 + r() * 60},${50 + r() * 30},0.5)`;
    const px = r() * 256, py = r() * 256;
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 3, py - 4 - r() * 5); x.stroke();
  }
  return tex(c, 8, 3);
}

export function fabric(base, stripe) {
  const [c, x] = canvas(128, 128);
  x.fillStyle = base; x.fillRect(0, 0, 128, 128);
  if (stripe) {
    x.fillStyle = stripe;
    for (let i = 0; i < 128; i += 32) x.fillRect(i, 0, 12, 128);
  }
  noise(x, 128, 128, 3000, 9, 0.08);
  return tex(c, 2, 2);
}

export function nightSky() {
  const [c, x] = canvas(1024, 512);
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#060a1c');
  g.addColorStop(0.6, '#13204a');
  g.addColorStop(1, '#2b3a6b');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
  const r = rng(41);
  for (let i = 0; i < 420; i++) {
    const s = r() * 1.6 + 0.3;
    x.fillStyle = `rgba(255,255,240,${0.3 + r() * 0.7})`;
    x.beginPath(); x.arc(r() * 1024, r() * 380, s, 0, Math.PI * 2); x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function dawnSky() {
  const [c, x] = canvas(1024, 512);
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#6fa8dc');
  g.addColorStop(0.55, '#f7c98b');
  g.addColorStop(1, '#ffdcae');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function moonFace() {
  const [c, x] = canvas(256, 256);
  x.fillStyle = '#f3f1e4'; x.fillRect(0, 0, 256, 256);
  const r = rng(51);
  for (let i = 0; i < 40; i++) {
    x.fillStyle = `rgba(150,150,140,${0.15 + r() * 0.25})`;
    x.beginPath(); x.arc(r() * 256, r() * 256, 4 + r() * 22, 0, Math.PI * 2); x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// 柔和光晕贴图（火焰、灯泡外的光晕）
export function glow(inner = 'rgba(255,220,150,1)', outer = 'rgba(255,140,40,0)') {
  const [c, x] = canvas(128, 128);
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(0.25, inner.replace(/[\d.]+\)$/, '0.55)'));
  g.addColorStop(1, outer);
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---- 书页上的图画（读书任务用：看图不用认字） ----
export const PICTURES = {
  cat: { label: '猫', draw: drawCat },
  fish: { label: '鱼', draw: drawFish },
  bird: { label: '鸟', draw: drawBird },
};

function drawCat(x, cx, cy, s) {
  x.fillStyle = '#e59a4b';
  x.beginPath(); x.ellipse(cx, cy + s * 0.35, s * 0.55, s * 0.42, 0, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.arc(cx, cy - s * 0.18, s * 0.36, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.moveTo(cx - s * 0.32, cy - s * 0.36); x.lineTo(cx - s * 0.22, cy - s * 0.72); x.lineTo(cx - s * 0.06, cy - s * 0.45); x.fill();
  x.beginPath(); x.moveTo(cx + s * 0.32, cy - s * 0.36); x.lineTo(cx + s * 0.22, cy - s * 0.72); x.lineTo(cx + s * 0.06, cy - s * 0.45); x.fill();
  x.fillStyle = '#2a2320';
  x.beginPath(); x.arc(cx - s * 0.13, cy - s * 0.2, s * 0.05, 0, Math.PI * 2); x.arc(cx + s * 0.13, cy - s * 0.2, s * 0.05, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#2a2320'; x.lineWidth = s * 0.025;
  for (const d of [-1, 1]) for (const k of [-0.06, 0.04]) {
    x.beginPath(); x.moveTo(cx + d * s * 0.1, cy - s * 0.06 + k * s); x.lineTo(cx + d * s * 0.42, cy - s * 0.1 + k * s * 1.6); x.stroke();
  }
  x.beginPath(); x.moveTo(cx + s * 0.5, cy + s * 0.5); x.quadraticCurveTo(cx + s * 0.95, cy + s * 0.3, cx + s * 0.8, cy - s * 0.05); x.lineWidth = s * 0.09; x.strokeStyle = '#e59a4b'; x.stroke();
}

function drawFish(x, cx, cy, s) {
  x.fillStyle = '#3d8fd1';
  x.beginPath(); x.ellipse(cx - s * 0.08, cy, s * 0.55, s * 0.32, 0, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.moveTo(cx + s * 0.38, cy); x.lineTo(cx + s * 0.8, cy - s * 0.32); x.lineTo(cx + s * 0.8, cy + s * 0.32); x.closePath(); x.fill();
  x.fillStyle = '#fff'; x.beginPath(); x.arc(cx - s * 0.38, cy - s * 0.06, s * 0.08, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#16233a'; x.beginPath(); x.arc(cx - s * 0.37, cy - s * 0.06, s * 0.04, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = s * 0.03;
  for (const k of [-0.05, 0.1, 0.25]) { x.beginPath(); x.arc(cx + k * s, cy, s * 0.18, -1, 1); x.stroke(); }
}

function drawBird(x, cx, cy, s) {
  x.fillStyle = '#e2584a';
  x.beginPath(); x.ellipse(cx, cy + s * 0.1, s * 0.48, s * 0.36, -0.2, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.arc(cx - s * 0.36, cy - s * 0.25, s * 0.24, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#f2b33d';
  x.beginPath(); x.moveTo(cx - s * 0.58, cy - s * 0.28); x.lineTo(cx - s * 0.82, cy - s * 0.2); x.lineTo(cx - s * 0.58, cy - s * 0.14); x.fill();
  x.fillStyle = '#b8382c';
  x.beginPath(); x.ellipse(cx + s * 0.08, cy + s * 0.05, s * 0.3, s * 0.16, -0.5, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.moveTo(cx + s * 0.4, cy + s * 0.1); x.lineTo(cx + s * 0.85, cy - s * 0.1); x.lineTo(cx + s * 0.75, cy + s * 0.3); x.fill();
  x.fillStyle = '#1d1a18'; x.beginPath(); x.arc(cx - s * 0.4, cy - s * 0.3, s * 0.045, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#7a5a3a'; x.lineWidth = s * 0.04;
  x.beginPath(); x.moveTo(cx - s * 0.05, cy + s * 0.45); x.lineTo(cx - s * 0.1, cy + s * 0.7); x.moveTo(cx + s * 0.12, cy + s * 0.45); x.lineTo(cx + s * 0.1, cy + s * 0.7); x.stroke();
}

export function pictureDataURL(key, size = 160) {
  const [c, x] = canvas(size, size);
  x.fillStyle = '#fffaf0'; x.fillRect(0, 0, size, size);
  PICTURES[key].draw(x, size / 2, size / 2, size * 0.42);
  return c.toDataURL();
}

// 打开的书：左页图画，右页一个大字
export function bookPages(key) {
  const [c, x] = canvas(512, 256);
  x.fillStyle = '#fbf5e6'; x.fillRect(0, 0, 512, 256);
  const g = x.createLinearGradient(236, 0, 276, 0);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(90,60,30,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(236, 0, 40, 256);
  PICTURES[key].draw(x, 128, 132, 92);
  x.fillStyle = '#2b2620';
  x.font = '900 120px "Noto Sans SC", sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(PICTURES[key].label, 384, 134);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// 楼梯级数字（踩过的楼梯显示 1、2、3……）
export function numberSprite(n) {
  const [c, x] = canvas(128, 128);
  x.fillStyle = 'rgba(255,214,120,0.95)';
  x.beginPath(); x.arc(64, 64, 56, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#2a1d0b';
  x.font = '900 76px "Noto Sans SC", sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(String(n), 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// 楼梯上的脚印（发一点微光，黑暗中也看得到走到哪里）
export function footprints() {
  const [c, x] = canvas(128, 128);
  x.fillStyle = 'rgba(255,214,120,0.95)';
  for (const [cx, cy, r] of [[44, 74, -0.15], [84, 50, 0.15]]) {
    x.save(); x.translate(cx, cy); x.rotate(r);
    x.beginPath(); x.ellipse(0, 6, 13, 22, 0, 0, Math.PI * 2); x.fill();
    for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(-9 + i * 6, -22 + Math.abs(i - 1.5) * 2, 4, 0, Math.PI * 2); x.fill(); }
    x.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
