import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * 載入覆蓋層 - 教育手寫普普風
 */
const LoadingOverlay = ({ progress }) => {
    const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2D3436]/70 backdrop-blur-md p-4">
            <div className="card-pop w-[95%] sm:w-[90%] max-w-2xl flex flex-col items-center justify-center p-6 sm:p-10 text-center animate-in bg-[#FFF9E6]">

                {/* 蜜蜂動畫 */}
                <div className="mb-4 sm:mb-6 text-6xl sm:text-8xl animate-bounce-soft">
                    🐝
                </div>

                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#2D3436] mb-4 sm:mb-6">
                    <span className="relative inline-block">
                        評語產生中
                        <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#FECA57] -z-10 transform rotate-1"></span>
                    </span>
                    <span className="animate-pulse">...</span>
                </h2>

                {/* 進度條 - 鉛筆風格 */}
                <div className="w-full max-w-md bg-white border-3 border-[#2D3436] h-8 sm:h-10 mb-3 sm:mb-4 overflow-hidden rounded-full shadow-[4px_4px_0_#2D3436]">
                    <div
                        className="h-full transition-all duration-300 ease-out bg-gradient-to-r from-[#FF6B9D] via-[#FECA57] to-[#1DD1A1]"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <p className="text-lg sm:text-2xl text-[#2D3436] font-bold mb-4 sm:mb-6">
                    ✏️ {progress.current} / {progress.total} 位同學
                </p>

                <p className="text-xl sm:text-2xl md:text-3xl text-[#FF6B9D] font-black">
                    辛苦了各位老師 ❤️
                </p>
            </div>
        </div>
    );
};

export default LoadingOverlay;
