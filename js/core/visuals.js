/* =====================================================================
 * 共用視覺：圖示、文字標籤、地面範圍、暫時性特效
 * ===================================================================== */

const iconCache = {};
function iconTex(type) {
  if (iconCache[type]) return iconCache[type];
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 128;
  const g = cv.getContext('2d');
  const glow = type === 'close' ? '#ff7ab8' : '#a77bff';
  const pts =
    type === 'close'
      ? [
          [-34, 4, 26],
          [0, 4, 34],
          [34, 4, 26],
        ]
      : [
          [-92, 8, 22],
          [0, 0, 34],
          [92, 8, 22],
        ];
  g.shadowColor = glow;
  g.shadowBlur = 22;
  pts.forEach(([x, y, s]) => {
    g.save();
    g.translate(128 + x, 64 + y);
    g.rotate(Math.PI / 4);
    g.fillStyle = glow;
    g.fillRect(-s / 2, -s / 2, s, s);
    g.fillStyle = 'rgba(255,255,255,.75)';
    g.fillRect(-s / 5, -s / 5, s / 2.5, s / 2.5);
    g.restore();
  });
  return (iconCache[type] = canvasTex(cv));
}
const indicator = new T.Mesh(
  new T.PlaneGeometry(3.2, 1.6),
  new T.MeshBasicMaterial({ transparent: true, depthWrite: false, side: T.DoubleSide })
);
indicator.position.y = 5.7;
indicator.visible = false;
scene.add(indicator);

const labelCache = {};
function labelTex(text, color) {
  const key = text + color;
  if (labelCache[key]) return labelCache[key];
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 96;
  const g = cv.getContext('2d');
  g.font = '700 46px "Noto Sans TC",system-ui,sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = 8;
  g.strokeStyle = 'rgba(10,5,10,.9)';
  g.strokeText(text, 128, 50);
  g.fillStyle = color;
  g.fillText(text, 128, 50);
  return (labelCache[key] = canvasTex(cv));
}
function makeLabel(text, color) {
  const s = new T.Sprite(
    new T.SpriteMaterial({ map: labelTex(text, color), transparent: true, depthWrite: false })
  );
  s.scale.set(1.9, 0.71, 1);
  return s;
}

// 暫時性特效：{obj, until, fade, born}
let fx = [];
function addFx(obj, life, fade = true) {
  if (!obj.renderOrder) obj.renderOrder = 5;
  scene.add(obj);
  fx.push({ obj, born: t, until: t + life, fade, op0: obj.material ? obj.material.opacity : 1 });
  return obj;
}
// 判定瞬間的特效：實心填色＋亮邊＋往上的光柱感（加亮混色）
function strongFlash(mesh, edge) {
  mesh.material.blending = T.AdditiveBlending;
  addFx(mesh, 0.9);
  if (edge)
    edge.forEach(e => {
      e.material.blending = T.AdditiveBlending;
      addFx(e, 0.9);
    });
}
function clearFx() {
  fx.forEach(f => scene.remove(f.obj));
  fx = [];
}
function groundMat(color, op) {
  return new T.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: op,
    depthWrite: false,
    side: T.DoubleSide,
  });
}
function circleMesh(x, z, r, color, op = 0.45, y = 0.07) {
  const m = new T.Mesh(new T.CircleGeometry(r, 48).rotateX(-Math.PI / 2), groundMat(color, op));
  m.position.set(x, y, z);
  return m;
}
function ringMesh(x, z, r0, r1, color, op = 0.45, y = 0.07) {
  const m = new T.Mesh(new T.RingGeometry(r0, r1, 64).rotateX(-Math.PI / 2), groundMat(color, op));
  m.position.set(x, y, z);
  return m;
}
function coneMesh(dir, half, len, color, op = 0.5, y = 0.08) {
  const m = new T.Mesh(
    new T.CircleGeometry(len, 24, -half, half * 2).rotateX(-Math.PI / 2),
    groundMat(color, op)
  );
  m.position.y = y;
  m.rotation.y = Math.atan2(-dir.z, dir.x);
  return m;
}
function screenFlash() {
  const f = $('flash');
  f.style.opacity = 1;
  setTimeout(() => (f.style.opacity = 0), 350);
}
