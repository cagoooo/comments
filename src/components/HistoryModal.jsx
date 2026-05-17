import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, Trash2 } from 'lucide-react';
import { historyService } from '../firebase';
import ModalShell from './ui/ModalShell';
import { Btn, Chip } from './atoms';

/**
 * 評語歷史記錄 Modal — 查看單一學生過去的評語版本，支援還原
 *
 * Props 保留：isOpen / onClose / student / onRestore
 * Firebase: historyService.subscribe / delete
 */
const HistoryModal = ({ isOpen, onClose, student, onRestore }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !student) return;
        setIsLoading(true);
        const unsubscribe = historyService.subscribe(student.id, (data) => {
            setHistory(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [isOpen, student]);

    const handleRestore = (comment) => {
        onRestore(comment);
        onClose();
    };

    const handleDelete = async (historyId) => {
        if (!window.confirm('確定要刪除此歷史記錄嗎？')) return;
        try {
            await historyService.delete(student.id, historyId);
        } catch (error) {
            console.error('刪除歷史記錄失敗:', error);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp?.toDate) return '未知時間';
        return timestamp.toDate().toLocaleString('zh-TW', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!isOpen || !student) return null;

    return (
        <ModalShell
            open={isOpen}
            onClose={onClose}
            width={640}
            eyebrow="Comment History"
            tapeColor="sky"
            icon={<Clock size={18} strokeWidth={1.8} />}
            title={`${student.name} 的評語歷史`}
            subtitle={
                <>
                    共 <span className="font-bold text-[var(--ink)]">{history.length}</span> 個版本 · 點「還原」可恢復舊版本
                </>
            }
            footer={
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-[12px] text-[var(--ink-soft)]">
                        每次重新生成或調整都會自動保存
                    </div>
                    <Btn variant="outline" size="sm" onClick={onClose}>
                        關閉
                    </Btn>
                </div>
            }
        >
            <div className="px-5 sm:px-7 py-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16 text-4xl bee-bob" aria-label="載入中">
                        🐝
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-12 text-[var(--ink-soft)]">
                        <div className="text-4xl mb-3" aria-hidden="true">📜</div>
                        <div className="font-bold text-[14px]">還沒有歷史記錄</div>
                        <div className="text-[12px] mt-1 text-[var(--ink-mute)]">
                            生成或調整評語後會自動保存歷史版本
                        </div>
                    </div>
                ) : (
                    <ol className="space-y-3">
                        {history.map((item, index) => (
                            <li
                                key={item.id}
                                className="bg-white b-ink sh-sm r-card overflow-hidden"
                            >
                                {/* 時間 + 字數 */}
                                <div
                                    className="px-3.5 py-2 border-b border-dashed border-[var(--line-soft)] flex items-center justify-between gap-2"
                                    style={{ background: 'var(--paper-2)' }}
                                >
                                    <div className="flex items-center gap-2">
                                        <Clock size={11} strokeWidth={1.8} className="text-[var(--ink-soft)]" />
                                        <span className="text-[11.5px] font-mono text-[var(--ink-soft)]">
                                            {formatTime(item.createdAt)}
                                        </span>
                                        {index === 0 && (
                                            <Chip color="mint" soft size="sm">最新</Chip>
                                        )}
                                    </div>
                                    <span className="text-[11px] font-mono text-[var(--ink-soft)]">
                                        {item.comment?.length || 0} 字
                                    </span>
                                </div>

                                {/* 評語內容（紙線稿） */}
                                <div className="bg-lined px-4 py-3 text-[13.5px] leading-[28px] text-[var(--ink)] max-h-[160px] overflow-y-auto">
                                    {item.comment}
                                </div>

                                {/* 操作 */}
                                <div className="px-3 py-2 flex items-center justify-end gap-2 border-t border-dashed border-[var(--line-soft)]">
                                    <Btn
                                        size="sm"
                                        color="sky"
                                        icon={<RotateCcw size={12} strokeWidth={1.8} />}
                                        onClick={() => handleRestore(item.comment)}
                                    >
                                        還原
                                    </Btn>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(item.id)}
                                        className="b-soft r-btn h-8 w-8 bg-white inline-flex items-center justify-center text-[var(--ink-soft)] hover:text-[var(--coral)] btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-soft"
                                        aria-label="刪除此版本"
                                        title="刪除此版本"
                                    >
                                        <Trash2 size={13} strokeWidth={1.8} />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </ModalShell>
    );
};

export default HistoryModal;
