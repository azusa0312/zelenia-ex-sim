/* =====================================================================
 * 開場：Thorned Catharsis、Shock＋聖光塔、Specter of the Lost、Stock Break
 * ===================================================================== */

function catharsis(next) {
  setCast('Thorned Catharsis', '全體 AOE', 4);
  setPlan(m => posAt(CLOCK[m.id], 8));
  at(t + 4, () => {
    screenFlash();
    cast = null;
    next();
  });
}

/* Shock + Alexandrian Holy：一組月環（進塔）、一組圓圈（到外側放）；中間留空。站位依子言影片 */
function shock(next) {
  const donutGrp = Math.random() < 0.5 ? 'S' : 'D';
  const TOWER_R = 9.7,
    TOWER_RAD = 5.6,
    DONUT_IN = 1.2,
    DONUT_OUT = 3,
    CIRCLE_R = 4.3,
    LEN = 6;
  setCast('Shock', '月環進塔、圓圈到外側放', LEN);
  // 塔：左上、右上、左下、右下（中間與 A、C 方向留空）
  const TOWER_ANG = [300, 60, 240, 120],
    TOWER_NAME = { 300: '左上', 60: '右上', 240: '左下', 120: '右下' };
  const CIRCLE_SPOT = {
    336: [10.4, 'A 左側'],
    24: [10.4, 'A 右側'],
    204: [15, 'C 左側'],
    156: [15, 'C 右側'],
  };
  const towers = TOWER_ANG.map(a => {
    const p = posAt(a, TOWER_R);
    const g = new T.Group();
    const cyl = new T.Mesh(
      new T.CylinderGeometry(TOWER_RAD, TOWER_RAD, 2.4, 48, 1, true),
      new T.MeshBasicMaterial({
        color: 0x9fe8ff,
        transparent: true,
        opacity: 0.14,
        side: T.DoubleSide,
        depthWrite: false,
      })
    );
    cyl.position.y = 1.2;
    g.add(cyl, ringMesh(0, 0, TOWER_RAD - 0.18, TOWER_RAD, 0xdff8ff, 0.9));
    g.position.set(p.x, 0, p.z);
    addFx(g, LEN + 0.3, false);
    return { a, x: p.x, z: p.z };
  });
  const role = m => (m.grp === donutGrp ? 'donut' : 'circle');
  // 左上/右上 = MT、ST 或 D3、D4；左下/右下 = H1、H2 或 D1、D2
  const SLOT = { MT: 0, ST: 1, H1: 2, H2: 3, D3: 0, D4: 1, D1: 2, D2: 3 };
  const angFor = m => (role(m) === 'donut' ? TOWER_ANG[SLOT[m.id]] : [336, 24, 204, 156][SLOT[m.id]]);
  const spotFor = m =>
    role(m) === 'donut' ? posAt(angFor(m), TOWER_R) : posAt(angFor(m), CIRCLE_SPOT[angFor(m)][0]);
  const spotName = m => (role(m) === 'donut' ? TOWER_NAME[angFor(m)] + '塔' : CIRCLE_SPOT[angFor(m)][1]);
  // 腳下標記：月環 = 藍色環、圓圈 = 橘色小圈，跟著人走
  const marks = members.map(m => {
    const mk =
      role(m) === 'donut'
        ? ringMesh(0, 0, DONUT_IN, DONUT_OUT, 0x5fd0ff, 0.35, 0.09)
        : circleMesh(0, 0, CIRCLE_R, 0xffb35c, 0.22, 0.09);
    const edge = ringMesh(
      0,
      0,
      (role(m) === 'donut' ? DONUT_OUT : CIRCLE_R) - 0.12,
      role(m) === 'donut' ? DONUT_OUT : CIRCLE_R,
      role(m) === 'donut' ? 0x5fd0ff : 0xffb35c,
      0.9,
      0.095
    );
    const g = new T.Group();
    g.add(mk, edge);
    scene.add(g);
    fx.push({ obj: g, born: t, until: t + LEN, fade: false });
    setTag(m, role(m) === 'donut' ? '月環' : '圓圈', role(m) === 'donut' ? '#5fd0ff' : '#ffb35c');
    return { m, g };
  });
  ticks.push(() => {
    marks.forEach(k => k.g.position.set(k.m.x, 0, k.m.z));
    return t >= cast?.start + LEN - 0.01 || state !== 'running' || !cast;
  });
  setPlan(spotFor, 1.2);
  advice = `Shock：你是${role(player) === 'donut' ? '月環 → 進' + spotName(player) : '圓圈 → 到 ' + spotName(player) + '放，別踩進中間'}`;
  at(t + LEN, () => {
    cast = null;
    const reasons = [];
    marks.forEach(k => scene.remove(k.g));
    towers.forEach(tw => {
      const n = members.filter(m => !m.dead && Math.hypot(m.x - tw.x, m.z - tw.z) <= TOWER_RAD).length;
      if (n === 0) reasons.push(`${TOWER_NAME[tw.a]}塔沒人踩。`);
    });
    members.forEach(src => {
      if (role(src) === 'donut') {
        strongFlash(ringMesh(src.x, src.z, DONUT_IN, DONUT_OUT, 0x7fe0ff, 0.85));
        members.forEach(m => {
          if (m === src) return;
          const d = dist(m, src);
          if (d > DONUT_IN && d < DONUT_OUT)
            reasons.push(`${who(m)} 被 ${who(src)} 的月環打到（距離 ${d.toFixed(1)} m）。`);
        });
      } else {
        strongFlash(circleMesh(src.x, src.z, CIRCLE_R, 0xffb35c, 0.85), [
          ringMesh(src.x, src.z, CIRCLE_R - 0.2, CIRCLE_R, 0xffffff, 1, 0.1),
        ]);
        addFx(circleMesh(src.x, src.z, CIRCLE_R, 0xff6a2a, 0.28, 0.065), 6, false);
        members.forEach(m => {
          if (m === src) return;
          const d = dist(m, src);
          if (d < CIRCLE_R)
            reasons.push(
              `${who(m)} 被 ${who(src)} 的圓圈打到（距離 ${d.toFixed(1)} m，要拉開 ${CIRCLE_R} m）。`
            );
        });
        const cx = src.x,
          cz = src.z,
          endT = t + 6;
        ticks.push(() => {
          if (t > endT) return true;
          if (t < endT - 4) return false;
          for (const m of members) {
            if (!m.dead && Math.hypot(m.x - cx, m.z - cz) < CIRCLE_R - 0.2) {
              fail('Shock', [`${who(m)} 站在圓圈留下的火圈裡太久。`]);
              return true;
            }
          }
          return false;
        });
      }
      setTag(src, '');
    });
    if (reasons.length) return fail('Shock', [...new Set(reasons)]);
    advice = '放完了，2 秒內離開火圈，回自己的時鐘位（離中心約 6 m）';
    setPlan(m => posAt(CLOCK[m.id], 6), 0.2);
    next();
  });
}

/* Specter of the Lost：2 名非坦克被連線，坦克要用身體穿過連線接走；接著朝持有者放 60° 扇形死刑 */
let tethers = [];
function clearTethers() {
  tethers.forEach(th => scene.remove(th.line));
  tethers = [];
}
function specter(next) {
  const LEN = 6,
    HALF = Math.PI / 6;
  setCast('Specter of the Lost', '2 條死刑連線，坦克接線', LEN);
  const pool = members.filter(m => !m.tank);
  const a = pool.splice(rand(pool.length), 1)[0],
    b = pool[rand(pool.length)];
  [a, b].forEach(h => {
    const geo = new T.BufferGeometry().setAttribute(
      'position',
      new T.Float32BufferAttribute([0, 3, 0, 0, 1, 0], 3)
    );
    const line = new T.Line(geo, new T.LineBasicMaterial({ color: 0xc77dff }));
    scene.add(line);
    tethers.push({ holder: h, line });
  });
  // 指派：離 MT 角度較近的那條給 MT
  const angOf = m => ((Math.atan2(m.x, -m.z) * 180) / Math.PI + 360) % 360;
  const angDiff = (p, q) => {
    const d = Math.abs(p - q) % 360;
    return d > 180 ? 360 - d : d;
  };
  const [t1, t2] = tethers;
  const mtFirst =
    angDiff(angOf(t1.holder), CLOCK.MT) + angDiff(angOf(t2.holder), CLOCK.ST) <=
    angDiff(angOf(t2.holder), CLOCK.MT) + angDiff(angOf(t1.holder), CLOCK.ST);
  const assign = { MT: mtFirst ? t1 : t2, ST: mtFirst ? t2 : t1 };
  // 原本分配的線被另一個坦克接走了，就改接剩下那條
  const targetTether = m => {
    const own = assign[m.id];
    if (!own.holder.tank) return own;
    return tethers.find(o => !o.holder.tank) || null;
  };
  setPlan(m => {
    if (!m.tank) return posAt(CLOCK[m.id], 6);
    if (tethers.some(o => o.holder === m)) return posAt(CLOCK[m.id], 6);
    const th = targetTether(m);
    if (!th) return posAt(CLOCK[m.id], 6);
    const h = th.holder,
      d = Math.hypot(h.x, h.z) || 1;
    return { x: (h.x / d) * 4, z: (h.z / d) * 4 }; // 站到連線上
  }, 0.8);
  if (player.tank)
    advice = `Specter：去接 ${assign[player.id].holder === player ? '（已在你身上）' : assign[player.id].holder.id + ' 的連線（走過紫線）'}，接到後回 ${MARK_NAME[CLOCK[player.id]]} 點把扇形朝外`;
  else if (a === player || b === player) advice = 'Specter：你被連線了，站在時鐘位等坦克接走，別亂跑';
  else advice = 'Specter：留在自己的時鐘位，別站到坦克前方';
  ticks.push(() => {
    for (const th of tethers) {
      const h = th.holder,
        p = th.line.geometry.attributes.position;
      p.setXYZ(1, h.x, 1, h.z);
      p.needsUpdate = true;
      if (h.tank) continue;
      for (const m of members) {
        if (!m.tank || m.dead || tethers.some(o => o.holder === m)) continue;
        if ((!m.isPlayer || window.__autopilot) && targetTether(m) !== th) continue;
        const L = Math.hypot(h.x, h.z);
        if (L < 0.1) continue;
        const ux = h.x / L,
          uz = h.z / L,
          proj = m.x * ux + m.z * uz;
        if (proj < 1.5 || proj > L) continue;
        const perp = Math.abs(m.x * uz - m.z * ux);
        if (perp < 0.7) {
          th.holder = m;
          break;
        }
      }
    }
    return !tethers.length;
  });
  at(t + LEN, () => {
    cast = null;
    const reasons = [];
    tethers.forEach(th => {
      const h = th.holder,
        d = Math.hypot(h.x, h.z) || 1,
        dir = { x: h.x / d, z: h.z / d };
      strongFlash(coneMesh(dir, HALF, 30, 0xd08cff, 0.8));
      if (!h.tank) reasons.push(`${who(h)} 的死刑連線沒有被坦克接走。`);
      members.forEach(m => {
        if (m === h) return;
        const md = Math.hypot(m.x, m.z);
        if (md < 0.5) return;
        const c = (m.x * dir.x + m.z * dir.z) / md;
        if (Math.acos(Math.max(-1, Math.min(1, c))) <= HALF)
          reasons.push(`${who(m)} 站在 ${who(h)} 的死刑扇形裡。`);
      });
    });
    clearTethers();
    if (reasons.length) return fail('Specter of the Lost', reasons);
    advice = '';
    next();
  });
}

/* Stock Break：補師 4 連分攤 */
function stockBreak(next) {
  const LEN = 5,
    R = 3;
  const h = byId(Math.random() < 0.5 ? 'H1' : 'H2');
  setCast('Stock Break', `${h.id} 4 連分攤`, LEN);
  setTag(h, '分攤', '#e9c46a');
  const ring = ringMesh(0, 0, R - 0.15, R, 0xe9c46a, 0.9);
  scene.add(ring);
  fx.push({ obj: ring, born: t, until: t + LEN + 2.2, fade: false });
  ticks.push(() => {
    ring.position.set(h.x, 0.07, h.z);
    return state !== 'running';
  });
  setPlan(m => (m === h ? { x: h.x, z: h.z } : { x: h.x + m.jit * 2.4, z: h.z + m.jit * -1.6 }), 0.6);
  advice =
    h === player
      ? 'Stock Break：你是分攤目標，站穩讓大家靠過來'
      : `Stock Break：去 ${h.id} 身邊分攤（金圈內）`;
  for (let k = 0; k < 4; k++)
    at(t + LEN + k * 0.55, () => {
      if (state !== 'running') return;
      strongFlash(circleMesh(h.x, h.z, R, 0xffd36a, 0.8));
      const out = members.filter(m => !m.dead && dist(m, h) > R);
      if (out.length)
        return fail('Stock Break', [
          `第 ${k + 1} 段分攤時 ${out.map(who).join('、')} 不在 ${h.id} 的金圈內。`,
        ]);
      if (k === 3) {
        setTag(h, '');
        cast = null;
        next();
      }
    });
}
