import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Sparkles, RefreshCw, X, WifiOff } from 'lucide-react';
import {
    APP_VERSION,
    BUILD_SHA,
    formatVersion,
    formatBuildDate,
    compareSemver,
} from '../utils/appVersion';

/**
 * PWA 版本更新通知條（prompt-to-refresh）
 *
 * 參考 skills：pwa-cache-bust / vite-chunk-hash-pwa-self-heal / sw-update-prompt-version-gate
 *
 * 偵測：
 *  - registerType: 'prompt'：新版 SW 安裝完進 waiting，不自動接管 → needRefresh=true。
 *  - 每 3 分鐘 registration.update()，分頁回到前景 / 視窗 focus / 網路恢復時也主動檢查，
 *    長時間開著的分頁也收得到通知（GitHub Pages CDN 會快取 sw.js 約 10 分鐘）。
 *
 * 版本比對閘門（顯示前必做，避免「按了更新又跳出來」的假更新循環）：
 *  - 抓 version.json（加時間參數繞過 CDN 快取）與目前頁面的 BUILD_SHA 比對。
 *  - sha 相同 → 目前頁面已是最新，waiting 的是 CDN 殘留的舊 sw.js → 不顯示、也不動它（不 SKIP_WAITING）。
 *  - 線上 semver 比目前舊 → CDN 殘留 → 不顯示。
 *  - 抓不到 version.json → 寬鬆放行（寧可多提示，不可擋掉真更新）。
 *  - 本分頁按過「稍後」的同一版不再重跳；按「更新」後記住該版，重載後不會再提示同一版。
 *
 * 更新：updateServiceWorker(true) → 對 waiting SW 送 SKIP_WAITING → 接管後自動重載。
 *  一般更新不清快取、不註銷 SW（那是舊分塊 404 自癒的最後手段，見 utils/chunkRecovery.js）。
 */

const UPDATE_CHECK_INTERVAL = 3 * 60 * 1000; // 每 3 分鐘主動檢查一次新版
const FOCUS_CHECK_MIN_GAP = 30 * 1000;       // 回到前景時的檢查，最少間隔 30 秒
const DISMISSED_KEY = 'pwa-update-dismissed';
const ACKED_KEY = 'pwa-update-acked';

const readSession = (key) => {
    try { return sessionStorage.getItem(key); } catch { return null; }
};
const writeSession = (key, value) => {
    try { sessionStorage.setItem(key, value); } catch { /* ignore */ }
};

/** 線上版本資訊；失敗回 null（fail-open） */
const fetchRemoteVersion = async () => {
    try {
        const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const data = await res.json();
        return typeof data?.sha === 'string' ? data : null;
    } catch {
        return null;
    }
};

/**
 * 版本閘門：回傳 { show, remote }
 * remote 為 null 代表查不到線上版本，照樣顯示（fail-open）
 */
const evaluateUpdate = async () => {
    const remote = await fetchRemoteVersion();
    if (!remote) return { show: true, remote: null };

    if (remote.sha === BUILD_SHA) return { show: false, remote };                  // 已是最新
    if (compareSemver(remote.version, APP_VERSION) < 0) return { show: false, remote }; // CDN 殘留舊版
    if (readSession(DISMISSED_KEY) === remote.sha) return { show: false, remote };  // 本分頁按過「稍後」
    if (readSession(ACKED_KEY) === remote.sha) return { show: false, remote };      // 剛按過「更新」
    return { show: true, remote };
};

const PWAUpdatePrompt = () => {
    const [visible, setVisible] = useState(false);
    const [remote, setRemote] = useState(null);
    const [updating, setUpdating] = useState(false);

    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(swUrl, registration) {
            if (!registration) return;

            let lastCheck = Date.now();
            const check = () => {
                lastCheck = Date.now();
                registration.update().catch(() => { });
            };

            // 定期主動檢查 sw.js 是否更新（長時間開著的分頁也收得到通知）
            setInterval(check, UPDATE_CHECK_INTERVAL);

            // 分頁回到前景 / 視窗 focus / 網路恢復時也檢查（30 秒內不重複）
            const checkSoon = () => {
                if (document.visibilityState !== 'visible') return;
                if (Date.now() - lastCheck < FOCUS_CHECK_MIN_GAP) return;
                check();
            };
            document.addEventListener('visibilitychange', checkSoon);
            window.addEventListener('focus', checkSoon);
            window.addEventListener('online', checkSoon);
        },
        onRegisterError(error) {
            console.error('[PWA] Service Worker 註冊失敗:', error);
        },
    });

    // 偵測到 waiting SW → 先過版本閘門，通過才顯示
    useEffect(() => {
        if (!needRefresh) return;
        let cancelled = false;
        evaluateUpdate().then(({ show, remote: info }) => {
            if (cancelled) return;
            setRemote(info);
            if (show) {
                setVisible(true);
            } else {
                // 假更新：不顯示，也不 SKIP_WAITING（避免頁面無預警重載）。
                // 重設 needRefresh，之後真的有新版 SW 進 waiting 時才會再次觸發。
                console.info('[PWA] 偵測到 waiting SW，但版本與目前頁面相同或較舊，略過通知', info);
                setNeedRefresh(false);
            }
        });
        return () => { cancelled = true; };
    }, [needRefresh, setNeedRefresh]);

    // 「已可離線使用」提示 4 秒後自動收起
    useEffect(() => {
        if (!offlineReady) return;
        const t = setTimeout(() => setOfflineReady(false), 4000);
        return () => clearTimeout(t);
    }, [offlineReady, setOfflineReady]);

    const handleUpdate = () => {
        if (remote?.sha) writeSession(ACKED_KEY, remote.sha);
        setUpdating(true);
        updateServiceWorker(true);
        // 保險：8 秒內沒換手就單純重新載入（不清快取、不註銷 SW）
        setTimeout(() => window.location.reload(), 8000);
    };

    const handleDismiss = () => {
        if (remote?.sha) writeSession(DISMISSED_KEY, remote.sha);
        setVisible(false);
        setNeedRefresh(false);
    };

    const showUpdate = needRefresh && visible;
    if (!showUpdate && !offlineReady) return null;

    const currentLabel = formatVersion(APP_VERSION);
    const remoteLabel = remote ? formatVersion(remote.version) : '';
    const sameVersion = remote && remote.version === APP_VERSION;
    const remoteDate = remote ? formatBuildDate(remote.builtAt) : '';

    return (
        <div
            className="fixed left-1/2 -translate-x-1/2 bottom-[88px] md:bottom-6 z-[60] w-[calc(100%-1.5rem)] max-w-[520px] pointer-events-none"
            role="status"
            aria-live="polite"
        >
            {showUpdate ? (
                <div className="pointer-events-auto relative b-ink sh-card r-card bg-[var(--paper)] p-4 sm:p-5">
                    {/* NEW 貼紙 */}
                    <span
                        className="absolute -top-3 left-5 b-ink r-btn px-2.5 h-6 inline-flex items-center text-[12px] font-black tracking-wider"
                        style={{ background: 'var(--coral-soft)', transform: 'rotate(-4deg)' }}
                        aria-hidden="true"
                    >
                        NEW ✦
                    </span>

                    <div className="flex items-start gap-3 sm:gap-4">
                        <span
                            className="w-12 h-12 shrink-0 r-btn b-ink flex items-center justify-center"
                            style={{ background: 'var(--honey)' }}
                            aria-hidden="true"
                        >
                            <Sparkles size={22} strokeWidth={2} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="font-black text-[17px] sm:text-[18px] text-[var(--ink)] leading-snug">
                                有新版本可以用了 🎉
                            </div>
                            {remote && (
                                <div className="mt-1 inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] sm:text-[15px] text-[var(--ink)]">
                                    {sameVersion ? (
                                        <span className="font-bold">{currentLabel} 小幅更新</span>
                                    ) : (
                                        <span className="font-bold">
                                            <span className="text-[var(--ink-soft)] font-normal">{currentLabel}</span>
                                            {' → '}
                                            {remoteLabel}
                                        </span>
                                    )}
                                    {remoteDate && (
                                        <span className="text-[var(--ink-soft)]">· {remoteDate} 更新</span>
                                    )}
                                </div>
                            )}
                            <div className="text-[14px] sm:text-[15px] text-[var(--ink-soft)] mt-1 leading-relaxed">
                                正在編輯的評語請先儲存，再按「更新」載入最新版
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="shrink-0 w-9 h-9 b-ink sh-sm r-btn bg-white inline-flex items-center justify-center btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                            aria-label="稍後再更新"
                            title="稍後再更新"
                        >
                            <X size={16} strokeWidth={2.2} />
                        </button>
                    </div>

                    <div className="mt-4 flex gap-2.5 sm:pl-16">
                        <button
                            type="button"
                            onClick={handleUpdate}
                            disabled={updating}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 b-ink sh-btn r-btn h-11 px-5 text-[16px] font-bold btn-press disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                            style={{ background: 'var(--mint)' }}
                        >
                            <RefreshCw size={17} strokeWidth={2.2} className={updating ? 'animate-spin' : ''} />
                            {updating ? '更新中…' : '立即更新'}
                        </button>
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center b-ink sh-sm r-btn h-11 px-5 text-[16px] font-bold bg-white btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                        >
                            稍後
                        </button>
                    </div>
                </div>
            ) : (
                <div className="pointer-events-auto b-ink sh-card r-card bg-[var(--paper)] px-4 py-3 flex items-center gap-2.5 text-[15px] font-bold text-[var(--ink)]">
                    <WifiOff size={17} strokeWidth={2} style={{ color: 'var(--mint)' }} aria-hidden="true" />
                    已可離線使用 ✓
                </div>
            )}
        </div>
    );
};

export default PWAUpdatePrompt;
