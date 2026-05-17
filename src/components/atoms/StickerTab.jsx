import React from 'react';

/**
 * StickerTab — 從卡片頂部突出的便利貼分頁標
 *
 * 用在 Card 內當「Step 1 學生名單」這類分頁標題。
 * Parent 必須 `position: relative`（Card atom 已內建）。
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - 標籤文字
 * @param {'honey'|'coral'|'mint'|'sky'|'lav'|'peach'} [props.color='honey']
 * @param {number|string} [props.number] - 顯示在左側的步驟數字
 */
const StickerTab = ({ children, color = 'honey', number }) => (
    <div className="sticker-tab" style={{ background: `var(--${color})` }}>
        {number != null ? (
            <span className="font-mono text-[11px] bg-[var(--ink)] text-[var(--paper)] rounded-full w-5 h-5 inline-flex items-center justify-center">
                {number}
            </span>
        ) : null}
        <span>{children}</span>
    </div>
);

export default StickerTab;
