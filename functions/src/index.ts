import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { validateFirebaseIdToken } from './middleware/auth';
import { handleGenerate } from './controllers/generate';
import { handleAdjust } from './controllers/adjust';
import { handleGetUsage } from './controllers/usage';
import { handleCreateBatch, handleGetBatchStatus } from './controllers/batch';

// 定義 Secret
const geminiApiKey = defineSecret('GEMINI_API_KEY');

// 初始化 Firebase Admin
admin.initializeApp();

// 建立 Express 應用
const app = express();

// 中介層
app.use(cors({ origin: true }));
app.use(express.json());

// API 路由（需要驗證）
app.post('/generate', validateFirebaseIdToken, handleGenerate);
app.post('/adjust', validateFirebaseIdToken, handleAdjust);
app.get('/usage', validateFirebaseIdToken, handleGetUsage);
app.post('/batch', validateFirebaseIdToken, handleCreateBatch);
app.get('/batch/:jobId', validateFirebaseIdToken, handleGetBatchStatus);

// 健康檢查端點（不需驗證）
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 匯出為 Cloud Functions v2
export const api = onRequest(
    {
        region: 'asia-east1',
        timeoutSeconds: 60,
        memory: '256MiB',
        secrets: [geminiApiKey]
    },
    app
);

// 匯出定時任務
export { weeklyUsageReport, dailyCleanup } from './scheduled/reports';
