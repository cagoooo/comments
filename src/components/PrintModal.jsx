import React, { useState, useRef } from 'react';
import { Printer, FileDown, Eye, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '../contexts/ToastContext';
import ModalShell from './ui/ModalShell';
import { Btn } from './atoms';

/**
 * 列印與 PDF 匯出 Modal
 *
 * Props 保留：isOpen / onClose / students / currentClassName
 * 行為保留：列印（window.print + @media print）/ PDF（html2canvas + jsPDF）
 */
const PrintModal = ({
    isOpen,
    onClose,
    students,
    currentClassName = '學生評語',
}) => {
    const { toast } = useToast();
    const printRef = useRef(null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [options, setOptions] = useState({
        format: 'table',
        includeNumber: true,
        includeTraits: true,
        studentsPerPage: 6,
        onlyWithComments: false,
    });

    const studentsWithComments = students.filter(s => s.comment?.trim());
    const studentsToExport = options.onlyWithComments ? studentsWithComments : students;
    const today = new Date().toLocaleDateString('zh-TW');

    const handlePrint = () => {
        if (studentsToExport.length === 0) {
            toast.warning('沒有學生資料可列印');
            return;
        }
        setShowPreview(true);
        setTimeout(() => window.print(), 300);
    };

    const handleExportPDF = async () => {
        if (studentsToExport.length === 0) {
            toast.warning('沒有學生資料可匯出');
            return;
        }
        setIsGenerating(true);
        setShowPreview(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const element = printRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
            const imgX = (pdfWidth - canvas.width * ratio) / 2;
            const imgY = 10;
            pdf.addImage(imgData, 'PNG', imgX, imgY, canvas.width * ratio, canvas.height * ratio);
            pdf.save(`${currentClassName}_${today}.pdf`);
            toast.success('PDF 已下載');
        } catch (error) {
            console.error('PDF 生成失敗:', error);
            toast.error('PDF 生成失敗，請重試');
        }
        setIsGenerating(false);
    };

    if (!isOpen) return null;

    return (
        <>
            <ModalShell
                open={isOpen}
                onClose={onClose}
                width={760}
                eyebrow="Print / PDF Export"
                tapeColor="peach"
                icon={<Printer size={18} strokeWidth={1.8} />}
                title="列印與 PDF 匯出"
                subtitle={
                    <>📚 <span className="font-bold text-[var(--ink)]">{currentClassName}</span> · {today}</>
                }
                footer={
                    <div className="flex items-center justify-end">
                        <Btn variant="outline" size="sm" onClick={onClose}>
                            關閉
                        </Btn>
                    </div>
                }
            >
                <div className="px-5 sm:px-7 py-4 space-y-4 print:hidden">

                    {/* 統計 banner */}
                    <div
                        className="b-ink r-card p-4"
                        style={{
                            background: studentsWithComments.length > 0
                                ? 'var(--mint-soft)'
                                : 'var(--coral-soft)',
                        }}
                    >
                        <p className="font-black text-[13px] mb-1 uppercase tracking-wider text-[var(--ink-soft)]">
                            📊 匯出資訊
                        </p>
                        <p className="text-[13px]">
                            總學生數：<strong>{students.length}</strong> 人
                            <span className="mx-2 text-[var(--ink-mute)]">·</span>
                            有評語：<strong style={{ color: studentsWithComments.length > 0 ? 'var(--mint)' : 'var(--coral)' }}>
                                {studentsWithComments.length}
                            </strong> 人
                        </p>
                        {studentsWithComments.length === 0 && (
                            <p className="mt-2 text-[12px] font-bold" style={{ color: 'var(--coral)' }}>
                                ⚠️ 目前沒有任何學生有評語，請先生成評語後再匯出
                            </p>
                        )}
                    </div>

                    {/* 選項 */}
                    <div className="b-ink sh-sm r-card bg-white p-4">
                        <h4 className="font-black text-[13px] mb-3 uppercase tracking-wider text-[var(--ink-soft)]">
                            顯示選項
                        </h4>
                        <div className="space-y-2">
                            {[
                                { key: 'includeNumber', label: '顯示座號' },
                                { key: 'includeTraits', label: '顯示特質標籤' },
                                { key: 'onlyWithComments', label: '僅匯出有評語的學生' },
                            ].map(({ key, label }) => (
                                <label
                                    key={key}
                                    className="flex items-center gap-2 cursor-pointer p-2 b-soft r-btn hover:bg-[var(--paper-2)]"
                                >
                                    <input
                                        type="checkbox"
                                        checked={options[key]}
                                        onChange={(e) => setOptions(p => ({ ...p, [key]: e.target.checked }))}
                                    />
                                    <span className="font-bold text-[12.5px]">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 預覽切換 */}
                    <Btn
                        variant="outline"
                        size="md"
                        onClick={() => setShowPreview(!showPreview)}
                        className="w-full"
                        icon={<Eye size={15} strokeWidth={1.8} />}
                    >
                        {showPreview ? '隱藏預覽' : '預覽內容'}
                    </Btn>

                    {/* 預覽 */}
                    {showPreview && (
                        <div className="b-ink sh-sm r-card bg-white p-4 max-h-72 overflow-y-auto">
                            <div ref={printRef} className="print-content">
                                <div className="text-center mb-4">
                                    <h2 className="text-[18px] font-bold">{currentClassName}</h2>
                                    <p className="text-[11px] text-[var(--ink-soft)]">{today}</p>
                                </div>
                                {studentsToExport.length === 0 ? (
                                    <div className="text-center py-8 text-[var(--ink-soft)]">
                                        <div className="text-3xl mb-2" aria-hidden="true">📝</div>
                                        <p className="font-bold text-[13px]">沒有可匯出的內容</p>
                                        <p className="text-[11px] mt-1 text-[var(--ink-mute)]">
                                            請先為學生生成評語，或取消「僅匯出有評語的學生」選項
                                        </p>
                                    </div>
                                ) : (
                                    <table className="w-full border-collapse text-[12px]">
                                        <thead>
                                            <tr style={{ background: 'var(--paper-2)' }}>
                                                {options.includeNumber && (
                                                    <th className="border border-[var(--ink)] p-2 w-14">座號</th>
                                                )}
                                                <th className="border border-[var(--ink)] p-2 w-20">姓名</th>
                                                {options.includeTraits && (
                                                    <th className="border border-[var(--ink)] p-2 w-32">特質</th>
                                                )}
                                                <th className="border border-[var(--ink)] p-2">評語</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {studentsToExport.map((student, index) => (
                                                <tr key={student.id}>
                                                    {options.includeNumber && (
                                                        <td className="border border-[var(--ink)] p-2 text-center font-mono">
                                                            {student.number || index + 1}
                                                        </td>
                                                    )}
                                                    <td className="border border-[var(--ink)] p-2 font-bold">
                                                        {student.name}
                                                    </td>
                                                    {options.includeTraits && (
                                                        <td className="border border-[var(--ink)] p-2 text-[11px] text-[var(--ink-soft)]">
                                                            {(student.selectedTags || []).join('、')}
                                                        </td>
                                                    )}
                                                    <td className="border border-[var(--ink)] p-2 leading-relaxed">
                                                        {student.comment || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 動作 */}
                    <div className="flex gap-2">
                        <Btn
                            color="sky"
                            size="lg"
                            onClick={handlePrint}
                            disabled={studentsToExport.length === 0}
                            className="flex-1"
                            icon={<Printer size={17} strokeWidth={1.8} />}
                        >
                            列印
                        </Btn>
                        <Btn
                            color="mint"
                            size="lg"
                            onClick={handleExportPDF}
                            disabled={studentsToExport.length === 0 || isGenerating}
                            className="flex-1"
                            icon={isGenerating
                                ? <Loader2 size={17} strokeWidth={1.8} className="animate-spin" />
                                : <FileDown size={17} strokeWidth={1.8} />}
                        >
                            {isGenerating ? '生成中…' : 'PDF 匯出'}
                        </Btn>
                    </div>
                </div>
            </ModalShell>

            {/* 列印樣式 — 只列印 .print-content，移除 .tape / .sh-card / .bg-paper 等裝飾性 effect */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-content, .print-content * { visibility: visible; }
                    .print-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 20px;
                    }
                    .print-content table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .print-content th,
                    .print-content td {
                        border: 1px solid #333;
                        padding: 8px;
                    }
                    .print-content th {
                        background-color: #f0f0f0 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    /* 不列印裝飾元素 */
                    .tape, .sh-card, .sh-btn, .sh-sm,
                    [class*="bg-paper"] {
                        background: transparent !important;
                        box-shadow: none !important;
                    }
                }
            `}</style>
        </>
    );
};

export default PrintModal;
