/* =====================================================================
 * 小怪階段：Blessed Barricade ＋ Perfumed Quietus
 * ===================================================================== */

/* Blessed Barricade 小怪階段（子言：被分身連線 → 引導左右刃；沒被連線 → 踩塔）。支援在西、DPS 在東 */
function makeShade(a) {
  const p = posAt(a, 15.2),
    g = new T.Group();
  const mat = new T.MeshStandardMaterial({
    color: 0x9b6bff,
    transparent: true,
    opacity: 0.75,
    roughness: 0.4,
    emissive: 0x3a1a77,
  });
  const body = new T.Mesh(new T.ConeGeometry(1.0, 2.6, 20, 1, true), mat);
  body.position.y = 1.3;
  const head = new T.Mesh(new T.SphereGeometry(0.3, 16, 12), mat);
  head.position.y = 2.9;
  g.add(body, head);
  g.position.set(p.x, 0, p.z);
  scene.add(g);
  const sword = new T.Mesh(new T.BoxGeometry(0.18, 3.2, 0.18), new T.MeshBasicMaterial({ color: 0xffe08a }));
  sword.visible = false;
  scene.add(sword);
  return { g, sword, x: p.x, z: p.z, a };
}
function lineTo(x0, z0, color) {
  const geo = new T.BufferGeometry().setAttribute(
    'position',
    new T.Float32BufferAttribute([x0, 2, z0, x0, 1, z0], 3)
  );
  const line = new T.Line(geo, new T.LineBasicMaterial({ color }));
  scene.add(line);
  return line;
}
function barricade(next) {
  const ROUNDS = 4,
    GAP = 8.5,
    LEN = 6.5,
    TR = 3,
    START = t;
  const WT = [225, 315, 225, 315],
    ET = [45, 135, 45, 135];
  setCast('Blessed Barricade', '王無敵，4 隻小怪＋分身', 3);
  boss.traverse(o => {
    if (o.material) {
      o.material.transparent = true;
      o.material.opacity = 0.35;
      o.material.needsUpdate = true;
    }
  });
  const adds = [45, 135, 225, 315].map(a => {
    const p = posAt(a, 11);
    const s = new T.Mesh(
      new T.SphereGeometry(0.9, 24, 18),
      new T.MeshStandardMaterial({ color: 0xd8264a, emissive: 0x5a0a1c, roughness: 0.3 })
    );
    s.position.set(p.x, 1.3, p.z);
    scene.add(s);
    fx.push({ obj: s, born: t, until: t + 999, fade: false });
    return s;
  });
  const shades = { S: makeShade(270), D: makeShade(90) };
  // 每人只會被連線一次：每組 4 人、4 輪，打亂順序輪流
  const queue = {
    S: shuffle(members.filter(m => m.grp === 'S')),
    D: shuffle(members.filter(m => m.grp === 'D')),
  };
  Object.values(shades).forEach(sh => {
    fx.push({ obj: sh.g, born: t, until: t + 999, fade: false });
    fx.push({ obj: sh.sword, born: t, until: t + 999, fade: false });
  });
  const homeOf = m => posAt(m.grp === 'S' ? WT[0] : ET[0], 6);
  setPlan(m => {
    const h = homeOf(m);
    return { x: h.x + m.jit * 3, z: h.z - m.jit * 2 };
  }, 0.5);
  advice = `小怪階段：${GROUP_NAME[player.grp]}去${player.grp === 'S' ? '西' : '東'}側`;
  const gaugeEnd = START + ROUNDS * GAP + 9;
  ticks.push(() => {
    if (cast && cast.name !== 'Perfumed Quietus') {
      cast.base = cast.base || cast.sub;
      cast.sub = `${cast.base}・以太 ${Math.min(99, Math.round(((t - START) / (gaugeEnd - START)) * 92))}/100`;
    }
    return state !== 'running' || t > gaugeEnd;
  });
  for (let k = 0; k < ROUNDS; k++)
    at(START + 3 + k * GAP, () => {
      if (state === 'running') barricadeRound(k);
    });
  function barricadeRound(k) {
    setCast(
      k % 2 ? 'Spearpoint Push' : 'Power Break',
      `第 ${k + 1} / ${ROUNDS} 輪：連線引導半場刀、其他人踩 3 人塔`,
      LEN
    );
    const round = {};
    ['S', 'D'].forEach(grp => {
      const sh = shades[grp],
        side = Math.random() < 0.5 ? 'L' : 'R';
      const holder = queue[grp][k];
      // 分身面向場中央；劍在左／右
      const fd = { x: -sh.x / 15.2, z: -sh.z / 15.2 },
        left = { x: fd.z, z: -fd.x },
        sv = side === 'L' ? left : { x: -left.x, z: -left.z };
      sh.sword.position.set(sh.x + sv.x * 1.3, 2.4, sh.z + sv.z * 1.3);
      sh.sword.rotation.set(sv.z * 0.5, 0, -sv.x * 0.5);
      sh.sword.visible = true;
      const bait = { x: (sh.x * 8) / 15.2, z: sv.z > 0 ? 12 : -12 }; // 往劍那一側的場邊拉
      const tw = posAt(grp === 'S' ? WT[k] : ET[k], 6);
      const tower = new T.Group();
      tower.add(
        new T.Mesh(
          new T.CylinderGeometry(TR, TR, 2.4, 40, 1, true),
          new T.MeshBasicMaterial({
            color: 0x9fe8ff,
            transparent: true,
            opacity: 0.18,
            side: T.DoubleSide,
            depthWrite: false,
          })
        )
      );
      tower.children[0].position.y = 1.2;
      tower.add(ringMesh(0, 0, TR - 0.18, TR, 0xdff8ff, 0.9));
      tower.position.set(tw.x, 0, tw.z);
      addFx(tower, LEN + 0.2, false);
      round[grp] = { sh, side, sv, holder, bait, tw, line: lineTo(sh.x, sh.z, 0xc77dff) };
      setTag(holder, '連線', '#c77dff');
    });
    setPlan(m => {
      const r = round[m.grp];
      if (m === r.holder) return r.bait;
      const others = members.filter(o => o.grp === m.grp && o !== r.holder),
        i = others.indexOf(m),
        a = i * 2.1;
      return { x: r.tw.x + Math.cos(a) * 1.1, z: r.tw.z + Math.sin(a) * 1.1 };
    }, 0.4);
    const mine = round[player.grp];
    advice =
      mine.holder === player
        ? `你被${player.grp === 'S' ? '西' : '東'}側分身連線：分身會轉向你，往${mine.sv.z > 0 ? '南' : '北'}邊場邊拉，把拿劍的手轉到場外`
        : `踩${player.grp === 'S' ? '西' : '東'}側的塔（${mine.tw.z > 0 ? '偏南' : '偏北'}），3 人以上才算數`;
    // 分身會轉向被連線的人；拿劍的手跟著轉，半場刀砍在劍那一側
    ['S', 'D'].forEach(g => {
      const r = round[g];
      if (cfg.hintMe) {
        r.preview = new T.Mesh(new T.PlaneGeometry(44, 22).rotateX(-Math.PI / 2), groundMat(0xc77dff, 0.1));
        r.preview.position.y = 0.072;
        addFx(r.preview, LEN, false);
      }
    });
    const tk = () => {
      ['S', 'D'].forEach(g => {
        const r = round[g],
          p = r.line.geometry.attributes.position;
        p.setXYZ(1, r.holder.x, 1, r.holder.z);
        p.needsUpdate = true;
        const dx = r.holder.x - r.sh.x,
          dz = r.holder.z - r.sh.z,
          L = Math.hypot(dx, dz) || 1,
          d = { x: dx / L, z: dz / L },
          lf = { x: d.z, z: -d.x },
          hv = r.side === 'L' ? lf : { x: -lf.x, z: -lf.z };
        r.sh.g.rotation.y = Math.atan2(d.x, d.z);
        r.sh.sword.position.set(r.sh.x + hv.x * 1.3, 2.4, r.sh.z + hv.z * 1.3);
        r.sh.sword.rotation.set(hv.z * 0.5, 0, -hv.x * 0.5);
        if (r.preview) {
          r.preview.position.set(r.sh.x + d.x * 22 + hv.x * 11, 0.072, r.sh.z + d.z * 22 + hv.z * 11);
          r.preview.rotation.y = Math.atan2(-d.z, d.x);
        }
      });
      return !round.live;
    };
    round.live = true;
    ticks.push(tk);
    at(t + LEN, () => {
      if (state !== 'running') return;
      round.live = false;
      cast = null;
      const reasons = [];
      ['S', 'D'].forEach(g => {
        const r = round[g];
        scene.remove(r.line);
        setTag(r.holder, '');
        r.sh.sword.visible = false;
        if (r.preview) scene.remove(r.preview);
        const dx = r.holder.x - r.sh.x,
          dz = r.holder.z - r.sh.z,
          L = Math.hypot(dx, dz) || 1,
          d = { x: dx / L, z: dz / L };
        const lf = { x: d.z, z: -d.x },
          hv = r.side === 'L' ? lf : { x: -lf.x, z: -lf.z };
        const plane = new T.Mesh(new T.PlaneGeometry(44, 22).rotateX(-Math.PI / 2), groundMat(0xd08cff, 0.7));
        plane.material.blending = T.AdditiveBlending;
        plane.position.set(r.sh.x + d.x * 22 + hv.x * 11, 0.075, r.sh.z + d.z * 22 + hv.z * 11);
        plane.rotation.y = Math.atan2(-d.z, d.x);
        addFx(plane, 1.0);
        members.forEach(m => {
          if (m === r.holder || m.dead) return;
          if ((m.x - r.sh.x) * hv.x + (m.z - r.sh.z) * hv.z > 0)
            reasons.push(
              `${who(m)} 被${g === 'S' ? '西' : '東'}側分身的半場刀砍到（連線的是 ${who(r.holder)}）。`
            );
        });
        const n = members.filter(m => !m.dead && Math.hypot(m.x - r.tw.x, m.z - r.tw.z) <= TR).length;
        if (n < 3) reasons.push(`${g === 'S' ? '西' : '東'}側的塔只有 ${n} 人，需要 3 人。`);
      });
      const add = adds[k];
      scene.remove(add);
      if (reasons.length) return fail(`小怪階段 第 ${k + 1} 輪`, reasons);
      if (k === ROUNDS - 1) {
        Object.values(shades).forEach(sh => {
          scene.remove(sh.g);
          scene.remove(sh.sword);
        });
        setCast('Perfumed Quietus', '小怪全滅，全體 AOE', 5);
        setPlan(m => posAt(CLOCK[m.id], 6), 0.5);
        advice = '小怪清完，回到時鐘位';
        at(t + 5, () => {
          screenFlash();
          cast = null;
          boss.traverse(o => {
            if (o.material) {
              o.material.opacity = 1;
              o.material.transparent = false;
              o.material.needsUpdate = true;
            }
          });
          next();
        });
      }
    });
  }
}
