import React, { useState, useEffect } from 'react';
import { Heart, Trash2, Copy, BookOpen, Search, Check } from 'lucide-react';
import { templateService } from '../firebase';
import ModalShell from './ui/ModalShell';
import { Btn, Chip } from './atoms';

/**
 * 範本庫 Modal — 查看、套用、刪除、分類收藏的評語範本
 *
 * Props 保留：isOpen / onClose / onApplyTemplate。
 * Firebase 邏輯（subscribe / update / delete / incrementUsage）完全保留。
 *
 * 視覺：ModalShell + 2-col 範本卡 grid + bg-lined 預覽 + hover 浮起 + chip 標籤
 */
const TemplateModal = ({ isOpen, onClose, onApplyTemplate }) => {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('全部');
    const [query, setQuery] = useState('');

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

    const handleDelete = async (id) => {
        try {
            await templateService.delete(id);
        } catch (error) {
            console.error('刪除範本失敗:', error);
        }
    };

    const handleApply = async (template) => {
        try {
            await templateService.incrementUsage(template.id);
            onApplyTemplate(template.content);
            onClose();
        } catch (error) {
            console.error('套用範本失敗:', error);
        }
    };

    const handleCopy = async (content) => {
        try {
            await navigator.clipboard.writeText(content);
        } catch (error) {
            console.error('複製失敗:', error);
        }
    };

    const handleCategoryChange = async (id, newCategory) => {
        try {
            await templateService.update(id, { category: newCategory });
        } catch (error) {
            console.error('更新分類失敗:', error);
        }
    };

    // 篩選：分類 + 搜尋
    const filtered = templates.filter(t => {
        const cat = t.category || '其他';
        if (selectedCategory !== '全部' && cat !== selectedCategory) return false;
        if (query.trim()) {
            const q = query.trim().toLowerCase();
            const hit = (t.content || '').toLowerCase().includes(q)
                || (t.studentName || '').toLowerCase().includes(q)
                || (t.tags || []).some(tag => (tag || '').toLowerCase().includes(q));
            if (!hit) return false;
        }
        return true;
    });

    // 每個分類的範本數（用於 chip 數字）
    const countByCategory = (cat) => {
        if (cat === '全部') return templates.length;
        return templates.filter(t => (t.category || '其他') === cat).length;
    };

    return (
        <ModalShell
            open={isOpen}
            onClose={onClose}
            width={1080}
            eyebrow="My Templates"
            tapeColor="lav"
            icon={<Heart size={18} strokeWidth={1.8} />}
            title="範本百寶箱"
            subtitle={
                <>
                    你已收藏 <span className="font-bold text-[var(--ink)]">{templates.length}</span> 則範本 ·
                    點任一張即可套用到目前聚焦的學生
                </>
            }
            footer={
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-[12px] text-[var(--ink-soft)]">
                        共 {filtered.length} 個 · 範本儲存在雲端跨裝置同步
                    </div>
                    <Btn variant="outline" size="sm" onClick={onClose}>
                        關閉
                    </Btn>
                </div>
            }
        >
            <div className="px-5 sm:px-7 pt-4 pb-2">
                {/* 搜尋 + 分類 chip */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                    <div className="flex-1 b-ink r-btn h-11 px-3 bg-white flex items-center gap-2 sh-sm focus-within:ring-2 focus-within:ring-honey-soft">
                        <Search size={14} strokeWidth={1.8} className="text-[var(--ink-soft)]" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="搜尋範本標題、內容、標籤…"
                            className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-[var(--ink-mute)]"
                            aria-label="搜尋範本"
                        />
                    </div>
                    <div className="flex items-center gap-1 b-ink r-btn p-1 bg-white sh-sm h-11 overflow-x-auto">
                        {categories.map(cat => {
                            const active = selectedCategory === cat;
                            const n = countByCategory(cat);
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{
                                        background: active ? 'var(--ink)' : 'transparent',
                                        color: active ? 'var(--paper)' : 'var(--ink)',
                                    }}
                                    className="px-3 h-8 text-[12.5px] font-bold rounded-md inline-flex items-center gap-1.5 shrink-0"
                                    aria-pressed={active}
                                >
                                    <span>{cat}</span>
                                    <span className={`font-mono text-[11px] ${active ? 'opacity-70' : 'text-[var(--ink-soft)]'}`}>
                                        {n}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 範本 grid */}
            <div className="px-5 sm:px-7 pb-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-4xl bee-bob" aria-label="載入中">
                        🐝
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-[var(--ink-soft)]">
                        <div className="text-4xl mb-3" aria-hidden="true">📭</div>
                        <div className="font-bold">
                            {selectedCategory === '全部' && !query.trim()
                                ? '還沒有收藏的範本'
                                : `沒有符合的範本`}
                        </div>
                        <div className="text-[12px] mt-1 text-[var(--ink-mute)]">
                            {selectedCategory === '全部' && !query.trim()
                                ? '在學生評語旁點擊 ❤️ 收藏，即可加入範本庫'
                                : '試試其他關鍵字或分類'}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        {filtered.map(template => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                categories={categories}
                                onApply={handleApply}
                                onCopy={handleCopy}
                                onDelete={handleDelete}
                                onCategoryChange={handleCategoryChange}
                            />
                        ))}
                    </div>
                )}
            </div>
        </ModalShell>
    );
};

const TAG_COLORS = ['peach', 'mint', 'sky', 'lav', 'honey'];

const TemplateCard = ({ template, categories, onApply, onCopy, onDelete, onCategoryChange }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyClick = async () => {
        await onCopy(template.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="bg-white b-ink sh-sm r-card overflow-hidden relative group hover:sh-card hover:-translate-y-0.5 transition-all">
            {/* head */}
            <div className="px-4 pt-3 pb-2.5 flex items-start justify-between gap-3 border-b border-dashed border-[var(--ink)]/15">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--honey)' }} />
                        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--ink-soft)] truncate">
                            {template.studentName || '未命名'}
                        </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10.5px] font-mono text-[var(--ink-soft)]">
                        <select
                            value={template.category || '其他'}
                            onChange={(e) => onCategoryChange(template.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="b-soft r-btn bg-white px-1.5 py-0.5 text-[10.5px] font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-honey-soft"
                            aria-label="變更分類"
                        >
                            {categories.filter(c => c !== '全部').map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <span>· 已用 {template.usageCount || 0} 次</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => onDelete(template.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 b-soft r-btn bg-white inline-flex items-center justify-center text-[var(--ink-soft)] hover:text-[var(--coral)] shrink-0"
                    aria-label="刪除範本"
                    title="刪除範本"
                >
                    <Trash2 size={12} strokeWidth={1.8} />
                </button>
            </div>

            {/* preview（bg-lined 紙線稿） */}
            <div className="px-4 py-3 bg-lined text-[13px] leading-[28px] clamp-3 text-[var(--ink)]/90">
                {template.content}
            </div>

            {/* tags */}
            {template.tags && template.tags.length > 0 && (
                <div className="px-4 pt-2 flex items-center gap-1.5 flex-wrap">
                    {template.tags.slice(0, 4).map((tag, idx) => (
                        <Chip key={`${tag}-${idx}`} color={TAG_COLORS[idx % TAG_COLORS.length]} soft size="sm">
                            {tag}
                        </Chip>
                    ))}
                    {template.tags.length > 4 && (
                        <span className="text-[10.5px] font-mono text-[var(--ink-soft)]">+{template.tags.length - 4}</span>
                    )}
                </div>
            )}

            {/* action strip */}
            <div className="px-4 pt-3 pb-4 flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onApply(template)}
                    style={{ background: 'var(--mint)' }}
                    className="flex-1 b-ink sh-sm r-btn h-9 inline-flex items-center justify-center gap-1.5 font-bold text-[12.5px] btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                >
                    <Check size={13} strokeWidth={1.8} />
                    套用
                </button>
                <button
                    type="button"
                    onClick={handleCopyClick}
                    className="b-ink r-btn h-9 w-9 bg-white sh-sm inline-flex items-center justify-center btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                    title={copied ? '已複製' : '複製內容'}
                    aria-label={copied ? '已複製' : '複製內容'}
                >
                    {copied
                        ? <Check size={13} strokeWidth={1.8} style={{ color: 'var(--mint)' }} />
                        : <Copy size={13} strokeWidth={1.8} />}
                </button>
            </div>
        </div>
    );
};

export default TemplateModal;
