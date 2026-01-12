import * as admin from 'firebase-admin';

/**
 * 配額設定
 */
const QUOTA_CONFIG = {
    // 每日 API 呼叫上限（一般用戶）
    DAILY_LIMIT: 100,
    // 管理員每日上限（不限制）
    ADMIN_DAILY_LIMIT: 10000,
    // 每月上限
    MONTHLY_LIMIT: 2000
};

/**
 * 取得 Firestore 實例（懶載入）
 */
const getDb = () => admin.firestore();

/**
 * 取得用戶角色
 */
const getUserRole = async (userId: string): Promise<string> => {
    const db = getDb();
    const userDoc = await db.doc(`users/${userId}`).get();
    return userDoc.data()?.role || 'pending_review';
};

/**
 * 取得今日使用量
 */
export const getDailyUsage = async (userId: string): Promise<number> => {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const usageDoc = await db.doc(`users/${userId}/usage/${today}`).get();
    return usageDoc.data()?.apiCalls || 0;
};

/**
 * 取得本月使用量
 */
export const getMonthlyUsage = async (userId: string): Promise<number> => {
    const db = getDb();
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 查詢本月所有日期的使用量
    const usageSnapshot = await db
        .collection(`users/${userId}/usage`)
        .where('__name__', '>=', `${yearMonth}-01`)
        .where('__name__', '<=', `${yearMonth}-31`)
        .get();

    let totalCalls = 0;
    usageSnapshot.forEach(doc => {
        totalCalls += doc.data().apiCalls || 0;
    });

    return totalCalls;
};

/**
 * 檢查用戶是否有配額可用
 */
export const checkQuota = async (userId: string): Promise<{
    allowed: boolean;
    dailyUsed: number;
    dailyLimit: number;
    monthlyUsed: number;
    monthlyLimit: number;
    message?: string;
}> => {
    const role = await getUserRole(userId);
    const isAdmin = role === 'admin';

    const dailyLimit = isAdmin ? QUOTA_CONFIG.ADMIN_DAILY_LIMIT : QUOTA_CONFIG.DAILY_LIMIT;
    const monthlyLimit = QUOTA_CONFIG.MONTHLY_LIMIT;

    const dailyUsed = await getDailyUsage(userId);
    const monthlyUsed = await getMonthlyUsage(userId);

    // 檢查每日限制
    if (dailyUsed >= dailyLimit) {
        return {
            allowed: false,
            dailyUsed,
            dailyLimit,
            monthlyUsed,
            monthlyLimit,
            message: `已達每日使用上限 (${dailyLimit} 次)`
        };
    }

    // 檢查每月限制（管理員免檢查）
    if (!isAdmin && monthlyUsed >= monthlyLimit) {
        return {
            allowed: false,
            dailyUsed,
            dailyLimit,
            monthlyUsed,
            monthlyLimit,
            message: `已達每月使用上限 (${monthlyLimit} 次)`
        };
    }

    return {
        allowed: true,
        dailyUsed,
        dailyLimit,
        monthlyUsed,
        monthlyLimit
    };
};

/**
 * 取得完整使用量統計
 */
export const getUsageStats = async (userId: string): Promise<{
    daily: {
        used: number;
        limit: number;
        remaining: number;
    };
    monthly: {
        used: number;
        limit: number;
        remaining: number;
    };
    isAdmin: boolean;
}> => {
    const role = await getUserRole(userId);
    const isAdmin = role === 'admin';

    const dailyLimit = isAdmin ? QUOTA_CONFIG.ADMIN_DAILY_LIMIT : QUOTA_CONFIG.DAILY_LIMIT;
    const monthlyLimit = QUOTA_CONFIG.MONTHLY_LIMIT;

    const dailyUsed = await getDailyUsage(userId);
    const monthlyUsed = await getMonthlyUsage(userId);

    return {
        daily: {
            used: dailyUsed,
            limit: dailyLimit,
            remaining: Math.max(0, dailyLimit - dailyUsed)
        },
        monthly: {
            used: monthlyUsed,
            limit: monthlyLimit,
            remaining: Math.max(0, monthlyLimit - monthlyUsed)
        },
        isAdmin
    };
};
