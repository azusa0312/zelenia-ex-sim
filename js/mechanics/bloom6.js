/* =====================================================================
 * 六式 6th Bloom
 * ===================================================================== */

/* 六式（XivStrat P3 六式）：Bud of Valor 幻影召 4 座塔（固定在 4 塊紅磚上）＋ Emblazon（TN 或 DPS 4 人點 🌹）＋ 神聖破 Holy Hazard（兩組對向 120° 扇形）
   分組：每兩人負責 1/4 區域（NW: MT/D3、NE: ST/D4、SW: H1/D1、SE: H2/D2）；沒點花的踩組內的塔，點花的到「組內塔的對角」放花
   判定順序：放花 → 第一組扇形 → 第二組扇形＆踩塔。花靠近斜線放只會吃一次扇形。 */
function bloom6(next) {
  const set = floorSet(6),
    roseGrp = window.__forceRose || (Math.random() < 0.5 ? 'S' : 'D'),
    TOWER_R = 2.4;
  const Q = {
    NW: { S: 'MT', D: 'D3' },
    NE: { S: 'ST', D: 'D4' },
    SW: { S: 'H1', D: 'D1' },
    SE: { S: 'H2', D: 'D2' },
  };
  const QN = { NW: '左上（西北）', NE: '右上（東北）', SW: '左下（西南）', SE: '右下（東南）' };
  const TW = {
    NW: { a: 292.5, r: 12, tile: 14 },
    NE: { a: 67.5, r: 5.5, tile: 1 },
    SW: { a: 247.5, r: 5.5, tile: 5 },
    SE: { a: 112.5, r: 12, tile: 10 },
  };
  Object.values(TW).forEach(w => Object.assign(w, posAt(w.a, w.r)));
  const ROSE = {
    NW: { a: 322, r: 5.5 },
    NE: { a: 38, r: 12 },
    SE: { a: 142, r: 5.5 },
    SW: { a: 218, r: 12 },
  };
  const START = {
    NW: { a: 315, S: 6, D: 11 },
    NE: { a: 45, S: 6, D: 11 },
    SW: { a: 225, S: 10.5, D: 6 },
    SE: { a: 135, S: 10.5, D: 6 },
  }; // 圖：MT/ST/D1/D2 內圈，D3/D4/H1/H2 外圈
  const quadOf = id => Object.keys(Q).find(k => Q[k].S === id || Q[k].D === id);
  const isRose = m => m.grp === roseGrp;
  const spotOf = m => {
    const q = quadOf(m.id);
    return isRose(m) ? posAt(ROSE[q].a, ROSE[q].r) : { x: TW[q].x, z: TW[q].z };
  };
  const first = Math.random() < 0.5 ? 0 : 1,
    SETS = [
      [330, 150],
      [30, 210],
    ],
    ORDER = [SETS[first], SETS[1 - first]];
  const inCones = (m, cs) => Math.hypot(m.x, m.z) > 0.5 && cs.some(c => angDiff(angOfPt(m.x, m.z), c) <= 60);
  setCast('Roseblood: 6th Bloom', '魔法陣展開 · 6 式', 4);
  advice = '六式：兩人一組各負責 1/4 場地，先到自己那一區的斜線上';
  setPlan(m => {
    const q = quadOf(m.id),
      s = START[q];
    return posAt(s.a, s[m.grp]);
  }, 0.3);
  at(t + 1.2, () => setRose(set));
  let phase = 'pre';
  at(t + 4, () => {
    const sh = makeShade(0);
    addFx(sh.g, 20, false);
    addFx(sh.sword, 20, false);
    setCast('Bud of Valor ＋ Alexandrian Holy', '幻影召喚 4 座塔（在 4 塊紅磚上）', 3);
    at(t + 1.5, () => {
      Object.values(TW).forEach(tw => {
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
        addFx(g, 17, false);
      });
    });
  });
  at(t + 7, () => {
    if (state !== 'running') return;
    setCast('Emblazon', `${GROUP_NAME[roseGrp]}被點 🌹 → 到組內塔的對角放花；沒點到的踩塔`, 7);
    const marked = members.filter(isRose);
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
    setPlan(m => {
      const p = spotOf(m);
      return { x: p.x + (m.jit || 0) * 0.3, z: p.z };
    }, 0.6);
    const q = quadOf(player.id);
    advice = isRose(player)
      ? `你被點 🌹：你負責${QN[q]}，到組內塔的對角（${ROSE[q].r < 8 ? '內圈' : '外圈'}灰磚，靠近斜線）放花`
      : `你踩塔：${QN[q]}的塔（${TW[q].r < 8 ? '內圈' : '外圈'}紅磚）`;
    if (cfg.hintMe) {
      const p = spotOf(player);
      addFx(ringMesh(p.x, p.z, 0.5, 0.75, 0xe9c46a, 0.95, 0.12), 14, false);
    }
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
        if (roseSet.has(tid)) reasons.push(`${who(m)} 站在紅磚（塔）上放 🌹。`);
        roseSet.add(tid);
        const sm = roseMesh[tid];
        if (sm) {
          sm.material.color.setHex(0xc8204e);
          sm.material.opacity = 0.62;
        }
        strongFlash(sectorMesh(tid, 0xff5c8a, 0.8, 0.07));
        m.vuln = t + 9;
      });
      if (reasons.length) return fail('六式 放花', reasons);
      // 神聖破：兩組對向 120° 扇形
      const LEN = 6;
      setCast('Holy Hazard 神聖破', '兩組對向 120° 扇形 → 第二組同時塔判定', LEN);
      advice = isRose(player)
        ? '花放好了：留在原地（花靠斜線放只會吃一次扇形），不要碰到塔的紅磚'
        : '繼續踩塔，等兩組扇形打完';
      const COL = [0xffa040, 0xb48cff];
      ORDER.forEach((cs, k) =>
        cs.forEach(c => {
          const m = coneMesh(dirOf(c), Math.PI / 3, 16, COL[k], 0.16, 0.083 + k * 0.003);
          m.renderOrder = 8;
          addFx(m, LEN + k * 2, false);
          const p = posAt(c, 13.5),
            lb = makeLabel(`第 ${k + 1} 組`, k ? '#d9c4ff' : '#ffd27a');
          lb.position.set(p.x, 1.3, p.z);
          addFx(lb, LEN + k * 2, false);
        })
      );
      const hitCount = new Map();
      [0, 1].forEach(k =>
        at(t + LEN + k * 2, () => {
          if (state !== 'running') return;
          const cs = ORDER[k],
            reasons = [];
          cs.forEach(c => strongFlash(coneMesh(dirOf(c), Math.PI / 3, 16, COL[k], 0.7, 0.09)));
          members.forEach(m => {
            if (m.dead) return;
            if (inCones(m, cs)) hitCount.set(m, (hitCount.get(m) || 0) + 1);
            if (tileOf(m.x, m.z) === 'center') reasons.push(`${who(m)} 站在中央血池裡。`);
          });
          if (k === 1) {
            const boomAll = new Set();
            Object.keys(TW).forEach(qk => {
              const tw = TW[qk],
                comp = roseComponents(new Set([tw.tile]));
              const soak = members.filter(
                m =>
                  !m.dead &&
                  !(m.vuln > t) &&
                  (Math.hypot(m.x - tw.x, m.z - tw.z) <= TOWER_R || comp.has(tileOf(m.x, m.z)))
              );
              if (!soak.length) reasons.push(`${QN[qk]}的塔沒人踩。`);
              Object.keys(TW).forEach(o => {
                if (o > qk && comp.has(TW[o].tile))
                  reasons.push(`🌹 的紅磚把${QN[qk]}和${QN[o]}的塔連在一起 → 塔不算踩到，全員受傷。`);
              });
              comp.forEach(id => boomAll.add(id));
              strongFlash(circleMesh(tw.x, tw.z, TOWER_R, 0xbff4ff, 0.85));
            });
            explode(boomAll);
            members.forEach(m => {
              if (!m.dead && m.vuln > t && boomAll.has(tileOf(m.x, m.z)))
                reasons.push(`${who(m)} 帶著魔法易傷站在塔（或與塔相連的紅磚）上。`);
            });
          }
          if (reasons.length)
            return fail(`六式 ${k ? '第二組扇形＆踩塔' : '第一組扇形'}`, [...new Set(reasons)]);
          if (k === 0) {
            cast = null;
            return;
          }
          phase = 'done';
          cast = null;
          advice = '';
          const twice = members.filter(m => m.vuln && hitCount.get(m) >= 2);
          if (twice.includes(player))
            finishNote =
              '提醒：你帶著 🌹 魔法易傷吃了兩次扇形（減傷法有 LB 可以撐住；花靠斜線放可以只吃一次）。';
          at(t + 1.5, () => next());
        })
      );
    });
  });
}
