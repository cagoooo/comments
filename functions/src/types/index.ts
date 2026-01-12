/**
 * 型別定義
 */

import { Request } from 'express';

// 評語生成請求
export interface GenerateRequest {
    name: string;
    traits: string;
    styles: string[];
    tone: 'normal' | 'casual' | 'formal';
    wordCount: number;
}

// 評語調整請求
export interface AdjustRequest {
    originalComment: string;
    adjustType: 'shorter' | 'detailed' | 'rephrase';
    tone: number; // 1-5
}

// 批次生成請求
export interface BatchRequest {
    students: Array<{
        id: string;
        name: string;
        traits: string;
    }>;
    styles: string[];
    tone: 'normal' | 'casual' | 'formal';
    wordCount: number;
}

// API 回應
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

// 使用量資料
export interface UsageData {
    apiCalls: number;
    successCount: number;
    failedCount: number;
    totalTokens: number;
    updatedAt: Date;
}

// 驗證後的請求（帶有用戶資訊）
export interface AuthenticatedRequest extends Request {
    user?: {
        uid: string;
        email?: string;
    };
}
