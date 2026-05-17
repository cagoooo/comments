import React from 'react';
import { Filter, List } from 'lucide-react';
import StudentRow from './StudentRow';

/**
 * 學生列表 wrapper
 *
 * 從 table-based 改為 list-of-cards。
 * - 桌面 + 手機都用同一個 StudentRow（內部用 CSS grid 切換 layout）
 * - 頂部 strip 顯示「學生 N 人 · 已選 M」+ 全選 checkbox
 * - 底部「— 已顯示全部 N 位 —」結尾
 * - 空狀態：dashed border 卡片 + 引導文字
 *
 * Props 介面與既有完全相同（App.jsx 不需動 import 或 props）。
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
    onOpenHistory,
    readOnly = false, // 保留接受但目前不實作（既有也未實作）
    searchQuery = '',
    onAdjustComment,
    adjustingStudentId,
}) => {
    const total = students.length;
    const selectedCount = selectedIds.size;
    const allSelected = total > 0 && selectedCount === total;

    if (total === 0) {
        return (
            <div className="b-dash r-card p-10 text-center bg-white">
                <div className="text-4xl mb-3" aria-hidden="true">📝</div>
                <div className="text-[var(--ink-soft)] font-bold text-[15px]">
                    還沒有學生資料
                </div>
                <div className="text-[var(--ink-mute)] text-[12px] mt-1">
                    在上方「Step 1 學生名單」輸入姓名，或拖拽 Excel 開始
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* 頂部 strip — 全選 + 計數 */}
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ink-soft)] px-1 flex-wrap gap-2">
                <label className="flex items-center gap-3 cursor-pointer normal-case tracking-normal">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={onToggleAllSelection}
                        disabled={isGenerating}
                        aria-label={allSelected ? '取消全選' : '全選'}
                    />
                    <span className="text-[12px]">
                        學生 <span className="font-mono text-[var(--ink)]">{total}</span> 人
                        {selectedCount > 0 && (
                            <>
                                <span className="mx-1.5 text-[var(--ink-mute)]">·</span>
                                已選 <span className="font-mono text-[var(--ink)]">{selectedCount}</span>
                            </>
                        )}
                    </span>
                </label>

                <div className="flex items-center gap-3 text-[var(--ink-soft)]">
                    <span className="hidden sm:inline-flex items-center gap-1">
                        <Filter size={11} strokeWidth={1.8} /> 排序 座號 ↑
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1">
                        <List size={11} strokeWidth={1.8} /> 檢視 卡片
                    </span>
                </div>
            </div>

            {/* 列表 */}
            <div className="space-y-3">
                {students.map(student => (
                    <StudentRow
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
                        searchQuery={searchQuery}
                        onAdjustComment={onAdjustComment}
                        adjustingStudentId={adjustingStudentId}
                    />
                ))}
            </div>

            {/* 結尾 */}
            <div className="flex items-center justify-center py-6 text-[12px] text-[var(--ink-soft)]">
                <span className="b-dash rounded-full px-4 py-1.5 font-bold">
                    — 已顯示全部 {total} 位 —
                </span>
            </div>
        </div>
    );
};

export default React.memo(StudentTable);
