import React, { useMemo } from 'react';

/**
 * 學期報告 PDF 可列印主體
 *
 * 永遠 mount 在 body 直系子層（透過 portal），id="semester-report"
 * 螢幕上 display:none，print 時 @media print 規則把它變成唯一顯示的內容。
 *
 * 結構：
 *   ┌─ 封面（cover-page）       獨佔一頁，紙膠帶 + 蜜蜂 + 學校 + 班級 + 學期
 *   ├─ 學生名單（roster-page）  獨佔一頁，全班姓名/座號/狀態 table
 *   ├─ 每生一頁（student-page） page-break-before: always
 *   └─ 統計頁（stats-page）     獨佔一頁，KPI + 熱門特質
 */
const SemesterReportPrintable = ({
    students = [],
    classNameText = '全部學生',
    schoolName = '',
    teacherName = '',
    term = '',
    options = {},
}) => {
    const today = useMemo(
        () => new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
        []
    );

    const stats = useMemo(() => {
        const isValidComment = (c) => !!c?.trim() && !c.trim().startsWith('❌');
        const valid = students.filter(s => isValidComment(s.comment));
        const lens = valid.map(s => s.comment.length);
        const total = students.length;
        const withComment = valid.length;
        const avgLength = lens.length > 0 ? Math.round(lens.reduce((a, b) => a + b, 0) / lens.length) : 0;
        const maxLength = lens.length > 0 ? Math.max(...lens) : 0;
        const minLength = lens.length > 0 ? Math.min(...lens) : 0;

        // 熱門特質
        const tagCounts = {};
        students.forEach(s => {
            (s.selectedTags || []).forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });
        const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 12);

        return { total, withComment, avgLength, maxLength, minLength, topTags };
    }, [students]);

    const includeTraits = options.includeTraits !== false;
    const includeRoster = options.includeRoster !== false;
    const includeStats = options.includeStats !== false;
    const includeSignature = options.includeSignature !== false;
    const onlyWithComments = options.onlyWithComments === true;

    const renderStudents = onlyWithComments
        ? students.filter(s => s.comment?.trim() && !s.comment.trim().startsWith('❌'))
        : students;

    return (
        <div id="semester-report" style={{ display: 'none' }} aria-hidden="true">
            {/* ── 封面 ─────────────────────────────────────────── */}
            <section className="sr-page sr-cover-page">
                {/* 紙膠帶裝飾 */}
                <div className="sr-tape sr-tape-tl" />
                <div className="sr-tape sr-tape-tr" />

                <div className="sr-cover-content">
                    {schoolName && <div className="sr-cover-school">{schoolName}</div>}

                    <div className="sr-cover-bee" aria-hidden="true">🐝</div>

                    <h1 className="sr-cover-title">學期評語報告</h1>

                    <div className="sr-cover-divider" />

                    {term && <div className="sr-cover-term">{term}</div>}
                    <div className="sr-cover-class">{classNameText}</div>

                    <div className="sr-cover-meta">
                        {teacherName && (
                            <div className="sr-cover-teacher">
                                <span className="sr-cover-label">導師</span>
                                <span className="sr-cover-value">{teacherName}</span>
                            </div>
                        )}
                        <div className="sr-cover-date">
                            <span className="sr-cover-label">產出日期</span>
                            <span className="sr-cover-value">{today}</span>
                        </div>
                        <div className="sr-cover-count">
                            <span className="sr-cover-label">學生人數</span>
                            <span className="sr-cover-value">{stats.total} 位</span>
                        </div>
                    </div>
                </div>

                <div className="sr-cover-footer">
                    由 <strong>點石成金蜂</strong> 自動產出
                </div>
            </section>

            {/* ── 學生名單頁 ────────────────────────────────────── */}
            {includeRoster && students.length > 0 && (
                <section className="sr-page sr-roster-page">
                    <header className="sr-page-header">
                        <span className="sr-section-eyebrow">Roster</span>
                        <h2 className="sr-page-title">學生名單</h2>
                        <span className="sr-page-meta">{classNameText} · 共 {students.length} 人</span>
                    </header>

                    <table className="sr-roster-table">
                        <thead>
                            <tr>
                                <th className="sr-col-num">座號</th>
                                <th className="sr-col-name">姓名</th>
                                <th className="sr-col-status">評語狀態</th>
                                <th className="sr-col-tags">特質</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((s, idx) => {
                                const hasComment = s.comment?.trim() && !s.comment.trim().startsWith('❌');
                                const hasError = s.comment?.trim()?.startsWith('❌');
                                return (
                                    <tr key={s.id}>
                                        <td className="sr-col-num">{s.number || idx + 1}</td>
                                        <td className="sr-col-name">{s.name}</td>
                                        <td className="sr-col-status">
                                            {hasComment ? '✓ 已撰寫' : hasError ? '✗ 失敗' : '— 未撰寫'}
                                        </td>
                                        <td className="sr-col-tags">
                                            {(s.selectedTags || []).slice(0, 4).join('、')}
                                            {(s.selectedTags?.length || 0) > 4 && '…'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </section>
            )}

            {/* ── 每位學生一頁 ─────────────────────────────────── */}
            {renderStudents.map((s, idx) => (
                <section
                    key={s.id || `student-${idx}`}
                    className="sr-page sr-student-page"
                >
                    <header className="sr-page-header">
                        <span className="sr-section-eyebrow">Student {idx + 1} / {renderStudents.length}</span>
                        <h2 className="sr-student-name">
                            {s.number && <span className="sr-student-number">{s.number}</span>}
                            {s.name}
                        </h2>
                        <span className="sr-page-meta">{classNameText}{schoolName ? ` · ${schoolName}` : ''}</span>
                    </header>

                    {/* 特質 */}
                    {includeTraits && (s.selectedTags?.length > 0 || s.manualTraits) && (
                        <div className="sr-student-traits sr-pdf-avoid">
                            <h3 className="sr-h3">特質印象</h3>
                            <div className="sr-traits-chips">
                                {(s.selectedTags || []).map((tag, i) => (
                                    <span key={`tag-${i}`} className="sr-chip">{tag}</span>
                                ))}
                                {s.manualTraits && (
                                    <span className="sr-chip sr-chip-manual">{s.manualTraits}</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 評語 */}
                    <div className="sr-student-comment sr-pdf-avoid">
                        <h3 className="sr-h3">學期評語</h3>
                        <div className="sr-comment-body">
                            {s.comment?.trim() && !s.comment.trim().startsWith('❌')
                                ? s.comment
                                : <span className="sr-empty">（尚未撰寫評語）</span>}
                        </div>
                        {s.comment?.trim() && !s.comment.trim().startsWith('❌') && (
                            <div className="sr-comment-stats">
                                共 {s.comment.length} 字
                            </div>
                        )}
                    </div>

                    {/* 簽名 / 印章區 */}
                    {includeSignature && (
                        <footer className="sr-student-footer">
                            <div className="sr-sig-block">
                                <span className="sr-sig-label">導師簽名</span>
                                <div className="sr-sig-line">{teacherName}</div>
                            </div>
                            <div className="sr-stamp-box" aria-label="印章位置">
                                <span>印</span>
                            </div>
                        </footer>
                    )}
                </section>
            ))}

            {/* ── 統計頁 ────────────────────────────────────────── */}
            {includeStats && (
                <section className="sr-page sr-stats-page">
                    <header className="sr-page-header">
                        <span className="sr-section-eyebrow">Class Overview</span>
                        <h2 className="sr-page-title">班級整體分析</h2>
                        <span className="sr-page-meta">{classNameText} · {today}</span>
                    </header>

                    {/* KPI 列 */}
                    <div className="sr-stats-kpis sr-pdf-avoid">
                        <div className="sr-kpi">
                            <span className="sr-kpi-label">學生人數</span>
                            <strong className="sr-kpi-value">{stats.total}</strong>
                        </div>
                        <div className="sr-kpi">
                            <span className="sr-kpi-label">已撰寫評語</span>
                            <strong className="sr-kpi-value">{stats.withComment} / {stats.total}</strong>
                        </div>
                        <div className="sr-kpi">
                            <span className="sr-kpi-label">完成率</span>
                            <strong className="sr-kpi-value">
                                {stats.total > 0 ? Math.round(stats.withComment / stats.total * 100) : 0}%
                            </strong>
                        </div>
                        <div className="sr-kpi">
                            <span className="sr-kpi-label">平均字數</span>
                            <strong className="sr-kpi-value">{stats.avgLength}</strong>
                        </div>
                        <div className="sr-kpi">
                            <span className="sr-kpi-label">最長</span>
                            <strong className="sr-kpi-value">{stats.maxLength}</strong>
                        </div>
                        <div className="sr-kpi">
                            <span className="sr-kpi-label">最短</span>
                            <strong className="sr-kpi-value">{stats.minLength}</strong>
                        </div>
                    </div>

                    {/* 熱門特質 */}
                    {stats.topTags.length > 0 && (
                        <div className="sr-pdf-avoid">
                            <h3 className="sr-h3">熱門特質 TOP {stats.topTags.length}</h3>
                            <div className="sr-tag-cloud">
                                {stats.topTags.map(([tag, count], i) => (
                                    <span key={tag} className="sr-tag-item">
                                        {i < 3 && <span className="sr-tag-medal">{['🥇', '🥈', '🥉'][i]}</span>}
                                        <span>{tag}</span>
                                        <span className="sr-tag-count">×{count}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 結尾 */}
                    <footer className="sr-stats-footer">
                        <div className="sr-footer-line" />
                        <p>本報告由 <strong>點石成金蜂🐝</strong> 自動產出</p>
                        <p className="sr-footer-meta">
                            {schoolName && `${schoolName} · `}
                            {classNameText}
                            {teacherName && ` · 導師 ${teacherName}`}
                            {` · ${today}`}
                        </p>
                    </footer>
                </section>
            )}
        </div>
    );
};

export default SemesterReportPrintable;
