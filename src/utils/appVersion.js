/* global __APP_VERSION__, __BUILD_SHA__, __BUILD_TIME__ */
/**
 * 版本資訊（由 vite.version.js 在 build 時注入，來源是 package.json + git commit）
 * 頁尾、登入頁、更新通知一律從這裡讀，不要再手寫版本字串。
 */
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
export const BUILD_SHA = typeof __BUILD_SHA__ !== 'undefined' ? __BUILD_SHA__ : 'dev';
export const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '';

/** 2.15.0 → v2.15；2.15.3 → v2.15.3（修補號是 0 時省略，讀起來比較乾淨） */
export const formatVersion = (version = APP_VERSION) => {
    const [major = '0', minor = '0', patch = '0'] = String(version).split('.');
    return patch === '0' ? `v${major}.${minor}` : `v${major}.${minor}.${patch}`;
};

/** ISO 時間 → 「11/26」 */
export const formatBuildDate = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getMonth() + 1}/${d.getDate()}`;
};

/** 數值比較 semver（避免 '2.9' > '2.10' 的字串比較陷阱）；a 較新回傳 1 */
export const compareSemver = (a, b) => {
    const pa = String(a).split('.').map(Number);
    const pb = String(b).split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        const x = pa[i] || 0;
        const y = pb[i] || 0;
        if (x !== y) return x > y ? 1 : -1;
    }
    return 0;
};

export const DISPLAY_VERSION = formatVersion();
