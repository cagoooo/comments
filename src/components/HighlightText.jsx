import React from 'react';

/**
 * 文字高亮元件
 * 將匹配的文字以黃底高亮顯示
 */
const HighlightText = ({ text, highlight, className = '' }) => {
    if (!highlight || !highlight.trim() || !text) {
        return <span className={className}>{text}</span>;
    }

    // 將搜尋字串轉為正則表達式（忽略大小寫）
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
                            className="bg-[#FECA57] text-[#2D3436] px-0.5 rounded font-bold"
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
