import React, { useState } from 'react';
import { Menu, X, Settings, Heart, School, Shield, LogOut, FileSpreadsheet, Printer, BarChart3, MoreVertical, ChevronDown } from 'lucide-react';

/**
 * 頁首元件 - 教育手寫普普風
 * RWD 優化：手機版將次要功能收納到「更多」選單
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
    isAdmin,
    pendingCount = 0
}) => {
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    // 更多選單項目
    const moreMenuItems = [
        { icon: FileSpreadsheet, label: 'Excel 匯入/匯出', onClick: onOpenImportExport, color: 'text-[#54A0FF]' },
        { icon: Printer, label: '列印與 PDF', onClick: onOpenPrint, color: 'text-[#FF6B9D]' },
        { icon: BarChart3, label: '統計儀表板', onClick: onOpenDashboard, color: 'text-[#6C5CE7]' },
        { icon: Settings, label: hasApiKey ? 'API 設定 ✓' : 'API 設定 ⚠️', onClick: onOpenSettings, color: hasApiKey ? 'text-[#1DD1A1]' : 'text-[#FF6B6B]' },
    ];

    return (
        <header className="bg-[#FFF9E6] border-b-4 border-[#2D3436] h-14 sm:h-16 md:h-20 flex items-center justify-between px-2 sm:px-4 md:px-6 shrink-0 z-20 sticky top-0 shadow-[0_4px_0_#2D3436]">
            {/* 左側：Logo 和班級 */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
                {/* 蜜蜂 icon */}
                <div className="bg-[#FECA57] text-[#2D3436] p-1 sm:p-1.5 md:p-2 lg:p-3 border-2 sm:border-3 border-[#2D3436] shadow-[2px_2px_0_#2D3436] sm:shadow-[3px_3px_0_#2D3436] transform rotate-[-2deg] rounded-lg shrink-0">
                    <span className="text-base sm:text-lg md:text-xl lg:text-2xl">🐝</span>
                </div>
                <div className="min-w-0 flex-shrink">
                    <h1 className="text-xs sm:text-sm md:text-lg lg:text-2xl font-black text-[#2D3436] tracking-wide truncate">
                        <span className="hidden lg:inline relative">
                            <span className="relative z-10">點石成金蜂</span>
                            <span className="absolute bottom-0 left-0 right-0 h-3 bg-[#FF6B9D] -z-0 transform -rotate-1"></span>
                        </span>
                        <span className="hidden lg:inline ml-1">🐝</span>
                        <span className="hidden md:inline lg:hidden">金蜂🐝</span>
                        <span className="md:hidden"></span>
                    </h1>
                    {/* 班級選擇器 */}
                    <button
                        onClick={onOpenClasses}
                        className="text-[10px] sm:text-xs font-bold text-[#636E72] hover:text-[#A29BFE] transition-colors flex items-center gap-0.5 max-w-[100px] sm:max-w-[120px] md:max-w-none"
                    >
                        <School size={10} className="shrink-0 hidden sm:block" />
                        <span className="truncate">{currentClassName}</span>
                        <ChevronDown size={10} className="shrink-0" />
                    </button>
                </div>
            </div>

            {/* 右側：功能按鈕 */}
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                {isAdmin && (
                    <button
                        onClick={onOpenAdmin}
                        className="btn-pop p-1.5 sm:p-2 bg-[#FF6B9D] text-white flex items-center gap-1 text-xs sm:text-sm relative"
                        title="管理員面板"
                    >
                        <Shield size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span className="hidden md:inline">管理</span>
                        {pendingCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#FECA57] text-[#2D3436] text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-[1px_1px_0_#2D3436]">
                                {pendingCount > 9 ? '9+' : pendingCount}
                            </span>
                        )}
                    </button>
                )}

                {/* 範本庫按鈕 - 主要功能，始終顯示 */}
                <button
                    onClick={onOpenTemplates}
                    className="btn-pop p-1.5 sm:p-2 bg-[#A29BFE] text-white flex items-center gap-1 text-xs sm:text-sm relative"
                    title="我的評語範本庫"
                >
                    <Heart size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden md:inline">範本</span>
                    {templateCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#2D3436] text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center">
                            {templateCount > 9 ? '9+' : templateCount}
                        </span>
                    )}
                </button>

                {/* 桌面版：顯示所有按鈕 */}
                <div className="hidden lg:flex items-center gap-1.5">
                    <button
                        onClick={onOpenImportExport}
                        className="btn-pop p-2 bg-[#54A0FF] text-white flex items-center gap-1 text-sm"
                        title="Excel 匯入/匯出"
                    >
                        <FileSpreadsheet size={18} />
                        <span>Excel</span>
                    </button>
                    <button
                        onClick={onOpenPrint}
                        className="btn-pop p-2 bg-[#FF6B9D] text-white flex items-center gap-1 text-sm"
                        title="列印與 PDF 匯出"
                    >
                        <Printer size={18} />
                        <span>列印</span>
                    </button>
                    <button
                        onClick={onOpenDashboard}
                        className="btn-pop p-2 bg-[#6C5CE7] text-white flex items-center gap-1 text-sm"
                        title="班級統計儀表板"
                    >
                        <BarChart3 size={18} />
                        <span>統計</span>
                    </button>
                    <button
                        onClick={onOpenSettings}
                        className={`btn-pop p-2 flex items-center gap-1 text-sm
                            ${hasApiKey ? 'bg-[#1DD1A1] text-white' : 'bg-[#FF6B6B] text-white animate-pulse'}`}
                        title={hasApiKey ? 'API Key 已設定' : '請設定 API Key'}
                    >
                        <Settings size={18} />
                        <span>{hasApiKey ? '⚙️' : '設定'}</span>
                    </button>
                </div>

                {/* 手機/平板版：「更多」選單 */}
                <div className="lg:hidden relative">
                    <button
                        onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                        className={`btn-pop p-1.5 sm:p-2 flex items-center gap-1 text-xs sm:text-sm
                            ${!hasApiKey ? 'bg-[#FF6B6B] text-white animate-pulse' : 'bg-[#636E72] text-white'}`}
                        title="更多功能"
                    >
                        <MoreVertical size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span className="hidden sm:inline">更多</span>
                    </button>

                    {/* 更多選單下拉 */}
                    {isMoreMenuOpen && (
                        <>
                            {/* 背景遮罩 */}
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsMoreMenuOpen(false)}
                            />
                            {/* 選單內容 */}
                            <div className="absolute right-0 top-full mt-2 bg-white border-2 border-[#2D3436] rounded-lg shadow-[3px_3px_0_#2D3436] py-2 w-48 z-50">
                                {moreMenuItems.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            item.onClick();
                                            setIsMoreMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#FFF9E6] transition-colors text-left"
                                    >
                                        <item.icon size={18} className={item.color} />
                                        <span className="text-sm font-medium text-[#2D3436]">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* 成語庫按鈕 */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`btn-pop p-1.5 sm:p-2 md:px-3 flex items-center gap-1 text-xs sm:text-sm
                        ${isSidebarOpen ? 'bg-[#FF6B9D] text-white' : 'bg-[#54A0FF] text-white'}`}
                >
                    {isSidebarOpen ? <X size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Menu size={16} className="sm:w-[18px] sm:h-[18px]" />}
                    <span className="hidden sm:inline">{isSidebarOpen ? '收起' : '成語'}</span>
                    <span className="sm:hidden">📚</span>
                </button>

                {/* 使用者頭像與登出 */}
                <div className="relative group">
                    {currentUser?.photoURL ? (
                        <img
                            src={currentUser.photoURL}
                            alt={currentUser.displayName}
                            className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border-2 border-[#2D3436] cursor-pointer hover:ring-2 hover:ring-[#FECA57] transition-all"
                        />
                    ) : (
                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-[#FECA57] rounded-full border-2 border-[#2D3436] flex items-center justify-center cursor-pointer">
                            <span className="text-sm sm:text-lg">👤</span>
                        </div>
                    )}
                    {/* 下拉選單 */}
                    <div className="absolute right-0 top-10 sm:top-12 bg-white border-2 border-[#2D3436] rounded-lg shadow-[3px_3px_0_#2D3436] p-3 w-48 sm:w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
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

                        {/* 管理員角色標識 */}
                        {isAdmin && (
                            <div className={`${currentUser?.schoolName ? 'mt-1' : 'mt-2 pt-2 border-t border-dashed border-[#E8DCC8]'}`}>
                                <div className="text-xs flex items-center gap-1">
                                    <Shield size={12} className="text-[#FF6B9D]" />
                                    <span className="font-bold text-[#FF6B9D]">系統管理員</span>
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
