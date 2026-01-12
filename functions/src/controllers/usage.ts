import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { getUsageStats } from '../services/quota';

/**
 * 使用量查詢控制器
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
