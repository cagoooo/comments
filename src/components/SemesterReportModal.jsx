import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Printer, Settings, Eye, EyeOff } from 'lucide-react';
import ModalShell from './ui/ModalShell';
import { Card, Btn, Chip } from './atoms';
import { useToast } from '../contexts/ToastContext';
import SemesterReportPrintable from './semester-report/SemesterReportPrintable';
import './semester-report/semester-report-print.css';

/**
 * 學期報告 PDF 匯出 Modal
 *
 * 走 window.print() + @media print（per pdf-export-print-best-practice skill）
 * 螢幕上顯示配置 UI 與預覽。實際列印時，全域 @media print 規則把
 * 主 UI 全部隱藏，只留 #semester-report 主體。
 */
const SemesterReportModal = ({
    isOpen,
    onClose,
    students = [],
    currentClassName = '全部學生',
    currentUser,
}) => {
    const { toast } = useToast();

    // 推算預設值
    const defaultTerm = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear() - 1911; // 民國
        const month = now.getMonth() + 1;
        // 上學期：8月-1月，下學期：2月-7月
        const semester = (month >= 8 || month === 1) ? '上學期' : '下學期';
        return `${year} 學年度 ${semester}`;
    }, []);

    const [term, setTerm] = useState(defaultTerm);
    const [schoolName, setSchoolName] = useState('');
    const [teacherName, setTeacherName] = useState('');
    const [options, setOptions] = useState({
        includeRoster: true,
        includeTraits: true,
        includeStats: true,
        includeSignature: true,
        onlyWithComments: false,
    });
    const [previewExpanded, setPreviewExpanded] = useState(false);

    // 當 modal 開啟，從 currentUser 帶入學校 / 老師
    useEffect(() => {
        if (!isOpen) return;
        if (currentUser?.schoolName) setSchoolName(currentUser.schoolName);
        if (currentUser?.displayName) setTeacherName(currentUser.displayName);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, currentUser?.schoolName, currentUser?.displayName]);

    const studentsWithComments = students.filter(
        s => s.comment?.trim() && !s.comment.trim().startsWith('❌')
    );
    const studentsToInclude = options.onlyWithComments ? studentsWithComments : students;

    // 預估頁數：封面1 + 名單1 + 每生1 + 統計1
    const estimatedPages = useMemo(() => {
        let n = 1; // cover
        if (options.includeRoster && students.length > 0) n += 1;
        n += studentsToInclude.length;
        if (options.includeStats) n += 1;
        return n;
    }, [options, studentsToInclude.length, students.length]);

    const handlePrint = () => {
        if (students.length === 0) {
            toast.warning('沒有學生資料可匯出');
            return;
        }
        toast.success?.('🖨️ 即將開啟列印對話框，請選「另存為 PDF」') ??
            toast('🖨️ 即將開啟列印對話框，請選「另存為 PDF」');
        // 給 toast 顯示 + DOM 套上 print 樣式的喘息時間
        setTimeout(() => window.print(), 400);
    };

    if (!isOpen) return null;

    return (
        <>
            <ModalShell
                open={isOpen}
                onClose={onClose}
                width={820}
                eyebrow="Semester Report"
                tapeColor="honey"
                icon={<FileText size={18} strokeWidth={1.8} />}
                title="學期評語報告"
                subtitle={
                    <>
                        📚 <span className="font-bold text-[var(--ink)]">{currentClassName}</span>
                        <span className="mx-1.5 text-[var(--ink-mute)]">·</span>
                        共 {students.length} 位學生，將產出 <strong>{estimatedPages}</strong> 頁 PDF
                    </>
                }
                footer={
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[var(--ink-soft)] hidden sm:inline">
                            列印對話框內選「另存為 PDF」即可下載
                        </span>
                        <div className="flex items-center gap-2 ml-auto">
                            <Btn variant="outline" size="sm" onClick={onClose}>關閉</Btn>
                            <Btn
                                color="honey"
                                size="sm"
                                onClick={handlePrint}
                                disabled={students.length === 0}
                                icon={<Printer size={14} strokeWidth={1.8} />}
                            >
                                列印 / 儲存為 PDF
                            </Btn>
                        </div>
                    </div>
                }
            >
                <div className="px-5 sm:px-7 py-4 sm:py-5 space-y-4">

                    {/* ── 報告基本資訊 ───────────────────────── */}
                    <Card className="p-4 sm:p-5">
                        <h4 className="font-black text-[14px] flex items-center gap-2 mb-3">
                            <Settings size={16} strokeWidth={1.8} style={{ color: 'var(--honey)' }} />
                            報告基本資訊
                            <span className="text-[11px] font-mono text-[var(--ink-mute)]">會顯示在封面與每頁頁首</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="block">
                                <span className="text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wider block mb-1">
                                    學期 / 時間
                                </span>
                                <input
                                    type="text"
                                    value={term}
                                    onChange={(e) => setTerm(e.target.value)}
                                    placeholder="例：114 學年度 上學期"
                                    className="w-full h-10 px-3 b-ink r-btn bg-white font-bold text-[13px] outline-none focus:ring-2 focus:ring-honey-soft"
                                />
                            </label>
                            <label className="block">
                                <span className="text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wider block mb-1">
                                    導師姓名
                                </span>
                                <input
                                    type="text"
                                    value={teacherName}
                                    onChange={(e) => setTeacherName(e.target.value)}
                                    placeholder="例：阿凱老師"
                                    className="w-full h-10 px-3 b-ink r-btn bg-white font-bold text-[13px] outline-none focus:ring-2 focus:ring-honey-soft"
                                />
                            </label>
                            <label className="block sm:col-span-2">
                                <span className="text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wider block mb-1">
                                    學校名稱
                                </span>
                                <input
                                    type="text"
                                    value={schoolName}
                                    onChange={(e) => setSchoolName(e.target.value)}
                                    placeholder="例：桃園市龍潭區石門國民小學"
                                    className="w-full h-10 px-3 b-ink r-btn bg-white font-bold text-[13px] outline-none focus:ring-2 focus:ring-honey-soft"
                                />
                            </label>
                        </div>
                    </Card>

                    {/* ── 內容選項 ───────────────────────────── */}
                    <Card className="p-4 sm:p-5">
                        <h4 className="font-black text-[14px] flex items-center gap-2 mb-3">
                            <FileText size={16} strokeWidth={1.8} style={{ color: 'var(--mint)' }} />
                            內容選項
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                                { key: 'includeRoster', label: '包含學生名單頁', desc: '封面後一頁列出全班姓名/座號/狀態' },
                                { key: 'includeTraits', label: '顯示特質印象', desc: '在每位學生頁顯示成語標籤' },
                                { key: 'includeStats', label: '包含班級統計頁', desc: '最後一頁顯示完成率、字數、熱門特質' },
                                { key: 'includeSignature', label: '顯示簽名 / 印章區', desc: '每位學生頁底加導師簽名 + 印章框' },
                                { key: 'onlyWithComments', label: '僅匯出有評語的學生', desc: `跳過未撰寫的（共 ${students.length - studentsWithComments.length} 位）` },
                            ].map(({ key, label, desc }) => (
                                <label
                                    key={key}
                                    className="flex items-start gap-2 p-2.5 b-soft r-btn hover:bg-[var(--paper-2)] cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={options[key]}
                                        onChange={(e) => setOptions(p => ({ ...p, [key]: e.target.checked }))}
                                        className="mt-0.5"
                                    />
                                    <div className="min-w-0">
                                        <div className="font-bold text-[13px] text-[var(--ink)]">{label}</div>
                                        <div className="text-[11px] text-[var(--ink-soft)] mt-0.5">{desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </Card>

                    {/* ── 摘要 + 預覽折疊 ────────────────────── */}
                    <Card className="p-4" style={{ background: 'var(--honey-soft)' }}>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Chip color="honey" size="sm">封面 1 頁</Chip>
                            {options.includeRoster && students.length > 0 && (
                                <Chip color="sky" size="sm" soft>學生名單 1 頁</Chip>
                            )}
                            <Chip color="mint" size="sm" soft>學生分頁 {studentsToInclude.length} 頁</Chip>
                            {options.includeStats && (
                                <Chip color="lav" size="sm" soft>統計 1 頁</Chip>
                            )}
                            <span className="ml-auto text-[12px] font-bold text-[var(--ink)]">
                                總共 <strong className="font-mono text-[14px]">{estimatedPages}</strong> 頁
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setPreviewExpanded(v => !v)}
                            className="text-[12px] font-bold text-[var(--ink-soft)] hover:text-[var(--ink)] inline-flex items-center gap-1.5"
                        >
                            {previewExpanded ? <EyeOff size={12} /> : <Eye size={12} />}
                            {previewExpanded ? '收起說明' : '報告內容預覽（文字示意）'}
                        </button>

                        {previewExpanded && (
                            <div className="mt-3 pt-3 border-t border-dashed border-[var(--line-soft)] text-[12px] text-[var(--ink-soft)] space-y-1.5 leading-relaxed">
                                <p>📄 <strong className="text-[var(--ink)]">封面頁</strong>：紙膠帶裝飾 + 學校 + 學期 + 班級 + 導師 + 學生人數</p>
                                {options.includeRoster && students.length > 0 && (
                                    <p>📄 <strong className="text-[var(--ink)]">學生名單頁</strong>：全班 {students.length} 位學生姓名 / 座號 / 評語狀態 / 主要特質</p>
                                )}
                                <p>📄 <strong className="text-[var(--ink)]">學生分頁</strong>（每位獨佔一頁）：
                                    {options.includeTraits && '特質印象 + '}
                                    紙線稿評語區{options.includeSignature && ' + 導師簽名 + 印章框'}
                                </p>
                                {options.includeStats && (
                                    <p>📄 <strong className="text-[var(--ink)]">統計頁</strong>：6 個 KPI（人數/完成率/字數）+ 熱門特質 TOP 12</p>
                                )}
                                <p className="text-[11px] text-[var(--ink-mute)] pt-1.5">
                                    💡 列印時瀏覽器會自動產生分頁。在列印對話框內選「儲存為 PDF」即可下載完整檔案。
                                </p>
                            </div>
                        )}
                    </Card>

                    {/* 空狀態提示 */}
                    {students.length === 0 && (
                        <Card className="p-4 text-center" style={{ background: 'var(--coral-soft)' }}>
                            <div className="text-2xl mb-1" aria-hidden="true">📝</div>
                            <p className="font-bold text-[13px]">沒有學生資料可匯出</p>
                            <p className="text-[11px] mt-1 text-[var(--ink-soft)]">請先加入學生並撰寫評語</p>
                        </Card>
                    )}
                </div>
            </ModalShell>

            {/* 列印用主體 — 螢幕上 display:none，print 時 @media print 規則顯示 */}
            <SemesterReportPrintable
                students={studentsToInclude}
                classNameText={currentClassName}
                schoolName={schoolName}
                teacherName={teacherName}
                term={term}
                options={options}
            />
        </>
    );
};

export default SemesterReportModal;
