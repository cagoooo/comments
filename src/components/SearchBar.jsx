import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Filter, MessageSquare, Tag, History } from 'lucide-react';

// 搜尋歷史 localStorage key
const SEARCH_HISTORY_KEY = 'student_search_history';
const MAX_HISTORY_SIZE = 5;

/**
 * 學生搜尋與篩選元件
 * 支援即時搜尋、搜尋歷史、篩選器
 */
const SearchBar = ({
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    totalCount,
    filteredCount
}) => {
    const [showHistory, setShowHistory] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const inputRef = useRef(null);
    const historyRef = useRef(null);

    // 從 localStorage 載入搜尋歷史
    useEffect(() => {
        try {
            const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
            if (saved) {
                setSearchHistory(JSON.parse(saved));
            }
        } catch (e) {
            console.error('載入搜尋歷史失敗:', e);
        }
    }, []);

    // 儲存搜尋歷史
    const saveToHistory = (query) => {
        if (!query.trim()) return;

        setSearchHistory(prev => {
            // 移除重複項目
            const filtered = prev.filter(item => item !== query);
            // 加到最前面
            const newHistory = [query, ...filtered].slice(0, MAX_HISTORY_SIZE);

            // 儲存到 localStorage
            try {
                localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
            } catch (e) {
                console.error('儲存搜尋歷史失敗:', e);
            }

            return newHistory;
        });
    };

    // 點擊外部關閉歷史下拉選單
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (historyRef.current && !historyRef.current.contains(e.target)) {
                setShowHistory(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 處理搜尋
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
    };

    // 處理搜尋確認（Enter 或失焦）
    const handleSearchConfirm = () => {
        if (searchQuery.trim()) {
            saveToHistory(searchQuery.trim());
        }
        setShowHistory(false);
    };

    // 選擇歷史項目
    const selectHistory = (item) => {
        setSearchQuery(item);
        setShowHistory(false);
        inputRef.current?.focus();
    };

    // 清除搜尋
    const clearSearch = () => {
        setSearchQuery('');
        inputRef.current?.focus();
    };

    // 清除單筆歷史
    const removeHistoryItem = (e, item) => {
        e.stopPropagation();
        setSearchHistory(prev => {
            const newHistory = prev.filter(h => h !== item);
            try {
                localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
            } catch (err) {
                console.error('儲存搜尋歷史失敗:', err);
            }
            return newHistory;
        });
    };

    // 切換篩選器
    const toggleFilter = (filterKey) => {
        setFilters(prev => ({
            ...prev,
            [filterKey]: prev[filterKey] === null ? true : prev[filterKey] === true ? false : null
        }));
    };

    // 取得篩選器按鈕樣式
    const getFilterButtonStyle = (value) => {
        if (value === true) return 'bg-[#1DD1A1] text-white';
        if (value === false) return 'bg-[#FF6B6B] text-white';
        return 'bg-white text-[#2D3436] hover:bg-[#FECA57]';
    };

    // 取得篩選器標籤
    const getFilterLabel = (key, value) => {
        const labels = {
            hasComment: { true: '有評語', false: '無評語', null: '評語' },
            hasTag: { true: '有標籤', false: '無標籤', null: '標籤' }
        };
        return labels[key][value];
    };

    return (
        <div className="mb-4 space-y-3">
            {/* 搜尋輸入區 */}
            <div className="relative" ref={historyRef}>
                <div className="relative flex items-center">
                    <Search size={18} className="absolute left-3 text-[#636E72]" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        onFocus={() => searchHistory.length > 0 && setShowHistory(true)}
                        onBlur={() => setTimeout(handleSearchConfirm, 200)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchConfirm()}
                        placeholder="🔍 搜尋學生（姓名、標籤、評語內容）..."
                        className="w-full pl-10 pr-10 py-3 text-sm font-medium border-3 border-[#2D3436] rounded-lg bg-white focus:border-[#54A0FF] focus:ring-2 focus:ring-[#54A0FF]/30 outline-none transition-all shadow-[3px_3px_0_#2D3436]"
                    />
                    {searchQuery && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-3 text-[#636E72] hover:text-[#FF6B6B] transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* 搜尋歷史下拉選單 */}
                {showHistory && searchHistory.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-3 border-[#2D3436] rounded-lg shadow-[4px_4px_0_#2D3436] z-20 overflow-hidden">
                        <div className="px-3 py-2 bg-[#F8F9FA] border-b-2 border-[#E8DCC8] flex items-center gap-2 text-xs font-bold text-[#636E72]">
                            <History size={14} />
                            最近搜尋
                        </div>
                        {searchHistory.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => selectHistory(item)}
                                className="px-4 py-2.5 text-sm font-medium text-[#2D3436] hover:bg-[#FECA57]/30 cursor-pointer flex items-center justify-between group transition-colors"
                            >
                                <span>{item}</span>
                                <button
                                    onClick={(e) => removeHistoryItem(e, item)}
                                    className="opacity-0 group-hover:opacity-100 text-[#636E72] hover:text-[#FF6B6B] transition-all"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 篩選器與統計 */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                {/* 篩選器按鈕 */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#636E72] flex items-center gap-1">
                        <Filter size={14} />
                        篩選：
                    </span>

                    {/* 評語篩選 */}
                    <button
                        onClick={() => toggleFilter('hasComment')}
                        className={`px-3 py-1.5 text-xs font-bold border-2 border-[#2D3436] rounded-lg transition-all flex items-center gap-1 shadow-[2px_2px_0_#2D3436] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 ${getFilterButtonStyle(filters.hasComment)}`}
                    >
                        <MessageSquare size={12} />
                        {getFilterLabel('hasComment', filters.hasComment)}
                    </button>

                    {/* 標籤篩選 */}
                    <button
                        onClick={() => toggleFilter('hasTag')}
                        className={`px-3 py-1.5 text-xs font-bold border-2 border-[#2D3436] rounded-lg transition-all flex items-center gap-1 shadow-[2px_2px_0_#2D3436] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 ${getFilterButtonStyle(filters.hasTag)}`}
                    >
                        <Tag size={12} />
                        {getFilterLabel('hasTag', filters.hasTag)}
                    </button>
                </div>

                {/* 搜尋結果統計 */}
                {(searchQuery || filters.hasComment !== null || filters.hasTag !== null) && (
                    <div className="text-xs font-bold text-[#636E72] bg-[#F8F9FA] px-3 py-1.5 rounded-full border-2 border-[#E8DCC8]">
                        顯示 <span className="text-[#54A0FF]">{filteredCount}</span> / {totalCount} 位學生
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchBar;
