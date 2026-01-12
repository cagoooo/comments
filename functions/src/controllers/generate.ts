import { Response } from 'express';
import { AuthenticatedRequest, GenerateRequest, ApiResponse } from '../types';
import { generateComment } from '../services/gemini';
import { checkQuota } from '../services/quota';
import * as admin from 'firebase-admin';

/**
 * 取得 Firestore 實例（懶載入）
 */
const getDb = () => admin.firestore();

/**
 * 記錄使用量
 */
const recordUsage = async (userId: string, success: boolean): Promise<void> => {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const usageRef = db.doc(`users/${userId}/usage/${today}`);

    await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(usageRef);
        const data = doc.data() || {
            apiCalls: 0,
            successCount: 0,
            failedCount: 0,
            totalTokens: 0
        };

        transaction.set(usageRef, {
            apiCalls: data.apiCalls + 1,
            successCount: data.successCount + (success ? 1 : 0),
            failedCount: data.failedCount + (success ? 0 : 1),
            totalTokens: data.totalTokens,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    });
};

/**
 * 評語生成控制器
 */
export const handleGenerate = async (
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

    // 檢查配額
    const quotaCheck = await checkQuota(userId);
    if (!quotaCheck.allowed) {
        res.status(429).json({
            success: false,
            error: quotaCheck.message,
            data: {
                dailyUsed: quotaCheck.dailyUsed,
                dailyLimit: quotaCheck.dailyLimit,
                monthlyUsed: quotaCheck.monthlyUsed,
                monthlyLimit: quotaCheck.monthlyLimit
            }
        } as ApiResponse);
        return;
    }

    const { name, traits, styles, tone, wordCount } = req.body as GenerateRequest;

    // 參數驗證
    if (!name) {
        res.status(400).json({
            success: false,
            error: '缺少學生姓名'
        } as ApiResponse);
        return;
    }

    try {
        const comment = await generateComment(
            name,
            traits || '',
            styles || [],
            tone || 'normal',
            wordCount || 80
        );

        // 記錄成功使用量
        await recordUsage(userId, true);

        res.json({
            success: true,
            data: {
                comment
            }
        } as ApiResponse);
    } catch (error) {
        console.error('生成評語失敗:', error);

        // 記錄失敗使用量
        await recordUsage(userId, false);

        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '生成失敗'
        } as ApiResponse);
    }
};
