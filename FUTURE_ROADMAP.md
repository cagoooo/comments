# 點石成金蜂🐝 未來發展建議藍圖

> 📅 更新時間：2026-01-12 10:30 | 已完成 **20 項功能** | v2.6.0

---

## 📊 目前完成進度

| # | 功能 | 狀態 | 版本 |
|---|------|------|------|
| 1 | 模組化架構 | ✅ 完成 | v1.0 |
| 2 | RWD 響應式設計 | ✅ 完成 | v1.0 |
| 3 | 教育手寫普普風 UI | ✅ 完成 | v1.0 |
| 4 | AI 評語生成 (Gemini 2.5 Flash) | ✅ 完成 | v2.5 |
| 5 | Firebase 資料持久化 | ✅ 完成 | v1.0 |
| 6 | API Key 管理介面 | ✅ 完成 | v1.0 |
| 7 | 單一學生即時生成 | ✅ 完成 | v1.0 |
| 8 | 評語範本庫 | ✅ 完成 | v1.0 |
| 9 | 成語搜尋與常用排序 | ✅ 完成 | v1.0 |
| 10 | 評語字數統計 | ✅ 完成 | v1.0 |
| 11 | PWA 離線支援 | ✅ 完成 | v2.0 |
| 12 | 班級管理系統 | ✅ 完成 | v2.0 |
| 13 | 歷史記錄與版本回溯 | ✅ 完成 | v2.0 |
| 14 | Google 登入與權限管理 | ✅ 完成 | v2.0 |
| 15 | 成語使用紀錄帳號隔離 | ✅ 完成 | v2.4 |
| 16 | API 配額錯誤處理優化 | ✅ 完成 | v2.4 |
| 17 | Excel 匯入 / UI 優化 | ✅ 完成 | v2.4 |
| 18 | **API Key 測試機制優化** | ✅ 完成 | v2.5.2 |
| 19 | **升級 Gemini 2.5 Flash** | ✅ 完成 | v2.5 |
| 20 | **🆕 管理員 API Key 共享** | ✅ 完成 | v2.6 |

---

## 🆕 最新版本功能 (v2.6.0)

### 管理員 API Key 共享功能
**讓管理員可以將付費 API Key 授權給教師使用**

```
功能亮點：
├── 管理員可設定/清除共享 API Key
├── 勾選教師即可即時授權
├── 教師端自動同步使用共享 Key
├── 取消勾選立即撤銷授權
└── Firestore 安全規則保護
```

**修改檔案**：
- `firestoreService.js` - 新增 adminConfigService
- `AdminPanel.jsx` - 共享管理 UI
- `ApiKeyModal.jsx` - 授權狀態顯示
- `App.jsx` - 共享 Key 優先同步
- `firestore.rules` - adminConfig 集合規則

---

## 🎯 短期建議功能 (1-2 週)

### 1. 深色模式 ⭐⭐⭐
**預估時間**：3-4 小時
**優先級**：🔥 推薦優先開發

```
功能設計：
├── CSS 變數定義亮/暗色調色盤
│   └── --bg-primary, --text-primary, --accent-color
├── Tailwind dark: 前綴支援
├── 系統偏好自動偵測 (prefers-color-scheme)
├── Header 加入切換開關 (太陽/月亮圖示)
└── 偏好設定持久化 (Firebase settingsService)
```

**實作建議**：
```javascript
// settingsService 新增欄位
{
  apiKey: "...",
  theme: "light" | "dark" | "system"
}
```

---

### 2. 評語範本分類管理 ⭐⭐⭐
**預估時間**：3-4 小時

```
功能設計：
├── 範本分類（學業/品德/人際/服務/特教/其他）
├── 分類標籤篩選
├── 範本變數插入（{{學生姓名}}）
├── 範本使用次數統計與排序
└── 範本匯入/匯出 (JSON)
```

**資料結構建議**：
```javascript
{
  id: "template_001",
  content: "{{學生姓名}}在學業上表現優異...",
  category: "academic",    // 新增欄位
  tags: ["學業", "優良"],   // 新增欄位
  usageCount: 15,
  createdAt: Timestamp
}
```

---

### 3. 鍵盤快捷鍵 ⭐⭐
**預估時間**：2-3 小時

| 快捷鍵 | 功能 | 說明 |
|--------|------|------|
| `Ctrl+S` | 儲存當前評語 | 防止資料遺失 |
| `Ctrl+G` | 生成 AI 評語 | 快速生成 |
| `Ctrl+N` | 新增學生 | 開啟輸入面板 |
| `Ctrl+F` | 搜尋學生 | 聚焦搜尋框 |
| `Esc` | 關閉 Modal | 通用關閉 |
| `Tab` | 下一位學生 | 快速切換 |

**實作建議**：建立 `useHotkeys` Hook

---

### 4. 學生搜尋功能強化 ⭐⭐
**預估時間**：2 小時

```
功能設計：
├── 即時搜尋（輸入即篩選）
├── 搜尋範圍：姓名 + 標籤 + 評語內容
├── 搜尋高亮顯示匹配文字
├── 搜尋歷史記錄（最近 5 筆）
└── 篩選器：有評語/無評語/有標籤/無標籤
```

---

### 5. React.memo 效能優化 ⭐⭐
**預估時間**：2 小時
**狀態**：部分完成

```
優化項目：
├── [x] StudentCard - React.memo
├── [x] StudentTable - React.memo  
├── [ ] IdiomSidebar - 使用 useMemo 快取篩選結果
├── [ ] TemplateModal - 使用 useMemo 快取排序結果
└── [ ] useCallback - 穩定所有 onClick handlers
```

---

## 🔶 中期建議功能 (1-2 月)

### 6. 使用量統計儀表板 ⭐⭐⭐
**預估時間**：4-5 小時
**基於共享 API Key 功能延伸**

```
功能設計：
├── API 呼叫次數統計（按用戶/日期）
├── 評語生成成功率
├── 平均評語字數
├── 每週/月使用趨勢圖表
├── 管理員可查看所有教師使用量
└── Quota 使用預警（接近上限時通知）
```

**資料結構建議**：
```javascript
// users/{userId}/usage/{date}
{
  apiCalls: 25,
  successCount: 23,
  failedCount: 2,
  totalChars: 12500,
  date: "2026-01-12"
}
```

---

### 7. TypeScript 遷移 ⭐⭐⭐⭐
**預估時間**：8-12 小時（漸進式）

```
遷移順序：
Phase 1：utils/*.ts, hooks/*.ts (2 小時)
Phase 2：firebase/*.ts + 定義 interfaces (3 小時)
Phase 3：components/*.tsx (5-7 小時)
```

**核心 Interface 定義**：
```typescript
interface Student {
  id: string;
  name: string;
  selectedTags: string[];
  manualTraits: string;
  comment: string;
  classId?: string;
  createdAt?: Timestamp;
}

interface SharedApiConfig {
  sharedApiKey: string;
  authorizedUsers: string[];
  updatedAt: Timestamp;
  updatedBy: string;
}

interface UserSettings {
  apiKey?: string;
  theme?: 'light' | 'dark' | 'system';
  defaultStyle?: string;
}
```

---

### 8. 單元測試建立 ⭐⭐⭐
**預估時間**：6-8 小時

```
技術選擇：
├── Vitest（與 Vite 無縫整合）
├── React Testing Library
├── MSW (Mock Service Worker) - 模擬 Firebase
└── 覆蓋率目標：核心服務 > 80%
```

**優先測試項目**：
1. `adminConfigService` - 共享 API Key 授權邏輯
2. `geminiApi` - API 呼叫與錯誤處理
3. `settingsService` - 設定儲存與讀取
4. `useStudents` Hook - 學生資料管理

---

### 9. 評語歷史比較功能 ⭐⭐
**預估時間**：2-3 小時

```
功能設計：
├── 雙欄比較視圖
├── 差異高亮顯示 (類似 Git diff)
│   └── 綠色：新增文字 / 紅色：刪除文字
├── 版本標註備註（此版本改了什麼）
├── 「還原」按鈕（一鍵回溯）
└── 合併版本功能（擷取兩版優點）
```

---

### 10. 批次操作功能 ⭐⭐
**預估時間**：3-4 小時

```
功能設計：
├── 批次套用範本
│   ├── 勾選多位學生
│   ├── 選擇範本 → 批次套用
│   └── 變數自動替換 {{學生姓名}}
├── 批次生成評語
│   ├── 勾選未生成學生
│   └── 逐一 AI 生成（帶進度條）
└── 批次匯出
    ├── 只匯出勾選學生
    └── 格式選擇：TXT/Excel/PDF
```

---

## 🚀 長期建議功能 (3-6 月)

### 11. AI 評語品質分析 ⭐⭐⭐
**預估時間**：3-4 小時

```
功能設計：
├── 字數分析
│   ├── 過短警告 (<50 字)
│   └── 過長警告 (>300 字)
├── 詞彙多樣性檢測
│   └── 重複用詞高亮
├── 正向/負向語氣分析
│   └── 以百分比顯示
├── AI 改寫建議（調用 Gemini）
└── 評語品質分數 (1-100)
```

---

### 12. 學生進步追蹤 ⭐⭐⭐
**預估時間**：4-6 小時

```
功能設計：
├── 學期設定（上/下學期、月份）
├── 定期評語快照
├── 進步趨勢圖表 (Chart.js)
├── 特質變化追蹤（哪些成語新增/移除）
├── 學期報告自動生成
└── 與家長分享功能（生成 PDF）
```

---

### 13. 即時協作功能 ⭐⭐
**預估時間**：8-12 小時

```
功能設計：
├── Firestore onSnapshot 即時同步
├── 多教師協作編輯同一班級
├── 正在編輯指示（xxx 正在編輯）
├── 編輯鎖定機制（同一學生互斥）
└── 衝突解決策略（後者覆蓋 vs 選擇）
```

---

### 14. 多語言支援 (i18n) ⭐⭐
**預估時間**：4-6 小時

```
技術選擇：react-i18next

支援語言：
├── 繁體中文（預設）
├── 簡體中文
└── English

本地化項目：
├── UI 文字
├── 日期格式
├── 數字格式
└── 成語庫（需翻譯）
```

---

### 15. 進階 Prompt 自訂 ⭐⭐
**預估時間**：2-3 小時

```
功能設計：
├── 預設 Prompt 範本（可選）
├── 自訂 Prompt 編輯器
├── 變數插入指南
│   └── {{name}}, {{tags}}, {{style}}, {{length}}
├── Prompt 測試預覽
└── 儲存個人化 Prompt
```

---

## 🔧 技術債清單

| 項目 | 優先級 | 說明 | 預估時間 |
|------|--------|------|----------|
| TypeScript 遷移 | ⭐⭐⭐⭐ | 增強型別安全 | 8-12 hr |
| 單元測試 | ⭐⭐⭐ | Vitest + RTL | 6-8 hr |
| 虛擬滾動 | ⭐⭐ | 大量學生效能優化 | 2 hr |
| 錯誤邊界強化 | ⭐⭐ | 分區 Error Boundary | 1 hr |
| 無障礙優化 | ⭐⭐ | ARIA 標籤、焦點管理 | 2 hr |
| console.log 清理 | ⭐ | DEV 環境限定 | 0.5 hr |
| Bundle 分析優化 | ⭐ | 減少打包體積 | 1 hr |

---

## 📅 建議開發時程

### 🥇 立即可做 (1-2 週)
1. ⬜ 深色模式
2. ⬜ 鍵盤快捷鍵
3. ⬜ 學生搜尋強化
4. ⬜ console.log 清理

### 🥈 短期目標 (2-4 週)
1. ⬜ 評語範本分類
2. ⬜ 使用量統計儀表板
3. ⬜ React.memo 完整優化
4. ⬜ 批次操作功能

### 🥉 中期目標 (1-2 月)
1. ⬜ TypeScript 遷移 Phase 1-2
2. ⬜ 單元測試建立
3. ⬜ 評語歷史比較
4. ⬜ AI 評語品質分析

### 🏅 長期目標 (3-6 月)
1. ⬜ TypeScript 完整遷移
2. ⬜ 學生進步追蹤
3. ⬜ 即時協作功能
4. ⬜ 多語言支援

---

## 🏆 版本歷史

| 版本 | 日期 | 主要更新 |
|------|------|----------|
| v2.6.0 | 2026-01-12 | 🆕 管理員 API Key 共享功能 |
| v2.5.2 | 2026-01-12 | API Key 配額檢測優化 |
| v2.5.1 | 2026-01-12 | API Key 驗證優化 |
| v2.5.0 | 2026-01-12 | 升級至 Gemini 2.5 Flash API |
| v2.4.1 | 2026-01-11 | API Key 測試驗證優化 |
| v2.4.0 | 2026-01-11 | 成語帳號隔離、API 配額處理 |
| v2.3.0 | 2026-01-11 | WebView 偵測、RWD 修復 |
| v2.0.0 | 2026-01-11 | Google 登入、管理員審核、班級管理 |
| v1.0.0 | 2026-01-10 | 初版：AI 評語生成、Firebase 持久化 |

---

## 📁 專案結構

```
h:\comments\
├── src/
│   ├── components/         # 27 個元件
│   │   ├── AdminPanel.jsx  # 新增共享 API Key UI
│   │   ├── ApiKeyModal.jsx # 授權狀態顯示
│   │   └── ...
│   ├── firebase/           # 5 個服務模組
│   │   ├── firestoreService.js  # 新增 adminConfigService
│   │   └── ...
│   ├── hooks/              # 2 個 Custom Hooks
│   ├── utils/              # 3 個工具函數
│   ├── data/               # 2 個靜態資料
│   └── contexts/           # 1 個 Context
├── firestore.rules         # 新增 adminConfig 集合規則
└── package.json            # v2.6.0
```

---

## 💡 下一步建議

> 🎯 **推薦優先開發：深色模式**
> - 技術難度低，開發時間短（3-4 小時）
> - 使用者感受度高，尤其夜間使用
> - 可展示技術能力（CSS 變數、系統偏好偵測）

---

## 📌 注意事項

### 共享 API Key 安全提醒
由於採用「信任模式」，被授權教師技術上可透過開發者工具取得 API Key。如需更高安全性，未來可考慮：
1. **Cloud Functions** - API Key 存於後端
2. **使用量限制** - 每位教師每日呼叫上限
3. **IP 白名單** - 限制來源 IP

---

> 📝 **文件維護者**：AI Assistant
> 📅 **最後更新**：2026-01-12
> 🔖 **對應版本**：v2.6.0
