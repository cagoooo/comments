import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Lazy Loading 元件
 * 用於 React.lazy 動態載入時的 fallback
 */
const LazyLoading = () => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-[#FFF9E6] border-3 border-[#2D3436] rounded-lg p-6 shadow-lg flex flex-col items-center gap-3">
                <Loader2 size={32} className="animate-spin text-[#FF6B9D]" />
                <span className="font-bold text-[#2D3436]">載入中...</span>
            </div>
        </div>
    );
};

export default LazyLoading;
