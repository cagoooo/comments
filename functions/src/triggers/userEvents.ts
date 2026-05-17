/**
 * 使用者生命週期 Firestore Triggers
 *
 * 攔截 `users/{userId}` 文件的 create / update 事件,推 LINE 通知給管理員。
 *
 * 事件 1: Google 帳號首次登入 → users 文件被前端 getOrCreate 建立
 * 事件 2: 使用者送出學校班級申請 → applicationSubmittedAt 從無到有
 */
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { notifyUserCreated, notifyApplicationSubmitted } from '../services/notify-line';

const lineToken = defineSecret('COMMENTS_LINE_CHANNEL_ACCESS_TOKEN');
const lineAdminId = defineSecret('COMMENTS_LINE_ADMIN_USER_ID');

const REGION = 'asia-east1';
const TRIGGER_SECRETS = [lineToken, lineAdminId];

/**
 * 撈學校名稱 (best-effort, 失敗回 fallback)
 */
async function resolveSchoolDisplay(
    schoolId: string | null | undefined,
    customSchoolName?: string | null,
    customSchoolCity?: string | null
): Promise<{ name: string; city: string }> {
    if (customSchoolName) {
        return { name: customSchoolName, city: customSchoolCity || '' };
    }
    if (!schoolId) {
        return { name: '—', city: '' };
    }
    try {
        const snap = await admin.firestore().doc(`schools/${schoolId}`).get();
        if (snap.exists) {
            const data = snap.data() || {};
            return { name: data.name || schoolId, city: data.city || '' };
        }
    } catch (err) {
        logger.warn('[userEvents] 查學校名稱失敗', {
            schoolId,
            msg: err instanceof Error ? err.message : String(err)
        });
    }
    return { name: schoolId, city: '' };
}

/**
 * 新使用者註冊: users/{uid} 文件被建立時觸發
 */
export const onUserCreated = onDocumentCreated(
    { document: 'users/{userId}', region: REGION, secrets: TRIGGER_SECRETS },
    async (event) => {
        const snap = event.data;
        if (!snap) return;
        const data = snap.data() || {};

        try {
            await notifyUserCreated({
                uid: event.params.userId,
                email: data.email || '—',
                displayName: data.displayName || '未命名',
                role: data.role || 'pending_info'
            });
        } catch (err) {
            logger.warn('[onUserCreated] notify 失敗', {
                msg: err instanceof Error ? err.message : String(err)
            });
        }
    }
);

/**
 * 使用者文件更新: 攔截「提交申請」這個事件
 */
export const onUserUpdated = onDocumentUpdated(
    { document: 'users/{userId}', region: REGION, secrets: TRIGGER_SECRETS },
    async (event) => {
        const beforeSnap = event.data?.before;
        const afterSnap = event.data?.after;
        if (!beforeSnap || !afterSnap) return;

        const before = beforeSnap.data() || {};
        const after = afterSnap.data() || {};

        // 偵測「提交申請」: applicationSubmittedAt 從無 → 有
        const applicationJustSubmitted =
            !before.applicationSubmittedAt && after.applicationSubmittedAt;

        if (applicationJustSubmitted) {
            try {
                const school = await resolveSchoolDisplay(
                    after.schoolId,
                    after.customSchoolName,
                    after.customSchoolCity
                );
                const requested: string[] = Array.isArray(after.requestedClasses)
                    ? after.requestedClasses
                    : [];

                await notifyApplicationSubmitted({
                    uid: event.params.userId,
                    email: after.email || '—',
                    displayName: after.displayName || '未命名',
                    schoolName: school.name,
                    schoolCity: school.city,
                    requestedClasses: requested,
                    autoApproved: after.approvedBy === 'system_auto'
                });
            } catch (err) {
                logger.warn('[onUserUpdated] notify 提交申請失敗', {
                    msg: err instanceof Error ? err.message : String(err)
                });
            }
        }
    }
);
