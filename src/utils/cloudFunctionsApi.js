/**
 * Cloud Functions API 客戶端
 * 透過 Cloud Functions 呼叫 Gemini API（API Key 安全存放於後端）
 */

import { auth } from '../firebase';

// Cloud Functions API 基礎 URL
const getApiBaseUrl = () => {
    // 檢查是否使用本地模擬器
    if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
        return 'http://127.0.0.1:5001/comments-67079/asia-east1/api';
    }
    // 生產環境 URL
    return 'https://api-o7l7hehf7q-de.a.run.app';
};

/**
 * 取得當前用戶的 ID Token
 */
const getIdToken = async () => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('用戶未登入');
    }
    return await user.getIdToken();
};

/**
 * 呼叫 Cloud Functions API
 */
const callApi = async (endpoint, data) => {
    const baseUrl = getApiBaseUrl();
    const idToken = await getIdToken();

    const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.error || 'API 呼叫失敗');
    }

    return result.data;
};

/**
 * 透過 Cloud Functions 生成評語
 */
export const callCloudFunctionGenerate = async (name, traits, styles = [], extraSettings = {}) => {
    try {
        const data = await callApi('/generate', {
            name,
            traits,
            styles,
            tone: extraSettings.tone || 'normal',
            wordCount: extraSettings.wordCount || 80
        });
        return data.comment;
    } catch (error) {
        console.error('Cloud Functions 生成失敗:', error);
        return `❌ ${error.message}`;
    }
};

/**
 * 透過 Cloud Functions 調整評語
 */
export const callCloudFunctionAdjust = async (originalComment, adjustType, tone = 3) => {
    try {
        const data = await callApi('/adjust', {
            originalComment,
            adjustType,
            tone
        });
        return data.comment;
    } catch (error) {
        console.error('Cloud Functions 調整失敗:', error);
        return `❌ ${error.message}`;
    }
};

/**
 * 檢查 Cloud Functions 健康狀態
 */
export const checkCloudFunctionHealth = async () => {
    try {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/health`);
        const data = await response.json();
        return data.status === 'ok';
    } catch {
        return false;
    }
};
