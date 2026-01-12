import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { IDIOM_CATEGORIES } from '../data/idiomData';

/**
 * 成語庫側邊欄 - 教育手寫普普風
 * 支援搜尋與常用成語排序
 */
const IdiomSidebar = ({
    isOpen,
    onClose,
    selectedIds,
    expandedCategories,
    onToggleCategory,
    onIdiomClick,
    userId
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    // 分類對應顏色
    const categoryColors = {
        "資賦 (優)": "#1DD1A1",
        "資賦 (差)": "#FF6B6B",
        "學業 (優)": "#54A0FF",
        "學業 (可)": "#FECA57",
        "學業 (差)": "#FF9F43",
        "才藝 (優)": "#A29BFE",
        "性格 (優)": "#FF6B9D",
        "性格 (良)": "#1DD1A1",
        "性格 (可)": "#FECA57",
        "性格 (差)": "#FF6B6B",
        "行為 (優)": "#54A0FF",
        "行為 (良)": "#A29BFE",
        "行為 (差)": "#FF9F43",
        "服務": "#FF6B9D",
        "其他": "#636E72"
    };

    // 取得常用成語（從 localStorage，依帳號隔離）
    const getUsageCount = (idiom) => {
        try {
            const storageKey = userId ? `idiom_usage_${userId}` : 'idiom_usage';
            const usage = JSON.parse(localStorage.getItem(storageKey) || '{}');
            return usage[idiom] || 0;
        } catch {
            return 0;
        }
    };

    // 記錄使用次數（依帳號隔離）
    const recordUsage = (idiom) => {
        try {
            const storageKey = userId ? `idiom_usage_${userId}` : 'idiom_usage';
            const usage = JSON.parse(localStorage.getItem(storageKey) || '{}');
            usage[idiom] = (usage[idiom] || 0) + 1;
            localStorage.setItem(storageKey, JSON.stringify(usage));
        } catch (e) {
            console.error('記錄成語使用失敗:', e);
        }
    };

    // 處理成語點擊
    const handleIdiomClick = (idiom) => {
        recordUsage(idiom);
        onIdiomClick(idiom);
    };

    // 搜尋過濾
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return IDIOM_CATEGORIES;

        const query = searchQuery.trim().toLowerCase();
        const filtered = {};

        Object.entries(IDIOM_CATEGORIES).forEach(([category, list]) => {
            const matchedIdioms = list.filter(idiom =>
                idiom.toLowerCase().includes(query)
            );
            if (matchedIdioms.length > 0) {
                filtered[category] = matchedIdioms;
            }
        });

        return filtered;
    }, [searchQuery]);

    // 常用成語（使用次數 > 0，按次數排序取前 12）
    const popularIdioms = useMemo(() => {
        const allIdioms = Object.values(IDIOM_CATEGORIES).flat();
        const withUsage = allIdioms.map(idiom => ({
            idiom,
            count: getUsageCount(idiom)
        })).filter(item => item.count > 0);

        return withUsage
            .sort((a, b) => b.count - a.count)
            .slice(0, 12)
            .map(item => item.idiom);
    }, [isOpen]); // 每次開啟時重新計算

    // 搜尋結果數量
    const totalResults = Object.values(filteredCategories).reduce((sum, list) => sum + list.length, 0);

    return (
        <>
            {/* 遮罩 */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[2px] transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* 側邊欄 */}
            <div
                className={`fixed top-0 right-0 bottom-0 bg-[#FFF9E6] border-l-4 border-[#2D3436] shadow-[-8px_0_0_#2D3436] transform transition-transform duration-300 ease-in-out flex flex-col z-50
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          w-full sm:w-[80%] md:w-[50%] lg:w-[35%] xl:w-[30%] max-w-[400px]`}
            >
                {/* 標題列 */}
                <div className="p-3 sm:p-5 bg-[#1DD1A1] border-b-3 border-[#2D3436] flex items-center justify-between shrink-0">
                    <h2 className="font-black text-white flex items-center gap-2 sm:gap-3 text-base sm:text-xl">
                        <span className="text-2xl">📖</span> 成語特質庫
                    </h2>
                    <button
                        onClick={onClose}
                        className="btn-pop p-2 bg-white text-[#2D3436]"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 搜尋框 */}
                <div className="p-3 sm:p-4 bg-white border-b-2 border-dashed border-[#E8DCC8]">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636E72]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="🔍 搜尋成語..."
                            className="w-full pl-10 pr-4 py-2.5 border-2 border-[#2D3436] rounded-lg text-sm font-medium outline-none focus:border-[#1DD1A1] bg-[#FFFDF5]"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#636E72] hover:text-[#FF6B6B]"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    {searchQuery && (
                        <div className="mt-2 text-xs text-[#636E72] font-bold">
                            找到 {totalResults} 個結果
                        </div>
                    )}
                </div>

                {/* 內容區 */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 mobile-scroll-hide">
                    <div className="text-sm font-bold text-[#2D3436] bg-[#FECA57] px-3 py-2 border-2 border-[#2D3436] rounded-lg inline-flex items-center gap-2 shadow-[2px_2px_0_#2D3436]">
                        <span>👆</span> 點擊即可加入特質
                    </div>

                    {selectedIds.size > 0 && (
                        <div className="bg-[#54A0FF] text-white p-3 sm:p-4 border-2 border-[#2D3436] text-xs sm:text-sm font-bold rounded-lg shadow-[3px_3px_0_#2D3436]">
                            <span className="block mb-1 text-white/80">💡 提示：</span>
                            已選 <strong>{selectedIds.size}</strong> 人，點擊成語會同時加到這些同學的標籤中！
                        </div>
                    )}

                    {/* 常用成語 */}
                    {popularIdioms.length > 0 && !searchQuery && (
                        <div className="border-2 border-[#2D3436] rounded-lg overflow-hidden shadow-[3px_3px_0_#2D3436]">
                            <div className="w-full flex items-center justify-between p-3 sm:p-4 text-left text-sm sm:text-base font-black text-white bg-[#FF6B9D]">
                                <span>⭐ 常用成語</span>
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{popularIdioms.length}</span>
                            </div>
                            <div className="p-3 sm:p-4 bg-[#FFFDF5] flex flex-wrap gap-1.5 sm:gap-2 border-t-2 border-dashed border-[#E8DCC8]">
                                {popularIdioms.map((idiom, index) => (
                                    <button
                                        key={`popular-${idiom}-${index}`}
                                        onClick={() => handleIdiomClick(idiom)}
                                        className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-[#FF6B9D] border-2 border-[#2D3436] text-white font-bold rounded-lg hover:bg-[#FF5291] transition-all shadow-[2px_2px_0_#2D3436] hover:-translate-y-0.5"
                                    >
                                        {idiom}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 成語分類列表 */}
                    {Object.entries(filteredCategories).map(([category, list]) => {
                        const bgColor = categoryColors[category] || '#A29BFE';

                        return (
                            <div key={category} className="border-2 border-[#2D3436] rounded-lg overflow-hidden shadow-[3px_3px_0_#2D3436]">
                                <button
                                    onClick={() => onToggleCategory(category)}
                                    className="w-full flex items-center justify-between p-3 sm:p-4 text-left text-sm sm:text-base font-black text-white transition-colors"
                                    style={{ backgroundColor: bgColor }}
                                >
                                    <span>{category}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{list.length}</span>
                                        <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center">
                                            {expandedCategories[category] ? '▼' : '▶'}
                                        </span>
                                    </div>
                                </button>

                                {(expandedCategories[category] || searchQuery) && (
                                    <div className="p-3 sm:p-4 bg-[#FFFDF5] flex flex-wrap gap-1.5 sm:gap-2 border-t-2 border-dashed border-[#E8DCC8]">
                                        {list.map((idiom, index) => (
                                            <button
                                                key={`${idiom}-${index}`}
                                                onClick={() => handleIdiomClick(idiom)}
                                                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-white border-2 border-[#2D3436] text-[#2D3436] font-bold rounded-lg hover:text-white transition-all shadow-[2px_2px_0_#2D3436] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#2D3436] active:translate-y-0 active:shadow-[1px_1px_0_#2D3436]"
                                                style={{ '--hover-bg': bgColor }}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = bgColor}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                            >
                                                {searchQuery && idiom.includes(searchQuery) ? (
                                                    <span dangerouslySetInnerHTML={{
                                                        __html: idiom.replace(
                                                            new RegExp(`(${searchQuery})`, 'gi'),
                                                            '<mark class="bg-[#FECA57] px-0.5 rounded">$1</mark>'
                                                        )
                                                    }} />
                                                ) : idiom}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* 無搜尋結果 */}
                    {searchQuery && Object.keys(filteredCategories).length === 0 && (
                        <div className="text-center py-10">
                            <div className="text-4xl mb-3">🔍</div>
                            <p className="text-[#636E72] font-bold">找不到「{searchQuery}」相關的成語</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default IdiomSidebar;
