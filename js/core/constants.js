/* =====================================================================
 * 常數、職能、站位與小工具
 * 角度一律「由北起順時針」的度數；場地半徑 16（可走範圍）。
 * ===================================================================== */

const $ = id => document.getElementById(id);
const T = THREE;

const WALK_R = 16,
  ARENA_R = 20,
  SPEED = 6,
  DEBUFF = 5;
const GROUP_NAME = { S: '支援組', D: 'DPS 組' };
const ROLE_INFO = {
  MT: { grp: 'S', col: 0x4f8dff, tank: 1 },
  ST: { grp: 'S', col: 0x4f8dff, tank: 1 },
  H1: { grp: 'S', col: 0x47c27a },
  H2: { grp: 'S', col: 0x47c27a },
  D1: { grp: 'D', col: 0xe0565b },
  D2: { grp: 'D', col: 0xe0565b },
  D3: { grp: 'D', col: 0xe0565b },
  D4: { grp: 'D', col: 0xe0565b },
};
const ROLE_IDS = Object.keys(ROLE_INFO);
// 開場時鐘位（由北起順時針度數）；支援在正點，DPS 在斜點；搭檔 = 支援 +45°
const CLOCK = { MT: 0, ST: 90, H2: 180, H1: 270, D4: 45, D2: 135, D1: 225, D3: 315 };
const MARK_NAME = { 0: 'A', 90: 'B', 180: 'C', 270: 'D', 315: '1', 45: '2', 135: '3', 225: '4' };
const ESC_LAYOUTS = {
  zy: {
    close: 1.6,
    far: 5.6,
    start: 3.6,
    closeMax: 2.45,
    farMin: 4.4,
    closeTxt: '近（王的紅圈內）',
    farTxt: '遠（金色圓圈外）',
    ang: { MT: 345, ST: 15, H1: 315, H2: 45, D3: 225, D1: 195, D2: 165, D4: 135 },
  },
  clock: {
    close: 3.0,
    far: 13.8,
    start: 8,
    closeMax: 4.4,
    farMin: 10.2,
    closeTxt: '近（內側金圈內）',
    farTxt: '遠（外圈玫瑰磚）',
    ang: CLOCK,
  },
};
const dirOf = a => {
  const r = (a * Math.PI) / 180;
  return { x: Math.sin(r), z: -Math.cos(r) };
};
const posAt = (a, r) => {
  const d = dirOf(a);
  return { x: d.x * r, z: d.z * r };
};
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const rand = n => Math.floor(Math.random() * n);
const who = m => (m.isPlayer ? m.id + '（你）' : m.id);
