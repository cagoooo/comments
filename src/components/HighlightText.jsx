import React from 'react';

/**
 * 文字高亮元件
 * 將匹配的文字以蜜糖底色高亮顯示
 */
const HighlightText = ({ text, highlight, className = '' }) => {
    if (!highlight || !highlight.trim() || !text) {
        return <span className={className}>{text}</span>;
    }

    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedHighlight})`, 'gi');
    const parts = text.split(regex);

    return (
        <span className={className}>
            {parts.map((part, index) => {
                if (part.toLowerCase() === highlight.toLowerCase()) {
                    return (
                        <mark
                            key={index}
                            className="px-0.5 rounded font-bold"
                            style={{ background: 'var(--honey)', color: 'var(--ink)' }}
                        >
                            {part}
                        </mark>
                    );
                }
                return part;
            })}
        </span>
    );
};

export default HighlightText;
