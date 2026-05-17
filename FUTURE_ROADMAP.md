# 點石成金蜂🐝 未來發展建議藍圖

> 📅 更新時間：2026-05-17 | 已完成 **50 項功能** | v2.10.0

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
| 18 | API Key 測試機制優化 | ✅ 完成 | v2.5.2 |
| 19 | 升級 Gemini 2.5 Flash | ✅ 完成 | v2.5 |
| 20 | 管理員 API Key 共享 | ✅ 完成 | v2.6 |
| 21 | 🆕 管理員通知徽章 | ✅ 完成 | v2.6.1 |
| 22 | 🆕 WebView 登入優化 | ✅ 完成 | v2.6.1 |
| 33 | 🆕 繁體中文強制輸出 | ✅ 完成 | v2.6.2 |
| 34 | 🆕 班級管理優化（查看經營者學生） | ✅ 完成 | v2.7.0 |
| 35 | 🆕 登入頁面說明文字優化 | ✅ 完成 | v2.7.1 |
| 36 | 🆕 學生搜尋功能強化 | ✅ 完成 | v2.8.0 |
| 37 | 🆕 評語品質預覽與調整 | ✅ 完成 | v2.8.0 |
| 38 | 🆕 管理員檢視模式匯出修復 | ✅ 完成 | v2.8.0 |
| 39 | 🆕 雲端函式後端 | ✅ 完成 | v2.9.0 |
| 40 | 🆕 註冊流程自動化 (免 Key) | ✅ 完成 | v2.9.0 |
| 41 | 🆕 自動建立班級/學校 | ✅ 完成 | v2.9.0 |
| 42 | 🆕 共享 API Key 介面鎖定 | ✅ 完成 | v2.9.0 |
| 43 | 🆕 鍵盤快捷鍵 (Ctrl+S/G) | ✅ 完成 | v2.9.1 |
| 44 | 🆕 評語範本分類管理 | ✅ 完成 | v2.9.1 |
| 45 | 🐛 循環依賴修復 (USER_ROLES) | ✅ 完成 | v2.9.1 |
| 46 | 📲 LINE 即時通知（使用者註冊 / 提交申請）| ✅ 完成 | v2.10.0 |
| 47 | 📲 LINE API 錯誤告警（generate/adjust/batch）| ✅ 完成 | v2.10.0 |
| 48 | 🎨 Flex Message 卡片 UX 強化（深色 + 高對比）| ✅ 完成 | v2.10.0 |
| 49 | 🔥 Firestore 生命週期 Triggers（onCreate / onUpdate）| ✅ 完成 | v2.10.0 |
| 50 | 🔐 SECURITY.md（Firebase Web Key 公開政策說明）| ✅ 完成 | v2.10.0 |

---

## 🆕 最新版本功能總結

### v2.10.0 - 📲 即時通知與安全強化（2026-05-17）

#### 主要新增

**📲 LINE 即時通知系統**
- 共用阿凱老師統一 LINE Bot Channel，純 push 模式（不新建 webhook）
- 三類事件自動推播管理員：
  - 🆕 新使用者 Google 首次登入 → Firestore `users/{uid}` onCreate
  - ✅ 使用者送出學校班級申請 → `applicationSubmittedAt` 從無到有
  - ❌ `/generate` / `/adjust` / `/batch` 500 錯誤 → 60 秒節流告警
- 採 Flex Message 卡片，四色狀態（started 藍 / success 綠 / failed 紅 / warning 橙）
- 卡片失敗自動 fallback 純文字（韌性設計）
- 配額秘密透過 Firebase Secret Manager 保管，不下到前端

**🎨 Flex 卡片 UX 大改版（從 v1 慘案中學到的教訓）**
- Header 背景改用 -800 深色系（WCAG AA 對比 ≥5.4:1），白字標題清晰
- Bubble 改 `mega`（320px）取代 `kilo`，中文 label 不再被截
- Body 把 emoji icon 抽成獨立 `flex:0` box，label/value 用 `3:6` 比例
- Header 把 icon 與 title 分兩 text node，title 獨立 `size:'lg' bold`
- 教訓寫進個人 skill 庫 `line-messaging-firebase` 雷 #11，未來新專案自動避雷

**🔥 Firestore 生命週期 Triggers**
- `onUserCreated`：使用者建立時觸發，best-effort 不影響主流程
- `onUserUpdated`：偵測 `applicationSubmittedAt` 從無到有
- 純 server-side 攔截，前端不需任何改動
- 用 `firebase-functions/v2/firestore` API（Eventarc backbone）

**🔐 安全強化**
- 新增 [SECURITY.md](SECURITY.md) 正式說明 Firebase Web API Key 公開設計
- 處理 GitHub Secret Scanning Alert #1（`AIzaSyBBfpg8D4...`）
  - 確認 GCP API Key 已設好 HTTP Referrer + API Target 限制
  - 透過 `gh api` 自動 dismiss alert（`resolution: wont_fix`）
- 文件含未來再被掃到的 SOP，永久止血

#### 新增 / 修改的檔案

```
新增
├── functions/src/services/notify-line.ts    # Flex Message helper + 60s 節流 + fallback
├── functions/src/triggers/userEvents.ts     # Firestore onCreate / onUpdate
└── SECURITY.md                              # API Key 公開政策

修改
├── functions/src/index.ts                   # 註冊 COMMENTS_LINE_* secrets + export triggers
├── functions/src/controllers/generate.ts    # catch 區呼叫 notifyApiError
├── functions/src/controllers/adjust.ts      # 同上
└── functions/src/controllers/batch.ts       # 同上 + 全失敗額外告警
```

#### Firebase Secret Manager 新增

| Secret | 用途 |
|---|---|
| `COMMENTS_LINE_CHANNEL_ACCESS_TOKEN` | LINE Push API 認證 |
| `COMMENTS_LINE_ADMIN_USER_ID` | 推播對象（管理員 LINE userId）|

#### 已部署 Cloud Functions（v2.10.0 後共 5 支）

| 函數 | 類型 | 說明 |
|---|---|---|
| `api` | HTTP | 主要 API（含 LINE 錯誤告警）|
| `weeklyUsageReport` | Scheduled | 每週使用量報告 |
| `dailyCleanup` | Scheduled | 每日清理過期任務 |
| `onUserCreated` | Firestore | **新** — 註冊推 LINE |
| `onUserUpdated` | Firestore | **新** — 提交申請推 LINE |

---

### v2.9.1 - 效率與體驗升級 ⚡
- **鍵盤快捷鍵支援**
  - `Ctrl+S` (或 Cmd+S)：手動觸發儲存（雖然系統會自動儲存，但提供安心感）
  - `Ctrl+G` (或 Cmd+G)：快速生成評語（支援單一/批次）
- **評語範本分類**
  - 新增「學業、品德、人際、其他」分類標籤
  - 範本庫支援分類篩選，查找更快速
  - 範本卡片可直接修改分類
- **系統穩定性**
  - 修復 `USER_ROLES` 循環依賴導致的初始化錯誤
  - 修復 `ReferenceError` 相關問題

### v2.9.0 - 註冊流程優化與自動化 🚀
- **註冊體驗升級**
  - 移除註冊時 API Key 必填限制
  - 註冊後自動獲得「教師」權限 (Auto-approval)
  - 自動建立並關聯班級與學校資訊
- **共享 API Key 優化**
  - 偵測到共享 Key 時自動鎖定輸入欄位
  - 隱藏儲存/清除按鈕，防止誤操作
  - 新增「已鎖定」與「使用共享 Key」狀態提示

---

## 🎯 短期建議功能 (1-2 週)

### 1. 深色模式 (Dark Mode) ⭐⭐⭐
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

### 2. 批次操作功能增強 ⭐⭐⭐
**預估時間**：2-3 小時
**提升大量管理效率**

```
功能設計：
├── 批次加入標籤（選取多位學生 -> 加入相同成語/標籤）
├── 批次移除標籤
├── 批次清空評語（僅清空內容，保留學生資料）
└── 批次移動班級（將選取學生移動到另一班級）
```

---

### 3. 使用量統計儀表板 (前端視覺化) ⭐⭐
**預估時間**：4-5 小時
**基於 v2.9.0 後端資料**

```
功能設計：
├── API 呼叫次數統計（按用戶/日期）
├── 評語生成成功率
├── 平均評語字數
├── 每週/月使用趨勢圖表 (Chart.js)
├── 管理員可查看所有教師使用量
└── Quota 使用預警（接近上限時通知）
```

---

## 🌟 v2.10.0 衍生的未來方向（基於今天完成的基建）

> 今天完成的「LINE 通知 + Firestore Triggers + 錯誤告警 + Secret Manager」是一整套**可重複利用的基建**。下列建議都直接複用現有元件，開發成本極低、價值極高。

---

### 🅐 LINE 通知能力延伸（5 個方向）

#### A1. 教師端 LINE 綁定（Phase 2，依 skill roadmap）⭐⭐⭐
**預估**：3-4 天 | **價值**：超高（每位老師都能收即時提醒）

```
功能設計：
├── 在使用者設定頁加「綁定 LINE」按鈕
├── 後端產生 6 位英數綁定碼（5 分鐘 TTL）
├── 使用者把碼傳給 LINE Bot
├── Webhook 收訊 → 寫進 users/{uid}.lineUserId
└── 後續所有通知就能推給該老師個人
```

**衍生通知場景**：
- 📊 配額剩餘預警（每日剩 10 次推「⚠️ 今日配額快用完」）
- 🎯 月底未寫評語提醒（「您班上還有 8 位學生沒寫評語」）
- 📦 大批次完成提醒（批次處理 30 位學生時，完成就推卡）
- 🏫 班級新增學生通知
- 🗓️ 學期結束自動產出評語建議

**前置需求**：使用 [line-messaging-firebase](https://github.com/cagoooo) skill 已寫好的 Phase 2 流程。

---

#### A2. 家長端 LINE 推播（進階）⭐⭐
**預估**：1 週 | **價值**：中（看學校政策決定要不要做）

```
功能設計：
├── 評語完成後勾選「分享給家長」
├── 家長掃同一 Bot QR 綁定學生
├── 推播評語卡（不顯示其他學生資訊）
└── 家長可回 LINE 訊息給老師（教師看得到）
```

⚠️ **隱私風險**：需家長知情同意 + 學校政策核可。

---

#### A3. 每日彙整報告（取代週報）⭐⭐⭐
**預估**：3 小時 | **價值**：高（管理員只看一條訊息掌握全局）

目前 `weeklyUsageReport` 是每週一推一次 email/log，改成 LINE Flex 卡：

```
📊 點石成金蜂 · 5/17 日報
─────────────────────────
👥 活躍教師    8 位
✍️ 評語生成    142 次
✅ 成功率      96%
❌ 錯誤        6 次（5 次配額 / 1 次 Gemini）
🏆 最高使用    王老師 24 次
```

複用今天的 `notifyAdminCard` helper，1 小時就能改完。

---

#### A4. Cost / Budget 警戒 LINE 通知 ⭐⭐
**預估**：2 小時 | **價值**：高（防意外大額帳單）

```
功能設計：
├── Cloud Billing Budget API 設定預算警報
├── 警報觸發 → Pub/Sub → Cloud Function → notifyAdmin
└── 訊息含「已用 XX 元 / 上限 YY 元 / 預估月底 ZZ 元」
```

搭配 Firebase 已啟用的 Blaze 方案 + 預算警示。

---

#### A5. App Check 異常告警 ⭐⭐
**預估**：4 小時 | **價值**：中（先做 Fix #12 啟用 App Check 才有意義）

目前 Cloud Functions 對任何 Firebase ID Token 都接受。啟用 App Check 後，沒有合法 token 的請求視為攻擊。

```
功能設計：
├── 啟用 App Check (reCAPTCHA Enterprise 或 v3)
├── 先 Unenforced 觀察 1-2 天
├── 確認誤殺率低後 Enforce
└── Unenforced 期間有大量 token 不合法 → 推 LINE「⚠️ 疑似濫用流量」
```

---

### 🅑 監控與可觀測性（複用 Firestore Triggers + Cloud Functions）

#### B1. 錯誤集中與分類 ⭐⭐⭐
**預估**：4 小時 | **價值**：高

`notifyApiError` 目前只推 LINE 不寫 DB，難回溯。改進：

```
新增 errors/{errorId} collection
├── timestamp
├── endpoint (POST /generate)
├── userUid / userEmail
├── errorMessage
├── errorType: gemini_api | quota | auth | unknown
├── stackTrace (truncated)
└── resolved: boolean

→ 在前端管理員頁加「錯誤儀表板」section
→ 可分類過濾、標記已處理
→ 每週 top 5 自動推 LINE
```

#### B2. 使用儀表板強化（已在現有 roadmap，現在價值更高）⭐⭐⭐
**預估**：4-5 小時 | **價值**：高

利用 `users/{uid}/usage/{date}` 已記錄的資料畫圖：

```
功能設計：
├── 折線圖：每日 API 呼叫次數（近 30 天）
├── 圓餅圖：成功 / 失敗比例
├── 長條圖：各教師月度使用量（管理員視角）
├── 即時 Gauge：今日剩餘配額
└── 圖表庫：Chart.js 或 Recharts
```

#### B3. 效能 / Latency 監控 ⭐⭐
**預估**：3 小時 | **價值**：中

在 Cloud Functions 加 timing 紀錄，寫進 Firestore：

```
metrics/{date}/endpoints/{endpointName}
├── count
├── totalDurationMs
├── p50 / p95 / p99 ms
└── geminiApiAvgMs
```

過閾值（如 p95 > 8 秒）推 LINE。

---

### 🅒 安全強化（基於今天的 SECURITY.md 經驗）

#### C1. App Check 啟用 ⭐⭐⭐
**預估**：3-4 小時 | **價值**：超高

依 firebase-ci-troubleshooter skill 的 **Fix #12** 標準流程：

```
步驟：
1. Firebase Console → Build → App Check → Register Web app
2. 選 reCAPTCHA Enterprise（正式）或 v3（夠用）
3. 整合進 src/firebase/config.js initializeAppCheck()
4. 先 Unenforced 模式觀察 1-2 天
5. 確認所有合法流量都有 token 才 Enforce
6. Cloud Functions 設 enforceAppCheck: true
```

**為什麼重要**：今天加的 LINE 告警基建會告訴你「有沒有被攻擊」，但要先有 App Check 才能擋下來。

---

#### C2. Firestore Rules Audit ⭐⭐⭐
**預估**：2-3 小時 | **價值**：高

當前 [firestore.rules](firestore.rules) 在 v2.9.0 為了 auto-create 班級/學校放寬過。值得 audit：

```
檢查清單：
├── users 集合：role-based 讀寫權限是否嚴格？
├── classes / schools 寫入是否限定 authenticated？
├── batchJobs 是否只有 owner 能讀？
├── usage 子集合是否禁止使用者自己改？
└── 有沒有 collection 漏掉 rules 變預設 deny？
```

寫成單元測試（用 firebase emulator + `@firebase/rules-unit-testing`）。

---

#### C3. Rate Limiting 強化 ⭐⭐
**預估**：4 小時 | **價值**：中

目前 `checkQuota` 是「日上限」，但**沒有「每分鐘上限」**。理論上一個用戶可以一秒鐘打 100 次直到當日 100 次配額用完。

```
新增 token bucket middleware:
├── 每用戶 60 req/min, 10 req/10s
├── 用 Cloud Firestore 計數器 + transaction 實作
└── 觸發 → 回 429 + LINE 告警
```

---

#### C4. API Key Rotation 自動化提醒 ⭐
**預估**：1 小時 | **價值**：低（但符合 SOP）

GitHub Actions cron 每 90 天提醒檢查 GCP API Key 是否該 rotate：

```yaml
# .github/workflows/key-rotation-reminder.yml
on:
  schedule:
    - cron: '0 0 1 */3 *'   # 每 3 個月 1 日
jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - run: gh issue create --title "🔑 API Key Rotation 檢查" --body "..."
```

---

### 🅓 後端能力延伸

#### D1. 批次任務佇列化（Cloud Tasks）⭐⭐⭐
**預估**：1 週 | **價值**：高

目前 `processBatchJob` 是「fire-and-forget」，**最大缺點**：
- 單一 Cloud Function 最多跑 9 分鐘，30 位學生 × 3 秒 = 90 秒，OK
- 但若是 100 位學生 × 5 秒 = 500 秒就**會被砍掉**
- 失敗了無法自動 retry

改用 [Cloud Tasks](https://cloud.google.com/tasks) 把每個學生 dispatch 成獨立 task：

```
新架構：
├── handleCreateBatch 收到請求 → 建立 batchJobs/{jobId}
├── 對每位學生呼叫 cloudTasks.createTask({
│     url: 'https://api-xxx.run.app/internal/generateOne',
│     payload: { jobId, studentId, traits }
│   })
├── 每個 task 獨立執行,失敗 Cloud Tasks 自動 retry
└── 前端輪詢 batchJobs/{jobId} 看進度
```

**好處**：可靠性大躍進、可視化進度、不再被 timeout 砍。

---

#### D2. Streaming 評語生成 ⭐⭐⭐
**預估**：1-2 天 | **價值**：超高（UX 大躍進）

目前老師按「生成」要等 3-8 秒看到結果（黑屏感）。改 Server-Sent Events：

```
前端: const eventSource = new EventSource('/generate?stream=1');
       eventSource.onmessage = (e) => appendToComment(e.data);

後端: Gemini API 已支援 streamGenerateContent
       Cloud Function 用 ReadableStream 把 chunk 即時推給前端
```

效果：字一個一個浮現（像 ChatGPT），等待感消失。

---

#### D3. 快取重複請求 ⭐⭐
**預估**：3 小時 | **價值**：中（看流量決定）

同樣的「特質 + 風格 + 字數」可能短時間內重複請求：

```
新增 cache/{hash}/{generated}
├── hash = md5(traits + styles + tone + wordCount)
├── TTL 7 天
├── generate 前先查,有就直接回
└── 註明「（快取結果）」讓使用者知道
```

---

#### D4. 多 LLM 後備（Failover）⭐⭐
**預估**：1 天 | **價值**：中（生產環境必備）

Gemini 429 / 503 時自動 fallback 到 Claude 或 OpenAI：

```typescript
async function generateWithFallback(prompt) {
  try {
    return await gemini.generate(prompt);
  } catch (err) {
    if (isQuotaErr(err) || isUnavailable(err)) {
      logger.warn('Gemini 失敗,fallback Claude');
      notifyAdmin('🔄 Gemini fallback 觸發');
      return await claude.generate(prompt);  // 用 ANTHROPIC_API_KEY
    }
    throw err;
  }
}
```

---

#### D5. Cost Tracking（精確到 token）⭐⭐
**預估**：4 小時 | **價值**：中

Gemini API 回應已含 `usageMetadata.totalTokenCount`，紀錄：

```
users/{uid}/usage/{date}:
├── promptTokens
├── completionTokens
├── totalTokens
└── estimatedCostUsd  # 用 Gemini 2.5 Flash 單價計算
```

→ 管理員月底彙整 → LINE 推「本月成本 NT$XX」

---

### 🅔 評語品質強化

#### E1. AI 評語風格學習 ⭐⭐⭐
**預估**：1 週 | **價值**：超高

每位老師寫過的評語當訓練樣本：

```
功能設計：
├── 收集老師「已採用」的評語（manually edited & saved）
├── 加進 prompt 的 few-shot examples
│   └── prompt 開頭附「以下是您過去寫過的評語風格：...」
├── 採樣最近 10 條 + 最常見的句型
└── Gemini 自動學會老師的口吻
```

不需要 fine-tune（成本高），純 prompt engineering 即可。

---

#### E2. 學期累積評語生成 ⭐⭐⭐
**預估**：2-3 小時 | **價值**：高

`students/{id}/history/{historyId}` 已有歷史。叫 Gemini 看完所有歷史產出學期總評：

```
新 endpoint: POST /generateSemesterSummary
input: { studentId, semesterMonths: ['10', '11', '12', '1'] }
output: 「綜觀小明本學期表現：學期初... 中段... 期末...」
```

學期末超實用。

---

#### E3. 評語品質分數 + 多樣性檢測（已在 roadmap） ⭐⭐⭐

擴充：用 Gemini 自評（meta-evaluation）

```
prompt: 「請評估這段評語：[評語]。
          1. 用詞多樣性 (1-10)
          2. 具體事例 (1-10)
          3. 鼓勵性 (1-10)
          4. 一句話總評」
```

---

### 🅕 教育場景延伸

#### F1. 家庭聯絡簿模板 ⭐⭐
**預估**：3-4 小時 | **價值**：中（高使用頻率）

```
新模式：除了「學期評語」,加「每週聯絡簿評語」
├── 風格更口語 / 簡短（30-50 字）
├── 不需要學期維度的「整體表現」
└── 重點突出本週事件
```

#### F2. 獎狀印製整合 ⭐⭐
**預估**：1 天 | **價值**：中

```
功能：
├── 選學生 + 獎項 (學業/品德/服務/特殊表現)
├── Gemini 生成獎狀詞句
├── 套入獎狀模板 (Canvas / jsPDF)
└── 一鍵下載 PDF 給校長簽核
```

#### F3. 多語版本（英文 / 客語 / 台語）⭐
**預估**：2-3 小時 | **價值**：低（看學校需求）

---

### 🅖 整合與資料

#### G1. Google Classroom 整合 ⭐⭐
**預估**：1 週 | **價值**：高（如果學校有用 Classroom）

```
功能：
├── 連結 Google Classroom 帳號
├── 一鍵匯入班級學生名單
├── 評語直接同步回 Classroom 私訊
└── 自動取得學生 email + 大頭照
```

#### G2. 學期報告 PDF 生成 ⭐⭐⭐
**預估**：1 天 | **價值**：高

```
PDF 結構：
├── 封面：學校 + 班級 + 學期
├── 學生清單頁
├── 每位學生一頁：照片 + 評語 + 老師簽名 + 印章
└── 統計頁：班級整體分析
```

用 [pdf-export-print-best-practice](https://github.com/cagoooo) skill 推薦的 `window.print() + @media print` 做法。

---

## 📊 v2.10.0 衍生方向總覽（優先級矩陣）

| 方向 | 預估工時 | 價值 | 推薦序 |
|---|:---:|:---:|:---:|
| 🅒 C1 App Check 啟用 | 3-4h | 超高 | **第 1**（安全基礎） |
| 🅑 B2 使用儀表板 | 4-5h | 高 | **第 2** |
| 🅐 A3 每日彙整 LINE 報告 | 3h | 高 | **第 3** |
| 🅐 A1 教師 LINE 綁定 | 3-4 天 | 超高 | **第 4** |
| 🅔 E1 評語風格學習 | 1 週 | 超高 | **第 5** |
| 🅓 D2 Streaming 生成 | 1-2 天 | 超高 | **第 6** |
| 🅒 C2 Firestore Rules Audit | 2-3h | 高 | **第 7** |
| 🅓 D1 Cloud Tasks 佇列 | 1 週 | 高 | **第 8** |
| 🅔 E2 學期累積評語 | 2-3h | 高 | **第 9** |
| 🅖 G2 學期報告 PDF | 1 天 | 高 | **第 10** |

---

## 🔶 中期建議功能 (1-2 月)

### 4. AI 評語品質分析 ⭐⭐⭐
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

### 5. 學生進步追蹤 ⭐⭐⭐
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

## 🚀 長期建議功能 (3-6 月)

### 6. 手機 App 打包 (Capacitor) ⭐⭐
**預估時間**：6-8 小時

```
功能設計：
├── 使用 Capacitor 打包成 iOS/Android App
├── 推播通知（學期提醒）
├── 離線快取增強
├── 相機整合（掃描學生名單）
└── 生物辨識登入
```

---

### 7. 即時協作功能 ⭐⭐
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
| React.memo 完整優化 | ⭐⭐ | 子組件效能優化 | 2 hr |

---

## 📅 建議開發時程

### 🥇 立即可做 (1-2 週)
1. ⬜ **App Check 啟用 (C1)** — 安全基礎，3-4h，必做
2. ⬜ **每日彙整 LINE 報告 (A3)** — 改 weeklyUsageReport，3h
3. ⬜ **Firestore Rules Audit (C2)** — 安全 audit，2-3h
4. ⬜ 深色模式
5. ⬜ console.log 清理

### 🥈 短期目標 (2-4 週)
1. ⬜ **使用量儀表板 (B2)** — 既有後端資料視覺化，4-5h
2. ⬜ **教師 LINE 綁定 (A1)** — 大幅提升日常價值，3-4 天
3. ⬜ **Streaming 評語生成 (D2)** — UX 大躍進，1-2 天
4. ⬜ **學期累積評語 (E2)** — 學期末必用，2-3h
5. ⬜ AI 評語品質分析

### 🥉 中期目標 (1-2 月)
1. ⬜ **評語風格學習 (E1)** — Few-shot prompt，最大價值，1 週
2. ⬜ **Cloud Tasks 批次佇列 (D1)** — 可靠性升級，1 週
3. ⬜ **學期報告 PDF (G2)** — 學期末必用，1 天
4. ⬜ TypeScript 遷移 Phase 1-2
5. ⬜ 單元測試建立

### 🏅 長期目標 (3-6 月)
1. ⬜ **Google Classroom 整合 (G1)** — 1 週
2. ⬜ **多 LLM 後備 (D4)** — 1 天
3. ⬜ **Cost Tracking 精確化 (D5)** — 4h
4. ⬜ TypeScript 完整遷移
5. ⬜ 即時協作功能
6. ⬜ 手機 App 打包 (Capacitor)

---

## 🏆 版本歷史

| 版本 | 日期 | 主要更新 |
|------|------|----------|
| **v2.10.0** | **2026-05-17** | 📲 **LINE 即時通知系統（註冊 / 提交申請 / API 錯誤）+ Firestore Triggers + Flex 卡片 UX + SECURITY.md** |
| v2.9.1 | 2026-01-27 | ⚡ 鍵盤快捷鍵、評語範本分類、循環依賴修復 |
| v2.9.0 | 2026-01-27 | 🚀 註冊流程優化 (免 Key)、自動審核、自動建立班級、共享 Key 介面優化 |
| v2.8.1 | 2026-01-15 | 📝 登入頁面優化、申請表單驗證、自動新增班級流程優化 |
| v2.8.0 | 2026-01-15 | 🏫 班級學校關聯、管理員編輯功能、學校資訊顯示優化 |
| v2.7.0 | 2026-01-12 | 🏫 班級管理優化、查看經營者學生資料 |
| v2.6.2 | 2026-01-12 | 🇹🇼 繁體中文強制輸出、禁用簡體字 |
| v2.6.1 | 2026-01-12 | 🔔 管理員通知徽章、WebView 登入優化 |
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

## 💡 下一步建議（基於 v2.10.0 的最強組合）

> 🥇 **第 1 推薦：App Check 啟用 (C1)** — 3-4 小時
> - 完成今天的 LINE 告警基建後，下一步該堵住「告警之前」就把攻擊擋下
> - 直接套用 [firebase-ci-troubleshooter](https://github.com/cagoooo) skill Fix #12 流程
> - 啟用後配合 LINE 告警，就有「攻擊偵測 → 自動擋下 → 即時通知」完整鏈條

> 🥈 **第 2 推薦：教師 LINE 綁定 (A1)** — 3-4 天
> - 今天只通了管理員端，下一步把通知能力下放給每位老師
> - 套用 line-messaging-firebase skill Phase 2 流程（含現成程式碼）
> - 解鎖大量 LINE 通知衍生情境（配額預警、批次完成、未寫評語提醒）

> 🥉 **第 3 推薦：使用儀表板 (B2)** — 4-5 小時
> - Cloud Functions 已記錄 `users/{uid}/usage/{date}`，前端只需畫圖
> - 立刻能看到 v2.10.0 加的錯誤告警在實戰中的真實分布
> - 圖表庫推薦 Chart.js（輕量）或 Recharts（React-native）

---

## 📐 設計原則總結（從這次 LINE 通知學到的）

1. **基建優先於功能**：先把通知/監控/錯誤告警基建立好，後續所有功能都能直接套用
2. **best-effort 不影響主流程**：通知失敗絕不能讓使用者主流程掛掉（`void notify(...)` + try/catch 吞錯）
3. **節流是必須的**：60 秒 throttle 防洗版，未來所有外部通知都該套
4. **UX 要實機驗證**：build 過 / curl 200 不代表卡片好看，每次 UI 改動都要請使用者實機看一眼
5. **Skill 是長期資產**：今天踩雷的經驗寫進 skill 庫（雷 #11），未來新專案自動避雷
6. **Secret 永遠走 Manager**：絕不寫 `.env` / `git` / `chat`，永遠 pipe 到 Secret Manager
7. **公開設計也是安全策略**：Firebase Web Key 公開是設計使然，真正的保護來自 referrer + API restrictions 不是保密

---

## 🔗 重要連結

| 項目 | 網址 |
|---|---|
| GitHub repo | https://github.com/cagoooo/comments |
| PR (v2.10.0) | https://github.com/cagoooo/comments/pull/1 |
| Firebase Console | https://console.firebase.google.com/project/comments-67079 |
| Cloud Functions Health | https://api-o7l7hehf7q-de.a.run.app/health |
| 線上版 (Firebase) | https://comments-67079.web.app |
| 線上版 (GitHub Pages) | https://cagoooo.github.io/comments/ |
| 安全政策 | [SECURITY.md](SECURITY.md) |

---

> 📝 **文件維護者**：阿凱老師 + Claude
> 📅 **最後更新**：2026-05-17
> 🔖 **對應版本**：v2.10.0
> 🎓 **作者**：[桃園市龍潭區石門國民小學 阿凱老師](https://www.smes.tyc.edu.tw/modules/tadnews/page.php?ncsn=11&nsn=16#a5)
