// 用场景里同一批 3D 模型，拍成介面上的小图，让卡片和 3D 画面同一种质感。
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function makeThumbs(H, size = 192) {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setSize(size, size, false);
  r.setPixelRatio(1);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  // 小图用柔和的室内环境光，金属（镜子、汤匙）才有东西可以反射
  const pmrem = new THREE.PMREMGenerator(r);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  scene.add(new THREE.HemisphereLight('#fff8ee', '#8a7a68', 0.7));
  const key = new THREE.DirectionalLight('#ffffff', 1.8); key.position.set(2, 3, 4); scene.add(key);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 50);

  const shot = (obj, { elev = 0.35, pad = 1.25, yaw = 0 } = {}) => {
    const holder = new THREE.Group();
    holder.add(obj);
    holder.rotation.y = yaw;
    scene.add(holder);
    // 只按实体网格取景，光晕 sprite 不算（不然东西会变得很小）
    holder.updateMatrixWorld(true);
    const box = new THREE.Box3();
    holder.traverse((n) => {
      if (!n.isMesh || !n.visible) return;
      if (!n.geometry.boundingBox) n.geometry.computeBoundingBox();
      box.union(n.geometry.boundingBox.clone().applyMatrix4(n.matrixWorld));
    });
    const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
    const rad = Math.max(s.x, s.y, s.z) * 0.5 * pad;
    const dist = rad / Math.tan(THREE.MathUtils.degToRad(15));
    cam.position.set(c.x, c.y + dist * Math.sin(elev), c.z + dist * Math.cos(elev));
    cam.lookAt(c);
    r.render(scene, cam);
    const url = r.domElement.toDataURL('image/png');
    scene.remove(holder);
    return url;
  };

  // 复制物件，去掉灯光（小图不需要），位置归零
  const copy = (o) => {
    const c = o.clone(true);
    c.traverse((n) => { if (n.isLight) n.visible = false; });
    c.position.set(0, 0, 0);
    return c;
  };

  const T = {};
  const it = H.items;
  for (const k of ['candle', 'pelita', 'torch2', 'mirror', 'bag', 'cat', 'book']) T[k] = shot(copy(it[k].object), { pad: 1.12 });
  T.spoon = shot(copy(it.spoon.object), { elev: 0.9, pad: 1.05 });
  T.fire = shot(copy(it.fire.object), { elev: 0.45, pad: 1.05 });
  T.cat = shot(copy(it.cat.object), { yaw: -0.35 });
  T.bag = shot(copy(it.bag.object), { yaw: -0.2 });
  const moon = copy(it.moon.object); moon.traverse((n) => { if (n.isSprite) n.visible = false; });
  T.moon = shot(moon, { elev: 0, pad: 1.1 });
  T.sun = sunPicture(size);
  T.toys = shot(copy(H.toyMeshes[0].object), { yaw: 0.5 });
  const stairs = new THREE.Group();
  H.steps.slice(0, 5).forEach((s) => s.meshes.forEach((m) => { const c = m.clone(); stairs.add(c); }));
  T.stairs = shot(stairs, { yaw: 0.6, elev: 0.25 });
  T.door = shot(copy(it.door.object));
  // 书的小图不能露出书页上的图（那是读书任务的答案）
  const book = copy(it.book.object);
  book.children[1].material = new THREE.MeshStandardMaterial({ color: '#f3ecdc', roughness: 0.9 });
  T.book = shot(book, { elev: 0.85, pad: 1.05 });

  pmrem.dispose();
  r.dispose();
  r.forceContextLoss();
  return T;
}

function sunPicture(size) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d'), m = size / 2;
  const g = x.createRadialGradient(m, m, 0, m, m, m);
  g.addColorStop(0, '#fffbe6'); g.addColorStop(0.3, '#ffd34d'); g.addColorStop(0.42, '#ffb42e'); g.addColorStop(0.62, 'rgba(255,170,60,0.35)'); g.addColorStop(1, 'rgba(255,170,60,0)');
  x.fillStyle = g; x.fillRect(0, 0, size, size);
  return c.toDataURL();
}
