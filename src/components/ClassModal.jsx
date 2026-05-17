import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Edit2, Trash2, Check, School, Users, Eye, ChevronDown, ChevronUp, X,
} from 'lucide-react';
import { classService, userService, schoolService } from '../firebase';
import ModalShell from './ui/ModalShell';
import { Btn } from './atoms';

/**
 * 班級管理 Modal
 *
 * Props 保留：isOpen / onClose / currentClassId / onSelectClass / currentUser / onViewUserStudents
 * Firebase: classService / userService / schoolService 三 subscribe
 * 邏輯保留：admin 看全部、非 admin 過濾 assignedClasses + 同學校；展開經營者；查看學生
 */
const ClassModal = ({ isOpen, onClose, currentClassId, onSelectClass, currentUser, onViewUserStudents }) => {
    const [allClasses, setAllClasses] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [allSchools, setAllSchools] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [newClassName, setNewClassName] = useState('');
    const [editName, setEditName] = useState('');
    const [expandedClassId, setExpandedClassId] = useState(null);

    const isAdmin = currentUser?.role === 'admin';

    useEffect(() => {
        if (!isOpen) return;
        setIsLoading(true);
        const unsub = classService.subscribe((data) => {
            setAllClasses(data);
            setIsLoading(false);
        });
        return () => unsub();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !isAdmin) return;
        const unsub = userService.subscribeAll((data) => setAllUsers(data));
        return () => unsub();
    }, [isOpen, isAdmin]);

    useEffect(() => {
        if (!isOpen) return;
        const unsub = schoolService.subscribe((data) => setAllSchools(data));
        return () => unsub();
    }, [isOpen]);

    const getUserSchoolId = (user) => {
        if (user?.customSchoolName) {
            return `${user.customSchoolCity || ''}_${user.customSchoolName}`.trim();
        }
        return null;
    };

    const currentUserSchoolId = getUserSchoolId(currentUser);

    const classes = useMemo(() => {
        if (isAdmin) return allClasses;
        const assignedClassIds = currentUser?.assignedClasses || [];
        return allClasses.filter(cls => {
            if (!assignedClassIds.includes(cls.id)) return false;
            if (cls.schoolId && currentUserSchoolId && cls.schoolId !== currentUserSchoolId) return false;
            return true;
        });
    }, [allClasses, currentUser, isAdmin, currentUserSchoolId]);

    const classOwners = useMemo(() => {
        const map = {};
        allClasses.forEach(cls => {
            map[cls.id] = allUsers.filter(u => (u.assignedClasses || []).includes(cls.id));
        });
        return map;
    }, [allClasses, allUsers]);

    const handleAdd = async () => {
        if (!newClassName.trim()) return;
        try {
            await classService.add({
                name: newClassName.trim(),
                year: new Date().getFullYear(),
                schoolId: currentUserSchoolId,
            });
            setNewClassName('');
            setIsAdding(false);
        } catch (error) {
            console.error('新增班級失敗:', error);
        }
    };

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

    const handleDelete = async (id) => {
        if (!window.confirm('確定要刪除此班級嗎？')) return;
        try {
            await classService.delete(id);
            if (currentClassId === id) onSelectClass(null);
        } catch (error) {
            console.error('刪除班級失敗:', error);
        }
    };

    const handleSelect = (classId) => {
        onSelectClass(classId);
        onClose();
    };

    const toggleExpand = (classId) => {
        setExpandedClassId(prev => prev === classId ? null : classId);
    };

    const handleViewUserStudents = (user) => {
        if (onViewUserStudents) onViewUserStudents(user);
        onClose();
    };

    const getSchoolDisplay = (user) => {
        if (user.customSchoolName) {
            return user.customSchoolCity ? `${user.customSchoolCity} ${user.customSchoolName}` : user.customSchoolName;
        }
        if (user.schoolId) {
            const school = allSchools.find(s => s.id === user.schoolId);
            if (school) return school.city ? `${school.city} ${school.name}` : school.name;
        }
        return user.schoolName || '';
    };

    return (
        <ModalShell
            open={isOpen}
            onClose={onClose}
            width={560}
            eyebrow="Class Management"
            tapeColor="lav"
            icon={<School size={18} strokeWidth={1.8} />}
            title="班級管理"
            subtitle={
                <>
                    共 <span className="font-bold text-[var(--ink)]">{classes.length}</span> 個班級
                    {isAdmin && ' · 點擊展開查看經營者'}
                </>
            }
            footer={
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-[12px] text-[var(--ink-soft)]">
                        {isAdmin ? '管理員可新增 / 編輯 / 刪除班級' : '聯繫管理員可調整指派'}
                    </div>
                    <Btn variant="outline" size="sm" onClick={onClose}>
                        關閉
                    </Btn>
                </div>
            }
        >
            <div className="px-5 sm:px-7 py-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16 text-4xl bee-bob" aria-label="載入中">
                        🏫
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {/* 全部學生 */}
                        <button
                            type="button"
                            onClick={() => handleSelect(null)}
                            style={{
                                background: !currentClassId ? 'var(--ink)' : 'white',
                                color: !currentClassId ? 'var(--paper)' : 'var(--ink)',
                            }}
                            className="w-full p-3 sm:p-4 b-ink sh-btn r-btn flex items-center justify-between btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                            aria-pressed={!currentClassId}
                        >
                            <span className="font-bold flex items-center gap-2 text-[14px]">
                                <span className="text-lg" aria-hidden="true">📚</span> 全部學生
                            </span>
                            {!currentClassId && <Check size={18} strokeWidth={2.2} />}
                        </button>

                        {/* 班級列表 */}
                        {classes.map(cls => {
                            const owners = classOwners[cls.id] || [];
                            const isExpanded = expandedClassId === cls.id;
                            const isActive = currentClassId === cls.id;

                            return (
                                <div
                                    key={cls.id}
                                    style={{
                                        background: isActive ? 'var(--honey-soft)' : 'white',
                                    }}
                                    className="b-ink sh-sm r-card overflow-hidden"
                                >
                                    {editingId === cls.id ? (
                                        <div className="p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleUpdate(cls.id)}
                                                className="flex-1 px-3 h-10 b-ink r-btn font-bold text-[14px] outline-none focus:ring-2 focus:ring-honey-soft"
                                                autoFocus
                                                aria-label="編輯班級名稱"
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <Btn size="sm" color="mint" icon={<Check size={14} strokeWidth={1.8} />} onClick={() => handleUpdate(cls.id)} ariaLabel="儲存">
                                                    儲存
                                                </Btn>
                                                <Btn size="sm" variant="outline" icon={<X size={14} strokeWidth={1.8} />} onClick={() => setEditingId(null)} ariaLabel="取消">
                                                    取消
                                                </Btn>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="p-3 sm:p-4 flex items-center justify-between gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelect(cls.id)}
                                                    className="flex-1 text-left font-bold flex items-center gap-2 text-[14px] min-w-0 focus-visible:outline-none focus-visible:text-[var(--ink)]"
                                                    aria-pressed={isActive}
                                                >
                                                    <span className="text-lg shrink-0" aria-hidden="true">🏫</span>
                                                    <span className="truncate text-[var(--ink)]">{cls.name}</span>
                                                    {isActive && <Check size={16} strokeWidth={2.2} className="shrink-0 text-[var(--ink)]" />}
                                                </button>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    {isAdmin && owners.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); toggleExpand(cls.id); }}
                                                            className="b-soft r-btn h-8 px-2 bg-white inline-flex items-center gap-1 text-[11.5px] font-bold text-[var(--ink-soft)] btn-press"
                                                            title="查看經營者"
                                                            aria-expanded={isExpanded}
                                                        >
                                                            <Users size={12} strokeWidth={1.8} />
                                                            <span className="hidden sm:inline">{owners.length}</span>
                                                            {isExpanded ? <ChevronUp size={12} strokeWidth={1.8} /> : <ChevronDown size={12} strokeWidth={1.8} />}
                                                        </button>
                                                    )}
                                                    {isAdmin && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setEditingId(cls.id); setEditName(cls.name); }}
                                                                className="b-soft r-btn h-8 w-8 bg-white inline-flex items-center justify-center text-[var(--ink-soft)] hover:text-[var(--sky)] btn-press"
                                                                aria-label="編輯班級"
                                                                title="編輯"
                                                            >
                                                                <Edit2 size={13} strokeWidth={1.8} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(cls.id)}
                                                                className="b-soft r-btn h-8 w-8 bg-white inline-flex items-center justify-center text-[var(--ink-soft)] hover:text-[var(--coral)] btn-press"
                                                                aria-label="刪除班級"
                                                                title="刪除"
                                                            >
                                                                <Trash2 size={13} strokeWidth={1.8} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 經營者列表 */}
                                            {isAdmin && isExpanded && owners.length > 0 && (
                                                <div
                                                    className="border-t border-dashed border-[var(--line-soft)] p-2.5 sm:p-3 space-y-2"
                                                    style={{ background: 'var(--paper-2)' }}
                                                >
                                                    <div className="text-[11px] font-bold text-[var(--ink-soft)] flex items-center gap-1 mb-1 uppercase tracking-wider">
                                                        <Users size={11} strokeWidth={1.8} /> 經營者 ({owners.length})
                                                    </div>
                                                    {owners.map(owner => (
                                                        <div
                                                            key={owner.id}
                                                            className="flex items-center gap-2 p-2 bg-white b-soft r-btn"
                                                        >
                                                            {owner.photoURL ? (
                                                                <img
                                                                    src={owner.photoURL}
                                                                    alt=""
                                                                    className="w-7 h-7 rounded-full border border-[var(--ink)] shrink-0"
                                                                />
                                                            ) : (
                                                                <div
                                                                    className="w-7 h-7 rounded-full border border-[var(--ink)] flex items-center justify-center text-[10px] font-bold shrink-0"
                                                                    style={{ background: 'var(--honey)' }}
                                                                >
                                                                    {(owner.displayName || '?').charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-bold text-[12.5px] truncate text-[var(--ink)]">
                                                                    {owner.displayName}
                                                                </div>
                                                                {getSchoolDisplay(owner) && (
                                                                    <div className="text-[10.5px] truncate text-[var(--ink-soft)]">
                                                                        🏫 {getSchoolDisplay(owner)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <Btn
                                                                size="sm"
                                                                color="sky"
                                                                icon={<Eye size={11} strokeWidth={1.8} />}
                                                                onClick={() => handleViewUserStudents(owner)}
                                                                className="shrink-0"
                                                            >
                                                                <span className="hidden sm:inline">查看學生</span>
                                                                <span className="sm:hidden">查看</span>
                                                            </Btn>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {isAdmin && isExpanded && owners.length === 0 && (
                                                <div className="border-t border-dashed border-[var(--line-soft)] p-3 text-center text-[11.5px] text-[var(--ink-soft)]">
                                                    尚無老師被指派到此班級
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}

                        {/* 新增班級 */}
                        {isAdmin && (isAdding ? (
                            <div className="p-3 b-dash r-card" style={{ background: 'var(--mint-soft)' }}>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                    <input
                                        type="text"
                                        value={newClassName}
                                        onChange={(e) => setNewClassName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                        placeholder="輸入班級名稱…"
                                        className="flex-1 px-3 h-10 b-ink r-btn font-bold text-[14px] bg-white outline-none focus:ring-2 focus:ring-honey-soft"
                                        autoFocus
                                        aria-label="新班級名稱"
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <Btn size="sm" color="mint" icon={<Check size={14} strokeWidth={1.8} />} onClick={handleAdd}>
                                            新增
                                        </Btn>
                                        <Btn size="sm" variant="outline" icon={<X size={14} strokeWidth={1.8} />} onClick={() => { setIsAdding(false); setNewClassName(''); }}>
                                            取消
                                        </Btn>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsAdding(true)}
                                className="w-full p-3 sm:p-4 b-dash r-card text-[var(--mint)] font-bold flex items-center justify-center gap-2 hover:bg-[var(--mint-soft)]/40 transition-colors text-[14px] focus-visible:outline-none focus-visible:bg-[var(--mint-soft)]/40"
                            >
                                <Plus size={18} strokeWidth={2} />
                                新增班級
                            </button>
                        ))}

                        {classes.length === 0 && !isAdding && (
                            <div className="text-center py-8 text-[var(--ink-soft)]">
                                <div className="text-4xl mb-3" aria-hidden="true">🏫</div>
                                <div className="font-bold text-[14px]">
                                    {isAdmin ? '還沒有班級' : '您尚未被指派任何班級'}
                                </div>
                                <div className="text-[12px] mt-1 text-[var(--ink-mute)]">
                                    {isAdmin ? '點擊上方「新增班級」開始管理' : '請聯繫管理員為您指派班級'}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ModalShell>
    );
};

export default ClassModal;
