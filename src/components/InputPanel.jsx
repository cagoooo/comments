import React from 'react';
import { Users, Plus, RefreshCw, Hash } from 'lucide-react';

/**
 * 輸入面板 - 教育手寫普普風
 */
const InputPanel = ({
    rawInput,
    setRawInput,
    numberCount,
    setNumberCount,
    onGenerateStudents,
    onGenerateNumbers,
    onResetList,
    isGenerating
}) => {
    return (
        <div className="flex-1 w-full flex flex-col gap-3 p-3 sm:p-4 bg-[#FF9F43] border-3 border-[#2D3436] rounded-lg shadow-[4px_4px_0_#2D3436] transform rotate-[-0.5deg]">
            <div className="flex items-center gap-2 sm:gap-3 text-white font-black text-base sm:text-xl mb-1">
                <span className="text-2xl">📝</span>
                1. 輸入學生名單
            </div>

            <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="flex-1 flex flex-col gap-3">
                    <textarea
                        className="flex-1 min-h-[100px] sm:min-h-[120px] p-3 sm:p-4 border-3 border-[#2D3436] rounded-lg outline-none text-sm sm:text-base resize-none font-medium placeholder:text-[#2D3436]/40 text-[#2D3436] leading-relaxed bg-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]"
                        placeholder="一行一位學生姓名...&#10;例如：&#10;王小明&#10;李大華"
                        value={rawInput}
                        onChange={(e) => setRawInput(e.target.value)}
                        disabled={isGenerating}
                    />

                    {/* 批次產生座號 */}
                    <div className="flex items-center gap-2 sm:gap-3 bg-white p-2 sm:p-3 border-2 border-[#2D3436] rounded-lg">
                        <span className="text-[#2D3436] font-bold text-xs sm:text-sm flex items-center gap-1">
                            <Hash size={14} /> 產生
                        </span>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={numberCount}
                            onChange={(e) => setNumberCount(Number(e.target.value))}
                            className="w-14 sm:w-16 text-center border-2 border-[#2D3436] text-[#2D3436] font-bold text-xs sm:text-sm py-1.5 outline-none rounded"
                        />
                        <span className="text-[#2D3436] text-xs sm:text-sm font-bold">個座號</span>
                        <button
                            onClick={onGenerateNumbers}
                            className="btn-pop ml-auto bg-[#FECA57] text-[#2D3436] px-3 py-1 text-xs sm:text-sm"
                        >
                            產生 🔢
                        </button>
                    </div>
                </div>

                {/* 按鈕區 */}
                <div className="flex flex-row sm:flex-col gap-2 sm:gap-3 sm:w-24">
                    <button
                        onClick={onGenerateStudents}
                        disabled={isGenerating}
                        className="flex-1 btn-pop bg-[#1DD1A1] text-white font-bold px-3 sm:px-2 py-3 sm:py-4 text-sm sm:text-base flex flex-row sm:flex-col items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Plus size={20} />
                        <span>加入</span>
                    </button>
                    <button
                        onClick={onResetList}
                        disabled={isGenerating}
                        className="flex-1 btn-pop bg-white text-[#FF6B6B] font-bold px-3 sm:px-2 py-3 sm:py-4 text-sm sm:text-base flex flex-row sm:flex-col items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw size={18} />
                        <span>清空</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InputPanel;
