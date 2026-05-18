import { Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { getUsageStats } from '../services/quota';

const getDb = () => admin.firestore();

/**
 * 使用量查詢控制器（今日 + 本月配額）
 */
export const handleGetUsage = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const userId = req.user?.uid;

    if (!userId) {
        res.status(401).json({
            success: false,
            error: '未授權'
        } as ApiResponse);
        return;
    }

    try {
        const stats = await getUsageStats(userId);

        res.json({
            success: true,
            data: {
                daily: stats.daily,
                monthly: stats.monthly,
                isAdmin: stats.isAdmin,
                lastUpdated: new Date().toISOString()
            }
        } as ApiResponse);
    } catch (error) {
        console.error('取得使用量失敗:', error);

        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '取得使用量失敗'
        } as ApiResponse);
    }
};

/**
 * 取得過去 N 天的使用量歷史（給折線圖 / 圓餅圖用）
 *
 * Query: ?days=30 (1-90，預設 30)
 * 回傳：依日期排序的陣列，含 apiCalls / successCount / failedCount。
 * 沒資料的日期會以 0 補齊（前端不用煩 gap fill）。
 */
export const handleGetUsageHistory = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const userId = req.user?.uid;

    if (!userId) {
        res.status(401).json({ success: false, error: '未授權' } as ApiResponse);
        return;
    }

    const days = Math.min(Math.max(parseInt(String(req.query.days || '30'), 10) || 30, 1), 90);

    try {
        const db = getDb();

        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - (days - 1));

        const fmt = (d: Date) => d.toISOString().split('T')[0];
        const startKey = fmt(startDate);
        const endKey = fmt(today);

        const snap = await db
            .collection(`users/${userId}/usage`)
            .where('__name__', '>=', startKey)
            .where('__name__', '<=', endKey)
            .get();

        const map = new Map<string, { apiCalls: number; successCount: number; failedCount: number }>();
        snap.forEach(doc => {
            const d = doc.data();
            map.set(doc.id, {
                apiCalls: d.apiCalls || 0,
                successCount: d.successCount || 0,
                failedCount: d.failedCount || 0
            });
        });

        // 補齊缺失的日期為 0
        const history: Array<{
            date: string;
            apiCalls: number;
            successCount: number;
            failedCount: number;
        }> = [];

        for (let i = 0; i < days; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const key = fmt(d);
            const existing = map.get(key) || { apiCalls: 0, successCount: 0, failedCount: 0 };
            history.push({ date: key, ...existing });
        }

        // 聚合本期間的彙整
        const totals = history.reduce(
            (acc, day) => {
                acc.apiCalls += day.apiCalls;
                acc.successCount += day.successCount;
                acc.failedCount += day.failedCount;
                return acc;
            },
            { apiCalls: 0, successCount: 0, failedCount: 0 }
        );

        res.json({
            success: true,
            data: {
                days,
                history,
                totals,
                lastUpdated: new Date().toISOString()
            }
        } as ApiResponse);
    } catch (error) {
        console.error('取得使用量歷史失敗:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '取得使用量歷史失敗'
        } as ApiResponse);
    }
};

/**
 * 管理員視角：取得本月所有教師的使用量彙整
 *
 * 僅限 admin 角色，回傳 [{ uid, displayName, email, schoolName, monthlyApiCalls, monthlySuccess, monthlyFailed }, ...]
 * 依 monthlyApiCalls 降序排序，前端可直接畫長條圖。
 *
 * 註：使用 collectionGroup 抓所有 `usage/{date}` 子集合，效率 OK（每位老師頂多 ~30 個 doc）。
 */
export const handleGetAdminUsage = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const userId = req.user?.uid;

    if (!userId) {
        res.status(401).json({ success: false, error: '未授權' } as ApiResponse);
        return;
    }

    try {
        const db = getDb();

        // 驗證 admin 身分
        const callerDoc = await db.doc(`users/${userId}`).get();
        const callerRole = callerDoc.data()?.role;
        if (callerRole !== 'admin') {
            res.status(403).json({ success: false, error: '需要管理員權限' } as ApiResponse);
            return;
        }

        // 本月日期範圍
        const now = new Date();
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const startKey = `${yearMonth}-01`;
        const endKey = `${yearMonth}-31`;

        // 抓所有已審核教師
        const usersSnap = await db
            .collection('users')
            .where('role', 'in', ['admin', 'teacher'])
            .get();

        const teachers: Array<{
            uid: string;
            displayName: string;
            email: string;
            schoolName: string;
            role: string;
            monthlyApiCalls: number;
            monthlySuccess: number;
            monthlyFailed: number;
        }> = [];

        // 並行抓每位教師的本月 usage
        await Promise.all(
            usersSnap.docs.map(async (userDoc) => {
                const userData = userDoc.data();
                const uid = userDoc.id;

                const usageSnap = await db
                    .collection(`users/${uid}/usage`)
                    .where('__name__', '>=', startKey)
                    .where('__name__', '<=', endKey)
                    .get();

                let monthlyApiCalls = 0;
                let monthlySuccess = 0;
                let monthlyFailed = 0;

                usageSnap.forEach(doc => {
                    const d = doc.data();
                    monthlyApiCalls += d.apiCalls || 0;
                    monthlySuccess += d.successCount || 0;
                    monthlyFailed += d.failedCount || 0;
                });

                teachers.push({
                    uid,
                    displayName: userData.displayName || userData.email || '(未具名)',
                    email: userData.email || '',
                    schoolName: userData.schoolName || '',
                    role: userData.role || 'teacher',
                    monthlyApiCalls,
                    monthlySuccess,
                    monthlyFailed
                });
            })
        );

        // 降序排序
        teachers.sort((a, b) => b.monthlyApiCalls - a.monthlyApiCalls);

        // 彙整全局數據
        const totals = teachers.reduce(
            (acc, t) => {
                acc.apiCalls += t.monthlyApiCalls;
                acc.success += t.monthlySuccess;
                acc.failed += t.monthlyFailed;
                return acc;
            },
            { apiCalls: 0, success: 0, failed: 0 }
        );

        res.json({
            success: true,
            data: {
                yearMonth,
                teachers,
                totals,
                activeTeacherCount: teachers.filter(t => t.monthlyApiCalls > 0).length,
                lastUpdated: new Date().toISOString()
            }
        } as ApiResponse);
    } catch (error) {
        console.error('取得管理員使用量失敗:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '取得管理員使用量失敗'
        } as ApiResponse);
    }
};
