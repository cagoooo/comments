import React from 'react';
import {
    Sparkles, Trash2, Heart, Clock, Loader2, X, Plus, Check, AlertCircle,
} from 'lucide-react';
import { Chip } from './atoms';
import HighlightText from './HighlightText';
import CommentAdjuster from './CommentAdjuster';

/**
 * 學生卡列（單一響應式元件）
 *
 * 取代既有 StudentTable (table row) + StudentCard (mobile card) 兩支元件。
 * - 桌面（≥ md）：4 欄 grid [44px checkbox][1fr 學生資訊][2fr 評語][130px 操作]
 * - 行動（< md）：grid-cols-1，內部 stack — header row（checkbox + 姓名 + 生成 + 刪除）→ 標籤 → 評語 → adjuster
 *
 * 全部 props 保留並對應既有用法。
 */

// ── status 推導 ─────────────────────────────────────
function deriveStatus(student, isGenerating) {
    if (isGenerating) return 'generating';
    const c = student.comment;
    if (!c || !c.trim()) return 'pending';
    if (c.includes('❌')) return 'error';
    if (c.includes('撰寫中')) return 'generating';
    return 'done';
}

const STATUS_META = {
    done: { label: '已完成', color: 'mint', Icon: Check },
    pending: { label: '待產生', color: 'peach', Icon: Clock },
    error: { label: '失敗', color: 'coral', Icon: AlertCircle },
    generating: { label: '產生中…', color: 'sky', Icon: Loader2 },
};

const StatusBadge = ({ status }) => {
    const m = STATUS_META[status];
    if (!m) return null;
    const { Icon } = m;
    return (
        <Chip color={m.color} soft size="sm">
            <Icon size={11} strokeWidth={2.2} className={status === 'generating' ? 'animate-spin' : ''} />
            {m.label}
        </Chip>
    );
};

// 5 色輪流（peach / mint / sky / lav / honey）
const TAG_COLORS = ['peach', 'mint', 'sky', 'lav', 'honey'];

const getWordCountColor = (length) => {
    if (length === 0) return 'text-[var(--ink-mute)]';
    if (length < 40) return 'text-[var(--coral)]';
    if (length > 140) return 'text-[var(--peach)]';
    return 'text-[var(--mint)]';
};

const StudentRow = ({
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
    onOpenHistory,
    searchQuery = '',
    onAdjustComment,
    adjustingStudentId,
}) => {
    const isThisGenerating = isGeneratingSingle === student.id;
    const isThisAdjusting = adjustingStudentId === student.id;
    const status = deriveStatus(student, isThisGenerating);
    const isEmpty = !student.comment || !student.comment.trim();
    const isError = student.comment?.includes('❌');
    const canSaveTemplate = student.comment && !isError && !student.comment.includes('撰寫中');

    const handleRowClick = () => {
        if (!isGenerating && !isThisGenerating) onFocus(student.id);
    };

    return (
        <div
            onClick={handleRowClick}
            className={[
                'r-card b-ink transition-all duration-150 overflow-hidden cursor-pointer',
                'grid grid-cols-1 md:grid-cols-[44px_minmax(200px,1fr)_minmax(0,2fr)_130px]',
                isFocused ? 'sh-card -translate-x-[1px] -translate-y-[1px]' : 'sh-sm',
                isThisGenerating ? 'ring-2 ring-offset-2 ring-[var(--honey)]' : '',
            ].filter(Boolean).join(' ')}
            style={{
                background: isFocused
                    ? 'var(--honey-soft)'
                    : isSelected
                        ? 'var(--paper-2)'
                        : 'white',
            }}
        >
            {/* ── 第 1 欄：checkbox ───────────────────── */}
            <div className="hidden md:flex p-4 items-start justify-center border-r border-[var(--line-soft)]">
                <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isGenerating || isThisGenerating}
                    onChange={(e) => { e.stopPropagation(); onToggleSelection(student.id); }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`選取學生 ${student.name}`}
                />
            </div>

            {/* ── 第 2 欄：學生資訊（號碼 + 姓名 + status + 標籤 + 手動補充） ───────────────────── */}
            <div className="p-4 md:border-r md:border-[var(--line-soft)] space-y-3">
                {/* mobile 用 header row：NO. 方塊 + checkbox + 姓名 + status */}
                <div className="md:hidden flex items-center gap-2.5 mb-2">
                    {/* NO. 大方塊 — 對齊 mobile.html 設計 */}
                    <div
                        className="w-12 h-12 shrink-0 b-ink r-btn flex flex-col items-center justify-center font-black"
                        style={{ background: isFocused ? 'var(--honey)' : 'var(--honey-soft)' }}
                        aria-hidden="true"
                    >
                        <div className="text-[8px] font-mono leading-none text-[var(--ink-soft)]">NO.</div>
                        <div className="text-[15px] font-mono leading-none mt-0.5">
                            {String(student.id).padStart(2, '0').slice(-2)}
                        </div>
                    </div>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isGenerating || isThisGenerating}
                        onChange={(e) => { e.stopPropagation(); onToggleSelection(student.id); }}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`選取學生 ${student.name}`}
                    />
                    <span className="font-black text-[16px] truncate flex-1">
                        <HighlightText text={student.name} highlight={searchQuery} />
                    </span>
                </div>

                {/* desktop 用：No. + 大姓名 */}
                <div className="hidden md:block">
                    <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-[11px] text-[var(--ink-mute)] uppercase tracking-widest">No.</span>
                        <span className="font-mono text-[20px] font-black tracking-tight leading-none">
                            {String(student.id).padStart(2, '0')}
                        </span>
                    </div>
                    <div className="text-[20px] font-black tracking-tight mt-2 leading-tight">
                        <HighlightText text={student.name} highlight={searchQuery} />
                    </div>
                </div>

                {/* status */}
                <div>
                    <StatusBadge status={status} />
                </div>

                {/* 標籤區 */}
                <div>
                    <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--ink-soft)] mb-1.5">
                        特質標籤
                    </div>
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onFocus(student.id);
                            onOpenSidebar?.();
                        }}
                        className="flex flex-wrap gap-1.5 cursor-pointer min-h-[28px]"
                        role="button"
                        tabIndex={0}
                        aria-label="點擊以開啟成語庫選擇標籤"
                    >
                        {student.selectedTags?.length > 0 ? (
                            <>
                                {student.selectedTags.map((tag, idx) => (
                                    <Chip
                                        key={`${tag}-${idx}`}
                                        color={TAG_COLORS[idx % TAG_COLORS.length]}
                                        soft
                                        size="sm"
                                        onClose={() => onRemoveTag(student.id, tag)}
                                    >
                                        <HighlightText text={tag} highlight={searchQuery} />
                                    </Chip>
                                ))}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFocus(student.id);
                                        onOpenSidebar?.();
                                    }}
                                    className="rounded-full px-2 h-6 b-dash text-[11px] text-[var(--ink-soft)] font-bold inline-flex items-center gap-0.5 hover:text-[var(--ink)] hover:border-[var(--ink)]"
                                    aria-label="加入更多標籤"
                                >
                                    <Plus size={10} strokeWidth={2.4} />
                                </button>
                            </>
                        ) : (
                            <span className="text-[12px] text-[var(--ink-mute)]">
                                👆 點擊以開啟成語庫
                            </span>
                        )}
                    </div>
                </div>

                {/* 手動補充 */}
                <input
                    type="text"
                    value={student.manualTraits || ''}
                    onChange={(e) => onUpdateStudent(student.id, 'manualTraits', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="✏️ 手動輸入補充…"
                    disabled={isGenerating || isThisGenerating}
                    className="w-full px-2.5 h-9 text-[12.5px] font-medium b-soft r-btn bg-white outline-none disabled:opacity-50 focus:border-[var(--ink)] focus:ring-2 focus:ring-honey-soft text-[var(--ink)] placeholder:text-[var(--ink-mute)]"
                    aria-label="手動補充特質"
                />
            </div>

            {/* ── 第 3 欄：評語 ───────────────────── */}
            <div className="p-4 min-w-0">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                        🐝 AI 評語
                    </div>
                    <div className="flex items-center gap-2">
                        {onOpenHistory && !isEmpty && !isError && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onOpenHistory(student); }}
                                className="text-[11px] font-bold text-[var(--ink-soft)] hover:text-[var(--ink)] inline-flex items-center gap-1"
                                title="查看評語歷史"
                            >
                                <Clock size={11} strokeWidth={1.8} /> 歷史
                            </button>
                        )}
                        {onSaveTemplate && canSaveTemplate && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onSaveTemplate(student); }}
                                className="text-[11px] font-bold text-[var(--ink-soft)] hover:text-[var(--coral)] inline-flex items-center gap-1"
                                title="收藏為範本"
                            >
                                <Heart size={11} strokeWidth={1.8} /> 收藏
                            </button>
                        )}
                        {!isEmpty && (
                            <span className={`font-mono text-[11px] ${getWordCountColor(student.comment.length)}`}>
                                {student.comment.length} <span className="text-[var(--ink-mute)]">字</span>
                            </span>
                        )}
                    </div>
                </div>

                {isEmpty ? (
                    <div
                        className="b-dash r-btn p-4 min-h-[120px] flex flex-col items-center justify-center text-center gap-2"
                        style={{ background: 'rgba(245, 236, 212, 0.4)' }}
                    >
                        <div className="text-[13px] text-[var(--ink-soft)] font-bold">
                            尚未產生評語
                        </div>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onGenerateSingle(student.id); }}
                            disabled={isGenerating || isThisGenerating}
                            style={{ background: 'var(--honey)' }}
                            className="b-ink sh-sm r-btn px-3 h-8 text-[12px] font-bold inline-flex items-center gap-1.5 btn-press disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                        >
                            {isThisGenerating ? (
                                <Loader2 size={12} strokeWidth={1.8} className="animate-spin" />
                            ) : (
                                <Sparkles size={12} strokeWidth={1.8} />
                            )}
                            立即生成
                        </button>
                    </div>
                ) : (
                    <textarea
                        value={student.comment}
                        onChange={(e) => onUpdateStudent(student.id, 'comment', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={isThisGenerating}
                        className={[
                            'bg-lined r-btn b-soft p-3.5 leading-[28px] text-[14px] tracking-[0.01em]',
                            'w-full min-h-[120px] md:min-h-[140px] resize-y outline-none',
                            'text-[var(--ink)] focus:border-[var(--ink)] focus:ring-2 focus:ring-honey-soft',
                            isThisGenerating ? 'opacity-70 animate-pulse' : '',
                            isError ? 'text-[var(--coral)]' : '',
                        ].filter(Boolean).join(' ')}
                        placeholder="等待 AI 魔法產生…"
                        aria-label={`${student.name} 的評語`}
                    />
                )}

                {/* 評語調整工具 */}
                {!isEmpty && !isError && onAdjustComment && (
                    <CommentAdjuster
                        comment={student.comment}
                        studentName={student.name}
                        onAdjust={(type, tone) => onAdjustComment(student.id, type, tone)}
                        isAdjusting={isThisAdjusting}
                        disabled={isGenerating || isThisGenerating}
                    />
                )}
            </div>

            {/* ── 第 4 欄：操作 ───────────────────── */}
            <div
                className="p-3 md:p-4 flex flex-row md:flex-col items-stretch gap-2 md:w-[130px] md:bg-[var(--paper-2)]/40 md:border-l md:border-[var(--line-soft)]"
            >
                {/* 主動作：生成 / 重生 */}
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onGenerateSingle(student.id); }}
                    disabled={isGenerating || isThisGenerating}
                    style={{ background: isEmpty ? 'var(--honey)' : 'var(--mint)' }}
                    className="flex-1 md:flex-none b-ink sh-btn r-btn md:h-[70px] py-2 md:py-0 flex flex-row md:flex-col items-center justify-center gap-1 font-black btn-press disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                    aria-label={isEmpty ? `為 ${student.name} 生成評語` : `重新生成 ${student.name} 的評語`}
                >
                    {isThisGenerating ? (
                        <Loader2 size={16} strokeWidth={1.8} className="animate-spin" />
                    ) : (
                        <Sparkles size={isEmpty ? 18 : 16} strokeWidth={1.8} />
                    )}
                    <span className="text-[12px]">
                        {isThisGenerating ? '生成中' : (isEmpty ? '生成' : '重生')}
                    </span>
                </button>

                {/* 刪除 — desktop 顯示為小 ghost；mobile 也用同樣按鈕但放在 row */}
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDeleteStudent(student.id); }}
                    disabled={isGenerating || isThisGenerating}
                    className="md:h-7 px-2 md:px-0 r-btn text-[var(--ink-soft)] hover:text-[var(--coral)] inline-flex items-center justify-center gap-1 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-soft"
                    title="刪除學生"
                    aria-label={`刪除學生 ${student.name}`}
                >
                    <Trash2 size={15} strokeWidth={1.8} />
                    <span className="md:hidden text-[12px] font-bold">刪除</span>
                </button>
            </div>
        </div>
    );
};

// memo: 只在相關 props 變化時才 re-render（既有設計，避免 30+ 列表全體重繪）
const areEqual = (prev, next) => {
    if (prev.student.id !== next.student.id) return false;
    if (prev.student.name !== next.student.name) return false;
    if (prev.student.comment !== next.student.comment) return false;
    if (prev.student.manualTraits !== next.student.manualTraits) return false;
    if (prev.student.selectedTags?.length !== next.student.selectedTags?.length) return false;
    if (prev.student.selectedTags?.some((t, i) => t !== next.student.selectedTags[i])) return false;
    if (prev.isSelected !== next.isSelected) return false;
    if (prev.isFocused !== next.isFocused) return false;
    if (prev.isGenerating !== next.isGenerating) return false;
    if (prev.isGeneratingSingle !== next.isGeneratingSingle) return false;
    if (prev.adjustingStudentId !== next.adjustingStudentId) return false;
    if (prev.searchQuery !== next.searchQuery) return false;
    return true;
};

export default React.memo(StudentRow, areEqual);
