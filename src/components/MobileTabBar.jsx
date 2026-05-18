import React, { useState, useEffect } from 'react';
import {
    List, Heart, BarChart3, BookOpen, MoreHorizontal,
    Shield, FileSpreadsheet, Printer, Settings, School, X, Activity,
} from 'lucide-react';

/**
 * 行動裝置底部 Tab Bar — 僅在 < md (768px) 顯示
 *
 * 5 個主 tab：學生 / 範本 / 統計 / 成語 / 更多
 * 「更多」展開 sub menu 顯示 班級 / Excel / 列印 / API（+ admin 才有的 管理員）
 *
 * 把桌面 Header 上的 6 個動作按鈕 + 成語庫 toggle 全部搬到這裡。
 */
const MobileTabBar = ({
    isSidebarOpen,
    setIsSidebarOpen,
    onOpenTemplates,
    onOpenDashboard,
    onOpenUsageDashboard,
    onOpenClasses,
    onOpenImportExport,
    onOpenPrint,
    onOpenSettings,
    onOpenAdmin,
    isAdmin,
    hasApiKey,
    templateCount = 0,
    pendingCount = 0,
}) => {
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    // 關閉「更多」當 sidebar 被打開（避免兩個 overlay 疊起來）
    useEffect(() => {
        if (isSidebarOpen) setIsMoreOpen(false);
    }, [isSidebarOpen]);

    const closeAll = () => setIsMoreOpen(false);

    const handleStudents = () => {
        closeAll();
        if (isSidebarOpen) setIsSidebarOpen(false);
        // scroll to top（讓學生 tab 視覺有反饋）
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleTemplates = () => {
        closeAll();
        onOpenTemplates?.();
    };

    const handleDashboard = () => {
        closeAll();
        onOpenDashboard?.();
    };

    const handleIdioms = () => {
        closeAll();
        setIsSidebarOpen(!isSidebarOpen);
    };

    // sub menu items
    const moreItems = [
        { key: 'class', Icon: School, label: '班級管理', onClick: onOpenClasses, color: 'lav' },
        { key: 'excel', Icon: FileSpreadsheet, label: 'Excel 匯入/匯出', onClick: onOpenImportExport, color: 'sky' },
        { key: 'print', Icon: Printer, label: '列印與 PDF', onClick: onOpenPrint, color: 'peach' },
        { key: 'usage', Icon: Activity, label: '使用量儀表板', onClick: onOpenUsageDashboard, color: 'sky' },
        { key: 'api', Icon: Settings, label: hasApiKey ? 'API 設定 ✓' : 'API 設定 ⚠️', onClick: onOpenSettings, color: hasApiKey ? 'honey' : 'coral' },
        ...(isAdmin ? [{ key: 'admin', Icon: Shield, label: '管理員面板', onClick: onOpenAdmin, color: 'coral', badge: pendingCount }] : []),
    ];

    return (
        <>
            {/* sub menu backdrop + sheet */}
            {isMoreOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 md:hidden bg-[var(--ink)]/30 backdrop-blur-[2px]"
                        onClick={closeAll}
                        aria-hidden="true"
                    />
                    <div
                        className="fixed inset-x-0 bottom-0 z-50 md:hidden p-3 pb-3 bg-[var(--paper)] b-ink border-x-2 border-b-0 border-t-2 rounded-t-[24px] sh-card"
                        role="dialog"
                        aria-modal="true"
                        aria-label="更多功能"
                    >
                        {/* drag indicator */}
                        <div className="flex justify-center pt-1 pb-3" aria-hidden="true">
                            <div className="w-12 h-1.5 rounded-full bg-[var(--ink)]/20" />
                        </div>

                        {/* header */}
                        <div className="flex items-center justify-between mb-3 px-1">
                            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                                More Tools
                            </span>
                            <button
                                type="button"
                                onClick={closeAll}
                                className="w-8 h-8 b-ink sh-sm r-btn bg-white inline-flex items-center justify-center btn-press"
                                aria-label="關閉"
                            >
                                <X size={14} strokeWidth={2.2} />
                            </button>
                        </div>

                        {/* sub items */}
                        <div className="space-y-2">
                            {moreItems.map(item => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => {
                                        closeAll();
                                        item.onClick?.();
                                    }}
                                    className="w-full b-ink sh-sm r-card bg-white p-3 flex items-center gap-3 btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                                >
                                    <span
                                        className="w-9 h-9 b-ink r-btn flex items-center justify-center shrink-0"
                                        style={{ background: `var(--${item.color}-soft)` }}
                                    >
                                        <item.Icon size={16} strokeWidth={1.8} />
                                    </span>
                                    <span className="font-bold text-[13.5px] text-[var(--ink)] flex-1 text-left">
                                        {item.label}
                                    </span>
                                    {item.badge > 0 && (
                                        <span
                                            className="min-w-[20px] h-[20px] px-1 b-ink rounded-full text-[10px] font-mono font-bold flex items-center justify-center"
                                            style={{ background: 'var(--coral)' }}
                                        >
                                            {item.badge > 99 ? '99+' : item.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* spacer for safe area */}
                        <div className="h-[env(safe-area-inset-bottom)]" />
                    </div>
                </>
            )}

            {/* main tab bar */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-30 md:hidden px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
                aria-label="主要功能列"
            >
                <div className="max-w-[480px] mx-auto bg-white b-ink sh-card r-card flex items-center justify-around p-1.5">
                    <TabButton
                        Icon={List}
                        label="學生"
                        active={!isMoreOpen && !isSidebarOpen}
                        onClick={handleStudents}
                    />
                    <TabButton
                        Icon={Heart}
                        label="範本"
                        badge={templateCount}
                        onClick={handleTemplates}
                    />
                    <TabButton
                        Icon={BarChart3}
                        label="統計"
                        onClick={handleDashboard}
                    />
                    <TabButton
                        Icon={BookOpen}
                        label="成語"
                        active={isSidebarOpen}
                        onClick={handleIdioms}
                    />
                    <TabButton
                        Icon={MoreHorizontal}
                        label="更多"
                        active={isMoreOpen}
                        badge={(isAdmin && pendingCount > 0) ? pendingCount : (!hasApiKey ? '!' : 0)}
                        pulse={!hasApiKey}
                        onClick={() => setIsMoreOpen(v => !v)}
                    />
                </div>
            </nav>
        </>
    );
};

const TabButton = ({ Icon, label, active, badge, pulse, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={label}
        className={[
            'relative flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-md btn-press',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft',
            pulse ? 'animate-pulse' : '',
        ].filter(Boolean).join(' ')}
        style={{
            background: active ? 'var(--honey)' : 'transparent',
            color: 'var(--ink)',
        }}
    >
        <Icon size={16} strokeWidth={1.8} />
        <span className="text-[10px] font-bold">{label}</span>
        {badge && badge !== 0 && (
            <span
                className="absolute -top-1 -right-0.5 min-w-[16px] h-[16px] px-1 b-ink rounded-full text-[9px] font-mono font-bold flex items-center justify-center"
                style={{ background: 'var(--coral)', color: 'white' }}
            >
                {typeof badge === 'string' ? badge : (badge > 9 ? '9+' : badge)}
            </span>
        )}
    </button>
);

export default MobileTabBar;
