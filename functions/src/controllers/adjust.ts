import { Response } from 'express';
import { AuthenticatedRequest, AdjustRequest, ApiResponse } from '../types';
import { adjustComment as adjustCommentService } from '../services/gemini';

/**
 * 評語調整控制器
 */
export const handleAdjust = async (
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

    const { originalComment, adjustType, tone } = req.body as AdjustRequest;

    // 參數驗證
    if (!originalComment) {
        res.status(400).json({
            success: false,
            error: '缺少原始評語'
        } as ApiResponse);
        return;
    }

    if (!adjustType || !['shorter', 'detailed', 'rephrase'].includes(adjustType)) {
        res.status(400).json({
            success: false,
            error: '無效的調整類型'
        } as ApiResponse);
        return;
    }

    try {
        const comment = await adjustCommentService(
            originalComment,
            adjustType,
            tone || 3
        );

        res.json({
            success: true,
            data: {
                comment
            }
        } as ApiResponse);
    } catch (error) {
        console.error('調整評語失敗:', error);

        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '調整失敗'
        } as ApiResponse);
    }
};
