import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Edit2, Trash2, Check, School, User, Users, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { classService, userService, studentService } from '../firebase';

/**
 * 班級管理 Modal
 * 新增、編輯、刪除班級
 * 管理員可查看班級經營者及其學生資料
 */
const ClassModal = ({ isOpen, onClose, currentClassId, onSelectClass, currentUser, onViewUserStudents }) => {
    const [allClasses, setAllClasses] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [newClassName, setNewClassName] = useState('');
    const [editName, setEditName] = useState('');
    const [expandedClassId, setExpandedClassId] = useState(null);

    // 訂閱班級即時更新
    useEffect(() => {
        if (!isOpen) return;

        setIsLoading(true);
        const unsubscribe = classService.subscribe((data) => {
            setAllClasses(data);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen]);

    // 訂閱用戶列表（管理員用）
    useEffect(() => {
        if (!isOpen || !isAdmin) return;

        const unsubscribe = userService.subscribeAll((data) => {
            setAllUsers(data);
        });

        return () => unsubscribe();
    }, [isOpen]);

    // 過濾班級：管理員顯示全部，普通用戶只顯示被指派的班級
    const isAdmin = currentUser?.role === 'admin';
    const classes = useMemo(() => {
        if (isAdmin) return allClasses;
        const assignedClassIds = currentUser?.assignedClasses || [];
        return allClasses.filter(cls => assignedClassIds.includes(cls.id));
    }, [allClasses, currentUser, isAdmin]);

    // 建立班級與經營者的對應關係
    const classOwners = useMemo(() => {
        const map = {};
        allClasses.forEach(cls => {
            map[cls.id] = allUsers.filter(user =>
                (user.assignedClasses || []).includes(cls.id)
            );
        });
        return map;
    }, [allClasses, allUsers]);

    // 新增班級
    const handleAdd = async () => {
        if (!newClassName.trim()) return;

        try {
            await classService.add({
                name: newClassName.trim(),
                year: new Date().getFullYear()
            });
            setNewClassName('');
            setIsAdding(false);
        } catch (error) {
            console.error('新增班級失敗:', error);
        }
    };

    // 更新班級
    const handleUpdate = async (id) => {
        if (!editName.trim()) return;

        try {
            await classService.update(id, { name: editName.trim() });
            setEditingId(null);
            setEditName('');
        } catch (error) {
            console.error('更新班級失敗:', error);
        }
    };

    // 刪除班級
    const handleDelete = async (id) => {
        if (!window.confirm('確定要刪除此班級嗎？')) return;

        try {
            await classService.delete(id);
            if (currentClassId === id) {
                onSelectClass(null); // 如果刪除的是當前班級，清除選擇
            }
        } catch (error) {
            console.error('刪除班級失敗:', error);
        }
    };

    // 選擇班級
    const handleSelect = (classId) => {
        onSelectClass(classId);
        onClose();
    };

    // 切換展開/收合班級經營者
    const toggleExpand = (classId) => {
        setExpandedClassId(prev => prev === classId ? null : classId);
    };

    // 查看某用戶的學生資料
    const handleViewUserStudents = (user) => {
        if (onViewUserStudents) {
            onViewUserStudents(user);
        }
        onClose();
    };

    // 取得學校名稱顯示
    const getSchoolDisplay = (user) => {
        if (user.customSchoolName) {
            return user.customSchoolCity ? `${user.customSchoolCity} ${user.customSchoolName}` : user.customSchoolName;
        }
        return user.schoolName || '';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4">
            <div className="card-pop w-full max-w-lg max-h-[85vh] flex flex-col animate-in bg-[#FFF9E6]">
                {/* Header */}
                <div className="p-3 sm:p-5 bg-[#A29BFE] border-b-3 border-[#2D3436] flex items-center justify-between">
                    <h3 className="font-black text-white flex items-center gap-2 text-lg sm:text-xl">
                        <School size={24} />
                        班級管理
                    </h3>
                    <button onClick={onClose} className="btn-pop p-2 bg-white text-[#2D3436]">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 mobile-scroll-hide">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-4xl animate-bounce">🏫</div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* 全部學生選項 */}
                            <button
                                onClick={() => handleSelect(null)}
                                className={`w-full p-3 sm:p-4 border-2 border-[#2D3436] rounded-lg flex items-center justify-between transition-all shadow-[3px_3px_0_#2D3436]
                  ${!currentClassId ? 'bg-[#1DD1A1] text-white' : 'bg-white hover:bg-[#FECA57]/20'}`}
                            >
                                <span className="font-bold flex items-center gap-2 text-sm sm:text-base">
                                    <span className="text-lg">📚</span> 全部學生
                                </span>
                                {!currentClassId && <Check size={20} />}
                            </button>

                            {/* 班級列表 */}
                            {classes.map((cls) => {
                                const owners = classOwners[cls.id] || [];
                                const isExpanded = expandedClassId === cls.id;

                                return (
                                    <div
                                        key={cls.id}
                                        className={`border-2 border-[#2D3436] rounded-lg shadow-[3px_3px_0_#2D3436] transition-all overflow-hidden
                                            ${currentClassId === cls.id ? 'bg-[#54A0FF] text-white' : 'bg-white'}`}
                                    >
                                        {editingId === cls.id ? (
                                            <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="flex-1 p-2 border-2 border-[#2D3436] rounded-lg text-[#2D3436] font-bold text-sm"
                                                    autoFocus
                                                />
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => handleUpdate(cls.id)}
                                                        className="btn-pop p-2 bg-[#1DD1A1] text-white"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="btn-pop p-2 bg-[#636E72] text-white"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* 班級主行 */}
                                                <div className="p-3 sm:p-4 flex items-center justify-between gap-2">
                                                    <button
                                                        onClick={() => handleSelect(cls.id)}
                                                        className="flex-1 text-left font-bold flex items-center gap-2 text-sm sm:text-base min-w-0"
                                                    >
                                                        <span className="text-lg shrink-0">🏫</span>
                                                        <span className="truncate">{cls.name}</span>
                                                        {currentClassId === cls.id && <Check size={18} className="shrink-0" />}
                                                    </button>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {/* 展開經營者按鈕（僅管理員可見且有經營者時） */}
                                                        {isAdmin && owners.length > 0 && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); toggleExpand(cls.id); }}
                                                                className={`p-1.5 sm:p-2 rounded transition-colors flex items-center gap-1 text-xs
                                                                    ${currentClassId === cls.id ? 'hover:bg-white/20' : 'hover:bg-[#A29BFE]/20 text-[#A29BFE]'}`}
                                                                title="查看經營者"
                                                            >
                                                                <Users size={14} />
                                                                <span className="hidden sm:inline">{owners.length}</span>
                                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                            </button>
                                                        )}
                                                        {isAdmin && (
                                                            <>
                                                                <button
                                                                    onClick={() => { setEditingId(cls.id); setEditName(cls.name); }}
                                                                    className={`p-1.5 sm:p-2 transition-colors ${currentClassId === cls.id ? 'hover:bg-white/20' : 'hover:text-[#54A0FF]'}`}
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(cls.id)}
                                                                    className={`p-1.5 sm:p-2 transition-colors ${currentClassId === cls.id ? 'hover:bg-white/20' : 'hover:text-[#FF6B6B]'}`}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* 經營者列表（展開時顯示） */}
                                                {isAdmin && isExpanded && owners.length > 0 && (
                                                    <div className={`border-t-2 border-dashed p-2 sm:p-3 space-y-2
                                                        ${currentClassId === cls.id ? 'border-white/30 bg-white/10' : 'border-[#2D3436]/20 bg-[#F8F4E8]'}`}>
                                                        <p className={`text-xs font-bold flex items-center gap-1 mb-2
                                                            ${currentClassId === cls.id ? 'text-white/80' : 'text-[#636E72]'}`}>
                                                            <Users size={12} />
                                                            經營者 ({owners.length})
                                                        </p>
                                                        {owners.map((owner) => (
                                                            <div
                                                                key={owner.id}
                                                                className={`flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-lg border transition-all
                                                                    ${currentClassId === cls.id
                                                                        ? 'bg-white/20 border-white/30'
                                                                        : 'bg-white border-[#2D3436]/20 hover:border-[#54A0FF]'}`}
                                                            >
                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                    {owner.photoURL ? (
                                                                        <img src={owner.photoURL} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#2D3436] shrink-0" />
                                                                    ) : (
                                                                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#FECA57] rounded-full border border-[#2D3436] flex items-center justify-center text-xs shrink-0">👤</div>
                                                                    )}
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className={`font-bold text-xs sm:text-sm truncate
                                                                            ${currentClassId === cls.id ? 'text-white' : 'text-[#2D3436]'}`}>
                                                                            {owner.displayName}
                                                                        </p>
                                                                        {getSchoolDisplay(owner) && (
                                                                            <p className={`text-[10px] sm:text-xs truncate
                                                                                ${currentClassId === cls.id ? 'text-white/70' : 'text-[#636E72]'}`}>
                                                                                🏫 {getSchoolDisplay(owner)}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleViewUserStudents(owner)}
                                                                    className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-bold transition-all self-end sm:self-auto
                                                                        ${currentClassId === cls.id
                                                                            ? 'bg-white text-[#54A0FF] hover:bg-white/90'
                                                                            : 'bg-[#54A0FF] text-white hover:bg-[#54A0FF]/80'}`}
                                                                >
                                                                    <Eye size={12} />
                                                                    <span className="hidden sm:inline">查看學生</span>
                                                                    <span className="sm:hidden">查看</span>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* 無經營者提示 */}
                                                {isAdmin && isExpanded && owners.length === 0 && (
                                                    <div className={`border-t-2 border-dashed p-3 text-center text-xs
                                                        ${currentClassId === cls.id ? 'border-white/30 text-white/70' : 'border-[#2D3436]/20 text-[#636E72]'}`}>
                                                        尚無老師被指派到此班級
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}

                            {/* 新增班級（僅管理員） */}
                            {isAdmin && isAdding ? (
                                <div className="p-3 sm:p-4 border-2 border-dashed border-[#1DD1A1] rounded-lg bg-[#1DD1A1]/10">
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                        <input
                                            type="text"
                                            value={newClassName}
                                            onChange={(e) => setNewClassName(e.target.value)}
                                            placeholder="輸入班級名稱..."
                                            className="flex-1 p-2 border-2 border-[#2D3436] rounded-lg font-bold text-sm"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={handleAdd}
                                                className="btn-pop p-2 bg-[#1DD1A1] text-white"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={() => { setIsAdding(false); setNewClassName(''); }}
                                                className="btn-pop p-2 bg-[#636E72] text-white"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : isAdmin && (
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="w-full p-3 sm:p-4 border-2 border-dashed border-[#1DD1A1] rounded-lg text-[#1DD1A1] font-bold flex items-center justify-center gap-2 hover:bg-[#1DD1A1]/10 transition-colors text-sm sm:text-base"
                                >
                                    <Plus size={20} />
                                    新增班級
                                </button>
                            )}

                            {classes.length === 0 && !isAdding && (
                                <div className="text-center py-8 text-[#636E72]">
                                    <div className="text-4xl mb-3">🏫</div>
                                    <p className="font-bold">{isAdmin ? '還沒有班級' : '您尚未被指派任何班級'}</p>
                                    <p className="text-sm mt-1">{isAdmin ? '點擊上方「新增班級」開始管理' : '請聯繫管理員為您指派班級'}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 sm:p-4 bg-[#E8DCC8] border-t-2 border-dashed border-[#2D3436]/20 text-xs text-[#636E72] text-center">
                    共 {classes.length} 個班級 {isAdmin && '| 點擊展開查看經營者'}
                </div>
            </div>
        </div>
    );
};

export default ClassModal;
