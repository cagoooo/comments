import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Sparkles, RefreshCw, X, WifiOff } from 'lucide-react';

/**
 * PWA 版本更新通知條（prompt-to-refresh）
 *
 * 參考 skills：pwa-cache-bust / vite-chunk-hash-pwa-self-heal
 *
 * 行為：
 *  - registerType: 'prompt' 下，新版 SW 安裝完會進 waiting，不自動接管。
 *  - useRegisterSW 偵測到 waiting → needRefresh=true → 跳通知條。
 *  - 使用者點「更新」→ updateServiceWorker(true)：對 waiting SW 送 skipWaiting，
 *    換手後自動 reload，載入最新版（不打斷正在打字的人）。
 *  - 雙線偵測：除了 SW lifecycle 事件，再加定期 registration.update() +
 *    分頁重新可見 / 視窗 focus 時主動戳，避免長時間開著的分頁收不到通知。
 *    （GitHub Pages CDN 會 cache sw.js 約 10 分鐘，polling 在窗口過後保證偵測到。）
 *  - 首次安裝完成 → offlineReady=true → 顯示「已可離線使用」小提示，4 秒自動收起。
 */

const UPDATE_CHECK_INTERVAL = 3 * 60 * 1000; // 每 3 分鐘主動檢查一次新版

const PWAUpdatePrompt = () => {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(swUrl, registration) {
            if (!registration) return;

            // 定期主動檢查 sw.js 是否更新（長時間開著的分頁也收得到通知）
            setInterval(() => {
                registration.update().catch(() => { });
            }, UPDATE_CHECK_INTERVAL);

            // 分頁重新可見 / 視窗 focus 時也戳一次，反應更即時
            const checkNow = () => {
                if (document.visibilityState === 'visible') {
                    registration.update().catch(() => { });
                }
            };
            document.addEventListener('visibilitychange', checkNow);
            window.addEventListener('focus', checkNow);
        },
        onRegisterError(error) {
            console.error('[PWA] Service Worker 註冊失敗:', error);
        },
    });

    // 「已可離線使用」提示 4 秒後自動收起
    useEffect(() => {
        if (!offlineReady) return;
        const t = setTimeout(() => setOfflineReady(false), 4000);
        return () => clearTimeout(t);
    }, [offlineReady, setOfflineReady]);

    if (!needRefresh && !offlineReady) return null;

    return (
        <div
            className="fixed left-1/2 -translate-x-1/2 bottom-[88px] md:bottom-6 z-[60] w-[calc(100%-1.5rem)] max-w-[440px] pointer-events-none"
            role="status"
            aria-live="polite"
        >
            {needRefresh ? (
                <div className="pointer-events-auto b-ink sh-card r-card bg-[var(--paper)] p-3.5 flex items-center gap-3">
                    <span
                        className="w-10 h-10 shrink-0 r-btn b-ink flex items-center justify-center"
                        style={{ background: 'var(--honey)' }}
                        aria-hidden="true"
                    >
                        <Sparkles size={18} strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="font-black text-[14px] text-[var(--ink)] leading-tight">
                            有新版本可用 🎉
                        </div>
                        <div className="text-[12px] text-[var(--ink-soft)] mt-0.5">
                            點「更新」載入最新功能
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => updateServiceWorker(true)}
                        className="shrink-0 inline-flex items-center gap-1.5 b-ink sh-btn r-btn h-9 px-3.5 text-[13px] font-bold btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                        style={{ background: 'var(--mint)' }}
                    >
                        <RefreshCw size={14} strokeWidth={2.2} />
                        更新
                    </button>
                    <button
                        type="button"
                        onClick={() => setNeedRefresh(false)}
                        className="shrink-0 w-8 h-8 b-ink sh-sm r-btn bg-white inline-flex items-center justify-center btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                        aria-label="稍後再更新"
                        title="稍後再更新"
                    >
                        <X size={14} strokeWidth={2.2} />
                    </button>
                </div>
            ) : (
                <div className="pointer-events-auto b-ink sh-card r-card bg-[var(--paper)] px-3.5 py-2.5 flex items-center gap-2.5 text-[13px] font-bold text-[var(--ink)]">
                    <WifiOff size={15} strokeWidth={2} style={{ color: 'var(--mint)' }} aria-hidden="true" />
                    已可離線使用 ✓
                </div>
            )}
        </div>
    );
};

export default PWAUpdatePrompt;
