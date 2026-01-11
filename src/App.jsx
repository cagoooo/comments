import React, { useState, useEffect } from 'react';

// Data
import { IDIOM_CATEGORIES } from './data/idiomData';
import { STYLE_DEFINITIONS } from './data/styleDefinitions';

// Utils
import { callGeminiAPI, hasApiKey } from './utils/geminiApi';
import { downloadComments } from './utils/downloadHelper';

// Hooks
import { useDialog } from './hooks/useDialog';
import { useStudents } from './hooks/useStudents';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import Dialog from './components/Dialog';
import LoadingOverlay from './components/LoadingOverlay';
import StyleModal from './components/StyleModal';
import InputPanel from './components/InputPanel';
import GeneratePanel from './components/GeneratePanel';
import StyleBar from './components/StyleBar';
import StudentTable from './components/StudentTable';
import IdiomSidebar from './components/IdiomSidebar';
import DataLoading from './components/DataLoading';
import ApiKeyModal from './components/ApiKeyModal';
import TemplateModal from './components/TemplateModal';
import InstallPrompt from './components/InstallPrompt';
import ClassModal from './components/ClassModal';
import HistoryModal from './components/HistoryModal';
import AdminPanel from './components/AdminPanel';

// Firebase
import { templateService, classService, historyService, settingsService } from './firebase';

/**
 * 點石成金蜂🐝 - AI 評語產生器
 * 主應用元件
 */
const App = ({ currentUser, onLogout, isAdmin }) => {
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

    // 從 Firebase 同步 API Key 到 localStorage（使用者隔離）
    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = settingsService.subscribe((settings) => {
            if (settings?.apiKey) {
                localStorage.setItem('gemini_api_key', settings.apiKey);
                setApiKeyConfigured(true);
            }
        });
        return () => unsubscribe();
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

            setProgress(prev => ({ ...prev, current: i + 1 }));
        }

        setIsGenerating(false);
        setProgress({ current: 0, total: 0 });
    };

    // 下載處理
    const handleDownload = (format) => {
        downloadComments(students, format);
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
            showAlert("❤️ 評語已收藏到範本庫！");
        } catch (error) {
            console.error('儲存範本失敗:', error);
        }
    };

    // 套用範本到當前聚焦的學生
    const handleApplyTemplate = (content) => {
        if (focusedStudentId) {
            updateStudent(focusedStudentId, 'comment', content);
            syncComment(focusedStudentId, content);
        }
    };

    return (
        <div className="min-h-screen text-[#2D3436] font-sans flex flex-col relative">

            {/* 資料載入中 */}
            {isLoading && <DataLoading />}

            {/* 對話框 */}
            <Dialog dialog={dialog} closeDialog={closeDialog} />

            {/* 生成中載入層 */}
            {isGenerating && <LoadingOverlay progress={progress} />}

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
                }}
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

            {/* 頁首 */}
            <Header
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                onOpenSettings={() => setIsApiKeyModalOpen(true)}
                onOpenTemplates={() => setIsTemplateModalOpen(true)}
                onOpenClasses={() => setIsClassModalOpen(true)}
                onOpenAdmin={() => setIsAdminPanelOpen(true)}
                onLogout={onLogout}
                hasApiKey={apiKeyConfigured}
                templateCount={templateCount}
                currentClassName={currentClassName}
                currentUser={currentUser}
                isAdmin={isAdmin}
            />

            <div className="flex flex-col flex-1 w-full mx-auto relative">

                {/* 操作面板 */}
                <div className="p-3 sm:p-6 bg-[#FFFDF5] border-b-4 border-[#2D3436] flex flex-col lg:flex-row gap-4 sm:gap-6 items-stretch">
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
                        students={students}
                        selectedIds={selectedIds}
                        isGenerating={isGenerating}
                        extraSettings={extraSettings}
                        setExtraSettings={setExtraSettings}
                        onGenerateSelected={() => handleBatchGenerate(true)}
                        onGenerateAll={() => handleBatchGenerate(false)}
                        onDownload={handleDownload}
                        onDeleteSelected={handleDeleteSelected}
                        onResetList={handleResetList}
                    />
                </div>

                {/* 表格區 */}
                <div className="flex-1 p-3 sm:p-6">

                    {/* 風格設定顯示條 */}
                    <StyleBar
                        globalStyles={globalStyles}
                        onOpenStyleModal={() => setIsStyleModalOpen(true)}
                        isGenerating={isGenerating}
                    />

                    {/* 學生表格/卡片 */}
                    <StudentTable
                        students={students}
                        selectedIds={selectedIds}
                        focusedStudentId={focusedStudentId}
                        isGenerating={isGenerating}
                        isGeneratingSingle={isGeneratingSingle}
                        onToggleSelection={toggleSelection}
                        onToggleAllSelection={toggleAllSelection}
                        onFocusStudent={setFocusedStudentId}
                        onOpenSidebar={() => setIsSidebarOpen(true)}
                        onRemoveTag={removeTag}
                        onUpdateStudent={updateStudent}
                        onDeleteStudent={deleteStudent}
                        onGenerateSingle={handleSingleGenerate}
                        onSaveTemplate={handleSaveTemplate}
                        onOpenHistory={(student) => {
                            setHistoryStudent(student);
                            setIsHistoryModalOpen(true);
                        }}
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
                />
            </div>

            {/* 頁尾 */}
            <Footer />

            {/* PWA 安裝提示 */}
            <InstallPrompt />
        </div>
    );
};

export default App;
