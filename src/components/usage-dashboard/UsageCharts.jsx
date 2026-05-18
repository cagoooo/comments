import React from 'react';
import {
    ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
    PieChart, Pie, Cell,
    BarChart, Bar, LabelList,
} from 'recharts';

/**
 * 圖表元件群 — recharts 包在這檔，由 UsageDashboardModal lazy load。
 *
 * 主 bundle 不會包到 recharts（~30 KB gzip），只有打開「使用量儀表板」才下載。
 *
 * 顏色全部用設計 token（透過 getComputedStyle 取 CSS 變數），保證跟整體蜜糖紙感一致。
 */

// 取 CSS 變數（recharts 走 inline color，不吃 css var 直接寫）
const cssVar = (name, fallback) => {
    if (typeof window === 'undefined') return fallback;
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
};

// 簡短日期 label（MM/DD）
const shortDate = (iso) => {
    const [, m, d] = iso.split('-');
    return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
};

// 自訂 Tooltip — 沿用紙感設計
const PaperTooltip = ({ active, payload, label, isDate = false }) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div
            className="b-ink r-btn sh-btn px-3 py-2 text-[11px]"
            style={{ background: 'var(--paper)', fontFamily: 'var(--font-sans)' }}
        >
            <div className="font-black text-[12px] text-[var(--ink)] mb-0.5">
                {isDate ? shortDate(label) : label}
            </div>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2 font-mono">
                    <span
                        className="w-2 h-2 r-btn"
                        style={{ background: p.color, border: '1px solid var(--ink)' }}
                    />
                    <span className="text-[var(--ink-soft)]">{p.name}</span>
                    <span className="font-bold text-[var(--ink)] ml-auto">{p.value}</span>
                </div>
            ))}
        </div>
    );
};

/**
 * 折線圖：每日呼叫次數
 */
const LineDaily = ({ data }) => {
    const honey = cssVar('--honey', '#F4B826');
    const ink = cssVar('--ink', '#1F1B16');
    const inkSoft = cssVar('--ink-soft', '#6B6258');
    const lineSoft = cssVar('--line-soft', 'rgba(31,27,22,0.10)');

    return (
        <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke={lineSoft} />
                    <XAxis
                        dataKey="date"
                        tickFormatter={shortDate}
                        tick={{ fontSize: 10, fill: inkSoft, fontFamily: 'JetBrains Mono, monospace' }}
                        stroke={ink}
                        strokeWidth={1.5}
                        interval={Math.max(0, Math.floor(data.length / 8))}
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: inkSoft, fontFamily: 'JetBrains Mono, monospace' }}
                        stroke={ink}
                        strokeWidth={1.5}
                        allowDecimals={false}
                        width={36}
                    />
                    <Tooltip content={<PaperTooltip isDate />} cursor={{ stroke: ink, strokeWidth: 1, strokeDasharray: '3 3' }} />
                    <Line
                        type="monotone"
                        dataKey="apiCalls"
                        name="呼叫"
                        stroke={honey}
                        strokeWidth={2.5}
                        dot={{ stroke: ink, strokeWidth: 1.5, r: 3, fill: honey }}
                        activeDot={{ stroke: ink, strokeWidth: 2, r: 5, fill: honey }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

/**
 * 圓餅圖：成功 / 失敗
 */
const PieSuccess = ({ success, failed }) => {
    const mint = cssVar('--mint', '#6FCB94');
    const coral = cssVar('--coral', '#FF6B5A');
    const ink = cssVar('--ink', '#1F1B16');

    const data = [
        { name: '成功', value: success, color: mint },
        { name: '失敗', value: failed, color: coral },
    ].filter(d => d.value > 0);

    if (data.length === 0) {
        return (
            <div className="h-40 flex items-center justify-center text-[11px] text-[var(--ink-soft)]">
                無資料
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: 160 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={60}
                        stroke={ink}
                        strokeWidth={1.5}
                        label={({ percent }) => `${Math.round(percent * 100)}%`}
                        labelLine={false}
                        fontSize={10}
                    >
                        {data.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<PaperTooltip />} />
                </PieChart>
            </ResponsiveContainer>

            {/* 圖例（手做，避免 recharts 預設不好客製） */}
            <div className="flex justify-center gap-3 mt-1 text-[10.5px] font-mono">
                {data.map(d => (
                    <div key={d.name} className="flex items-center gap-1">
                        <span
                            className="w-2 h-2 r-btn shrink-0"
                            style={{ background: d.color, border: '1px solid var(--ink)' }}
                        />
                        <span className="text-[var(--ink-soft)]">{d.name}</span>
                        <span className="font-bold text-[var(--ink)]">{d.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * 長條圖：各教師本月使用量（admin 視角）
 */
const BarTeachers = ({ teachers }) => {
    const sky = cssVar('--sky', '#76B7E6');
    const ink = cssVar('--ink', '#1F1B16');
    const inkSoft = cssVar('--ink-soft', '#6B6258');
    const lineSoft = cssVar('--line-soft', 'rgba(31,27,22,0.10)');

    const data = teachers.map(t => ({
        name: t.displayName.length > 6 ? `${t.displayName.slice(0, 6)}…` : t.displayName,
        fullName: t.displayName,
        calls: t.monthlyApiCalls,
        role: t.role,
    }));

    const height = Math.max(180, data.length * 28 + 24);

    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 4, right: 32, bottom: 4, left: 0 }}
                >
                    <CartesianGrid strokeDasharray="2 4" stroke={lineSoft} horizontal={false} />
                    <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: inkSoft, fontFamily: 'JetBrains Mono, monospace' }}
                        stroke={ink}
                        strokeWidth={1.5}
                        allowDecimals={false}
                    />
                    <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 11, fill: ink, fontWeight: 700 }}
                        stroke={ink}
                        strokeWidth={1.5}
                        width={70}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const p = payload[0].payload;
                            return (
                                <div className="b-ink r-btn sh-btn px-3 py-2 text-[11px]" style={{ background: 'var(--paper)' }}>
                                    <div className="font-black text-[var(--ink)]">{p.fullName}</div>
                                    {p.role === 'admin' && (
                                        <div className="text-[10px] text-[var(--coral)] font-bold uppercase">Admin</div>
                                    )}
                                    <div className="font-mono mt-1">
                                        <span className="text-[var(--ink-soft)]">本月呼叫</span>
                                        <span className="font-bold ml-2 text-[var(--ink)]">{p.calls}</span>
                                    </div>
                                </div>
                            );
                        }}
                        cursor={{ fill: 'rgba(31,27,22,0.04)' }}
                    />
                    <Bar dataKey="calls" fill={sky} stroke={ink} strokeWidth={1.5} radius={[0, 4, 4, 0]}>
                        <LabelList
                            dataKey="calls"
                            position="right"
                            fill={ink}
                            style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const UsageCharts = { LineDaily, PieSuccess, BarTeachers };
export default UsageCharts;
