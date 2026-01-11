import React from 'react';
import { Palette, X, CheckSquare, Info } from 'lucide-react';
import { STYLE_DEFINITIONS } from '../data/styleDefinitions';

/**
 * 風格選擇 Modal - 教育手寫普普風
 */
const StyleModal = ({ isOpen, onClose, globalStyles, toggleGlobalStyle }) => {
    if (!isOpen) return null;

    // 為每個風格分配不同顏色
    const styleColors = [
        '#FF6B9D', '#FF9F43', '#FECA57', '#1DD1A1',
        '#54A0FF', '#A29BFE', '#FF6B6B', '#FF6B9D',
        '#FF9F43', '#FECA57', '#1DD1A1', '#54A0FF'
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4">
            <div className="card-pop w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-in bg-[#FFF9E6]">
                {/* Header */}
                <div className="p-3 sm:p-5 bg-[#A29BFE] border-b-3 border-[#2D3436] flex items-center justify-between">
                    <h3 className="font-black text-white flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl">
                        <span className="text-2xl">🎨</span>
                        <span className="hidden sm:inline">選擇寫作風格</span>
                        <span className="sm:hidden">選風格</span>
                    </h3>
                    <button
                        onClick={onClose}
                        className="btn-pop p-2 bg-white text-[#2D3436]"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-6 overflow-y-auto flex-1 mobile-scroll-hide">
                    <div className="flex items-center gap-2 mb-4 p-2 sm:p-3 bg-[#FECA57] border-2 border-[#2D3436] rounded-lg text-sm sm:text-base font-bold text-[#2D3436]">
                        <span className="text-xl">💡</span>
                        最多可選 2 種風格喔！
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {STYLE_DEFINITIONS.map((style, index) => {
                            const isSelected = globalStyles.includes(style.id);
                            const isDisabled = !isSelected && globalStyles.length >= 2;
                            const bgColor = styleColors[index % styleColors.length];

                            return (
                                <div
                                    key={style.id}
                                    onClick={() => !isDisabled && toggleGlobalStyle(style.id)}
                                    className={`
                    p-3 sm:p-4 cursor-pointer transition-all border-3 border-[#2D3436] rounded-lg
                    ${isSelected
                                            ? 'shadow-[4px_4px_0_#2D3436] transform -translate-y-1'
                                            : 'shadow-[2px_2px_0_#2D3436]'}
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-[4px_4px_0_#2D3436]'}
                  `}
                                    style={{ backgroundColor: isSelected ? bgColor : '#FFFDF5' }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-6 h-6 sm:w-7 sm:h-7 border-2 border-[#2D3436] rounded flex items-center justify-center shrink-0
                      ${isSelected ? 'bg-[#2D3436] text-white' : 'bg-white'}`}
                                        >
                                            {isSelected && <span className="text-sm">✓</span>}
                                        </div>
                                        <div>
                                            <h4 className={`font-black text-base sm:text-lg ${isSelected ? 'text-white' : 'text-[#2D3436]'}`}>
                                                {style.name}
                                            </h4>
                                            <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${isSelected ? 'text-white/90' : 'text-[#636E72]'}`}>
                                                {style.desc}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 sm:p-5 bg-[#FFF9E6] flex justify-between items-center border-t-2 border-dashed border-[#E8DCC8]">
                    <span className="text-sm sm:text-lg font-bold text-[#2D3436]">
                        已選 {globalStyles.length} / 2 種 ✨
                    </span>
                    <button
                        onClick={onClose}
                        className="btn-pop bg-[#1DD1A1] text-white px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
                    >
                        完成 ✓
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StyleModal;
