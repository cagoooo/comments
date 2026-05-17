# 安全政策 Security Policy

## 🔑 關於 Firebase Web API Key 出現在前端 bundle

如果您在 GitHub Secret Scanning、安全掃描工具或手動檢視 build 產物時，看到 [src/firebase/config.js](src/firebase/config.js) 內形如 `AIzaSy...` 的 Google API Key，**這是 Firebase 的設計，不是資安漏洞**。

### 官方依據

根據 [Firebase 官方文件](https://firebase.google.com/docs/projects/api-keys)：

> Firebase API keys are different from typical API keys. Unlike how API keys are typically used... Firebase-related API keys only identify the Firebase project; they don't restrict access. Because of this, it is **OK** for these to be publicly exposed.

Firebase Web SDK 必須在前端瀏覽器初始化 (`initializeApp(firebaseConfig)`)，所以 `apiKey` 一定會出現在 JavaScript bundle 內被使用者看到。這是設計使然，與「真正的 API Key 外洩」（OpenAI / Gemini / Stripe 密鑰）性質不同。

---

## 🛡 本專案的實際保護層

### ① HTTP Referrer 限制（Google 端強制）

Firebase Web API Key (`AIzaSyBBfpg8D4...`) 已透過 GCP API Key Restrictions 鎖定**只接受**以下 referrer：

- `https://cagoooo.github.io/comments/*` — GitHub Pages 部署
- `https://cagoooo.github.io/*`
- `https://comments-67079.web.app/*` — Firebase Hosting
- `https://comments-67079.firebaseapp.com/*`
- `http://localhost:*` / `http://127.0.0.1:*` — 本機開發

外部偷用 key 從其他網站發請求一律被 Google 在 4xx 擋掉。

### ② API Target 限制（Google 端強制）

key 只啟用 Firebase 必需 API：

- Identity Toolkit / Token Service（Google 登入）
- Firebase Installations（SDK 初始化）
- Cloud Firestore（資料庫）
- Firebase Storage / Realtime DB / FCM / Remote Config 等

**未啟用** Maps / Places / Translate / Vision / Speech 等容易被濫刷帳單的付費 API。

### ③ Firestore Security Rules

寫入操作必須通過 [firestore.rules](firestore.rules) 的權限檢查（需 `request.auth != null` + 對應 role）。即使有合法 referrer，未認證使用者也無法寫入資料。

### ④ 真正機敏的 API Key 不在前端

`GEMINI_API_KEY`、`COMMENTS_LINE_CHANNEL_ACCESS_TOKEN` 等敏感憑證**不會出現在前端 bundle**：

- 全部透過 [Firebase Secret Manager](https://firebase.google.com/docs/functions/config-env?gen=2nd#secret-manager) 保管
- 用 `firebase functions:secrets:set <SECRET_NAME>` 寫入
- 在 Cloud Function 內用 `defineSecret("...")` 讀取
- 前端只透過 `/api/*` HTTP endpoint 呼叫 Cloud Functions，密鑰永不下到瀏覽器

---

## 🚨 處理 GitHub Secret Scanning Alert 的 SOP

當 Secret Scanning 又掃到 `AIzaSy...` 開頭的 key：

1. **確認來源**：alert 指向 `src/firebase/config.js` 或 build 後的 `assets/*.js` → 99% 是這把 Firebase Web Key，**不是真 leak**
2. **驗證 GCP 限制**：
   ```bash
   gcloud services api-keys describe <KEY_RESOURCE_NAME> \
     --project=comments-67079 --format=yaml
   ```
   確認 `browserKeyRestrictions.allowedReferrers` 與 `apiTargets` 都還在
3. **Dismiss alert**：用 `wont_fix` resolution，引用本文件

---

## ❌ 絕對不要做

| 反模式 | 為什麼錯 |
|---|---|
| 用 `git filter-repo` / BFG 從歷史砍掉 key | key 早被索引，搞壞 collaborator 的 clone 也沒用 |
| 改成「後端 proxy fetch Firebase」 | 複雜度遠超收益，業界沒人這樣做（會破壞 Auth / Firestore SDK） |
| 忽略不設 restrictions | 這才是**真正的漏洞**（會被濫刷帳單） |
| 把 key 改成環境變數 | build 出來還是會嵌進 bundle，無意義 |
| Rotate key 但不設新 key 的 restrictions | 一樣會再被 scanner 抓到，且舊 key 一旦 disable 服務會掛 |

---

## 📚 相關資源

- [Firebase API Keys 官方說明](https://firebase.google.com/docs/projects/api-keys)
- [Google Cloud API Key Restrictions](https://cloud.google.com/docs/authentication/api-keys#restrictions)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- 本 repo 的 [firestore.rules](firestore.rules) 看實際存取控制
