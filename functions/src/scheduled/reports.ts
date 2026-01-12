import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

/**
 * 取得 Firestore 實例
 */
const getDb = () => admin.firestore();

/**
 * 週報告定時任務
 * 每週一早上 8:00 (台灣時間/UTC+8) 執行
 */
export const weeklyUsageReport = onSchedule(
    {
        schedule: '0 8 * * 1', // 每週一 08:00
        timeZone: 'Asia/Taipei',
        region: 'asia-east1'
    },
    async () => {
        console.log('開始生成週使用量報告...');

        const db = getDb();
        const now = new Date();
        const lastWeekStart = new Date(now);
        lastWeekStart.setDate(now.getDate() - 7);

        try {
            // 取得所有用戶
            const usersSnapshot = await db.collection('users').get();

            const reportData: Array<{
                userId: string;
                email: string;
                displayName: string;
                weeklyApiCalls: number;
                weeklySuccessCount: number;
                weeklyFailedCount: number;
            }> = [];

            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                const userId = userDoc.id;

                // 取得過去一週的使用量
                const usageSnapshot = await db
                    .collection(`users/${userId}/usage`)
                    .where('__name__', '>=', lastWeekStart.toISOString().split('T')[0])
                    .get();

                let weeklyApiCalls = 0;
                let weeklySuccessCount = 0;
                let weeklyFailedCount = 0;

                usageSnapshot.forEach(doc => {
                    const data = doc.data();
                    weeklyApiCalls += data.apiCalls || 0;
                    weeklySuccessCount += data.successCount || 0;
                    weeklyFailedCount += data.failedCount || 0;
                });

                if (weeklyApiCalls > 0) {
                    reportData.push({
                        userId,
                        email: userData.email || '',
                        displayName: userData.displayName || '',
                        weeklyApiCalls,
                        weeklySuccessCount,
                        weeklyFailedCount
                    });
                }
            }

            // 儲存週報告
            const reportId = `weekly_${now.toISOString().split('T')[0]}`;
            await db.doc(`reports/${reportId}`).set({
                type: 'weekly',
                generatedAt: admin.firestore.FieldValue.serverTimestamp(),
                periodStart: lastWeekStart.toISOString(),
                periodEnd: now.toISOString(),
                totalUsers: reportData.length,
                totalApiCalls: reportData.reduce((sum, r) => sum + r.weeklyApiCalls, 0),
                totalSuccessCount: reportData.reduce((sum, r) => sum + r.weeklySuccessCount, 0),
                totalFailedCount: reportData.reduce((sum, r) => sum + r.weeklyFailedCount, 0),
                userStats: reportData
            });

            console.log(`週報告已生成: ${reportId}`);
            console.log(`總用戶數: ${reportData.length}`);
            console.log(`總 API 呼叫: ${reportData.reduce((sum, r) => sum + r.weeklyApiCalls, 0)}`);

        } catch (error) {
            console.error('生成週報告失敗:', error);
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
        schedule: '0 3 * * *', // 每天 03:00
        timeZone: 'Asia/Taipei',
        region: 'asia-east1'
    },
    async () => {
        console.log('開始清理過期批次任務...');

        const db = getDb();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        try {
            // 查詢過期的批次任務
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
                console.log(`已刪除 ${deleteCount} 個過期批次任務`);
            } else {
                console.log('沒有需要清理的過期任務');
            }

        } catch (error) {
            console.error('清理過期任務失敗:', error);
            throw error;
        }
    }
);
