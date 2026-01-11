import React from 'react';

/**
 * 資料載入中元件
 */
const DataLoading = () => {
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#FFF9E6]">
            <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">🐝</div>
                <h2 className="text-2xl font-black text-[#2D3436] mb-2">
                    資料載入中...
                </h2>
                <p className="text-[#636E72] font-medium">
                    正在從雲端同步您的資料
                </p>
                <div className="mt-4 flex justify-center gap-1">
                    <span className="w-3 h-3 bg-[#FF6B9D] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-3 h-3 bg-[#FECA57] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-3 h-3 bg-[#1DD1A1] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
            </div>
        </div>
    );
};

export default DataLoading;
