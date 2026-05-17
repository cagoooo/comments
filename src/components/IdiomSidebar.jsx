import React, { useState, useMemo } from 'react';
import { X, Search, Star, ChevronDown, Sparkles } from 'lucide-react';
import { IDIOM_CATEGORIES } from '../data/idiomData';

/**
 * 把 15 個既有成語分類映射到 5 個 token 色（語義 mapping）：
 *   (優) → mint   (良) → sky    (可) → honey   (差) → coral
 *   服務 → peach   其他 → lav
 */
const categoryColor = (cat) => {
    if (cat === '服務') return 'peach';
    if (cat === '其他') return 'lav';
    if (cat.includes('(差)')) return 'coral';
    if (cat.includes('(可)')) return 'honey';
    if (cat.includes('(良)')) return 'sky';
    if (cat.includes('(優)')) return 'mint';
    return 'lav';
};

/**
 * 成語百寶箱（右側 sidebar / 手機底部 sheet）
 *
 * 響應式：
 *  - < sm：底部 sheet（max-h 85vh，圓角頂、translate-y）
 *  - ≥ sm：右側 sidebar（400px 寬，translate-x）
 *
 * Props 完全保留：isOpen / onClose / selectedIds / expandedCategories /
 *               onToggleCategory / onIdiomClick / userId
 */
const IdiomSidebar = ({
    isOpen,
    onClose,
    selectedIds,
    expandedCategories,
    onToggleCategory,
    onIdiomClick,
    userId,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    // localStorage usage tracking（依帳號隔離）
    const storageKey = userId ? `idiom_usage_${userId}` : 'idiom_usage';

    const getUsageCount = (idiom) => {
        try {
            const usage = JSON.parse(localStorage.getItem(storageKey) || '{}');
            return usage[idiom] || 0;
        } catch {
            return 0;
        }
    };

    const recordUsage = (idiom) => {
        try {
            const usage = JSON.parse(localStorage.getItem(storageKey) || '{}');
            usage[idiom] = (usage[idiom] || 0) + 1;
            localStorage.setItem(storageKey, JSON.stringify(usage));
        } catch (e) {
            console.error('記錄成語使用失敗:', e);
        }
    };

    const handleIdiomClick = (idiom) => {
        recordUsage(idiom);
        onIdiomClick(idiom);
    };

    // 搜尋過濾
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return IDIOM_CATEGORIES;
        const q = searchQuery.trim().toLowerCase();
        const result = {};
        Object.entries(IDIOM_CATEGORIES).forEach(([cat, list]) => {
            const items = list.filter(i => i.toLowerCase().includes(q));
            if (items.length) result[cat] = items;
        });
        return result;
    }, [searchQuery]);

    // 最常用前 8 個（取代 proto 的「最近使用」）
    const popularIdioms = useMemo(() => {
        if (!isOpen) return [];
        const all = Object.values(IDIOM_CATEGORIES).flat();
        return all
            .map(idiom => ({ idiom, count: getUsageCount(idiom) }))
            .filter(x => x.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 8)
            .map(x => x.idiom);
    }, [isOpen, storageKey]);

    const totalResults = Object.values(filteredCategories).reduce((sum, list) => sum + list.length, 0);
    const totalIdiomCount = Object.values(IDIOM_CATEGORIES).reduce((sum, list) => sum + list.length, 0);

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                aria-hidden="true"
                className={[
                    'fixed inset-0 z-40 bg-[var(--ink)]/30 backdrop-blur-[2px] transition-opacity',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
                ].join(' ')}
            />

            {/* Sidebar / BottomSheet */}
            <aside
                className={[
                    'fixed z-50 bg-[var(--paper)] flex flex-col transition-transform duration-200 ease-out',
                    // mobile: bottom sheet
                    'inset-x-0 bottom-0 max-h-[85vh] rounded-t-[24px] border-t-2 border-x-2 border-[var(--ink)]',
                    // desktop ≥ sm: right sidebar
                    'sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-[400px] sm:max-h-none sm:rounded-none sm:border-t-0 sm:border-x-0 sm:border-l-2',
                    // shadow only on desktop（mobile 用 rounded-top 視覺已分隔）
                    'sm:sh-card',
                    isOpen
                        ? 'translate-y-0 sm:translate-x-0'
                        : 'translate-y-full sm:translate-y-0 sm:translate-x-full',
                ].join(' ')}
                aria-hidden={!isOpen}
                role="dialog"
                aria-modal="true"
                aria-label="成語百寶箱"
            >
                {/* mobile drag indicator */}
                <div className="sm:hidden flex justify-center pt-2 pb-1" aria-hidden="true">
                    <div className="w-12 h-1.5 rounded-full bg-[var(--ink)]/20" />
                </div>

                {/* Header */}
                <div className="px-4 sm:px-5 pt-2 sm:pt-5 pb-3 border-b-2 border-[var(--ink)]/10 relative">
                    {/* 紙膠帶 */}
                    <div
                        className="tape hidden sm:block"
                        style={{ top: -10, left: 30, transform: 'rotate(-3deg)' }}
                        aria-hidden="true"
                    />

                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                                Idiom Library
                            </div>
                            <div className="text-[20px] sm:text-[22px] font-black tracking-tight mt-0.5 uw inline-block">
                                成語百寶箱
                            </div>
                            <div className="text-[12px] text-[var(--ink-soft)] mt-2">
                                {selectedIds.size > 0 ? (
                                    <>已選 <span className="font-bold text-[var(--ink)]">{selectedIds.size}</span> 人 · 點擊成語加入他們的標籤</>
                                ) : (
                                    <>點擊學生標籤區或勾選學生，再點成語加入</>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="shrink-0 w-9 h-9 b-ink sh-sm r-btn bg-white inline-flex items-center justify-center btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                            aria-label="關閉成語庫"
                        >
                            <X size={16} strokeWidth={2.2} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="mt-4 b-ink r-btn h-10 px-3 bg-white flex items-center gap-2 sh-sm focus-within:ring-2 focus-within:ring-honey-soft">
                        <Search size={14} strokeWidth={1.8} className="shrink-0 text-[var(--ink-soft)]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="搜尋成語…"
                            className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-[var(--ink-mute)]"
                            aria-label="搜尋成語"
                        />
                        {searchQuery ? (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="text-[var(--ink-soft)] hover:text-[var(--coral)] shrink-0"
                                aria-label="清除搜尋"
                            >
                                <X size={13} strokeWidth={2.2} />
                            </button>
                        ) : (
                            <kbd className="hidden sm:inline font-mono text-[10px] text-[var(--ink-soft)] border border-[var(--line-soft)] rounded px-1.5 py-0.5 bg-[var(--paper-2)] shrink-0">
                                /
                            </kbd>
                        )}
                    </div>

                    {searchQuery && (
                        <div className="mt-2 text-[11px] font-mono text-[var(--ink-soft)]">
                            找到 <span className="font-bold text-[var(--ink)]">{totalResults}</span> 個結果
                        </div>
                    )}

                    {/* 最常用 chip 列 */}
                    {!searchQuery && popularIdioms.length > 0 && (
                        <div className="mt-3">
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--ink-soft)] mb-2 inline-flex items-center gap-1">
                                <Star size={11} strokeWidth={1.8} /> 最常用
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {popularIdioms.map(r => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => handleIdiomClick(r)}
                                        className="px-2.5 h-7 rounded-full bg-white b-ink sh-sm text-[12px] font-bold btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Category list */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-2.5">
                    {Object.entries(filteredCategories).map(([cat, list]) => {
                        const color = categoryColor(cat);
                        const isOpen = expandedCategories[cat] || !!searchQuery;
                        return (
                            <div key={cat} className="r-card b-soft bg-white overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => onToggleCategory(cat)}
                                    className="w-full px-3.5 h-11 flex items-center gap-3 hover:bg-[var(--paper-2)]/60 transition focus-visible:outline-none focus-visible:bg-[var(--honey-soft)]"
                                    aria-expanded={isOpen}
                                    aria-controls={`idiom-cat-${cat}`}
                                >
                                    <span
                                        className="w-3 h-3 rounded-full b-ink shrink-0"
                                        style={{ background: `var(--${color})` }}
                                        aria-hidden="true"
                                    />
                                    <span className="font-bold text-[13px] truncate">{cat}</span>
                                    <span className="font-mono text-[11px] text-[var(--ink-soft)] shrink-0">{list.length}</span>
                                    <ChevronDown
                                        size={14}
                                        strokeWidth={1.8}
                                        className={`ml-auto transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                {isOpen && (
                                    <div
                                        id={`idiom-cat-${cat}`}
                                        className="px-3.5 pb-3 pt-1 flex flex-wrap gap-1.5"
                                    >
                                        {list.map(idiom => (
                                            <button
                                                key={idiom}
                                                type="button"
                                                onClick={() => handleIdiomClick(idiom)}
                                                style={{ background: `var(--${color}-soft)` }}
                                                className="px-2.5 h-7 rounded-full b-ink sh-sm text-[12px] font-bold btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                                            >
                                                {searchQuery ? (
                                                    <HighlightInline text={idiom} highlight={searchQuery} />
                                                ) : idiom}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {searchQuery && Object.keys(filteredCategories).length === 0 && (
                        <div className="text-center py-10">
                            <Sparkles size={32} strokeWidth={1.5} className="mx-auto mb-3 text-[var(--ink-mute)]" />
                            <p className="text-[var(--ink-soft)] font-bold text-[13px]">
                                找不到「{searchQuery}」相關的成語
                            </p>
                            <p className="text-[var(--ink-mute)] text-[11px] mt-1">
                                換個關鍵字試試
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 sm:px-5 py-3 border-t-2 border-[var(--ink)]/10 flex items-center justify-between text-[11.5px] font-bold shrink-0">
                    <span className="text-[var(--ink-soft)] font-mono">共 {totalIdiomCount} 詞彙</span>
                    {selectedIds.size > 0 && (
                        <span className="text-[var(--mint)] inline-flex items-center gap-1">
                            <Star size={11} strokeWidth={1.8} /> 已選 {selectedIds.size} 人準備加入
                        </span>
                    )}
                </div>
            </aside>
        </>
    );
};

// 小型內嵌高亮（避免 import HighlightText 為了一個用法）
const HighlightInline = ({ text, highlight }) => {
    if (!highlight) return text;
    const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((p, i) =>
        p.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="px-0.5 rounded font-bold" style={{ background: 'var(--honey)', color: 'var(--ink)' }}>
                {p}
            </mark>
        ) : p
    );
};

export default IdiomSidebar;
