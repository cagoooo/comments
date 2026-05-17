import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Search, X, MessageSquare, Tag, History } from 'lucide-react';

// 搜尋歷史 localStorage key
const SEARCH_HISTORY_KEY = 'student_search_history';
const MAX_HISTORY_SIZE = 5;

/**
 * 學生搜尋與篩選列
 *
 * 新設計：紙質 chunky 搜尋框 + ⌘K hint + 兩個 3-態 filter chip + 結果統計徽章。
 * 保留既有：搜尋歷史 dropdown、hasComment/hasTag null↔true↔false 切換、結果計數。
 *
 * App.jsx 全域 ⌘K shortcut 尚未實作（Batch 11），但這個元件已掛 forwardRef 給未來連結。
 */
const SearchBar = forwardRef(function SearchBar({
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    totalCount,
    filteredCount,
}, ref) {
    const [showHistory, setShowHistory] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const inputRef = useRef(null);
    const historyRef = useRef(null);

    // 對外暴露 focus 介面（給 ⌘K 全域 shortcut 使用）
    useImperativeHandle(ref, () => ({
        focus: () => inputRef.current?.focus(),
        select: () => inputRef.current?.select(),
    }), []);

    // 載入搜尋歷史
    useEffect(() => {
        try {
            const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
            if (saved) setSearchHistory(JSON.parse(saved));
        } catch (e) {
            console.error('載入搜尋歷史失敗:', e);
        }
    }, []);

    // 儲存歷史
    const saveToHistory = (query) => {
        if (!query.trim()) return;
        setSearchHistory(prev => {
            const filtered = prev.filter(item => item !== query);
            const next = [query, ...filtered].slice(0, MAX_HISTORY_SIZE);
            try {
                localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
            } catch (e) {
                console.error('儲存搜尋歷史失敗:', e);
            }
            return next;
        });
    };

    // 點外部關閉歷史 dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (historyRef.current && !historyRef.current.contains(e.target)) {
                setShowHistory(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchConfirm = () => {
        if (searchQuery.trim()) saveToHistory(searchQuery.trim());
        setShowHistory(false);
    };

    const selectHistory = (item) => {
        setSearchQuery(item);
        setShowHistory(false);
        inputRef.current?.focus();
    };

    const clearSearch = () => {
        setSearchQuery('');
        inputRef.current?.focus();
    };

    const removeHistoryItem = (e, item) => {
        e.stopPropagation();
        setSearchHistory(prev => {
            const next = prev.filter(h => h !== item);
            try {
                localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
            } catch (err) {
                console.error('儲存搜尋歷史失敗:', err);
            }
            return next;
        });
    };

    // 3 態切換：null → true → false → null
    const toggleFilter = (key) => {
        setFilters(prev => ({
            ...prev,
            [key]: prev[key] === null ? true : prev[key] === true ? false : null,
        }));
    };

    /**
     * Filter chip 樣式 — null（未選）/ true（要）/ false（不要）三態。
     * null: paper-2 底 + ink-soft；true: mint 底；false: coral 底
     */
    const filterChipStyle = (val) => {
        if (val === true) return { background: 'var(--mint)', color: 'var(--ink)' };
        if (val === false) return { background: 'var(--coral)', color: 'var(--ink)' };
        return { background: 'var(--paper-2)', color: 'var(--ink-soft)' };
    };

    const filterLabels = {
        hasComment: { true: '有評語', false: '無評語', null: '評語' },
        hasTag: { true: '有標籤', false: '無標籤', null: '標籤' },
    };

    const isFiltered = searchQuery || filters.hasComment !== null || filters.hasTag !== null;

    return (
        <div className="mb-4 space-y-3">
            {/* ── 搜尋列 + ⌘K + filter chips ───────────────────── */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3" ref={historyRef}>

                {/* 搜尋框 */}
                <div className="relative flex-1">
                    <div className="b-ink r-btn h-12 px-4 flex items-center gap-2 bg-white sh-sm focus-within:ring-2 focus-within:ring-honey-soft">
                        <Search size={16} strokeWidth={1.8} className="text-[var(--ink-soft)] shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => searchHistory.length > 0 && setShowHistory(true)}
                            onBlur={() => setTimeout(handleSearchConfirm, 200)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchConfirm()}
                            placeholder="搜尋姓名、標籤、評語內容…"
                            className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-[var(--ink-mute)]"
                            aria-label="搜尋學生"
                        />
                        {searchQuery ? (
                            <button
                                onClick={clearSearch}
                                className="text-[var(--ink-soft)] hover:text-[var(--coral)] transition-colors shrink-0"
                                aria-label="清除搜尋"
                                type="button"
                            >
                                <X size={16} strokeWidth={1.8} />
                            </button>
                        ) : (
                            <kbd className="font-mono text-[10px] text-[var(--ink-soft)] border border-[var(--line-soft)] rounded px-1.5 py-0.5 bg-[var(--paper-2)] shrink-0 hidden sm:inline">
                                ⌘ K
                            </kbd>
                        )}
                    </div>

                    {/* 搜尋歷史 dropdown */}
                    {showHistory && searchHistory.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white b-ink sh-card r-card z-20 overflow-hidden">
                            <div className="px-3 py-2 bg-[var(--paper-2)] border-b border-[var(--line-soft)] flex items-center gap-2 text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">
                                <History size={12} strokeWidth={1.8} />
                                最近搜尋
                            </div>
                            {searchHistory.map((item, idx) => (
                                <div
                                    key={`${item}-${idx}`}
                                    onClick={() => selectHistory(item)}
                                    className="px-4 py-2.5 text-[13px] font-medium text-[var(--ink)] hover:bg-[var(--honey-soft)] cursor-pointer flex items-center justify-between group transition-colors"
                                >
                                    <span className="truncate">{item}</span>
                                    <button
                                        onClick={(e) => removeHistoryItem(e, item)}
                                        className="opacity-0 group-hover:opacity-100 text-[var(--ink-soft)] hover:text-[var(--coral)] transition-all shrink-0 ml-2"
                                        aria-label="移除此筆歷史"
                                        type="button"
                                    >
                                        <X size={13} strokeWidth={1.8} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => toggleFilter('hasComment')}
                        style={filterChipStyle(filters.hasComment)}
                        className="b-ink sh-sm r-btn h-12 px-3 inline-flex items-center gap-1.5 font-bold text-[12.5px] btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                        aria-label={`評語篩選：${filterLabels.hasComment[String(filters.hasComment)] || '評語'}`}
                        aria-pressed={filters.hasComment !== null}
                    >
                        <MessageSquare size={13} strokeWidth={1.8} />
                        <span>{filterLabels.hasComment[String(filters.hasComment)] || '評語'}</span>
                    </button>
                    <button
                        onClick={() => toggleFilter('hasTag')}
                        style={filterChipStyle(filters.hasTag)}
                        className="b-ink sh-sm r-btn h-12 px-3 inline-flex items-center gap-1.5 font-bold text-[12.5px] btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                        aria-label={`標籤篩選：${filterLabels.hasTag[String(filters.hasTag)] || '標籤'}`}
                        aria-pressed={filters.hasTag !== null}
                    >
                        <Tag size={13} strokeWidth={1.8} />
                        <span>{filterLabels.hasTag[String(filters.hasTag)] || '標籤'}</span>
                    </button>
                </div>
            </div>

            {/* ── 結果統計徽章（僅在有篩選時顯示） ───────────────────── */}
            {isFiltered && (
                <div className="flex justify-end">
                    <span className="font-mono text-[11px] font-bold text-[var(--ink-soft)] bg-[var(--paper-2)] px-3 py-1.5 r-btn border border-[var(--line-soft)]">
                        顯示 <span className="text-[var(--ink)]">{filteredCount}</span> / {totalCount} 位
                    </span>
                </div>
            )}
        </div>
    );
});

export default SearchBar;
