import React from 'react';
import { Card } from './atoms';

/**
 * 載入覆蓋層 — 批次生成評語時顯示
 *
 * 蜜蜂 bee-bob 動畫 + 蜜糖進度條 + 鼓勵語。
 */
const LoadingOverlay = ({ progress }) => {
    const percentage = progress?.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : 0;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md"
            style={{ background: 'rgba(31, 27, 22, 0.55)' }}
            role="dialog"
            aria-modal="true"
            aria-label="評語產生中"
            aria-live="polite"
        >
            <Card className="w-[95%] sm:w-[90%] max-w-xl flex flex-col items-center text-center p-6 sm:p-10">
                {/* 紙膠帶頂部裝飾 */}
                <div
                    className="tape"
                    style={{ top: -10, left: 60, transform: 'rotate(-3deg)' }}
                    aria-hidden="true"
                />
                <div
                    className="tape"
                    style={{
                        top: -10,
                        right: 80,
                        transform: 'rotate(4deg)',
                        background: 'linear-gradient(180deg, rgba(185,168,230,0.65), rgba(185,168,230,0.45))',
                    }}
                    aria-hidden="true"
                />

                {/* 蜜蜂方塊 + bee-bob 動畫 */}
                <div
                    className="bee-bob mb-5 sm:mb-6"
                    style={{
                        width: 96,
                        height: 96,
                        background: 'var(--honey)',
                        border: 'var(--b-w) solid var(--ink)',
                        boxShadow: 'var(--shadow-card)',
                        borderRadius: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 56,
                        lineHeight: 1,
                    }}
                    aria-hidden="true"
                >
                    🐝
                </div>

                {/* 標題 */}
                <div className="mb-1 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                    AI Writing in Progress
                </div>
                <h2 className="text-[24px] sm:text-[32px] font-black tracking-tight mb-5 sm:mb-6 uw inline-block">
                    評語產生中…
                </h2>

                {/* 進度條 — 蜜糖橫條 */}
                <div
                    className="w-full max-w-md b-ink r-card h-7 sm:h-8 mb-3 overflow-hidden relative"
                    style={{ background: 'var(--paper-2)' }}
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                >
                    <div
                        className="h-full transition-all duration-300 ease-out"
                        style={{
                            width: `${percentage}%`,
                            background: 'var(--honey)',
                            borderRight: percentage > 0 && percentage < 100 ? '2px solid var(--ink)' : 'none',
                        }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center font-mono font-black text-[12px] sm:text-[13px]">
                        {percentage}%
                    </div>
                </div>

                {/* 進度數字 */}
                <p className="text-[14px] sm:text-[16px] font-bold text-[var(--ink)] mb-4">
                    <span className="font-mono">{progress?.current ?? 0}</span>
                    <span className="text-[var(--ink-mute)] mx-1.5">/</span>
                    <span className="font-mono">{progress?.total ?? 0}</span>
                    <span className="ml-1.5 text-[var(--ink-soft)] text-[13px]">位同學</span>
                </p>

                {/* 鼓勵語 */}
                <p className="text-[14px] sm:text-[16px] font-bold" style={{ color: 'var(--coral)' }}>
                    辛苦了各位老師 ❤️
                </p>
            </Card>
        </div>
    );
};

export default LoadingOverlay;
