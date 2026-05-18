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
 * 呼叫 Cloud Functions API（POST，含 body）
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
 * 呼叫 Cloud Functions API（GET，含 query string）
 */
const getApi = async (endpoint, params = {}) => {
    const baseUrl = getApiBaseUrl();
    const idToken = await getIdToken();

    const qs = new URLSearchParams(params).toString();
    const url = `${baseUrl}${endpoint}${qs ? `?${qs}` : ''}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${idToken}`
        }
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

/**
 * 取得本人的今日 + 本月配額狀態
 * @returns {Promise<{ daily, monthly, isAdmin, lastUpdated }>}
 */
export const fetchUsageQuota = async () => {
    return await getApi('/usage');
};

/**
 * 取得本人過去 N 天使用量歷史（30 天用於折線/圓餅圖）
 * @param {number} days 1-90，預設 30
 * @returns {Promise<{ days, history, totals, lastUpdated }>}
 *   history: [{ date, apiCalls, successCount, failedCount }]
 *   totals:  { apiCalls, successCount, failedCount }
 */
export const fetchUsageHistory = async (days = 30) => {
    return await getApi('/usage/history', { days });
};

/**
 * 管理員視角：取得本月所有教師使用量彙整（長條圖用）
 * @returns {Promise<{ yearMonth, teachers, totals, activeTeacherCount, lastUpdated }>}
 *   teachers: [{ uid, displayName, email, schoolName, role, monthlyApiCalls, monthlySuccess, monthlyFailed }]
 */
export const fetchAdminUsage = async () => {
    return await getApi('/usage/admin');
};
