# 極澤蓮尼亞練習場

FF14「極 澤蓮尼亞（Recollection (Extreme)）」的 3D 機制練習模擬器。單一 HTML 檔，用 Three.js 繪製，其他 7 名隊友由 NPC 照攻略自動走位，你只控制自己；站錯會立刻停下並說明原因。

## 怎麼玩

- 直接開啟 `index.html`（或 GitHub Pages 網址）
- `WASD` 移動、拖曳轉視角、滾輪縮放、`空白鍵` 開始／重來
- 手機：左半邊螢幕是虛擬搖桿，右半邊拖曳轉視角
- 左側面板可選「全程」或單一機制、自己的職能、鋼鐵／月環先後、凌空錯設定、提示開關

## 已收錄機制

1. Thorned Catharsis
2. Shock ＋ 聖光塔
3. Specter of the Lost（坦克接線）
4. 凌空錯 Escelons' Fall
5. Stock Break
6. Blessed Barricade 小怪階段 ＋ Perfumed Quietus
7. 一式 Roseblood Bloom（Thunder II 旋轉扇形、Thunder III 散開）
8. 二式 2nd Bloom（雷鳴劍六刀 ＋ 鋼鐵／月環）
9. 三式 3rd Bloom（放花 ＋ 塔）
10. 幻影 ＋ 震驚 ＋ 凌空錯
11. 四式 4th Bloom（放花 ＋ 雷點名 ＋ 王國強放逐拉線分攤）
12. 幻影 ＋ 凌空錯 ＋ 分身半場刀
13. 五式 5th Bloom（場外刀 ＋ 六連劈 ＋ 鋼鐵／月環，扇形順序動畫）
14. 六式 6th Bloom（放花 ＋ 踩塔 ＋ 神聖破）

終盤製作中。

## 參考攻略

- B 站 子言姐姐〈【FF14】7.2攻略 泽莲尼娅歼殛战+设定考据〉
- XivStrat 泽莲尼娅歼殛战攻略（xivstrat.cn）

範圍大小與時間部分為推估值。FINAL FANTASY XIV © SQUARE ENIX，本專案為玩家自製練習工具，與官方無關。

## 檔案結構

```
index.html              頁面骨架（HUD、設定面板）
css/style.css           樣式
three.min.js            Three.js r152（MIT License），本機載入失敗時會改用 CDN
js/
  boot.js               先載入 Three.js，再依序載入下面的程式檔
  core/
    constants.js        常數、職能、站位、角度工具
    scene.js            渲染器、相機、地板、場標、王
    visuals.js          共用圖形（範圍、標籤、特效）
    members.js          8 名隊員
    engine.js           設定、時間軸引擎（at / setCast / setPlan）、成功與失敗
    roseblood.js        玫瑰磚地板、各式固定紅磚配置、連鎖引爆判定
  mechanics/
    opening.js          Catharsis、Shock＋塔、Specter of the Lost、Stock Break
    escelons.js         凌空錯
    adds.js             小怪階段
    bloom1.js … bloom6.js  一式～六式（三式、四式檔內含之後的幻影＋凌空錯）
  steps.js              全程模式的機制順序
  input.js              鍵盤、滑鼠、觸控
  main.js               每幀更新與主迴圈
```

程式檔是一般 `<script>`（不是 ES module），直接雙擊 `index.html` 也能開；檔案之間共用全域函式，載入順序寫在 `js/boot.js` 的 `APP_FILES`。

新增機制：在 `js/mechanics/` 加檔案 → 加進 `APP_FILES` → 在 `js/steps.js` 加一行 → 在 `index.html` 的「練習範圍」選單加選項。
