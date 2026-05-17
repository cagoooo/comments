# 點石成金蜂 🐝 — Claude Code Handoff

> A handoff document for migrating the approved Hi-Fi design (in this Omelette project) into the live codebase at <https://github.com/cagoooo/comments>.

---

## 1 · 概要

| 項目 | 內容 |
|---|---|
| **產品** | 點石成金蜂 — AI 評語產生器（教師端 SaaS） |
| **既有技術棧** | Vite + React 18 + Tailwind CSS + Firebase (Auth/Firestore) + Gemini API |
| **設計方向** | **A+D Fusion ─ 蜜糖紙感工作台** |
| **任務** | 把所有畫面的視覺與互動，從現行「教育手寫普普風」升級為新版設計系統 |
| **不動到的範圍** | 商業邏輯、Firestore schema、Firebase Auth flow、Gemini API 整合、useStudents hook |

### 設計方向一句話
> **A 的厚黑邊框 + 偏移陰影**（保留品牌個性）**＋ D 的紙質背景 + 紙膠帶 + 便利貼分頁**（增加溫度），統一在蜜糖暖色系下。

---

## 2 · 設計檔案位置（這個 Omelette 專案）

```
.
├── prototype.html             ← 主工作台 hi-fi 原型（最重要）
├── login.html                 ← 登入頁
├── mobile.html                ← 手機版（iPhone 14 Pro 三屏並排）
├── tokens.css                 ← 🎨 設計 tokens（CSS variables）— 核心
│
├── proto/
│   ├── icons.jsx              ← Lucide-style SVG icon set
│   ├── data.jsx               ← Demo students + palette presets
│   ├── atoms.jsx              ← Chip / Btn / Card / StickerTab / BeeMascot / KPI
│   ├── header.jsx             ← 頁首
│   ├── panels.jsx             ← Step 1 (學生名單) + Step 2 (AI 產生)
│   ├── filterbar.jsx          ← 搜尋 + 篩選 + 風格條
│   ├── table.jsx              ← 學生資料卡列表
│   ├── idiom.jsx              ← 成語庫右側 Sidebar
│   ├── modal-shell.jsx        ← 🪟 Modal 共用外殼
│   ├── modals.jsx             ← 範本庫 Modal
│   ├── modal-history.jsx      ← 評語歷史 Modal
│   ├── modal-class.jsx        ← 班級管理 Modal
│   ├── modal-dashboard.jsx    ← 統計儀表板 Modal
│   ├── modal-apikey.jsx       ← API 設定 Modal
│   ├── modal-admin.jsx        ← 管理員後台 Modal
│   ├── tweaks.jsx             ← Tweaks dev panel（移植時整體丟棄）
│   └── app.jsx                ← 工作台組合
│
├── mobile-dashboard.jsx       ← 手機 Dashboard
├── mobile-screens.jsx         ← 手機 Detail + Idiom BottomSheet
└── mobile-app.jsx             ← 手機 app composition (3 phones)
```

**👉 移植時 Claude Code 應該優先讀懂 `tokens.css` 與 `proto/atoms.jsx`。其他檔案都是這兩個檔案的應用範例。**

---

## 3 · 🎨 設計 Tokens（直接複製到 tailwind.config.js）

> 完整定義在 [`tokens.css`](tokens.css) — 以下為 migration 用對照表。

### 3.1 顏色（CSS variables → Tailwind colors）

| Token | Light | Dark | 用途 |
|---|---|---|---|
| `--ink` | `#1F1B16` | `#FCEEC9` | 主文字 / 邊框 / 陰影 |
| `--ink-soft` | `#6B6258` | `#C2B596` | 次要文字 |
| `--ink-mute` | `#A39C8F` | `#807763` | 提示文字 / placeholder |
| `--paper` | `#FBF5E6` | `#1E1A14` | 頁面背景 |
| `--paper-2` | `#F5ECD4` | `#2A2519` | 卡片內次背景 / hover |
| `--honey` | `#F4B826` | （不變）| 主品牌色 / 主按鈕 |
| `--honey-soft` | `#FCE7A8` | `#4A3712` | 高亮背景 |
| `--coral` | `#FF6B5A` | （不變）| 警示 / 刪除 / 管理員 |
| `--coral-soft` | `#FFD5CE` | `#4D241E` | 警示背景 |
| `--mint` | `#6FCB94` | （不變）| 成功 / 已完成 / 加入 |
| `--mint-soft` | `#CDEAD7` | `#1F4030` | 成功背景 |
| `--sky` | `#76B7E6` | （不變）| 資訊 / Excel |
| `--sky-soft` | `#D1E5F4` | `#1E3B53` | 資訊背景 |
| `--lav` | `#B9A8E6` | （不變）| 範本 / 統計 |
| `--lav-soft` | `#E1D9F1` | `#322846` | 範本背景 |
| `--peach` | `#F8C8A1` | （不變）| 列印 / 待產生 |
| `--peach-soft` | `#F8E3CF` | `#4A331F` | Peach 背景 |

**Tailwind config 建議：**

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: 'var(--ink)', soft: 'var(--ink-soft)', mute: 'var(--ink-mute)' },
        paper: { DEFAULT: 'var(--paper)', 2: 'var(--paper-2)' },
        honey: { DEFAULT: 'var(--honey)', soft: 'var(--honey-soft)' },
        coral: { DEFAULT: 'var(--coral)', soft: 'var(--coral-soft)' },
        mint:  { DEFAULT: 'var(--mint)',  soft: 'var(--mint-soft)' },
        sky:   { DEFAULT: 'var(--sky)',   soft: 'var(--sky-soft)' },
        lav:   { DEFAULT: 'var(--lav)',   soft: 'var(--lav-soft)' },
        peach: { DEFAULT: 'var(--peach)', soft: 'var(--peach-soft)' },
      },
      borderRadius: {
        card: 'var(--r-card)', // 16px
        btn:  'var(--r-btn)',  // 10px
      },
      boxShadow: {
        card: 'var(--shadow-card)', // 3px 3px 0 var(--ink)
        btn:  'var(--shadow-btn)',  // 2px 2px 0 var(--ink)
        sm0:  'var(--shadow-sm)',   // 1.5px 1.5px 0 var(--ink)
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
};
```

### 3.2 形狀

```css
--r-card:        16px;    /* 卡片圓角 */
--r-btn:         10px;    /* 按鈕圓角 */
--b-w:           2px;     /* 主邊框寬 */
--shadow-card:   3px 3px 0 var(--ink);    /* 卡片陰影（偏移） */
--shadow-btn:    2px 2px 0 var(--ink);    /* 按鈕陰影 */
--shadow-sm:     1.5px 1.5px 0 var(--ink);
```

**手機版自動調整為：** 圓角 14、邊框 1.5、陰影 2.5/2.5（見 `mobile.html` `.mob` class）

### 3.3 紙感背景三種

| Class | 描述 | 應用 |
|---|---|---|
| `.bg-paper` | 雙層細點紋（蜜糖暖色） | 頁面整體背景 |
| `.bg-lined` | 橫線稿紙（行高 28px） | textarea、評語顯示框 |
| `.bg-grid` | 方格筆記紙 | （備用） |

---

## 4 · 元件對照表

> 舊檔（comments 專案）→ 新設計（這個專案的 hi-fi）

| 既有元件 | 對應新設計 | 變更重點 |
|---|---|---|
| `src/components/Header.jsx` | [`proto/header.jsx`](proto/header.jsx) | 蜜蜂吉祥物加紙膠帶背景、6 個動作按鈕用 5 種柔色區分、班級breadcrumb 改 underline-wave |
| `src/components/InputPanel.jsx` | [`proto/panels.jsx`](proto/panels.jsx) → `InputPanel` | 增加「Step 1」便利貼分頁標、textarea 改紙線稿背景、加入按鈕加 sticky 紙膠帶 |
| `src/components/GeneratePanel.jsx` | [`proto/panels.jsx`](proto/panels.jsx) → `GeneratePanel` | 「Step 2」分頁、語氣三選一改卡片式、字數滑桿改自繪 honey nub、TXT/CSV/XLSX 下載 chip 化 |
| `src/components/SearchBar.jsx` | [`proto/filterbar.jsx`](proto/filterbar.jsx) | + ⌘K 鍵盤提示、篩選改一行 segmented + 風格條獨立一行 |
| `src/components/StyleBar.jsx` | 合併到 `filterbar.jsx` 第二行 | 質性 / 量化 / 家長 / 進步 四選一 chip + 進度條 |
| `src/components/StudentTable.jsx` | [`proto/table.jsx`](proto/table.jsx) | 改卡片列表，每張卡 4 欄（checkbox / 學生資訊 / 評語 / 操作）；空狀態獨立設計 |
| `src/components/StudentCard.jsx` | 同上 | StudentRow 與 StudentCard 合併為單一響應式元件 |
| `src/components/IdiomSidebar.jsx` | [`proto/idiom.jsx`](proto/idiom.jsx) | 加紙膠帶 + underline-wave 標題、分類圓點識別、最近使用列；手機改 BottomSheet |
| `src/components/LoginPage.jsx` | [`login.html`](login.html) | 雙欄 hero + 浮動 chips、蜜蜂跳動動畫、BEGIN HERE 便利貼 |
| `src/components/TemplateModal.jsx` | [`proto/modals.jsx`](proto/modals.jsx) | 2-col 卡片 grid、hover 浮起 + 套用按鈕、`bg-lined` 預覽 |
| `src/components/HistoryModal.jsx` | [`proto/modal-history.jsx`](proto/modal-history.jsx) | 左右 split、版本時間軸、diff 對比區 |
| `src/components/ClassModal.jsx` | [`proto/modal-class.jsx`](proto/modal-class.jsx) | 左班級列表 + 右詳情、危險區、學生 chip 牆 |
| `src/components/DashboardModal.jsx` | [`proto/modal-dashboard.jsx`](proto/modal-dashboard.jsx) | KPI + SVG area chart + 各班 bar + 風格分布 + 標籤 TOP 7 + 洞察卡 |
| `src/components/ApiKeyModal.jsx` | [`proto/modal-apikey.jsx`](proto/modal-apikey.jsx) | 狀態 banner + 3 步驟卡 + 進階設定 |
| `src/components/AdminPanel.jsx` | [`proto/modal-admin.jsx`](proto/modal-admin.jsx) | 4 Tab、待審核卡片、使用者表格 |
| `src/components/Dialog.jsx` | 用 `ModalShell` 包 | 警告 / 確認對話框統一 chrome |
| `src/components/LoadingOverlay.jsx` | 蜜蜂 bee-bob 動畫 + 蜜糖進度條 | 沿用 `prototype.html` 的 progress-nub 概念 |
| `src/components/Footer.jsx` | [`proto/app.jsx`](proto/app.jsx) 底部 | 小蜜蜂 + mono 字版本資訊 + 多個 hover 連結 |

### 還沒設計到的（可以照 ModalShell 套版）
- `ApiKeyModal` 中尚未實作的 OAuth 流程
- `ImportExportModal.jsx` — Excel 匯入 / 匯出（沿用 Step 1 拖拽 UX 即可）
- `PrintModal.jsx` — 列印 / PDF 匯出（沿用 ModalShell + 預覽分頁）
- `PendingPage.jsx` — 等待審核狀態（可直接套用 login.html 風格 + 不同文案）
- `InstallPrompt.jsx` — PWA 安裝提示
- 各種 toast / error states（沿用 Chip + b-ink + soft 色）

---

## 5 · 🪟 共用 Modal 外殼

所有 Modal 用 `<ModalShell>`：

```jsx
<ModalShell
  open={open}
  onClose={onClose}
  width={1080}                  // 視 Modal 內容調整
  eyebrow="Comment History"     // 英文小標
  title="評語版本歷史"           // 主標（自動帶 wave underline）
  tapeColor="sky"               // 紙膠帶 + icon 背景色
  icon="clock"                  // 標題左側 icon
  subtitle={<>共 5 個版本…</>}   // 副標
  footer={<div>…</div>}         // 自訂頁尾
>
  {/* 內容 */}
</ModalShell>
```

每個 Modal 含：
1. **頂部兩條紙膠帶** （蜜糖 + 薰衣草，輕微旋轉）
2. **Eyebrow** （英文小寫鎖鍵字距）
3. **Title** + **icon 徽章** + **wave underline**
4. **Subtitle** 副標
5. **Body** （overflow-y-auto）
6. **Footer**（暗底 + 主行動）

---

## 6 · Tweaks 面板（移植時整體移除）

`proto/tweaks.jsx` 是設計探索用 dev panel，正式上線時：
- 整個 `<ProtoTweaks>` 元件不需要移植
- 但 `useTweaks` 的概念可保留作為 admin 後台「主題切換器」（如果未來想做）
- 配色預設值請保留為「**蜜糖原味**」(honey)

`tokens.css` 已支援的多色主題（莓果 / 青蘋 / 海洋）可作為未來「學校品牌色」功能基礎。

---

## 7 · 響應式策略

| 寬度 | 描述 | 主要變化 |
|---|---|---|
| ≥ 1024px | Desktop（主視圖） | 完整版 |
| 768-1023px | Tablet | Step 1+2 仍並排但等寬；KPI 4→2 col；表格鎖右側操作欄 |
| ≤ 767px | Mobile | Step 1/2 上下堆疊；KPI 橫向滾動；學生改直式卡；右 sidebar→底部 Bottom Sheet；頁首按鈕收為 Bell + Avatar + 底部 Tab Bar |

詳細手機版：[`mobile.html`](mobile.html) ─ 三屏並排（Dashboard / Detail / IdiomSheet）

`.mob` class 已自動調整：`--r-card: 14`、`--b-w: 1.5`、`--shadow-card: 2.5px`

---

## 8 · 移植順序建議

> 一步一步來，先 token 後元件，先共用後業務。

1. **第一輪：Token 系統**
   - 把 `tokens.css` 內容貼到 `src/index.css` 或 `src/styles/tokens.css`
   - 更新 `tailwind.config.js`（見 §3.1）
   - 移除舊 `Header.jsx` 用到的 `#FECA57`, `#FF6B9D` 等硬編碼色
   - 載入字體：Noto Sans TC + JetBrains Mono

2. **第二輪：原子元件**
   - 建 `src/components/atoms/`：`Chip`、`Btn`、`Card`、`StickerTab`、`BeeMascot`
   - 套用到 `Header.jsx`

3. **第三輪：頁首與主工作區**
   - `Header.jsx`、`InputPanel.jsx`、`GeneratePanel.jsx`
   - `SearchBar.jsx` + `StyleBar.jsx`（合併）
   - `StudentTable.jsx`、`StudentCard.jsx`（合併）

4. **第四輪：側邊欄 + Modal Shell**
   - `IdiomSidebar.jsx`
   - 建 `src/components/ui/ModalShell.jsx`

5. **第五輪：所有 Modal**
   - TemplateModal → HistoryModal → ClassModal → DashboardModal → ApiKeyModal → AdminPanel

6. **第六輪：登入與其他頁**
   - `LoginPage.jsx`、`PendingPage.jsx`、`Footer.jsx`、`LoadingOverlay.jsx`、`Dialog.jsx`

7. **第七輪：響應式與細節**
   - 各斷點適配（見 §7）
   - Dark mode（`data-mode="dark"`）
   - 動畫（bee-bob、tape rotation）

---

## 9 · ✦ 風格守則（Do / Don't）

### ✅ Do
- 邊框一律 `border-ink` (var(--ink)) 2px，不用 gray-200 等淡邊
- 主按鈕用 `shadow-card`（偏移陰影），hover 上移 1px
- 標題加 wave underline（`.uw`）或蜜糖底框
- 蜜蜂吉祥物保留 -3~-4° 微傾與紙膠帶
- 標籤用 5 色 soft 變體輪流（peach/mint/sky/lav/honey）
- 評語顯示框一律 `bg-lined`
- Modal 一律走 `ModalShell`
- 字數、數量等資料用 `font-mono`

### ❌ Don't
- 不要使用原 `#FECA57`、`#FF6B9D` 等飽和對比色
- 不要把卡片旋轉（A 方向的舊作法已棄）
- 不要使用 emoji 取代功能 icon（除了蜜蜂🐝 + 範本書/檔案 emoji）
- 不要做大面積漸層或玻璃擬態
- 不要使用 system shadow（無偏移），會破壞 chunky 感
- 標籤 chip 不要無邊框
- 不要單行字級 < 11px（行動端最小 10.5px）

---

## 10 · 開放問題（給 Claude Code）

請在實作時順手 review 並回報：

1. **既有 Tailwind 自訂 animation `shake-slow`** 是否還有用？看似只有風格切換時 trigger，可考慮改為 `bee-bob`
2. **i18n 準備**：現在所有字串都寫死中文，未來如要支援英文，建議現在就抽出
3. **a11y**：所有 chunky button 都應該有 `aria-label`，特別是 icon-only 按鈕
4. **printable 樣式**：列印 PDF 時應該移除 tape / shadow / pattern background
5. **PWA manifest** 圖示要不要也更新為新蜜蜂風格？

---

## 11 · 預覽快速連結

| 頁面 | 路徑 |
|---|---|
| 主工作台（含 6 個 Modal） | [`prototype.html`](prototype.html) |
| 登入頁 | [`login.html`](login.html) |
| 手機版三屏 | [`mobile.html`](mobile.html) |

開啟 prototype.html 後，點頁首：
- **管理** → 管理員後台
- **範本** → 範本庫
- **統計** → 儀表板
- **API** → API 設定
- **五年三班 ↓** → 班級管理

---

**準備好開工後，請依 §8 移植順序開始，每完成一個 phase 就跑 visual diff 對照 prototype.html。**

🐝 _Designed with care · Engineered with thought_
