/**
 * 舊程式分塊 404 自癒（參考 skill：vite-chunk-hash-pwa-self-heal）
 *
 * 情境：老師的分頁一直開著，期間網站換版，Vite 產生的分塊檔名（hash）全換了；
 * 這時點開某個延遲載入的視窗（評語風格、匯出…），瀏覽器去抓「舊檔名」→ 404 → 原本會看到「出了點問題」。
 *
 * 作法：只認明確的分塊載入錯誤 → 清掉 SW 與快取 → 重新載入拿最新版。
 * - 同一分頁 sessionStorage 只試一次，避免極端情況無限重載；第二次失敗交給 ErrorBoundary 的錯誤畫面。
 * - 這是最後手段，一般「有新版本」通知不走這條（不清快取、不註銷 SW）。
 */

const FLAG = 'chunk-reload-attempted';
const CHUNK_ERROR_RE = /Loading chunk|Loading CSS chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Unable to preload CSS/i;

export const isChunkError = (errOrMessage) => {
    if (!errOrMessage) return false;
    if (typeof errOrMessage === 'string') return CHUNK_ERROR_RE.test(errOrMessage);
    const text = `${errOrMessage.name || ''} ${errOrMessage.message || ''} ${errOrMessage.stack || ''}`;
    return CHUNK_ERROR_RE.test(text);
};

/** 本分頁還能不能自癒（已試過就回 false） */
export const canAttemptChunkRecovery = () => {
    try {
        return sessionStorage.getItem(FLAG) !== '1';
    } catch {
        return true;
    }
};

const showRecoveringNotice = () => {
    if (document.getElementById('chunk-recovery-notice')) return;
    const el = document.createElement('div');
    el.id = 'chunk-recovery-notice';
    el.setAttribute('role', 'status');
    el.style.cssText = [
        'position:fixed', 'left:50%', 'bottom:24px', 'transform:translateX(-50%)', 'z-index:9999',
        'background:var(--paper,#FBF5E6)', 'color:var(--ink,#1F1B16)', 'border:2px solid var(--ink,#1F1B16)',
        'border-radius:14px', 'box-shadow:4px 4px 0 var(--ink,#1F1B16)', 'padding:14px 20px',
        'font:700 16px/1.5 system-ui,sans-serif', 'max-width:calc(100% - 24px)',
    ].join(';');
    el.textContent = '🐝 網站剛更新，正在幫你載入最新版本…';
    document.body.appendChild(el);
};

let recovering = false;

/**
 * 執行自癒：清 SW + 快取 → 1.2 秒後重載。
 * 回傳 true 表示已開始自癒；false 表示本分頁已試過，交給一般錯誤處理。
 */
export const recoverFromChunkError = async (reason) => {
    if (recovering) return true;
    if (!canAttemptChunkRecovery()) {
        console.warn('[chunk] 已自癒過一次仍失敗，交給錯誤畫面處理', reason);
        return false;
    }
    recovering = true;
    try {
        sessionStorage.setItem(FLAG, '1');
    } catch { /* sessionStorage 不可用就直接重載 */ }

    console.warn('[chunk] 偵測到舊分塊載入失敗，清快取後重新載入', reason);
    showRecoveringNotice();

    try {
        if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
        }
        if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
        }
    } catch (e) {
        console.warn('[chunk] 清 SW / 快取失敗，直接重載', e);
    }

    setTimeout(() => window.location.reload(), 1200);
    return true;
};

/** 在 React 渲染前呼叫一次：接住 React 樹外的分塊錯誤 */
export const installChunkErrorRecovery = () => {
    if (typeof window === 'undefined') return;

    // Vite 預先載入（modulepreload / CSS）失敗時發出的專屬事件
    window.addEventListener('vite:preloadError', (event) => {
        if (canAttemptChunkRecovery()) {
            event.preventDefault();
            void recoverFromChunkError(event.payload?.message || 'vite:preloadError');
        }
    });

    window.addEventListener('unhandledrejection', (event) => {
        if (isChunkError(event.reason)) void recoverFromChunkError(event.reason?.message);
    });

    window.addEventListener('error', (event) => {
        if (isChunkError(event.error || event.message)) void recoverFromChunkError(event.message);
    }, true);

    // 正常運作 30 秒後解除旗標：同一分頁之後若又遇到換版，還能再自癒一次
    // （重載後立刻又失敗的話旗標還在，不會形成快速重載循環）
    setTimeout(() => {
        try { sessionStorage.removeItem(FLAG); } catch { /* ignore */ }
    }, 30000);
};
