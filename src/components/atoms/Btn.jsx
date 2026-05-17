import React from 'react';

/**
 * Btn — 主要動作按鈕
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} [props.icon] - lucide-react icon 節點，例：`<Sparkles size={15} />`
 * @param {'honey'|'coral'|'mint'|'sky'|'lav'|'peach'|'paper'} [props.color='paper'] - solid variant 用
 * @param {'solid'|'outline'|'ghost'} [props.variant='solid']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {() => void} [props.onClick]
 * @param {boolean} [props.disabled]
 * @param {string} [props.className]
 * @param {string} [props.title]
 * @param {'button'|'submit'|'reset'} [props.type='button']
 * @param {string} [props.ariaLabel] - icon-only 按鈕一定要給
 */
const Btn = ({
    children,
    icon,
    color = 'paper',
    variant = 'solid',
    size = 'md',
    onClick,
    disabled,
    className = '',
    title,
    type = 'button',
    ariaLabel,
}) => {
    const sizes = {
        sm: 'h-8 px-2.5 text-[12px] gap-1.5',
        md: 'h-10 px-3.5 text-[13px] gap-2',
        lg: 'h-12 px-4 text-[14.5px] gap-2',
    };

    const isOutline = variant === 'outline';
    const isGhost = variant === 'ghost';

    let style = {};
    if (variant === 'solid') {
        style = { background: `var(--${color})`, color: 'var(--ink)' };
    } else if (isOutline) {
        style = { background: 'transparent', color: 'var(--ink)' };
    } else if (isGhost) {
        style = { background: 'transparent', color: 'var(--ink-soft)' };
    }

    const classes = [
        'inline-flex items-center justify-center font-bold r-btn btn-press',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft',
        sizes[size],
        isGhost ? '' : 'b-ink sh-btn',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            title={title}
            aria-label={ariaLabel}
            style={style}
            className={classes}
        >
            {icon}
            {children}
        </button>
    );
};

export default Btn;
