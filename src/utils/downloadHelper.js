/**
 * 下載輔助函數
 * 提供 TXT 與 CSV 格式的學生評語匯出功能
 */

/**
 * 下載學生評語資料
 * @param {Array} students - 學生資料陣列
 * @param {'txt'|'csv'} format - 下載格式
 */
export const downloadComments = (students, format) => {
    let content = "";

    if (format === 'csv') {
        // CSV 格式：加入 BOM 確保 Excel 正確顯示中文
        content = "\uFEFF姓名,特質,評語\n";
        students.forEach(s => {
            const combined = [...s.selectedTags, s.manualTraits].filter(Boolean).join('、');
            const safeTraits = combined.replace(/,/g, '，');
            const safeComment = s.comment.replace(/,/g, '，').replace(/\n/g, ' ');
            content += `${s.name},"${safeTraits}","${safeComment}"\n`;
        });
    } else {
        // TXT 格式
        students.forEach(s => {
            const combined = [...s.selectedTags, s.manualTraits].filter(Boolean).join('、');
            content += `【${s.name}】\n特質：${combined || '無'}\n評語：\n${s.comment}\n-------------------\n`;
        });
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `學生評語_${new Date().toLocaleDateString()}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
};

export default downloadComments;
