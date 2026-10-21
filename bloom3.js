/* =====================================================================
 * 三式 3rd Bloom ＋ 三式後的幻影＋震驚＋凌空錯
 * ===================================================================== */

/* 三式（依 XivStrat）：場地圖 3；4 座塔在外圈 4 塊紅磚上；一個職能被點 🌹（Emblazon），站的灰磚會變紅；
   踩塔會引爆與塔相連的紅磚 → 紅磚不能把兩座塔連起來，否則全滅。
   XivStrat 以「內圈兩塊紅磚中間那塊灰磚」為新的 12 點（實際約 67.5°）。 */
function bloom3(next) {
  const set = floorSet(3),
    roseGrp = Math.random() < 0.5 ? 'S' : 'D',
    TOWER_R = 2.6;
  const TW = [67.5, 157.5, 247.5, 337.5].map(a => ({ a, ...posAt(a, 13.6), tile: 8 + Math.floor(a / 45) }));
  const NEWNORTH = 67.5,
    fa = f => (f + NEWNORTH) % 360; // 圖上角度 → 實際角度
  const ROSE_SPOT =
    roseGrp === 'S'
      ? { MT: fa(0), H2: fa(135), ST: fa(180), H1: fa(225) }
      : { D3: fa(0), D4: fa(135), D2: fa(180), D1: fa(225) };
  const TOWER_OF = roseGrp === 'S' ? { D3: 0, D4: 1, D2: 2, D1: 3 } : { MT: 0, H2: 1, ST: 2, H1: 3 };
  const AFTER = {
    [fa(0)]: { a: 22.5, r: 10.5 },
    [fa(135)]: { a: 157.5, r: 5.5 },
    [fa(180)]: { a: 202.5, r: 10.5 },
    [fa(225)]: { a: 337.5, r: 5.5 },
  }; // 放完花躲到不相連的灰磚
  // 等點名時的預站位（圖：XivStrat 三式機制圖）
  const PRE = {
    MT: { a: fa(354), r: 6.5 },
    ST: { a: fa(118), r: 6 },
    D1: { a: fa(241), r: 8.6 },
    D2: { a: fa(229), r: 6.2 },
    D3: { a: fa(192), r: 7 },
    D4: { a: fa(168), r: 7 },
    H1: { a: fa(146), r: 8.3 },
    H2: { a: fa(132), r: 10.4 },
  };
  setCast('Roseblood: 3rd Bloom', '魔法陣展開 · 3 式', 4);
  advice = '三式：以內圈兩塊紅磚中間那塊灰磚為新的 12 點，先到預備位置';
  setPlan(m => {
    const p = PRE[m.id];
    return posAt(p.a, p.r);
  }, 0.3);
  at(t + 1.2, () => {
    setRose(set);
    // 標出「新 12 點」方向，方便對照 XivStrat 的圖
    const p = posAt(NEWNORTH, 15.2),
      lb = makeLabel('新 12 點', '#ffe27a');
    lb.position.set(p.x, 1.6, p.z);
    lb.scale.multiplyScalar(1.3);
    addFx(lb, 22, false);
    const ar = new T.Mesh(
      new T.PlaneGeometry(3, 1.5).rotateX(-Math.PI / 2),
      new T.MeshBasicMaterial({ map: arrowTex(), transparent: true, depthWrite: false })
    );
    const q = posAt(NEWNORTH, 12.6),
      d = dirOf(NEWNORTH);
    ar.position.set(q.x, 0.12, q.z);
    ar.rotation.y = Math.atan2(-d.z, d.x);
    addFx(ar, 22, false);
  });
  let phase = 'pre';
  at(t + 4, () => {
    // 4 座塔
    TW.forEach(tw => {
      const g = new T.Group();
      const cyl = new T.Mesh(
        new T.CylinderGeometry(TOWER_R, TOWER_R, 3, 40, 1, true),
        new T.MeshBasicMaterial({
          color: 0x9fe8ff,
          transparent: true,
          opacity: 0.25,
          side: T.DoubleSide,
          depthWrite: false,
        })
      );
      cyl.position.y = 1.5;
      g.add(cyl, ringMesh(0, 0, TOWER_R - 0.2, TOWER_R, 0xdff8ff, 1));
      g.position.set(tw.x, 0, tw.z);
      addFx(g, 13, false);
    });
    setCast('Bud of Valor ＋ Emblazon', `${GROUP_NAME[roseGrp]}被點 🌹，其他人踩塔`, 7);
    const marked = members.filter(m => m.grp === roseGrp);
    marked.forEach(m => setTag(m, '🌹 放花', '#ff6b8a'));
    const roseRings = marked.map(m => {
      const g = ringMesh(0, 0, 0.9, 1.2, 0xff3a6e, 1, 0.11);
      scene.add(g);
      fx.push({ obj: g, born: t, until: t + 7, fade: false });
      return { m, g };
    });
    ticks.push(() => {
      roseRings.forEach(k => k.g.position.set(k.m.x, 0.11, k.m.z));
      return state !== 'running' || phase !== 'pre';
    });
    setPlan(
      m =>
        ROSE_SPOT[m.id] !== undefined
          ? posAt(ROSE_SPOT[m.id], 5.5)
          : (() => {
              const tw = TW[TOWER_OF[m.id]];
              return { x: tw.x, z: tw.z };
            })(),
      0.6
    );
    const mine =
      ROSE_SPOT[player.id] !== undefined
        ? `你被點 🌹：到新 12 點起算 ${['正上（12 點）', '右下（約 4～5 點）', '正下（6 點）', '左下（約 7～8 點）'][[0, 135, 180, 225].indexOf(Math.round((ROSE_SPOT[player.id] - NEWNORTH + 360) % 360))]} 的內圈灰磚放花`
        : `你踩塔：去新 12 點起算 ${['正上', '右', '正下', '左'][TOWER_OF[player.id]]} 的塔`;
    advice = mine;
    if (cfg.hintMe) {
      const p =
        ROSE_SPOT[player.id] !== undefined ? posAt(ROSE_SPOT[player.id], 5.5) : TW[TOWER_OF[player.id]];
      addFx(ringMesh(p.x, p.z, 0.5, 0.75, 0xe9c46a, 0.95, 0.12), 7, false);
    }
    // 放花：腳下的灰磚變紅
    at(t + 7, () => {
      if (state !== 'running') return;
      phase = 'drop';
      const reasons = [];
      marked.forEach(m => {
        setTag(m, '');
        const tid = tileOf(m.x, m.z);
        if (tid === 'center' || tid === null) {
          reasons.push(`${who(m)} 的 🌹 沒放在地板上。`);
          return;
        }
        if (roseSet.has(tid)) reasons.push(`${who(m)} 站在紅磚上放 🌹，直接爆炸。`);
        roseSet.add(tid);
        const sm = roseMesh[tid];
        if (sm) {
          sm.material.color.setHex(0xc8204e);
          sm.material.opacity = 0.62;
        }
        strongFlash(sectorMesh(tid, 0xff5c8a, 0.8, 0.07));
        m.vuln = t + 9;
      });
      if (reasons.length) return fail('三式 放花', reasons);
      cast = null;
      setCast('Alexandrian Holy', '塔判定，引爆與塔相連的紅磚', 5);
      advice =
        ROSE_SPOT[player.id] !== undefined
          ? '放完花了：你有魔法易傷，馬上離開紅磚，躲到不相連的灰磚上'
          : '繼續踩塔；確認沒有紅磚把兩座塔連在一起';
      setPlan(m => {
        if (ROSE_SPOT[m.id] === undefined) {
          const tw = TW[TOWER_OF[m.id]];
          return { x: tw.x, z: tw.z };
        }
        const s = AFTER[ROSE_SPOT[m.id]];
        return posAt(s.a, s.r);
      }, 0.3);
      if (cfg.hintMe && ROSE_SPOT[player.id] !== undefined) {
        const s = AFTER[ROSE_SPOT[player.id]],
          p = posAt(s.a, s.r);
        addFx(ringMesh(p.x, p.z, 0.5, 0.75, 0xe9c46a, 0.95, 0.12), 5, false);
      }
      // 塔判定
      at(t + 5, () => {
        if (state !== 'running') return;
        const reasons = [],
          boomAll = new Set();
        const compOf = tw => roseComponents(new Set([tw.tile]));
        TW.forEach((tw, i) => {
          const comp = compOf(tw);
          const soak = members.filter(
            m =>
              !m.dead &&
              (Math.hypot(m.x - tw.x, m.z - tw.z) <= TOWER_R || (comp.has(tileOf(m.x, m.z)) && !(m.vuln > t)))
          );
          if (!soak.length) reasons.push(`新 12 點起算 ${['正上', '右', '正下', '左'][i]} 的塔沒人踩。`);
          const linked = TW.filter((o, j) => j !== i && comp.has(o.tile));
          if (linked.length && i < TW.indexOf(linked[0]))
            reasons.push(
              `紅磚把 ${['正上', '右', '正下', '左'][i]} 塔和 ${['正上', '右', '正下', '左'][TW.indexOf(linked[0])]} 塔連在一起 → 全滅。`
            );
          comp.forEach(id => boomAll.add(id));
          strongFlash(circleMesh(tw.x, tw.z, TOWER_R, 0xbff4ff, 0.85));
        });
        explode(boomAll);
        members.forEach(m => {
          if (!m.dead && m.vuln > t && boomAll.has(tileOf(m.x, m.z)))
            reasons.push(`${who(m)} 帶著魔法易傷站在被引爆的紅磚上。`);
        });
        if (reasons.length) return fail('三式 踩塔', [...new Set(reasons)]);
        phase = 'done';
        cast = null;
        setCast('Thorned Catharsis', '全體 AOE', 4);
        advice = '';
        setPlan(m => posAt(CLOCK[m.id], 6), 0.5);
        at(t + 4, () => {
          screenFlash();
          cast = null;
          next();
        });
      });
    });
  });
}

/* 三式後：生成幻影 ＋ 凌空錯（13 秒讀條）＋ 震驚（一個職能被點持續月環，不能動）＋ 王國中放逐（TH、DPS 各一個分攤）
   XivStrat：開始時 TH 在 A 方向目標圈上集合、DPS 在 C 方向目標圈上集合；分攤後由「非月環組」引導第 1 刀，
   之後照 AABB（1、3 刀後換）／ABBA（2 刀後換）。 */
function escelons2(next) {
  const CAST_LEN = 13,
    L = ESC_LAYOUTS.zy,
    RING = 2.6,
    DIN = 1.5,
    DOUT = 3.2;
  const donutGrp = Math.random() < 0.5 ? 'S' : 'D',
    other = donutGrp === 'S' ? 'D' : 'S';
  coneGeo && coneGeo.dispose();
  coneGeo = new T.CircleGeometry(30, 24, -cfg.half, cfg.half * 2).rotateX(-Math.PI / 2);
  setCast('幻影生成', '召喚分身', 3);
  const sh = makeShade(180);
  fx.push({ obj: sh.g, born: t, until: t + 40, fade: false });
  setPlan(m => posAt(m.grp === 'S' ? 0 : 180, RING + 0.4), 0.3);
  advice = 'TH 到 A 方向目標圈上、DPS 到 C 方向目標圈上集合';
  at(t + 3.5, () => {
    esc = {
      start: t,
      castLen: CAST_LEN,
      seq: cfg.seqMode === 'rand' ? randomSeq() : cfg.seqMode.split(','),
      hitIdx: 0,
      next,
      L,
      first: other,
      exempt: (m, k) => k === 0 && m.grp === donutGrp,
    };
    esc.hitTimes = [0, 1, 2, 3].map(k => esc.start + CAST_LEN + 0.8 + k * cfg.gap);
    setCast('凌空錯', "Escelons' Fall（13 秒）", CAST_LEN);
    const stackPos = g => {
      const p = posAt(g === 'S' ? 0 : 180, RING);
      return p;
    };
    let stage = 'stack';
    setPlan(m => {
      const p = stackPos(m.grp),
        o = (ROLE_IDS.indexOf(m.id) / 8) * Math.PI * 2;
      if (stage === 'stack' || (stage === 'hold' && m.grp === donutGrp))
        return { x: p.x + Math.cos(o) * 0.45, z: p.z + Math.sin(o) * 0.45 };
      return posAt(L.ang[m.id], (wantClose(m, esc.hitIdx) ? L.close : L.far) + m.jit);
    }, 0.3);
    // 王國中放逐：TH、DPS 各一人分攤
    const sT = members.filter(m => m.grp === 'S')[rand(4)],
      sD = members.filter(m => m.grp === 'D')[rand(4)];
    setTag(sT, '分攤', '#e9c46a');
    setTag(sD, '分攤', '#e9c46a');
    advice = `先分攤：TH 在 A 側、DPS 在 C 側目標圈上；分攤後${GROUP_NAME[other]}去引導第 1 刀`;
    at(t + 4.3, () => {
      if (state !== 'running') return;
      const reasons = [];
      [
        [sT, 'S'],
        [sD, 'D'],
      ].forEach(([s, g]) => {
        strongFlash(circleMesh(s.x, s.z, 3, 0xffd36a, 0.8));
        const out = members.filter(m => m.grp === g && !m.dead && dist(m, s) > 3);
        if (out.length)
          reasons.push(`${GROUP_NAME[g]}分攤時 ${out.map(who).join('、')} 不在 ${s.id} 的分攤圈內。`);
        const extra = members.filter(m => m.grp !== g && dist(m, s) <= 3);
        if (extra.length) reasons.push(`${extra.map(who).join('、')} 跑進了${GROUP_NAME[g]}的分攤。`);
      });
      setTag(sT, '');
      setTag(sD, '');
      if (reasons.length) return fail('王國中放逐 分攤', reasons);
      stage = 'hold';
      members.forEach(m => {
        if (m.grp === donutGrp) setTag(m, '月環', '#5fd0ff');
      });
      advice =
        player.grp === donutGrp
          ? '你被點持續月環：留在原地不要動，等第 1 刀過'
          : `你沒有月環：照第 1 刀「${esc.seq[0] === 'close' ? '近 → 往圈內一步' : '遠 → 往圈外一步'}」分散引導`;
    });
    // 震驚：持續月環（讀條 3 秒，之後一直判定到第 1 刀）
    at(t + 6.7, () => {
      if (state !== 'running') return;
      const SLEN = 3;
      setCast('震驚 Shock', `${GROUP_NAME[donutGrp]}持續月環（凌空錯讀條中）`, SLEN);
      at(t + SLEN, () => {
        if (state !== 'running') return;
        setCast('凌空錯', "Escelons' Fall", esc.start + CAST_LEN - t);
        cast.start = esc.start;
        cast.len = CAST_LEN;
        const centers = members
          .filter(m => m.grp === donutGrp && !m.dead)
          .map(m => ({ x: m.x, z: m.z, id: m.id }));
        const until = esc.hitTimes[0] + 0.3;
        centers.forEach(c => {
          addFx(ringMesh(c.x, c.z, DIN, DOUT, 0x3d8cff, 0.4, 0.1), until - t, false);
          addFx(ringMesh(c.x, c.z, DOUT - 0.15, DOUT, 0x9fd4ff, 1, 0.11), until - t, false);
        });
        ticks.push(() => {
          if (state !== 'running' || t > until) {
            if (t > until)
              members.forEach(m => {
                if (m.grp === donutGrp) setTag(m, '');
              });
            return true;
          }
          for (const m of members) {
            if (m.dead) continue;
            for (const c of centers) {
              const d = Math.hypot(m.x - c.x, m.z - c.z);
              if (d > DIN && d < DOUT) {
                fail('震驚 持續月環', [
                  `${who(m)} 碰到了 ${c.id} 的持續月環（${m.grp === donutGrp ? '被點月環的人不能移動' : '沒月環的人要離月環 ' + DOUT + ' m 以上'}）。`,
                ]);
                return true;
              }
            }
          }
          return false;
        });
      });
    });
    // 第 1 刀之後月環消失，全員照凌空錯換位
    at(esc.hitTimes[0] + 0.05, () => {
      stage = 'free';
    });
    esc.hitTimes.forEach((ht, k) =>
      at(ht, () => {
        if (state === 'running') escHit(k);
      })
    );
    at(t + CAST_LEN * 0.4, () => {
      if (stage === 'stack') return;
    });
  });
}
