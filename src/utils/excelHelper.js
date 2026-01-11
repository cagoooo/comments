/**
 * Excel 匯入/匯出工具
 * 使用 SheetJS (xlsx) 處理 Excel 檔案
 */
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * 解析 Excel 檔案
 * @param {File} file - Excel 檔案
 * @returns {Promise<Array>} 解析後的資料陣列
 */
export const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // 取得第一個工作表
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // 轉換為 JSON，header: 1 表示第一行是標題
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length < 2) {
                    reject(new Error('檔案內容為空或僅有標題列'));
                    return;
                }

                // 第一行是標題
                const headers = jsonData[0];
                const rows = jsonData.slice(1).filter(row => row.some(cell => cell)); // 過濾空行

                resolve({ headers, rows, sheetName });
            } catch (error) {
                reject(new Error('無法解析檔案，請確認是有效的 Excel 檔案'));
            }
        };

        reader.onerror = () => {
            reject(new Error('讀取檔案失敗'));
        };

        reader.readAsArrayBuffer(file);
    });
};

/**
 * 智慧欄位對應
 * @param {Array} headers - Excel 標題列
 * @returns {Object} 欄位對應
 */
export const guessColumnMapping = (headers) => {
    const mapping = {
        number: -1,  // 座號
        name: -1,    // 姓名
        traits: -1,  // 特質
        comment: -1  // 評語
    };

    const patterns = {
        number: ['座號', '學號', '編號', 'no', 'number', '號碼'],
        name: ['姓名', '名字', '學生', 'name', '名稱'],
        traits: ['特質', '特性', '性格', '優點', 'traits', '描述'],
        comment: ['評語', '評論', '評價', 'comment', '備註']
    };

    headers.forEach((header, index) => {
        if (!header) return;
        const lowerHeader = String(header).toLowerCase().trim();

        for (const [field, keywords] of Object.entries(patterns)) {
            if (keywords.some(kw => lowerHeader.includes(kw))) {
                mapping[field] = index;
            }
        }
    });

    return mapping;
};

/**
 * 將學生資料轉換為 Excel 格式
 * @param {Array} students - 學生資料陣列
 * @param {Object} options - 選項
 * @returns {ArrayBuffer} Excel 檔案 buffer
 */
export const studentsToExcel = (students, options = {}) => {
    const {
        includeNumber = true,
        includeName = true,
        includeTraits = true,
        includeComment = true,
        includeManualTraits = false
    } = options;

    // 建立資料陣列
    const data = [];

    // 標題列
    const headers = [];
    if (includeNumber) headers.push('座號');
    if (includeName) headers.push('姓名');
    if (includeTraits) headers.push('特質標籤');
    if (includeManualTraits) headers.push('自訂特質');
    if (includeComment) headers.push('評語');
    data.push(headers);

    // 資料列
    students.forEach((student, index) => {
        const row = [];
        if (includeNumber) row.push(student.number || index + 1);
        if (includeName) row.push(student.name || '');
        if (includeTraits) row.push((student.selectedTags || []).join('、'));
        if (includeManualTraits) row.push(student.manualTraits || '');
        if (includeComment) row.push(student.comment || '');
        data.push(row);
    });

    // 建立工作表
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // 設定欄寬
    worksheet['!cols'] = [
        { wch: 6 },   // 座號
        { wch: 10 },  // 姓名
        { wch: 30 },  // 特質
        { wch: 20 },  // 自訂特質
        { wch: 60 }   // 評語
    ];

    // 建立活頁簿
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '學生評語');

    // 產生 buffer
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
};

/**
 * 下載 Excel 檔案
 * @param {Array} students - 學生資料
 * @param {string} filename - 檔案名稱
 * @param {Object} options - 選項
 */
export const downloadExcel = (students, filename = '學生評語', options = {}) => {
    const buffer = studentsToExcel(students, options);
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    saveAs(blob, `${filename}.xlsx`);
};

/**
 * 產生匯入範本
 */
export const downloadTemplate = () => {
    const data = [
        ['座號', '姓名', '特質標籤', '自訂特質'],
        [1, '王小明', '認真、負責', '愛護小動物'],
        [2, '李小華', '活潑、熱心', ''],
        [3, '張大偉', '乖巧、勤勞', '音樂天賦'],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet['!cols'] = [
        { wch: 6 },
        { wch: 10 },
        { wch: 30 },
        { wch: 20 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '匯入範本');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    saveAs(blob, '學生資料匯入範本.xlsx');
};

export default {
    parseExcelFile,
    guessColumnMapping,
    studentsToExcel,
    downloadExcel,
    downloadTemplate
};
