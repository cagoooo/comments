import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { defineSecret } from 'firebase-functions/params';
import { notifyDailyReport } from '../services/notify-line';

const getDb = () => admin.firestore();

// LINE secrets — daily report 需要拿到才能推卡
const lineToken = defineSecret('COMMENTS_LINE_CHANNEL_ACCESS_TOKEN');
const lineAdminId = defineSecret('COMMENTS_LINE_ADMIN_USER_ID');

/**
 * 每日使用量彙整報告（取代 v2.10 之前的 weeklyUsageReport）
 *
 * 每天 21:00 (Asia/Taipei) 推一張 LINE Flex 卡片給管理員，附上：
 * - 活躍教師數 / 總教師數
 * - 今日評語生成總次數
 * - 成功率 + 失敗次數
 * - 今日使用量最高的教師
 *
 * 同時把彙整資料寫進 reports/daily_YYYY-MM-DD 供未來查詢。
 *
 * 失敗率 ≥ 20% 自動升級為 warning 卡（深橘 header），管理員 LINE 一眼看到。
 */
export const dailyUsageReport = onSchedule(
    {
        schedule: '0 21 * * *',           // 每天 21:00 台灣時間（放學後彙整）
        timeZone: 'Asia/Taipei',
        region: 'asia-east1',
        secrets: [lineToken, lineAdminId]
    },
    async () => {
        logger.info('開始生成每日使用量報告');

        const db = getDb();
        const today = new Date();
        const todayKey = today.toISOString().split('T')[0]; // YYYY-MM-DD

        // zh-TW 短日期 (5/18)
        const dateLabel = new Intl.DateTimeFormat('zh-TW', {
            timeZone: 'Asia/Taipei',
            month: 'numeric',
            day: 'numeric'
        }).format(today);

        try {
            // 抓所有已審核教師（不含 pending）
            const usersSnapshot = await db
                .collection('users')
                .where('role', 'in', ['admin', 'teacher'])
                .get();

            // 並行抓每位教師今天的 usage doc
            const userStats = await Promise.all(
                usersSnapshot.docs.map(async (userDoc) => {
                    const userData = userDoc.data();
                    const usageDoc = await db
                        .doc(`users/${userDoc.id}/usage/${todayKey}`)
                        .get();
                    const d = usageDoc.data() || {};
                    return {
                        userId: userDoc.id,
                        displayName: userData.displayName || userData.email || '(未具名)',
                        email: userData.email || '',
                        apiCalls: d.apiCalls || 0,
                        successCount: d.successCount || 0,
                        failedCount: d.failedCount || 0,
                    };
                })
            );

            const activeTeachers = userStats.filter(u => u.apiCalls > 0);
            const totalApiCalls = userStats.reduce((sum, u) => sum + u.apiCalls, 0);
            const totalSuccess = userStats.reduce((sum, u) => sum + u.successCount, 0);
            const totalFailed = userStats.reduce((sum, u) => sum + u.failedCount, 0);

            // Top user
            const topUser = activeTeachers
                .sort((a, b) => b.apiCalls - a.apiCalls)[0];

            // 寫進 reports/daily_YYYY-MM-DD（保留歷史，後台可查）
            const reportId = `daily_${todayKey}`;
            await db.doc(`reports/${reportId}`).set({
                type: 'daily',
                date: todayKey,
                generatedAt: admin.firestore.FieldValue.serverTimestamp(),
                totalTeachers: usersSnapshot.size,
                activeTeacherCount: activeTeachers.length,
                totalApiCalls,
                totalSuccessCount: totalSuccess,
                totalFailedCount: totalFailed,
                topUser: topUser ? {
                    userId: topUser.userId,
                    displayName: topUser.displayName,
                    apiCalls: topUser.apiCalls
                } : null,
                userStats: activeTeachers.map(u => ({
                    userId: u.userId,
                    displayName: u.displayName,
                    apiCalls: u.apiCalls,
                    successCount: u.successCount,
                    failedCount: u.failedCount
                }))
            });

            logger.info('日報已寫入 Firestore', {
                reportId,
                totalApiCalls,
                activeTeachers: activeTeachers.length
            });

            // 推 LINE Flex 卡片給管理員
            await notifyDailyReport({
                dateLabel,
                activeTeacherCount: activeTeachers.length,
                totalApiCalls,
                successCount: totalSuccess,
                failedCount: totalFailed,
                topUser: topUser ? { displayName: topUser.displayName, calls: topUser.apiCalls } : null,
                totalTeachers: usersSnapshot.size
            });

            logger.info('日報 LINE 推播完成');
        } catch (error) {
            logger.error('生成每日報告失敗', error);
            throw error;
        }
    }
);

/**
 * 每日清理過期批次任務（保留 7 天）
 * 每天凌晨 3:00 (台灣時間) 執行
 */
export const dailyCleanup = onSchedule(
    {
        schedule: '0 3 * * *',
        timeZone: 'Asia/Taipei',
        region: 'asia-east1'
    },
    async () => {
        logger.info('開始清理過期批次任務');

        const db = getDb();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        try {
            const expiredJobs = await db
                .collection('batchJobs')
                .where('createdAt', '<', sevenDaysAgo)
                .get();

            const batch = db.batch();
            let deleteCount = 0;

            expiredJobs.forEach(doc => {
                batch.delete(doc.ref);
                deleteCount++;
            });

            if (deleteCount > 0) {
                await batch.commit();
                logger.info(`已刪除 ${deleteCount} 個過期批次任務`);
            } else {
                logger.info('沒有需要清理的過期任務');
            }
        } catch (error) {
            logger.error('清理過期任務失敗', error);
            throw error;
        }
    }
);
