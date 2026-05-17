import React, { useMemo } from 'react';
import { BarChart3, FileText, TrendingUp, Award, Clock, PartyPopper } from 'lucide-react';
import ModalShell from './ui/ModalShell';
import { Card, KPI, Chip, Btn } from './atoms';

/**
 * 班級統計儀表板
 *
 * Props 保留：isOpen / onClose / students / currentClassName
 * 純前端 stats 計算（不動 Firebase）。重構：每張卡片改 Card + KPI / chip。
 */
const DashboardModal = ({
    isOpen,
    onClose,
    students,
    currentClassName = '全部學生',
}) => {
    const stats = useMemo(() => {
        const total = students.length;

        const isValidComment = (c) => !!c?.trim() && !c.trim().startsWith('❌');
        const isErrorComment = (c) => !!c?.trim()?.startsWith('❌');

        const withComment = students.filter(s => isValidComment(s.comment)).length;
        const withError = students.filter(s => isErrorComment(s.comment)).length;
        const completionRate = total > 0 ? Math.round((withComment / total) * 100) : 0;

        const commentLengths = students.filter(s => isValidComment(s.comment)).map(s => s.comment.length);
        const totalChars = commentLengths.reduce((a, b) => a + b, 0);
        const avgLength = commentLengths.length > 0 ? Math.round(totalChars / commentLengths.length) : 0;
        const maxLength = commentLengths.length > 0 ? Math.max(...commentLengths) : 0;
        const minLength = commentLengths.length > 0 ? Math.min(...commentLengths) : 0;

        const tagCounts = {};
        students.forEach(s => {
            (s.selectedTags || []).forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });
        const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const pending = students.filter(s => !isValidComment(s.comment));

        return {
            total, withComment, withError, completionRate,
            avgLength, maxLength, minLength, totalChars,
            topTags, pending,
        };
    }, [students]);

    if (!isOpen) return null;

    const TAG_COLORS = ['peach', 'mint', 'sky', 'lav', 'honey'];

    return (
        <ModalShell
            open={isOpen}
            onClose={onClose}
            width={760}
            eyebrow="Dashboard"
            tapeColor="mint"
            icon={<BarChart3 size={18} strokeWidth={1.8} />}
            title="班級統計儀表板"
            subtitle={
                <>
                    📚 <span className="font-bold text-[var(--ink)]">{currentClassName}</span> · 共 {stats.total} 人
                </>
            }
            footer={
                <div className="flex items-center justify-end">
                    <Btn variant="outline" size="sm" onClick={onClose}>
                        關閉
                    </Btn>
                </div>
            }
        >
            <div className="px-5 sm:px-7 py-4 sm:py-5 space-y-4">

                {/* 完成進度 */}
                <Card className="p-4 sm:p-5">
                    <h4 className="font-black text-[14px] flex items-center gap-2 mb-3">
                        <TrendingUp size={16} strokeWidth={1.8} style={{ color: 'var(--mint)' }} />
                        評語完成進度
                    </h4>

                    {/* 進度條 */}
                    <div
                        className="relative h-8 b-ink rounded-full overflow-hidden mb-3"
                        style={{ background: 'var(--paper-2)' }}
                        role="progressbar"
                        aria-valuenow={stats.completionRate}
                        aria-valuemin="0"
                        aria-valuemax="100"
                    >
                        <div
                            className="absolute inset-y-0 left-0 transition-all duration-500"
                            style={{
                                width: `${stats.completionRate}%`,
                                background: 'var(--mint)',
                            }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center font-black font-mono text-[14px]">
                            {stats.completionRate}%
                        </div>
                    </div>

                    {/* 4 個小 KPI */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">{/* < sm 仍 2 col 不橫滑（避免 modal 內 horizontal scroll 衝突） */}
                        <KPI label="已完成" value={stats.withComment} accent="mint" />
                        <KPI label="待撰寫" value={stats.total - stats.withComment - stats.withError} accent="peach" />
                        <KPI label="失敗" value={stats.withError} accent="coral" />
                        <KPI label="總人數" value={stats.total} accent="sky" />
                    </div>
                </Card>

                {/* 字數統計 */}
                <Card className="p-4 sm:p-5">
                    <h4 className="font-black text-[14px] flex items-center gap-2 mb-3">
                        <FileText size={16} strokeWidth={1.8} style={{ color: 'var(--sky)' }} />
                        字數統計
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">{/* < sm 仍 2 col 不橫滑（避免 modal 內 horizontal scroll 衝突） */}
                        <KPI label="平均字數" value={stats.avgLength} accent="honey" />
                        <KPI label="最多字數" value={stats.maxLength} accent="lav" />
                        <KPI label="最少字數" value={stats.minLength} accent="peach" />
                        <KPI label="總字數" value={stats.totalChars} accent="mint" />
                    </div>
                </Card>

                {/* 熱門特質 */}
                {stats.topTags.length > 0 && (
                    <Card className="p-4 sm:p-5">
                        <h4 className="font-black text-[14px] flex items-center gap-2 mb-3">
                            <Award size={16} strokeWidth={1.8} style={{ color: 'var(--honey)' }} />
                            熱門特質 TOP {stats.topTags.length}
                        </h4>

                        <div className="flex flex-wrap gap-1.5">
                            {stats.topTags.map(([tag, count], index) => {
                                const isMedal = index < 3;
                                const medal = ['🥇', '🥈', '🥉'][index];
                                return (
                                    <Chip
                                        key={tag}
                                        color={isMedal ? 'honey' : TAG_COLORS[index % TAG_COLORS.length]}
                                        soft={!isMedal}
                                        size="sm"
                                    >
                                        {isMedal && <span>{medal}</span>}
                                        {tag}
                                        <span className="font-mono text-[10.5px] text-[var(--ink-soft)] ml-0.5">×{count}</span>
                                    </Chip>
                                );
                            })}
                        </div>
                    </Card>
                )}

                {/* 未完成學生 */}
                {stats.pending.length > 0 && (
                    <Card className="p-4 sm:p-5" style={{ background: 'var(--coral-soft)' }}>
                        <h4 className="font-black text-[14px] flex items-center gap-2 mb-3" style={{ color: 'var(--ink)' }}>
                            <Clock size={16} strokeWidth={1.8} style={{ color: 'var(--coral)' }} />
                            待完成學生 ({stats.pending.length} 人)
                        </h4>

                        <div className="flex flex-wrap gap-1.5">
                            {stats.pending.slice(0, 20).map(student => (
                                <span
                                    key={student.id}
                                    className="px-2.5 h-7 rounded-full bg-white b-ink text-[12px] font-bold inline-flex items-center"
                                    style={{ color: 'var(--ink)' }}
                                >
                                    {student.number && <span className="text-[var(--ink-soft)] mr-1 font-mono">{student.number}</span>}
                                    {student.name}
                                </span>
                            ))}
                            {stats.pending.length > 20 && (
                                <span className="text-[11px] font-mono text-[var(--ink-soft)] self-center">
                                    …還有 {stats.pending.length - 20} 人
                                </span>
                            )}
                        </div>
                    </Card>
                )}

                {/* 全部完成提示 */}
                {stats.total > 0 && stats.completionRate === 100 && (
                    <Card className="p-6 text-center" style={{ background: 'var(--mint-soft)' }}>
                        <PartyPopper size={36} strokeWidth={1.5} className="mx-auto mb-2" style={{ color: 'var(--mint)' }} />
                        <h4 className="font-black text-[16px]" style={{ color: 'var(--ink)' }}>
                            恭喜！全部完成！
                        </h4>
                        <p className="text-[13px] mt-1 text-[var(--ink-soft)]">
                            已完成 {stats.total} 位學生的評語撰寫
                        </p>
                    </Card>
                )}

                {/* 空狀態 */}
                {stats.total === 0 && (
                    <div className="text-center py-12 text-[var(--ink-soft)]">
                        <div className="text-4xl mb-3" aria-hidden="true">📊</div>
                        <div className="font-bold text-[14px]">還沒有學生資料</div>
                        <div className="text-[12px] mt-1 text-[var(--ink-mute)]">
                            先加入學生後再回來看統計
                        </div>
                    </div>
                )}
            </div>
        </ModalShell>
    );
};

export default DashboardModal;
