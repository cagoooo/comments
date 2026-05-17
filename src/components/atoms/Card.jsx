import React from 'react';

/**
 * Card — 厚黑邊框 + 偏移陰影的基底容器
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 * @param {React.CSSProperties} [props.style]
 * @param {React.ElementType} [props.as='div']
 */
const Card = React.forwardRef(function Card(
    { children, className = '', style = {}, as: As = 'div', ...rest },
    ref
) {
    return (
        <As
            ref={ref}
            style={style}
            className={['bg-white b-ink sh-card r-card relative', className]
                .filter(Boolean).join(' ')}
            {...rest}
        >
            {children}
        </As>
    );
});

export default Card;
