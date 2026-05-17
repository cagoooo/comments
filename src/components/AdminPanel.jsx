import React, { useState, useEffect, useCallback } from 'react';
import {
    Check, XCircle, Users, School, Shield, Clock, Building2, Trash2, FileText,
    ChevronDown, ChevronUp, Settings2, Key, Gift, Loader2, Eye, ArrowLeft,
    Save, Edit3, Tag, X,
} from 'lucide-react';
import {
    userService, USER_ROLES, classService, schoolService, adminConfigService, studentService,
} from '../firebase';
import ModalShell from './ui/ModalShell';
import { Btn, Chip, Card, KPI } from './atoms';

/**
 * 管理員面板
 *
 * Props 保留：isOpen / onClose / currentUser
 * Firebase: userService / classService / schoolService / adminConfigService / studentService
 *
 * 三大主視圖：
 *  (A) 使用者列表（預設）— KPI + 共享 API Key 區塊 + 3 段使用者列表
 *  (B) 編輯使用者（selectedUser）— 申請資訊 + 進階選項（學校/班級）+ 審核/更新按鈕
 *  (C) 查看學生資料（viewingStudentsUser）— 學生列表 + inline 編輯
 */
const AdminPanel = ({ isOpen, onClose, currentUser }) => {
    const [users, setUsers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [schools, setSchools] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    const [sharedConfig, setSharedConfig] = useState(null);
    const [sharedApiKeyInput, setSharedApiKeyInput] = useState('');
    const [isSavingSharedKey, setIsSavingSharedKey] = useState(false);
    const [isTogglingAuth, setIsTogglingAuth] = useState(null);

    const [viewingStudentsUser, setViewingStudentsUser] = useState(null);
    const [viewedStudents, setViewedStudents] = useState([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [isSavingStudent, setIsSavingStudent] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setIsLoading(true);
        const unsubUsers = userService.subscribeAll((data) => {
            setUsers(data);
            setIsLoading(false);
        });
        const unsubClasses = classService.subscribe((data) => setClasses(data));
        const unsubSchools = schoolService.subscribe((data) => setSchools(data));
        const unsubSharedConfig = adminConfigService.subscribe((config) => {
            setSharedConfig(config);
            if (config?.sharedApiKey) setSharedApiKeyInput(config.sharedApiKey);
        });
        return () => {
            unsubUsers();
            unsubClasses();
            unsubSchools();
            unsubSharedConfig();
        };
    }, [isOpen]);

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setSelectedSchool(user.schoolId || user.requestedSchoolId || null);
        if (user.assignedClasses?.length > 0) {
            setSelectedClasses(user.assignedClasses);
        } else if (user.requestedClasses?.length > 0) {
            const matched = user.requestedClasses.map(name => classes.find(c => c.name === name)?.id).filter(Boolean);
            setSelectedClasses(matched);
        } else {
            setSelectedClasses([]);
        }
    };

    const toggleClass = (id) => {
        setSelectedClasses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleApprove = async () => {
        if (!selectedUser) return;
        let schoolIdToUse = null;
        let customSchoolInfo = null;
        if (selectedUser.requestedSchoolId) {
            schoolIdToUse = selectedUser.requestedSchoolId;
        } else if (selectedUser.requestedSchoolName) {
            customSchoolInfo = {
                name: selectedUser.requestedSchoolName,
                city: selectedUser.requestedSchoolCity || '',
            };
        } else if (selectedSchool) {
            schoolIdToUse = selectedSchool;
        }
        let classesToUse = selectedClasses;
        if (selectedClasses.length === 0 && selectedUser.requestedClasses?.length > 0) {
            const ids = [];
            for (const className of selectedUser.requestedClasses) {
                const existing = classes.find(c => c.name === className);
                if (existing) {
                    ids.push(existing.id);
                } else {
                    try {
                        const schoolId = selectedUser.requestedSchoolName
                            ? `${selectedUser.requestedSchoolCity || ''}_${selectedUser.requestedSchoolName}`.trim()
                            : null;
                        const newId = await classService.add({ name: className, schoolId });
                        if (newId) ids.push(newId);
                    } catch (e) { console.error('自動創建班級失敗:', className, e); }
                }
            }
            classesToUse = ids;
        }
        await userService.approve(selectedUser.id, classesToUse, schoolIdToUse, customSchoolInfo);
        setSelectedUser(null);
        setSelectedClasses([]);
        setSelectedSchool(null);
    };

    const handleUpdateClasses = async () => {
        if (!selectedUser) return;
        let schoolToUse = selectedSchool;
        let customSchoolInfo = null;
        if (!selectedSchool && selectedUser.requestedSchoolName) {
            customSchoolInfo = { name: selectedUser.requestedSchoolName, city: selectedUser.requestedSchoolCity };
        } else if (!selectedSchool && selectedUser.requestedSchoolId) {
            schoolToUse = selectedUser.requestedSchoolId;
        }
        let classesToUse = selectedClasses;
        if (selectedClasses.length === 0 && selectedUser.requestedClasses?.length > 0) {
            const ids = [];
            for (const className of selectedUser.requestedClasses) {
                const existing = classes.find(c => c.name === className);
                if (existing) {
                    ids.push(existing.id);
                } else {
                    try {
                        const schoolId = customSchoolInfo
                            ? `${customSchoolInfo.city || ''}_${customSchoolInfo.name}`.trim()
                            : (selectedUser.customSchoolName
                                ? `${selectedUser.customSchoolCity || ''}_${selectedUser.customSchoolName}`.trim()
                                : null);
                        const newId = await classService.add({ name: className, schoolId });
                        if (newId) ids.push(newId);
                    } catch (e) { console.error('自動創建班級失敗:', className, e); }
                }
            }
            classesToUse = ids;
        }
        await userService.updateAssignedClasses(selectedUser.id, classesToUse, schoolToUse, customSchoolInfo);
        setSelectedUser(null);
        setSelectedClasses([]);
        setSelectedSchool(null);
    };

    const handleReject = async (uid) => {
        if (!window.confirm('確定要拒絕/撤銷此使用者的權限嗎？將重置為待填資料狀態。')) return;
        await userService.reject(uid);
    };

    const handleDelete = async (uid) => {
        if (!window.confirm('確定要刪除此使用者嗎？此操作無法復原。')) return;
        try {
            const result = await userService.delete(uid);
            if (!result.success) alert('刪除失敗: ' + (result.error || '未知錯誤'));
        } catch (error) {
            console.error('[AdminPanel] 刪除錯誤:', error);
            alert('刪除失敗: ' + error.message);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp?.toDate) return '-';
        return timestamp.toDate().toLocaleDateString('zh-TW');
    };

    const getSchoolName = (schoolId) => schools.find(s => s.id === schoolId)?.name || '未知學校';

    // ── 共享 API Key ─────────────────────
    const handleSaveSharedApiKey = async () => {
        if (!sharedApiKeyInput.trim()) return;
        setIsSavingSharedKey(true);
        try {
            await adminConfigService.saveSharedApiKey(sharedApiKeyInput.trim(), currentUser.uid);
        } catch (error) {
            console.error('儲存共享 API Key 失敗:', error);
            alert('儲存失敗，請稍後再試');
        }
        setIsSavingSharedKey(false);
    };

    const handleClearSharedApiKey = async () => {
        if (!window.confirm('確定要清除共享 API Key 嗎？所有已授權用戶將無法使用。')) return;
        setIsSavingSharedKey(true);
        try {
            await adminConfigService.clearSharedApiKey(currentUser.uid);
            setSharedApiKeyInput('');
        } catch (error) { console.error('清除共享 API Key 失敗:', error); }
        setIsSavingSharedKey(false);
    };

    const handleToggleAuthorization = async (userId) => {
        setIsTogglingAuth(userId);
        try {
            const authorized = (sharedConfig?.authorizedUsers || []).includes(userId);
            if (authorized) await adminConfigService.revokeAccess(userId, currentUser.uid);
            else await adminConfigService.grantAccess(userId, currentUser.uid);
        } catch (error) { console.error('切換授權失敗:', error); }
        setIsTogglingAuth(null);
    };

    const maskApiKey = (key) => {
        if (!key || key.length < 10) return key;
        return key.substring(0, 6) + '••••••••' + key.substring(key.length - 4);
    };

    const isUserAuthorized = (userId) => (sharedConfig?.authorizedUsers || []).includes(userId);

    // ── 查看學生 ─────────────────────
    const handleViewStudents = useCallback((user) => {
        setViewingStudentsUser(user);
        setIsLoadingStudents(true);
        setViewedStudents([]);
        setEditingStudent(null);
        const unsubscribe = studentService.subscribeByUserId(user.id, (students) => {
            const formatted = students.map(s => ({
                ...s,
                id: s.id,
                selectedTags: s.selectedTags || [],
                manualTraits: s.manualTraits || '',
                comment: s.comment || '',
            }));
            setViewedStudents(formatted);
            setIsLoadingStudents(false);
        });
        window._adminStudentUnsubscribe = unsubscribe;
    }, []);

    const handleCancelViewStudents = useCallback(() => {
        if (window._adminStudentUnsubscribe) {
            window._adminStudentUnsubscribe();
            window._adminStudentUnsubscribe = null;
        }
        setViewingStudentsUser(null);
        setViewedStudents([]);
        setEditingStudent(null);
    }, []);

    const handleEditStudent = useCallback((s) => setEditingStudent({ ...s }), []);
    const handleCancelEdit = useCallback(() => setEditingStudent(null), []);

    const handleSaveStudent = useCallback(async () => {
        if (!editingStudent || !viewingStudentsUser) return;
        setIsSavingStudent(true);
        try {
            await studentService.updateByUserId(viewingStudentsUser.id, editingStudent.id, {
                name: editingStudent.name,
                selectedTags: editingStudent.selectedTags,
                manualTraits: editingStudent.manualTraits,
                comment: editingStudent.comment,
            });
            setEditingStudent(null);
        } catch (error) {
            console.error('儲存學生資料失敗:', error);
            alert('儲存失敗，請稍後再試');
        }
        setIsSavingStudent(false);
    }, [editingStudent, viewingStudentsUser]);

    const updateEditingField = useCallback((field, value) => {
        setEditingStudent(prev => prev ? { ...prev, [field]: value } : null);
    }, []);

    const removeEditingTag = useCallback((tag) => {
        setEditingStudent(prev => prev ? { ...prev, selectedTags: prev.selectedTags.filter(t => t !== tag) } : null);
    }, []);

    const authorizedCount = (sharedConfig?.authorizedUsers || []).length;
    const teacherUsers = users.filter(u => u.role === USER_ROLES.TEACHER);
    const pendingReviewUsers = users.filter(u => u.role === USER_ROLES.PENDING_REVIEW || u.role === USER_ROLES.PENDING);
    const pendingInfoUsers = users.filter(u => u.role === USER_ROLES.PENDING_INFO);
    const approvedUsers = users.filter(u => u.role === USER_ROLES.TEACHER || u.role === USER_ROLES.ADMIN);

    if (!isOpen) return null;

    return (
        <ModalShell
            open={isOpen}
            onClose={onClose}
            width={1024}
            eyebrow="Admin"
            tapeColor="coral"
            icon={<Shield size={18} strokeWidth={1.8} />}
            title="管理員面板"
            subtitle={
                <>共 <span className="font-bold text-[var(--ink)]">{users.length}</span> 位使用者 · 審核 / 指派班級 / 共享 API</>
            }
            footer={
                <div className="flex items-center justify-end">
                    <Btn variant="outline" size="sm" onClick={onClose}>
                        關閉
                    </Btn>
                </div>
            }
        >
            <div className="px-4 sm:px-7 py-4 sm:py-5">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-4xl bee-bob" aria-label="載入中">
                        👥
                    </div>
                ) : viewingStudentsUser ? (
                    <ViewStudents
                        user={viewingStudentsUser}
                        students={viewedStudents}
                        isLoadingStudents={isLoadingStudents}
                        editingStudent={editingStudent}
                        isSavingStudent={isSavingStudent}
                        onCancel={handleCancelViewStudents}
                        onEdit={handleEditStudent}
                        onCancelEdit={handleCancelEdit}
                        onSave={handleSaveStudent}
                        updateField={updateEditingField}
                        removeTag={removeEditingTag}
                    />
                ) : selectedUser ? (
                    <EditUserPanel
                        user={selectedUser}
                        classes={classes}
                        schools={schools}
                        selectedClasses={selectedClasses}
                        selectedSchool={selectedSchool}
                        showAdvancedOptions={showAdvancedOptions}
                        setShowAdvancedOptions={setShowAdvancedOptions}
                        setSelectedSchool={setSelectedSchool}
                        toggleClass={toggleClass}
                        getSchoolName={getSchoolName}
                        onCancel={() => { setSelectedUser(null); setSelectedClasses([]); }}
                        onApprove={handleApprove}
                        onUpdate={handleUpdateClasses}
                    />
                ) : (
                    <div className="space-y-4">
                        {/* 4 KPI */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                            <KPI label="待審核" value={pendingReviewUsers.length} accent="peach" />
                            <KPI label="待填資料" value={pendingInfoUsers.length} accent="lav" />
                            <KPI label="教師" value={users.filter(u => u.role === USER_ROLES.TEACHER).length} accent="mint" />
                            <KPI label="管理員" value={users.filter(u => u.role === USER_ROLES.ADMIN).length} accent="coral" />
                        </div>

                        {/* 共享 API Key 區塊 */}
                        <SharedApiKeyPanel
                            sharedConfig={sharedConfig}
                            sharedApiKeyInput={sharedApiKeyInput}
                            setSharedApiKeyInput={setSharedApiKeyInput}
                            isSavingSharedKey={isSavingSharedKey}
                            authorizedCount={authorizedCount}
                            teacherUsers={teacherUsers}
                            isTogglingAuth={isTogglingAuth}
                            isUserAuthorized={isUserAuthorized}
                            onToggleAuth={handleToggleAuthorization}
                            onSave={handleSaveSharedApiKey}
                            onClear={handleClearSharedApiKey}
                            maskApiKey={maskApiKey}
                        />

                        {/* 待審核 */}
                        {pendingReviewUsers.length > 0 && (
                            <UserSection
                                title="待審核"
                                count={pendingReviewUsers.length}
                                icon={<Clock size={16} strokeWidth={1.8} style={{ color: 'var(--peach)' }} />}
                                color="peach"
                            >
                                {pendingReviewUsers.map(u => (
                                    <UserRow
                                        key={u.id}
                                        user={u}
                                        onEdit={handleEditUser}
                                        onReject={handleReject}
                                        onDelete={handleDelete}
                                        classes={classes}
                                        schools={schools}
                                        showApplication
                                        formatTime={formatTime}
                                    />
                                ))}
                            </UserSection>
                        )}

                        {/* 待填資料 */}
                        {pendingInfoUsers.length > 0 && (
                            <UserSection
                                title="待填資料"
                                count={pendingInfoUsers.length}
                                icon={<FileText size={16} strokeWidth={1.8} style={{ color: 'var(--lav)' }} />}
                                color="lav"
                            >
                                {pendingInfoUsers.map(u => (
                                    <UserRow
                                        key={u.id}
                                        user={u}
                                        onEdit={null}
                                        onReject={handleReject}
                                        onDelete={handleDelete}
                                        classes={classes}
                                        schools={schools}
                                        showApplication={false}
                                        formatTime={formatTime}
                                    />
                                ))}
                            </UserSection>
                        )}

                        {/* 已審核 */}
                        <UserSection
                            title="已審核使用者"
                            count={approvedUsers.length}
                            icon={<Users size={16} strokeWidth={1.8} style={{ color: 'var(--mint)' }} />}
                            color="mint"
                        >
                            {approvedUsers.map(u => (
                                <UserRow
                                    key={u.id}
                                    user={u}
                                    onEdit={handleEditUser}
                                    onReject={handleReject}
                                    onDelete={handleDelete}
                                    onViewStudents={handleViewStudents}
                                    classes={classes}
                                    schools={schools}
                                    isCurrentUser={u.id === currentUser?.uid}
                                    showApplication={false}
                                    formatTime={formatTime}
                                />
                            ))}
                        </UserSection>
                    </div>
                )}
            </div>
        </ModalShell>
    );
};

// ── role badge ─────────────────────
const RoleBadge = ({ role }) => {
    const map = {
        [USER_ROLES.ADMIN]: { color: 'coral', label: '管理員' },
        [USER_ROLES.TEACHER]: { color: 'mint', label: '教師' },
        [USER_ROLES.PENDING_REVIEW]: { color: 'peach', label: '待審核' },
        [USER_ROLES.PENDING]: { color: 'peach', label: '待審核' },
        [USER_ROLES.PENDING_INFO]: { color: 'lav', label: '待填資料' },
    };
    const m = map[role] || { color: 'peach', label: '待審核' };
    return <Chip color={m.color} soft size="sm">{m.label}</Chip>;
};

// ── UserSection 容器 ─────────────────────
const UserSection = ({ title, count, icon, children }) => (
    <div>
        <h4 className="font-black text-[13px] flex items-center gap-2 mb-2 uppercase tracking-wider text-[var(--ink)]">
            {icon}
            {title} <span className="font-mono text-[12px] text-[var(--ink-soft)]">({count})</span>
        </h4>
        <div className="space-y-2">{children}</div>
    </div>
);

// ── UserRow ─────────────────────
const UserRow = ({ user, onEdit, onReject, onDelete, onViewStudents, classes, schools, isCurrentUser, showApplication, formatTime }) => {
    const assignedClassNames = (user.assignedClasses || [])
        .map(id => classes.find(c => c.id === id)?.name)
        .filter(Boolean)
        .join(', ');

    const getSchoolName = (id) => schools?.find(s => s.id === id)?.name || null;

    const isPending = user.role === USER_ROLES.PENDING_REVIEW
        || user.role === USER_ROLES.PENDING
        || user.role === USER_ROLES.PENDING_INFO;

    return (
        <Card className={`p-3 ${isCurrentUser ? 'ring-2 ring-[var(--honey)]' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-[var(--ink)] flex-shrink-0" />
                    ) : (
                        <div
                            className="w-10 h-10 rounded-full border-2 border-[var(--ink)] flex items-center justify-center text-[13px] font-black flex-shrink-0"
                            style={{ background: 'var(--honey)' }}
                        >
                            {(user.displayName || '?').charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="font-bold text-[13px] flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-[var(--ink)]">{user.displayName}</span>
                            <RoleBadge role={user.role} />
                            {isCurrentUser && <span className="text-[11px] text-[var(--ink-soft)]">(你)</span>}
                        </div>
                        <div className="text-[11.5px] text-[var(--ink-soft)] truncate font-mono">{user.email}</div>
                        {assignedClassNames && (
                            <div className="text-[11.5px] text-[var(--sky)] flex items-center gap-1 mt-0.5">
                                <School size={11} strokeWidth={1.8} />
                                <span className="truncate">{assignedClassNames}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 申請資訊（待審核才顯示） */}
                {showApplication && (user.requestedSchoolId || user.requestedSchoolName || user.requestedClasses?.length > 0) && (
                    <div className="b-soft r-btn p-2 text-[11px] flex-shrink-0" style={{ background: 'var(--sky-soft)' }}>
                        <div className="font-bold text-[var(--sky)] mb-1 inline-flex items-center gap-1">
                            <FileText size={11} strokeWidth={1.8} /> 申請資訊
                        </div>
                        {user.requestedSchoolName && (
                            <div className="text-[var(--ink)]">
                                學校：{user.requestedSchoolCity && `${user.requestedSchoolCity} `}{user.requestedSchoolName}
                            </div>
                        )}
                        {user.requestedSchoolId && !user.requestedSchoolName && (
                            <div className="text-[var(--ink)]">學校：{getSchoolName(user.requestedSchoolId)}</div>
                        )}
                        {user.requestedClasses?.length > 0 && (
                            <div className="text-[var(--ink)]">班級：{user.requestedClasses.join('、')}</div>
                        )}
                    </div>
                )}

                {/* 操作 */}
                <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-center">
                    {user.role !== USER_ROLES.ADMIN && (
                        <>
                            {onEdit && (
                                <Btn size="sm" color="sky" onClick={() => onEdit(user)}>
                                    {isPending ? '審核' : '編輯'}
                                </Btn>
                            )}
                            {user.role === USER_ROLES.TEACHER && onViewStudents && (
                                <button
                                    type="button"
                                    onClick={() => onViewStudents(user)}
                                    className="b-ink sh-sm r-btn h-8 w-8 inline-flex items-center justify-center btn-press"
                                    style={{ background: 'var(--mint)' }}
                                    title="查看學生資料"
                                    aria-label="查看學生資料"
                                >
                                    <Eye size={13} strokeWidth={1.8} />
                                </button>
                            )}
                            {user.role === USER_ROLES.TEACHER && (
                                <button
                                    type="button"
                                    onClick={() => onReject(user.id)}
                                    className="b-ink sh-sm r-btn h-8 w-8 inline-flex items-center justify-center btn-press"
                                    style={{ background: 'var(--coral)' }}
                                    title="撤銷權限"
                                    aria-label="撤銷權限"
                                >
                                    <XCircle size={13} strokeWidth={1.8} />
                                </button>
                            )}
                            {isPending && (
                                <button
                                    type="button"
                                    onClick={() => onDelete(user.id)}
                                    className="b-soft r-btn h-8 w-8 bg-white inline-flex items-center justify-center text-[var(--ink-soft)] hover:text-[var(--coral)] btn-press"
                                    title="刪除申請"
                                    aria-label="刪除申請"
                                >
                                    <Trash2 size={13} strokeWidth={1.8} />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
};

// ── 共享 API Key Panel ─────────────────────
const SharedApiKeyPanel = ({
    sharedConfig, sharedApiKeyInput, setSharedApiKeyInput, isSavingSharedKey,
    authorizedCount, teacherUsers, isTogglingAuth, isUserAuthorized,
    onToggleAuth, onSave, onClear, maskApiKey,
}) => (
    <Card style={{ background: 'var(--honey-soft)' }} className="overflow-hidden">
        <div
            className="p-3 border-b-2 border-[var(--ink)] flex items-center gap-2"
            style={{ background: 'var(--honey)' }}
        >
            <Key size={16} strokeWidth={1.8} />
            <span className="font-black text-[14px]">共享 API Key 管理</span>
            {authorizedCount > 0 && (
                <Chip color="ink" soft={false} size="sm">{authorizedCount} 人已授權</Chip>
            )}
        </div>
        <div className="p-3 sm:p-4 space-y-3">
            <div className="bg-white b-ink sh-sm r-card p-3">
                <label className="block text-[11.5px] font-bold text-[var(--ink-soft)] mb-2 uppercase tracking-wider">
                    🔐 管理員付費 API Key
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="password"
                        value={sharedApiKeyInput}
                        onChange={(e) => setSharedApiKeyInput(e.target.value)}
                        placeholder="輸入您的付費 API Key…"
                        className="flex-1 px-3 h-10 b-ink r-btn font-mono text-[13px] outline-none focus:ring-2 focus:ring-honey-soft"
                        disabled={isSavingSharedKey}
                    />
                    <div className="flex gap-2">
                        <Btn
                            color="mint"
                            size="sm"
                            onClick={onSave}
                            disabled={!sharedApiKeyInput.trim() || isSavingSharedKey}
                            icon={isSavingSharedKey ? <Loader2 size={13} strokeWidth={1.8} className="animate-spin" /> : null}
                        >
                            儲存
                        </Btn>
                        {sharedConfig?.sharedApiKey && (
                            <Btn
                                variant="outline"
                                size="sm"
                                onClick={onClear}
                                disabled={isSavingSharedKey}
                            >
                                清除
                            </Btn>
                        )}
                    </div>
                </div>
                {sharedConfig?.sharedApiKey && (
                    <p className="text-[11px] text-[var(--mint)] mt-2 font-mono">
                        ✓ 已設定：{maskApiKey(sharedConfig.sharedApiKey)}
                    </p>
                )}
            </div>

            {/* 授權教師清單 */}
            {sharedConfig?.sharedApiKey && teacherUsers.length > 0 && (
                <div className="bg-white b-ink sh-sm r-card p-3">
                    <label className="block text-[11.5px] font-bold text-[var(--ink-soft)] mb-2 uppercase tracking-wider">
                        🎁 授權教師使用共享 API Key
                    </label>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                        {teacherUsers.map(u => {
                            const authorized = isUserAuthorized(u.id);
                            const isLoading = isTogglingAuth === u.id;
                            return (
                                <div
                                    key={u.id}
                                    onClick={() => !isTogglingAuth && onToggleAuth(u.id)}
                                    className="flex items-center gap-2.5 p-2 b-soft r-btn cursor-pointer"
                                    style={{
                                        background: authorized ? 'var(--mint-soft)' : 'white',
                                        borderColor: authorized ? 'var(--mint)' : undefined,
                                    }}
                                    role="checkbox"
                                    aria-checked={authorized}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if ((e.key === 'Enter' || e.key === ' ') && !isTogglingAuth) {
                                            e.preventDefault();
                                            onToggleAuth(u.id);
                                        }
                                    }}
                                >
                                    <div
                                        className="w-5 h-5 b-ink r-btn flex items-center justify-center flex-shrink-0"
                                        style={{ background: authorized ? 'var(--mint)' : 'white' }}
                                    >
                                        {isLoading ? (
                                            <Loader2 size={11} strokeWidth={2} className="animate-spin" />
                                        ) : authorized ? (
                                            <Check size={11} strokeWidth={2.2} />
                                        ) : null}
                                    </div>
                                    {u.photoURL ? (
                                        <img src={u.photoURL} alt="" className="w-7 h-7 rounded-full border border-[var(--ink)]" />
                                    ) : (
                                        <div
                                            className="w-7 h-7 rounded-full border border-[var(--ink)] flex items-center justify-center text-[10px] font-bold"
                                            style={{ background: 'var(--honey)' }}
                                        >
                                            {(u.displayName || '?').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-[12.5px] truncate">{u.displayName}</div>
                                        <div className="text-[11px] text-[var(--ink-soft)] truncate font-mono">{u.email}</div>
                                    </div>
                                    {authorized && (
                                        <Gift size={14} strokeWidth={1.8} style={{ color: 'var(--mint)' }} className="flex-shrink-0" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-[11px] text-[var(--ink-mute)] mt-2">
                        💡 勾選的教師將自動使用您的 API Key
                    </p>
                </div>
            )}

            {sharedConfig?.sharedApiKey && teacherUsers.length === 0 && (
                <p className="text-[12px] text-[var(--ink-soft)] text-center py-4">
                    目前沒有已審核的教師，請先審核教師申請
                </p>
            )}
            {!sharedConfig?.sharedApiKey && (
                <p className="text-[12px] text-[var(--ink-soft)] text-center py-2">
                    請先設定共享 API Key，即可授權給教師使用
                </p>
            )}
        </div>
    </Card>
);

// ── 編輯使用者面板 ─────────────────────
const EditUserPanel = ({
    user, classes, schools, selectedClasses, selectedSchool,
    showAdvancedOptions, setShowAdvancedOptions, setSelectedSchool, toggleClass,
    getSchoolName, onCancel, onApprove, onUpdate,
}) => {
    const isPending = user.role === USER_ROLES.PENDING_REVIEW || user.role === USER_ROLES.PENDING;

    return (
        <div className="space-y-4">
            <Card className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full border-2 border-[var(--ink)]" />
                    ) : (
                        <div
                            className="w-12 h-12 rounded-full border-2 border-[var(--ink)] flex items-center justify-center text-[14px] font-black"
                            style={{ background: 'var(--honey)' }}
                        >
                            {(user.displayName || '?').charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="font-bold text-[14px] flex flex-wrap items-center gap-2">
                            <span className="truncate">{user.displayName}</span>
                            <RoleBadge role={user.role} />
                        </div>
                        <div className="text-[12px] text-[var(--ink-soft)] truncate font-mono">{user.email}</div>
                    </div>
                </div>
            </Card>

            {/* 申請資訊 */}
            {(user.requestedSchoolId || user.requestedSchoolName || user.requestedClasses?.length > 0) && (
                <Card className="p-4 b-dash" style={{ background: 'var(--sky-soft)' }}>
                    <h4 className="font-bold text-[var(--sky)] mb-2 flex items-center gap-2 text-[13px] uppercase tracking-wider">
                        <FileText size={14} strokeWidth={1.8} />
                        用戶申請資訊
                    </h4>
                    {user.requestedSchoolName && (
                        <p className="text-[13px] text-[var(--ink)] mb-1">
                            <span className="font-bold">申請學校：</span>
                            {user.requestedSchoolCity && `${user.requestedSchoolCity} `}
                            {user.requestedSchoolName}
                        </p>
                    )}
                    {user.requestedSchoolId && !user.requestedSchoolName && (
                        <p className="text-[13px] text-[var(--ink)] mb-1">
                            <span className="font-bold">申請學校：</span>
                            {getSchoolName(user.requestedSchoolId)}
                        </p>
                    )}
                    {user.requestedClasses?.length > 0 && (
                        <p className="text-[13px] text-[var(--ink)]">
                            <span className="font-bold">申請班級：</span>
                            {user.requestedClasses.join('、')}
                        </p>
                    )}
                </Card>
            )}

            {/* 進階選項（摺疊） */}
            <div className="b-dash r-card overflow-hidden">
                <button
                    type="button"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-[var(--paper-2)]/60 transition-colors"
                    aria-expanded={showAdvancedOptions}
                >
                    <span className="flex items-center gap-2 text-[13px] font-bold text-[var(--ink-soft)]">
                        <Settings2 size={14} strokeWidth={1.8} />
                        進階選項（修改學校/班級）
                    </span>
                    {showAdvancedOptions
                        ? <ChevronUp size={16} strokeWidth={1.8} />
                        : <ChevronDown size={16} strokeWidth={1.8} />}
                </button>

                {showAdvancedOptions && (
                    <div className="p-3 sm:p-4 space-y-3" style={{ background: 'var(--paper-2)' }}>
                        {/* 指派學校 */}
                        <div className="bg-white b-soft r-btn p-3">
                            <h4 className="font-bold text-[var(--ink-soft)] mb-2 flex items-center gap-2 text-[12px] uppercase tracking-wider">
                                <Building2 size={12} strokeWidth={1.8} />
                                指派其他學校
                            </h4>
                            {schools.length === 0 ? (
                                <QuickAddSchool onAdd={async (n, c, d) => { await schoolService.add({ name: n, city: c, district: d }); }} />
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex flex-wrap gap-1.5">
                                        {schools.map(s => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => setSelectedSchool(selectedSchool === s.id ? null : s.id)}
                                                style={{
                                                    background: selectedSchool === s.id ? 'var(--lav)' : 'white',
                                                }}
                                                className="px-2.5 h-7 b-ink r-btn text-[12px] font-bold inline-flex items-center gap-1 btn-press"
                                            >
                                                {selectedSchool === s.id && <Check size={11} strokeWidth={2.2} />}
                                                🏫 {s.name}
                                            </button>
                                        ))}
                                    </div>
                                    <QuickAddSchool compact onAdd={async (n, c, d) => { await schoolService.add({ name: n, city: c, district: d }); }} />
                                </div>
                            )}
                        </div>

                        {/* 指派班級 */}
                        <div className="bg-white b-soft r-btn p-3">
                            <h4 className="font-bold text-[var(--ink-soft)] mb-2 flex items-center gap-2 text-[12px] uppercase tracking-wider">
                                <School size={12} strokeWidth={1.8} />
                                指派班級
                            </h4>
                            {classes.length === 0 ? (
                                <QuickAddClass onAdd={async (n) => { await classService.add({ name: n }); }} />
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex flex-wrap gap-1.5">
                                        {classes.map(c => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => toggleClass(c.id)}
                                                style={{
                                                    background: selectedClasses.includes(c.id) ? 'var(--sky)' : 'white',
                                                }}
                                                className="px-2.5 h-7 b-ink r-btn text-[12px] font-bold inline-flex items-center gap-1 btn-press"
                                            >
                                                {selectedClasses.includes(c.id) && <Check size={11} strokeWidth={2.2} />}
                                                {c.name}
                                            </button>
                                        ))}
                                    </div>
                                    <QuickAddClass compact onAdd={async (n) => { await classService.add({ name: n }); }} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 動作 */}
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Btn variant="outline" onClick={onCancel}>取消</Btn>
                {isPending ? (
                    <Btn color="mint" icon={<Check size={15} strokeWidth={1.8} />} onClick={onApprove}>
                        審核通過
                    </Btn>
                ) : (
                    <Btn color="sky" icon={<Check size={15} strokeWidth={1.8} />} onClick={onUpdate}>
                        更新班級
                    </Btn>
                )}
            </div>
        </div>
    );
};

// ── 查看學生子畫面 ─────────────────────
const ViewStudents = ({
    user, students, isLoadingStudents, editingStudent, isSavingStudent,
    onCancel, onEdit, onCancelEdit, onSave, updateField, removeTag,
}) => (
    <div className="space-y-4">
        <Card className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3" style={{ background: 'var(--sky-soft)' }}>
            <Btn
                variant="outline"
                size="sm"
                icon={<ArrowLeft size={14} strokeWidth={1.8} />}
                onClick={onCancel}
            >
                返回
            </Btn>
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-[var(--ink)]" />
                ) : (
                    <div
                        className="w-10 h-10 rounded-full border-2 border-[var(--ink)] flex items-center justify-center text-[12px] font-black"
                        style={{ background: 'var(--honey)' }}
                    >
                        {(user.displayName || '?').charAt(0).toUpperCase()}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <div className="font-bold text-[13.5px] flex items-center gap-2">
                        <Eye size={14} strokeWidth={1.8} style={{ color: 'var(--sky)' }} />
                        正在查看：{user.displayName}
                    </div>
                    <div className="text-[11.5px] text-[var(--ink-soft)] truncate font-mono">{user.email}</div>
                </div>
                <div className="text-[12.5px] font-mono font-bold text-[var(--sky)]">
                    共 {students.length} 位
                </div>
            </div>
        </Card>

        {isLoadingStudents ? (
            <div className="flex items-center justify-center py-10">
                <Loader2 size={28} className="animate-spin text-[var(--sky)]" strokeWidth={1.8} />
            </div>
        ) : students.length === 0 ? (
            <div className="text-center py-10 text-[var(--ink-soft)]">
                <div className="text-4xl mb-2" aria-hidden="true">📭</div>
                <p className="font-bold text-[13px]">此用戶尚無學生資料</p>
            </div>
        ) : (
            <div className="space-y-2">
                {students.map(s => (
                    <Card
                        key={s.id}
                        className={editingStudent?.id === s.id ? 'ring-2 ring-[var(--mint)]' : ''}
                    >
                        {editingStudent?.id === s.id ? (
                            <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-[var(--mint)] flex items-center gap-2 text-[13px]">
                                        <Edit3 size={14} strokeWidth={1.8} />
                                        編輯學生資料
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <Btn variant="outline" size="sm" onClick={onCancelEdit} disabled={isSavingStudent}>取消</Btn>
                                        <Btn
                                            color="mint"
                                            size="sm"
                                            onClick={onSave}
                                            disabled={isSavingStudent}
                                            icon={isSavingStudent
                                                ? <Loader2 size={12} strokeWidth={1.8} className="animate-spin" />
                                                : <Save size={12} strokeWidth={1.8} />}
                                        >
                                            儲存
                                        </Btn>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">👦 姓名</label>
                                    <input
                                        type="text"
                                        value={editingStudent.name || ''}
                                        onChange={(e) => updateField('name', e.target.value)}
                                        className="w-full px-3 h-9 b-ink r-btn font-bold text-[13px] outline-none focus:ring-2 focus:ring-honey-soft"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider inline-flex items-center gap-1">
                                        <Tag size={11} strokeWidth={1.8} /> 形容詞標籤
                                    </label>
                                    <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 b-dash r-btn" style={{ background: 'var(--paper-2)' }}>
                                        {(editingStudent.selectedTags || []).length === 0 ? (
                                            <span className="text-[11.5px] text-[var(--ink-mute)] self-center">無標籤</span>
                                        ) : (
                                            editingStudent.selectedTags.map((tag, idx) => (
                                                <Chip key={idx} color="sky" soft size="sm" onClose={() => removeTag(tag)}>
                                                    {tag}
                                                </Chip>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">✍️ 手動輸入特質</label>
                                    <textarea
                                        value={editingStudent.manualTraits || ''}
                                        onChange={(e) => updateField('manualTraits', e.target.value)}
                                        rows={2}
                                        placeholder="輸入學生特質…"
                                        className="w-full px-3 py-2 b-ink r-btn font-medium text-[13px] resize-none outline-none focus:ring-2 focus:ring-honey-soft"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">🤖 AI 評語</label>
                                    <textarea
                                        value={editingStudent.comment || ''}
                                        onChange={(e) => updateField('comment', e.target.value)}
                                        rows={4}
                                        placeholder="AI 生成的評語…"
                                        className="w-full px-3 py-2 b-ink r-btn font-medium text-[13px] resize-none outline-none focus:ring-2 focus:ring-honey-soft bg-lined leading-[28px]"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="p-3">
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-8 h-8 b-ink rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                                        style={{ background: 'var(--honey-soft)' }}
                                    >
                                        {String(s.id).slice(-2).padStart(2, '0')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-[13px] mb-1">{s.name || '未命名'}</div>
                                        {(s.selectedTags || []).length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-1">
                                                {s.selectedTags.slice(0, 5).map((t, i) => (
                                                    <Chip key={i} color="sky" soft size="sm">{t}</Chip>
                                                ))}
                                                {s.selectedTags.length > 5 && (
                                                    <span className="text-[10.5px] text-[var(--ink-soft)] self-center">+{s.selectedTags.length - 5}</span>
                                                )}
                                            </div>
                                        )}
                                        {s.manualTraits && (
                                            <p className="text-[11.5px] text-[var(--ink-soft)] mb-1 truncate">✍️ {s.manualTraits}</p>
                                        )}
                                        {s.comment && (
                                            <p className="text-[11.5px] text-[var(--ink)] line-clamp-2">🤖 {s.comment}</p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onEdit(s)}
                                        className="b-ink sh-sm r-btn h-8 w-8 inline-flex items-center justify-center btn-press flex-shrink-0"
                                        style={{ background: 'var(--sky)' }}
                                        title="編輯此學生"
                                        aria-label="編輯此學生"
                                    >
                                        <Edit3 size={13} strokeWidth={1.8} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        )}
    </div>
);

// ── QuickAdd 子元件 ─────────────────────
const QuickAddClass = ({ onAdd, compact = false }) => {
    const [name, setName] = useState('');
    const [adding, setAdding] = useState(false);

    const handle = async () => {
        if (!name.trim()) return;
        setAdding(true);
        try {
            await onAdd(name.trim());
            setName('');
        } catch (e) { console.error('建立班級失敗:', e); }
        setAdding(false);
    };

    if (compact) {
        return (
            <div className="flex gap-2 pt-2 border-t border-dashed border-[var(--line-soft)]">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handle()}
                    placeholder="新增班級…"
                    className="flex-1 px-3 h-8 b-ink r-btn text-[12px] outline-none focus:ring-2 focus:ring-honey-soft"
                    disabled={adding}
                />
                <Btn size="sm" color="mint" onClick={handle} disabled={!name.trim() || adding}>
                    {adding ? '…' : '+ 新增'}
                </Btn>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <p className="text-[12px] text-[var(--ink-soft)]">尚無班級，請建立第一個班級：</p>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handle()}
                    placeholder="輸入班級名稱（例：一年甲班）"
                    className="flex-1 px-3 h-10 b-ink r-btn font-medium text-[13px] outline-none focus:ring-2 focus:ring-honey-soft"
                    disabled={adding}
                />
                <Btn color="mint" onClick={handle} disabled={!name.trim() || adding}>
                    {adding ? '建立中…' : '+ 建立班級'}
                </Btn>
            </div>
        </div>
    );
};

const CITIES = [
    '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
    '基隆市', '新竹市', '新竹縣', '苗栗縣', '彰化縣', '南投縣',
    '雲林縣', '嘉義市', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
    '台東縣', '澎湖縣', '金門縣', '連江縣',
];

const QuickAddSchool = ({ onAdd, compact = false }) => {
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [adding, setAdding] = useState(false);

    const handle = async () => {
        if (!name.trim()) return;
        setAdding(true);
        try {
            await onAdd(name.trim(), city.trim() || null, null);
            setName('');
            setCity('');
        } catch (e) { console.error('建立學校失敗:', e); }
        setAdding(false);
    };

    if (compact) {
        return (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-[var(--line-soft)]">
                <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="px-2 h-8 b-ink r-btn text-[12px] bg-white outline-none focus:ring-2 focus:ring-honey-soft"
                    disabled={adding}
                >
                    <option value="">縣市</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handle()}
                    placeholder="學校名稱…"
                    className="flex-1 min-w-[120px] px-3 h-8 b-ink r-btn text-[12px] outline-none focus:ring-2 focus:ring-honey-soft"
                    disabled={adding}
                />
                <Btn size="sm" color="lav" onClick={handle} disabled={!name.trim() || adding}>
                    {adding ? '…' : '+ 新增'}
                </Btn>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <p className="text-[12px] text-[var(--ink-soft)]">尚無學校，請建立第一個學校：</p>
            <div className="flex gap-2 flex-wrap">
                <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="px-3 h-10 b-ink r-btn font-medium text-[13px] bg-white outline-none focus:ring-2 focus:ring-honey-soft"
                    disabled={adding}
                >
                    <option value="">選擇縣市</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handle()}
                    placeholder="輸入學校名稱"
                    className="flex-1 min-w-[200px] px-3 h-10 b-ink r-btn font-medium text-[13px] outline-none focus:ring-2 focus:ring-honey-soft"
                    disabled={adding}
                />
                <Btn color="lav" onClick={handle} disabled={!name.trim() || adding}>
                    {adding ? '建立中…' : '🏫 建立學校'}
                </Btn>
            </div>
        </div>
    );
};

export default AdminPanel;
