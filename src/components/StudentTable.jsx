import React from 'react';
import { Trash2, Loader2, Heart, Clock } from 'lucide-react';
import StudentCard from './StudentCard';

/**
 * 學生表格元件 - 教育手寫普普風
 * 桌面端：手寫風格表格
 * 手機端：便利貼卡片堆疊
 * 支援單一學生即時生成、收藏評語、字數統計、歷史記錄
 */
const StudentTable = ({
    students,
    selectedIds,
    focusedStudentId,
    isGenerating,
    isGeneratingSingle,
    onToggleSelection,
    onToggleAllSelection,
    onFocusStudent,
    onOpenSidebar,
    onRemoveTag,
    onUpdateStudent,
    onDeleteStudent,
    onGenerateSingle,
    onSaveTemplate,
    onOpenHistory
}) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const getWordCountColor = (length) => {
        if (length < 50) return 'text-[#FF6B6B]';
        if (length > 120) return 'text-[#FF9F43]';
        return 'text-[#1DD1A1]';
    };

    if (isMobile) {
        return (
            <div className="space-y-4">
                {students.length === 0 ? (
                    <div className="p-10 text-center font-bold text-lg bg-[#FFFDF5] border-3 border-[#2D3436] rounded-lg shadow-[4px_4px_0_#2D3436]">
                        <span className="text-4xl block mb-3">📝</span>
                        <span className="text-[#636E72]">還沒有學生資料喔！</span>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between bg-[#A29BFE] text-white border-3 border-[#2D3436] p-3 rounded-lg shadow-[3px_3px_0_#2D3436]">
                            <button onClick={onToggleAllSelection} className="flex items-center gap-2 font-bold text-sm" disabled={isGenerating}>
                                <span className={`w-5 h-5 border-2 border-white rounded flex items-center justify-center ${selectedIds.size === students.length && students.length > 0 ? 'bg-white text-[#A29BFE]' : ''}`}>
                                    {selectedIds.size === students.length && students.length > 0 && <span className="text-xs">✓</span>}
                                </span>
                                全選 ({selectedIds.size}/{students.length})
                            </button>
                        </div>
                        {students.map((student) => (
                            <StudentCard
                                key={student.id}
                                student={student}
                                isSelected={selectedIds.has(student.id)}
                                isFocused={focusedStudentId === student.id}
                                isGenerating={isGenerating}
                                isGeneratingSingle={isGeneratingSingle}
                                onToggleSelection={onToggleSelection}
                                onFocus={onFocusStudent}
                                onOpenSidebar={onOpenSidebar}
                                onRemoveTag={onRemoveTag}
                                onUpdateStudent={onUpdateStudent}
                                onDeleteStudent={onDeleteStudent}
                                onGenerateSingle={onGenerateSingle}
                                onSaveTemplate={onSaveTemplate}
                                onOpenHistory={onOpenHistory}
                            />
                        ))}
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="card-pop overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="bg-[#FF6B9D] text-white">
                    <tr className="text-base font-black">
                        <th className="p-4 lg:p-5 w-12 text-center border-r-2 border-[#2D3436]/20">
                            <button onClick={onToggleAllSelection} className="w-6 h-6 border-2 border-white rounded flex items-center justify-center mx-auto bg-white/20 hover:bg-white/40 transition" disabled={isGenerating}>
                                {selectedIds.size === students.length && students.length > 0 && <span className="text-sm">✓</span>}
                            </button>
                        </th>
                        <th className="p-4 lg:p-5 w-32 lg:w-40 border-r-2 border-[#2D3436]/20">📚 姓名</th>
                        <th className="p-4 lg:p-5 border-r-2 border-[#2D3436]/20 w-1/4">🏷️ 特質標籤</th>
                        <th className="p-4 lg:p-5 border-r-2 border-[#2D3436]/20">🐝 AI 評語</th>
                        <th className="p-4 lg:p-5 w-20 text-center">操作</th>
                    </tr>
                </thead>
                <tbody className="bg-[#FFFDF5]">
                    {students.length === 0 && (
                        <tr>
                            <td colSpan="5" className="p-16 lg:p-20 text-center font-bold text-xl text-[#636E72]">
                                <span className="text-5xl block mb-4">📝</span>
                                還沒有學生資料，快去加入吧！
                            </td>
                        </tr>
                    )}
                    {students.map((student) => {
                        const isThisGenerating = isGeneratingSingle === student.id;
                        return (
                            <tr key={student.id} className={`border-t-2 border-dashed border-[#E8DCC8] hover:bg-[#FECA57]/20 transition-colors ${selectedIds.has(student.id) ? 'bg-[#FF6B9D]/10' : ''} ${isThisGenerating ? 'bg-[#FECA57]/30' : ''}`}>
                                <td className="p-4 lg:p-5 text-center align-top pt-6 lg:pt-8 border-r-2 border-dashed border-[#E8DCC8]">
                                    <button onClick={() => onToggleSelection(student.id)} disabled={isGenerating || isThisGenerating} className={`w-6 h-6 border-2 border-[#2D3436] rounded flex items-center justify-center mx-auto transition ${selectedIds.has(student.id) ? 'bg-[#FF6B9D] text-white' : 'bg-white hover:bg-[#FECA57]'}`}>
                                        {selectedIds.has(student.id) && <span className="text-sm font-bold">✓</span>}
                                    </button>
                                </td>
                                <td className="p-4 lg:p-5 align-top pt-6 lg:pt-8 border-r-2 border-dashed border-[#E8DCC8]">
                                    <div className="font-black text-[#2D3436] text-base lg:text-lg mb-2">{student.name}</div>
                                    <button onClick={() => onGenerateSingle(student.id)} disabled={isGenerating || isThisGenerating} className="btn-pop px-3 py-1.5 bg-[#1DD1A1] text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50 w-full justify-center">
                                        {isThisGenerating ? (<><Loader2 size={14} className="animate-spin" /> 生成中...</>) : (<>🐝 生成評語</>)}
                                    </button>
                                </td>
                                <td className="p-4 lg:p-5 align-top border-r-2 border-dashed border-[#E8DCC8]">
                                    <div onClick={() => { onFocusStudent(student.id); onOpenSidebar(); }} className={`p-3 border-2 border-dashed bg-white min-h-[80px] lg:min-h-[100px] flex flex-col gap-3 cursor-pointer transition-colors rounded-lg ${focusedStudentId === student.id ? 'border-[#54A0FF] bg-[#54A0FF]/10' : 'border-[#E8DCC8] hover:border-[#FF9F43]'}`}>
                                        {student.selectedTags.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {student.selectedTags.map((tag, idx) => (
                                                    <span key={idx} className="tag-handwrite text-sm">
                                                        {tag}
                                                        <button onClick={(e) => { e.stopPropagation(); onRemoveTag(student.id, tag); }} className="hover:text-[#FF6B6B] ml-1">×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-[#636E72]/50 text-sm">👆 點擊開啟成語庫...</span>
                                        )}
                                    </div>
                                    <input type="text" value={student.manualTraits} onChange={(e) => onUpdateStudent(student.id, 'manualTraits', e.target.value)} placeholder="✏️ 手動輸入補充..." disabled={isGenerating || isThisGenerating} className="w-full mt-3 p-3 text-sm lg:text-base font-medium outline-none border-2 border-[#E8DCC8] focus:border-[#FF9F43] rounded-lg bg-white text-[#2D3436] placeholder:text-[#636E72]/40 transition-all" />
                                </td>
                                <td className="p-4 lg:p-5 align-top border-r-2 border-dashed border-[#E8DCC8]">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-[#636E72]">評語內容</span>
                                        <div className="flex items-center gap-2">
                                            {/* 歷史按鈕 */}
                                            {onOpenHistory && (
                                                <button onClick={() => onOpenHistory(student)} className="flex items-center gap-1 text-xs text-[#54A0FF] hover:text-[#2D3436] transition-colors font-bold" title="查看歷史">
                                                    <Clock size={12} /> 歷史
                                                </button>
                                            )}
                                            {student.comment && !student.comment.includes("撰寫中") && !student.comment.includes("❌") && (
                                                <button onClick={() => onSaveTemplate(student)} className="flex items-center gap-1 text-xs text-[#FF6B9D] hover:text-[#FF6B6B] transition-colors font-bold" title="收藏為範本">
                                                    <Heart size={12} /> 收藏
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <textarea value={student.comment} onChange={(e) => onUpdateStudent(student.id, 'comment', e.target.value)} placeholder="等待 AI 魔法產生..." disabled={isThisGenerating} className={`w-full text-sm lg:text-base p-3 lg:p-4 border-2 border-[#E8DCC8] focus:border-[#1DD1A1] outline-none resize-y min-h-[180px] lg:min-h-[200px] leading-relaxed font-medium text-[#2D3436] rounded-lg transition-all ${isThisGenerating ? "bg-[#FECA57]/30 animate-pulse" : "bg-white"}`} />
                                    {student.comment && (
                                        <div className={`text-right text-xs mt-1 font-bold ${getWordCountColor(student.comment.length)}`}>
                                            {student.comment.length} 字
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 lg:p-5 text-center align-top pt-6 lg:pt-8">
                                    <button onClick={() => onDeleteStudent(student.id)} disabled={isGenerating || isThisGenerating} className="text-[#636E72]/50 hover:text-[#FF6B6B] transition-colors disabled:opacity-30">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default StudentTable;
