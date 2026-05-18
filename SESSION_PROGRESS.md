# 點石成金蜂 開發進度記錄

> **更新日期**：2026-05-18
> **版本**：v2.15.0
> **GitHub**：https://github.com/cagoooo/comments

---

## 🎉 最近八次版本里程碑

### 🎓 v2.15.0（2026-05-18）— 學期評語報告 PDF（G2）

學期末利器版 Part 1。把教師最痛的「期末要寫評語、印成漂亮 PDF 給家長」一次解決。

**PDF 結構（每頁獨佔，瀏覽器自動分頁）**：
1. **封面** — 紙膠帶 + 🐝 + 學校 + 學期 + 班級 + 導師 + 學生人數
2. **學生名單** — 全班姓名/座號/評語狀態/主要特質 table
3. **每位學生一頁** — 座號徽章 + 姓名 + 特質 chips + 紙線稿評語區 + 簽名線 + 印章框
4. **班級統計頁** — 6 個 KPI + 熱門特質 TOP 12 + 結尾署名

**配置 UI**：
- 學校名 / 學期 / 導師姓名（自動從 currentUser 帶入）
- 5 個內容選項（學生名單 / 特質 / 統計 / 簽名 / 僅有評語的學生）
- 自動估算總頁數
- 預覽折疊區說明每頁內容

**蜜糖紙感 print CSS（170 行）**：
- 封面紙膠帶（鵝黃半透明，標誌性視覺）
- 紙線稿評語區（`repeating-linear-gradient` 模擬作業簿）
- 座號徽章（蜜糖底 + 厚黑邊框 + JetBrains Mono）
- 印章框（22mm 虛線方框）
- KPI 卡片 + 結尾蜜糖分隔線

**走 `window.print()` 純原生方案**（依 pdf-export-print-best-practice skill 鐵則）：
- 不用 jspdf / html2canvas（會偏移、切字）
- `body > *:not(#semester-report) { display: none !important; }` 隱藏主 UI
- `#semester-report` 變唯一可見

📁 新增檔案：
- `src/components/SemesterReportModal.jsx`（配置 UI）
- `src/components/semester-report/SemesterReportPrintable.jsx`（列印 DOM）
- `src/components/semester-report/semester-report-print.css`（蜜糖紙感印刷樣式）

**Bundle 影響**：主 bundle +1 KB（幾乎不變）+ lazy chunk ~7 KB gzip

---

### 📦 v2.14.1（2026-05-18）— 主 bundle 瘦身 145 KB gzip（TD7）

純優化版本（無新功能）。

**根因**：`InputPanel.jsx`（核心元件，**非 lazy**）靜態 import `parseExcelFile` → xlsx (~430 KB) 整個進主 bundle，連完全沒用 Excel 功能的使用者都要下載。

**修補**：把 `import { parseExcelFile }` 移到 click/drop handler 內 `await import('../utils/excelHelper')`。

**結果**：
- 主 bundle 1219 KB → **787 KB**（−432 KB raw）
- gzip 354 KB → **208 KB**（−145 KB gzip，**−41%**）
- excelHelper 自動成獨立 chunk，只在使用者選 Excel 檔時才下載
- 移動裝置 / 慢速網路使用者感受最明顯

📁 修改檔案：`src/components/InputPanel.jsx`（3 行改動）

> 為什麼不需要動 jspdf / html2canvas：PrintModal 早就是 lazy modal，那兩個庫**從來沒在主 bundle**。xlsx 才是唯一在主 bundle 的元兇。

---

### 📲 v2.14.0（2026-05-18）— 每日 LINE 彙整報告（A2）+ Firestore Rules 加固（C2）

教學現場深化版 Part 1。

**📲 A2 每日彙整報告**：
- `weeklyUsageReport`（每週一 08:00）→ `dailyUsageReport`（每天 21:00 台灣時間）
- LINE Flex 卡片含：活躍教師 / 評語生成數 / 成功率 / 失敗次數 / Top 使用者
- **失敗率 ≥ 20% 自動升級 warning**（深橘 header）讓管理員一眼看到
- 同時寫入 `reports/daily_YYYY-MM-DD` Firestore collection 供歷史查詢

**🔒 C2 Firestore Rules audit**：
- 4 大方向加強：
  1. 明確封鎖 server-only 子集合（`usage` / `reports` / `batchJobs` / `errors`）
  2. **角色升級防護**：把 `role` 加進 self-update 禁止欄位（嚴禁 client 升 admin）
  3. `schools` create 收緊（必須有 user doc）
  4. `adminConfig` 加 array type 檢查防 rule panic
- 抽出 `isAutoApprovalUpdate()` helper 讓邏輯清楚
- 規則行數 119 → 162（多出來的是註解 + 顯式 deny block）
- 完整相容性驗證：v2.9.0 auto-approval / admin approve / reject / schools create 4 條 role 寫入路徑全部相容

---

### 🌙 v2.13.0（2026-05-18）— 深色模式（H1）+ App Check（C1）

設計系統紅利收割 + 安全強化版。一發兩個建議組合。

**🌙 H1 深色模式**：
- v2.11 設計階段就預埋好 `[data-mode="dark"]` token，這次接管完成
- `useTheme` hook：light / dark / system 三段切換
- localStorage 即時 + Firestore 雲端同步
- `system` 模式自動跟 `prefers-color-scheme`
- `bootstrapTheme()` 在 React mount 前同步套用，**避免 FOUC**
- 三個 UI 切換點：Header avatar 旁快速按鈕（cycle）+ User dropdown segmented control（精確）+ PWA `theme-color` meta 同步
- 智慧 CSS override：Tailwind `bg-white` / `text-black` / `bg-gray-*` 在 dark 自動 redirect 到 token，省 sweep 27 個檔案
- 平滑 0.2s 色彩 transition

**🔐 C1 App Check Phase 1**：
- 前端 `initializeAppCheck` 整合 reCAPTCHA v3
- Site key 走 `VITE_APP_CHECK_SITE_KEY` env，**未設定時 fail-open**（不擋老師）
- `cloudFunctionsApi.js` 每個 fetch 自動帶 `X-Firebase-AppCheck` header
- 後端 middleware 三段模式：`off` / `observe` / `enforce`，預設 `off`（部署後零行為改變）
- 完整啟用 SOP 寫在 `src/firebase/config.js` 註解 + FUTURE_ROADMAP.md

📁 新增檔案：`src/hooks/useTheme.js`

---

### 📊 v2.12.0（2026-05-18）— 使用儀表板（B2）

收割 v2.11 設計系統紅利的第一個功能。把 Cloud Functions 後端早就記錄好的 `users/{uid}/usage/{date}` 拿出來畫圖。

**個人視角**：
- 配額狀況進度條（70% 變橘 / 90% 變紅）+ 4 個 KPI 卡
- 過去 30 天折線圖（每日呼叫）+ 圓餅圖（成功 / 失敗比例）
- 4 個彙整 KPI + 活躍天數 chip
- 即時 refresh

**管理員視角**（admin only）：
- 本月全校教師使用量排行長條圖（前 12 名）
- 全校呼叫 / 活躍教師 / 平均次/活躍教師 三個 KPI
- Server-side 驗證 admin role，非管理員 403

**後端新 endpoints**：
- `GET /usage/history?days=30`（1-90）— 補齊缺失日期為 0
- `GET /usage/admin` — 並行抓所有教師 usage 子集合彙整

**設計系統紅利**：
- 折線 / 圓餅 / 長條圖全部走 CSS 變數取色（未來加深色模式自動跟著切）
- 自訂紙感 Tooltip（JetBrains Mono 數字）
- recharts 397 KB 走動態 import，**不進主 bundle**

📁 新增檔案：`UsageDashboardModal.jsx` + `usage-dashboard/UsageCharts.jsx`

---

### 🎨 v2.11.0（2026-05-17）— A+D Fusion 蜜糖紙感工作台

整體 UI 大改版（12 batch 全套移植），**0 個破壞性 props 改動**。

- **新元件 9 個**：7 atoms（Chip / Btn / Card / StickerTab / BeeMascot / KPI / Icon）+ MobileTabBar + ModalShell
- **重寫 17 個業務元件**，介面零破壞
- 刪除 StudentCard.jsx（併入單一響應式 StudentRow.jsx）
- App.jsx 改動最小化：主色 token / MobileTabBar 渲染 / ⌘K shortcut

**12 Batch 涵蓋**：Token 系統 → 原子元件 → Icon set → Header → 主工作區 → 學生列表 → Idiom Sidebar → Modal 系統 → 登入頁 → 響應式 → 細節 → QA

**保留的關鍵行為（0 破壞）**：
- Firebase services（auth / firestore / storage）
- Gemini API 整合 + 字數 prompt 邏輯
- localStorage usage tracking（`idiom_usage_*`）
- 內嵌瀏覽器偵測 + popup-blocked fallback
- 30+ 學生列表 memo + areEqual 效能優化
- App 內 17 個 props 介面

📑 完整文件：[docs/design-handoff/HANDOFF.md](docs/design-handoff/HANDOFF.md) + [docs/design-handoff/TASKS.md](docs/design-handoff/TASKS.md)

---

### 📲 v2.10.0（2026-05-17）— LINE 即時通知與安全強化

**LINE 通知系統**（共用阿凱老師統一 LINE Bot Channel，純 push 模式）：
- 🆕 新使用者 Google 首次登入 → Firestore `users/{uid}` onCreate
- ✅ 使用者送出學校班級申請 → `applicationSubmittedAt` 從無到有
- ❌ `/generate` / `/adjust` / `/batch` 500 錯誤 → 60 秒節流告警

**Flex Message 卡片**：四色狀態（started 藍 / success 綠 / failed 紅 / warning 橙），Header 深色 -800（WCAG AA 對比 ≥ 5.4:1），bubble 改 `mega`（320 px）。

**Firestore 生命週期 Triggers**：`onUserCreated` / `onUserUpdated`，純 server-side 攔截，前端不需改動。

**安全強化**：
- 新增 `SECURITY.md` 說明 Firebase Web API Key 公開設計
- 處理 GitHub Secret Scanning Alert #1
- 透過 `gh api` 自動 dismiss alert

**Cloud Functions（v2.10.0 後共 5 支）**：`api` / `weeklyUsageReport` / `dailyCleanup` / `onUserCreated` / `onUserUpdated`

---

### 🚀 v2.9.x（2026-01-27）— 註冊流程與效率工具

- v2.9.0：免 Key 註冊、自動審核、自動建班級
- v2.9.1：Ctrl+S/G 快捷鍵、評語範本分類、循環依賴修復
- v2.9.2：批次操作（加標籤 / 清空 / 移班）+ Console 降噪

---

## 📂 截至目前的關鍵檔案結構

```
src/
├── components/             # 32 個元件，含 9 個新 atoms
│   ├── Btn.jsx Chip.jsx Card.jsx StickerTab.jsx BeeMascot.jsx
│   │   KPI.jsx Icon.jsx ModalShell.jsx MobileTabBar.jsx   ← v2.11
│   ├── Header.jsx                                          ← v2.11 重寫
│   ├── InputPanel.jsx GeneratePanel.jsx SearchBar.jsx StyleBar.jsx  ← v2.11 重寫
│   ├── StudentRow.jsx                                      ← v2.11 取代 Table + Card
│   ├── IdiomSidebar.jsx                                    ← v2.11 響應式
│   └── ... (6 個 Modal 全套 ModalShell)
├── styles/
│   └── tokens.css           # ← v2.11 設計 token 中樞
├── firebase/                # Auth / Firestore 服務
└── App.jsx                  # 主色 token + ⌘K shortcut

functions/
├── src/
│   ├── controllers/  generate.ts adjust.ts batch.ts usage.ts
│   ├── services/     gemini.ts notify-line.ts quota.ts     ← v2.10
│   ├── triggers/     userEvents.ts                          ← v2.10
│   └── index.ts                                             ← v2.10 註冊 secrets
└── ...

docs/
└── design-handoff/         # ← v2.11
    ├── HANDOFF.md           # 設計師 ↔ 工程師合約
    └── TASKS.md             # 12 batch 完整紀錄

SECURITY.md                  # ← v2.10（注意目前不在 main，需要另外補 PR）
firestore.rules              # 規則
firebase.json                # 配置
```

---

## 📋 接下來建議優先做的事情（從 FUTURE_ROADMAP.md 摘錄 Top 5）

> 詳見 [FUTURE_ROADMAP.md](FUTURE_ROADMAP.md) 完整 60+ 項建議與優先級矩陣

| 推薦序 | 項目 | 預估工時 | 為什麼推薦 |
|---|---|:---:|---|
| ✅ | ~~📊 使用儀表板 (B2)~~ | ~~4-5h~~ | **已完成 v2.12.0** |
| ✅ | ~~🌙 深色模式 (H1)~~ | ~~3-4h~~ | **已完成 v2.13.0** |
| ✅ | ~~🔐 App Check (C1) Phase 1~~ | ~~3-4h~~ | **已完成 v2.13.0**（等 reCAPTCHA 註冊後切 enforce）|
| ✅ | ~~📲 每日彙整 LINE 報告 (A2)~~ | ~~3h~~ | **已完成 v2.14.0** |
| ✅ | ~~🛡️ Firestore Rules Audit (C2)~~ | ~~2-3h~~ | **已完成 v2.14.0** |
| ✅ | ~~📦 TD7 Bundle 瘦身~~ | ~~1-2h~~ | **已完成 v2.14.1**（−145 KB gzip）|
| ✅ | ~~🎓 學期報告 PDF (G2)~~ | ~~1 天~~ | **已完成 v2.15.0**（實際 ~1.5h）|
| 🥇 | 📝 **學期累積評語 (E2)** | 2-3h | 學期末殺手功能（看完歷史叫 Gemini 出總評）|
| 🥈 | 💬 **Streaming 評語生成 (D2)** | 1-2 天 | 字一個一個浮現，UX 大躍進 |
| 🥉 | 🤖 **評語風格學習 (E1)** | 1 週 | Few-shot prompt，最大評語品質升級 |
| 4 | 📲 **A1 教師 LINE 綁定** | 3-4 天 | 解鎖 5 種通知場景 |
| 5 | 🔥 **D1 Cloud Tasks 批次佇列** | 1 週 | 可靠性升級（100+ 學生不 timeout）|

**接續組合推薦**（一週可完成）：E2 + D2
總計 ~3 天，完成後可發 v2.15.0「學期末利器版」。

---

## 🔧 技術架構

### 前端
- React 18 + Vite 6
- TailwindCSS 3（已對接設計 token）
- React.lazy 動態載入
- PWA 離線支援（vite-plugin-pwa）
- Noto Sans TC + JetBrains Mono（v2.11）

### 後端（Cloud Functions v2 — TypeScript）
- Firebase Firestore（使用者隔離）
- Firebase Auth（Google 登入）
- Google Gemini 2.5 Flash
- Firebase Secret Manager（API Key + LINE token）
- Firestore Triggers（v2.10）
- LINE Push API（v2.10）
- Cloud Scheduler（週報 + 每日清理）

### 部署
- Firebase Hosting（主要）
- GitHub Pages（備用）
- GitHub Actions 自動部署
- Cloud Functions 自動部署

---

## 🚀 部署指令

```bash
# 開發
npm run dev

# 建置
npm run build

# 部署 Firebase Hosting
npx firebase deploy --only hosting

# 部署 Cloud Functions（v2.10）
npx firebase deploy --only functions:api,functions:onUserCreated,functions:onUserUpdated

# GitHub Pages 自動部署（push 即可）
git push
```

---

## 📝 最新 Git Commits

```
40ba51b9 Merge pull request #2: A+D Fusion 設計系統升級
030b1fb6 🎨 升級設計系統至 A+D Fusion 蜜糖紙感工作台 (12 batch 全套移植)
790c9d3c Merge pull request #1: LINE 通知
8b352dbe 📲 新增 LINE 通知：使用者註冊 / 提交申請 / API 錯誤即時推播
3d51c370 版本發布 v2.9.1
```

---

## 🌐 正式網址

| 平台 | 網址 |
|------|------|
| Firebase | https://comments-67079.web.app |
| GitHub Pages | https://cagoooo.github.io/comments/ |
| Cloud Functions Health | https://api-o7l7hehf7q-de.a.run.app/health |

---

## ⚠️ 留意：尚未同步到 main 的東西

從 `claude/frosty-jackson-1ae027` 分支發現有兩個檔案**還沒進 main**：
- `SECURITY.md`（v2.10.0 寫的安全政策說明）— commit `0e55ddfb`
- 該分支上更舊的 FUTURE_ROADMAP.md v2.10.0 版（已被本次 v2.11.0 覆蓋）

**建議動作**：cherry-pick `0e55ddfb` 把 SECURITY.md 帶進 main，否則 GitHub Secret Scanning Alert 的處理 SOP 沒有正式文件背書。

```bash
# 在 main 上
git cherry-pick 0e55ddfb
```

---

**下次開發建議**：跑 **E2 學期累積評語（2-3h）** + **D2 Streaming 評語生成（1-2 天）** ⭐ — 完成後可發 v2.16.0「期末 UX 大躍進版」
