/* =====================================================================
 * 機制清單：全程模式依這個順序執行，也可在「練習範圍」單選
 * 新增機制時：在 mechanics/ 加檔案、在這裡加一行、在 index.html 的 #mode 選單加選項。
 * ===================================================================== */

const STEPS = [
  { id: 'cath', name: 'Thorned Catharsis', fn: n => catharsis(n) },
  { id: 'shock', name: 'Shock ＋ 聖光塔', fn: n => shock(n) },
  { id: 'specter', name: 'Specter of the Lost', fn: n => specter(n) },
  { id: 'esc', name: "凌空錯 Escelons' Fall", fn: n => escelons(n) },
  { id: 'stock', name: 'Stock Break', fn: n => stockBreak(n) },
  { id: 'adds', name: 'Blessed Barricade 小怪＋Perfumed Quietus', fn: n => barricade(n) },
  { id: 'bloom1', name: '一式 Roseblood Bloom', fn: n => bloom1(n) },
  { id: 'bloom2', name: '二式 2nd Bloom', fn: n => bloom2(n) },
  { id: 'bloom3', name: '三式 3rd Bloom', fn: n => bloom3(n) },
  { id: 'esc2', name: '幻影＋震驚＋凌空錯', fn: n => escelons2(n) },
  { id: 'stock2', name: 'Stock Break', fn: n => stockBreak(n) },
  { id: 'bloom4', name: '四式 4th Bloom', fn: n => bloom4(n) },
  { id: 'esc3', name: '幻影＋凌空錯＋半場刀', fn: n => escelons3(n) },
  { id: 'stock3', name: 'Stock Break', fn: n => stockBreak(n) },
  { id: 'bloom5', name: '五式 5th Bloom', fn: n => bloom5(n) },
  { id: 'bloom6', name: '六式 6th Bloom', fn: n => bloom6(n) },
];
