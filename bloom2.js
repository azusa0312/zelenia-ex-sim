/* =====================================================================
 * 二式 2nd Bloom
 * ===================================================================== */

/* 二式（依 XivStrat 圖）：固定紅磚配置 2；Thunder Slash 六刀（60° 扇形，順序 1北→2南→3東北→4西南→5東南→6西北，每刀約 1 秒）
   ＋ Thunder IV：第 1 刀同時鋼鐵或月環、第 4 刀同時另一個（鋼鐵／月環會引爆紅磚，劈砍不會）→ Specter of the Lost
   解法：先鋼鐵 → 4 外（單塊暗磚）→ 1 判定後到 6 內 → 4 判定後回 4；先月環 → 4 內 → 6 外 → 4 */
function bloom2(next) {
  const GAP = 1.1,
    set = floorSet(2),
    first = pickFirst(),
    second = first === 'circle' ? 'donut' : 'circle';
  const SLASH = [0, 180, 60, 240, 120, 300],
    SECT = ['北', '南', '東北', '西南', '東南', '西北'];
  const hits = SLASH.map((c, k) => ({
    k,
    shapes: [
      { type: 'cone', c, half: 30 },
      ...(k === 0 ? [{ type: first }] : k === 3 ? [{ type: second }] : []),
    ],
  }));
  // 依解法的站位：A = 4 號區（西南）單塊暗磚、B = 6 號區（西北）、C = 回到 4 號區
  // 先鋼鐵（D 側）：4 外單塊暗磚 → 6 內 → 4；先月環（B 側）：內圈東側單塊暗磚 → 5 外 → 3
  const A = first === 'circle' ? { a: 247.5, r: 12 } : { a: 112.5, r: 5.5 };
  const B = first === 'circle' ? { a: 295, r: 5.5 } : { a: 110, r: 12 };
  const C = first === 'circle' ? { a: 240, r: 10 } : { a: 60, r: 10 };
  const spotFor = k => (k <= 0 ? A : k <= 3 ? B : C); // k = 已判定完的刀數
  setCast('Roseblood: 2nd Bloom', '魔法陣展開 · 2 式', 4);
  setPlan(m => posAt(CLOCK[m.id], 6), 0.3);
  advice = '二式：鋼鐵／月環會引爆紅磚，劈砍不會';
  at(t + 1.2, () => setRose(set));
  at(t + 4, () => {
    const LEN = 6,
      T0 = t + LEN;
    setCast(
      'Thunder Slash ＋ Thunder IV',
      first === 'circle' ? '先鋼鐵、第 4 刀月環' : '先月環、第 4 刀鋼鐵',
      LEN
    );
    advice =
      first === 'circle'
        ? '先鋼鐵（走 D 側）：全員到 D～4 之間外圈那塊單獨的暗磚集合'
        : '先月環（走 B 側）：全員到 B 下方內圈那塊單獨的暗磚集合';
    let done = 0;
    setPlan(m => {
      const s = spotFor(done),
        o = (ROLE_IDS.indexOf(m.id) / 8) * Math.PI * 2,
        p = posAt(s.a, s.r);
      return { x: p.x + Math.cos(o) * 0.5, z: p.z + Math.sin(o) * 0.5 };
    }, 0.6);
    const hintAt = (k, life) => {
      if (!cfg.hintMe) return;
      const s = spotFor(k),
        p = posAt(s.a, s.r);
      addFx(ringMesh(p.x, p.z, 0.5, 0.75, 0xe9c46a, 0.95, 0.1), life, false);
    };
    // 預兆：六刀依序編號、鋼鐵／月環範圍
    // 鋼鐵／月環預兆：王腳下的藍圈；鋼鐵＝內圈（藍色實心）不能站，月環＝外圈不能站。第一個在讀條時出現，第二個在第 1 刀後出現
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
    ironTele(first, LEN); // 讀條一開始就出現
    at(t + 2, () => {
      hits.forEach(h => {
        h.shapes
          .filter(sh => sh.type === 'cone')
          .forEach(sh =>
            addFx(shapeMesh(sh, 0xffa040, 0.24, 0.083 + h.k * 0.002), LEN - 2 + h.k * GAP, false)
          );
        const p = posAt(SLASH[h.k], 12.5),
          lb = makeLabel(String(h.k + 1), '#ffd27a');
        lb.position.set(p.x, 1.2, p.z);
        addFx(lb, LEN - 2 + h.k * GAP, false);
      });
      hintAt(0, LEN - 2);
    });
    hits.forEach(h =>
      at(T0 + h.k * GAP, () => {
        if (state !== 'running') return;
        const k = h.k,
          reasons = [],
          touched = new Set();
        h.shapes.forEach(sh => {
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
            sh = h.shapes.find(s => inShape(m.x, m.z, s));
          if (sh)
            reasons.push(
              `${who(m)} 被第 ${k + 1} 刀（${SECT[k]}）${sh.type === 'cone' ? '的劈砍' : '時的' + SHAPE_NAME[sh.type]}打到。`
            );
          else if (boom.has(tid))
            reasons.push(
              `${who(m)} 站在被${k === 0 ? SHAPE_NAME[first] : SHAPE_NAME[second]}連鎖引爆的紅磚上。`
            );
          else if (tid === 'center') reasons.push(`${who(m)} 站在中央血池裡。`);
        });
        if (reasons.length) return fail(`二式 第 ${k + 1} 刀`, reasons);
        cast = null;
        done = k + 1;
        members.forEach(m => (m.reactAt = t + 0.1 + Math.random() * 0.15));
        if (k === 0) ironTele(second, 3 * GAP);
        if (k === 0) {
          advice =
            first === 'circle'
              ? '鋼鐵過了 → 穿到 D 上方（6 號區）內圈，等第 4 刀＋月環'
              : '月環過了 → 穿到 B 下方（5 號區）外圈，等第 4 刀＋鋼鐵';
          hintAt(1, 3 * GAP);
        }
        if (k === 3) {
          advice =
            first === 'circle'
              ? '第 4 刀過了 → 回到 4 號區（西南），躲最後的 5、6 刀'
              : '第 4 刀過了 → 馬上到 3 號區（東北），5 刀很快就來';
          hintAt(4, 2 * GAP);
        }
        if (k === 5) {
          advice = '';
          at(t + 1.2, () => specter(next));
        }
      })
    );
  });
}
