import { useCallback, useEffect, useState } from 'react';
import { settingsService } from '../firebase';

const STORAGE_KEY = 'goldenbee_theme'; // 'light' | 'dark' | 'system'
const VALID = new Set(['light', 'dark', 'system']);

// 新使用者（沒存過偏好）一律預設「淺色」— 看得更清楚，絕不預設深色。
// 使用者仍可在主題切換選 深色 / 跟隨系統，選了就存起來不受此預設影響。
const DEFAULT_PREF = 'light';

/**
 * 讀 localStorage 偏好（同步取得，避免 first paint 時主題閃爍）
 */
export const readThemePref = () => {
    if (typeof window === 'undefined') return DEFAULT_PREF;
    try {
        const v = window.localStorage.getItem(STORAGE_KEY);
        return VALID.has(v) ? v : DEFAULT_PREF;
    } catch {
        return DEFAULT_PREF;
    }
};

/**
 * 從偏好 + 系統設定決定實際要套用哪個 mode
 */
export const resolveEffectiveMode = (pref) => {
    if (pref === 'light' || pref === 'dark') return pref;
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * 把 mode 套到 <html data-mode="...">
 */
export const applyMode = (mode) => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.mode = mode;
    // 順手更新 PWA theme-color，狀態列也跟著變
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
        themeMeta.setAttribute('content', mode === 'dark' ? '#1E1A14' : '#F4B826');
    }
};

/**
 * useTheme — 主題管理 hook
 *
 * 用法：
 *   const { pref, effectiveMode, setPref, cycle } = useTheme(currentUser?.uid);
 *
 * 行為：
 * - 首次 mount：用 localStorage 偏好設定（避免 flash），不等 Firestore
 * - 登入後：訂閱 Firestore settings.theme，雲端值 win（讓跨裝置一致）
 * - 改偏好：同步寫 localStorage + Firestore（best-effort）
 * - system 模式：監聽 prefers-color-scheme，OS 切換時自動跟著切
 */
export const useTheme = (userId) => {
    const [pref, setPrefState] = useState(readThemePref);
    const [effectiveMode, setEffectiveMode] = useState(() => resolveEffectiveMode(readThemePref()));

    // 套用實際 mode
    useEffect(() => {
        applyMode(effectiveMode);
    }, [effectiveMode]);

    // 監聽 OS 主題變化（只在 system 模式下生效）
    useEffect(() => {
        if (pref !== 'system' || typeof window === 'undefined') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => setEffectiveMode(mq.matches ? 'dark' : 'light');
        mq.addEventListener?.('change', handler);
        return () => mq.removeEventListener?.('change', handler);
    }, [pref]);

    // 從 Firestore 同步偏好（雲端值 win）
    useEffect(() => {
        if (!userId) return;
        const unsub = settingsService.subscribe((data) => {
            const cloudPref = data?.theme;
            if (cloudPref && VALID.has(cloudPref) && cloudPref !== pref) {
                setPrefState(cloudPref);
                setEffectiveMode(resolveEffectiveMode(cloudPref));
                try {
                    window.localStorage.setItem(STORAGE_KEY, cloudPref);
                } catch { /* localStorage 滿了 / 隱私模式 — 忽略 */ }
            }
        });
        return unsub;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const setPref = useCallback(async (next) => {
        if (!VALID.has(next)) return;
        setPrefState(next);
        setEffectiveMode(resolveEffectiveMode(next));

        // 寫 localStorage（同步，立即生效）
        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        } catch { /* 同上忽略 */ }

        // 寫 Firestore（best-effort，失敗不影響本地）
        if (userId) {
            try {
                await settingsService.save({ theme: next });
            } catch (err) {
                console.warn('儲存主題偏好到雲端失敗:', err);
            }
        }
    }, [userId]);

    /**
     * cycle — 三段循環切換：light → dark → system → light...
     * 給 quick toggle button 用
     */
    const cycle = useCallback(() => {
        const order = ['light', 'dark', 'system'];
        const idx = order.indexOf(pref);
        const next = order[(idx + 1) % order.length];
        setPref(next);
    }, [pref, setPref]);

    return { pref, effectiveMode, setPref, cycle };
};

/**
 * 在 React app 渲染之前同步套用 localStorage 偏好。
 * 在 main.jsx 一開始就呼叫，避免 first paint 用錯誤主題（俗稱 FOUC）。
 */
export const bootstrapTheme = () => {
    const pref = readThemePref();
    const effective = resolveEffectiveMode(pref);
    applyMode(effective);
};
