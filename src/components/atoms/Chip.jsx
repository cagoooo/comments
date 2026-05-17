import React from 'react';
import { X } from 'lucide-react';

/**
 * Chip — 5 色 soft 變體標籤
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {'honey'|'coral'|'mint'|'sky'|'lav'|'peach'} [props.color='honey']
 * @param {boolean} [props.soft=false] - 是否用 soft 變體
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {() => void} [props.onClose] - 顯示關閉鈕
 * @param {() => void} [props.onClick] - 整個 chip 可點
 * @param {string} [props.className]
 * @param {string} [props.ariaLabel]
 */
const Chip = ({
    children,
    color = 'honey',
    soft = false,
    size = 'md',
    onClose,
    onClick,
    className = '',
    ariaLabel,
}) => {
    const bgVar = soft ? `var(--${color}-soft)` : `var(--${color})`;
    const sizes = {
        sm: 'h-6 px-2 text-[11.5px]',
        md: 'h-7 px-2.5 text-[12.5px]',
        lg: 'h-8 px-3 text-[13px]',
    };
    const interactive = !!onClick;

    return (
        <span
            onClick={onClick}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={ariaLabel}
            onKeyDown={interactive ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
            } : undefined}
            style={{ background: bgVar, color: 'var(--ink)' }}
            className={[
                'inline-flex items-center gap-1 rounded-full font-bold',
                'border-2 border-ink',
                sizes[size],
                interactive ? 'cursor-pointer btn-press' : '',
                className,
            ].filter(Boolean).join(' ')}
        >
            {children}
            {onClose ? (
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    aria-label="移除"
                    className="opacity-60 hover:opacity-100 inline-flex items-center justify-center"
                    type="button"
                >
                    <X size={11} strokeWidth={2.3} />
                </button>
            ) : null}
        </span>
    );
};

export default Chip;
