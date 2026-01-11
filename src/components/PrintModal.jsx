import React, { useState, useRef } from 'react';
import { X, Printer, FileDown, Eye, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '../contexts/ToastContext';

/**
 * 列印與 PDF 匯出 Modal
 */
const PrintModal = ({
    isOpen,
    onClose,
    students,
    currentClassName = '學生評語'
}) => {
    const { toast } = useToast();
    const printRef = useRef(null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [options, setOptions] = useState({
        format: 'table',        // 'table' | 'card'
        includeNumber: true,
        includeTraits: true,
        studentsPerPage: 6,
        onlyWithComments: false  // 預設顯示所有學生
    });

    // 過濾有評語的學生
    const studentsWithComments = students.filter(s => s.comment?.trim());

    // 根據選項決定要匯出的學生
    const studentsToExport = options.onlyWithComments ? studentsWithComments : students;

    // 格式化日期
    const today = new Date().toLocaleDateString('zh-TW');

    // 列印
    const handlePrint = () => {
        if (studentsToExport.length === 0) {
            toast.warning('沒有學生資料可列印');
            return;
        }

        setShowPreview(true);
        setTimeout(() => {
            window.print();
        }, 300);
    };

    // 匯出 PDF
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
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 10;

            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4 print:hidden">
                <div className="card-pop w-full max-w-3xl max-h-[90vh] flex flex-col animate-in bg-[#FFF9E6]">
                    {/* Header */}
                    <div className="p-3 sm:p-5 bg-[#FF6B9D] border-b-3 border-[#2D3436] flex items-center justify-between">
                        <h3 className="font-black text-white flex items-center gap-2 text-lg sm:text-xl">
                            <Printer size={24} />
                            列印與 PDF 匯出
                        </h3>
                        <button onClick={onClose} className="btn-pop p-2 bg-white text-[#2D3436]">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                        {/* 統計 */}
                        <div className="bg-[#54A0FF]/20 border-2 border-[#54A0FF] rounded-lg p-4 text-sm">
                            <p className="font-bold text-[#2D3436] mb-1">📊 匯出資訊</p>
                            <p>班級：<strong>{currentClassName}</strong></p>
                            <p>
                                總學生數：<strong>{students.length}</strong>人，
                                有評語：<strong className={studentsWithComments.length > 0 ? 'text-[#1DD1A1]' : 'text-[#FF6B6B]'}>{studentsWithComments.length}</strong>人
                            </p>
                            {studentsWithComments.length === 0 && (
                                <p className="mt-2 text-[#FF6B6B] font-bold">
                                    ⚠️ 目前沒有任何學生有評語，請先生成評語後再匯出
                                </p>
                            )}
                        </div>

                        {/* 選項 */}
                        <div className="bg-white border-2 border-[#2D3436] rounded-lg p-4">
                            <h4 className="font-bold text-[#2D3436] mb-3">顯示選項</h4>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={options.includeNumber}
                                        onChange={(e) => setOptions(prev => ({
                                            ...prev,
                                            includeNumber: e.target.checked
                                        }))}
                                        className="w-5 h-5 rounded border-2 border-[#2D3436] accent-[#1DD1A1]"
                                    />
                                    <span className="font-medium text-[#2D3436]">顯示座號</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={options.includeTraits}
                                        onChange={(e) => setOptions(prev => ({
                                            ...prev,
                                            includeTraits: e.target.checked
                                        }))}
                                        className="w-5 h-5 rounded border-2 border-[#2D3436] accent-[#1DD1A1]"
                                    />
                                    <span className="font-medium text-[#2D3436]">顯示特質標籤</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={options.onlyWithComments}
                                        onChange={(e) => setOptions(prev => ({
                                            ...prev,
                                            onlyWithComments: e.target.checked
                                        }))}
                                        className="w-5 h-5 rounded border-2 border-[#2D3436] accent-[#1DD1A1]"
                                    />
                                    <span className="font-medium text-[#2D3436]">僅匯出有評語的學生</span>
                                </label>
                            </div>
                        </div>

                        {/* 預覽按鈕 */}
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="btn-pop w-full py-3 bg-[#636E72] text-white font-bold flex items-center justify-center gap-2"
                        >
                            <Eye size={18} />
                            {showPreview ? '隱藏預覽' : '預覽內容'}
                        </button>

                        {/* 預覽區域 */}
                        {showPreview && (
                            <div className="bg-white border-2 border-[#2D3436] rounded-lg p-4 max-h-64 overflow-y-auto">
                                <div ref={printRef} className="print-content">
                                    <div className="text-center mb-4">
                                        <h2 className="text-xl font-bold">{currentClassName}</h2>
                                        <p className="text-sm text-gray-500">{today}</p>
                                    </div>
                                    {studentsToExport.length === 0 ? (
                                        <div className="text-center py-8 text-[#636E72]">
                                            <div className="text-4xl mb-3">📝</div>
                                            <p className="font-bold">沒有可匯出的內容</p>
                                            <p className="text-sm mt-1">請先為學生生成評語，或取消「僅匯出有評語的學生」選項</p>
                                        </div>
                                    ) : (
                                        <table className="w-full border-collapse text-sm">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    {options.includeNumber && <th className="border p-2 w-16">座號</th>}
                                                    <th className="border p-2 w-20">姓名</th>
                                                    {options.includeTraits && <th className="border p-2 w-32">特質</th>}
                                                    <th className="border p-2">評語</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {studentsToExport.map((student, index) => (
                                                    <tr key={student.id}>
                                                        {options.includeNumber && (
                                                            <td className="border p-2 text-center">{student.number || index + 1}</td>
                                                        )}
                                                        <td className="border p-2 font-medium">{student.name}</td>
                                                        {options.includeTraits && (
                                                            <td className="border p-2 text-xs text-gray-600">
                                                                {(student.selectedTags || []).join('、')}
                                                            </td>
                                                        )}
                                                        <td className="border p-2">{student.comment || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 按鈕 */}
                        <div className="flex gap-3">
                            <button
                                onClick={handlePrint}
                                disabled={studentsToExport.length === 0}
                                className="btn-pop flex-1 py-4 bg-[#54A0FF] text-white font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Printer size={20} />
                                列印
                            </button>
                            <button
                                onClick={handleExportPDF}
                                disabled={studentsToExport.length === 0 || isGenerating}
                                className="btn-pop flex-1 py-4 bg-[#1DD1A1] text-white font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        生成中...
                                    </>
                                ) : (
                                    <>
                                        <FileDown size={20} />
                                        PDF 匯出
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 列印樣式 - 只在列印時顯示 */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-content, .print-content * {
                        visibility: visible;
                    }
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
                    .print-content th, .print-content td {
                        border: 1px solid #333;
                        padding: 8px;
                    }
                    .print-content th {
                        background-color: #f0f0f0 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
        </>
    );
};

export default PrintModal;
