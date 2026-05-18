import React, { useRef, useState, useCallback, useMemo } from 'react';
import { Plus, RefreshCw, Hash, FileSpreadsheet, Upload, ArrowRight } from 'lucide-react';
// excelHelper 走動態 import (TD7 主 bundle 瘦身)：xlsx ~600 KB 改成只在使用者
// 拖拽 / 選擇檔案時才下載，主 bundle 砍掉 600 KB
import { useToast } from '../contexts/ToastContext';
import { Card, StickerTab } from './atoms';

/**
 * 學生名單輸入面板（Step 1）
 *
 * 新設計：紙質卡片 + peach StickerTab + bg-lined textarea + 紙膠帶頂部裝飾。
 * 保留既有 Excel 拖拽 / 檔案選擇 / 批次產生座號 / disabled-while-generating 行為。
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
    isGenerating,
}) => {
    const { toast } = useToast();
    const fileInputRef = useRef(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const lineCount = useMemo(
        () => rawInput.split('\n').filter(line => line.trim()).length,
        [rawInput]
    );

    // ── Excel 檔案處理（沿用既有邏輯） ─────────────────────
    const handleExcelFile = async (file) => {
        if (!file) return;
        if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
            toast.error('請選擇 Excel 或 CSV 檔案');
            return;
        }
        try {
            // 動態載入 excelHelper (含 xlsx ~600 KB)
            const { parseExcelFile } = await import('../utils/excelHelper');
            const { headers, rows } = await parseExcelFile(file);
            let nameColIndex = 0;
            let numberColIndex = 1;
            headers.forEach((header, index) => {
                const h = String(header || '').toLowerCase();
                if (h.includes('姓名') || h.includes('name')) nameColIndex = index;
                if (h.includes('座號') || h.includes('學號') || h.includes('編號')) numberColIndex = index;
            });
            const students = rows
                .map(row => ({
                    name: String(row[nameColIndex] || '').trim(),
                    number: row[numberColIndex] ? String(row[numberColIndex]).trim() : '',
                }))
                .filter(s => s.name);
            if (students.length === 0) {
                toast.error('未找到有效的學生姓名');
                return;
            }
            if (onImportFromExcel) {
                onImportFromExcel(students);
                toast.success(`✨ 已匯入 ${students.length} 位學生`);
            } else {
                const names = students.map(s => s.name).join('\n');
                setRawInput(names);
                toast.success(`已讀取 ${students.length} 位學生，請點擊「加入」`);
            }
        } catch (error) {
            console.error('Excel 解析失敗:', error);
            toast.error('Excel 解析失敗，請確認檔案格式');
        }
    };

    const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragOver(true); }, []);
    const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragOver(false); }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleExcelFile(file);
    }, []);

    return (
        <div className="relative pt-4 flex-1 w-full">
            <Card className="overflow-visible">
                <StickerTab color="peach" number="1">學生名單</StickerTab>

                {/* 頂部裝飾紙膠帶 */}
                <div
                    className="tape"
                    style={{ top: -10, right: 60, transform: 'rotate(8deg)' }}
                    aria-hidden="true"
                />

                <div className="p-4 sm:p-5 pt-7 grid grid-cols-1 md:grid-cols-[1fr_140px] gap-3 sm:gap-4">

                    {/* ── 左：textarea + 座號 row ───────────────────── */}
                    <div className="flex flex-col gap-3">
                        {/* textarea（紙線稿背景） */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={[
                                'b-ink r-btn bg-lined relative min-h-[160px]',
                                isDragOver ? 'ring-2 ring-offset-2 ring-[var(--sky)]' : '',
                            ].join(' ')}
                            style={{ boxShadow: 'inset 0 1px 0 rgba(31,27,22,0.04)' }}
                        >
                            <div className="absolute top-3 right-3 text-[10px] font-mono text-[var(--ink-mute)] tracking-wider pointer-events-none z-10">
                                {lineCount} lines · drag .xlsx here
                            </div>

                            <textarea
                                value={rawInput}
                                onChange={(e) => setRawInput(e.target.value)}
                                disabled={isGenerating}
                                placeholder={[
                                    '一行一位學生姓名，例如：',
                                    '王小明',
                                    '李大華',
                                    '',
                                    '或拖拽 .xlsx 到此處批次匯入',
                                ].join('\n')}
                                className="w-full min-h-[160px] p-4 pt-4 bg-transparent outline-none text-[14px] leading-[28px] resize-none text-[var(--ink)] placeholder:text-[var(--ink-mute)] placeholder:leading-[28px]"
                                aria-label="學生名單輸入區"
                            />

                            {isDragOver && (
                                <div className="absolute inset-0 bg-[var(--sky-soft)] border-2 border-dashed border-[var(--sky)] rounded-[var(--r-btn)] flex flex-col items-center justify-center text-[var(--ink)] z-20">
                                    <Upload size={28} strokeWidth={1.8} className="mb-2" />
                                    <span className="font-bold text-[13px]">放開以匯入 Excel</span>
                                </div>
                            )}
                        </div>

                        {/* 批次產生座號 */}
                        <div
                            className="b-ink r-btn flex items-center gap-2 sm:gap-3 px-3 sm:px-3.5 h-12 flex-wrap sm:flex-nowrap"
                            style={{ background: 'var(--peach-soft)' }}
                        >
                            <Hash size={14} strokeWidth={1.8} className="shrink-0" />
                            <span className="font-bold text-[13px] shrink-0">批次產生</span>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={numberCount}
                                onChange={(e) => setNumberCount(Number(e.target.value))}
                                disabled={isGenerating}
                                className="w-14 h-8 bg-white text-center b-ink r-btn font-mono font-bold text-[13px] outline-none disabled:opacity-50"
                                aria-label="座號數量"
                            />
                            <span className="font-bold text-[13px] shrink-0">個座號</span>
                            <button
                                onClick={onGenerateNumbers}
                                disabled={isGenerating}
                                className="ml-auto h-8 px-3 bg-white b-ink r-btn font-bold text-[12px] btn-press sh-sm inline-flex items-center gap-1 shrink-0 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                            >
                                產生序號 <ArrowRight size={11} strokeWidth={1.8} />
                            </button>
                        </div>
                    </div>

                    {/* ── 右：3 顆 CTA 按鈕 ───────────────────── */}
                    <div className="flex flex-row md:flex-col gap-2 sm:gap-2.5">
                        {/* 加入名單（主要） */}
                        <button
                            onClick={onGenerateStudents}
                            disabled={isGenerating || !rawInput.trim()}
                            style={{ background: 'var(--mint)' }}
                            className="b-ink sh-btn r-btn flex-1 md:flex-none md:h-[88px] py-3 md:py-0 flex flex-col items-center justify-center gap-1 font-black btn-press disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                            aria-label="加入學生名單"
                        >
                            <Plus size={22} strokeWidth={1.8} />
                            <span className="text-[13px] sm:text-[14px]">加入名單</span>
                        </button>

                        {/* Excel 匯入 */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isGenerating}
                            style={{ background: 'var(--sky-soft)' }}
                            className="b-ink sh-sm r-btn flex-1 md:flex-none md:h-11 py-2.5 md:py-0 flex items-center justify-center gap-2 font-bold text-[12px] sm:text-[13px] btn-press disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                            title="從 Excel 匯入學生"
                            aria-label="從 Excel 檔案匯入學生"
                        >
                            <FileSpreadsheet size={14} strokeWidth={1.8} />
                            <span>Excel</span>
                            <span className="hidden md:inline">匯入</span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => handleExcelFile(e.target.files[0])}
                            className="hidden"
                        />

                        {/* 清空（ghost） */}
                        <button
                            onClick={onResetList}
                            disabled={isGenerating}
                            className="b-dash r-btn flex-1 md:flex-none md:h-11 py-2.5 md:py-0 flex items-center justify-center gap-2 font-bold text-[12px] sm:text-[13px] text-[var(--ink-soft)] hover:text-[var(--coral)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-soft"
                            aria-label="清空名單"
                        >
                            <RefreshCw size={14} strokeWidth={1.8} />
                            <span>清空</span>
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default InputPanel;
