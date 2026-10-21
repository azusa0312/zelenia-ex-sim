/* =====================================================================
 * 時間軸引擎與結果
 * at(時間, fn) 排程事件；setCast 顯示讀條；setPlan 指定 NPC 目標位置；
 * fail／finish 結束這一輪並顯示結果。
 * ===================================================================== */

/* ---------- 設定 ---------- */
let cfg = {};
function readCfg() {
  cfg = {
    mode: $('mode').value,
    role: $('role').value,
    esc: ESC_LAYOUTS[$('layout').value],
    first: $('first').value,
    seqMode: $('seqMode').value,
    half: ((+$('ang').value / 2) * Math.PI) / 180,
    gap: +$('gap').value,
    hintSeq: $('hintSeq').checked,
    hintMe: $('hintMe').checked,
    ironFirst: $('ironFirst').value,
  };
}
$('ang').addEventListener('input', () => ($('angOut').textContent = $('ang').value + '°'));
$('gap').addEventListener('input', () => ($('gapOut').textContent = (+$('gap').value).toFixed(1) + ' 秒'));
document.querySelectorAll('#panel select,#panel input').forEach(el =>
  el.addEventListener('change', () => {
    el.blur();
    if (state !== 'running') {
      readCfg();
      placeIdle();
    }
  })
);
if (innerWidth < 720) $('panel').open = false;

let stats = { tries: 0, clears: 0 };
try {
  const s = JSON.parse(localStorage.getItem('zelenia-stats') || 'null');
  if (s) stats = s;
} catch (e) {}
function saveStats() {
  try {
    localStorage.setItem('zelenia-stats', JSON.stringify(stats));
  } catch (e) {}
}

/* ---------- 時間軸引擎 ---------- */
let state = 'idle',
  t = 0,
  events = [],
  ticks = [],
  cast = null,
  advice = '',
  planFn = null,
  tl = [];
function at(time, fn) {
  events.push({ at: time, fn });
  events.sort((a, b) => a.at - b.at);
}
function setCast(name, sub, len) {
  cast = { name, sub, start: t, len };
}
function setPlan(fn, delay = 0.3) {
  planFn = fn;
  members.forEach(m => (m.reactAt = t + delay + Math.random() * 0.35));
}
function tlMark(i, cls) {
  tl.forEach((e, j) => {
    if (j === i) e.cls = cls;
    else if (cls === 'now' && e.cls === 'now') e.cls = 'ok';
  });
  renderTl();
}
function renderTl() {
  $('tlList').innerHTML = tl
    .map(e => `<div class="ev ${e.cls || ''}"><i>${tl.indexOf(e) + 1}</i><span>${e.name}</span></div>`)
    .join('');
}

function placeIdle() {
  buildMembers(cfg.role);
  const startPos = m =>
    cfg.mode === 'esc' ? posAt(cfg.esc.ang[m.id], cfg.esc.start) : posAt(CLOCK[m.id], 8);
  members.forEach(m => {
    const p = startPos(m);
    m.x = m.tx = p.x;
    m.z = m.tz = p.z;
  });
  const d = dirOf(cfg.mode === 'esc' ? cfg.esc.ang[player.id] : CLOCK[player.id]);
  camYaw = Math.atan2(d.x, d.z);
  updateMeHud();
}

function start() {
  readCfg();
  clearFx();
  clearTethers();
  roseSet = null;
  boss.traverse(o => {
    if (o.material) {
      o.material.opacity = 1;
      o.material.transparent = false;
      o.material.needsUpdate = true;
    }
  });
  events = [];
  ticks = [];
  cast = null;
  advice = '';
  finishNote = '';
  planFn = null;
  esc = null;
  t = 0;
  state = 'running';
  placeIdle();
  $('banner').hidden = true;
  $('cast').hidden = true;
  indicator.visible = false;
  $('panel').open = false;
  const list = cfg.mode === 'all' ? STEPS : STEPS.filter(x => x.id === cfg.mode);
  tl = list.map(x => ({ name: x.name }));
  $('timeline').hidden = list.length < 2;
  let i = 0;
  const go = () => {
    if (state !== 'running') return;
    if (i >= list.length) return finish(list.length > 1 ? '全程完成' : list[0].name + ' 完成');
    tlMark(i, 'now');
    list[i].fn(() => {
      tlMark(i, 'ok');
      i++;
      at(t + 1.5, go);
    });
  };
  at(0.8, go);
  renderTl();
}

/* ---------- 結果 ---------- */
function fail(title, reasons) {
  if (state !== 'running') return;
  state = 'done';
  stats.tries++;
  saveStats();
  fx.forEach(f => (f.fade = false));
  const i = tl.findIndex(e => e.cls === 'now');
  if (i >= 0) tlMark(i, 'ng');
  const b = $('banner');
  b.className = 'hud box ng';
  b.hidden = false;
  b.innerHTML = `<h2>${title} 失敗</h2>${reasons.map(r => `<p>${r}</p>`).join('')}<p class="sub">按空白鍵再來一次</p>`;
  $('cast').hidden = true;
  updateMeHud();
}
function finish(title) {
  if (state !== 'running') return;
  state = 'done';
  stats.tries++;
  stats.clears++;
  saveStats();
  const b = $('banner');
  b.className = 'hud box ok';
  b.hidden = false;
  b.innerHTML = `<h2>${title || '四刀全部正確'}</h2>${esc && esc.summary ? `<p>${esc.summary}</p>` : ''}
    ${finishNote ? `<p>${finishNote}</p>` : ''}${cfg.mode === 'all' ? '<p class="sub">下一段「最終階段（Roseblood Withering／Rose Red）」製作中。</p>' : ''}<p class="sub">按空白鍵再來一次</p>`;
  $('cast').hidden = true;
  members.forEach(m => setTag(m, ''));
  updateMeHud();
}
