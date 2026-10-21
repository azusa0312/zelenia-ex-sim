/* =====================================================================
 * 一式 Roseblood Bloom
 * ===================================================================== */

/* 一式：Roseblood Bloom → Alexandrian Thunder II（3 道旋轉扇形）→ Thunder III（腳下雷圈散開）→ Thorned Catharsis */
function bloom1(next) {
  // 固定配置（XivStrat 場地圖 1）：內圈東～西南 3 塊相連暗磚
  const w0 = 2,
    set = floorSet(1);
  setCast('Roseblood Bloom', '場地出現玫瑰磚（亮磚＝蓄水池，會連鎖）', 4);
  setPlan(m => posAt(CLOCK[m.id], 6), 0.3);
  advice = '一式：全員到內圈東～西南那 3 塊相連的暗磚';
  at(t + 1.2, () => setRose(set));
  at(t + 4, () => {
    cast = null;
    thunder2(w0, () =>
      at(t + 1, () =>
        thunder3(() =>
          at(t + 1, () => {
            setCast('Thorned Catharsis', '全體 AOE', 4);
            advice = '';
            at(t + 4, () => {
              screenFlash();
              cast = null;
              next();
            });
          })
        )
      )
    );
  });
}
function thunder2(w0, next) {
  // 3 道 45° 扇形，起始時空隙正好在 3 塊暗磚的正中間，之後順／逆時針轉，跟著扇形後面走（被掃過的紅磚已引爆、變安全）
  const dir = Math.random() < 0.5 ? 1 : -1,
    STEP = 25,
    HALF = 22.5,
    arcA = 45 * w0;
  // 起始：其中一道扇形的後緣剛好在 3 塊暗磚的正中間（順時針時蓋住中間偏順時針那一半），全員貼在它後面追
  const g0 = arcA + 67.5 - dir * 37.5;
  const gapAt = k => g0 + dir * STEP * k,
    conesAt = k => [60, 180, 300].map(o => gapAt(k) + o);
  const T0 = t + 5,
    GAP = 1.4,
    NH = 5;
  setCast('Alexandrian Thunder II', `3 道扇形，${dir > 0 ? '順' : '逆'}時針旋轉`, 5);
  let curK = 0;
  const order = ['MT', 'ST', 'H1', 'H2', 'D1', 'D2', 'D3', 'D4'];
  setPlan(m => {
    const i = order.indexOf(m.id);
    return posAt(gapAt(curK) + dir * 19 + ((i % 4) - 1.5) * 6, i < 4 ? 4.6 : 6.6);
  }, 0.8);
  advice = `Thunder II：全員站內圈 3 塊暗磚的中間，扇形${dir > 0 ? '順' : '逆'}時針轉，跟在扇形後面往${dir > 0 ? '順' : '逆'}時針走`;
  const tele = k => {
    const life = k === 0 ? 5 : GAP;
    conesAt(k).forEach(c => {
      addFx(coneMesh(dirOf(c), (HALF * Math.PI) / 180, 16, 0xffd34d, 0.22, 0.085), life, false);
      // 旋轉方向箭頭：放在扇形前緣
      const a = c + dir * (HALF + 7),
        p = posAt(a, 11),
        r = (a * Math.PI) / 180,
        tx = dir * Math.cos(r),
        tz = dir * Math.sin(r);
      const ar = new T.Mesh(
        new T.PlaneGeometry(3.4, 1.7).rotateX(-Math.PI / 2),
        new T.MeshBasicMaterial({ map: arrowTex(), transparent: true, depthWrite: false })
      );
      ar.position.set(p.x, 0.11, p.z);
      ar.rotation.y = Math.atan2(-tz, tx);
      addFx(ar, life, false);
    });
  };
  {
    const lb = makeLabel(dir > 0 ? '順時針 ↻' : '逆時針 ↺', '#ffe27a');
    lb.position.set(0, 6.6, 0);
    lb.scale.multiplyScalar(1.7);
    addFx(lb, 5 + (NH - 1) * GAP + 0.4, false);
  }
  tele(0);
  for (let k = 0; k < NH; k++)
    at(T0 + k * GAP, () => {
      if (state !== 'running') return;
      const cones = conesAt(k),
        reasons = [];
      cones.forEach(c => strongFlash(coneMesh(dirOf(c), (HALF * Math.PI) / 180, 16, 0xffe066, 0.9, 0.09)));
      const hitTiles = new Set();
      cones.forEach(c => coneTiles(c, HALF).forEach(i => hitTiles.add(i)));
      const boom = roseComponents(hitTiles);
      explode(boom);
      members.forEach(m => {
        if (m.dead) return;
        const r = Math.hypot(m.x, m.z),
          a = angOfPt(m.x, m.z),
          tid = tileOf(m.x, m.z);
        if (r > 0.5 && cones.some(c => angDiff(a, c) <= HALF))
          reasons.push(`${who(m)} 被第 ${k + 1} 道雷擊扇形打到。`);
        else if (boom.has(tid))
          reasons.push(`${who(m)} 站在被引爆的玫瑰磚上（雷擊碰到亮磚，相連的亮磚全部爆炸）。`);
        else if (tid === 'center') reasons.push(`${who(m)} 站在中央血池裡。`);
      });
      if (reasons.length) return fail(`Thunder II 第 ${k + 1} 擊`, reasons);
      curK = k + 1;
      members.forEach(m => (m.reactAt = t + 0.15 + Math.random() * 0.2));
      if (k < NH - 1) tele(k + 1);
      else next();
    });
}
function thunder3(next) {
  const R = 2.5,
    LEN = 5;
  setCast('Alexandrian Thunder III', '每人腳下雷圈，散開、雷圈不能碰到亮磚', LEN);
  // 候選點：沒有紅磚的格子（含已引爆變安全的），雷圈不能碰到剩下的紅磚
  const cand = [];
  for (let w = 0; w < 8; w++) {
    const a = 45 * w + 22.5;
    if (!roseSet.has(8 + w)) {
      cand.push({ a, r: 10.6 });
      cand.push({ a, r: 13.4 });
    }
    if (!roseSet.has(w)) cand.push({ a, r: 5.5 });
  }
  const okC = c => {
    const p = posAt(c.a, c.r);
    return ![...circleTiles(p.x, p.z, R)].some(i => roseSet.has(i));
  };
  const spots = [];
  for (const c of [
    ...cand.filter(okC).filter(c => c.r > 6),
    ...cand.filter(okC).filter(c => c.r < 6),
    ...cand,
  ]) {
    if (spots.length >= 8) break;
    const p = posAt(c.a, c.r);
    if (
      spots.every(s => {
        const q = posAt(s.a, s.r);
        return Math.hypot(p.x - q.x, p.z - q.z) >= 2.7;
      })
    )
      spots.push(c);
  }
  spots.sort((x, y) => x.a - y.a);
  const order = ['MT', 'ST', 'H1', 'H2', 'D1', 'D2', 'D3', 'D4'];
  const spotOf = m => {
    const s = spots[order.indexOf(m.id)];
    return s;
  };
  setPlan(m => {
    const s = spotOf(m);
    return posAt(s.a, s.r);
  }, 0.4);
  const ps = spotOf(player);
  advice = `Thunder III：到 ${dirName(ps.a)}、離中心約 ${ps.r.toFixed(0)} m（已爆過的紅磚也安全），雷圈別碰到剩下的紅磚或別人`;
  if (cfg.hintMe) {
    const p = posAt(ps.a, ps.r);
    addFx(ringMesh(p.x, p.z, 0.5, 0.75, 0xe9c46a, 0.95, 0.1), LEN, false);
  }
  const marks = members.map(m => {
    const g = ringMesh(0, 0, R - 0.12, R, 0xffd34d, 0.9, 0.095);
    scene.add(g);
    fx.push({ obj: g, born: t, until: t + LEN, fade: false });
    return { m, g };
  });
  ticks.push(() => {
    marks.forEach(k => k.g.position.set(k.m.x, 0.095, k.m.z));
    return state !== 'running' || !cast || cast.name !== 'Alexandrian Thunder III';
  });
  at(t + LEN, () => {
    if (state !== 'running') return;
    cast = null;
    marks.forEach(k => scene.remove(k.g));
    const reasons = [],
      touched = new Set();
    members.forEach(src => {
      if (src.dead) return;
      strongFlash(circleMesh(src.x, src.z, R, 0xffe066, 0.85, 0.09), [
        ringMesh(src.x, src.z, R - 0.2, R, 0xffffff, 1, 0.1),
      ]);
      circleTiles(src.x, src.z, R).forEach(i => touched.add(i));
      members.forEach(m => {
        if (m !== src && !m.dead && dist(m, src) < R) reasons.push(`${who(m)} 被 ${who(src)} 的雷圈打到。`);
      });
    });
    const boom = roseComponents(touched);
    explode(boom);
    members.forEach(m => {
      const tid = tileOf(m.x, m.z);
      if (!m.dead && boom.has(tid)) reasons.push(`${who(m)} 站的亮磚被引爆（有人的雷圈碰到了相連的亮磚）。`);
    });
    if (reasons.length) return fail('Thunder III', [...new Set(reasons)]);
    advice = '';
    next();
  });
}
