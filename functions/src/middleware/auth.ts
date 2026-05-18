import * as admin from 'firebase-admin';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

/**
 * App Check enforcement 模式（C1, Phase 1：fail-open）
 *
 *   'off'      → 完全不檢查 App Check token（適用：尚未啟用 reCAPTCHA / 觀察期）
 *   'observe'  → 檢查 token 但 invalid 只記錄不擋（觀察期，看誤殺率）
 *   'enforce'  → 嚴格 enforce，invalid token 直接 403（觀察期通過後切到這個）
 *
 * 切換方式：改下面 `APP_CHECK_MODE` 常數後重新部署 Functions。
 * 未來可改成從 Firestore `adminConfig/system` 讀取，做到「不重新部署即可切換」。
 */
const APP_CHECK_MODE: 'off' | 'observe' | 'enforce' = 'off';

/**
 * 驗證 App Check token（best-effort，不影響主流程）
 * 回傳 true = pass / log warning，false = block（僅 enforce 模式下會 block）
 */
const validateAppCheckToken = async (req: AuthenticatedRequest): Promise<boolean> => {
    if (APP_CHECK_MODE === 'off') return true;

    const appCheckToken = req.header('X-Firebase-AppCheck');

    if (!appCheckToken) {
        console.warn('[App Check] 缺少 token', {
            mode: APP_CHECK_MODE,
            ip: req.ip,
            path: req.path,
        });
        return APP_CHECK_MODE !== 'enforce'; // observe: pass, enforce: block
    }

    try {
        await admin.appCheck().verifyToken(appCheckToken);
        return true;
    } catch (err) {
        console.warn('[App Check] token 驗證失敗', {
            mode: APP_CHECK_MODE,
            ip: req.ip,
            path: req.path,
            error: err instanceof Error ? err.message : String(err),
        });
        return APP_CHECK_MODE !== 'enforce';
    }
};

/**
 * 驗證 Firebase ID Token 的中介層
 *
 * 順序：
 *   1. App Check token 驗證（依 APP_CHECK_MODE 決定要不要 block）
 *   2. Firebase ID Token 驗證（一律 enforce）
 */
export const validateFirebaseIdToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    // ── App Check ─────────────────────────────────────────────
    const appCheckPassed = await validateAppCheckToken(req);
    if (!appCheckPassed) {
        res.status(403).json({
            success: false,
            error: 'App Check 驗證失敗（疑似自動化請求）'
        });
        return;
    }

    // ── Firebase Auth ID Token ────────────────────────────────
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            error: '未提供驗證令牌'
        });
        return;
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email
        };
        next();
    } catch (error) {
        console.error('Token 驗證失敗:', error);
        res.status(401).json({
            success: false,
            error: '驗證令牌無效或已過期'
        });
        return;
    }
};
