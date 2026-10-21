/* =====================================================================
 * 四式 4th Bloom ＋ 四式後的幻影＋凌空錯＋半場刀
 * ===================================================================== */

/* 四式（依 XivStrat）：場地圖 4；一個職能全員 🌹、另一個職能全員雷點名。
   花組固定放在南側（內圈 2、外圈 2），把南邊連成一大片紅磚（危險區）；雷組在北側散開，雷圈（約 4 m）不能碰到這片危險區。
   接著王國強放逐：全員先到放花對面（北）集合，面向王 TH 往左（東）、DPS 往右（西），站進相連紅磚做 8 人分攤。 */
function bloom4(next) {
  const set = floorSet(4),
    roseGrp = Math.random() < 0.5 ? 'S' : 'D',
    R = 4;
  const SLOT_S = { MT: 0, ST: 1, H1: 2, H2: 3 },
    SLOT_D = { D1: 0, D2: 1, D3: 2, D4: 3 };
  const slot = m => (m.grp === 'S' ? SLOT_S : SLOT_D)[m.id];
  const ROSE = [
    { a: 200, r: 6 },
    { a: 160, r: 6 },
    { a: 204, r: 12 },
    { a: 150, r: 12 },
  ];
  const THUN = [
    { a: 0, r: 5.5 },
    { a: 11, r: 14 },
    { a: 306, r: 11.8 },
    { a: 56, r: 13.8 },
  ]; // MT/D1? 依圖：內 N、外 N、左上、右上
  const THUN_IDX = { S: { MT: 0, ST: 1, H1: 2, H2: 3 }, D: { D2: 0, D1: 1, D3: 2, D4: 3 } };
  const isRose = m => m.grp === roseGrp;
  const spotOf = m => (isRose(m) ? ROSE[slot(m)] : THUN[THUN_IDX[m.grp][m.id]]);
  setCast('Roseblood: 4th Bloom', '魔法陣展開 · 4 式', 4);
  // 先在南側 4 格安全區（內圈 2、外圈 2 的灰磚）集合，點名後放花組留下、雷組往北
  setPlan(m => {
    const o = (ROLE_IDS.indexOf(m.id) / 8) * Math.PI * 2,
      p = posAt(180, 8);
    return { x: p.x + Math.cos(o) * 1.6, z: p.z + Math.sin(o) * 1.6 };
  }, 0.3);
  advice = '四式：先到南側 4 格灰磚（安全區）集合，等點名';
  at(t + 1.2, () => setRose(set));
  at(t + 4, () => {
    setCast(
      'Emblazon ＋ 雷點名',
      `${GROUP_NAME[roseGrp]}放 🌹（南側固定位）、${GROUP_NAME[roseGrp === 'S' ? 'D' : 'S']}雷點名（北側散開）`,
      7
    );
    members.forEach(m => setTag(m, isRose(m) ? '🌹 放花' : '⚡ 雷', isRose(m) ? '#ff6b8a' : '#ffe066'));
    const marks = members.map(m => {
      const g = isRose(m)
        ? ringMesh(0, 0, 0.9, 1.2, 0xff3a6e, 1, 0.11)
        : ringMesh(0, 0, R - 0.15, R, 0xffe066, 0.95, 0.11);
      scene.add(g);
      fx.push({ obj: g, born: t, until: t + 8, fade: false });
      return { m, g };
    });
    let live = true;
    ticks.push(() => {
      marks.forEach(k => k.g.position.set(k.m.x, 0.11, k.m.z));
      return state !== 'running' || !live;
    });
    setPlan(m => {
      const s = spotOf(m);
      return posAt(s.a, s.r);
    }, 0.6);
    const ps = spotOf(player);
    advice = isRose(player)
      ? `你放 🌹：留在南側，站到${ps.r < 8 ? '內圈' : '外圈'}${ps.a > 180 ? '偏西' : '偏東'}那格灰磚`
      : `你是雷點名：離開南側往北散開，雷圈不能碰到南邊那片紅磚和別人`;
    if (cfg.hintMe) {
      const p = posAt(ps.a, ps.r);
      addFx(ringMesh(p.x, p.z, 0.5, 0.75, 0xe9c46a, 0.95, 0.12), 8, false);
    }
    let dangerComp = new Set();
    at(t + 7, () => {
      if (state !== 'running') return;
      const reasons = [],
        roseTiles = new Set();
      members.filter(isRose).forEach(m => {
        setTag(m, '');
        const tid = tileOf(m.x, m.z);
        if (typeof tid !== 'number') {
          reasons.push(`${who(m)} 的 🌹 沒放在地板上。`);
          return;
        }
        if (roseSet.has(tid)) reasons.push(`${who(m)} 站在紅磚上放 🌹，直接爆炸。`);
        roseSet.add(tid);
        roseTiles.add(tid);
        const sm = roseMesh[tid];
        if (sm) {
          sm.material.color.setHex(0xc8204e);
          sm.material.opacity = 0.62;
        }
        strongFlash(sectorMesh(tid, 0xff5c8a, 0.8, 0.07));
      });
      if (reasons.length) return fail('四式 放花', reasons);
      dangerComp = roseComponents(roseTiles);
      // 標出危險區
      dangerComp.forEach(id => addFx(sectorMesh(id, 0xff2050, 0.35, 0.075), 12, false));
    });
    at(t + 8, () => {
      if (state !== 'running') return;
      live = false;
      cast = null;
      const reasons = [],
        touched = new Set();
      members
        .filter(m => !isRose(m))
        .forEach(src => {
          setTag(src, '');
          strongFlash(circleMesh(src.x, src.z, R, 0xffe066, 0.85, 0.09), [
            ringMesh(src.x, src.z, R - 0.2, R, 0xffffff, 1, 0.1),
          ]);
          const tiles = circleTiles(src.x, src.z, R);
          if ([...tiles].some(i => dangerComp.has(i)))
            reasons.push(`${who(src)} 的雷圈碰到南側花組的紅磚區 → 連鎖爆炸炸死花點名組。`);
          tiles.forEach(i => {
            if (!dangerComp.has(i)) touched.add(i);
          });
          members.forEach(m => {
            if (m !== src && dist(m, src) < R) reasons.push(`${who(m)} 被 ${who(src)} 的雷圈打到。`);
          });
        });
      explode(roseComponents(touched));
      if (reasons.length) return fail('四式 雷點名', [...new Set(reasons)]);
      banish3(dangerComp, next);
    });
  });
}
function banish3(comp, next) {
  const LEN = 6,
    TN = { a: 100, r: 12.5 },
    DP = { a: 260, r: 12.5 },
    SR = 3;
  setCast('王國強放逐', 'TH、DPS 各一個分攤：站進相連的紅磚，8 人平攤', LEN);
  let stage = 'gather';
  const sT = members.filter(m => m.grp === 'S')[rand(4)],
    sD = members.filter(m => m.grp === 'D')[rand(4)];
  setPlan(m => {
    const o = (ROLE_IDS.indexOf(m.id) / 8) * Math.PI * 2;
    if (stage === 'gather') {
      const p = posAt(0, 5);
      return { x: p.x + Math.cos(o) * 0.8, z: p.z + Math.sin(o) * 0.8 };
    }
    const s = m.grp === 'S' ? TN : DP,
      p = posAt(s.a, s.r);
    return { x: p.x + Math.cos(o) * 0.7, z: p.z + Math.sin(o) * 0.7 };
  }, 0.3);
  advice = '放完花：全員到放花對面（北側）集合';
  at(t + 1.5, () => {
    if (state !== 'running') return;
    stage = 'go';
    // 分攤 AOE 圈：TH、DPS 各一個，跟著被點的人
    [
      [sT, '#e9c46a'],
      [sD, '#e9c46a'],
    ].forEach(([m, c]) => setTag(m, '分攤', c));
    const rings = [sT, sD].map(m => {
      const g = new T.Group();
      g.add(circleMesh(0, 0, SR, 0xffc940, 0.22, 0.1), ringMesh(0, 0, SR - 0.18, SR, 0xffe08a, 1, 0.11));
      scene.add(g);
      fx.push({ obj: g, born: t, until: t + LEN, fade: false });
      return { m, g };
    });
    ticks.push(() => {
      rings.forEach(k => k.g.position.set(k.m.x, 0, k.m.z));
      return state !== 'running' || !cast || cast.name !== '王國強放逐';
    });
    members.forEach(m => (m.reactAt = t + 0.2 + Math.random() * 0.2));
    advice = `點名了：面向王，${player.grp === 'S' ? 'TH 往左（東側）' : 'DPS 往右（西側）'}，進${player.grp === 'S' ? sT.id : sD.id}的分攤圈，站在跟南側相連的紅磚上`;
    if (cfg.hintMe) {
      const s = player.grp === 'S' ? TN : DP,
        p = posAt(s.a, s.r);
      addFx(ringMesh(p.x, p.z, 0.5, 0.75, 0xe9c46a, 0.95, 0.12), LEN - 1.5, false);
    }
  });
  at(t + LEN, () => {
    if (state !== 'running') return;
    cast = null;
    setTag(sT, '');
    setTag(sD, '');
    const reasons = [];
    [
      [sT, 'S'],
      [sD, 'D'],
    ].forEach(([s, g]) => {
      strongFlash(circleMesh(s.x, s.z, SR, 0xffd36a, 0.85));
      const out = members.filter(m => m.grp === g && !m.dead && dist(m, s) > SR);
      if (out.length) reasons.push(`${GROUP_NAME[g]}的 ${out.map(who).join('、')} 不在 ${s.id} 的分攤圈內。`);
      if (!comp.has(tileOf(s.x, s.z)))
        reasons.push(`${who(s)} 的分攤圈不在相連的紅磚上，傷害沒有分到另一組。`);
    });
    const off = members.filter(m => !m.dead && !comp.has(tileOf(m.x, m.z)));
    if (off.length) reasons.push(`${off.map(who).join('、')} 沒站在相連的紅磚上。`);
    comp.forEach(id => strongFlash(sectorMesh(id, 0xffd36a, 0.7, 0.08)));
    if (reasons.length) return fail('王國強放逐', reasons);
    explode(comp);
    setCast('Thorned Catharsis', '全體 AOE（玫瑰滌）', 5);
    advice = '';
    setPlan(m => posAt(CLOCK[m.id], 6), 0.5);
    at(t + 5, () => {
      screenFlash();
      cast = null;
      next();
    });
  });
}
/* 四式後：幻影生成（A、C 各一分身）＋ 凌空錯：先躲 A 分身的半場刀 → 引導凌空錯 → 第 4 刀後躲 C 分身的半場刀 */
function escelons3(next) {
  const CAST_LEN = 13,
    L = ESC_LAYOUTS.zy;
  coneGeo && coneGeo.dispose();
  coneGeo = new T.CircleGeometry(30, 24, -cfg.half, cfg.half * 2).rotateX(-Math.PI / 2);
  setCast('幻影生成', 'A、C 各召喚一個分身', 3);
  const sides = { A: Math.random() < 0.5 ? 'E' : 'W', C: Math.random() < 0.5 ? 'E' : 'W' }; // 危險的半邊
  const shA = makeShade(0),
    shC = makeShade(180);
  [shA, shC].forEach(sh => {
    fx.push({ obj: sh.g, born: t, until: t + 40, fade: false });
    fx.push({ obj: sh.sword, born: t, until: t + 40, fade: false });
  });
  const setSword = (sh, side) => {
    const sx = side === 'E' ? 1 : -1;
    sh.sword.position.set(sh.x + sx * 1.3, 2.4, sh.z);
    sh.sword.rotation.set(0, 0, -sx * 0.5);
    sh.sword.visible = true;
    sh.g.rotation.y = Math.atan2(-sh.x, -sh.z);
  };
  setSword(shA, sides.A);
  setSword(shC, sides.C);
  const halfPlane = (side, color, op) => {
    const m = new T.Mesh(new T.PlaneGeometry(17, 34).rotateX(-Math.PI / 2), groundMat(color, op));
    m.position.set(side === 'E' ? 8.5 : -8.5, 0.075, 0);
    return m;
  };
  const safeX = side => (side === 'E' ? -1 : 1);
  // 一開始先站好凌空錯的位置（TH 王前、DPS 王後），快判定時再躲 A 分身的半場刀，躲完站回去
  setPlan(m => posAt(L.ang[m.id], L.start), 0.3);
  advice = `先站好凌空錯的位置；A 的分身劍在${sides.A === 'E' ? '東' : '西'}側，等一下要躲到${sides.A === 'E' ? '西' : '東'}半場`;
  if (cfg.hintMe) addFx(halfPlane(sides.A, 0xd08cff, 0.14), 16, false);
  at(t + 3, () => {
    esc = {
      start: t,
      castLen: CAST_LEN,
      seq: cfg.seqMode === 'rand' ? randomSeq() : cfg.seqMode.split(','),
      hitIdx: 0,
      next,
      L,
      adviceUntil: t + CAST_LEN - 0.6,
    };
    esc.first = cfg.first === 'auto' ? (esc.seq[0] === 'close' ? 'S' : 'D') : cfg.first;
    esc.hitTimes = [0, 1, 2, 3].map(k => esc.start + CAST_LEN + 1.6 + k * cfg.gap);
    setCast('凌空錯', "Escelons' Fall（13 秒）", CAST_LEN);
    at(esc.start + CAST_LEN - 3.2, () => {
      if (state !== 'running') return;
      advice = `躲 A 分身：移到${sides.A === 'E' ? '西' : '東'}半場，判定後馬上站回凌空錯位置`;
      setPlan(m => {
        const p = posAt(L.ang[m.id], L.start);
        const sx = safeX(sides.A);
        return {
          x:
            sx > 0
              ? Math.max(p.x, 0.9) + (p.x < 0.9 ? 0.6 : 0)
              : Math.min(p.x, -0.9) - (p.x > -0.9 ? 0.6 : 0),
          z: p.z,
        };
      }, 0.1);
    });
    // A 分身半場刀：讀條快結束時判定
    at(esc.start + CAST_LEN - 0.6, () => {
      if (state !== 'running') return;
      strongFlash(halfPlane(sides.A, 0xd08cff, 0.75));
      const hit = members.filter(m => !m.dead && (sides.A === 'E' ? m.x > 0 : m.x < 0));
      if (hit.length)
        return fail('A 分身半場刀', [
          `${hit.map(who).join('、')} 站在 A 分身劍那一側（${sides.A === 'E' ? '東' : '西'}半場）。`,
        ]);
      shA.sword.visible = false;
      setPlan(m => posAt(L.ang[m.id], (wantClose(m, esc.hitIdx) ? L.close : L.far) + m.jit), 0.1);
      advice = '';
    });
    esc.hitTimes.forEach((ht, k) =>
      at(ht, () => {
        if (state === 'running') escHit(k);
      })
    );
    // 覆寫凌空錯結束後的流程：先躲 C 分身
    esc.next = () => {
      advice = `第 4 刀後：C 的分身劍在${sides.C === 'E' ? '東' : '西'}側 → 躲到${sides.C === 'E' ? '西' : '東'}半場`;
      if (cfg.hintMe) addFx(halfPlane(sides.C, 0xd08cff, 0.14), 2.2, false);
      setPlan(m => {
        const o = (ROLE_IDS.indexOf(m.id) / 8) * Math.PI * 2;
        return { x: safeX(sides.C) * 3.2 + Math.cos(o) * 0.8, z: Math.sin(o) * 1.6 };
      }, 0.1);
      setCast('分身半場刀', 'C 分身', 2.2);
      at(t + 2.2, () => {
        if (state !== 'running') return;
        strongFlash(halfPlane(sides.C, 0xd08cff, 0.75));
        shC.sword.visible = false;
        cast = null;
        const hit = members.filter(m => !m.dead && (sides.C === 'E' ? m.x > 0 : m.x < 0));
        if (hit.length)
          return fail('C 分身半場刀', [
            `${hit.map(who).join('、')} 站在 C 分身劍那一側（${sides.C === 'E' ? '東' : '西'}半場）。`,
          ]);
        advice = '';
        next();
      });
    };
  });
}
