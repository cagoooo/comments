import React, { useState } from 'react';
import {
    Minimize2, Maximize2, RefreshCw, Copy, Check, Loader2, SlidersHorizontal,
} from 'lucide-react';

/**
 * 評語調整工具列
 *
 * 樣式換新（chunky chip buttons + soft 色塊），行為與 props 完全保留：
 *  - onAdjust(type, tone) — type: 'shorter' | 'detailed' | 'rephrase'
 *  - isAdjusting / disabled
 *  - 一鍵複製（含 fallback for older browsers）
 *  - 語氣 slider 1~5（正式 ↔ 親切）
 *
 * 若沒有評語、評語為錯誤訊息、或正在撰寫，回 null 不顯示。
 */
const CommentAdjuster = ({
    comment,
    studentName,
    onAdjust,
    isAdjusting,
    disabled = false,
}) => {
    const [copied, setCopied] = useState(false);
    const [showToneSlider, setShowToneSlider] = useState(false);
    const [toneValue, setToneValue] = useState(3); // 1: 正式, 5: 親切

    const handleCopy = async () => {
        if (!comment) return;
        try {
            await navigator.clipboard.writeText(comment);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('複製失敗:', err);
            const textArea = document.createElement('textarea');
            textArea.value = comment;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const adjustButtons = [
        { type: 'shorter', label: '再短', Icon: Minimize2, color: 'sky-soft' },
        { type: 'detailed', label: '再詳細', Icon: Maximize2, color: 'lav-soft' },
        { type: 'rephrase', label: '換說法', Icon: RefreshCw, color: 'honey-soft' },
    ];

    const toneLabels = ['正式', '稍正式', '標準', '稍親切', '親切'];

    if (!comment || comment.includes('❌') || comment.includes('撰寫中')) {
        return null;
    }

    return (
        <div className="mt-2.5 pt-2.5 border-t-2 border-dashed border-[var(--line-soft)]">
            {/* 調整按鈕列 */}
            <div className="flex flex-wrap items-center gap-1.5">
                {adjustButtons.map(({ type, label, Icon, color }) => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => onAdjust(type, toneValue)}
                        disabled={disabled || isAdjusting}
                        style={{ background: `var(--${color})` }}
                        className="b-ink sh-sm r-btn px-2.5 h-7 inline-flex items-center gap-1 text-[11.5px] font-bold btn-press disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                        title={`${label}（${studentName ? `為 ${studentName} 調整` : ''}）`}
                    >
                        {isAdjusting ? (
                            <Loader2 size={11} strokeWidth={1.8} className="animate-spin" />
                        ) : (
                            <Icon size={11} strokeWidth={1.8} />
                        )}
                        <span className="hidden sm:inline">{label}</span>
                    </button>
                ))}

                {/* 語氣 toggle */}
                <button
                    type="button"
                    onClick={() => setShowToneSlider(v => !v)}
                    disabled={disabled || isAdjusting}
                    style={{ background: showToneSlider ? 'var(--mint)' : 'white' }}
                    className="b-ink sh-sm r-btn px-2.5 h-7 inline-flex items-center gap-1 text-[11.5px] font-bold btn-press disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                    aria-expanded={showToneSlider}
                    aria-label="開關語氣 slider"
                >
                    <SlidersHorizontal size={11} strokeWidth={1.8} />
                    <span className="hidden sm:inline">語氣</span>
                </button>

                {/* 複製 */}
                <button
                    type="button"
                    onClick={handleCopy}
                    disabled={disabled}
                    style={{ background: copied ? 'var(--mint)' : 'white' }}
                    className="ml-auto b-ink sh-sm r-btn px-2.5 h-7 inline-flex items-center gap-1 text-[11.5px] font-bold btn-press disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                    aria-label={copied ? '已複製' : '複製評語'}
                >
                    {copied ? (
                        <>
                            <Check size={11} strokeWidth={1.8} />
                            <span className="hidden sm:inline">已複製</span>
                        </>
                    ) : (
                        <>
                            <Copy size={11} strokeWidth={1.8} />
                            <span className="hidden sm:inline">複製</span>
                        </>
                    )}
                </button>
            </div>

            {/* 語氣 slider（展開） */}
            {showToneSlider && (
                <div className="mt-2.5 p-2.5 bg-white b-ink r-btn">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[var(--ink-soft)] mb-2">
                        <span>📋 更正式</span>
                        <span className="text-[var(--ink)]">{toneLabels[toneValue - 1]}</span>
                        <span>💬 更親切</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="5"
                        value={toneValue}
                        onChange={(e) => setToneValue(Number(e.target.value))}
                        className="w-full h-2 cursor-pointer"
                        aria-label="語氣強度（1：最正式 ~ 5：最親切）"
                    />
                    <p className="text-[10.5px] text-[var(--ink-mute)] mt-2 text-center">
                        調整語氣後點擊「再短 / 再詳細 / 換說法」生效
                    </p>
                </div>
            )}
        </div>
    );
};

export default CommentAdjuster;
