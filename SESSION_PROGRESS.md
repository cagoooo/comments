# 點石成金蜂 開發進度記錄

> **更新日期**：2026-05-18
> **版本**：v2.15.0
> **GitHub**：https://github.com/cagoooo/comments
> **線上**：https://comments-67079.web.app · https://cagoooo.github.io/comments/

---

## 📊 一張圖看 v2.10 → v2.15 全部成果

```
v2.10.0  📲 LINE 即時通知系統           ┐
v2.11.0  🎨 A+D Fusion 蜜糖紙感工作台    ├─ 設計系統 + 通知基建（已完成）
                                       ┘

v2.12.0  📊 使用儀表板 (B2)              ┐
v2.13.0  🌙 深色模式 (H1)                │
         🔐 App Check Phase 1 (C1)       ├─ 設計系統紅利收割（已完成）
v2.14.0  📲 每日 LINE 彙整報告 (A2)      │
         🔒 Firestore Rules 加固 (C2)    │
v2.14.1  📦 主 bundle 瘦身 145 KB (TD7)  ┘

v2.15.0  🎓 學期評語報告 PDF (G2)        ─ 學期末利器版 Part 1（已完成）

v2.16.0  📝 學期累積評語 (E2)            ┐
         🏆 獎狀印製 (L1)                 ├─ 學期末利器版 Part 2（推薦下一步）
         📦 PrintModal 砍 jspdf (TD9)    ┘

v2.17.0+ 💬 Streaming 評語 (D2)          ┐
         📲 教師 LINE 綁定 (A1)            ├─ 中期目標
         🤖 評語風格學習 (E1)             ┘
```

---

## 🎉 七連發版本里程碑（v2.12.0 → v2.15.0）

### 🎓 v2.15.0（2026-05-18）— 學期評語報告 PDF（G2）

**學期末利器版 Part 1**。把教師最痛的「期末要寫評語、印成漂亮 PDF 給家長」一次解決。

- 4 段式 PDF：封面 / 學生名單 / 每生一頁 / 班級統計
- 蜜糖紙感 print CSS（170 行）：紙膠帶、紙線稿評語區、座號徽章、印章框
- 走 `window.print()` 純原生方案（依 pdf-export-print-best-practice skill）
- Bundle 影響：主 bundle +1 KB（lazy 載入），其他人沒用功能完全不受影響
- **比預估快 5×**：roadmap 估 1 天，實際 ~1.5h（v2.11 設計 token 已備）

📁 新增：`SemesterReportModal.jsx` + `semester-report/SemesterReportPrintable.jsx` + `semester-report/semester-report-print.css`

---

### 📦 v2.14.1（2026-05-18）— 主 bundle 瘦身 145 KB gzip（TD7）

純優化（無新功能）。

- 根因：`InputPanel.jsx`（**核心元件非 lazy**）靜態 import `parseExcelFile` → xlsx 600 KB 整個進主 bundle
- 修補：3 行改動，移到 drop handler 內 dynamic import
- 結果：主 bundle **354 KB gzip → 208 KB gzip（−41%）**
- 不拖 Excel 的使用者**首次載入快 41%**

---

### 📲 v2.14.0（2026-05-18）— 每日 LINE 彙整報告（A2）+ Firestore Rules 加固（C2）

**教學現場深化版 Part 1**。

**A2**：`weeklyUsageReport`（每週一）→ `dailyUsageReport`（每天 21:00）
- Flex 卡：活躍教師 / 評語生成 / 成功率 / Top 使用者
- 失敗率 ≥ 20% 自動升級 warning（深橘 header），管理員一眼看到
- 寫入 `reports/daily_*` Firestore collection 供歷史查詢

**C2**：4 大方向加強 firestore.rules
- 封鎖 server-only 子集合（usage / reports / batchJobs / errors）
- **角色升級防護**：role 加進 self-update 禁止欄位（嚴禁 client 升 admin）
- `schools` create 收緊（必須有 user doc）
- `adminConfig` 加 array type 檢查防 rule panic
- 抽出 `isAutoApprovalUpdate()` helper

---

### 🌙 v2.13.0（2026-05-18）— 深色模式（H1）+ App Check Phase 1（C1）

**設計系統紅利收割 + 安全強化版**。

**H1**：
- `useTheme` hook：light / dark / system 三段切換
- localStorage 即時 + Firestore 跨裝置同步
- `bootstrapTheme()` 在 React mount 前同步套用避免 FOUC
- Header avatar 旁快速 cycle button + user dropdown 內 3-option picker
- PWA `theme-color` meta 同步切換
- **智慧 CSS override**：`bg-white` / `text-black` / `bg-gray-*` 在 dark 自動 redirect 到 token，省 sweep 27 個檔案

**C1**：
- 前端 `initializeAppCheck` 整合 reCAPTCHA v3，未設 site key fail-open
- 後端 middleware 三段 `APP_CHECK_MODE: off / observe / enforce`
- 預設 off（部署後零行為改變），等使用者註冊 reCAPTCHA + 觀察 1-2 天後切 observe → enforce

---

### 📊 v2.12.0（2026-05-18）— 使用儀表板（B2）

**收割 v2.11 設計系統紅利的第一個功能**。

- 個人視角：配額狀況 + 4 KPI + 30 天折線 + 成功/失敗圓餅 + 活躍天數 chip
- 管理員視角（admin only）：本月全校教師排行長條圖 + 3 個彙整 KPI
- 後端新 endpoints：`GET /usage/history?days=30` + `GET /usage/admin`
- recharts 397 KB 走動態 import，**不進主 bundle**
- 設計紅利：圖表 token 取色，未來加深色模式自動跟著切

---

## 🚀 v2.15.0 解鎖的新方向（推薦下一步）

### Combo：v2.16.0 學期末利器版 Part 2（總計 ~10h）

| 推薦序 | 項目 | 預估 | 為什麼 |
|---|---|:---:|---|
| 🥇 | 📝 **E2 學期累積評語** | 2-3h | 跟 G2 直接合作：Gemini 看完該生歷史 → 出學期總評 → 進 PDF |
| 🥈 | 🏆 **L1 獎狀印製** | 4-6h | G2 印刷基建首發應用（**砍半工時** vs 原本 F2 估的 1 天）|
| 🥉 | 📄 **L4 單一學生 PDF 抽印** | 1-2h | 家長個別來要不用印整本 |
| 4 | 📦 **TD9 PrintModal 改 window.print** | 1-2h | 砍 178 KB gzip lazy chunk + 跟 G2 pattern 一致 |
| 5 | 🔐 **C1.5 App Check Enforce** | 1-2h | Phase 1 已備，等使用者註冊 reCAPTCHA 後就切 |

### 後續中期目標

- **D2 Streaming 評語生成（1-2 天）**：字一個一個浮現，UX 大躍進
- **A1 教師 LINE 綁定（3-4 天）**：解鎖 5 種通知場景（配額預警 / 批次完成 / 未寫評語提醒等）
- **E1 評語風格學習（1 週）**：Few-shot prompt，最大評語品質升級

---

## 📂 完整檔案結構

```
src/
├── components/
│   ├── atoms/ (v2.11) — Btn / Chip / Card / StickerTab / BeeMascot / KPI / Icon
│   ├── ui/ (v2.11) — ModalShell
│   ├── Header.jsx (v2.13 主題 picker + v2.15 學期報告 entry)
│   ├── MobileTabBar.jsx (v2.12+ 多 entry)
│   ├── DashboardModal.jsx — 班級統計（v2.11 重寫）
│   ├── UsageDashboardModal.jsx (v2.12) — API 使用儀表板
│   ├── SemesterReportModal.jsx (v2.15) — 學期報告 PDF ⭐ NEW
│   ├── PrintModal.jsx — 快速列印（即將被 TD9 改造）
│   └── ... (其他 17 個 v2.11 重寫的元件)
├── components/
│   ├── usage-dashboard/UsageCharts.jsx (v2.12) — recharts lazy
│   └── semester-report/ (v2.15) ⭐ NEW
│       ├── SemesterReportPrintable.jsx
│       └── semester-report-print.css
├── hooks/
│   ├── useTheme.js (v2.13) — light/dark/system
│   ├── useDialog.js / useStudents.js
├── firebase/
│   ├── config.js (v2.13 App Check)
│   └── ...
├── styles/
│   └── tokens.css (v2.11 + v2.13 dark)
└── utils/
    ├── cloudFunctionsApi.js (v2.12 + v2.13 App Check header)
    ├── excelHelper.js (v2.14.1 lazy)
    └── geminiApi.js

functions/
├── src/
│   ├── controllers/
│   │   ├── generate.ts / adjust.ts / batch.ts
│   │   └── usage.ts (v2.12 加 /history + /admin)
│   ├── middleware/
│   │   └── auth.ts (v2.13 加 App Check 三段)
│   ├── scheduled/
│   │   └── reports.ts (v2.14 改 dailyUsageReport)
│   ├── services/
│   │   ├── gemini.ts / quota.ts
│   │   └── notify-line.ts (v2.10 + v2.14 加 notifyDailyReport)
│   ├── triggers/
│   │   └── userEvents.ts (v2.10)
│   └── index.ts

firestore.rules (v2.14 加固)
firebase.json
```

---

## 🏆 累積戰績統計

### 完成項目數
**72 項功能完成**（v1.0.0 → v2.15.0）

### 七連發 7 個版本工時對比
| 項目 | 預估 | 實際 | 效率 |
|---|:---:|:---:|:---:|
| B2 使用儀表板 | 4-5h | ~4h | 1.1× |
| H1 深色模式 | 3-4h | ~3h | 1.2× |
| C1 App Check | 3-4h | ~2h | 1.8× |
| A2 每日 LINE | 3h | ~1.5h | 2.0× |
| C2 Rules audit | 2-3h | ~1.5h | 1.7× |
| TD7 Bundle 瘦身 | 1-2h | ~30 min | 3.0× |
| G2 學期報告 | 1 天 | ~1.5h | **5.3×** |
| **合計** | **~25-30h** | **~14h** | **2.0×** |

**為什麼越做越快**：v2.11 設計系統 token / atoms / ModalShell 累積複用率越來越高。

### 主 bundle 趨勢
| 版本 | 主 bundle | gzip | 變化 |
|---|---|---|---|
| v2.11.0 | 1.20 MB | 350 KB | 起點 |
| v2.13.0 | 1.21 MB | 354 KB | +3 KB（App Check SDK）|
| v2.14.1 | 788 KB | 208 KB | **−146 KB**（xlsx lazy）|
| v2.15.0 | 788 KB | 208 KB | +0 KB（G2 純 lazy）|

**首次載入比 v2.11 快 41%。**

---

## 🌐 Cloud Functions 上線狀態

```
api                 ACTIVE  HTTP API（generate / adjust / batch / usage*）
dailyUsageReport    ACTIVE  每天 21:00 LINE 推播（v2.14 新增）
dailyCleanup        ACTIVE  每天 03:00 清理過期 batchJobs
onUserCreated       ACTIVE  Firestore trigger（v2.10）
onUserUpdated       ACTIVE  Firestore trigger（v2.10）
```

---

## 🚀 部署指令

```bash
# 開發
npm run dev

# 建置
npm run build

# 部署前端（push 即可，GitHub Actions 自動）
git push

# 部署 Cloud Functions（注意 owner 是 cagooo@gmail.com）
npx firebase deploy --only functions:api \
  --project comments-67079 --account cagooo@gmail.com

# 部署 Firestore Rules
npx firebase deploy --only firestore:rules \
  --project comments-67079 --account cagooo@gmail.com
```

---

## ⚠️ 待辦清單（高優先）

### 使用者端
- [ ] **註冊 reCAPTCHA v3 site key**（Firebase Console）→ 設 `VITE_APP_CHECK_SITE_KEY` GitHub secret → 觀察 1-2 天 → 切 App Check enforce 模式
- [ ] 等 dailyUsageReport 跑一次（明天 21:00 自動）確認 LINE 卡片格式 OK

### 開發端（v2.16.0 候選）
- [ ] 跑 **E2 學期累積評語**（最高 ROI，跟 G2 完美合作）
- [ ] 跑 **L1 獎狀印製**（G2 印刷基建首發應用）
- [ ] 跑 **TD9 PrintModal 改 window.print**（順手砍 178 KB lazy chunk）

---

## 💡 詳細未來建議

完整版見 [FUTURE_ROADMAP.md](FUTURE_ROADMAP.md)，含 15 項 Top 15 優先級矩陣 + 4 段建議開發時程 + 3 個 Combo 推薦組合。
