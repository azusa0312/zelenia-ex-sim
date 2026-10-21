/* =====================================================================
 * 場景：渲染器、相機、燈光、地板、場標、王
 * ===================================================================== */

let renderer;
try {
  renderer = new T.WebGLRenderer({ antialias: true });
} catch (e) {
  window.__fatal('無法建立 WebGL，請開啟瀏覽器硬體加速。');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
$('stage').appendChild(renderer.domElement);

const scene = new T.Scene();
scene.background = new T.Color(0x0d0910);
scene.fog = new T.Fog(0x0d0910, 30, 75);
const camera = new T.PerspectiveCamera(54, innerWidth / innerHeight, 0.1, 160);
scene.add(new T.HemisphereLight(0xffe6f0, 0x1a0c14, 0.85));
const sun = new T.DirectionalLight(0xfff1dc, 1.4);
sun.position.set(-10, 26, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 70 });
scene.add(sun);

function canvasTex(cv) {
  const t = new T.CanvasTexture(cv);
  t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function rose(g, x, y, s, a) {
  g.save();
  g.translate(x, y);
  g.fillStyle = `rgba(232,80,110,${a})`;
  for (let i = 0; i < 5; i++) {
    g.rotate((Math.PI * 2) / 5);
    g.beginPath();
    g.ellipse(0, -s * 0.45, s * 0.3, s * 0.5, 0, 0, 7);
    g.fill();
  }
  g.fillStyle = `rgba(255,150,170,${a + 0.1})`;
  g.beginPath();
  g.arc(0, 0, s * 0.24, 0, 7);
  g.fill();
  g.restore();
}
function floorTexture() {
  const S = 1024,
    c = S / 2,
    k = c / ARENA_R,
    cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const bg = g.createRadialGradient(c, c, 0, c, c, c);
  bg.addColorStop(0, '#1c2a6a');
  bg.addColorStop(0.8, '#14205a');
  bg.addColorStop(1, '#0c1236');
  g.fillStyle = bg;
  g.fillRect(0, 0, S, S);
  const fl = g.createRadialGradient(c, c, 0, c, c, WALK_R * k);
  fl.addColorStop(0, '#a99c70');
  fl.addColorStop(0.75, '#9a8b5e');
  fl.addColorStop(1, '#7f6e44');
  g.fillStyle = fl;
  g.beginPath();
  g.arc(c, c, WALK_R * k, 0, 7);
  g.fill();
  for (let i = 0; i < 1400; i++) {
    const r = (WALK_R + 0.4 + Math.random() * 3.6) * k,
      a = Math.random() * 7;
    g.fillStyle = `rgba(${(90 + Math.random() * 80) | 0},${(110 + Math.random() * 90) | 0},255,${Math.random() * 0.25})`;
    g.beginPath();
    g.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, Math.random() * 3 + 1, 0, 7);
    g.fill();
  }
  [
    [4.4, 10.2],
    [10.2, 15.8],
  ].forEach(([a, b], ri) => {
    for (let i = 0; i < 8; i++) {
      const th0 = ((i * 45 - 22.5 - 90) * Math.PI) / 180,
        th1 = th0 + Math.PI / 4;
      g.beginPath();
      g.arc(c, c, b * k, th0, th1);
      g.arc(c, c, a * k, th1, th0, true);
      g.closePath();
      g.fillStyle = (i + ri) % 2 ? 'rgba(140,90,70,.16)' : 'rgba(70,50,60,.16)';
      g.fill();
      g.strokeStyle = 'rgba(150,112,50,.55)';
      g.lineWidth = 3;
      g.stroke();
      const mid = ((i * 45 - 90) * Math.PI) / 180,
        rr = ((a + b) / 2) * k;
      rose(g, c + Math.cos(mid) * rr, c + Math.sin(mid) * rr, ri ? 24 : 18, 0.22);
    }
  });
  const pg = g.createRadialGradient(c, c, 0, c, c, 4.4 * k);
  pg.addColorStop(0, 'rgba(120,20,40,.55)');
  pg.addColorStop(1, 'rgba(90,10,30,0)');
  g.fillStyle = pg;
  g.beginPath();
  g.arc(c, c, 4.4 * k, 0, 7);
  g.fill();
  g.strokeStyle = 'rgba(190,150,70,1)';
  g.lineWidth = 9;
  g.beginPath();
  g.arc(c, c, WALK_R * k, 0, 7);
  g.stroke();
  return canvasTex(cv);
}
const floor = new T.Mesh(
  new T.CircleGeometry(ARENA_R, 128).rotateX(-Math.PI / 2),
  new T.MeshStandardMaterial({ map: floorTexture(), roughness: 0.9 })
);
floor.receiveShadow = true;
scene.add(floor);
const outer = new T.Mesh(
  new T.RingGeometry(ARENA_R, 70, 96).rotateX(-Math.PI / 2),
  new T.MeshStandardMaterial({ color: 0x120d18, roughness: 1 })
);
outer.position.y = -0.02;
scene.add(outer);
const wall = new T.Mesh(
  new T.CylinderGeometry(WALK_R + 0.3, WALK_R + 0.3, 1.4, 128, 1, true),
  new T.MeshBasicMaterial({
    color: 0xff4d6d,
    transparent: true,
    opacity: 0.22,
    side: T.DoubleSide,
    depthWrite: false,
  })
);
wall.position.y = 0.7;
scene.add(wall);

function markTex(lbl, col, square) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = col + '55';
  g.strokeStyle = col;
  g.lineWidth = 7;
  if (square) {
    g.fillRect(14, 14, 100, 100);
    g.strokeRect(14, 14, 100, 100);
  } else {
    g.beginPath();
    g.arc(64, 64, 52, 0, 7);
    g.fill();
    g.stroke();
  }
  g.fillStyle = '#fff';
  g.font = '900 64px system-ui,sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(lbl, 64, 68);
  return canvasTex(cv);
}
[
  ['A', 0, '#ff5a5a', 0],
  ['B', 90, '#ffd84a', 0],
  ['C', 180, '#4ab4ff', 0],
  ['D', 270, '#c77dff', 0],
  ['1', 315, '#ff5a5a', 1],
  ['2', 45, '#ffd84a', 1],
  ['3', 135, '#4ab4ff', 1],
  ['4', 225, '#c77dff', 1],
].forEach(([l, a, c, sq]) => {
  const m = new T.Mesh(
    new T.PlaneGeometry(1.7, 1.7).rotateX(-Math.PI / 2),
    new T.MeshBasicMaterial({ map: markTex(l, c, sq), transparent: true, depthWrite: false })
  );
  const d = dirOf(a);
  m.position.set(d.x * 15, 0.04, d.z * 15);
  m.rotation.y = (-a * Math.PI) / 180 + Math.PI;
  scene.add(m);
});

/* ---------- 王 ---------- */
const boss = new T.Group();
{
  const dress = new T.MeshStandardMaterial({ color: 0x8a1f3d, roughness: 0.45, metalness: 0.2 });
  const pale = new T.MeshStandardMaterial({ color: 0xf0dde4, roughness: 0.6 });
  const gold = new T.MeshStandardMaterial({ color: 0xe9c46a, roughness: 0.3, metalness: 0.8 });
  const skirt = new T.Mesh(new T.ConeGeometry(1.5, 3.2, 28, 1, true), dress);
  skirt.position.y = 1.6;
  skirt.castShadow = true;
  const torso = new T.Mesh(new T.CylinderGeometry(0.36, 0.52, 1.1, 20), dress);
  torso.position.y = 3.65;
  torso.castShadow = true;
  const head = new T.Mesh(new T.SphereGeometry(0.36, 20, 16), pale);
  head.position.y = 4.55;
  const crown = new T.Mesh(new T.TorusGeometry(0.4, 0.06, 8, 32), gold);
  crown.position.y = 4.85;
  crown.rotation.x = Math.PI / 2;
  const sword = new T.Mesh(new T.BoxGeometry(0.12, 0.02, 3.4), gold);
  sword.position.set(0.8, 3.2, -0.6);
  sword.rotation.set(-0.5, 0.3, 0);
  boss.add(skirt, torso, head, crown, sword);
  for (let i = 0; i < 6; i++) {
    const p = new T.Mesh(
      new T.SphereGeometry(0.28, 12, 10),
      new T.MeshStandardMaterial({ color: 0xe8506e, roughness: 0.5 })
    );
    const a = (i / 6) * Math.PI * 2;
    p.position.set(Math.cos(a) * 1.25, 0.35, Math.sin(a) * 1.25);
    boss.add(p);
  }
}
scene.add(boss);
const hitRing = new T.Mesh(
  new T.RingGeometry(2.25, 2.45, 64).rotateX(-Math.PI / 2),
  new T.MeshBasicMaterial({ color: 0xff3355, transparent: true, opacity: 0.85 })
);
hitRing.position.y = 0.05;
scene.add(hitRing);
const frontMark = new T.Mesh(
  new T.ConeGeometry(0.28, 0.5, 3).rotateX(-Math.PI / 2),
  new T.MeshBasicMaterial({ color: 0xff3355 })
);
frontMark.position.set(0, 0.06, -2.75);
scene.add(frontMark);
