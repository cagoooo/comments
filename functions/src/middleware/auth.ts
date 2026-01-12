import * as admin from 'firebase-admin';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

/**
 * 驗證 Firebase ID Token 的中介層
 */
export const validateFirebaseIdToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
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
