import React, { useState } from 'react';
import {
    School, ChevronDown, Shield, Heart, FileSpreadsheet, Printer,
    BarChart3, Settings, BookOpen, X, MoreVertical, LogOut, Activity,
} from 'lucide-react';
import { Btn, BeeMascot } from './atoms';

/**
 * NavBtn — Header 內用的彩色動作按鈕（含 badge 槽位）。
 * 用 atoms/Btn 包裝，外部包 relative 容器以承載絕對定位 badge。
 */
const NavBtn = ({ icon, color, label, onClick, badge, pulse, title, ariaLabel, hideLabelBelow = '' }) => (
    <Btn
        color={color}
        icon={icon}
        onClick={onClick}
        title={title}
        ariaLabel={ariaLabel || label}
        className={['relative', pulse ? 'animate-pulse' : ''].filter(Boolean).join(' ')}
    >
        <span className={hideLabelBelow ? `hidden ${hideLabelBelow}:inline` : ''}>{label}</span>
        {badge ? (
            <span
                className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-[var(--ink)] text-[var(--paper)] text-[10px] font-mono font-bold rounded-full flex items-center justify-center border border-[var(--paper)]"
                aria-label={`${badge} 個通知`}
            >
                {badge > 99 ? '99+' : badge}
            </span>
        ) : null}
    </Btn>
);

/**
 * 點石成金蜂 頁首
 *
 * 設計：A+D Fusion — 蜜蜂吉祥物（紙膠帶）+ 彩色 chunky 按鈕 + 班級 breadcrumb wave underline
 *
 * 保留既有所有 props 與行為（hasApiKey pulse、isAdmin pendingCount badge、templateCount、
 * MoreMenu RWD 摺疊、使用者 dropdown）。
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
    onOpenUsageDashboard,
    onLogout,
    hasApiKey,
    templateCount = 0,
    currentClassName = '全部學生',
    currentUser,
    isAdmin,
    pendingCount = 0,
}) => {
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    // MoreMenu 項目分組：
    //   - alwaysItems: 在 md+ 全部尺寸都顯示（lg+ 主列無對應按鈕的進階功能）
    //   - tabletOnlyItems: 只在 md~lg 顯示（lg+ 已有對應的 top-level 按鈕，重複呈現會混亂）
    const moreMenuAlwaysItems = [
        { Icon: Activity, label: '使用量儀表板', onClick: onOpenUsageDashboard, dot: 'sky' },
    ];
    const moreMenuTabletOnlyItems = [
        { Icon: FileSpreadsheet, label: 'Excel 匯入/匯出', onClick: onOpenImportExport, dot: 'sky' },
        { Icon: Printer, label: '列印與 PDF', onClick: onOpenPrint, dot: 'peach' },
        { Icon: BarChart3, label: '班級統計', onClick: onOpenDashboard, dot: 'mint' },
        {
            Icon: Settings,
            label: hasApiKey ? 'API 設定 ✓' : 'API 設定 ⚠️',
            onClick: onOpenSettings,
            dot: hasApiKey ? 'honey' : 'coral',
        },
    ];

    const displayInitial = (currentUser?.displayName || currentUser?.email || '?').trim().charAt(0).toUpperCase();

    return (
        <header
            className="sticky top-0 z-30 border-b-2 border-[var(--ink)]"
            style={{ background: 'var(--paper)' }}
        >
            <div className="max-w-[1480px] mx-auto px-3 sm:px-5 lg:px-6 h-16 sm:h-[72px] lg:h-[78px] flex items-center justify-between gap-3">

                {/* ── LEFT: 蜜蜂 + 標題 + 班級 breadcrumb ───────────────────── */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <BeeMascot size={52} rot={-4} className="shrink-0" />

                    <div className="min-w-0">
                        <div className="flex items-baseline gap-1.5 leading-none">
                            <span className="text-[18px] sm:text-[22px] lg:text-[26px] font-black tracking-tight truncate text-[var(--ink)]">
                                <span className="hidden md:inline">點石成金蜂</span>
                                <span className="md:hidden">金蜂</span>
                            </span>
                            <span className="text-[16px] sm:text-[18px]">🐝</span>
                        </div>

                        <div className="mt-1 sm:mt-1.5 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-[12px] min-w-0">
                            <button
                                onClick={onOpenClasses}
                                className="inline-flex items-center gap-1 text-[var(--ink-soft)] font-bold hover:text-[var(--ink)] focus-visible:outline-none focus-visible:text-[var(--ink)] min-w-0"
                                aria-label="選擇班級"
                            >
                                <School size={12} strokeWidth={1.8} className="shrink-0" />
                                <span className="truncate max-w-[110px] sm:max-w-[180px] lg:max-w-none">
                                    {currentClassName}
                                </span>
                                <ChevronDown size={11} strokeWidth={1.8} className="shrink-0" />
                            </button>
                            <span className="text-[var(--ink-mute)] hidden sm:inline">·</span>
                            <span className="uw font-mono text-[10px] tracking-wider text-[var(--ink-soft)] hidden sm:inline">
                                114學年 上學期
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: 動作按鈕 + 成語庫 + 使用者 ────────────────────── */}
                {/*
                    < md：只顯示頭像，其他全部移到 MobileTabBar（Batch 10）
                    md ~ lg：管理 + 範本 + MoreMenu + 成語庫 + 頭像
                    ≥ lg：6 按鈕全展 + 成語庫 + 頭像
                */}
                <nav className="flex items-center gap-1.5 sm:gap-2">

                    {/* 管理（admin only，md+ 才顯示，< md 進 MobileTabBar 更多選單） */}
                    {isAdmin && (
                        <div className="hidden md:inline-flex">
                            <NavBtn
                                icon={<Shield size={15} strokeWidth={1.8} />}
                                color="coral"
                                label="管理"
                                onClick={onOpenAdmin}
                                badge={pendingCount}
                                title={`管理員面板${pendingCount > 0 ? `（${pendingCount} 個待審核）` : ''}`}
                                hideLabelBelow="lg"
                            />
                        </div>
                    )}

                    {/* 範本（md+ 才顯示，< md 進 MobileTabBar） */}
                    <div className="hidden md:inline-flex">
                        <NavBtn
                            icon={<Heart size={15} strokeWidth={1.8} />}
                            color="lav"
                            label="範本"
                            onClick={onOpenTemplates}
                            badge={templateCount}
                            title="我的評語範本庫"
                            hideLabelBelow="lg"
                        />
                    </div>

                    {/* 桌面：Excel / 列印 / 統計 / API */}
                    <div className="hidden lg:flex items-center gap-2">
                        <NavBtn
                            icon={<FileSpreadsheet size={15} strokeWidth={1.8} />}
                            color="sky"
                            label="Excel"
                            onClick={onOpenImportExport}
                            title="Excel 匯入/匯出"
                        />
                        <NavBtn
                            icon={<Printer size={15} strokeWidth={1.8} />}
                            color="peach"
                            label="列印"
                            onClick={onOpenPrint}
                            title="列印與 PDF 匯出"
                        />
                        <NavBtn
                            icon={<BarChart3 size={15} strokeWidth={1.8} />}
                            color="mint"
                            label="統計"
                            onClick={onOpenDashboard}
                            title="班級統計儀表板"
                        />
                        <NavBtn
                            icon={<Settings size={15} strokeWidth={1.8} />}
                            color={hasApiKey ? 'honey' : 'coral'}
                            label={hasApiKey ? 'API' : '設定'}
                            onClick={onOpenSettings}
                            pulse={!hasApiKey}
                            title={hasApiKey ? 'API Key 已設定' : '請設定 API Key'}
                        />
                    </div>

                    {/* 更多選單：md+ 全尺寸顯示
                          - md~lg：列出全部進階項（Excel / 列印 / 統計 / 使用量 / API）
                          - lg+：只列出未在主列出現的項目（使用量）
                        手機(< md) 整個 nav 收進 MobileTabBar，不渲染這個下拉 */}
                    <div className="hidden md:inline-flex relative">
                        <Btn
                            color={hasApiKey ? 'paper' : 'coral'}
                            icon={<MoreVertical size={15} strokeWidth={1.8} />}
                            onClick={() => setIsMoreMenuOpen(v => !v)}
                            title="更多功能"
                            ariaLabel="更多功能"
                            className={!hasApiKey ? 'animate-pulse' : ''}
                        >
                            <span className="hidden xl:inline">更多</span>
                        </Btn>

                        {isMoreMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsMoreMenuOpen(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 bg-white b-ink sh-card r-card py-2 w-56 z-50">
                                    {/* 只在 md~lg 渲染：lg+ 已有對應的主列按鈕 */}
                                    <div className="lg:hidden">
                                        {moreMenuTabletOnlyItems.map((item) => (
                                            <button
                                                key={item.label}
                                                onClick={() => {
                                                    item.onClick?.();
                                                    setIsMoreMenuOpen(false);
                                                }}
                                                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--paper-2)] transition-colors text-left btn-press"
                                            >
                                                <span
                                                    className="w-7 h-7 r-btn b-ink flex items-center justify-center shrink-0"
                                                    style={{ background: `var(--${item.dot}-soft)` }}
                                                >
                                                    <item.Icon size={14} strokeWidth={1.8} />
                                                </span>
                                                <span className="text-[13px] font-bold text-[var(--ink)]">{item.label}</span>
                                            </button>
                                        ))}
                                        <div className="my-1.5 mx-3 border-t border-dashed border-[var(--line-soft)]" />
                                    </div>

                                    {/* 所有尺寸都渲染（lg+ 上方 tabletOnly 區整塊隱藏，這裡仍可見） */}
                                    {moreMenuAlwaysItems.map((item) => (
                                        <button
                                            key={item.label}
                                            onClick={() => {
                                                item.onClick?.();
                                                setIsMoreMenuOpen(false);
                                            }}
                                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--paper-2)] transition-colors text-left btn-press"
                                        >
                                            <span
                                                className="w-7 h-7 r-btn b-ink flex items-center justify-center shrink-0"
                                                style={{ background: `var(--${item.dot}-soft)` }}
                                            >
                                                <item.Icon size={14} strokeWidth={1.8} />
                                            </span>
                                            <span className="text-[13px] font-bold text-[var(--ink)]">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* 分隔線（md+） */}
                    <div className="w-px h-7 bg-[var(--line-soft)] mx-0.5 hidden md:block" />

                    {/* 成語庫 toggle（md+ 才顯示，< md 進 MobileTabBar） */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="hidden md:inline-flex b-ink sh-btn r-btn h-10 px-2.5 sm:px-3 items-center gap-1.5 text-[13px] font-bold btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                        style={{
                            background: isSidebarOpen ? 'var(--ink)' : 'var(--paper-2)',
                            color: isSidebarOpen ? 'var(--paper)' : 'var(--ink)',
                        }}
                        title={isSidebarOpen ? '收起成語庫' : '展開成語庫'}
                        aria-label={isSidebarOpen ? '收起成語庫' : '展開成語庫'}
                        aria-pressed={isSidebarOpen}
                    >
                        {isSidebarOpen ? <X size={15} strokeWidth={1.8} /> : <BookOpen size={15} strokeWidth={1.8} />}
                        <span className="hidden lg:inline">{isSidebarOpen ? '收起' : '成語庫'}</span>
                    </button>

                    {/* 使用者頭像 + dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsUserMenuOpen(v => !v)}
                            className="relative w-10 h-10 sm:w-11 sm:h-11 r-btn b-ink sh-btn flex items-center justify-center overflow-hidden btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                            style={{ background: 'var(--honey)' }}
                            title={currentUser?.displayName || currentUser?.email || '使用者選單'}
                            aria-label="使用者選單"
                            aria-haspopup="menu"
                            aria-expanded={isUserMenuOpen}
                        >
                            {currentUser?.photoURL ? (
                                <img
                                    src={currentUser.photoURL}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="font-black text-[15px] text-[var(--ink)]">{displayInitial}</span>
                            )}
                            {/* 在線小綠點 */}
                            <span
                                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[var(--ink)]"
                                style={{ background: 'var(--mint)' }}
                            />
                        </button>

                        {isUserMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsUserMenuOpen(false)}
                                />
                                <div
                                    role="menu"
                                    className="absolute right-0 top-full mt-2 bg-white b-ink sh-card r-card p-3 w-60 sm:w-64 z-50"
                                >
                                    {/* 使用者基本資訊 */}
                                    <div className="text-[13px] font-black text-[var(--ink)] truncate">
                                        {currentUser?.displayName || '使用者'}
                                    </div>
                                    <div className="text-[11px] text-[var(--ink-soft)] truncate font-mono mt-0.5">
                                        {currentUser?.email}
                                    </div>

                                    {/* 學校資訊 */}
                                    {currentUser?.schoolName && (
                                        <div className="mt-2 pt-2 border-t border-dashed border-[var(--line-soft)] text-[11px] flex items-center gap-1.5">
                                            <span>🏫</span>
                                            <span className="font-bold text-[var(--ink)]">{currentUser.schoolName}</span>
                                        </div>
                                    )}

                                    {/* 管理員角色標識 */}
                                    {isAdmin && (
                                        <div className="mt-2 pt-2 border-t border-dashed border-[var(--line-soft)] text-[11px] flex items-center gap-1.5">
                                            <Shield size={12} strokeWidth={1.8} style={{ color: 'var(--coral)' }} />
                                            <span className="font-bold" style={{ color: 'var(--coral)' }}>系統管理員</span>
                                        </div>
                                    )}

                                    {/* 班級資訊 */}
                                    {currentUser?.assignedClassNames && currentUser.assignedClassNames.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-dashed border-[var(--line-soft)] text-[11px] flex items-start gap-1.5">
                                            <School size={12} strokeWidth={1.8} className="mt-0.5 shrink-0" style={{ color: 'var(--sky)' }} />
                                            <span className="font-bold text-[var(--ink)]">
                                                {currentUser.assignedClassNames.join('、')}
                                            </span>
                                        </div>
                                    )}

                                    {/* 登出 */}
                                    <div className="mt-3">
                                        <Btn
                                            color="peach"
                                            icon={<LogOut size={14} strokeWidth={1.8} />}
                                            onClick={() => {
                                                setIsUserMenuOpen(false);
                                                onLogout?.();
                                            }}
                                            size="sm"
                                            className="w-full"
                                        >
                                            登出
                                        </Btn>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
};

export default Header;
