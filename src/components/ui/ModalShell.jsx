import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * 共用 Modal 外殼 — 紙感卡片 + 紙膠帶 + eyebrow + wave underline 標題
 *
 * 用法：
 *   <ModalShell
 *     open={open}
 *     onClose={onClose}
 *     width={1080}
 *     eyebrow="Comment History"
 *     title="評語版本歷史"
 *     tapeColor="sky"
 *     icon={lucide element}   // ReactNode（lucide 元件節點）
 *     subtitle={JSX node}
 *     footer={JSX node}
 *   >
 *     body content
 *   </ModalShell>
 *
 * Props:
 * - open / onClose
 * - width (default 920) — 數字 px 或字串（'90vw'）
 * - title — 主標（自動套 .uw wave underline）
 * - eyebrow — 英文小寫鎖鍵字距小標
 * - subtitle — 副標（ReactNode）
 * - tapeColor (default 'honey') — 紙膠帶 + icon 背景色 token name
 * - icon — ReactNode（建議 lucide 元件）；不傳則不顯示 icon 徽章
 * - footer — ReactNode；不傳則不顯示 footer 區塊
 * - maxHeightVh (default 88)
 * - bodyClassName — 套在 body 容器上的 className（例：'p-6'）
 * - hideTape — 設 true 隱藏頂部紙膠帶（如已嵌入完整 hero 用）
 * - dismissOnBackdrop (default true) — 點 backdrop 是否關閉
 * - dismissOnEsc (default true) — 按 ESC 是否關閉
 */
const ModalShell = ({
    open,
    onClose,
    width = 920,
    title,
    eyebrow,
    subtitle,
    tapeColor = 'honey',
    icon,
    children,
    footer,
    maxHeightVh = 88,
    bodyClassName = '',
    hideTape = false,
    dismissOnBackdrop = true,
    dismissOnEsc = true,
}) => {
    const dialogRef = useRef(null);

    // ESC 關閉
    useEffect(() => {
        if (!open || !dismissOnEsc) return;
        const handler = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, dismissOnEsc, onClose]);

    // 鎖捲動
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    if (!open) return null;

    const widthStyle = typeof width === 'number' ? `${width}px` : width;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[var(--ink)]/40 backdrop-blur-[2px]"
            onClick={dismissOnBackdrop ? onClose : undefined}
            role="presentation"
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={typeof title === 'string' ? title : 'Modal'}
                className="bg-[var(--paper)] b-ink sh-card r-card relative flex flex-col"
                style={{
                    width: '100%',
                    maxWidth: widthStyle,
                    maxHeight: `${maxHeightVh}vh`,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* 紙膠帶裝飾 */}
                {!hideTape && (
                    <>
                        <div
                            className="tape"
                            style={{
                                top: -10,
                                left: 60,
                                transform: 'rotate(-3deg)',
                                background: `linear-gradient(180deg, var(--${tapeColor}-soft) 0%, var(--${tapeColor}-soft) 100%)`,
                                opacity: 0.85,
                            }}
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
                    </>
                )}

                {/* HEADER */}
                <header className="px-5 sm:px-7 pt-5 sm:pt-7 pb-4 border-b-2 border-[var(--ink)]/10 shrink-0">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                            {eyebrow && (
                                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                                    {eyebrow}
                                </div>
                            )}
                            <div className="flex items-center gap-3 mt-0.5">
                                {icon && (
                                    <div
                                        className="w-9 h-9 b-ink r-btn sh-sm flex items-center justify-center shrink-0"
                                        style={{ background: `var(--${tapeColor})` }}
                                    >
                                        {icon}
                                    </div>
                                )}
                                {title && (
                                    <h2 className="text-[20px] sm:text-[26px] font-black tracking-tight uw inline-block">
                                        {title}
                                    </h2>
                                )}
                            </div>
                            {subtitle && (
                                <div className="text-[12px] sm:text-[13px] text-[var(--ink-soft)] mt-2">
                                    {subtitle}
                                </div>
                            )}
                        </div>

                        {/* 關閉鈕 */}
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="關閉"
                            className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 b-ink sh-sm r-btn bg-white inline-flex items-center justify-center btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                        >
                            <X size={16} strokeWidth={2.2} />
                        </button>
                    </div>
                </header>

                {/* BODY */}
                <div className={['flex-1 overflow-y-auto', bodyClassName].filter(Boolean).join(' ')}>
                    {children}
                </div>

                {/* FOOTER（選擇性） */}
                {footer && (
                    <footer
                        className="px-5 sm:px-7 py-3 sm:py-4 border-t-2 border-[var(--ink)]/10 shrink-0"
                        style={{ background: 'rgba(245, 236, 212, 0.4)' }}
                    >
                        {footer}
                    </footer>
                )}
            </div>
        </div>
    );
};

export default ModalShell;
