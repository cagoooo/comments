/**
 * Firebase 設定檔
 * 點石成金蜂🐝 - 資料持久化服務 + Google 登入 + App Check 防護
 */
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
    apiKey: "AIzaSyBBfpg8D4bqcqOTTuO5ONIQRInRCPOZM5k",
    authDomain: "comments-67079.firebaseapp.com",
    projectId: "comments-67079",
    storageBucket: "comments-67079.firebasestorage.app",
    messagingSenderId: "36001866008",
    appId: "1:36001866008:web:448de13685ad843551be6d"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

/**
 * App Check 整合（C1, Phase 1：fail-open）
 *
 * 啟用 SOP（兩步走，避免誤殺合法流量）：
 *   1. Firebase Console → Build → App Check → Register Web App
 *      → 選 reCAPTCHA v3（免費，門檻最低）
 *      → 拿到 Site Key（pk_xxx...）
 *   2. 把 Site Key 設成環境變數 `VITE_APP_CHECK_SITE_KEY`
 *      - 本地：`.env.local` 加 `VITE_APP_CHECK_SITE_KEY=pk_xxx`
 *      - GitHub Actions：repo Settings → Secrets → 加同名 secret
 *        並在 workflow yml 把它寫進 build 的 env
 *   3. 觀察 1-2 天 Console「App Check → Metrics」確認沒誤殺後，
 *      再到 Cloud Functions 跟 Firestore Rules 切 enforce 模式
 *
 * 為什麼 fail-open：
 *   - Site Key 沒設時：應用照常運作（不阻擋老師使用），純前端跳過 App Check
 *   - 設好之後：自動產生 attestation token，Cloud Functions 可選擇是否 enforce
 *   - 這設計符合 firebase-ci-troubleshooter skill Fix #12 標準流程
 *
 * 為什麼是 ReCaptchaV3：
 *   - 對使用者無感（不需要勾「我不是機器人」）
 *   - 免費，門檻低
 *   - 教學現場已夠用（不需要 reCAPTCHA Enterprise 的進階等級）
 */
const appCheckSiteKey = import.meta.env.VITE_APP_CHECK_SITE_KEY;
let appCheckInstance = null;

if (appCheckSiteKey) {
    // 開發環境啟用 debug token（避免本地測試一直被 reCAPTCHA 擋）
    // 第一次跑會在 console 印出 debug token，要去 Firebase Console 註冊
    if (import.meta.env.DEV) {
        // eslint-disable-next-line no-restricted-globals
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    try {
        appCheckInstance = initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(appCheckSiteKey),
            isTokenAutoRefreshEnabled: true,
        });
        console.info('[App Check] 已啟用 reCAPTCHA v3 防護');
    } catch (err) {
        // App Check 失敗不可影響主流程（fail-open）
        console.warn('[App Check] 初始化失敗，跳過防護:', err);
    }
} else if (!import.meta.env.DEV) {
    // 正式環境沒設 site key 時提示一下，但不擋
    console.warn(
        '[App Check] 未設定 VITE_APP_CHECK_SITE_KEY，跳過防護。' +
        '正式環境建議啟用，請參考 src/firebase/config.js 內的啟用 SOP。'
    );
}

/** App Check instance（沒啟用時為 null，呼叫端必須 null-check） */
export const appCheck = appCheckInstance;

// 初始化 Firestore
export const db = getFirestore(app);

// 初始化 Auth
export const auth = getAuth(app);

// Google 登入提供者
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

export default app;
