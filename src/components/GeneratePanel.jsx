import React from 'react';
import { Sparkles, CheckSquare, Settings, Download, Trash2 } from 'lucide-react';

/**
 * 生成控制面板 - 教育手寫普普風
 */
const GeneratePanel = ({
    students,
    selectedIds,
    isGenerating,
    extraSettings,
    setExtraSettings,
    onGenerateSelected,
    onGenerateAll,
    onDownload,
    onDeleteSelected,
    onResetList
}) => {
    return (
        <div className="flex-1 w-full flex flex-col gap-3 sm:gap-4 p-3 sm:p-4 bg-[#54A0FF] border-3 border-[#2D3436] rounded-lg shadow-[4px_4px_0_#2D3436] transform rotate-[0.5deg]">
            <div className="flex items-center gap-2 sm:gap-3 text-white font-black text-base sm:text-xl">
                <span className="text-2xl">✨</span>
                2. AI 魔法產生評語
            </div>

            {/* 額外條件設定 */}
            <div className="bg-white/90 border-2 border-[#2D3436] rounded-lg p-2 sm:p-3 flex flex-col gap-2 sm:gap-3">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#2D3436] border-b-2 border-dashed border-[#E8DCC8] pb-2">
                    <span className="flex items-center gap-1">⚙️ 設定</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* 語氣選擇 */}
                    <div className="flex bg-[#FFF9E6] border-2 border-[#2D3436] rounded-lg overflow-hidden">
                        {[
                            { val: 'normal', label: '標準', emoji: '📝' },
                            { val: 'casual', label: '口語', emoji: '💬' },
                            { val: 'formal', label: '正式', emoji: '📋' }
                        ].map(opt => (
                            <button
                                key={opt.val}
                                onClick={() => setExtraSettings(p => ({ ...p, tone: opt.val }))}
                                className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-bold transition-colors 
                  ${extraSettings.tone === opt.val
                                        ? 'bg-[#FF6B9D] text-white'
                                        : 'text-[#2D3436] hover:bg-[#FECA57]'}`}
                            >
                                <span className="hidden sm:inline">{opt.emoji}</span> {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* 字數設定 */}
                    <div className="flex items-center gap-2 bg-[#FFF9E6] border-2 border-[#2D3436] rounded-lg px-2 sm:px-3 py-1.5 ml-auto">
                        <span className="text-xs sm:text-sm font-bold text-[#2D3436]">📏 字數</span>
                        <input
                            type="number"
                            min="20" max="500" step="10"
                            value={extraSettings.wordCount}
                            onChange={e => setExtraSettings(p => ({ ...p, wordCount: Number(e.target.value) }))}
                            className="w-12 text-xs sm:text-sm font-bold text-[#2D3436] text-center outline-none bg-white border-2 border-[#2D3436] rounded"
                        />
                    </div>
                </div>
            </div>

            {/* 生成按鈕 */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                    onClick={onGenerateSelected}
                    disabled={selectedIds.size === 0 || isGenerating}
                    className={`flex-1 btn-pop py-3 sm:py-4 text-sm sm:text-base font-black flex items-center justify-center gap-2 
            ${selectedIds.size > 0 && !isGenerating
                            ? 'bg-white text-[#2D3436]'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'}`}
                >
                    <CheckSquare size={18} />
                    {isGenerating ? "產生中..." : `生成已選 (${selectedIds.size})`}
                </button>

                <button
                    onClick={onGenerateAll}
                    disabled={students.length === 0 || isGenerating}
                    className={`flex-1 btn-pop py-3 sm:py-4 text-sm sm:text-base font-black flex items-center justify-center gap-2
            ${students.length > 0 && !isGenerating
                            ? 'bg-[#FECA57] text-[#2D3436]'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'}`}
                >
                    <span className="text-xl">🐝</span>
                    {isGenerating ? "AI 撰寫中..." : "全部生成！"}
                </button>
            </div>

            {/* 下載與刪除 */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm pt-2 border-t-2 border-dashed border-white/50">
                <div className="flex gap-2 sm:gap-3">
                    <button
                        onClick={() => onDownload('txt')}
                        disabled={students.length === 0}
                        className="btn-pop bg-white text-[#2D3436] px-2 sm:px-3 py-1 flex items-center gap-1 disabled:opacity-50"
                    >
                        <Download size={14} /> TXT
                    </button>
                    <button
                        onClick={() => onDownload('csv')}
                        disabled={students.length === 0}
                        className="btn-pop bg-white text-[#2D3436] px-2 sm:px-3 py-1 flex items-center gap-1 disabled:opacity-50"
                    >
                        <Download size={14} /> CSV
                    </button>
                </div>

                <div className="flex gap-2">
                    {selectedIds.size > 0 && (
                        <button
                            onClick={onDeleteSelected}
                            disabled={isGenerating}
                            className="btn-pop bg-[#FF6B6B] text-white px-2 sm:px-3 py-1 flex items-center gap-1 text-xs sm:text-sm disabled:opacity-50"
                        >
                            <Trash2 size={12} /> 刪除 ({selectedIds.size})
                        </button>
                    )}
                    <button
                        onClick={onResetList}
                        disabled={isGenerating || students.length === 0}
                        className="text-white/80 hover:text-white font-bold transition-colors disabled:opacity-50"
                    >
                        🗑️ 全刪
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GeneratePanel;
