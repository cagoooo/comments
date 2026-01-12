import React, { useState } from 'react';
import { Minimize2, Maximize2, RefreshCw, Copy, Check, Loader2, SlidersHorizontal } from 'lucide-react';

/**
 * 評語調整元件
 * 提供快速調整按鈕、語氣滑桿、一鍵複製功能
 */
const CommentAdjuster = ({
    comment,
    studentName,
    onAdjust,
    isAdjusting,
    disabled = false
}) => {
    const [copied, setCopied] = useState(false);
    const [showToneSlider, setShowToneSlider] = useState(false);
    const [toneValue, setToneValue] = useState(3); // 1: 正式, 5: 親切

    // 複製評語
    const handleCopy = async () => {
        if (!comment) return;

        try {
            await navigator.clipboard.writeText(comment);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('複製失敗:', err);
            // Fallback for older browsers
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

    // 調整按鈕
    const adjustButtons = [
        { type: 'shorter', label: '再短一點', icon: Minimize2, color: 'bg-[#54A0FF]' },
        { type: 'detailed', label: '再詳細一點', icon: Maximize2, color: 'bg-[#A29BFE]' },
        { type: 'rephrase', label: '換種說法', icon: RefreshCw, color: 'bg-[#FECA57]' }
    ];

    // 語氣標籤
    const toneLabels = ['正式', '稍正式', '標準', '稍親切', '親切'];

    // 如果沒有評語或評語包含錯誤訊息，不顯示調整工具
    if (!comment || comment.includes('❌') || comment.includes('撰寫中')) {
        return null;
    }

    return (
        <div className="mt-2 pt-2 border-t-2 border-dashed border-[#E8DCC8]">
            {/* 調整按鈕列 */}
            <div className="flex flex-wrap items-center gap-2">
                {adjustButtons.map(({ type, label, icon: Icon, color }) => (
                    <button
                        key={type}
                        onClick={() => onAdjust(type, toneValue)}
                        disabled={disabled || isAdjusting}
                        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white rounded-lg border-2 border-[#2D3436] shadow-[2px_2px_0_#2D3436] transition-all active:shadow-none active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${color}`}
                    >
                        {isAdjusting ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : (
                            <Icon size={12} />
                        )}
                        <span className="hidden sm:inline">{label}</span>
                    </button>
                ))}

                {/* 語氣調整按鈕 */}
                <button
                    onClick={() => setShowToneSlider(!showToneSlider)}
                    disabled={disabled || isAdjusting}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border-2 border-[#2D3436] shadow-[2px_2px_0_#2D3436] transition-all active:shadow-none active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 ${showToneSlider ? 'bg-[#1DD1A1] text-white' : 'bg-white text-[#2D3436]'}`}
                >
                    <SlidersHorizontal size={12} />
                    <span className="hidden sm:inline">語氣</span>
                </button>

                {/* 複製按鈕 */}
                <button
                    onClick={handleCopy}
                    disabled={disabled}
                    className={`ml-auto flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border-2 border-[#2D3436] shadow-[2px_2px_0_#2D3436] transition-all active:shadow-none active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 ${copied ? 'bg-[#1DD1A1] text-white' : 'bg-white text-[#2D3436] hover:bg-[#FF6B9D] hover:text-white'}`}
                >
                    {copied ? (
                        <>
                            <Check size={12} />
                            <span>已複製</span>
                        </>
                    ) : (
                        <>
                            <Copy size={12} />
                            <span>複製</span>
                        </>
                    )}
                </button>
            </div>

            {/* 語氣滑桿（可展開） */}
            {showToneSlider && (
                <div className="mt-3 p-3 bg-white border-2 border-[#E8DCC8] rounded-lg">
                    <div className="flex items-center justify-between text-xs font-bold text-[#636E72] mb-2">
                        <span>📋 更正式</span>
                        <span className="text-[#2D3436]">{toneLabels[toneValue - 1]}</span>
                        <span>💬 更親切</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="5"
                        value={toneValue}
                        onChange={(e) => setToneValue(Number(e.target.value))}
                        className="w-full h-2 bg-gradient-to-r from-[#54A0FF] via-[#FECA57] to-[#FF6B9D] rounded-lg appearance-none cursor-pointer"
                        style={{
                            WebkitAppearance: 'none'
                        }}
                    />
                    <p className="text-xs text-[#636E72] mt-2 text-center">
                        調整語氣後點擊調整按鈕生效
                    </p>
                </div>
            )}
        </div>
    );
};

export default CommentAdjuster;
