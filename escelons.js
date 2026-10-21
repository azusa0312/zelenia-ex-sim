/* =====================================================================
 * 凌空錯 Escelons' Fall（開場版本；三式、四式後的版本在各自檔案）
 * ===================================================================== */

let esc = null,
  coneGeo = null;
// 子言打法：第一刀 T/H 永遠在內圈、DPS 永遠在外圈 → 第一刀是「近」就由支援組吃 1、3 刀，是「遠」就由 DPS 吃
const baitGroup = k => (k % 2 === 0 ? esc.first : esc.first === 'S' ? 'D' : 'S');
function wantClose(m, k) {
  const bait = m.grp === baitGroup(k);
  return bait ? esc.seq[k] === 'close' : esc.seq[k] === 'far';
}
function randomSeq() {
  const a = Math.random() < 0.5 ? 'close' : 'far',
    b = Math.random() < 0.5 ? 'close' : 'far',
    flip = x => (x === 'close' ? 'far' : 'close');
  return [a, b, flip(a), flip(b)]; // 只會是 ABBA 或 AABB
}
function escelons(next) {
  const CAST_LEN = 6,
    L = cfg.esc;
  coneGeo && coneGeo.dispose();
  coneGeo = new T.CircleGeometry(30, 24, -cfg.half, cfg.half * 2).rotateX(-Math.PI / 2);
  esc = {
    start: t,
    castLen: CAST_LEN,
    seq: cfg.seqMode === 'rand' ? randomSeq() : cfg.seqMode.split(','),
    hitIdx: 0,
    next,
  };
  esc.first = cfg.first === 'auto' ? (esc.seq[0] === 'close' ? 'S' : 'D') : cfg.first;
  esc.hitTimes = [0, 1, 2, 3].map(k => esc.start + CAST_LEN + 0.8 + k * cfg.gap);
  setCast('凌空錯', "Escelons' Fall", CAST_LEN);
  setPlan(m => posAt(L.ang[m.id], L.start), 0.4);
  at(t + CAST_LEN * 0.55, () =>
    setPlan(m => posAt(L.ang[m.id], (wantClose(m, esc.hitIdx) ? L.close : L.far) + m.jit), 0.1)
  );
  esc.hitTimes.forEach((ht, k) =>
    at(ht, () => {
      if (state === 'running') escHit(k);
    })
  );
}
function inCone(m, dir) {
  const d = Math.hypot(m.x, m.z);
  if (d < 0.5) return true;
  const c = (m.x * dir.x + m.z * dir.z) / d;
  return Math.acos(Math.max(-1, Math.min(1, c))) <= cfg.half;
}
function escHit(k) {
  const L = esc.L || cfg.esc,
    live = members.slice().sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z));
  const targets = esc.seq[k] === 'close' ? live.slice(0, 4) : live.slice(4);
  const bait = baitGroup(k),
    reasons = [];
  const pd = Math.hypot(player.x, player.z),
    wc = wantClose(player, k);
  if (!player.dead && !(esc.exempt && esc.exempt(player, k)) && (wc ? pd > L.closeMax : pd < L.farMin))
    reasons.push(
      `你第 ${k + 1} 刀該站${wc ? L.closeTxt : L.farTxt}，但當時離王 ${pd.toFixed(1)} m，站位不明確。`
    );
  const wrong = targets.filter(m => m.grp !== bait);
  if (wrong.length)
    reasons.push(
      `第 ${k + 1} 刀（${esc.seq[k] === 'close' ? '近' : '遠'}）應由${GROUP_NAME[bait]}吃，結果 ${wrong.map(who).join('、')} 被點到。`
    );
  const dirs = targets.map(m => {
    const d = Math.hypot(m.x, m.z) || 1;
    return { x: m.x / d, z: m.z / d };
  });
  dirs.forEach(d => {
    const mesh = new T.Mesh(coneGeo, groundMat(esc.seq[k] === 'close' ? 0xff7ab8 : 0xa77bff, 0.75));
    mesh.position.y = 0.08 + k * 0.004;
    mesh.rotation.y = Math.atan2(-d.z, d.x);
    addFx(mesh, 1.0);
  });
  members.forEach(m => {
    const n = dirs.filter(d => inCone(m, d)).length;
    if (!n) return;
    if (n > 1) {
      reasons.push(`${who(m)} 在第 ${k + 1} 刀同時被 ${n} 道扇形砍中。`);
      kill(m);
    } else if (m.slash > t) {
      reasons.push(`${who(m)} 帶著斬擊耐性降低又在第 ${k + 1} 刀被砍中。`);
      kill(m);
    }
    m.slash = t + DEBUFF;
  });
  esc.hitIdx = k + 1;
  members.forEach(m => (m.reactAt = t + 0.2 + Math.random() * 0.25));
  if (reasons.length) {
    reasons.push(
      `<span class="sub">順序：${seqText()}。你是${GROUP_NAME[player.grp]}，第 ${k + 1} 刀該站「${wc ? '近' : '遠'}」，當時離王中心 ${pd.toFixed(1)} m。</span>`
    );
    return fail(`凌空錯 第 ${k + 1} 刀`, reasons);
  }
  if (k === 3) {
    const same = esc.seq[0] === esc.seq[1];
    esc.summary = `凌空錯 ${seqText()}（${same ? '同 → 第 1、3 刀後換位' : '異 → 第 2 刀後換位'}）`;
    at(t + 0.6, () => {
      cast = null;
      indicator.visible = false;
      const n = esc.next;
      n && n();
    });
  }
}
const seqText = () => esc.seq.map(s => (s === 'close' ? '近' : '遠')).join(' ');
function kill(m) {
  m.dead = true;
  m.obj.rotation.z = (Math.PI / 2) * 0.92;
  m.obj.position.y = 0.3;
  m.mat.color.setHex(0x555055);
}
