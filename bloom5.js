/* =====================================================================
 * 五式 5th Bloom
 * ===================================================================== */

/* 五式（依 XivStrat）：場地圖 5；同時出現 場外刀（半場直線 AOE）、六連劈（60° 扇形）、鋼鐵／月環（會引爆紅磚）。
   讀條時王會依序揮出六個方向的扇形（預演動畫），要看一劈在哪裡來決定跑法；整組配置每次隨機轉 0° 或 180°。
   判定順序：1 劈＋第一次鋼鐵/月環＋第一輪場外刀 → 2 → 3 → 4 劈＋第二次鋼鐵/月環＋第二輪場外刀 → 5 → 6。
   解法：先到「第二輪場外刀會蓋到的灰磚」依鋼鐵/月環站外/內圈；第 1 擊後全員順時針約 120° 到一劈的範圍，穿內外圈躲第二次鋼鐵/月環。 */
function bloom5(next) {
  const GAP = 1.1,
    set = floorSet(5),
    first = pickFirst(),
    second = first === 'circle' ? 'donut' : 'circle';
  const R = Math.random() < 0.5 ? 0 : 180,
    rot = a => (a + R) % 360; // 整組旋轉（場地圖 5 轉 180° 不變）
  const SLASH = [0, 180, 60, 240, 120, 300].map(rot);
  const S1 = R ? 'W' : 'E',
    S2 = R ? 'N' : 'S'; // 兩輪場外刀蓋的半場
  const SIDE_NAME = { E: '東半場', W: '西半場', S: '南半場', N: '北半場' };
  const hits = SLASH.map((c, k) => ({
    k,
    shapes: [
      { type: 'cone', c, half: 30 },
      ...(k === 0
        ? [{ type: first }, { type: 'half', side: S1 }]
        : k === 3
          ? [{ type: second }, { type: 'half', side: S2 }]
          : []),
    ],
  }));
  const A = { a: rot(237), r: first === 'circle' ? 12 : 5.5 }; // 第二輪場外刀範圍內的灰磚
  const B = { a: rot(15), r: first === 'circle' ? 5 : 12 }; // 對角的黑磚（一劈已打過的範圍內），穿內外圈
  const spotFor = k => (k <= 0 ? A : B);
  const inHalf = (x, z, side) => (side === 'E' ? x > 0 : side === 'W' ? x < 0 : side === 'S' ? z > 0 : z < 0);
  const inS = (x, z, sh) => (sh.type === 'half' ? inHalf(x, z, sh.side) : inShape(x, z, sh));
  const halfMesh = (side, color, op, y) => {
    const ew = side === 'E' || side === 'W';
    const m = new T.Mesh(
      new T.PlaneGeometry(ew ? 16.5 : 33, ew ? 33 : 16.5).rotateX(-Math.PI / 2),
      groundMat(color, op)
    );
    m.position.set(
      side === 'E' ? 8.25 : side === 'W' ? -8.25 : 0,
      y,
      side === 'S' ? 8.25 : side === 'N' ? -8.25 : 0
    );
    return m;
  };
  const ironTele = (type, life) => {
    const g = new T.Group();
    const body =
      type === 'circle'
        ? circleMesh(0, 0, 8, 0x3d8cff, 0.42, 0.11)
        : ringMesh(0, 0, 8, 16, 0x3d8cff, 0.42, 0.11);
    const edge = ringMesh(0, 0, 7.75, 8.25, 0x9fd4ff, 1, 0.12);
    body.renderOrder = edge.renderOrder = 8;
    g.add(body, edge);
    const lb = makeLabel(type === 'circle' ? '鋼鐵：內圈危險' : '月環：外圈危險', '#9fd4ff');
    lb.position.set(0, 5.4, 0);
    lb.scale.multiplyScalar(1.6);
    g.add(lb);
    addFx(g, life, false);
  };
  const bladeTele = (side, n, life) => {
    const m = halfMesh(side, 0xff7a2a, 0.2, 0.086);
    m.renderOrder = 7;
    addFx(m, life, false);
    const p = { E: { x: 17.2, z: 0 }, W: { x: -17.2, z: 0 }, S: { x: 0, z: 17.2 }, N: { x: 0, z: -17.2 } }[
      side
    ];
    const lb = makeLabel(`場外刀${n}`, '#ffb070');
    lb.position.set(p.x, 1.6, p.z);
    addFx(lb, life, false);
  };
  setCast('Roseblood: 5th Bloom', '魔法陣展開 · 5 式', 4);
  setPlan(m => posAt(CLOCK[m.id], 6), 0.3);
  advice = '五式：場外刀＋六連劈＋鋼鐵／月環同時來，先看王的揮劍順序';
  at(t + 1.2, () => setRose(set));
  at(t + 4, () => {
    const LEN = 9,
      T0 = t + LEN,
      PRE = 0.85;
    setCast(
      'Valorous Ascension ＋ Thunder Slash ＋ Thunder IV',
      first === 'circle' ? '先鋼鐵、第 4 劈月環' : '先月環、第 4 劈鋼鐵',
      LEN
    );
    advice = '看王依序揮出的六個方向，記住「一劈」在哪';
    let done = 0,
      moving = false;
    setPlan(m => {
      if (!moving) {
        const o = (ROLE_IDS.indexOf(m.id) / 8) * Math.PI * 2;
        return { x: Math.cos(o) * 3.4, z: Math.sin(o) * 3.4 };
      }
      const s = spotFor(done),
        o = (ROLE_IDS.indexOf(m.id) / 8) * Math.PI * 2;
      if (done >= 1) {
        const cw = (((s.a - angOfPt(m.x, m.z)) % 360) + 360) % 360; // 順時針繞場跑，不穿過中央血池
        if (cw > 30 && cw < 300) {
          const q = posAt(angOfPt(m.x, m.z) + 40, 6.5);
          return q;
        }
      }
      const p = posAt(s.a, s.r);
      return { x: p.x + Math.cos(o) * 0.5, z: p.z + Math.sin(o) * 0.5 };
    }, 0.4);
    const hintAt = (k, life) => {
      if (!cfg.hintMe) return;
      const s = spotFor(k),
        p = posAt(s.a, s.r);
      addFx(ringMesh(p.x, p.z, 0.5, 0.75, 0xe9c46a, 0.95, 0.12), life, false);
    };
    ironTele(first, LEN);
    bladeTele(S1, '①', LEN);
    // 揮劍預演：六個方向依序亮起（王轉向那個方向），之後留下編號淡色扇形直到判定
    SLASH.forEach((c, i) =>
      at(t + 0.6 + i * PRE, () => {
        if (state !== 'running') return;
        const m = coneMesh(dirOf(c), Math.PI / 6, 16, 0xffb347, 0.75, 0.095);
        m.material.blending = T.AdditiveBlending;
        m.renderOrder = 9;
        addFx(m, PRE * 0.9);
        const p = posAt(c, 9),
          lb = makeLabel(String(i + 1), '#fff3c4');
        lb.position.set(p.x, 2.4, p.z);
        lb.scale.multiplyScalar(1.8);
        addFx(lb, PRE * 0.9, false);
        boss.userData.face = c;
      })
    );
    at(t + 0.6 + 6 * PRE, () => {
      if (state !== 'running') return;
      boss.userData.face = undefined;
      moving = true;
      members.forEach(m => (m.reactAt = t + 0.2 + Math.random() * 0.3));
      hits.forEach(h => {
        addFx(shapeMesh(h.shapes[0], 0xffa040, 0.2, 0.083 + h.k * 0.002), T0 - t + h.k * GAP, false);
        const p = posAt(SLASH[h.k], 12.5),
          lb = makeLabel(String(h.k + 1), '#ffd27a');
        lb.position.set(p.x, 1.2, p.z);
        addFx(lb, T0 - t + h.k * GAP, false);
      });
      bladeTele(S2, '②', T0 - t);
      hintAt(0, T0 - t);
      advice = `一劈在${COMPASS(SLASH[0])}、場外刀②蓋${SIDE_NAME[S2]} → 先到${COMPASS(A.a)}的灰磚集合，${first === 'circle' ? '先鋼鐵站外圈' : '先月環站內圈'}`;
    });
    hits.forEach(h =>
      at(T0 + h.k * GAP, () => {
        if (state !== 'running') return;
        const k = h.k,
          reasons = [],
          touched = new Set();
        h.shapes.forEach(sh => {
          if (sh.type === 'half') {
            strongFlash(halfMesh(sh.side, 0xff9a4a, 0.8, 0.09));
            return;
          }
          const big = sh.type !== 'cone';
          strongFlash(
            shapeMesh(sh, big ? 0x8fd0ff : 0xffd060, big ? 0.85 : 0.8, 0.09),
            big
              ? [
                  sh.type === 'circle'
                    ? ringMesh(0, 0, 7.6, 8, 0xffffff, 1, 0.1)
                    : ringMesh(0, 0, 8, 8.4, 0xffffff, 1, 0.1),
                ]
              : null
          );
          if (sh.type === 'circle') for (let w = 0; w < 8; w++) touched.add(w);
          if (sh.type === 'donut') for (let w = 0; w < 8; w++) touched.add(8 + w);
        });
        const boom = roseComponents(touched);
        explode(boom);
        members.forEach(m => {
          if (m.dead) return;
          const tid = tileOf(m.x, m.z),
            sh = h.shapes.find(s => inS(m.x, m.z, s));
          if (sh)
            reasons.push(
              `${who(m)} 被第 ${k + 1} 擊的${sh.type === 'half' ? (k === 0 ? '場外刀①（' : '場外刀②（') + SIDE_NAME[sh.side] + '）' : sh.type === 'cone' ? COMPASS(sh.c) + '劈砍' : SHAPE_NAME[sh.type]}打到。`
            );
          else if (boom.has(tid)) reasons.push(`${who(m)} 站在被連鎖引爆的紅磚上。`);
          else if (tid === 'center') reasons.push(`${who(m)} 站在中央血池裡。`);
        });
        if (reasons.length) return fail(`五式 第 ${k + 1} 擊`, reasons);
        cast = null;
        done = k + 1;
        members.forEach(m => (m.reactAt = t + 0.1 + Math.random() * 0.15));
        if (k === 0) {
          ironTele(second, 3 * GAP);
          hintAt(1, 3 * GAP);
          advice = `第 1 擊過了 → 跑到對角${COMPASS(B.a)}的黑磚（一劈已打過的位置），${first === 'circle' ? '站內圈（等一下是月環）' : '站外圈（等一下是鋼鐵）'}，第 4 擊前要到；不要停在紅磚上`;
        }
        if (k === 3) advice = `留在${COMPASS(B.a)}的黑磚，等 5、6 劈結束（6 劈在${COMPASS(SLASH[5])}）`;
        if (k === 5) {
          advice = '';
          at(t + 1.2, () => specter(next));
        }
      })
    );
  });
}
