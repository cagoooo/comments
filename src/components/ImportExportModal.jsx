import React, { useState, useCallback, useRef } from 'react';
import {
    Upload, Download, FileSpreadsheet, AlertCircle, Check, Loader2, FileDown,
} from 'lucide-react';
import { parseExcelFile, guessColumnMapping, downloadExcel, downloadTemplate } from '../utils/excelHelper';
import { useToast } from '../contexts/ToastContext';
import ModalShell from './ui/ModalShell';
import { Btn } from './atoms';

/**
 * 匯入/匯出 Modal — 2 tab：匯出選項 / 匯入欄位對應
 *
 * Props 保留：isOpen / onClose / students / onImport / currentClassName
 */
const ImportExportModal = ({
    isOpen,
    onClose,
    students,
    onImport,
    currentClassName = '學生資料',
}) => {
    const { toast } = useToast();
    const fileInputRef = useRef(null);

    const [activeTab, setActiveTab] = useState('export');
    const [isProcessing, setIsProcessing] = useState(false);

    const [exportOptions, setExportOptions] = useState({
        includeNumber: true,
        includeName: true,
        includeTraits: true,
        includeManualTraits: true,
        includeComment: true,
    });

    const [importData, setImportData] = useState(null);
    const [columnMapping, setColumnMapping] = useState({});
    const [importMode, setImportMode] = useState('append');
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFileSelect = async (file) => {
        if (!file) return;
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
        ];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
            toast.error('請選擇 Excel 或 CSV 檔案');
            return;
        }
        setIsProcessing(true);
        try {
            const { headers, rows, sheetName } = await parseExcelFile(file);
            const mapping = guessColumnMapping(headers);
            setImportData({ headers, rows, sheetName, fileName: file.name });
            setColumnMapping(mapping);
            toast.success(`已讀取 ${rows.length} 筆資料`);
        } catch (error) {
            toast.error(error.message);
            setImportData(null);
        }
        setIsProcessing(false);
    };

    const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragOver(true); }, []);
    const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragOver(false); }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }, []);

    const handleImport = () => {
        if (!importData || columnMapping.name < 0) {
            toast.error('請至少指定姓名欄位');
            return;
        }
        const newStudents = importData.rows.map((row, index) => {
            const name = row[columnMapping.name] || '';
            if (!name) return null;
            return {
                id: `import_${Date.now()}_${index}`,
                number: columnMapping.number >= 0 ? row[columnMapping.number] : index + 1,
                name: String(name).trim(),
                traits: '',
                selectedTags: columnMapping.traits >= 0
                    ? String(row[columnMapping.traits] || '').split(/[、,，]/).filter(Boolean)
                    : [],
                manualTraits: '',
                comment: columnMapping.comment >= 0 ? String(row[columnMapping.comment] || '') : '',
            };
        }).filter(Boolean);

        if (newStudents.length === 0) {
            toast.error('沒有有效的學生資料');
            return;
        }
        onImport(newStudents, importMode);
        toast.success(`已匯入 ${newStudents.length} 位學生`);
        setImportData(null);
        setColumnMapping({});
        onClose();
    };

    const handleExport = () => {
        if (students.length === 0) {
            toast.warning('沒有學生資料可匯出');
            return;
        }
        const filename = `${currentClassName}_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}`;
        downloadExcel(students, filename, exportOptions);
        toast.success(`已匯出 ${students.length} 位學生資料`);
    };

    const handleDownloadTemplate = () => {
        downloadTemplate();
        toast.info('範本下載完成');
    };

    if (!isOpen) return null;

    return (
        <ModalShell
            open={isOpen}
            onClose={onClose}
            width={680}
            eyebrow="Excel Import / Export"
            tapeColor="sky"
            icon={<FileSpreadsheet size={18} strokeWidth={1.8} />}
            title="Excel 匯入 / 匯出"
            subtitle={
                <>📚 <span className="font-bold text-[var(--ink)]">{currentClassName}</span> · {students.length} 位</>
            }
            footer={
                <div className="flex items-center justify-end">
                    <Btn variant="outline" size="sm" onClick={onClose}>
                        關閉
                    </Btn>
                </div>
            }
        >
            <div className="px-5 sm:px-7 pt-4">
                {/* Tab segmented control */}
                <div className="b-ink r-btn p-1 bg-white sh-sm h-11 inline-flex w-full sm:w-auto mb-4">
                    <button
                        type="button"
                        onClick={() => setActiveTab('export')}
                        style={{
                            background: activeTab === 'export' ? 'var(--mint)' : 'transparent',
                            color: 'var(--ink)',
                        }}
                        className="flex-1 sm:flex-none px-4 h-9 rounded-md font-bold text-[13px] inline-flex items-center justify-center gap-1.5"
                        aria-pressed={activeTab === 'export'}
                    >
                        <Download size={14} strokeWidth={1.8} /> 匯出
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('import')}
                        style={{
                            background: activeTab === 'import' ? 'var(--coral)' : 'transparent',
                            color: 'var(--ink)',
                        }}
                        className="flex-1 sm:flex-none px-4 h-9 rounded-md font-bold text-[13px] inline-flex items-center justify-center gap-1.5"
                        aria-pressed={activeTab === 'import'}
                    >
                        <Upload size={14} strokeWidth={1.8} /> 匯入
                    </button>
                </div>
            </div>

            <div className="px-5 sm:px-7 pb-5">
                {activeTab === 'export' ? (
                    <div className="space-y-4">
                        {/* 欄位選擇 */}
                        <div className="b-ink sh-sm r-card bg-white p-4">
                            <h4 className="font-black text-[13px] mb-3 uppercase tracking-wider text-[var(--ink-soft)]">
                                匯出欄位
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {[
                                    { key: 'includeNumber', label: '座號' },
                                    { key: 'includeName', label: '姓名' },
                                    { key: 'includeTraits', label: '特質標籤' },
                                    { key: 'includeManualTraits', label: '自訂特質' },
                                    { key: 'includeComment', label: '評語' },
                                ].map(({ key, label }) => (
                                    <label
                                        key={key}
                                        className="flex items-center gap-2 cursor-pointer p-2 b-soft r-btn hover:bg-[var(--paper-2)]"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={exportOptions[key]}
                                            onChange={(e) => setExportOptions(p => ({ ...p, [key]: e.target.checked }))}
                                        />
                                        <span className="font-bold text-[12.5px]">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 資訊 banner */}
                        <div
                            className="b-dash r-btn p-3 text-[12.5px] text-[var(--ink)]"
                            style={{ background: 'var(--mint-soft)' }}
                        >
                            📊 將匯出 <strong>{students.length}</strong> 位學生 · 班級：<strong>{currentClassName}</strong>
                        </div>

                        <Btn
                            color="mint"
                            size="lg"
                            onClick={handleExport}
                            disabled={students.length === 0}
                            className="w-full"
                            icon={<Download size={17} strokeWidth={1.8} />}
                        >
                            匯出 Excel
                        </Btn>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {!importData ? (
                            <>
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                                    className={[
                                        'b-dash r-card p-8 text-center cursor-pointer transition-all',
                                        isDragOver ? 'ring-2 ring-offset-2 ring-[var(--coral)]' : '',
                                    ].join(' ')}
                                    style={{ background: isDragOver ? 'var(--coral-soft)' : 'var(--paper-2)' }}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(e) => handleFileSelect(e.target.files[0])}
                                        className="hidden"
                                    />

                                    {isProcessing ? (
                                        <Loader2 size={40} strokeWidth={1.5} className="mx-auto text-[var(--coral)] animate-spin mb-3" />
                                    ) : (
                                        <Upload size={40} strokeWidth={1.5} className="mx-auto text-[var(--ink-soft)] mb-3" />
                                    )}

                                    <p className="font-bold text-[14px] text-[var(--ink)] mb-1">
                                        {isDragOver ? '放開以上傳檔案' : '點擊或拖拽上傳 Excel 檔案'}
                                    </p>
                                    <p className="text-[12px] text-[var(--ink-soft)]">
                                        支援 .xlsx / .xls / .csv 格式
                                    </p>
                                </div>

                                <Btn
                                    color="sky"
                                    size="md"
                                    onClick={handleDownloadTemplate}
                                    className="w-full"
                                    icon={<FileDown size={15} strokeWidth={1.8} />}
                                >
                                    下載匯入範本
                                </Btn>
                            </>
                        ) : (
                            <>
                                <div
                                    className="b-dash r-btn p-3 text-[12.5px]"
                                    style={{ background: 'var(--sky-soft)' }}
                                >
                                    <p className="font-bold text-[var(--ink)]">📄 {importData.fileName}</p>
                                    <p className="text-[var(--ink-soft)] mt-0.5">共 {importData.rows.length} 筆資料</p>
                                </div>

                                {/* 欄位對應 */}
                                <div className="b-ink sh-sm r-card bg-white p-4">
                                    <h4 className="font-black text-[13px] mb-3 uppercase tracking-wider text-[var(--ink-soft)]">
                                        欄位對應
                                    </h4>
                                    <div className="space-y-2.5">
                                        {[
                                            { key: 'number', label: '座號', required: false },
                                            { key: 'name', label: '姓名', required: true },
                                            { key: 'traits', label: '特質', required: false },
                                            { key: 'comment', label: '評語', required: false },
                                        ].map(({ key, label, required }) => (
                                            <div key={key} className="flex items-center gap-3">
                                                <span className="w-16 font-bold text-[12.5px] text-[var(--ink)]">
                                                    {label}
                                                    {required && <span style={{ color: 'var(--coral)' }}>*</span>}
                                                </span>
                                                <select
                                                    value={columnMapping[key] ?? -1}
                                                    onChange={(e) => setColumnMapping(p => ({ ...p, [key]: parseInt(e.target.value) }))}
                                                    className="flex-1 px-3 h-9 b-ink r-btn font-medium text-[12.5px] bg-white outline-none focus:ring-2 focus:ring-honey-soft"
                                                    aria-label={`${label} 對應欄位`}
                                                >
                                                    <option value={-1}>-- 不匯入 --</option>
                                                    {importData.headers.map((header, idx) => (
                                                        <option key={idx} value={idx}>
                                                            {header || `欄位 ${idx + 1}`}
                                                        </option>
                                                    ))}
                                                </select>
                                                {columnMapping[key] >= 0 && (
                                                    <Check size={15} strokeWidth={2} style={{ color: 'var(--mint)' }} className="shrink-0" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 匯入模式 */}
                                <div className="b-ink sh-sm r-card bg-white p-4">
                                    <h4 className="font-black text-[13px] mb-3 uppercase tracking-wider text-[var(--ink-soft)]">
                                        匯入模式
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { val: 'append', label: '新增', desc: '保留現有學生', color: 'mint' },
                                            { val: 'replace', label: '取代', desc: '清除現有學生', color: 'coral' },
                                        ].map(opt => (
                                            <button
                                                key={opt.val}
                                                type="button"
                                                onClick={() => setImportMode(opt.val)}
                                                style={{
                                                    background: importMode === opt.val ? `var(--${opt.color}-soft)` : 'white',
                                                }}
                                                className="b-ink r-btn p-3 text-left btn-press"
                                                aria-pressed={importMode === opt.val}
                                            >
                                                <p className="font-black text-[13px]">{opt.label}</p>
                                                <p className="text-[11px] text-[var(--ink-soft)] mt-0.5">{opt.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {columnMapping.name < 0 && (
                                    <div
                                        className="b-ink r-btn p-3 flex items-center gap-2 text-[12.5px] font-bold"
                                        style={{ background: 'var(--coral-soft)', color: 'var(--coral)' }}
                                        role="alert"
                                    >
                                        <AlertCircle size={15} strokeWidth={1.8} />
                                        請至少指定「姓名」欄位
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Btn
                                        variant="outline"
                                        onClick={() => { setImportData(null); setColumnMapping({}); }}
                                        className="flex-1"
                                    >
                                        重新選擇
                                    </Btn>
                                    <Btn
                                        color="coral"
                                        onClick={handleImport}
                                        disabled={columnMapping.name < 0}
                                        className="flex-1"
                                        icon={<Upload size={15} strokeWidth={1.8} />}
                                    >
                                        確認匯入
                                    </Btn>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </ModalShell>
    );
};

export default ImportExportModal;
