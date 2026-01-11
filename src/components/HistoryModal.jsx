import React, { useState, useEffect } from 'react';
import { X, Clock, RotateCcw, Trash2 } from 'lucide-react';
import { historyService } from '../firebase';

/**
 * 評語歷史記錄 Modal
 * 查看學生過去的評語版本，支援回溯
 */
const HistoryModal = ({ isOpen, onClose, student, onRestore }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 訂閱歷史記錄
    useEffect(() => {
        if (!isOpen || !student) return;

        setIsLoading(true);
        const unsubscribe = historyService.subscribe(student.id, (data) => {
            setHistory(data);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen, student]);

    // 還原評語
    const handleRestore = (comment) => {
        onRestore(comment);
        onClose();
    };

    // 刪除歷史記錄
    const handleDelete = async (historyId) => {
        if (!window.confirm('確定要刪除此歷史記錄嗎？')) return;

        try {
            await historyService.delete(student.id, historyId);
        } catch (error) {
            console.error('刪除歷史記錄失敗:', error);
        }
    };

    // 格式化時間
    const formatTime = (timestamp) => {
        if (!timestamp?.toDate) return '未知時間';
        const date = timestamp.toDate();
        return date.toLocaleString('zh-TW', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen || !student) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4">
            <div className="card-pop w-full max-w-lg max-h-[85vh] flex flex-col animate-in bg-[#FFF9E6]">
                {/* Header */}
                <div className="p-3 sm:p-5 bg-[#54A0FF] border-b-3 border-[#2D3436] flex items-center justify-between">
                    <h3 className="font-black text-white flex items-center gap-2 text-lg sm:text-xl">
                        <Clock size={24} />
                        {student.name} 的評語歷史
                    </h3>
                    <button onClick={onClose} className="btn-pop p-2 bg-white text-[#2D3436]">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 mobile-scroll-hide">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-4xl animate-bounce">📜</div>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-4">📜</div>
                            <p className="text-lg font-bold text-[#636E72]">還沒有歷史記錄</p>
                            <p className="text-sm text-[#636E72]/70 mt-2">
                                生成評語後會自動保存歷史版本
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="bg-white border-2 border-[#2D3436] rounded-lg overflow-hidden shadow-[3px_3px_0_#2D3436]"
                                >
                                    {/* 時間標籤 */}
                                    <div className="px-3 py-2 bg-[#E8DCC8] border-b border-dashed border-[#2D3436]/20 flex items-center justify-between">
                                        <span className="text-xs font-bold text-[#636E72] flex items-center gap-1">
                                            <Clock size={12} />
                                            {formatTime(item.createdAt)}
                                            {index === 0 && (
                                                <span className="ml-2 px-2 py-0.5 bg-[#1DD1A1] text-white rounded-full text-[10px]">
                                                    最新
                                                </span>
                                            )}
                                        </span>
                                        <span className="text-xs text-[#636E72]">
                                            {item.comment?.length || 0} 字
                                        </span>
                                    </div>

                                    {/* 評語內容 */}
                                    <div className="p-3 text-sm text-[#2D3436] leading-relaxed max-h-[120px] overflow-y-auto">
                                        {item.comment}
                                    </div>

                                    {/* 操作按鈕 */}
                                    <div className="p-2 bg-[#FFF9E6] border-t border-dashed border-[#E8DCC8] flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleRestore(item.comment)}
                                            className="btn-pop px-3 py-1.5 bg-[#54A0FF] text-white text-xs font-bold flex items-center gap-1"
                                        >
                                            <RotateCcw size={12} />
                                            還原
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="btn-pop px-3 py-1.5 bg-[#FF6B6B] text-white text-xs font-bold flex items-center gap-1"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 sm:p-4 bg-[#E8DCC8] border-t-2 border-dashed border-[#2D3436]/20 text-xs text-[#636E72] text-center">
                    共 {history.length} 筆歷史記錄 | 點擊「還原」可恢復舊版本
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;
