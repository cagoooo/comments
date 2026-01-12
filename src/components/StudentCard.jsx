import React from 'react';
import { Trash2, Loader2, Heart, Clock, Sparkles } from 'lucide-react';

/**
 * 學生卡片元件（手機端）- 教育手寫普普風
 * 支援單一學生即時生成、收藏評語、字數統計、歷史記錄
 */
const StudentCard = ({
    student,
    isSelected,
    isFocused,
    isGenerating,
    isGeneratingSingle,
    onToggleSelection,
    onFocus,
    onOpenSidebar,
    onRemoveTag,
    onUpdateStudent,
    onDeleteStudent,
    onGenerateSingle,
    onSaveTemplate,
    onOpenHistory
}) => {
    const isThisGenerating = isGeneratingSingle === student.id;

    const getWordCountColor = (length) => {
        if (length < 50) return 'text-[#FF6B6B]';
        if (length > 120) return 'text-[#FF9F43]';
        return 'text-[#1DD1A1]';
    };

    return (
        <div
            className={`bg-[#FFFDF5] border-3 border-[#2D3436] rounded-xl overflow-hidden shadow-[4px_4px_0_#2D3436] transition-all
        ${isSelected ? 'ring-3 ring-[#FF6B9D]' : ''}
        ${isFocused ? 'ring-3 ring-[#54A0FF]' : ''}
        ${isThisGenerating ? 'ring-3 ring-[#FECA57] animate-pulse' : ''}`}
        >
            {/* 卡片標題列 - 更緊湊 */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-[#FECA57] border-b-2 border-[#2D3436]">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onToggleSelection(student.id)}
                        disabled={isGenerating || isThisGenerating}
                        className={`w-5 h-5 border-2 border-[#2D3436] rounded flex items-center justify-center flex-shrink-0
              ${isSelected ? 'bg-[#FF6B9D] text-white' : 'bg-white'}`}
                    >
                        {isSelected && <span className="text-xs font-bold">✓</span>}
                    </button>
                    <span className="font-black text-[#2D3436] text-sm truncate">📚 {student.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {/* 生成按鈕 - 更突出 */}
                    <button
                        onClick={() => onGenerateSingle(student.id)}
                        disabled={isGenerating || isThisGenerating}
                        className="btn-pop px-3 py-1.5 bg-[#1DD1A1] text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50 min-w-[70px] justify-center"
                    >
                        {isThisGenerating ? (
                            <><Loader2 size={14} className="animate-spin" /></>
                        ) : (
                            <><Sparkles size={14} /></>
                        )}
                    </button>
                    <button
                        onClick={() => onDeleteStudent(student.id)}
                        disabled={isGenerating || isThisGenerating}
                        className="text-[#2D3436]/50 hover:text-[#FF6B6B] transition-colors disabled:opacity-30 p-1.5"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* 特質區 */}
            <div className="px-3 py-2.5 border-b-2 border-dashed border-[#E8DCC8]">
                <div className="text-xs font-bold text-[#636E72] mb-1.5">🏷️ 特質標籤</div>
                <div
                    onClick={() => { onFocus(student.id); onOpenSidebar(); }}
                    className={`p-2 border-2 border-dashed bg-white min-h-[40px] flex flex-wrap gap-1.5 cursor-pointer transition-colors rounded-lg items-center
            ${isFocused ? 'border-[#54A0FF] bg-[#54A0FF]/10' : 'border-[#E8DCC8]'}`}
                >
                    {student.selectedTags.length > 0 ? (
                        student.selectedTags.map((tag, idx) => (
                            <span key={idx} className="tag-handwrite text-xs">
                                {tag}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemoveTag(student.id, tag); }}
                                    className="hover:text-[#FF6B6B] ml-1"
                                >×</button>
                            </span>
                        ))
                    ) : (
                        <span className="text-[#636E72]/50 text-xs">👆 點擊開啟成語庫選擇...</span>
                    )}
                </div>
                <input
                    type="text"
                    value={student.manualTraits}
                    onChange={(e) => onUpdateStudent(student.id, 'manualTraits', e.target.value)}
                    placeholder="✏️ 手動輸入補充..."
                    disabled={isGenerating || isThisGenerating}
                    className="w-full mt-2 p-2 text-sm font-medium outline-none border-2 border-[#E8DCC8] focus:border-[#FF9F43] rounded-lg bg-white text-[#2D3436] placeholder:text-[#636E72]/40"
                />
            </div>

            {/* 評語區 - 更大的編輯區域 */}
            <div className="px-3 py-2.5 bg-[#FFF9E6]">
                <div className="text-xs font-bold text-[#636E72] mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">🐝 AI 評語</span>
                    <div className="flex items-center gap-3">
                        {/* 歷史按鈕 */}
                        {onOpenHistory && (
                            <button
                                onClick={() => onOpenHistory(student)}
                                className="flex items-center gap-1 text-[#54A0FF] active:text-[#2D3436] transition-colors"
                                title="查看歷史"
                            >
                                <Clock size={14} />
                                <span>歷史</span>
                            </button>
                        )}
                        {student.comment && !student.comment.includes("撰寫中") && !student.comment.includes("❌") && (
                            <button
                                onClick={() => onSaveTemplate(student)}
                                className="flex items-center gap-1 text-[#FF6B9D] active:text-[#FF6B6B] transition-colors"
                                title="收藏為範本"
                            >
                                <Heart size={14} />
                                <span>收藏</span>
                            </button>
                        )}
                    </div>
                </div>
                <textarea
                    value={student.comment}
                    onChange={(e) => onUpdateStudent(student.id, 'comment', e.target.value)}
                    placeholder="等待 AI 魔法產生..."
                    disabled={isThisGenerating}
                    className={`w-full text-sm p-3 border-2 border-[#E8DCC8] focus:border-[#1DD1A1] outline-none resize-y min-h-[120px] leading-relaxed font-medium text-[#2D3436] rounded-lg
            ${isThisGenerating ? "bg-[#FECA57]/30 animate-pulse" : "bg-white"}`}
                />
                {student.comment && (
                    <div className={`text-right text-xs mt-1 font-bold ${getWordCountColor(student.comment.length)}`}>
                        {student.comment.length} 字
                    </div>
                )}
            </div>
        </div>
    );
};

// 自定義比較函數：只在相關 props 變化時才重新渲染
const areEqual = (prevProps, nextProps) => {
    // 檢查學生基本資料
    if (prevProps.student.id !== nextProps.student.id) return false;
    if (prevProps.student.name !== nextProps.student.name) return false;
    if (prevProps.student.comment !== nextProps.student.comment) return false;
    if (prevProps.student.manualTraits !== nextProps.student.manualTraits) return false;

    // 檢查標籤陣列（淺比較）
    if (prevProps.student.selectedTags.length !== nextProps.student.selectedTags.length) return false;
    if (prevProps.student.selectedTags.some((tag, i) => tag !== nextProps.student.selectedTags[i])) return false;

    // 檢查狀態 props
    if (prevProps.isSelected !== nextProps.isSelected) return false;
    if (prevProps.isFocused !== nextProps.isFocused) return false;
    if (prevProps.isGenerating !== nextProps.isGenerating) return false;
    if (prevProps.isGeneratingSingle !== nextProps.isGeneratingSingle) return false;

    return true;
};

export default React.memo(StudentCard, areEqual);
