import { Response } from 'express';
import { AuthenticatedRequest, BatchRequest, ApiResponse } from '../types';
import { generateComment } from '../services/gemini';
import { checkQuota } from '../services/quota';
import * as admin from 'firebase-admin';

/**
 * 取得 Firestore 實例（懶載入）
 */
const getDb = () => admin.firestore();

/**
 * 批次任務狀態
 */
type BatchStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * 建立批次任務
 */
export const handleCreateBatch = async (
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

    const { students, styles, tone, wordCount } = req.body as BatchRequest;

    // 參數驗證
    if (!students || !Array.isArray(students) || students.length === 0) {
        res.status(400).json({
            success: false,
            error: '缺少學生列表'
        } as ApiResponse);
        return;
    }

    // 檢查配額
    const quotaCheck = await checkQuota(userId);
    if (!quotaCheck.allowed) {
        res.status(429).json({
            success: false,
            error: quotaCheck.message,
            data: {
                dailyUsed: quotaCheck.dailyUsed,
                dailyLimit: quotaCheck.dailyLimit
            }
        } as ApiResponse);
        return;
    }

    // 檢查是否有足夠配額處理所有學生
    const remainingQuota = quotaCheck.dailyLimit - quotaCheck.dailyUsed;
    if (students.length > remainingQuota) {
        res.status(429).json({
            success: false,
            error: `剩餘配額不足 (需要 ${students.length} 次，剩餘 ${remainingQuota} 次)`,
            data: {
                required: students.length,
                remaining: remainingQuota
            }
        } as ApiResponse);
        return;
    }

    try {
        const db = getDb();
        const jobId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 建立批次任務文件
        await db.doc(`batchJobs/${jobId}`).set({
            userId,
            status: 'processing' as BatchStatus,
            totalCount: students.length,
            completedCount: 0,
            failedCount: 0,
            students: students.map(s => ({
                id: s.id,
                name: s.name,
                traits: s.traits,
                status: 'pending',
                comment: null
            })),
            settings: { styles, tone, wordCount },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 開始非同步處理（不等待完成）
        processBatchJob(jobId, userId, students, styles || [], tone || 'normal', wordCount || 80)
            .catch(err => console.error(`批次任務 ${jobId} 處理失敗:`, err));

        res.json({
            success: true,
            data: {
                jobId,
                totalCount: students.length,
                estimatedTime: students.length * 3 // 預估每個學生 3 秒
            }
        } as ApiResponse);
    } catch (error) {
        console.error('建立批次任務失敗:', error);

        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '建立批次任務失敗'
        } as ApiResponse);
    }
};

/**
 * 非同步處理批次任務
 */
const processBatchJob = async (
    jobId: string,
    userId: string,
    students: Array<{ id: string; name: string; traits: string }>,
    styles: string[],
    tone: string,
    wordCount: number
): Promise<void> => {
    const db = getDb();
    const jobRef = db.doc(`batchJobs/${jobId}`);
    const today = new Date().toISOString().split('T')[0];
    const usageRef = db.doc(`users/${userId}/usage/${today}`);

    let completedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < students.length; i++) {
        const student = students[i];

        try {
            // 生成評語
            const comment = await generateComment(
                student.name,
                student.traits,
                styles,
                tone,
                wordCount
            );

            // 更新學生狀態
            const updatedStudents = (await jobRef.get()).data()?.students || [];
            const studentIndex = updatedStudents.findIndex((s: { id: string }) => s.id === student.id);
            if (studentIndex >= 0) {
                updatedStudents[studentIndex].status = 'success';
                updatedStudents[studentIndex].comment = comment;
            }

            completedCount++;

            await jobRef.update({
                students: updatedStudents,
                completedCount,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // 記錄使用量
            await db.runTransaction(async (transaction) => {
                const usageDoc = await transaction.get(usageRef);
                const data = usageDoc.data() || { apiCalls: 0, successCount: 0, failedCount: 0, totalTokens: 0 };
                transaction.set(usageRef, {
                    apiCalls: data.apiCalls + 1,
                    successCount: data.successCount + 1,
                    failedCount: data.failedCount,
                    totalTokens: data.totalTokens,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });

        } catch (error) {
            console.error(`生成評語失敗 (${student.name}):`, error);

            // 更新學生狀態為失敗
            const updatedStudents = (await jobRef.get()).data()?.students || [];
            const studentIndex = updatedStudents.findIndex((s: { id: string }) => s.id === student.id);
            if (studentIndex >= 0) {
                updatedStudents[studentIndex].status = 'failed';
                updatedStudents[studentIndex].error = error instanceof Error ? error.message : '生成失敗';
            }

            failedCount++;

            await jobRef.update({
                students: updatedStudents,
                failedCount,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // 記錄失敗使用量
            await db.runTransaction(async (transaction) => {
                const usageDoc = await transaction.get(usageRef);
                const data = usageDoc.data() || { apiCalls: 0, successCount: 0, failedCount: 0, totalTokens: 0 };
                transaction.set(usageRef, {
                    apiCalls: data.apiCalls + 1,
                    successCount: data.successCount,
                    failedCount: data.failedCount + 1,
                    totalTokens: data.totalTokens,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });
        }
    }

    // 更新任務狀態為完成
    await jobRef.update({
        status: failedCount === students.length ? 'failed' : 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
};

/**
 * 查詢批次任務狀態
 */
export const handleGetBatchStatus = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const userId = req.user?.uid;
    const jobId = req.params.jobId;

    if (!userId) {
        res.status(401).json({
            success: false,
            error: '未授權'
        } as ApiResponse);
        return;
    }

    if (!jobId) {
        res.status(400).json({
            success: false,
            error: '缺少任務 ID'
        } as ApiResponse);
        return;
    }

    try {
        const db = getDb();
        const jobDoc = await db.doc(`batchJobs/${jobId}`).get();

        if (!jobDoc.exists) {
            res.status(404).json({
                success: false,
                error: '找不到該任務'
            } as ApiResponse);
            return;
        }

        const jobData = jobDoc.data();

        // 檢查權限
        if (jobData?.userId !== userId) {
            res.status(403).json({
                success: false,
                error: '無權存取此任務'
            } as ApiResponse);
            return;
        }

        res.json({
            success: true,
            data: {
                jobId,
                status: jobData?.status,
                progress: {
                    completed: jobData?.completedCount || 0,
                    failed: jobData?.failedCount || 0,
                    total: jobData?.totalCount || 0
                },
                results: jobData?.students || []
            }
        } as ApiResponse);
    } catch (error) {
        console.error('查詢批次任務失敗:', error);

        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '查詢失敗'
        } as ApiResponse);
    }
};
