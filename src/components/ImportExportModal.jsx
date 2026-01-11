import React, { useState, useCallback, useRef } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, Check, Loader2, FileDown } from 'lucide-react';
import { parseExcelFile, guessColumnMapping, downloadExcel, downloadTemplate } from '../utils/excelHelper';
import { useToast } from '../contexts/ToastContext';

/**
 * 匯入/匯出 Modal
 */
const ImportExportModal = ({
    isOpen,
    onClose,
    students,
    onImport,
    currentClassName = '學生資料'
}) => {
    const { toast } = useToast();
    const fileInputRef = useRef(null);

    // 狀態
    const [activeTab, setActiveTab] = useState('export'); // 'export' | 'import'
    const [isProcessing, setIsProcessing] = useState(false);

    // 匯出選項
    const [exportOptions, setExportOptions] = useState({
        includeNumber: true,
        includeName: true,
        includeTraits: true,
        includeManualTraits: true,
        includeComment: true
    });

    // 匯入狀態
    const [importData, setImportData] = useState(null);
    const [columnMapping, setColumnMapping] = useState({});
    const [importMode, setImportMode] = useState('append'); // 'append' | 'replace'

    // 拖拽狀態
    const [isDragOver, setIsDragOver] = useState(false);

    // 處理檔案選擇
    const handleFileSelect = async (file) => {
        if (!file) return;

        // 驗證檔案類型
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
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
        if (file) handleFileSelect(file);
    }, []);

    // 執行匯入
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
                comment: columnMapping.comment >= 0 ? String(row[columnMapping.comment] || '') : ''
            };
        }).filter(Boolean);

        if (newStudents.length === 0) {
            toast.error('沒有有效的學生資料');
            return;
        }

        onImport(newStudents, importMode);
        toast.success(`已匯入 ${newStudents.length} 位學生`);

        // 重置
        setImportData(null);
        setColumnMapping({});
        onClose();
    };

    // 執行匯出
    const handleExport = () => {
        if (students.length === 0) {
            toast.warning('沒有學生資料可匯出');
            return;
        }

        const filename = `${currentClassName}_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}`;
        downloadExcel(students, filename, exportOptions);
        toast.success(`已匯出 ${students.length} 位學生資料`);
    };

    // 下載範本
    const handleDownloadTemplate = () => {
        downloadTemplate();
        toast.info('範本下載完成');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4">
            <div className="card-pop w-full max-w-2xl max-h-[90vh] flex flex-col animate-in bg-[#FFF9E6]">
                {/* Header */}
                <div className="p-3 sm:p-5 bg-[#54A0FF] border-b-3 border-[#2D3436] flex items-center justify-between">
                    <h3 className="font-black text-white flex items-center gap-2 text-lg sm:text-xl">
                        <FileSpreadsheet size={24} />
                        Excel 匯入/匯出
                    </h3>
                    <button onClick={onClose} className="btn-pop p-2 bg-white text-[#2D3436]">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b-2 border-[#2D3436]">
                    <button
                        onClick={() => setActiveTab('export')}
                        className={`flex-1 py-3 px-4 font-bold flex items-center justify-center gap-2 transition-colors
                            ${activeTab === 'export'
                                ? 'bg-[#1DD1A1] text-white'
                                : 'bg-[#E8DCC8] text-[#636E72] hover:bg-[#FECA57]/30'}`}
                    >
                        <Download size={18} />
                        匯出
                    </button>
                    <button
                        onClick={() => setActiveTab('import')}
                        className={`flex-1 py-3 px-4 font-bold flex items-center justify-center gap-2 transition-colors
                            ${activeTab === 'import'
                                ? 'bg-[#FF6B9D] text-white'
                                : 'bg-[#E8DCC8] text-[#636E72] hover:bg-[#FECA57]/30'}`}
                    >
                        <Upload size={18} />
                        匯入
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {activeTab === 'export' ? (
                        /* 匯出面板 */
                        <div className="space-y-4">
                            <div className="bg-white border-2 border-[#2D3436] rounded-lg p-4">
                                <h4 className="font-bold text-[#2D3436] mb-3">選擇匯出欄位</h4>
                                <div className="space-y-2">
                                    {[
                                        { key: 'includeNumber', label: '座號' },
                                        { key: 'includeName', label: '姓名' },
                                        { key: 'includeTraits', label: '特質標籤' },
                                        { key: 'includeManualTraits', label: '自訂特質' },
                                        { key: 'includeComment', label: '評語' }
                                    ].map(({ key, label }) => (
                                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={exportOptions[key]}
                                                onChange={(e) => setExportOptions(prev => ({
                                                    ...prev,
                                                    [key]: e.target.checked
                                                }))}
                                                className="w-5 h-5 rounded border-2 border-[#2D3436] accent-[#1DD1A1]"
                                            />
                                            <span className="font-medium text-[#2D3436]">{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-[#1DD1A1]/20 border-2 border-[#1DD1A1] rounded-lg p-4 text-sm text-[#2D3436]">
                                <p className="font-bold mb-1">📊 匯出資訊</p>
                                <p>將匯出 <strong>{students.length}</strong> 位學生的資料</p>
                                <p>班級：<strong>{currentClassName}</strong></p>
                            </div>

                            <button
                                onClick={handleExport}
                                disabled={students.length === 0}
                                className="btn-pop w-full py-4 bg-[#1DD1A1] text-white font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Download size={20} />
                                匯出 Excel
                            </button>
                        </div>
                    ) : (
                        /* 匯入面板 */
                        <div className="space-y-4">
                            {!importData ? (
                                <>
                                    {/* 上傳區 */}
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`border-3 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                                            ${isDragOver
                                                ? 'border-[#FF6B9D] bg-[#FF6B9D]/10'
                                                : 'border-[#636E72] hover:border-[#FF6B9D] hover:bg-[#FECA57]/10'}`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".xlsx,.xls,.csv"
                                            onChange={(e) => handleFileSelect(e.target.files[0])}
                                            className="hidden"
                                        />

                                        {isProcessing ? (
                                            <Loader2 size={48} className="mx-auto text-[#FF6B9D] animate-spin" />
                                        ) : (
                                            <Upload size={48} className="mx-auto text-[#636E72] mb-3" />
                                        )}

                                        <p className="font-bold text-[#2D3436] mb-1">
                                            {isDragOver ? '放開以上傳檔案' : '點擊或拖拽上傳 Excel 檔案'}
                                        </p>
                                        <p className="text-sm text-[#636E72]">
                                            支援 .xlsx、.xls、.csv 格式
                                        </p>
                                    </div>

                                    {/* 下載範本 */}
                                    <button
                                        onClick={handleDownloadTemplate}
                                        className="btn-pop w-full py-3 bg-[#54A0FF] text-white font-bold flex items-center justify-center gap-2"
                                    >
                                        <FileDown size={18} />
                                        下載匯入範本
                                    </button>
                                </>
                            ) : (
                                /* 欄位對應設定 */
                                <>
                                    <div className="bg-[#54A0FF]/20 border-2 border-[#54A0FF] rounded-lg p-3 text-sm">
                                        <p className="font-bold text-[#2D3436]">
                                            📄 {importData.fileName}
                                        </p>
                                        <p className="text-[#636E72]">
                                            共 {importData.rows.length} 筆資料
                                        </p>
                                    </div>

                                    <div className="bg-white border-2 border-[#2D3436] rounded-lg p-4">
                                        <h4 className="font-bold text-[#2D3436] mb-3">欄位對應</h4>
                                        <div className="space-y-3">
                                            {[
                                                { key: 'number', label: '座號', required: false },
                                                { key: 'name', label: '姓名', required: true },
                                                { key: 'traits', label: '特質', required: false },
                                                { key: 'comment', label: '評語', required: false }
                                            ].map(({ key, label, required }) => (
                                                <div key={key} className="flex items-center gap-3">
                                                    <span className="w-20 font-medium text-[#2D3436]">
                                                        {label}
                                                        {required && <span className="text-[#FF6B6B]">*</span>}
                                                    </span>
                                                    <select
                                                        value={columnMapping[key] ?? -1}
                                                        onChange={(e) => setColumnMapping(prev => ({
                                                            ...prev,
                                                            [key]: parseInt(e.target.value)
                                                        }))}
                                                        className="flex-1 p-2 border-2 border-[#2D3436] rounded-lg font-medium"
                                                    >
                                                        <option value={-1}>-- 不匯入 --</option>
                                                        {importData.headers.map((header, index) => (
                                                            <option key={index} value={index}>
                                                                {header || `欄位 ${index + 1}`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {columnMapping[key] >= 0 && (
                                                        <Check size={18} className="text-[#1DD1A1]" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white border-2 border-[#2D3436] rounded-lg p-4">
                                        <h4 className="font-bold text-[#2D3436] mb-3">匯入模式</h4>
                                        <div className="flex gap-3">
                                            <label className="flex-1">
                                                <input
                                                    type="radio"
                                                    name="importMode"
                                                    value="append"
                                                    checked={importMode === 'append'}
                                                    onChange={(e) => setImportMode(e.target.value)}
                                                    className="sr-only"
                                                />
                                                <div className={`p-3 border-2 rounded-lg cursor-pointer transition-all
                                                    ${importMode === 'append'
                                                        ? 'border-[#1DD1A1] bg-[#1DD1A1]/20'
                                                        : 'border-[#636E72]'}`}
                                                >
                                                    <p className="font-bold text-[#2D3436]">新增</p>
                                                    <p className="text-xs text-[#636E72]">保留現有學生</p>
                                                </div>
                                            </label>
                                            <label className="flex-1">
                                                <input
                                                    type="radio"
                                                    name="importMode"
                                                    value="replace"
                                                    checked={importMode === 'replace'}
                                                    onChange={(e) => setImportMode(e.target.value)}
                                                    className="sr-only"
                                                />
                                                <div className={`p-3 border-2 rounded-lg cursor-pointer transition-all
                                                    ${importMode === 'replace'
                                                        ? 'border-[#FF6B6B] bg-[#FF6B6B]/20'
                                                        : 'border-[#636E72]'}`}
                                                >
                                                    <p className="font-bold text-[#2D3436]">取代</p>
                                                    <p className="text-xs text-[#636E72]">清除現有學生</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {columnMapping.name < 0 && (
                                        <div className="bg-[#FF6B6B]/20 border-2 border-[#FF6B6B] rounded-lg p-3 flex items-center gap-2 text-sm text-[#FF6B6B]">
                                            <AlertCircle size={18} />
                                            請至少指定「姓名」欄位
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setImportData(null);
                                                setColumnMapping({});
                                            }}
                                            className="btn-pop flex-1 py-3 bg-[#636E72] text-white font-bold"
                                        >
                                            重新選擇
                                        </button>
                                        <button
                                            onClick={handleImport}
                                            disabled={columnMapping.name < 0}
                                            className="btn-pop flex-1 py-3 bg-[#FF6B9D] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <Upload size={18} />
                                            確認匯入
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportExportModal;
