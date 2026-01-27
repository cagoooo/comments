import React, { useState, useEffect } from 'react';
import { X, Heart, Trash2, Copy, BookOpen } from 'lucide-react';
import { templateService } from '../firebase';

/**
 * 範本庫 Modal
 * 查看、套用、刪除收藏的評語範本
 */
const TemplateModal = ({ isOpen, onClose, onApplyTemplate }) => {
    const [selectedCategory, setSelectedCategory] = useState('全部');
    const categories = ['全部', '學業', '品德', '人際', '其他'];

    // 訂閱範本即時更新
    useEffect(() => {
        if (!isOpen) return;

        setIsLoading(true);
        const unsubscribe = templateService.subscribe((data) => {
            setTemplates(data);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen]);

    // 刪除範本
    const handleDelete = async (id) => {
        try {
            await templateService.delete(id);
        } catch (error) {
            console.error('刪除範本失敗:', error);
        }
    };

    // 套用範本
    const handleApply = async (template) => {
        try {
            await templateService.incrementUsage(template.id);
            onApplyTemplate(template.content);
            onClose();
        } catch (error) {
            console.error('套用範本失敗:', error);
        }
    };

    // 複製到剪貼簿
    const handleCopy = async (content) => {
        try {
            await navigator.clipboard.writeText(content);
        } catch (error) {
            console.error('複製失敗:', error);
        }
    };

    // 更新分類
    const handleCategoryChange = async (id, newCategory) => {
        try {
            await templateService.update(id, { category: newCategory });
        } catch (error) {
            console.error('更新分類失敗:', error);
        }
    };

    // 篩選範本
    const filteredTemplates = templates.filter(t => {
        if (selectedCategory === '全部') return true;
        const cat = t.category || '其他';
        return cat === selectedCategory;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4">
            <div className="card-pop w-full max-w-2xl max-h-[90vh] flex flex-col animate-in bg-[#FFF9E6]">
                {/* Header */}
                <div className="p-3 sm:p-5 bg-[#FF6B9D] border-b-3 border-[#2D3436] flex items-center justify-between">
                    <h3 className="font-black text-white flex items-center gap-2 text-lg sm:text-xl">
                        <Heart size={24} />
                        我的評語範本庫
                    </h3>
                    <button
                        onClick={onClose}
                        className="btn-pop p-2 bg-white text-[#2D3436]"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Category Tabs */}
                <div className="flex overflow-x-auto p-2 gap-2 border-b-2 border-[#2D3436] bg-white mobile-scroll-hide">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border-2 ${selectedCategory === cat
                                    ? 'bg-[#FF6B9D] text-white border-[#2D3436] shadow-[2px_2px_0_#2D3436]'
                                    : 'bg-white text-[#636E72] border-transparent hover:bg-gray-100'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 mobile-scroll-hide">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-4xl animate-bounce">🐝</div>
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-4">📚</div>
                            <p className="text-lg font-bold text-[#636E72]">
                                {selectedCategory === '全部' ? '還沒有收藏的範本' : `沒有「${selectedCategory}」類別的範本`}
                            </p>
                            <p className="text-sm text-[#636E72]/70 mt-2">
                                在學生評語旁點擊 ❤️ 收藏 即可加入範本庫
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    className="bg-white border-2 border-[#2D3436] rounded-lg overflow-hidden shadow-[3px_3px_0_#2D3436]"
                                >
                                    {/* 範本標題 */}
                                    <div className="p-3 bg-[#FECA57] border-b-2 border-[#2D3436] flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-[#2D3436]">
                                                {template.studentName || '未命名'}
                                            </span>
                                            {template.tags && template.tags.length > 0 && (
                                                <div className="flex gap-1 flex-wrap">
                                                    {template.tags.slice(0, 3).map((tag, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 bg-white text-[#2D3436] text-xs rounded-full border border-[#2D3436]">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {template.tags.length > 3 && (
                                                        <span className="text-xs text-[#2D3436]">+{template.tags.length - 3}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* 分類選擇 */}
                                            <select
                                                value={template.category || '其他'}
                                                onChange={(e) => handleCategoryChange(template.id, e.target.value)}
                                                className="text-xs px-2 py-1 rounded border border-[#2D3436] bg-white cursor-pointer hover:bg-gray-50 focus:outline-none"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {categories.filter(c => c !== '全部').map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                            <span className="text-xs text-[#2D3436]/70 whitespace-nowrap">
                                                使用 {template.usageCount || 0} 次
                                            </span>
                                        </div>
                                    </div>

                                    {/* 範本內容 */}
                                    <div className="p-3 text-sm text-[#2D3436] leading-relaxed max-h-[120px] overflow-y-auto">
                                        {template.content}
                                    </div>

                                    {/* 操作按鈕 */}
                                    <div className="p-2 bg-[#FFF9E6] border-t border-dashed border-[#E8DCC8] flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleCopy(template.content)}
                                            className="btn-pop px-3 py-1.5 bg-white text-[#2D3436] text-xs font-bold flex items-center gap-1"
                                        >
                                            <Copy size={12} />
                                            複製
                                        </button>
                                        <button
                                            onClick={() => handleApply(template)}
                                            className="btn-pop px-3 py-1.5 bg-[#1DD1A1] text-white text-xs font-bold flex items-center gap-1"
                                        >
                                            <BookOpen size={12} />
                                            套用
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template.id)}
                                            className="btn-pop px-3 py-1.5 bg-[#FF6B6B] text-white text-xs font-bold flex items-center gap-1"
                                        >
                                            <Trash2 size={12} />
                                            刪除
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 sm:p-4 bg-[#E8DCC8] border-t-2 border-dashed border-[#2D3436]/20 text-xs text-[#636E72] text-center">
                    共 {filteredTemplates.length} 個範本 | 範本儲存在雲端，跨裝置同步
                </div>
            </div>
        </div>
    );
};

export default TemplateModal;
