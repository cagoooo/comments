import React, { useState, useEffect } from 'react';
import { X, Check, XCircle, Users, School, Shield, Clock, Building2, Trash2, FileText, ChevronDown, ChevronUp, Settings2, Key, Gift, Loader2 } from 'lucide-react';
import { userService, USER_ROLES, classService, schoolService, adminConfigService } from '../firebase';

/**
 * 管理員面板
 * 審核使用者、指派班級、刪除申請
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

    // 共享 API Key 相關狀態
    const [sharedConfig, setSharedConfig] = useState(null);
    const [sharedApiKeyInput, setSharedApiKeyInput] = useState('');
    const [isSavingSharedKey, setIsSavingSharedKey] = useState(false);
    const [isTogglingAuth, setIsTogglingAuth] = useState(null); // 正在切換授權的用戶 UID

    // 訂閱使用者、班級與學校
    useEffect(() => {
        if (!isOpen) return;

        setIsLoading(true);

        const unsubUsers = userService.subscribeAll((data) => {
            setUsers(data);
            setIsLoading(false);
        });

        const unsubClasses = classService.subscribe((data) => {
            setClasses(data);
        });

        const unsubSchools = schoolService.subscribe((data) => {
            setSchools(data);
        });

        // 訂閱共享 API Key 設定
        const unsubSharedConfig = adminConfigService.subscribe((config) => {
            setSharedConfig(config);
            if (config?.sharedApiKey) {
                setSharedApiKeyInput(config.sharedApiKey);
            }
        });

        return () => {
            unsubUsers();
            unsubClasses();
            unsubSchools();
            unsubSharedConfig();
        };
    }, [isOpen]);

    // 開啟編輯模式
    const handleEditUser = (user) => {
        setSelectedUser(user);
        // 如果用戶有申請資訊，預設選擇申請的學校和班級
        setSelectedSchool(user.schoolId || user.requestedSchoolId || null);
        // 將用戶申請的班級名稱找到對應的班級ID
        if (user.assignedClasses?.length > 0) {
            setSelectedClasses(user.assignedClasses);
        } else if (user.requestedClasses?.length > 0) {
            // 嘗試匹配申請的班級名稱到現有班級
            const matchedClassIds = user.requestedClasses
                .map(name => classes.find(c => c.name === name)?.id)
                .filter(Boolean);
            setSelectedClasses(matchedClassIds);
        } else {
            setSelectedClasses([]);
        }
    };

    // 切換班級選取
    const toggleClass = (classId) => {
        setSelectedClasses(prev =>
            prev.includes(classId)
                ? prev.filter(id => id !== classId)
                : [...prev, classId]
        );
    };

    // 審核通過
    const handleApprove = async () => {
        if (!selectedUser) return;

        // 如果沒有選擇現有學校，使用用戶申請的自訂學校資訊
        const customSchoolInfo = !selectedSchool && selectedUser.requestedSchoolName
            ? { name: selectedUser.requestedSchoolName, city: selectedUser.requestedSchoolCity }
            : null;

        // 決定使用的班級：優先使用管理員選擇的，否則嘗試匹配或創建用戶申請的班級
        let classesToUse = selectedClasses;
        if (selectedClasses.length === 0 && selectedUser.requestedClasses?.length > 0) {
            const classIdsToAssign = [];

            for (const className of selectedUser.requestedClasses) {
                // 先嘗試找現有班級
                const existingClass = classes.find(c => c.name === className);
                if (existingClass) {
                    classIdsToAssign.push(existingClass.id);
                } else {
                    // 班級不存在，自動創建
                    try {
                        const newClassId = await classService.add({ name: className });
                        if (newClassId) {
                            classIdsToAssign.push(newClassId);
                        }
                    } catch (error) {
                        console.error('自動創建班級失敗:', className, error);
                    }
                }
            }
            classesToUse = classIdsToAssign;
        }

        await userService.approve(selectedUser.id, classesToUse, selectedSchool, customSchoolInfo);
        setSelectedUser(null);
        setSelectedClasses([]);
        setSelectedSchool(null);
    };

    // 更新學校與班級指派
    const handleUpdateClasses = async () => {
        if (!selectedUser) return;

        // 決定使用的學校：優先使用管理員選擇的，否則使用用戶申請的
        let schoolToUse = selectedSchool;
        let customSchoolInfo = null;

        if (!selectedSchool && selectedUser.requestedSchoolName) {
            // 使用用戶申請的自訂學校
            customSchoolInfo = {
                name: selectedUser.requestedSchoolName,
                city: selectedUser.requestedSchoolCity
            };
        } else if (!selectedSchool && selectedUser.requestedSchoolId) {
            // 使用用戶申請的現有學校
            schoolToUse = selectedUser.requestedSchoolId;
        }

        // 決定使用的班級：優先使用管理員選擇的，否則嘗試匹配或創建用戶申請的班級
        let classesToUse = selectedClasses;
        if (selectedClasses.length === 0 && selectedUser.requestedClasses?.length > 0) {
            const classIdsToAssign = [];

            for (const className of selectedUser.requestedClasses) {
                // 先嘗試找現有班級
                const existingClass = classes.find(c => c.name === className);
                if (existingClass) {
                    classIdsToAssign.push(existingClass.id);
                } else {
                    // 班級不存在，自動創建
                    try {
                        const newClassId = await classService.add({ name: className });
                        if (newClassId) {
                            classIdsToAssign.push(newClassId);
                        }
                    } catch (error) {
                        console.error('自動創建班級失敗:', className, error);
                    }
                }
            }
            classesToUse = classIdsToAssign;
        }

        await userService.updateAssignedClasses(selectedUser.id, classesToUse, schoolToUse, customSchoolInfo);
        setSelectedUser(null);
        setSelectedClasses([]);
        setSelectedSchool(null);
    };

    // 拒絕/撤銷
    const handleReject = async (uid) => {
        if (!window.confirm('確定要拒絕/撤銷此使用者的權限嗎？將重置為待填資料狀態。')) return;
        await userService.reject(uid);
    };

    // 刪除使用者
    const handleDelete = async (uid) => {
        console.log('[AdminPanel] 嘗試刪除使用者:', uid);
        if (!window.confirm('確定要刪除此使用者嗎？此操作無法復原。')) {
            console.log('[AdminPanel] 使用者取消刪除');
            return;
        }
        try {
            console.log('[AdminPanel] 開始刪除...');
            const result = await userService.delete(uid);
            if (result.success) {
                console.log('[AdminPanel] 刪除成功');
            } else {
                console.error('[AdminPanel] 刪除失敗:', result.error);
                alert('刪除失敗: ' + (result.error || '未知錯誤'));
            }
        } catch (error) {
            console.error('[AdminPanel] 刪除錯誤:', error);
            alert('刪除失敗: ' + error.message);
        }
    };

    // 取得角色標籤
    const getRoleBadge = (role) => {
        switch (role) {
            case USER_ROLES.ADMIN:
                return <span className="px-2 py-0.5 bg-[#FF6B9D] text-white text-xs font-bold rounded-full">管理員</span>;
            case USER_ROLES.TEACHER:
                return <span className="px-2 py-0.5 bg-[#1DD1A1] text-white text-xs font-bold rounded-full">教師</span>;
            case USER_ROLES.PENDING_REVIEW:
                return <span className="px-2 py-0.5 bg-[#FECA57] text-[#2D3436] text-xs font-bold rounded-full">待審核</span>;
            case USER_ROLES.PENDING_INFO:
                return <span className="px-2 py-0.5 bg-[#A29BFE] text-white text-xs font-bold rounded-full">待填資料</span>;
            default:
                return <span className="px-2 py-0.5 bg-[#FECA57] text-[#2D3436] text-xs font-bold rounded-full">待審核</span>;
        }
    };

    // 格式化時間
    const formatTime = (timestamp) => {
        if (!timestamp?.toDate) return '-';
        return timestamp.toDate().toLocaleDateString('zh-TW');
    };

    // 取得學校名稱
    const getSchoolName = (schoolId) => {
        return schools.find(s => s.id === schoolId)?.name || '未知學校';
    };

    // ===== 共享 API Key 功能 =====

    // 儲存共享 API Key
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

    // 清除共享 API Key
    const handleClearSharedApiKey = async () => {
        if (!window.confirm('確定要清除共享 API Key 嗎？所有已授權用戶將無法使用。')) return;
        setIsSavingSharedKey(true);
        try {
            await adminConfigService.clearSharedApiKey(currentUser.uid);
            setSharedApiKeyInput('');
        } catch (error) {
            console.error('清除共享 API Key 失敗:', error);
        }
        setIsSavingSharedKey(false);
    };

    // 切換用戶授權
    const handleToggleAuthorization = async (userId) => {
        setIsTogglingAuth(userId);
        try {
            const isAuthorized = (sharedConfig?.authorizedUsers || []).includes(userId);
            if (isAuthorized) {
                await adminConfigService.revokeAccess(userId, currentUser.uid);
            } else {
                await adminConfigService.grantAccess(userId, currentUser.uid);
            }
        } catch (error) {
            console.error('切換授權失敗:', error);
        }
        setIsTogglingAuth(null);
    };

    // 遮蔽顯示 API Key
    const maskApiKey = (key) => {
        if (!key || key.length < 10) return key;
        return key.substring(0, 6) + '••••••••' + key.substring(key.length - 4);
    };

    // 檢查用戶是否已授權
    const isUserAuthorized = (userId) => {
        return (sharedConfig?.authorizedUsers || []).includes(userId);
    };

    // 計算已授權人數
    const authorizedCount = (sharedConfig?.authorizedUsers || []).length;

    // 僅教師（非管理員）
    const teacherUsers = users.filter(u => u.role === USER_ROLES.TEACHER);

    // 篩選待審核用戶（包含舊版 pending 和新版 pending_review）
    const pendingReviewUsers = users.filter(u =>
        u.role === USER_ROLES.PENDING_REVIEW || u.role === USER_ROLES.PENDING
    );

    // 篩選待填資料用戶
    const pendingInfoUsers = users.filter(u => u.role === USER_ROLES.PENDING_INFO);

    // 篩選已審核用戶
    const approvedUsers = users.filter(u =>
        u.role === USER_ROLES.TEACHER || u.role === USER_ROLES.ADMIN
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4">
            <div className="card-pop w-full max-w-4xl max-h-[90vh] flex flex-col animate-in bg-[#FFF9E6]">
                {/* Header */}
                <div className="p-3 sm:p-5 bg-[#FF6B9D] border-b-3 border-[#2D3436] flex items-center justify-between">
                    <h3 className="font-black text-white flex items-center gap-2 text-lg sm:text-xl">
                        <Shield size={24} />
                        管理員面板
                    </h3>
                    <button onClick={onClose} className="btn-pop p-2 bg-white text-[#2D3436]">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 mobile-scroll-hide">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-4xl animate-bounce">👥</div>
                        </div>
                    ) : selectedUser ? (
                        /* 編輯使用者 */
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white border-2 border-[#2D3436] rounded-lg">
                                <div className="flex items-center gap-3 flex-1">
                                    {selectedUser.photoURL ? (
                                        <img src={selectedUser.photoURL} alt="" className="w-12 h-12 rounded-full border-2 border-[#2D3436]" />
                                    ) : (
                                        <div className="w-12 h-12 bg-[#FECA57] rounded-full border-2 border-[#2D3436] flex items-center justify-center">👤</div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-[#2D3436] flex flex-wrap items-center gap-2">
                                            <span className="truncate">{selectedUser.displayName}</span>
                                            {getRoleBadge(selectedUser.role)}
                                        </div>
                                        <div className="text-sm text-[#636E72] truncate">{selectedUser.email}</div>
                                    </div>
                                </div>
                            </div>

                            {/* 顯示用戶申請資訊 */}
                            {(selectedUser.requestedSchoolId || selectedUser.requestedSchoolName || selectedUser.requestedClasses?.length > 0) && (
                                <div className="bg-[#54A0FF]/10 border-2 border-dashed border-[#54A0FF] rounded-lg p-4">
                                    <h4 className="font-bold text-[#54A0FF] mb-2 flex items-center gap-2 text-sm">
                                        <FileText size={16} />
                                        用戶申請資訊
                                    </h4>
                                    {selectedUser.requestedSchoolName && (
                                        <p className="text-sm text-[#2D3436] mb-1">
                                            <span className="font-medium">申請學校：</span>
                                            {selectedUser.requestedSchoolCity && `${selectedUser.requestedSchoolCity} `}
                                            {selectedUser.requestedSchoolName}
                                        </p>
                                    )}
                                    {selectedUser.requestedSchoolId && !selectedUser.requestedSchoolName && (
                                        <p className="text-sm text-[#2D3436] mb-1">
                                            <span className="font-medium">申請學校：</span>
                                            {getSchoolName(selectedUser.requestedSchoolId)}
                                        </p>
                                    )}
                                    {selectedUser.requestedClasses?.length > 0 && (
                                        <p className="text-sm text-[#2D3436]">
                                            <span className="font-medium">申請班級：</span>
                                            {selectedUser.requestedClasses.join('、')}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* 進階選項（可摺疊） */}
                            <div className="border-2 border-dashed border-[#636E72]/30 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                                    className="w-full px-4 py-2.5 bg-[#F8F4E8] flex items-center justify-between hover:bg-[#E8DCC8] transition-colors"
                                >
                                    <span className="flex items-center gap-2 text-sm font-medium text-[#636E72]">
                                        <Settings2 size={16} />
                                        進階選項（修改學校/班級）
                                    </span>
                                    {showAdvancedOptions ? (
                                        <ChevronUp size={18} className="text-[#636E72]" />
                                    ) : (
                                        <ChevronDown size={18} className="text-[#636E72]" />
                                    )}
                                </button>

                                {showAdvancedOptions && (
                                    <div className="p-3 sm:p-4 space-y-3 bg-[#F8F4E8]/50">
                                        {/* 指派學校 */}
                                        <div className="bg-white border border-[#2D3436]/30 rounded-lg p-3">
                                            <h4 className="font-bold text-[#636E72] mb-2 flex items-center gap-2 text-xs sm:text-sm">
                                                <Building2 size={14} />
                                                指派其他學校（可選）
                                            </h4>
                                            {schools.length === 0 ? (
                                                <QuickAddSchool onAdd={async (name, city, district) => {
                                                    await schoolService.add({ name, city, district });
                                                }} />
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {schools.map((school) => (
                                                            <button
                                                                key={school.id}
                                                                onClick={() => setSelectedSchool(selectedSchool === school.id ? null : school.id)}
                                                                className={`px-2 py-1 border border-[#2D3436]/50 rounded font-medium text-xs transition-all
                                                                  ${selectedSchool === school.id
                                                                        ? 'bg-[#A29BFE] text-white border-[#A29BFE]'
                                                                        : 'bg-white hover:bg-[#A29BFE]/10'}`}
                                                            >
                                                                {selectedSchool === school.id && <Check size={12} className="inline mr-0.5" />}
                                                                🏫 {school.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <QuickAddSchool compact onAdd={async (name, city, district) => {
                                                        await schoolService.add({ name, city, district });
                                                    }} />
                                                </div>
                                            )}
                                        </div>

                                        {/* 指派班級 */}
                                        <div className="bg-white border border-[#2D3436]/30 rounded-lg p-3">
                                            <h4 className="font-bold text-[#636E72] mb-2 flex items-center gap-2 text-xs sm:text-sm">
                                                <School size={14} />
                                                指派班級（可選）
                                            </h4>
                                            {classes.length === 0 ? (
                                                <QuickAddClass onAdd={async (name) => {
                                                    await classService.add({ name });
                                                }} />
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {classes.map((cls) => (
                                                            <button
                                                                key={cls.id}
                                                                onClick={() => toggleClass(cls.id)}
                                                                className={`px-2 py-1 border border-[#2D3436]/50 rounded font-medium text-xs transition-all
                                                                  ${selectedClasses.includes(cls.id)
                                                                        ? 'bg-[#54A0FF] text-white border-[#54A0FF]'
                                                                        : 'bg-white hover:bg-[#54A0FF]/10'}`}
                                                            >
                                                                {selectedClasses.includes(cls.id) && <Check size={12} className="inline mr-0.5" />}
                                                                {cls.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <QuickAddClass compact onAdd={async (name) => {
                                                        await classService.add({ name });
                                                    }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={() => { setSelectedUser(null); setSelectedClasses([]); }}
                                    className="btn-pop px-4 py-2.5 bg-[#636E72] text-white font-bold order-3 sm:order-1"
                                >
                                    取消
                                </button>
                                {(selectedUser.role === USER_ROLES.PENDING_REVIEW ||
                                    selectedUser.role === USER_ROLES.PENDING) ? (
                                    <button
                                        onClick={handleApprove}
                                        className="btn-pop px-4 py-2.5 bg-[#1DD1A1] text-white font-bold flex-1 flex items-center justify-center gap-2 order-1 sm:order-2"
                                    >
                                        <Check size={18} />
                                        審核通過
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleUpdateClasses}
                                        className="btn-pop px-4 py-2.5 bg-[#54A0FF] text-white font-bold flex-1 flex items-center justify-center gap-2 order-1 sm:order-2"
                                    >
                                        <Check size={18} />
                                        更新班級
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* 使用者列表 */
                        <div className="space-y-3">
                            {/* 統計 */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                                <div className="bg-[#FECA57] text-[#2D3436] p-2 sm:p-3 border-2 border-[#2D3436] rounded-lg text-center">
                                    <div className="text-xl sm:text-2xl font-black">{pendingReviewUsers.length}</div>
                                    <div className="text-xs font-bold">待審核</div>
                                </div>
                                <div className="bg-[#A29BFE] text-white p-2 sm:p-3 border-2 border-[#2D3436] rounded-lg text-center">
                                    <div className="text-xl sm:text-2xl font-black">{pendingInfoUsers.length}</div>
                                    <div className="text-xs font-bold">待填資料</div>
                                </div>
                                <div className="bg-[#1DD1A1] text-white p-2 sm:p-3 border-2 border-[#2D3436] rounded-lg text-center">
                                    <div className="text-xl sm:text-2xl font-black">{users.filter(u => u.role === USER_ROLES.TEACHER).length}</div>
                                    <div className="text-xs font-bold">教師</div>
                                </div>
                                <div className="bg-[#FF6B9D] text-white p-2 sm:p-3 border-2 border-[#2D3436] rounded-lg text-center">
                                    <div className="text-xl sm:text-2xl font-black">{users.filter(u => u.role === USER_ROLES.ADMIN).length}</div>
                                    <div className="text-xs font-bold">管理員</div>
                                </div>
                            </div>

                            {/* 🔑 共享 API Key 管理 */}
                            <div className="mb-6 bg-gradient-to-r from-[#FF9F43]/10 to-[#FECA57]/10 border-2 border-[#FF9F43] rounded-lg overflow-hidden">
                                <div className="p-3 bg-[#FF9F43] border-b-2 border-[#2D3436]">
                                    <h4 className="font-black text-white flex items-center gap-2 text-sm sm:text-base">
                                        <Key size={18} />
                                        共享 API Key 管理
                                        {authorizedCount > 0 && (
                                            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                                                {authorizedCount} 人已授權
                                            </span>
                                        )}
                                    </h4>
                                </div>
                                <div className="p-3 sm:p-4 space-y-3">
                                    {/* API Key 輸入區 */}
                                    <div className="bg-white border-2 border-[#2D3436] rounded-lg p-3">
                                        <label className="block text-xs font-bold text-[#636E72] mb-2">
                                            🔐 管理員付費 API Key
                                        </label>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input
                                                type="password"
                                                value={sharedApiKeyInput}
                                                onChange={(e) => setSharedApiKeyInput(e.target.value)}
                                                placeholder="輸入您的付費 API Key..."
                                                className="flex-1 px-3 py-2 border-2 border-[#2D3436] rounded-lg text-sm font-medium"
                                                disabled={isSavingSharedKey}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSaveSharedApiKey}
                                                    disabled={!sharedApiKeyInput.trim() || isSavingSharedKey}
                                                    className="btn-pop px-4 py-2 bg-[#1DD1A1] text-white text-sm font-bold disabled:opacity-50 flex items-center gap-1"
                                                >
                                                    {isSavingSharedKey ? <Loader2 size={14} className="animate-spin" /> : '💾'}
                                                    儲存
                                                </button>
                                                {sharedConfig?.sharedApiKey && (
                                                    <button
                                                        onClick={handleClearSharedApiKey}
                                                        disabled={isSavingSharedKey}
                                                        className="btn-pop px-3 py-2 bg-[#636E72] text-white text-sm font-bold disabled:opacity-50"
                                                    >
                                                        清除
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {sharedConfig?.sharedApiKey && (
                                            <p className="text-xs text-[#1DD1A1] mt-2 font-medium">
                                                ✓ 已設定：{maskApiKey(sharedConfig.sharedApiKey)}
                                            </p>
                                        )}
                                    </div>

                                    {/* 教師授權列表 */}
                                    {sharedConfig?.sharedApiKey && teacherUsers.length > 0 && (
                                        <div className="bg-white border-2 border-[#2D3436] rounded-lg p-3">
                                            <label className="block text-xs font-bold text-[#636E72] mb-2">
                                                🎁 授權教師使用共享 API Key
                                            </label>
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {teacherUsers.map((user) => (
                                                    <div
                                                        key={user.id}
                                                        className={`flex items-center gap-3 p-2 rounded-lg border-2 transition-all cursor-pointer
                                                            ${isUserAuthorized(user.id)
                                                                ? 'bg-[#1DD1A1]/10 border-[#1DD1A1]'
                                                                : 'bg-white border-[#2D3436]/20 hover:border-[#2D3436]/50'}`}
                                                        onClick={() => !isTogglingAuth && handleToggleAuthorization(user.id)}
                                                    >
                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                                                            ${isUserAuthorized(user.id)
                                                                ? 'bg-[#1DD1A1] border-[#1DD1A1]'
                                                                : 'border-[#2D3436]/50'}`}
                                                        >
                                                            {isTogglingAuth === user.id ? (
                                                                <Loader2 size={12} className="animate-spin text-white" />
                                                            ) : isUserAuthorized(user.id) ? (
                                                                <Check size={12} className="text-white" />
                                                            ) : null}
                                                        </div>
                                                        {user.photoURL ? (
                                                            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-[#2D3436]" />
                                                        ) : (
                                                            <div className="w-8 h-8 bg-[#FECA57] rounded-full border border-[#2D3436] flex items-center justify-center text-sm">👤</div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-bold text-sm text-[#2D3436] truncate">{user.displayName}</div>
                                                            <div className="text-xs text-[#636E72] truncate">{user.email}</div>
                                                        </div>
                                                        {isUserAuthorized(user.id) && (
                                                            <Gift size={16} className="text-[#1DD1A1] flex-shrink-0" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-[#636E72] mt-2">
                                                💡 勾選的教師將自動使用您的 API Key，無需自行申請
                                            </p>
                                        </div>
                                    )}

                                    {/* 無教師提示 */}
                                    {sharedConfig?.sharedApiKey && teacherUsers.length === 0 && (
                                        <p className="text-sm text-[#636E72] text-center py-4">
                                            目前沒有已審核的教師，請先審核教師申請
                                        </p>
                                    )}

                                    {/* 未設定 API Key 提示 */}
                                    {!sharedConfig?.sharedApiKey && (
                                        <p className="text-sm text-[#636E72] text-center py-2">
                                            請先設定共享 API Key，即可授權給教師使用
                                        </p>
                                    )}
                                </div>
                            </div>


                            {/* 待審核 */}
                            {pendingReviewUsers.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-bold text-[#FECA57] mb-2 flex items-center gap-2 text-sm sm:text-base">
                                        <Clock size={18} />
                                        待審核 ({pendingReviewUsers.length})
                                    </h4>
                                    {pendingReviewUsers.map((user) => (
                                        <UserRow
                                            key={user.id}
                                            user={user}
                                            onEdit={handleEditUser}
                                            onReject={handleReject}
                                            onDelete={handleDelete}
                                            getRoleBadge={getRoleBadge}
                                            formatTime={formatTime}
                                            classes={classes}
                                            schools={schools}
                                            showApplication={true}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* 待填資料 */}
                            {pendingInfoUsers.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-bold text-[#A29BFE] mb-2 flex items-center gap-2 text-sm sm:text-base">
                                        <FileText size={18} />
                                        待填資料 ({pendingInfoUsers.length})
                                    </h4>
                                    {pendingInfoUsers.map((user) => (
                                        <UserRow
                                            key={user.id}
                                            user={user}
                                            onEdit={null}
                                            onReject={handleReject}
                                            onDelete={handleDelete}
                                            getRoleBadge={getRoleBadge}
                                            formatTime={formatTime}
                                            classes={classes}
                                            schools={schools}
                                            showApplication={false}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* 已審核 */}
                            <div>
                                <h4 className="font-bold text-[#1DD1A1] mb-2 flex items-center gap-2 text-sm sm:text-base">
                                    <Users size={18} />
                                    已審核使用者 ({approvedUsers.length})
                                </h4>
                                {approvedUsers.map((user) => (
                                    <UserRow
                                        key={user.id}
                                        user={user}
                                        onEdit={handleEditUser}
                                        onReject={handleReject}
                                        onDelete={handleDelete}
                                        getRoleBadge={getRoleBadge}
                                        formatTime={formatTime}
                                        classes={classes}
                                        schools={schools}
                                        isCurrentUser={user.id === currentUser?.uid}
                                        showApplication={false}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 sm:p-4 bg-[#E8DCC8] border-t-2 border-dashed border-[#2D3436]/20 text-xs text-[#636E72] text-center">
                    共 {users.length} 位使用者 | 管理員可審核使用者並指派班級
                </div>
            </div>
        </div>
    );
};

// 使用者列表項目
const UserRow = ({ user, onEdit, onReject, onDelete, getRoleBadge, formatTime, classes, schools, isCurrentUser, showApplication }) => {
    const assignedClassNames = (user.assignedClasses || [])
        .map(id => classes.find(c => c.id === id)?.name)
        .filter(Boolean)
        .join(', ');

    const getSchoolName = (schoolId) => {
        return schools?.find(s => s.id === schoolId)?.name || null;
    };

    const isPending = user.role === USER_ROLES.PENDING_REVIEW ||
        user.role === USER_ROLES.PENDING ||
        user.role === USER_ROLES.PENDING_INFO;

    return (
        <div className={`p-3 bg-white border-2 border-[#2D3436] rounded-lg mb-2
            ${isCurrentUser ? 'ring-2 ring-[#FF6B9D]' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                {/* 用戶基本資訊 */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-[#2D3436] flex-shrink-0" />
                    ) : (
                        <div className="w-10 h-10 bg-[#FECA57] rounded-full border-2 border-[#2D3436] flex items-center justify-center text-lg flex-shrink-0">👤</div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="font-bold text-[#2D3436] text-sm flex flex-wrap items-center gap-1 sm:gap-2">
                            <span className="truncate">{user.displayName}</span>
                            {getRoleBadge(user.role)}
                            {isCurrentUser && <span className="text-xs text-[#636E72]">(你)</span>}
                        </div>
                        <div className="text-xs text-[#636E72] truncate">{user.email}</div>
                        {assignedClassNames && (
                            <div className="text-xs text-[#54A0FF] flex items-center gap-1 mt-0.5">
                                <School size={10} />
                                <span className="truncate">{assignedClassNames}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 申請資訊（待審核用戶顯示） */}
                {showApplication && (user.requestedSchoolId || user.requestedSchoolName || user.requestedClasses?.length > 0) && (
                    <div className="bg-[#54A0FF]/10 rounded-lg p-2 text-xs flex-shrink-0">
                        <div className="font-medium text-[#54A0FF] mb-1">📋 申請資訊</div>
                        {user.requestedSchoolName && (
                            <div className="text-[#2D3436]">
                                學校：{user.requestedSchoolCity && `${user.requestedSchoolCity} `}{user.requestedSchoolName}
                            </div>
                        )}
                        {user.requestedSchoolId && !user.requestedSchoolName && (
                            <div className="text-[#2D3436]">學校：{getSchoolName(user.requestedSchoolId)}</div>
                        )}
                        {user.requestedClasses?.length > 0 && (
                            <div className="text-[#2D3436]">班級：{user.requestedClasses.join('、')}</div>
                        )}
                    </div>
                )}

                {/* 操作按鈕 */}
                <div className="flex items-center gap-1 flex-shrink-0 self-end sm:self-center">
                    {user.role !== USER_ROLES.ADMIN && (
                        <>
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(user)}
                                    className="btn-pop px-3 py-1.5 bg-[#54A0FF] text-white text-xs font-bold"
                                >
                                    {isPending ? '審核' : '編輯'}
                                </button>
                            )}
                            {user.role === USER_ROLES.TEACHER && (
                                <button
                                    onClick={() => onReject(user.id)}
                                    className="btn-pop p-1.5 bg-[#FF6B6B] text-white"
                                    title="撤銷權限"
                                >
                                    <XCircle size={14} />
                                </button>
                            )}
                            {isPending && (
                                <button
                                    onClick={() => onDelete(user.id)}
                                    className="btn-pop p-1.5 bg-[#636E72] text-white"
                                    title="刪除申請"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// 快速建立班級元件
const QuickAddClass = ({ onAdd, compact = false }) => {
    const [newClassName, setNewClassName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
        if (!newClassName.trim()) return;
        setIsAdding(true);
        try {
            await onAdd(newClassName.trim());
            setNewClassName('');
        } catch (error) {
            console.error('建立班級失敗:', error);
        }
        setIsAdding(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleAdd();
        }
    };

    if (compact) {
        return (
            <div className="flex gap-2 items-center pt-2 border-t border-dashed border-[#2D3436]/20">
                <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="新增班級..."
                    className="flex-1 px-3 py-1.5 border-2 border-[#2D3436] rounded-lg text-sm"
                    disabled={isAdding}
                />
                <button
                    onClick={handleAdd}
                    disabled={!newClassName.trim() || isAdding}
                    className="btn-pop px-3 py-1.5 bg-[#1DD1A1] text-white text-xs font-bold disabled:opacity-50"
                >
                    {isAdding ? '...' : '+ 新增'}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-sm text-[#636E72]">尚無班級，請建立第一個班級：</p>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="輸入班級名稱 (例如：一年甲班)"
                    className="flex-1 px-3 py-2 border-2 border-[#2D3436] rounded-lg font-medium"
                    disabled={isAdding}
                />
                <button
                    onClick={handleAdd}
                    disabled={!newClassName.trim() || isAdding}
                    className="btn-pop px-4 py-2 bg-[#1DD1A1] text-white font-bold disabled:opacity-50 flex items-center gap-1"
                >
                    {isAdding ? '建立中...' : (
                        <>
                            <span>+</span> 建立班級
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

// 快速建立學校元件
const QuickAddSchool = ({ onAdd, compact = false }) => {
    const [newSchoolName, setNewSchoolName] = useState('');
    const [newSchoolCity, setNewSchoolCity] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
        if (!newSchoolName.trim()) return;
        setIsAdding(true);
        try {
            await onAdd(newSchoolName.trim(), newSchoolCity.trim() || null, null);
            setNewSchoolName('');
            setNewSchoolCity('');
        } catch (error) {
            console.error('建立學校失敗:', error);
        }
        setIsAdding(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleAdd();
        }
    };

    // 台灣縣市列表
    const cities = [
        '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
        '基隆市', '新竹市', '新竹縣', '苗栗縣', '彰化縣', '南投縣',
        '雲林縣', '嘉義市', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
        '台東縣', '澎湖縣', '金門縣', '連江縣'
    ];

    if (compact) {
        return (
            <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-dashed border-[#2D3436]/20">
                <select
                    value={newSchoolCity}
                    onChange={(e) => setNewSchoolCity(e.target.value)}
                    className="px-2 py-1.5 border-2 border-[#2D3436] rounded-lg text-sm bg-white"
                    disabled={isAdding}
                >
                    <option value="">縣市</option>
                    {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                    ))}
                </select>
                <input
                    type="text"
                    value={newSchoolName}
                    onChange={(e) => setNewSchoolName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="學校名稱..."
                    className="flex-1 min-w-[120px] px-3 py-1.5 border-2 border-[#2D3436] rounded-lg text-sm"
                    disabled={isAdding}
                />
                <button
                    onClick={handleAdd}
                    disabled={!newSchoolName.trim() || isAdding}
                    className="btn-pop px-3 py-1.5 bg-[#A29BFE] text-white text-xs font-bold disabled:opacity-50"
                >
                    {isAdding ? '...' : '+ 新增'}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-sm text-[#636E72]">尚無學校，請建立第一個學校：</p>
            <div className="flex gap-2 flex-wrap">
                <select
                    value={newSchoolCity}
                    onChange={(e) => setNewSchoolCity(e.target.value)}
                    className="px-3 py-2 border-2 border-[#2D3436] rounded-lg font-medium bg-white"
                    disabled={isAdding}
                >
                    <option value="">選擇縣市</option>
                    {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                    ))}
                </select>
                <input
                    type="text"
                    value={newSchoolName}
                    onChange={(e) => setNewSchoolName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="輸入學校名稱 (例如：台北市立國語實小)"
                    className="flex-1 min-w-[200px] px-3 py-2 border-2 border-[#2D3436] rounded-lg font-medium"
                    disabled={isAdding}
                />
                <button
                    onClick={handleAdd}
                    disabled={!newSchoolName.trim() || isAdding}
                    className="btn-pop px-4 py-2 bg-[#A29BFE] text-white font-bold disabled:opacity-50 flex items-center gap-1"
                >
                    {isAdding ? '建立中...' : (
                        <>
                            <span>🏫</span> 建立學校
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default AdminPanel;
