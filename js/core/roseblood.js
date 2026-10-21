/* =====================================================================
 * 玫瑰磚（Roseblood）地板與共用判定
 * 內圈 r3–8、外圈 r8–16，各 8 塊（編號：內圈 0–7、外圈 8–15，第 w 塊 = w×45°～(w+1)×45°）。
 * 紅磚被技能打到時，相連的紅磚一起引爆；引爆後可以站，但保留紅色。
 * ===================================================================== */

let roseSet = null;
const RING = [
  [3, 8],
  [8, 16],
];
const angOfPt = (x, z) => ((Math.atan2(x, -z) * 180) / Math.PI + 360) % 360;
const angDiff = (p, q) => {
  const d = Math.abs(p - q) % 360;
  return d > 180 ? 360 - d : d;
};
function tileOf(x, z) {
  const r = Math.hypot(x, z);
  if (r < 3) return 'center';
  if (r > 16.2) return null;
  return (r < 8 ? 0 : 1) * 8 + (Math.floor(angOfPt(x, z) / 45) % 8);
}
function tileNeighbors(id) {
  const ring = id >> 3,
    w = id & 7;
  return [ring * 8 + ((w + 1) % 8), ring * 8 + ((w + 7) % 8), (1 - ring) * 8 + w];
}
function roseComponents(hitIds) {
  const out = new Set(),
    stack = [...hitIds].filter(i => roseSet && roseSet.has(i));
  while (stack.length) {
    const i = stack.pop();
    if (out.has(i)) continue;
    out.add(i);
    tileNeighbors(i).forEach(n => {
      if (roseSet.has(n) && !out.has(n)) stack.push(n);
    });
  }
  return out;
}
function sectorMesh(id, color, op, y = 0.06) {
  const ring = id >> 3,
    w = id & 7,
    [r0, r1] = RING[ring];
  const m = new T.Mesh(
    new T.RingGeometry(r0, r1, 18, 1, ((90 - 45 * w - 45) * Math.PI) / 180, Math.PI / 4).rotateX(
      -Math.PI / 2
    ),
    groundMat(color, op)
  );
  m.position.y = y;
  return m;
}
function setRose(set) {
  roseSet = set;
  if (roseMesh[0] && roseMesh[0].parent) {
    // 已經有地板：只換顏色
    for (let id = 0; id < 16; id++) {
      const m = roseMesh[id];
      m.material.color.setHex(set.has(id) ? 0xc8204e : 0x08060c);
      m.material.opacity = set.has(id) ? 0.62 : 0.6;
      m.userData.flashUntil = undefined;
    }
    return;
  }
  addFx(circleMesh(0, 0, 3, 0x5a0016, 0.8, 0.058), 999, false).renderOrder = 1;
  roseMesh = {};
  for (let id = 0; id < 16; id++) {
    const sm = sectorMesh(id, set.has(id) ? 0xc8204e : 0x08060c, set.has(id) ? 0.62 : 0.6);
    sm.renderOrder = 1;
    roseMesh[id] = addFx(sm, 999, false);
    addFx(
      ringMesh(0, 0, RING[id >> 3][1] - 0.08, RING[id >> 3][1], 0x3a2a20, 0.8, 0.062),
      999,
      false
    ).renderOrder = 2;
  }
  for (let w = 0; w < 8; w++) {
    const a = w * 45,
      d = dirOf(a);
    const ln = new T.Mesh(new T.PlaneGeometry(0.12, 13).rotateX(-Math.PI / 2), groundMat(0x3a2a20, 0.9));
    ln.position.set(d.x * 9.5, 0.063, d.z * 9.5);
    ln.rotation.y = (-a * Math.PI) / 180;
    ln.renderOrder = 2;
    addFx(ln, 999, false);
  }
}
// 引爆後的紅磚變回普通地板（之後可以站）
let roseMesh = {},
  dtRun = 0;
function explode(ids) {
  ids.forEach(id => {
    roseSet.delete(id);
    // 地板亮起特效：疊三層加亮的扇形，往上飄淡出
    [
      [0.07, 1],
      [0.5, 0.7],
      [1.1, 0.45],
    ].forEach(([y, k], i) => {
      const m = sectorMesh(id, 0xff8fb0, 1, y);
      m.material.blending = T.AdditiveBlending;
      m.material.opacity = 0.9 * k;
      m.userData.rise = 0.8 * (i + 1);
      addFx(m, 1.1 + i * 0.15);
    });
    const base = roseMesh[id];
    if (base) {
      base.userData.flashUntil = t + 1.1;
    }
  });
}
let arrowTexC = null;
function arrowTex() {
  if (arrowTexC) return arrowTexC;
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = '#ffe27a';
  g.shadowColor = '#ffb000';
  g.shadowBlur = 14;
  g.beginPath();
  g.moveTo(20, 48);
  g.lineTo(150, 48);
  g.lineTo(150, 18);
  g.lineTo(236, 64);
  g.lineTo(150, 110);
  g.lineTo(150, 80);
  g.lineTo(20, 80);
  g.closePath();
  g.fill();
  return (arrowTexC = canvasTex(cv));
}
function circleTiles(cx, cz, R) {
  const s = new Set();
  const add = (x, z) => {
    const i = tileOf(x, z);
    if (typeof i === 'number') s.add(i);
  };
  add(cx, cz);
  for (let k = 0; k < 36; k++) {
    const a = (k / 36) * Math.PI * 2;
    add(cx + Math.cos(a) * R, cz + Math.sin(a) * R);
    add(cx + Math.cos(a) * R * 0.5, cz + Math.sin(a) * R * 0.5);
  }
  return s;
}
function coneTiles(c, half) {
  const s = new Set();
  for (let a = c - half; a <= c + half; a += 1.5) {
    const w = Math.floor((((a % 360) + 360) % 360) / 45) % 8;
    s.add(w);
    s.add(8 + w);
  }
  return s;
}
const dirName = a => MARK_NAME[(Math.round(a / 45) * 45) % 360] + ' 方向';
const shuffle = arr => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/* ---------- 各式的固定紅磚配置（依 XivStrat 場地圖） ---------- */
const FLOOR = {
  1: { inner: [0, 1, 5, 6], outer: [0, 3, 5] },
  2: { inner: [0, 1, 3, 4, 7], outer: [0, 3, 4, 6, 7] },
  3: { inner: [0, 2], outer: [1, 3, 5, 7] },
  4: { inner: [1, 6], outer: [2, 5, 7] },
  5: { inner: [2, 3, 6, 7], outer: [2, 3, 6, 7] },
  6: { inner: [1, 5], outer: [2, 6] },
}; // 6：依 XivStrat 六式分組圖（與單張場地圖左右鏡像）
const floorSet = n => new Set([...FLOOR[n].inner, ...FLOOR[n].outer.map(w => 8 + w)]);
function compsIn(sim, hitIds) {
  const out = new Set(),
    st = [...hitIds].filter(i => sim.has(i));
  while (st.length) {
    const i = st.pop();
    if (out.has(i)) continue;
    out.add(i);
    tileNeighbors(i).forEach(n => {
      if (sim.has(n) && !out.has(n)) st.push(n);
    });
  }
  return out;
}
function inShape(x, z, sh) {
  const r = Math.hypot(x, z);
  if (sh.type === 'circle') return r < 8;
  if (sh.type === 'donut') return r > 8;
  return r > 0.5 && angDiff(angOfPt(x, z), sh.c) <= sh.half;
}
const SHAPE_NAME = { circle: '鋼鐵（圓形）', donut: '月環', cone: '雷鳴劍扇形' };
function shapeMesh(sh, color, op, y) {
  if (sh.type === 'circle') return circleMesh(0, 0, 8, color, op, y);
  if (sh.type === 'donut') return ringMesh(0, 0, 8, 16, color, op, y);
  return coneMesh(dirOf(sh.c), (sh.half * Math.PI) / 180, 16, color, op, y);
}

/* ---------- 其他共用 ---------- */
const COMPASS = a =>
  ['北', '東北', '東', '東南', '南', '西南', '西', '西北'][Math.round((((a % 360) + 360) % 360) / 45) % 8];
let finishNote = '';
function pickFirst() {
  return (
    window.__forceFirst ||
    (cfg.ironFirst !== 'rand' ? cfg.ironFirst : Math.random() < 0.5 ? 'circle' : 'donut')
  );
}
