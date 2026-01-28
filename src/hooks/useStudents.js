import { useState, useCallback, useEffect } from 'react';
import { studentService, setCurrentUserId } from '../firebase';

/**
 * 學生資料管理 Hook（整合 Firebase）
 * 提供學生資料的 CRUD 操作，即時同步至 Firestore
 * @param {string} userId - 當前使用者 ID，用於資料隔離
 */
export const useStudents = (userId) => {
    const [students, setStudents] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    // 訂閱 Firestore 即時更新
    useEffect(() => {
        // 如果沒有 userId，不進行訂閱
        if (!userId) {
            setStudents([]);
            setIsLoading(false);
            return;
        }

        // 設定當前使用者 ID（用於資料隔離）
        setCurrentUserId(userId);

        setIsLoading(true);
        const unsubscribe = studentService.subscribe((data) => {
            // 將 Firestore 資料轉換為本地格式
            const formattedData = data.map(student => ({
                ...student,
                id: parseInt(student.id) || student.id,
                selectedTags: student.selectedTags || [],
                manualTraits: student.manualTraits || '',
                comment: student.comment || ''
            }));
            setStudents(formattedData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    // 從原始輸入產生學生並儲存至 Firebase
    const generateStudents = useCallback(async (rawInput) => {
        const lines = rawInput.split('\n').map(line => line.trim()).filter(line => line !== '');
        if (lines.length === 0) return [];

        const newStudents = lines.map((name, index) => ({
            id: Date.now() + index,
            name: name,
            selectedTags: [],
            manualTraits: "",
            comment: "",
        }));

        setIsSyncing(true);
        try {
            await studentService.addBatch(newStudents);
        } catch (error) {
            console.error('新增學生失敗:', error);
        }
        setIsSyncing(false);

        return newStudents;
    }, []);

    // 更新單一學生欄位
    const updateStudent = useCallback(async (id, field, value) => {
        // 先更新本地狀態（樂觀更新）
        setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));

        // 同步到 Firebase
        try {
            const student = students.find(s => s.id === id);
            if (student) {
                await studentService.update(id, { ...student, [field]: value });
            }
        } catch (error) {
            console.error('更新學生失敗:', error);
        }
    }, [students]);

    // 刪除單一學生
    const deleteStudent = useCallback(async (id) => {
        setStudents(prev => prev.filter(s => s.id !== id));
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });

        try {
            await studentService.delete(id);
        } catch (error) {
            console.error('刪除學生失敗:', error);
        }
    }, []);

    // 刪除已選學生
    const deleteSelected = useCallback(async () => {
        const idsToDelete = Array.from(selectedIds);
        setStudents(prev => prev.filter(s => !selectedIds.has(s.id)));
        setSelectedIds(new Set());

        try {
            await studentService.deleteBatch(idsToDelete);
        } catch (error) {
            console.error('批次刪除學生失敗:', error);
        }
    }, [selectedIds]);

    // 清空所有學生
    const resetStudents = useCallback(async () => {
        setStudents([]);
        setSelectedIds(new Set());

        try {
            await studentService.deleteAll();
        } catch (error) {
            console.error('清空學生失敗:', error);
        }
    }, []);

    // 切換單一選擇
    const toggleSelection = useCallback((id) => {
        setSelectedIds(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(id)) newSelected.delete(id);
            else newSelected.add(id);
            return newSelected;
        });
    }, []);

    // 全選/取消全選
    const toggleAllSelection = useCallback(() => {
        if (selectedIds.size === students.length && students.length > 0) {
            setSelectedIds(new Set());
        } else {
            const allIds = new Set(students.map(s => s.id));
            setSelectedIds(allIds);
        }
    }, [selectedIds.size, students]);

    // 加入標籤到指定學生
    const addTagToStudents = useCallback(async (targetIds, idiom) => {
        // 樂觀更新
        setStudents(prev => prev.map(s => {
            if (targetIds.includes(s.id)) {
                if (s.selectedTags.includes(idiom)) return s;
                return { ...s, selectedTags: [...s.selectedTags, idiom] };
            }
            return s;
        }));

        // 同步到 Firebase
        try {
            for (const id of targetIds) {
                const student = students.find(s => s.id === id);
                if (student && !student.selectedTags.includes(idiom)) {
                    await studentService.update(id, {
                        selectedTags: [...student.selectedTags, idiom]
                    });
                }
            }
        } catch (error) {
            console.error('新增標籤失敗:', error);
        }
    }, [students]);

    // 移除標籤
    const removeTag = useCallback(async (studentId, tagToRemove) => {
        // 樂觀更新
        setStudents(prev => prev.map(s => {
            if (s.id === studentId) {
                return { ...s, selectedTags: s.selectedTags.filter(t => t !== tagToRemove) };
            }
            return s;
        }));

        // 同步到 Firebase
        try {
            const student = students.find(s => s.id === studentId);
            if (student) {
                await studentService.update(studentId, {
                    selectedTags: student.selectedTags.filter(t => t !== tagToRemove)
                });
            }
        } catch (error) {
            console.error('移除標籤失敗:', error);
        }
    }, [students]);

    // 直接設定學生（用於 AI 生成評語時）
    const setStudentsDirectly = useCallback((updater) => {
        setStudents(prev => {
            const newStudents = typeof updater === 'function' ? updater(prev) : updater;
            return newStudents;
        });
    }, []);

    // 同步評語到 Firebase
    const syncComment = useCallback(async (studentId, comment) => {
        try {
            await studentService.update(studentId, { comment });
        } catch (error) {
            console.error('同步評語失敗:', error);
        }
    }, []);

    return {
        students,
        setStudents: setStudentsDirectly,
        selectedIds,
        isLoading,
        isSyncing,
        generateStudents,
        updateStudent,
        deleteStudent,
        deleteSelected,
        resetStudents,
        toggleSelection,
        toggleAllSelection,
        addTagToStudents,
        removeTag,
        syncComment
    };
};

export default useStudents;
