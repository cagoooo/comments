import React from 'react';
import { Clock } from 'lucide-react';

/**
 * 待審核頁面
 * 顯示在使用者已登入但尚未通過審核時
 */
const PendingPage = ({ user, onLogout }) => {
    return (
        <div className="min-h-screen bg-[#FFF9E6] flex items-center justify-center p-4">
            <div className="card-pop w-full max-w-md p-8 text-center">
                {/* 使用者頭像 */}
                <div className="mb-6">
                    {user?.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt={user.displayName}
                            className="w-20 h-20 rounded-full border-3 border-[#2D3436] shadow-[3px_3px_0_#2D3436] mx-auto"
                        />
                    ) : (
                        <div className="w-20 h-20 bg-[#FECA57] rounded-full border-3 border-[#2D3436] shadow-[3px_3px_0_#2D3436] mx-auto flex items-center justify-center">
                            <span className="text-4xl">👤</span>
                        </div>
                    )}
                </div>

                {/* 歡迎訊息 */}
                <h2 className="text-2xl font-black text-[#2D3436] mb-2">
                    嗨，{user?.displayName || '使用者'}！
                </h2>
                <p className="text-[#636E72] text-sm mb-6">{user?.email}</p>

                {/* 待審核狀態 */}
                <div className="bg-[#FECA57]/30 border-3 border-[#FECA57] rounded-lg p-6 mb-6">
                    <div className="text-4xl mb-3 animate-bounce">
                        <Clock size={48} className="mx-auto text-[#FF9F43]" />
                    </div>
                    <h3 className="text-xl font-black text-[#2D3436] mb-2">
                        🕐 帳號審核中
                    </h3>
                    <p className="text-sm text-[#636E72] font-medium">
                        您的帳號正在等待管理員審核。<br />
                        審核通過後，您將可以使用指派的班級。
                    </p>
                </div>

                {/* 提示 */}
                <div className="bg-[#54A0FF]/10 border-2 border-dashed border-[#54A0FF] rounded-lg p-4 mb-6 text-left">
                    <p className="text-xs text-[#636E72]">
                        💡 <strong>小提示</strong>：請聯繫管理員 (cagooo@gmail.com) 加速審核流程。
                    </p>
                </div>

                {/* 登出按鈕 */}
                <button
                    onClick={onLogout}
                    className="btn-pop px-6 py-3 bg-[#636E72] text-white font-bold"
                >
                    登出
                </button>
            </div>
        </div>
    );
};

export default PendingPage;
