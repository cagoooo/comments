import React from 'react';
import { Palette, Edit3 } from 'lucide-react';
import { STYLE_DEFINITIONS } from '../data/styleDefinitions';

/**
 * 風格設定顯示條 - 教育手寫普普風
 */
const StyleBar = ({ globalStyles, onOpenStyleModal, isGenerating }) => {
    // 風格對應的顏色
    const styleColors = {
        'qualitative': '#FF6B9D',
        'emotional': '#FF9F43',
        'friendly': '#FECA57',
        'humorous': '#1DD1A1',
        'internal': '#54A0FF',
        'philosophical': '#A29BFE',
        'practical': '#FF6B6B',
        'resonance': '#FF6B9D',
        'blessing': '#FF9F43',
        'scenario': '#FECA57',
        'milestone': '#1DD1A1',
        'journey': '#54A0FF'
    };

    return (
        <div className="mb-4 sm:mb-6 bg-[#FFFDF5] border-3 border-[#2D3436] rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[4px_4px_0_#2D3436]">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[#2D3436] text-sm sm:text-base font-black">
                <span className="text-xl">🎨</span>
                <span>目前風格：</span>
                <div className="flex gap-2 flex-wrap">
                    {globalStyles.length > 0
                        ? globalStyles.map(id => (
                            <span
                                key={id}
                                className="px-3 py-1 border-2 border-[#2D3436] rounded-full text-xs sm:text-sm font-bold text-white shadow-[2px_2px_0_#2D3436]"
                                style={{ backgroundColor: styleColors[id] || '#A29BFE' }}
                            >
                                {STYLE_DEFINITIONS.find(d => d.id === id)?.name}
                            </span>
                        ))
                        : <span className="text-[#636E72] font-medium text-xs sm:text-sm bg-[#E8DCC8] px-3 py-1 rounded-full">未設定 (預設: 質性描述)</span>
                    }
                </div>
            </div>
            <button
                onClick={onOpenStyleModal}
                disabled={isGenerating}
                className="btn-pop w-full sm:w-auto bg-[#A29BFE] text-white px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
                <Edit3 size={14} />
                更改風格 ✏️
            </button>
        </div>
    );
};

export default StyleBar;
