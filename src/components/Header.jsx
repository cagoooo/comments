import React from 'react';
import { Menu, X, Settings, Heart, School, Shield, LogOut, FileSpreadsheet, Printer, BarChart3 } from 'lucide-react';

/**
 * 頁首元件 - 教育手寫普普風
 * 支援班級選擇器、使用者資訊、管理員面板
 */
const Header = ({
    isSidebarOpen,
    setIsSidebarOpen,
    onOpenSettings,
    onOpenTemplates,
    onOpenClasses,
    onOpenAdmin,
    onOpenImportExport,
    onOpenPrint,
    onOpenDashboard,
    onLogout,
    hasApiKey,
    templateCount = 0,
    currentClassName = '全部學生',
    currentUser,
    isAdmin
}) => {
    return (
        <header className="bg-[#FFF9E6] border-b-4 border-[#2D3436] h-16 sm:h-20 flex items-center justify-between px-3 sm:px-6 shrink-0 z-20 sticky top-0 shadow-[0_4px_0_#2D3436]">
            <div className="flex items-center gap-2 sm:gap-4">
                {/* 蜜蜂 icon 便利貼風格 */}
                <div className="bg-[#FECA57] text-[#2D3436] p-2 sm:p-3 border-3 border-[#2D3436] shadow-[3px_3px_0_#2D3436] transform rotate-[-2deg] rounded-lg">
                    <span className="text-xl sm:text-2xl">🐝</span>
                </div>
                <div>
                    <h1 className="text-lg sm:text-2xl font-black text-[#2D3436] tracking-wide">
                        <span className="hidden sm:inline relative">
                            <span className="relative z-10">點石成金蜂</span>
                            <span className="absolute bottom-0 left-0 right-0 h-3 bg-[#FF6B9D] -z-0 transform -rotate-1"></span>
                        </span>
                        <span className="hidden sm:inline ml-1">🐝</span>
                        <span className="sm:hidden">金蜂🐝</span>
                    </h1>
                    {/* 班級選擇器 */}
                    <button
                        onClick={onOpenClasses}
                        className="text-xs font-bold text-[#636E72] hover:text-[#A29BFE] transition-colors flex items-center gap-1 mt-0.5"
                    >
                        <School size={12} />
                        {currentClassName}
                        <span className="text-[10px]">▼</span>
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
                {/* 管理員按鈕 */}
                {isAdmin && (
                    <button
                        onClick={onOpenAdmin}
                        className="btn-pop p-2 sm:px-3 sm:py-2 bg-[#FF6B9D] text-white flex items-center gap-1 text-sm"
                        title="管理員面板"
                    >
                        <Shield size={18} />
                        <span className="hidden sm:inline">管理</span>
                    </button>
                )}

                {/* 範本庫按鈕 */}
                <button
                    onClick={onOpenTemplates}
                    className="btn-pop p-2 sm:px-3 sm:py-2 bg-[#A29BFE] text-white flex items-center gap-1 text-sm relative"
                    title="我的評語範本庫"
                >
                    <Heart size={18} />
                    <span className="hidden sm:inline">範本</span>
                    {templateCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#2D3436] text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {templateCount > 9 ? '9+' : templateCount}
                        </span>
                    )}
                </button>

                {/* Excel 匯入/匯出按鈕 */}
                <button
                    onClick={onOpenImportExport}
                    className="btn-pop p-2 sm:px-3 sm:py-2 bg-[#54A0FF] text-white flex items-center gap-1 text-sm"
                    title="Excel 匯入/匯出"
                >
                    <FileSpreadsheet size={18} />
                    <span className="hidden sm:inline">Excel</span>
                </button>

                {/* 列印按鈕 */}
                <button
                    onClick={onOpenPrint}
                    className="btn-pop p-2 sm:px-3 sm:py-2 bg-[#FF6B9D] text-white flex items-center gap-1 text-sm"
                    title="列印與 PDF 匯出"
                >
                    <Printer size={18} />
                    <span className="hidden sm:inline">列印</span>
                </button>

                {/* 統計儀表板按鈕 */}
                <button
                    onClick={onOpenDashboard}
                    className="btn-pop p-2 sm:px-3 sm:py-2 bg-[#6C5CE7] text-white flex items-center gap-1 text-sm"
                    title="班級統計儀表板"
                >
                    <BarChart3 size={18} />
                    <span className="hidden sm:inline">統計</span>
                </button>

                {/* 設定按鈕 */}
                <button
                    onClick={onOpenSettings}
                    className={`btn-pop p-2 sm:px-3 sm:py-2 flex items-center gap-1 text-sm
            ${hasApiKey
                            ? 'bg-[#1DD1A1] text-white'
                            : 'bg-[#FF6B6B] text-white animate-pulse'}`}
                    title={hasApiKey ? 'API Key 已設定' : '請設定 API Key'}
                >
                    <Settings size={18} />
                    <span className="hidden sm:inline">{hasApiKey ? '⚙️' : '設定'}</span>
                </button>

                {/* 成語庫按鈕 */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`btn-pop px-3 sm:px-4 py-2 flex items-center gap-1 sm:gap-2 text-sm sm:text-base
            ${isSidebarOpen
                            ? 'bg-[#FF6B9D] text-white'
                            : 'bg-[#54A0FF] text-white'}`}
                >
                    {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    <span className="hidden sm:inline">{isSidebarOpen ? '收起' : '成語庫'}</span>
                    <span className="sm:hidden">📚</span>
                </button>

                {/* 使用者頭像與登出 */}
                <div className="relative group">
                    {currentUser?.photoURL ? (
                        <img
                            src={currentUser.photoURL}
                            alt={currentUser.displayName}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-[#2D3436] cursor-pointer hover:ring-2 hover:ring-[#FECA57] transition-all"
                        />
                    ) : (
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#FECA57] rounded-full border-2 border-[#2D3436] flex items-center justify-center cursor-pointer">
                            <span className="text-lg">👤</span>
                        </div>
                    )}
                    {/* 下拉選單 */}
                    <div className="absolute right-0 top-12 bg-white border-2 border-[#2D3436] rounded-lg shadow-[3px_3px_0_#2D3436] p-3 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                        <div className="text-sm font-bold text-[#2D3436] truncate">{currentUser?.displayName}</div>
                        <div className="text-xs text-[#636E72] truncate">{currentUser?.email}</div>

                        {/* 學校資訊 */}
                        {currentUser?.schoolName && (
                            <div className="mt-2 pt-2 border-t border-dashed border-[#E8DCC8]">
                                <div className="text-xs text-[#636E72] flex items-center gap-1">
                                    🏫 <span className="font-bold text-[#A29BFE]">{currentUser.schoolName}</span>
                                </div>
                            </div>
                        )}

                        {/* 班級資訊 */}
                        {currentUser?.assignedClassNames && currentUser.assignedClassNames.length > 0 && (
                            <div className={`${currentUser?.schoolName ? 'mt-1' : 'mt-2 pt-2 border-t border-dashed border-[#E8DCC8]'}`}>
                                <div className="text-xs text-[#636E72] flex items-start gap-1">
                                    <School size={12} className="mt-0.5 shrink-0" />
                                    <span className="font-bold text-[#54A0FF]">
                                        {currentUser.assignedClassNames.join('、')}
                                    </span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={onLogout}
                            className="w-full btn-pop px-3 py-2 bg-[#636E72] text-white text-xs font-bold flex items-center justify-center gap-2 mt-3"
                        >
                            <LogOut size={14} />
                            登出
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
