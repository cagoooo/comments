import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';

// Data
import { IDIOM_CATEGORIES } from './data/idiomData';
import { STYLE_DEFINITIONS } from './data/styleDefinitions';

// Utils
import { callGeminiAPI, hasApiKey, adjustComment } from './utils/geminiApi';

// Context
import { useToast } from './contexts/ToastContext';
import { downloadComments } from './utils/downloadHelper';

// Hooks
import { useDialog } from './hooks/useDialog';
import { useStudents } from './hooks/useStudents';

// Components (核心元件 - 同步載入)
import Header from './components/Header';
import Footer from './components/Footer';
import MobileTabBar from './components/MobileTabBar';
import Dialog from './components/Dialog';
import LoadingOverlay from './components/LoadingOverlay';
import InputPanel from './components/InputPanel';
import GeneratePanel from './components/GeneratePanel';
import StyleBar from './components/StyleBar';
import StudentTable from './components/StudentTable';
import IdiomSidebar from './components/IdiomSidebar';
import DataLoading from './components/DataLoading';
import InstallPrompt from './components/InstallPrompt';
import LazyLoading from './components/LazyLoading';
import SearchBar from './components/SearchBar';

// Lazy Components (Modal 元件 - 動態載入)
const StyleModal = lazy(() => import('./components/StyleModal'));
const ApiKeyModal = lazy(() => import('./components/ApiKeyModal'));
const TemplateModal = lazy(() => import('./components/TemplateModal'));
const ClassModal = lazy(() => import('./components/ClassModal'));
const HistoryModal = lazy(() => import('./components/HistoryModal'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const ImportExportModal = lazy(() => import('./components/ImportExportModal'));
const PrintModal = lazy(() => import('./components/PrintModal'));
const DashboardModal = lazy(() => import('./components/DashboardModal'));

// Firebase
import { templateService, classService, historyService, settingsService, adminConfigService, userService, USER_ROLES, studentService } from './firebase';

/**
 * 點石成金蜂🐝 - AI 評語產生器
 * 主應用元件
 */
const App = ({ currentUser, onLogout, isAdmin }) => {
    // --- Toast Hook ---
    const { toast } = useToast();

    // --- 對話框 Hook ---
    const { dialog, closeDialog, showConfirm, showAlert } = useDialog();

    // --- 管理員面板 ---
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

    // --- 學生資料 Hook (Firebase 同步，使用者資料隔離) ---
    const {
        students,
        setStudents,
        selectedIds,
        isLoading,
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
    } = useStudents(currentUser?.uid);

    // --- 本地狀態 ---
    const [rawInput, setRawInput] = useState("王小明\n李大華\n張美麗");
    const [numberCount, setNumberCount] = useState(30);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [focusedStudentId, setFocusedStudentId] = useState(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [isMobile, setIsMobile] = useState(false);

    // 風格設定
    const [globalStyles, setGlobalStyles] = useState(['qualitative']);
    const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);

    // API Key 設定
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [apiKeyConfigured, setApiKeyConfigured] = useState(hasApiKey());

    // 額外條件設定
    const [extraSettings, setExtraSettings] = useState({
        tone: 'normal',
        wordCount: 80
    });

    // 單一學生生成狀態
    const [isGeneratingSingle, setIsGeneratingSingle] = useState(null);

    // 評語調整狀態
    const [adjustingStudentId, setAdjustingStudentId] = useState(null);

    // 範本庫
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templateCount, setTemplateCount] = useState(0);

    // 班級管理
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [currentClassId, setCurrentClassId] = useState(null);
    const [currentClassName, setCurrentClassName] = useState('全部學生');
    const [classes, setClasses] = useState([]);

    // 歷史記錄
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyStudent, setHistoryStudent] = useState(null);

    // Excel 匯入/匯出
    const [isImportExportOpen, setIsImportExportOpen] = useState(false);

    // 列印與 PDF 匯出
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    // 班級統計儀表板
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);

    // 待審核用戶數量（管理員用）
    const [pendingCount, setPendingCount] = useState(0);

    // 查看其他用戶學生（管理員用）
    const [viewingUser, setViewingUser] = useState(null);
    const [viewingStudents, setViewingStudents] = useState([]);

    // 搜尋與篩選
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFilters, setSearchFilters] = useState({
        hasComment: null,  // true: 有評語, false: 無評語, null: 不篩選
        hasTag: null       // true: 有標籤, false: 無標籤, null: 不篩選
    });

    // 計算篩選後的學生列表
    const filteredStudents = useMemo(() => {
        const sourceStudents = viewingUser ? viewingStudents : students;

        return sourceStudents.filter(student => {
            // 搜尋篩選
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchName = student.name?.toLowerCase().includes(query);
                const matchTag = student.selectedTags?.some(tag => tag.toLowerCase().includes(query));
                const matchComment = student.comment?.toLowerCase().includes(query);
                const matchManual = student.manualTraits?.toLowerCase().includes(query);

                if (!matchName && !matchTag && !matchComment && !matchManual) {
                    return false;
                }
            }

            // 評語篩選
            if (searchFilters.hasComment !== null) {
                const hasComment = student.comment && student.comment.trim() && !student.comment.includes('❌');
                if (searchFilters.hasComment && !hasComment) return false;
                if (!searchFilters.hasComment && hasComment) return false;
            }

            // 標籤篩選
            if (searchFilters.hasTag !== null) {
                const hasTag = student.selectedTags && student.selectedTags.length > 0;
                if (searchFilters.hasTag && !hasTag) return false;
                if (!searchFilters.hasTag && hasTag) return false;
            }

            return true;
        });
    }, [students, viewingStudents, viewingUser, searchQuery, searchFilters]);

    // 從 Firebase 同步 API Key 到 localStorage（使用者隔離 + 共享 API Key 支援）
    useEffect(() => {
        if (!currentUser) {
            // 用戶登出時清除 API Key
            localStorage.removeItem('gemini_api_key');
            setApiKeyConfigured(false);
            return;
        }

        // 切換用戶時，先清除舊的 API Key，避免用到別人的
        localStorage.removeItem('gemini_api_key');
        setApiKeyConfigured(false);

        // 先檢查是否有共享 API Key 授權
        const checkSharedApiKey = async () => {
            try {
                const sharedKey = await adminConfigService.getSharedApiKey(currentUser.uid);
                if (sharedKey) {
                    localStorage.setItem('gemini_api_key', sharedKey);
                    setApiKeyConfigured(true);
                    return true;
                }
            } catch (error) {
                console.error('檢查共享 API Key 失敗:', error);
            }
            return false;
        };

        checkSharedApiKey().then((hasShared) => {
            // 如果沒有共享授權，則訂閱個人設定
            if (!hasShared) {
                const unsubscribe = settingsService.subscribe((settings) => {
                    if (settings?.apiKey) {
                        localStorage.setItem('gemini_api_key', settings.apiKey);
                        setApiKeyConfigured(true);
                    } else {
                        // 該用戶沒有設定 API Key
                        localStorage.removeItem('gemini_api_key');
                        setApiKeyConfigured(false);
                    }
                });
                return () => unsubscribe();
            }
        });
    }, [currentUser]);

    // 訂閱範本數量
    useEffect(() => {
        const unsubscribe = templateService.subscribe((templates) => {
            setTemplateCount(templates.length);
        });
        return () => unsubscribe();
    }, []);

    // 訂閱班級列表
    useEffect(() => {
        const unsubscribe = classService.subscribe((data) => {
            setClasses(data);
            // 更新當前班級名稱
            if (currentClassId) {
                const cls = data.find(c => c.id === currentClassId);
                setCurrentClassName(cls ? cls.name : '全部學生');
            }
        });
        return () => unsubscribe();
    }, [currentClassId]);

    // 訂閱待審核用戶數量（僅管理員）
    useEffect(() => {
        if (!isAdmin) {
            setPendingCount(0);
            return;
        }

        const unsubscribe = userService.subscribeAll((users) => {
            const pending = users.filter(u =>
                u.role === USER_ROLES.PENDING_REVIEW || u.role === USER_ROLES.PENDING
            );
            setPendingCount(pending.length);
        });
        return () => unsubscribe();
    }, [isAdmin]);

    // 訂閱正在查看的用戶學生資料（管理員用）
    useEffect(() => {
        if (!viewingUser) {
            setViewingStudents([]);
            return;
        }

        const unsubscribe = studentService.subscribeByUserId(viewingUser.id, (data) => {
            const formattedData = data.map(student => ({
                ...student,
                id: parseInt(student.id) || student.id,
                selectedTags: student.selectedTags || [],
                manualTraits: student.manualTraits || '',
                comment: student.comment || ''
            }));
            setViewingStudents(formattedData);
        });

        return () => unsubscribe();
    }, [viewingUser]);

    // 管理員查看模式下的選取狀態
    const [viewingSelectedIds, setViewingSelectedIds] = useState(new Set());
    // 管理員查看模式下的聚焦學生
    const [viewingFocusedStudentId, setViewingFocusedStudentId] = useState(null);

    // 處理管理員查看其他用戶學生
    const handleViewUserStudents = (user) => {
        setViewingUser(user);
        setViewingSelectedIds(new Set());
        setViewingFocusedStudentId(null);
    };

    // 返回自己的學生資料
    const handleBackToMyStudents = () => {
        setViewingUser(null);
        setViewingSelectedIds(new Set());
        setViewingFocusedStudentId(null);
    };

    // ===== 管理員編輯其他用戶學生的函數 =====

    // 切換查看模式下的選取
    const toggleViewingSelection = (id) => {
        setViewingSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // 全選/取消全選（查看模式）
    const toggleViewingAllSelection = () => {
        if (viewingSelectedIds.size === viewingStudents.length && viewingStudents.length > 0) {
            setViewingSelectedIds(new Set());
        } else {
            setViewingSelectedIds(new Set(viewingStudents.map(s => s.id)));
        }
    };

    // 更新查看中用戶的學生
    const updateViewingStudent = async (id, field, value) => {
        if (!viewingUser) return;

        // 樂觀更新本地狀態
        setViewingStudents(prev => prev.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ));

        // 同步到 Firebase
        try {
            const student = viewingStudents.find(s => s.id === id);
            if (student) {
                await studentService.updateByUserId(viewingUser.id, id, { ...student, [field]: value });
            }
        } catch (error) {
            console.error('管理員更新學生失敗:', error);
        }
    };

    // 移除查看中用戶學生的標籤
    const removeViewingTag = async (studentId, tagToRemove) => {
        if (!viewingUser) return;

        const student = viewingStudents.find(s => s.id === studentId);
        if (!student) return;

        const newTags = student.selectedTags.filter(t => t !== tagToRemove);

        // 樂觀更新
        setViewingStudents(prev => prev.map(s =>
            s.id === studentId ? { ...s, selectedTags: newTags } : s
        ));

        // 同步到 Firebase
        try {
            await studentService.updateByUserId(viewingUser.id, studentId, { selectedTags: newTags });
        } catch (error) {
            console.error('管理員移除標籤失敗:', error);
        }
    };

    // 刪除查看中用戶的學生
    const deleteViewingStudent = async (id) => {
        if (!viewingUser) return;

        // 樂觀更新
        setViewingStudents(prev => prev.filter(s => s.id !== id));
        setViewingSelectedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });

        // 同步到 Firebase
        try {
            await studentService.deleteByUserId(viewingUser.id, id);
        } catch (error) {
            console.error('管理員刪除學生失敗:', error);
        }
    };

    // 刪除查看模式下的已選學生
    const deleteViewingSelected = async () => {
        if (!viewingUser || viewingSelectedIds.size === 0) return;

        const idsToDelete = Array.from(viewingSelectedIds);

        // 樂觀更新
        setViewingStudents(prev => prev.filter(s => !viewingSelectedIds.has(s.id)));
        setViewingSelectedIds(new Set());

        // 同步到 Firebase
        try {
            for (const id of idsToDelete) {
                await studentService.deleteByUserId(viewingUser.id, id);
            }
        } catch (error) {
            console.error('管理員批次刪除學生失敗:', error);
        }
    };

    // 為查看模式的學生加入標籤
    const addTagToViewingStudents = async (studentIds, tag) => {
        if (!viewingUser || studentIds.length === 0) return;

        // 樂觀更新
        setViewingStudents(prev => prev.map(student => {
            if (studentIds.includes(student.id)) {
                const newTags = student.selectedTags.includes(tag)
                    ? student.selectedTags
                    : [...student.selectedTags, tag];
                return { ...student, selectedTags: newTags };
            }
            return student;
        }));

        // 同步到 Firebase
        try {
            for (const id of studentIds) {
                const student = viewingStudents.find(s => s.id === id);
                if (student && !student.selectedTags.includes(tag)) {
                    const newTags = [...student.selectedTags, tag];
                    await studentService.updateByUserId(viewingUser.id, id, { selectedTags: newTags });
                }
            }
        } catch (error) {
            console.error('管理員加入標籤失敗:', error);
        }
    };

    // 成語分類展開狀態
    const [expandedCategories, setExpandedCategories] = useState({
        "資賦 (優)": true,
        "學業 (優)": true,
    });

    // 偵測螢幕尺寸
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);



    // --- 功能函數 ---

    // 產生學生名單
    const handleGenerateStudents = () => {
        if (!rawInput.trim()) return;
        generateStudents(rawInput);
        setRawInput("");
    };

    // 產生座號
    const handleGenerateNumbers = () => {
        if (numberCount < 1) return;
        const numbers = [];
        for (let i = 1; i <= numberCount; i++) {
            const numStr = i < 10 ? `0${i}` : `${i}`;
            numbers.push(`${numStr}號`);
        }
        const numbersText = numbers.join('\n');
        setRawInput(prev => prev ? `${prev}\n${numbersText}` : numbersText);
    };

    // 清空列表
    const handleResetList = () => {
        showConfirm("清空確認", "確定要清空所有學生資料嗎？此操作無法復原。", () => {
            resetStudents();
            closeDialog();
        });
    };

    // 刪除已選
    const handleDeleteSelected = () => {
        if (selectedIds.size === 0) return;
        showConfirm("刪除確認", `確定要刪除選取的 ${selectedIds.size} 位學生資料嗎？`, () => {
            deleteSelected();
            closeDialog();
        });
    };

    // 點擊成語
    const handleIdiomClick = (idiom) => {
        let targetIds = [];

        // 根據是否在查看模式決定使用哪組狀態
        if (viewingUser) {
            // 管理員查看模式
            if (viewingSelectedIds.size > 0) {
                targetIds = Array.from(viewingSelectedIds);
            } else if (viewingFocusedStudentId) {
                targetIds = [viewingFocusedStudentId];
            }

            if (targetIds.length === 0) {
                showAlert("請先點選某位學生的「標籤區」，或勾選學生，再點擊成語加入。");
                return;
            }

            addTagToViewingStudents(targetIds, idiom);
        } else {
            // 一般模式
            if (selectedIds.size > 0) {
                targetIds = Array.from(selectedIds);
            } else if (focusedStudentId) {
                targetIds = [focusedStudentId];
            }

            if (targetIds.length === 0) {
                showAlert("請先點選某位學生的「標籤區」，或勾選學生，再點擊成語加入。");
                return;
            }

            addTagToStudents(targetIds, idiom);
        }
    };

    // 切換成語分類
    const toggleCategory = (cat) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    // 切換風格
    const toggleGlobalStyle = (styleId) => {
        setGlobalStyles(prevStyles => {
            const isSelected = prevStyles.includes(styleId);
            if (isSelected) {
                return prevStyles.filter(id => id !== styleId);
            } else {
                if (prevStyles.length >= 2) return prevStyles;
                return [...prevStyles, styleId];
            }
        });
    };

    // 批次生成評語（整合 Firebase 同步）
    const handleBatchGenerate = async (onlySelected = false) => {
        setIsGenerating(true);
        const studentsToProcess = students.filter(s => onlySelected ? selectedIds.has(s.id) : true);
        const total = studentsToProcess.length;

        if (total === 0) {
            setIsGenerating(false);
            return;
        }

        setProgress({ current: 0, total });

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < total; i++) {
            const student = studentsToProcess[i];

            // 清空當前評語
            setStudents(prev => prev.map(s =>
                s.id === student.id ? { ...s, comment: "" } : s
            ));

            const combinedTraits = [
                ...student.selectedTags,
                student.manualTraits
            ].filter(Boolean).join("、");

            const aiComment = await callGeminiAPI(student.name, combinedTraits, globalStyles, extraSettings);

            // 更新本地狀態
            setStudents(prev => prev.map(s =>
                s.id === student.id ? { ...s, comment: aiComment } : s
            ));

            // 同步評語到 Firebase
            await syncComment(student.id, aiComment);

            // 統計成功與失敗
            if (aiComment.includes("❌")) {
                errorCount++;
            } else {
                successCount++;
            }

            setProgress(prev => ({ ...prev, current: i + 1 }));
        }

        setIsGenerating(false);
        setProgress({ current: 0, total: 0 });

        // Toast 通知 - 根據結果顯示不同類型
        if (errorCount > 0 && successCount === 0) {
            // 全部失敗
            toast.error(`生成失敗，請先設定 API Key`);
        } else if (errorCount > 0) {
            // 部分失敗
            toast.warning(`完成 ${successCount} 位，${errorCount} 位失敗`);
        } else {
            // 全部成功
            toast.success(`✨ 已完成 ${total} 位學生的評語生成！`);
        }
    };

    // 下載處理（支援管理員檢視模式）
    const handleDownload = (format) => {
        // 使用 filteredStudents 以支援管理員查看其他用戶學生時的匯出
        downloadComments(filteredStudents, format);
    };

    // 單一學生即時生成
    const handleSingleGenerate = async (studentId) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        setIsGeneratingSingle(studentId);

        // 先儲存舊評語到歷史（如果有的話）
        if (student.comment && !student.comment.includes("❌")) {
            try {
                await historyService.add(studentId, student.comment, globalStyles);
            } catch (e) {
                console.error('儲存歷史失敗:', e);
            }
        }

        const combinedTraits = [
            ...student.selectedTags,
            student.manualTraits
        ].filter(Boolean).join("、");

        const aiComment = await callGeminiAPI(student.name, combinedTraits, globalStyles, extraSettings);

        // 更新本地狀態
        setStudents(prev => prev.map(s =>
            s.id === studentId ? { ...s, comment: aiComment } : s
        ));

        // 同步到 Firebase
        await syncComment(studentId, aiComment);

        setIsGeneratingSingle(null);

        // Toast 通知 - 根據結果顯示不同類型
        if (aiComment.includes("❌")) {
            toast.error(`${student.name}：${aiComment.replace("❌ ", "")}`);
        } else {
            toast.success(`✨ ${student.name} 的評語已生成！`);
        }
    };

    // 管理員查看模式下的單一學生即時生成
    const handleViewingSingleGenerate = async (studentId) => {
        if (!viewingUser) return;

        const student = viewingStudents.find(s => s.id === studentId);
        if (!student) return;

        setIsGeneratingSingle(studentId);

        const combinedTraits = [
            ...student.selectedTags,
            student.manualTraits
        ].filter(Boolean).join("、");

        const aiComment = await callGeminiAPI(student.name, combinedTraits, globalStyles, extraSettings);

        // 更新本地狀態
        setViewingStudents(prev => prev.map(s =>
            s.id === studentId ? { ...s, comment: aiComment } : s
        ));

        // 同步到 Firebase
        try {
            await studentService.updateByUserId(viewingUser.id, studentId, { comment: aiComment });
        } catch (error) {
            console.error('管理員同步評語失敗:', error);
        }

        setIsGeneratingSingle(null);

        // Toast 通知
        if (aiComment.includes("❌")) {
            toast.error(`${student.name}：${aiComment.replace("❌ ", "")}`);
        } else {
            toast.success(`✨ ${student.name} 的評語已生成！`);
        }
    };

    // 儲存評語為範本
    const handleSaveTemplate = async (student) => {
        try {
            await templateService.add({
                content: student.comment,
                studentName: student.name,
                tags: student.selectedTags,
                styles: globalStyles
            });
            toast.success("❤️ 評語已收藏到範本庫！");
        } catch (error) {
            console.error('儲存範本失敗:', error);
            toast.error('儲存範本失敗，請稍後再試');
        }
    };

    // 套用範本到當前聚焦的學生
    const handleApplyTemplate = (content) => {
        if (focusedStudentId) {
            updateStudent(focusedStudentId, 'comment', content);
            syncComment(focusedStudentId, content);
        }
    };

    // 調整評語（縮短/擴展/換說法）
    const handleAdjustComment = async (studentId, adjustType, tone) => {
        const student = students.find(s => s.id === studentId);
        if (!student || !student.comment) return;

        setAdjustingStudentId(studentId);

        // 先儲存舊評語到歷史
        if (!student.comment.includes("❌")) {
            try {
                await historyService.add(studentId, student.comment, globalStyles);
            } catch (e) {
                console.error('儲存歷史失敗:', e);
            }
        }

        const adjustedComment = await adjustComment(student.comment, adjustType, tone);

        // 更新本地狀態
        setStudents(prev => prev.map(s =>
            s.id === studentId ? { ...s, comment: adjustedComment } : s
        ));

        // 同步到 Firebase
        await syncComment(studentId, adjustedComment);

        setAdjustingStudentId(null);

        // Toast 通知
        if (adjustedComment.includes("❌")) {
            toast.error(`${student.name}：${adjustedComment.replace("❌ ", "")}`);
        } else {
            const typeLabels = { shorter: '精簡', detailed: '詳細', rephrase: '改寫' };
            toast.success(`✨ ${student.name} 的評語已${typeLabels[adjustType] || '調整'}！`);
        }
    };

    // 處理 Excel 匯入
    const handleImportStudents = async (newStudents, mode) => {
        if (mode === 'replace') {
            // 取代模式：先清空再新增
            await clearAllStudents();
        }

        // 批次新增學生
        for (const student of newStudents) {
            await addStudent(student.name, student.selectedTags, student.comment);
        }
    };

    // 全域搜尋 ref（給 ⌘K 用）
    const searchBarRef = React.useRef(null);

    // 鍵盤快捷鍵 (移至此處以確保依賴函數已定義)
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+S: 儲存 (顯示提示，因為是自動儲存)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                toast.success("💾 系統已自動儲存您的變更");
            }

            // Ctrl+G: 生成評語
            if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
                e.preventDefault();
                if (isGenerating) return;

                if (focusedStudentId) {
                    handleSingleGenerate(focusedStudentId);
                } else {
                    const hasSelection = selectedIds.size > 0;
                    handleBatchGenerate(hasSelection);
                }
            }

            // Ctrl+K / Cmd+K: 聚焦搜尋框
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchBarRef.current?.focus();
                searchBarRef.current?.select();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isGenerating, focusedStudentId, selectedIds, handleSingleGenerate, handleBatchGenerate]);

    return (
        <div className="min-h-screen max-w-full overflow-x-hidden text-[var(--ink)] font-sans flex flex-col relative pb-20 md:pb-0">{/* pb-20 給 < md 的 MobileTabBar 留空間 */}

            {/* 資料載入中 */}
            {isLoading && <DataLoading />}

            {/* 對話框 */}
            <Dialog dialog={dialog} closeDialog={closeDialog} />

            {/* 生成中載入層 */}
            {isGenerating && <LoadingOverlay progress={progress} />}

            {/* Lazy Modal 區塊 - 使用 Suspense 包裹 */}
            <Suspense fallback={<LazyLoading />}>
                {/* 風格選擇 Modal */}
                <StyleModal
                    isOpen={isStyleModalOpen}
                    onClose={() => setIsStyleModalOpen(false)}
                    globalStyles={globalStyles}
                    toggleGlobalStyle={toggleGlobalStyle}
                />

                {/* API Key 設定 Modal */}
                <ApiKeyModal
                    isOpen={isApiKeyModalOpen}
                    onClose={() => {
                        setIsApiKeyModalOpen(false);
                        setApiKeyConfigured(hasApiKey());
                    }}
                    currentUser={currentUser}
                />

                {/* 範本庫 Modal */}
                <TemplateModal
                    isOpen={isTemplateModalOpen}
                    onClose={() => setIsTemplateModalOpen(false)}
                    onApplyTemplate={handleApplyTemplate}
                />

                {/* 班級管理 Modal */}
                <ClassModal
                    isOpen={isClassModalOpen}
                    onClose={() => setIsClassModalOpen(false)}
                    currentClassId={currentClassId}
                    onSelectClass={(classId) => {
                        setCurrentClassId(classId);
                        if (!classId) {
                            setCurrentClassName('全部學生');
                        }
                        // 切換班級時清除正在查看的用戶
                        setViewingUser(null);
                    }}
                    currentUser={currentUser}
                    onViewUserStudents={handleViewUserStudents}
                />

                {/* 歷史記錄 Modal */}
                <HistoryModal
                    isOpen={isHistoryModalOpen}
                    onClose={() => {
                        setIsHistoryModalOpen(false);
                        setHistoryStudent(null);
                    }}
                    student={historyStudent}
                    onRestore={(comment) => {
                        if (historyStudent) {
                            updateStudent(historyStudent.id, 'comment', comment);
                            syncComment(historyStudent.id, comment);
                        }
                    }}
                />

                {/* 管理員面板 */}
                <AdminPanel
                    isOpen={isAdminPanelOpen}
                    onClose={() => setIsAdminPanelOpen(false)}
                    currentUser={currentUser}
                />

                {/* Excel 匯入/匯出 */}
                <ImportExportModal
                    isOpen={isImportExportOpen}
                    onClose={() => setIsImportExportOpen(false)}
                    students={viewingUser ? viewingStudents : students}
                    onImport={viewingUser ? () => { } : handleImportStudents}
                    currentClassName={viewingUser ? `${viewingUser.displayName} 的學生` : currentClassName}
                />

                {/* 列印與 PDF 匯出 */}
                <PrintModal
                    isOpen={isPrintModalOpen}
                    onClose={() => setIsPrintModalOpen(false)}
                    students={viewingUser ? viewingStudents : students}
                    currentClassName={viewingUser ? `${viewingUser.displayName} 的學生` : currentClassName}
                />

                {/* 班級統計儀表板 */}
                <DashboardModal
                    isOpen={isDashboardOpen}
                    onClose={() => setIsDashboardOpen(false)}
                    students={viewingUser ? viewingStudents : students}
                    currentClassName={viewingUser ? `${viewingUser.displayName} 的學生` : currentClassName}
                />
            </Suspense>

            {/* 頁首 */}
            <Header
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                onOpenSettings={() => setIsApiKeyModalOpen(true)}
                onOpenTemplates={() => setIsTemplateModalOpen(true)}
                onOpenClasses={() => setIsClassModalOpen(true)}
                onOpenAdmin={() => setIsAdminPanelOpen(true)}
                onOpenImportExport={() => setIsImportExportOpen(true)}
                onOpenPrint={() => setIsPrintModalOpen(true)}
                onOpenDashboard={() => setIsDashboardOpen(true)}
                onLogout={onLogout}
                hasApiKey={apiKeyConfigured}
                templateCount={templateCount}
                currentClassName={currentClassName}
                currentUser={currentUser}
                isAdmin={isAdmin}
                pendingCount={pendingCount}
            />

            <div className="flex flex-col flex-1 w-full mx-auto relative">

                {/* 操作面板 */}
                <div className="px-3 pb-3 sm:px-6 sm:pb-6 pt-2 sm:pt-4 border-b-2 border-[var(--ink)] flex flex-col lg:flex-row gap-4 sm:gap-6 items-stretch" style={{ background: 'var(--paper-2)' }}>
                    <InputPanel
                        rawInput={rawInput}
                        setRawInput={setRawInput}
                        numberCount={numberCount}
                        setNumberCount={setNumberCount}
                        onGenerateStudents={handleGenerateStudents}
                        onGenerateNumbers={handleGenerateNumbers}
                        onResetList={handleResetList}
                        isGenerating={isGenerating}
                    />

                    <GeneratePanel
                        students={filteredStudents}
                        selectedIds={viewingUser ? viewingSelectedIds : selectedIds}
                        isGenerating={isGenerating}
                        extraSettings={extraSettings}
                        setExtraSettings={setExtraSettings}
                        onGenerateSelected={viewingUser ? () => { } : () => handleBatchGenerate(true)}
                        onGenerateAll={viewingUser ? () => { } : () => handleBatchGenerate(false)}
                        onDownload={handleDownload}
                        onDeleteSelected={viewingUser ? deleteViewingSelected : handleDeleteSelected}
                        onResetList={viewingUser ? () => { } : handleResetList}
                        isViewingMode={!!viewingUser}
                    />
                </div>

                {/* 表格區 */}
                <div className="flex-1 p-3 sm:p-6">

                    {/* 正在查看其他用戶學生的提示條 */}
                    {viewingUser && (
                        <div
                            className="mb-4 p-3 sm:p-4 b-ink r-card sh-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                            style={{ background: 'var(--sky-soft)' }}
                            role="status"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {viewingUser.photoURL ? (
                                    <img
                                        src={viewingUser.photoURL}
                                        alt=""
                                        className="w-10 h-10 rounded-full border-2 border-[var(--ink)] shrink-0"
                                    />
                                ) : (
                                    <div
                                        className="w-10 h-10 rounded-full border-2 border-[var(--ink)] flex items-center justify-center text-[14px] font-black shrink-0"
                                        style={{ background: 'var(--honey)' }}
                                    >
                                        {(viewingUser.displayName || '?').charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="font-bold text-[13px] sm:text-[14px] truncate text-[var(--ink)]">
                                        ✏️ 管理員模式：正在編輯 {viewingUser.displayName} 的學生資料
                                    </p>
                                    <p className="text-[11.5px] text-[var(--ink-soft)] truncate font-mono">
                                        {viewingUser.email}
                                        {viewingUser.customSchoolName && ` · ${viewingUser.customSchoolName}`}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleBackToMyStudents}
                                style={{ background: 'var(--sky)' }}
                                className="b-ink sh-btn r-btn px-3.5 h-9 inline-flex items-center gap-1.5 text-[12.5px] font-bold btn-press shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                            >
                                ← 返回我的學生
                            </button>
                        </div>
                    )}

                    {/* 搜尋與篩選列 */}
                    {!viewingUser && (
                        <SearchBar
                            ref={searchBarRef}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            filters={searchFilters}
                            setFilters={setSearchFilters}
                            totalCount={students.length}
                            filteredCount={filteredStudents.length}
                        />
                    )}

                    {/* 風格設定顯示條 */}
                    <StyleBar
                        globalStyles={globalStyles}
                        onOpenStyleModal={() => setIsStyleModalOpen(true)}
                        isGenerating={isGenerating}
                    />

                    {/* 學生表格/卡片 */}
                    <StudentTable
                        students={filteredStudents}
                        selectedIds={viewingUser ? viewingSelectedIds : selectedIds}
                        focusedStudentId={viewingUser ? viewingFocusedStudentId : focusedStudentId}
                        isGenerating={isGenerating}
                        isGeneratingSingle={isGeneratingSingle}
                        onToggleSelection={viewingUser ? toggleViewingSelection : toggleSelection}
                        onToggleAllSelection={viewingUser ? toggleViewingAllSelection : toggleAllSelection}
                        onFocusStudent={viewingUser ? setViewingFocusedStudentId : setFocusedStudentId}
                        onOpenSidebar={() => setIsSidebarOpen(true)}
                        onRemoveTag={viewingUser ? removeViewingTag : removeTag}
                        onUpdateStudent={viewingUser ? updateViewingStudent : updateStudent}
                        onDeleteStudent={viewingUser ? deleteViewingStudent : deleteStudent}
                        onGenerateSingle={viewingUser ? handleViewingSingleGenerate : handleSingleGenerate}
                        onSaveTemplate={viewingUser ? () => { } : handleSaveTemplate}
                        onOpenHistory={viewingUser ? () => { } : (student) => {
                            setHistoryStudent(student);
                            setIsHistoryModalOpen(true);
                        }}
                        readOnly={false}
                        searchQuery={searchQuery}
                        onAdjustComment={viewingUser ? () => { } : handleAdjustComment}
                        adjustingStudentId={adjustingStudentId}
                    />
                </div>

                {/* 成語庫側邊欄 */}
                <IdiomSidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    selectedIds={selectedIds}
                    expandedCategories={expandedCategories}
                    onToggleCategory={toggleCategory}
                    onIdiomClick={handleIdiomClick}
                    userId={currentUser?.uid}
                />
            </div>

            {/* 頁尾 */}
            <Footer />

            {/* 行動裝置底部 Tab Bar（< md 才渲染） */}
            <MobileTabBar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                onOpenTemplates={() => setIsTemplateModalOpen(true)}
                onOpenDashboard={() => setIsDashboardOpen(true)}
                onOpenClasses={() => setIsClassModalOpen(true)}
                onOpenImportExport={() => setIsImportExportOpen(true)}
                onOpenPrint={() => setIsPrintModalOpen(true)}
                onOpenSettings={() => setIsApiKeyModalOpen(true)}
                onOpenAdmin={() => setIsAdminPanelOpen(true)}
                isAdmin={isAdmin}
                hasApiKey={apiKeyConfigured}
                templateCount={templateCount}
                pendingCount={pendingCount}
            />

            {/* PWA 安裝提示 */}
            <InstallPrompt />
        </div>
    );
};

export default App;
