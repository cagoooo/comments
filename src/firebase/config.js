/**
 * Firebase 設定檔
 * 點石成金蜂🐝 - 資料持久化服務 + Google 登入
 */
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

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
