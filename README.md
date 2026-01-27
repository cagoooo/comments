# 點石成金蜂🐝 - AI 評語產生器

> 🎓 專為教師設計的學生評語智慧生成工具，讓撰寫評語變得輕鬆又高效！

[![Version](https://img.shields.io/badge/version-2.9.0-blue.svg)](https://github.com/cagoooo/comments)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.7-orange.svg)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-brightgreen.svg)](https://ai.google.dev/)

![Demo](https://img.shields.io/badge/Demo-Live-success.svg)

---

## ✨ 功能特色

### 🤖 AI 智慧生成
- **Gemini 2.5 Flash API** - 採用最新 Google Gemini 模型生成高品質評語
- **多元風格選擇** - 支援「質性描述」、「量化分析」、「鼓勵激勵」等多種評語風格
- **字數與語氣調整** - 可自訂評語長度與正式程度

### 📝 成語庫與標籤
- **豐富成語分類** - 涵蓋資賦、學業、品德、人際、服務等多種類別
- **常用成語排序** - 依使用頻率自動排序，提高效率
- **帳號隔離儲存** - 每位教師獨立保存常用成語記錄

### 💾 資料管理
- **Firebase 雲端同步** - 資料安全儲存，跨裝置存取
- **班級管理系統** - 建立多個班級，分類管理學生資料
- **🆕 班級學校關聯** - 不同學校可建立同名班級，資料獨立
- **範本庫收藏** - 收藏優秀評語，快速套用
- **評語歷史版本** - 追蹤修改記錄，隨時回溯

### 📤 匯入/匯出
- **Excel 匯入** - 快速匯入學生名單與標籤
- **多格式匯出** - 支援 TXT、JSON、Excel、PDF 等格式
- **列印功能** - 美觀排版，直接列印

### 🔐 使用者認證
- **Google 登入** - 安全便捷的 OAuth 認證
- **管理員審核** - 教師帳號需經管理員審核啟用
- **API Key 隔離** - 每位教師獨立管理個人 API Key
- **🆕 共享 API Key** - 管理員可授權教師使用付費 API Key
- **🆕 管理員編輯** - 管理員可編輯所有老師的學生資料

### 📱 跨平台支援
- **PWA 離線支援** - 可安裝至桌面，離線也能使用部分功能
- **RWD 響應式設計** - 完美支援桌機、平板、手機

---

## 🚀 快速開始

### 環境需求
- Node.js 18+
- npm 或 yarn

### 安裝與執行

```bash
# Clone 專案
git clone https://github.com/cagoooo/comments.git
cd comments

# 安裝相依套件
npm install

# 啟動開發伺服器
npm run dev
```

### 建置生產版本

```bash
# 標準建置
npm run build

# GitHub Pages 建置
npm run build:gh-pages
```

---

## 🔧 技術架構

| 類別 | 技術 |
|------|------|
| **前端框架** | React 18 + Vite 6 |
| **樣式** | Tailwind CSS 3 |
| **後端服務** | Firebase (Auth, Firestore) |
| **AI 模型** | Google Gemini 2.5 Flash |
| **部署** | Firebase Hosting / GitHub Pages |
| **圖示** | Lucide React |

---

## 📁 專案結構

```
h:\comments\
├── src/
│   ├── components/         # React 元件 (26+)
│   ├── firebase/           # Firebase 服務模組
│   ├── hooks/              # Custom Hooks
│   ├── utils/              # 工具函數
│   ├── data/               # 靜態資料 (成語、風格定義)
│   └── contexts/           # React Context
├── public/                 # 靜態資源
├── firestore.rules         # Firestore 安全規則
├── firebase.json           # Firebase 配置
└── package.json            # 專案設定
```

---

## 🏆 版本歷史

| 版本 | 日期 | 主要更新 |
|------|------|----------|
| v2.9.0 | 2026-01-27 | 🚀 註冊流程優化 (移除 API Key 必填)、自動審核與班級建立、API Key 來源限制修正 |
| v2.8.1 | 2026-01-15 | 📝 登入頁面優化、申請表單驗證、自動新增班級流程優化 |
| v2.8.0 | 2026-01-15 | 🏫 班級學校關聯、管理員編輯功能、學校資訊顯示優化 |
| v2.7.0 | 2026-01-12 | 🏫 班級管理優化、查看經營者學生資料 |
| v2.6.2 | 2026-01-12 | 🇹🇼 繁體中文強制輸出、禁用簡體字 |
| v2.6.1 | 2026-01-12 | 🔔 管理員通知徽章、WebView 登入優化 |
| v2.6.0 | 2026-01-12 | 🆕 管理員 API Key 共享功能 |
| v2.5.2 | 2026-01-12 | API Key 配額檢測優化 |
| v2.5.1 | 2026-01-12 | API Key 驗證優化、版本號更新 |
| v2.5.0 | 2026-01-12 | 升級至 Gemini 2.5 Flash API |
| v2.4.1 | 2026-01-11 | API Key 測試驗證優化 |
| v2.4.0 | 2026-01-11 | 成語帳號隔離、API 配額處理 |
| v2.3.0 | 2026-01-11 | WebView 偵測、RWD 修復 |
| v2.0.0 | 2026-01-11 | Google 登入、管理員審核、班級管理 |
| v1.0.0 | 2026-01-10 | 初版：AI 評語生成、Firebase 持久化 |

---

## 📖 使用說明

1. **登入系統** - 使用 Google 帳號登入（需管理員審核）
2. **設定 API Key** - 前往設定，輸入您的 Gemini API Key
3. **輸入學生名單** - 手動輸入或 Excel 匯入
4. **選擇成語標籤** - 為學生選擇適合的特質描述
5. **生成評語** - 點擊生成按鈕，AI 自動撰寫評語
6. **編輯與匯出** - 微調評語後匯出使用

---

## 🤝 貢獻

歡迎提交 Issue 或 Pull Request！

---

## 📄 授權

本專案採用 MIT License 授權 - 詳見 [LICENSE](LICENSE) 檔案

---

<p align="center">
  Made with ❤️ for Teachers<br>
  <strong>點石成金蜂🐝</strong> - 讓評語寫作變簡單
</p>
