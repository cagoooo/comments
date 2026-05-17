import React from 'react';

/**
 * BeeMascot — 蜜蜂吉祥物方塊 + 紙膠帶背景
 *
 * @param {Object} props
 * @param {number} [props.size=56] - 蜜蜂方塊邊長（px）
 * @param {number} [props.rot=-4] - 蜜蜂方塊旋轉角度（deg）
 * @param {boolean} [props.bob=false] - 是否套用 bee-bob 浮動動畫
 * @param {string} [props.className]
 */
const BeeMascot = ({ size = 56, rot = -4, bob = false, className = '' }) => (
    <div
        className={['relative inline-flex', className].filter(Boolean).join(' ')}
        style={{ width: size, height: size }}
        aria-hidden="true"
    >
        {/* 紙膠帶背景 */}
        <span
            className="tape"
            style={{
                top: -10,
                left: -10,
                transform: 'rotate(-12deg)',
                width: size * 0.85,
            }}
        />
        {/* 蜜蜂方塊本體 */}
        <div
            className={bob ? 'bee-bob' : ''}
            style={{
                width: size,
                height: size,
                background: 'var(--honey)',
                border: 'var(--b-w) solid var(--ink)',
                boxShadow: 'var(--shadow-card)',
                borderRadius: 14,
                transform: bob ? undefined : `rotate(${rot}deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: size * 0.55,
                lineHeight: 1,
                position: 'relative',
                zIndex: 2,
            }}
        >
            🐝
        </div>
    </div>
);

export default BeeMascot;
