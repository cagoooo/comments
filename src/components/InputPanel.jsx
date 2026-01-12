import React, { useRef, useState, useCallback } from 'react';
import { Users, Plus, RefreshCw, Hash, FileSpreadsheet, Upload } from 'lucide-react';
import { parseExcelFile } from '../utils/excelHelper';
import { useToast } from '../contexts/ToastContext';

/**
 * 輸入面板 - 教育手寫普普風
 * 支援手動輸入和 Excel 批次匯入
 */
const InputPanel = ({
    rawInput,
    setRawInput,
    numberCount,
    setNumberCount,
    onGenerateStudents,
    onGenerateNumbers,
    onResetList,
    onImportFromExcel,
    isGenerating
}) => {
    const { toast } = useToast();
    const fileInputRef = useRef(null);
    const [isDragOver, setIsDragOver] = useState(false);

    // 處理 Excel 檔案
    const handleExcelFile = async (file) => {
        if (!file) return;

        // 驗證檔案類型
        if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
            toast.error('請選擇 Excel 或 CSV 檔案');
            return;
        }

        try {
            const { headers, rows } = await parseExcelFile(file);

            // 找到姓名欄位 (通常是第一欄或標題含「姓名」)
            let nameColIndex = 0;
            let numberColIndex = 1;

            headers.forEach((header, index) => {
                const h = String(header || '').toLowerCase();
                if (h.includes('姓名') || h.includes('name')) {
                    nameColIndex = index;
                }
                if (h.includes('座號') || h.includes('學號') || h.includes('編號')) {
                    numberColIndex = index;
                }
            });

            // 提取學生資料
            const students = rows
                .map(row => {
                    const name = String(row[nameColIndex] || '').trim();
                    const number = row[numberColIndex] ? String(row[numberColIndex]).trim() : '';
                    return { name, number };
                })
                .filter(s => s.name); // 過濾空姓名

            if (students.length === 0) {
                toast.error('未找到有效的學生姓名');
                return;
            }

            // 呼叫匯入函數
            if (onImportFromExcel) {
                onImportFromExcel(students);
                toast.success(`✨ 已匯入 ${students.length} 位學生`);
            } else {
                // 如果沒有提供匯入函數，把姓名填入文字框
                const names = students.map(s => s.name).join('\n');
                setRawInput(names);
                toast.success(`已讀取 ${students.length} 位學生，請點擊「加入」`);
            }
        } catch (error) {
            console.error('Excel 解析失敗:', error);
            toast.error('Excel 解析失敗，請確認檔案格式');
        }
    };

    // 拖拽處理
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleExcelFile(file);
    }, []);

    return (
        <div className="flex-1 w-full flex flex-col gap-3 p-3 sm:p-4 bg-[#FF9F43] border-3 border-[#2D3436] rounded-lg shadow-[4px_4px_0_#2D3436] transform rotate-[-0.5deg]">
            <div className="flex items-center justify-between gap-2 sm:gap-3 text-white font-black text-base sm:text-xl mb-1">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">📝</span>
                    1. 輸入學生名單
                </div>

                {/* Excel 匯入按鈕 - 大而清楚 */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-pop bg-white text-[#1DD1A1] px-3 sm:px-4 py-2 text-sm sm:text-base font-black flex items-center gap-2 shadow-[3px_3px_0_#2D3436] hover:shadow-[4px_4px_0_#2D3436] hover:-translate-y-0.5 transition-all"
                    title="從 Excel 匯入學生"
                >
                    <FileSpreadsheet size={18} className="sm:w-5 sm:h-5" />
                    <span className="hidden xs:inline">Excel</span>
                    <span>匯入</span>
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => handleExcelFile(e.target.files[0])}
                    className="hidden"
                />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="flex-1 flex flex-col gap-3">
                    {/* 可拖拽的輸入區 */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`flex-1 relative ${isDragOver ? 'ring-4 ring-[#54A0FF] ring-offset-2' : ''}`}
                    >
                        <textarea
                            className="w-full h-full min-h-[100px] sm:min-h-[120px] p-3 sm:p-4 border-3 border-[#2D3436] rounded-lg outline-none text-sm sm:text-base resize-none font-medium placeholder:text-[#9CA3AF] placeholder:leading-relaxed text-[#2D3436] leading-relaxed bg-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]"
                            placeholder="📝 使用方式：&#10;&#10;方法一：手動輸入&#10;一行一位學生姓名，如：&#10;王小明&#10;李大華&#10;&#10;方法二：批次產生&#10;下方輸入座號數量後點「產生」&#10;&#10;方法三：Excel 匯入&#10;拖拽 Excel 到此處或點右上角按鈕"
                            value={rawInput}
                            onChange={(e) => setRawInput(e.target.value)}
                            disabled={isGenerating}
                        />

                        {/* 拖拽覆蓋層 */}
                        {isDragOver && (
                            <div className="absolute inset-0 bg-[#54A0FF]/90 border-3 border-dashed border-white rounded-lg flex flex-col items-center justify-center text-white">
                                <Upload size={32} className="mb-2" />
                                <span className="font-bold">放開以匯入 Excel</span>
                            </div>
                        )}
                    </div>

                    {/* 批次產生座號 */}
                    <div className="flex items-center gap-2 sm:gap-3 bg-white p-2 sm:p-3 border-2 border-[#2D3436] rounded-lg">
                        <span className="text-[#2D3436] font-bold text-xs sm:text-sm flex items-center gap-1">
                            <Hash size={14} /> 產生
                        </span>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={numberCount}
                            onChange={(e) => setNumberCount(Number(e.target.value))}
                            className="w-14 sm:w-16 text-center border-2 border-[#2D3436] text-[#2D3436] font-bold text-xs sm:text-sm py-1.5 outline-none rounded"
                        />
                        <span className="text-[#2D3436] text-xs sm:text-sm font-bold">個座號</span>
                        <button
                            onClick={onGenerateNumbers}
                            className="btn-pop ml-auto bg-[#FECA57] text-[#2D3436] px-3 py-1 text-xs sm:text-sm"
                        >
                            產生 🔢
                        </button>
                    </div>
                </div>

                {/* 按鈕區 */}
                <div className="flex flex-row sm:flex-col gap-2 sm:gap-3 sm:w-24">
                    <button
                        onClick={onGenerateStudents}
                        disabled={isGenerating}
                        className="flex-1 btn-pop bg-[#1DD1A1] text-white font-bold px-3 sm:px-2 py-3 sm:py-4 text-sm sm:text-base flex flex-row sm:flex-col items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Plus size={20} />
                        <span>加入</span>
                    </button>
                    <button
                        onClick={onResetList}
                        disabled={isGenerating}
                        className="flex-1 btn-pop bg-white text-[#FF6B6B] font-bold px-3 sm:px-2 py-3 sm:py-4 text-sm sm:text-base flex flex-row sm:flex-col items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw size={18} />
                        <span>清空</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InputPanel;

