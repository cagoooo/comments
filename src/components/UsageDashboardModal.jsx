import React, { useEffect, useMemo, useState } from 'react';
import { Activity, TrendingUp, PieChart as PieIcon, Users, RefreshCw, AlertCircle, Gauge } from 'lucide-react';
import ModalShell from './ui/ModalShell';
import { Card, KPI, Btn, Chip } from './atoms';
import { fetchUsageQuota, fetchUsageHistory, fetchAdminUsage } from '../utils/cloudFunctionsApi';

/**
 * 使用量儀表板 — 顯示 Cloud Functions 後端記錄的 API 呼叫量。
 *
 * 三個區塊：
 *   1. 今日配額 Gauge + KPI 列
 *   2. 個人 30 天折線圖 + 成功率圓餅圖
 *   3. 管理員（admin only）本月全校教師長條圖
 *
 * 資料源：
 *   - GET /usage              今日 / 本月配額
 *   - GET /usage/history?days=30  個人 30 天歷史
 *   - GET /usage/admin        管理員視角（全校教師本月使用量）
 */
const UsageDashboardModal = ({ isOpen, onClose, isAdmin }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [quota, setQuota] = useState(null);
    const [history, setHistory] = useState(null);
    const [adminData, setAdminData] = useState(null);
    const [lastFetched, setLastFetched] = useState(null);
    const [charts, setCharts] = useState(null); // 動態載入的 recharts 元件群

    // 開啟時動態載入圖表 module（recharts ~30 KB gzip 不進主 bundle）
    useEffect(() => {
        if (!isOpen || charts) return;
        let cancelled = false;
        import('./usage-dashboard/UsageCharts').then((mod) => {
            if (!cancelled) setCharts(mod.default);
        });
        return () => { cancelled = true; };
    }, [isOpen, charts]);

    const loadAll = async () => {
        setLoading(true);
        setError(null);
        try {
            const tasks = [fetchUsageQuota(), fetchUsageHistory(30)];
            if (isAdmin) tasks.push(fetchAdminUsage());

            const results = await Promise.allSettled(tasks);

            const [quotaRes, historyRes, adminRes] = results;

            if (quotaRes.status === 'fulfilled') setQuota(quotaRes.value);
            else throw new Error(quotaRes.reason?.message || '取得配額失敗');

            if (historyRes.status === 'fulfilled') setHistory(historyRes.value);
            else throw new Error(historyRes.reason?.message || '取得歷史失敗');

            if (isAdmin && adminRes) {
                if (adminRes.status === 'fulfilled') setAdminData(adminRes.value);
                else console.warn('取得管理員資料失敗:', adminRes.reason);
            }

            setLastFetched(new Date());
        } catch (err) {
            setError(err.message || '載入失敗');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, isAdmin]);

    // 衍生統計
    const stats = useMemo(() => {
        if (!quota || !history) return null;

        const dailyRemaining = quota.daily.remaining;
        const dailyUsedPct = quota.daily.limit > 0
            ? Math.round((quota.daily.used / quota.daily.limit) * 100)
            : 0;

        const successRate = history.totals.apiCalls > 0
            ? Math.round((history.totals.successCount / history.totals.apiCalls) * 100)
            : 0;

        const activeDays = history.history.filter(d => d.apiCalls > 0).length;
        const avgPerActiveDay = activeDays > 0
            ? Math.round(history.totals.apiCalls / activeDays)
            : 0;

        return {
            dailyRemaining,
            dailyUsedPct,
            successRate,
            activeDays,
            avgPerActiveDay,
        };
    }, [quota, history]);

    if (!isOpen) return null;

    return (
        <ModalShell
            open={isOpen}
            onClose={onClose}
            width={920}
            eyebrow="Usage Stats"
            tapeColor="sky"
            icon={<Activity size={18} strokeWidth={1.8} />}
            title="使用量儀表板"
            subtitle={
                <div className="flex items-center gap-2 flex-wrap">
                    <span>API 呼叫量、配額與成功率（過去 30 天）</span>
                    {lastFetched && (
                        <span className="text-[11px] font-mono text-[var(--ink-mute)]">
                            · 更新於 {lastFetched.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
            }
            footer={
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[var(--ink-soft)] hidden sm:inline">
                        資料來源：Cloud Functions · users/&#123;uid&#125;/usage/&#123;date&#125;
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                        <Btn
                            variant="outline"
                            size="sm"
                            icon={<RefreshCw size={13} strokeWidth={1.8} className={loading ? 'animate-spin' : ''} />}
                            onClick={loadAll}
                            disabled={loading}
                        >
                            重新整理
                        </Btn>
                        <Btn variant="outline" size="sm" onClick={onClose}>
                            關閉
                        </Btn>
                    </div>
                </div>
            }
        >
            <div className="px-5 sm:px-7 py-4 sm:py-5 space-y-4">

                {/* 錯誤狀態 */}
                {error && (
                    <Card className="p-4" style={{ background: 'var(--coral-soft)' }}>
                        <div className="flex items-start gap-3">
                            <AlertCircle size={18} strokeWidth={1.8} style={{ color: 'var(--coral)' }} className="mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <div className="font-black text-[13px] text-[var(--ink)]">載入失敗</div>
                                <div className="text-[12px] text-[var(--ink-soft)] mt-0.5 break-all">{error}</div>
                                <div className="text-[11px] text-[var(--ink-mute)] mt-1.5">
                                    可能原因：未登入、Cloud Functions 部署中、或網路問題。可按右下「重新整理」再試。
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* 初次載入骨架 */}
                {loading && !quota && (
                    <div className="space-y-4 py-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className="h-16 b-soft r-card bg-[var(--paper-2)] animate-pulse" />
                            ))}
                        </div>
                        <div className="h-48 b-soft r-card bg-[var(--paper-2)] animate-pulse" />
                    </div>
                )}

                {/* === 區塊 1：今日配額 + KPI 列 === */}
                {quota && stats && (
                    <Card className="p-4 sm:p-5">
                        <h4 className="font-black text-[14px] flex items-center gap-2 mb-3">
                            <Gauge size={16} strokeWidth={1.8} style={{ color: 'var(--honey)' }} />
                            配額狀況
                            {quota.isAdmin && (
                                <Chip color="coral" size="sm" soft>管理員</Chip>
                            )}
                        </h4>

                        {/* 今日進度條 */}
                        <div
                            className="relative h-8 b-ink rounded-full overflow-hidden mb-3"
                            style={{ background: 'var(--paper-2)' }}
                            role="progressbar"
                            aria-valuenow={stats.dailyUsedPct}
                            aria-valuemin="0"
                            aria-valuemax="100"
                            aria-label={`今日已用 ${stats.dailyUsedPct}%`}
                        >
                            <div
                                className="absolute inset-y-0 left-0 transition-all duration-500"
                                style={{
                                    width: `${Math.min(stats.dailyUsedPct, 100)}%`,
                                    background: stats.dailyUsedPct >= 90
                                        ? 'var(--coral)'
                                        : stats.dailyUsedPct >= 70
                                            ? 'var(--peach)'
                                            : 'var(--mint)',
                                }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center font-black font-mono text-[13px] text-[var(--ink)] gap-1">
                                <span>{quota.daily.used}</span>
                                <span className="text-[var(--ink-soft)]">/</span>
                                <span>{quota.daily.limit}</span>
                                <span className="text-[var(--ink-soft)] ml-1.5">({stats.dailyUsedPct}%)</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                            <KPI
                                label="今日已用"
                                value={quota.daily.used}
                                accent={stats.dailyUsedPct >= 90 ? 'coral' : 'honey'}
                                sub={`上限 ${quota.daily.limit}`}
                            />
                            <KPI
                                label="今日剩餘"
                                value={stats.dailyRemaining}
                                accent="mint"
                                sub={`還有 ${stats.dailyRemaining} 次`}
                            />
                            <KPI
                                label="本月已用"
                                value={quota.monthly.used}
                                accent="sky"
                                sub={`上限 ${quota.monthly.limit}`}
                            />
                            <KPI
                                label="本月剩餘"
                                value={quota.monthly.remaining}
                                accent="lav"
                                sub={`還有 ${quota.monthly.remaining} 次`}
                            />
                        </div>
                    </Card>
                )}

                {/* === 區塊 2：個人 30 天圖表 === */}
                {history && stats && (
                    <Card className="p-4 sm:p-5">
                        <h4 className="font-black text-[14px] flex items-center gap-2 mb-3">
                            <TrendingUp size={16} strokeWidth={1.8} style={{ color: 'var(--mint)' }} />
                            過去 30 天趨勢
                            <span className="text-[11px] font-mono text-[var(--ink-soft)] ml-1">
                                · 共 {history.totals.apiCalls} 次呼叫
                            </span>
                        </h4>

                        {history.totals.apiCalls > 0 ? (
                            <>
                                {/* KPI 條 */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                                    <KPI label="總呼叫" value={history.totals.apiCalls} accent="honey" />
                                    <KPI label="成功" value={history.totals.successCount} accent="mint" />
                                    <KPI label="失敗" value={history.totals.failedCount} accent="coral" />
                                    <KPI label="成功率" value={`${stats.successRate}%`} accent="sky" />
                                </div>

                                <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-start">
                                    {/* 折線圖 */}
                                    <div className="b-soft r-card p-3 bg-[var(--paper-2)] min-w-0">
                                        <div className="text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-2">
                                            每日呼叫次數
                                        </div>
                                        {charts ? (
                                            <charts.LineDaily data={history.history} />
                                        ) : (
                                            <div className="h-48 animate-pulse bg-white/40 r-btn" />
                                        )}
                                    </div>

                                    {/* 圓餅圖 */}
                                    <div className="b-soft r-card p-3 bg-[var(--paper-2)] lg:w-[200px]">
                                        <div className="text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <PieIcon size={11} strokeWidth={1.8} />
                                            成功 / 失敗
                                        </div>
                                        {charts ? (
                                            <charts.PieSuccess
                                                success={history.totals.successCount}
                                                failed={history.totals.failedCount}
                                            />
                                        ) : (
                                            <div className="h-40 animate-pulse bg-white/40 r-btn" />
                                        )}
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2 text-[11.5px]">
                                    <Chip color="mint" soft size="sm">
                                        活躍 {stats.activeDays} 天
                                    </Chip>
                                    <Chip color="honey" soft size="sm">
                                        活躍日平均 {stats.avgPerActiveDay} 次
                                    </Chip>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-[var(--ink-soft)]">
                                <div className="text-3xl mb-2" aria-hidden="true">📈</div>
                                <div className="font-bold text-[13px]">過去 30 天還沒有 API 呼叫記錄</div>
                                <div className="text-[11.5px] mt-1 text-[var(--ink-mute)]">
                                    試著生成幾個學生評語後再回來看
                                </div>
                            </div>
                        )}
                    </Card>
                )}

                {/* === 區塊 3：管理員視角（全校教師本月排行）=== */}
                {isAdmin && adminData && (
                    <Card className="p-4 sm:p-5" style={{ background: 'var(--coral-soft)' }}>
                        <h4 className="font-black text-[14px] flex items-center gap-2 mb-3">
                            <Users size={16} strokeWidth={1.8} style={{ color: 'var(--coral)' }} />
                            管理員視角 · 本月教師排行
                            <span className="text-[11px] font-mono text-[var(--ink-soft)] ml-1">
                                · {adminData.yearMonth}
                            </span>
                        </h4>

                        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                            <KPI label="全校呼叫" value={adminData.totals.apiCalls} accent="honey" />
                            <KPI label="活躍教師" value={adminData.activeTeacherCount} accent="mint" sub={`/ ${adminData.teachers.length} 位`} />
                            <KPI
                                label="平均"
                                value={
                                    adminData.activeTeacherCount > 0
                                        ? Math.round(adminData.totals.apiCalls / adminData.activeTeacherCount)
                                        : 0
                                }
                                accent="sky"
                                sub="次/活躍教師"
                            />
                        </div>

                        {adminData.teachers.length > 0 && adminData.totals.apiCalls > 0 ? (
                            <div className="b-soft r-card p-3 bg-white/60">
                                <div className="text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-2">
                                    各教師本月使用量
                                </div>
                                {charts ? (
                                    <charts.BarTeachers teachers={adminData.teachers.slice(0, 12)} />
                                ) : (
                                    <div className="h-56 animate-pulse bg-[var(--paper-2)] r-btn" />
                                )}
                            </div>
                        ) : (
                            <div className="text-[12px] text-[var(--ink-soft)] py-3">
                                本月還沒有教師使用 API。
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </ModalShell>
    );
};

export default UsageDashboardModal;
