import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

/**
 * 版本號單一來源（package.json）＋部署身分（git commit）
 *
 * - 注入 __APP_VERSION__ / __BUILD_SHA__ / __BUILD_TIME__ 給前端（頁尾、登入頁、更新通知共用）
 * - build 時輸出 version.json，給 PWAUpdatePrompt 做「版本比對閘門」：
 *   waiting SW 出現時先比對 version.json 的 sha 與目前頁面的 sha，相同就是假更新（CDN 殘留舊 sw.js），不跳通知。
 * - BUILD_TIME 用「提交時間」不用「現在時間」：同一個 commit 重跑部署，版本資訊完全不變。
 *   （參考 skill：sw-update-prompt-version-gate）
 */
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

const git = (cmd) => {
    try {
        return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch {
        return '';
    }
};

const sha = (process.env.GITHUB_SHA || git('git rev-parse HEAD') || 'dev').slice(0, 12);
const builtAt = git('git log -1 --format=%cI') || new Date().toISOString();

export const versionInfo = { version: pkg.version, sha, builtAt };

export const versionDefine = {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_SHA__: JSON.stringify(sha),
    __BUILD_TIME__: JSON.stringify(builtAt),
};

/** build 時把 version.json 輸出到 dist 根目錄（不進 SW precache：globPatterns 不含 json） */
export function versionJsonPlugin() {
    return {
        name: 'app-version-json',
        apply: 'build',
        generateBundle() {
            this.emitFile({
                type: 'asset',
                fileName: 'version.json',
                source: JSON.stringify(versionInfo, null, 2),
            });
        },
    };
}
