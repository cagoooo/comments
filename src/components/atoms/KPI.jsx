import React from 'react';
import Card from './Card';

/**
 * KPI — 統計小卡（用於儀表板 / 頁首 quick stats）
 *
 * @param {Object} props
 * @param {string} props.label - 上方小標籤（uppercase）
 * @param {React.ReactNode} props.value - 主要數值（會用 font-mono 強調）
 * @param {React.ReactNode} [props.sub] - 副標說明文字
 * @param {'honey'|'coral'|'mint'|'sky'|'lav'|'peach'} [props.accent='honey'] - 數值方塊的 soft 底色
 */
const KPI = ({ label, value, sub, accent = 'honey' }) => (
    <Card className="px-4 py-3">
        <div className="flex items-center gap-3">
            <div
                className="w-10 h-10 r-btn b-ink flex items-center justify-center font-mono font-bold text-[15px] shrink-0"
                style={{ background: `var(--${accent}-soft)` }}
            >
                {value}
            </div>
            <div className="leading-tight min-w-0">
                <div className="text-[11px] text-[var(--ink-soft)] font-bold uppercase tracking-wider truncate">
                    {label}
                </div>
                {sub != null ? (
                    <div className="text-[12px] text-[var(--ink-soft)] mt-0.5 truncate">{sub}</div>
                ) : null}
            </div>
        </div>
    </Card>
);

export default KPI;
