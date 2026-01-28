import React, { useState, useMemo } from 'react';
import { X, Tag, Trash2, ArrowRight, Eraser, Users } from 'lucide-react';

/**
 * 批次操作 Modal
 * 提供批次加標籤、移除標籤、清空評語、移動班級等功能
 */
const BatchActionsModal = ({
    isOpen,
    onClose,
    selectedCount,
    allTags,
    classes,
    onAddTag,
    onRemoveTag,
    onMoveClass,
    onClearComments
}) => {
    const [activeTab, setActiveTab] = useState('tags'); // tags, class, data
    const [tagInput, setTagInput] = useState('');
    const [selectedTagToRemove, setSelectedTagToRemove] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');

    // 處理加入標籤
    const handleAddTag = () => {
        if (!tagInput.trim()) return;
        onAddTag(tagInput.trim());
        setTagInput('');
        onClose();
    };

    // 處理移除標籤
    const handleRemoveTag = () => {
        if (!selectedTagToRemove) return;
        onRemoveTag(selectedTagToRemove);
        setSelectedTagToRemove('');
        onClose();
    };

    // 處理移動班級
    const handleMoveClass = () => {
        if (!selectedClassId) return;
        onMoveClass(selectedClassId);
        onClose();
    };

    // 處理清空評語
    const handleClearComments = () => {
        if (window.confirm(`確定要清空這 ${selectedCount} 位學生的評語嗎？此操作無法復原。`)) {
            onClearComments();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#FFFDF5] w-full max-w-md rounded-xl shadow-[8px_8px_0_#2D3436] border-4 border-[#2D3436] overflow-hidden animate-scale-up">
                {/* Header */}
                <div className="bg-[#6C5CE7] p-4 flex items-center justify-between border-b-4 border-[#2D3436]">
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <span className="text-2xl">⚡</span>
                        批次操作 ({selectedCount} 人)
                    </h2>
                    <button onClick={onClose} className="text-white hover:rotate-90 transition-transform">
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b-4 border-[#2D3436] bg-[#DFE6E9]">
                    <button
                        onClick={() => setActiveTab('tags')}
                        className={`flex-1 py-3 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors ${activeTab === 'tags' ? 'bg-[#FFFDF5] text-[#2D3436]' : 'text-[#636E72] hover:bg-white/50'}`}
                    >
                        <Tag size={18} /> 標籤管理
                    </button>
                    <button
                        onClick={() => setActiveTab('class')}
                        className={`flex-1 py-3 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors ${activeTab === 'class' ? 'bg-[#FFFDF5] text-[#2D3436]' : 'text-[#636E72] hover:bg-white/50'}`}
                    >
                        <Users size={18} /> 班級移動
                    </button>
                    <button
                        onClick={() => setActiveTab('data')}
                        className={`flex-1 py-3 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors ${activeTab === 'data' ? 'bg-[#FFFDF5] text-[#2D3436]' : 'text-[#636E72] hover:bg-white/50'}`}
                    >
                        <Eraser size={18} /> 資料清理
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 min-h-[250px]">
                    {activeTab === 'tags' && (
                        <div className="space-y-6">
                            {/* 加入標籤 */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#2D3436] flex items-center gap-1">
                                    <span className="text-[#00B894]">●</span> 批次加入標籤
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        placeholder="輸入標籤名稱..."
                                        className="flex-1 p-2 border-2 border-[#2D3436] rounded-lg outline-none focus:border-[#6C5CE7]"
                                    />
                                    <button
                                        onClick={handleAddTag}
                                        disabled={!tagInput.trim()}
                                        className="px-4 py-2 bg-[#00B894] text-white font-bold rounded-lg border-2 border-[#2D3436] shadow-[2px_2px_0_#2D3436] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:shadow-none"
                                    >
                                        加入
                                    </button>
                                </div>
                            </div>

                            <hr className="border-dashed border-[#2D3436]/20" />

                            {/* 移除標籤 */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#2D3436] flex items-center gap-1">
                                    <span className="text-[#FF7675]">●</span> 批次移除標籤
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedTagToRemove}
                                        onChange={(e) => setSelectedTagToRemove(e.target.value)}
                                        className="flex-1 p-2 border-2 border-[#2D3436] rounded-lg outline-none focus:border-[#FF7675] bg-white"
                                    >
                                        <option value="">選擇要移除的標籤...</option>
                                        {allTags.map(tag => (
                                            <option key={tag} value={tag}>{tag}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleRemoveTag}
                                        disabled={!selectedTagToRemove}
                                        className="px-4 py-2 bg-[#FF7675] text-white font-bold rounded-lg border-2 border-[#2D3436] shadow-[2px_2px_0_#2D3436] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:shadow-none"
                                    >
                                        移除
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'class' && (
                        <div className="space-y-4">
                            <div className="bg-[#E1F0FF] p-4 rounded-lg border-2 border-[#54A0FF] mb-4">
                                <p className="text-sm text-[#2D3436] font-medium">
                                    將選取的 <strong>{selectedCount}</strong> 位學生移動到指定班級。
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#2D3436]">選擇目標班級</label>
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    className="w-full p-3 border-2 border-[#2D3436] rounded-lg outline-none focus:border-[#54A0FF] bg-white text-lg font-bold"
                                >
                                    <option value="">請選擇班級...</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleMoveClass}
                                disabled={!selectedClassId}
                                className="w-full mt-4 py-3 bg-[#54A0FF] text-white font-black rounded-lg border-2 border-[#2D3436] shadow-[4px_4px_0_#2D3436] active:translate-y-[2px] active:shadow-[2px_2px_0_#2D3436] flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                            >
                                確認移動 <ArrowRight size={20} />
                            </button>
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="space-y-6 text-center">
                            <div className="bg-[#FFEAA7] p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center border-4 border-[#2D3436]">
                                <Eraser size={40} className="text-[#2D3436]" />
                            </div>

                            <div>
                                <h3 className="text-xl font-black text-[#2D3436] mb-2">清空評語內容</h3>
                                <p className="text-[#636E72] text-sm px-4">
                                    這將會清空選取學生的「AI 評語」欄位，<br />
                                    但保留學生姓名、標籤與其他資料。
                                </p>
                            </div>

                            <button
                                onClick={handleClearComments}
                                className="w-full py-3 bg-[#FF7675] text-white font-black rounded-lg border-2 border-[#2D3436] shadow-[4px_4px_0_#2D3436] active:translate-y-[2px] active:shadow-[2px_2px_0_#2D3436] flex items-center justify-center gap-2 hover:bg-[#D63031] transition-colors"
                            >
                                <Trash2 size={20} /> 確認清空評語
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BatchActionsModal;
