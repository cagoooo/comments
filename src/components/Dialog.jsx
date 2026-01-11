import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

/**
 * 對話框元件 - 教育手寫普普風
 */
const Dialog = ({ dialog, closeDialog }) => {
    if (!dialog.isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="card-pop w-full max-w-sm overflow-hidden animate-in">
                {/* 標題 - 便利貼風格 */}
                <div className="p-4 sm:p-5 bg-[#FF6B9D] border-b-3 border-[#2D3436]">
                    <h3 className="font-black text-lg sm:text-xl text-white flex items-center gap-2">
                        {dialog.type === 'confirm'
                            ? <AlertTriangle size={24} />
                            : <Info size={24} />
                        }
                        {dialog.title}
                    </h3>
                </div>
                {/* 內容 */}
                <div className="p-4 sm:p-6 bg-[#FFFDF5] text-[#2D3436] font-bold text-base sm:text-lg">
                    {dialog.message}
                </div>
                {/* 按鈕區 */}
                <div className="p-3 sm:p-4 bg-[#FFF9E6] flex justify-end gap-2 sm:gap-3 border-t-2 border-dashed border-[#E8DCC8]">
                    {dialog.type === 'confirm' ? (
                        <>
                            <button
                                onClick={closeDialog}
                                className="btn-pop px-4 sm:px-6 py-2 bg-white text-[#2D3436] text-sm sm:text-base"
                            >
                                取消 ✋
                            </button>
                            <button
                                onClick={dialog.onConfirm}
                                className="btn-pop px-4 sm:px-6 py-2 bg-[#FF6B6B] text-white text-sm sm:text-base"
                            >
                                確定刪除 🗑️
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={closeDialog}
                            className="btn-pop px-4 sm:px-6 py-2 bg-[#1DD1A1] text-white text-sm sm:text-base"
                        >
                            知道了 ✓
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dialog;
