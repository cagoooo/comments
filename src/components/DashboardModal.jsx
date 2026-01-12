import React, { useMemo } from 'react';
import { X, BarChart3, FileText, Users, TrendingUp, Award, CheckCircle, Clock } from 'lucide-react';

/**
 * 班級統計儀表板
 * 顯示評語完成進度、字數統計、風格分布等
 */
const DashboardModal = ({
    isOpen,
    onClose,
    students,
    currentClassName = '全部學生'
}) => {
    // 計算統計資料
    const stats = useMemo(() => {
        const total = students.length;

        // 判斷是否為有效評語（非空且非錯誤訊息）
        const isValidComment = (comment) => {
            if (!comment?.trim()) return false;
            if (comment.trim().startsWith('❌')) return false;
            return true;
        };

        // 判斷是否為錯誤訊息
        const isErrorComment = (comment) => {
            return comment?.trim()?.startsWith('❌') || false;
        };

        const withComment = students.filter(s => isValidComment(s.comment)).length;
        const withError = students.filter(s => isErrorComment(s.comment)).length;
        const completionRate = total > 0 ? Math.round((withComment / total) * 100) : 0;

        // 字數統計（只計算有效評語）
        const commentLengths = students
            .filter(s => isValidComment(s.comment))
            .map(s => s.comment.length);

        const totalChars = commentLengths.reduce((a, b) => a + b, 0);
        const avgLength = commentLengths.length > 0
            ? Math.round(totalChars / commentLengths.length)
            : 0;
        const maxLength = Math.max(0, ...commentLengths);
        const minLength = commentLengths.length > 0 ? Math.min(...commentLengths) : 0;

        // 特質標籤統計
        const tagCounts = {};
        students.forEach(s => {
            (s.selectedTags || []).forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        const topTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        // 未完成學生（無評語或錯誤訊息）
        const pending = students.filter(s => !isValidComment(s.comment));

        return {
            total,
            withComment,
            withError,
            completionRate,
            avgLength,
            maxLength,
            minLength,
            totalChars,
            topTags,
            pending
        };
    }, [students]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4">
            <div className="card-pop w-full max-w-3xl max-h-[90vh] flex flex-col animate-in bg-[#FFF9E6]">
                {/* Header */}
                <div className="p-3 sm:p-5 bg-gradient-to-r from-[#A29BFE] to-[#6C5CE7] border-b-3 border-[#2D3436] flex items-center justify-between">
                    <h3 className="font-black text-white flex items-center gap-2 text-lg sm:text-xl">
                        <BarChart3 size={24} />
                        班級統計儀表板
                    </h3>
                    <button onClick={onClose} className="btn-pop p-2 bg-white text-[#2D3436]">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {/* 班級名稱 */}
                    <div className="text-center">
                        <span className="inline-block px-4 py-1 bg-[#2D3436] text-white font-bold rounded-full text-sm">
                            📚 {currentClassName}
                        </span>
                    </div>

                    {/* 完成進度 */}
                    <div className="bg-white border-2 border-[#2D3436] rounded-lg p-4">
                        <h4 className="font-bold text-[#2D3436] mb-3 flex items-center gap-2">
                            <TrendingUp size={18} className="text-[#1DD1A1]" />
                            評語完成進度
                        </h4>

                        {/* 進度條 */}
                        <div className="relative h-8 bg-[#E8DCC8] border-2 border-[#2D3436] rounded-full overflow-hidden mb-3">
                            <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#1DD1A1] to-[#00B894] transition-all duration-500"
                                style={{ width: `${stats.completionRate}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center font-black text-[#2D3436]">
                                {stats.completionRate}%
                            </div>
                        </div>

                        {/* 數字統計 */}
                        <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="p-2 sm:p-3 bg-[#1DD1A1]/20 border-2 border-[#1DD1A1] rounded-lg">
                                <div className="text-xl sm:text-2xl font-black text-[#1DD1A1]">{stats.withComment}</div>
                                <div className="text-xs font-bold text-[#2D3436]">已完成</div>
                            </div>
                            <div className="p-2 sm:p-3 bg-[#FECA57]/20 border-2 border-[#FECA57] rounded-lg">
                                <div className="text-xl sm:text-2xl font-black text-[#F39C12]">{stats.total - stats.withComment - stats.withError}</div>
                                <div className="text-xs font-bold text-[#2D3436]">待撰寫</div>
                            </div>
                            <div className="p-2 sm:p-3 bg-[#FF6B6B]/20 border-2 border-[#FF6B6B] rounded-lg">
                                <div className="text-xl sm:text-2xl font-black text-[#FF6B6B]">{stats.withError}</div>
                                <div className="text-xs font-bold text-[#2D3436]">生成失敗</div>
                            </div>
                            <div className="p-2 sm:p-3 bg-[#54A0FF]/20 border-2 border-[#54A0FF] rounded-lg">
                                <div className="text-xl sm:text-2xl font-black text-[#54A0FF]">{stats.total}</div>
                                <div className="text-xs font-bold text-[#2D3436]">總人數</div>
                            </div>
                        </div>
                    </div>

                    {/* 字數統計 */}
                    <div className="bg-white border-2 border-[#2D3436] rounded-lg p-4">
                        <h4 className="font-bold text-[#2D3436] mb-3 flex items-center gap-2">
                            <FileText size={18} className="text-[#54A0FF]" />
                            字數統計
                        </h4>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div className="p-3 bg-[#FECA57]/30 border-2 border-[#FECA57] rounded-lg">
                                <div className="text-xl font-black text-[#F39C12]">{stats.avgLength}</div>
                                <div className="text-xs font-bold text-[#2D3436]">平均字數</div>
                            </div>
                            <div className="p-3 bg-[#A29BFE]/20 border-2 border-[#A29BFE] rounded-lg">
                                <div className="text-xl font-black text-[#6C5CE7]">{stats.maxLength}</div>
                                <div className="text-xs font-bold text-[#2D3436]">最多字數</div>
                            </div>
                            <div className="p-3 bg-[#FF6B9D]/20 border-2 border-[#FF6B9D] rounded-lg">
                                <div className="text-xl font-black text-[#FF6B9D]">{stats.minLength}</div>
                                <div className="text-xs font-bold text-[#2D3436]">最少字數</div>
                            </div>
                            <div className="p-3 bg-[#1DD1A1]/20 border-2 border-[#1DD1A1] rounded-lg">
                                <div className="text-xl font-black text-[#1DD1A1]">{stats.totalChars}</div>
                                <div className="text-xs font-bold text-[#2D3436]">總字數</div>
                            </div>
                        </div>
                    </div>

                    {/* 熱門特質 */}
                    {stats.topTags.length > 0 && (
                        <div className="bg-white border-2 border-[#2D3436] rounded-lg p-4">
                            <h4 className="font-bold text-[#2D3436] mb-3 flex items-center gap-2">
                                <Award size={18} className="text-[#FECA57]" />
                                熱門特質 TOP 10
                            </h4>

                            <div className="flex flex-wrap gap-2">
                                {stats.topTags.map(([tag, count], index) => (
                                    <span
                                        key={tag}
                                        className={`px-3 py-1 rounded-full text-sm font-bold border-2 border-[#2D3436]
                                            ${index === 0 ? 'bg-[#FECA57] text-[#2D3436]' :
                                                index === 1 ? 'bg-[#E8E8E8] text-[#2D3436]' :
                                                    index === 2 ? 'bg-[#DEB887] text-[#2D3436]' :
                                                        'bg-white text-[#636E72]'}`}
                                    >
                                        {index < 3 && ['🥇', '🥈', '🥉'][index]} {tag}
                                        <span className="ml-1 text-xs opacity-70">({count})</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 未完成學生 */}
                    {stats.pending.length > 0 && (
                        <div className="bg-[#FF6B6B]/10 border-2 border-[#FF6B6B] rounded-lg p-4">
                            <h4 className="font-bold text-[#FF6B6B] mb-3 flex items-center gap-2">
                                <Clock size={18} />
                                待完成學生 ({stats.pending.length}人)
                            </h4>

                            <div className="flex flex-wrap gap-2">
                                {stats.pending.slice(0, 20).map(student => (
                                    <span
                                        key={student.id}
                                        className="px-2 py-1 bg-white border border-[#FF6B6B] rounded text-sm text-[#FF6B6B]"
                                    >
                                        {student.number && `${student.number}號 `}{student.name}
                                    </span>
                                ))}
                                {stats.pending.length > 20 && (
                                    <span className="px-2 py-1 text-sm text-[#636E72]">
                                        ...還有 {stats.pending.length - 20} 人
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 全部完成提示 */}
                    {stats.completionRate === 100 && (
                        <div className="bg-[#1DD1A1]/20 border-2 border-[#1DD1A1] rounded-lg p-6 text-center">
                            <div className="text-4xl mb-2">🎉</div>
                            <h4 className="font-black text-[#1DD1A1] text-lg">恭喜！全部完成！</h4>
                            <p className="text-[#2D3436] text-sm mt-1">
                                已完成 {stats.total} 位學生的評語撰寫
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardModal;
