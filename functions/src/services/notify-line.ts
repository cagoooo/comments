/**
 * LINE 推播通知服務 (純 Push 模式)
 *
 * 共用阿凱老師的統一 Bot Channel,推訊息到管理員 LINE。
 * 採 Flex Message 卡片格式,四種狀態色 (started / success / failed / warning)。
 *
 * Secrets:
 *   - COMMENTS_LINE_CHANNEL_ACCESS_TOKEN  Bot Channel long-lived token
 *   - COMMENTS_LINE_ADMIN_USER_ID         管理員 LINE userId (U + 32 hex)
 *
 * 失敗策略: best-effort, 任何錯誤皆吞掉, 不影響使用者主流程。
 */
import * as logger from 'firebase-functions/logger';

const LINE_PUSH_API = 'https://api.line.me/v2/bot/message/push';
const APP_NAME = '評語產生器';

type CardStatus = 'started' | 'success' | 'failed' | 'warning';

// Header 背景必須用 -700/-800 系列深色,白字才有 WCAG AA 對比 (≥4.5:1)。
// -500 系列 (#10B981、#3B82F6 等) 配白字只有 2.5~3.7:1,在 LINE App 內標題看不清。
const CARD_THEMES: Record<CardStatus, { headerBg: string; headerSubColor: string; icon: string }> = {
    started: { headerBg: '#1E40AF', headerSubColor: '#BFDBFE', icon: '🆕' }, // blue-800 vs 白 ≈ 8:1
    success: { headerBg: '#065F46', headerSubColor: '#A7F3D0', icon: '✅' }, // emerald-800 vs 白 ≈ 6.5:1
    failed:  { headerBg: '#991B1B', headerSubColor: '#FECACA', icon: '❌' }, // red-800 vs 白 ≈ 7.5:1
    warning: { headerBg: '#92400E', headerSubColor: '#FDE68A', icon: '⚠️' } // amber-800 vs 白 ≈ 5.4:1
};

export type CardField = { icon?: string; label: string; value: string };

export type CardSpec = {
    status: CardStatus;
    title: string;
    appName?: string;
    fields: CardField[];
    footerNote?: string;
};

/**
 * 取得 LINE 推播所需 secret (best-effort, 缺一律放棄)
 */
function getLineCredentials(): { token: string; adminId: string } | null {
    const token = process.env.COMMENTS_LINE_CHANNEL_ACCESS_TOKEN?.trim();
    const adminId = process.env.COMMENTS_LINE_ADMIN_USER_ID?.trim();
    if (!token || token === 'DISABLED' || !adminId || adminId === 'DISABLED') {
        return null;
    }
    return { token, adminId };
}

/**
 * 推一張 Flex 卡片給管理員;若 Flex 失敗自動 fallback 純文字。
 * 失敗不會 throw,主流程不會被影響。
 */
export async function notifyAdminCard(card: CardSpec): Promise<void> {
    const creds = getLineCredentials();
    if (!creds) return;

    const flex = buildFlexBubble(card);
    const altText = `${CARD_THEMES[card.status].icon} ${card.title}`;

    try {
        const res = await fetch(LINE_PUSH_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Bearer ${creds.token}`
            },
            body: JSON.stringify({
                to: creds.adminId,
                messages: [{ type: 'flex', altText, contents: flex }]
            })
        });

        if (!res.ok) {
            const errBody = await res.text().catch(() => '');
            logger.warn('[notify-line] Flex 失敗,改試純文字', {
                status: res.status,
                body: errBody.substring(0, 300)
            });

            await fetch(LINE_PUSH_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': `Bearer ${creds.token}`
                },
                body: JSON.stringify({
                    to: creds.adminId,
                    messages: [{ type: 'text', text: cardToPlainText(card) }]
                })
            });
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn('[notify-line] push 失敗', { msg });
    }
}

function buildFlexBubble(card: CardSpec) {
    const theme = CARD_THEMES[card.status];
    const now = new Intl.DateTimeFormat('zh-TW', {
        timeZone: 'Asia/Taipei',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(new Date());

    // Header: icon 與標題分兩行,標題用 lg + bold,深背景 + 白字確保高對比
    const headerContents: Array<Record<string, unknown>> = [
        {
            type: 'text',
            text: theme.icon,
            color: '#FFFFFF',
            size: 'xl'
        },
        {
            type: 'text',
            text: card.title,
            color: '#FFFFFF',
            weight: 'bold',
            size: 'lg',
            wrap: true,
            margin: 'sm'
        }
    ];
    if (card.appName) {
        headerContents.push({
            type: 'text',
            text: card.appName,
            color: theme.headerSubColor,
            size: 'sm',
            margin: 'xs'
        });
    }

    // Body label: icon 放外側獨立 box(只 1.5字寬),label/value 用 4:6 flex,
    // 並把 label 字數控制在 4 字內,避免中文被截斷成 "事" / "觸..."
    const bodyContents = card.fields.map((f) => {
        const row: Array<Record<string, unknown>> = [];
        if (f.icon) {
            row.push({
                type: 'text',
                text: f.icon,
                size: 'sm',
                flex: 0,
                color: '#64748B'
            });
        }
        row.push(
            {
                type: 'text',
                text: f.label,
                color: '#64748B',
                size: 'sm',
                flex: f.icon ? 3 : 4,
                weight: 'bold'
            },
            {
                type: 'text',
                text: f.value || '—',
                color: '#0F172A',
                size: 'sm',
                flex: 6,
                wrap: true
            }
        );
        return {
            type: 'box',
            layout: 'horizontal',
            spacing: 'sm',
            contents: row
        };
    });

    return {
        type: 'bubble',
        size: 'mega',
        header: {
            type: 'box',
            layout: 'vertical',
            backgroundColor: theme.headerBg,
            paddingAll: '16px',
            spacing: 'none',
            contents: headerContents
        },
        body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            paddingAll: '16px',
            contents: bodyContents
        },
        footer: {
            type: 'box',
            layout: 'vertical',
            paddingAll: '12px',
            contents: [
                {
                    type: 'text',
                    text: card.footerNote ? `${now} · ${card.footerNote}` : now,
                    color: '#94A3B8',
                    size: 'xs',
                    align: 'end',
                    wrap: true
                }
            ]
        }
    };
}

function cardToPlainText(card: CardSpec): string {
    const theme = CARD_THEMES[card.status];
    return [
        `${theme.icon} ${card.title}`,
        card.appName ? `(${card.appName})` : '',
        '',
        ...card.fields.map((f) => `${f.icon || ''} ${f.label}：${f.value || '—'}`),
        card.footerNote ? `\n${card.footerNote}` : ''
    ]
        .filter(Boolean)
        .join('\n')
        .substring(0, 4900);
}

/* ------------------------------------------------------------------ */
/* 業務專用的便捷 helper                                                */
/* ------------------------------------------------------------------ */

/**
 * 新使用者 Google 註冊
 */
export async function notifyUserCreated(params: {
    uid: string;
    email: string;
    displayName: string;
    role: string;
}): Promise<void> {
    await notifyAdminCard({
        status: 'started',
        title: '新使用者註冊',
        appName: APP_NAME,
        fields: [
            { icon: '👤', label: '姓名', value: params.displayName },
            { icon: '📧', label: '信箱', value: params.email },
            { icon: '🏷️', label: '角色', value: roleToZh(params.role) },
            { icon: '🆔', label: 'UID', value: params.uid.substring(0, 12) + '…' }
        ]
    });
}

/**
 * 使用者提交學校班級申請 (自動審核通過)
 */
export async function notifyApplicationSubmitted(params: {
    uid: string;
    email: string;
    displayName: string;
    schoolName: string;
    schoolCity: string;
    requestedClasses: string[];
    autoApproved: boolean;
}): Promise<void> {
    await notifyAdminCard({
        status: 'success',
        title: params.autoApproved ? '使用者資料已自動審核通過' : '使用者提交申請',
        appName: APP_NAME,
        fields: [
            { icon: '👤', label: '姓名', value: params.displayName },
            { icon: '📧', label: '信箱', value: params.email },
            { icon: '🏫', label: '學校', value: `${params.schoolName}${params.schoolCity ? ` (${params.schoolCity})` : ''}` },
            { icon: '👥', label: '班級', value: params.requestedClasses.length > 0 ? params.requestedClasses.join('、') : '—' },
            { icon: '🎯', label: '狀態', value: params.autoApproved ? '已自動核准為教師' : '待管理員審核' }
        ]
    });
}

/**
 * API 使用障礙 / Cloud Function 錯誤告警
 *
 * 含簡易節流: 同一個 errorKey 在 60 秒內只會推一次,避免洗版。
 * (per-instance memory,跨 instance 仍可能重複,但已能擋住常見的瞬時連續錯誤)
 */
const errorThrottle = new Map<string, number>();
const ERROR_THROTTLE_MS = 60 * 1000;

export async function notifyApiError(params: {
    endpoint: string;
    userEmail?: string;
    userUid?: string;
    errorMessage: string;
    errorKey?: string;
    extraFields?: CardField[];
}): Promise<void> {
    const throttleKey = params.errorKey || `${params.endpoint}::${params.errorMessage.substring(0, 50)}`;
    const lastSent = errorThrottle.get(throttleKey);
    const now = Date.now();
    if (lastSent && now - lastSent < ERROR_THROTTLE_MS) {
        return;
    }
    errorThrottle.set(throttleKey, now);

    // 清掉太舊的紀錄 (避免 map 無限長大)
    for (const [k, t] of errorThrottle.entries()) {
        if (now - t > ERROR_THROTTLE_MS * 10) errorThrottle.delete(k);
    }

    const fields: CardField[] = [
        { icon: '🔌', label: '端點', value: params.endpoint },
        { icon: '💬', label: '錯誤', value: params.errorMessage.substring(0, 280) }
    ];
    if (params.userEmail) fields.push({ icon: '📧', label: '用戶', value: params.userEmail });
    if (params.userUid) fields.push({ icon: '🆔', label: 'UID', value: params.userUid.substring(0, 12) + '…' });
    if (params.extraFields) fields.push(...params.extraFields);

    await notifyAdminCard({
        status: 'failed',
        title: 'API 使用障礙',
        appName: APP_NAME,
        fields,
        footerNote: '同類錯誤 60 秒內只推一次'
    });
}

/**
 * 每日使用量彙整報告
 *
 * 把當日 usage 統計用 Flex Message 推給管理員。
 * 由 dailyUsageReport Cloud Scheduler 每日 21:00 (Asia/Taipei) 觸發。
 */
export async function notifyDailyReport(params: {
    dateLabel: string;          // 例：'5/18'
    activeTeacherCount: number;
    totalApiCalls: number;
    successCount: number;
    failedCount: number;
    topUser?: { displayName: string; calls: number } | null;
    totalTeachers: number;
}): Promise<void> {
    const successRate = params.totalApiCalls > 0
        ? Math.round((params.successCount / params.totalApiCalls) * 100)
        : 0;

    const fields: CardField[] = [
        { icon: '👥', label: '活躍教師', value: `${params.activeTeacherCount} / ${params.totalTeachers} 位` },
        { icon: '✍️', label: '評語生成', value: `${params.totalApiCalls} 次` },
        { icon: '✅', label: '成功率', value: `${successRate}%（${params.successCount} 次）` },
    ];

    if (params.failedCount > 0) {
        fields.push({ icon: '❌', label: '失敗', value: `${params.failedCount} 次` });
    }

    if (params.topUser && params.topUser.calls > 0) {
        fields.push({
            icon: '🏆',
            label: '最高使用',
            value: `${params.topUser.displayName} · ${params.topUser.calls} 次`
        });
    }

    // 失敗率 ≥ 20% 升級為 warning 狀態（深橘色 header）讓管理員容易注意到
    const status: CardStatus = (params.totalApiCalls > 0 && params.failedCount / params.totalApiCalls >= 0.2)
        ? 'warning'
        : 'success';

    await notifyAdminCard({
        status,
        title: `${params.dateLabel} 使用日報`,
        appName: APP_NAME,
        fields,
        footerNote: params.totalApiCalls === 0 ? '今日無人使用 API' : undefined
    });
}

function roleToZh(role: string): string {
    switch (role) {
        case 'admin': return '管理員';
        case 'teacher': return '教師';
        case 'pending_info': return '待填寫資料';
        case 'pending_review': return '待審核';
        case 'pending': return '待審核';
        default: return role || '—';
    }
}
