import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Edit2, Trash2, Check, School } from 'lucide-react';
import { classService } from '../firebase';

/**
 * 班級管理 Modal
 * 新增、編輯、刪除班級
 * 非管理員用戶只能看到被指派的班級
 */
const ClassModal = ({ isOpen, onClose, currentClassId, onSelectClass, currentUser }) => {
    const [allClasses, setAllClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [newClassName, setNewClassName] = useState('');
    const [editName, setEditName] = useState('');

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

    // 過濾班級：管理員顯示全部，普通用戶只顯示被指派的班級
    const isAdmin = currentUser?.role === 'admin';
    const classes = useMemo(() => {
        if (isAdmin) return allClasses;
        const assignedClassIds = currentUser?.assignedClasses || [];
        return allClasses.filter(cls => assignedClassIds.includes(cls.id));
    }, [allClasses, currentUser, isAdmin]);

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
                                className={`w-full p-4 border-2 border-[#2D3436] rounded-lg flex items-center justify-between transition-all shadow-[3px_3px_0_#2D3436]
                  ${!currentClassId ? 'bg-[#1DD1A1] text-white' : 'bg-white hover:bg-[#FECA57]/20'}`}
                            >
                                <span className="font-bold flex items-center gap-2">
                                    <span className="text-lg">📚</span> 全部學生
                                </span>
                                {!currentClassId && <Check size={20} />}
                            </button>

                            {/* 班級列表 */}
                            {classes.map((cls) => (
                                <div
                                    key={cls.id}
                                    className={`p-4 border-2 border-[#2D3436] rounded-lg shadow-[3px_3px_0_#2D3436] transition-all
                    ${currentClassId === cls.id ? 'bg-[#54A0FF] text-white' : 'bg-white'}`}
                                >
                                    {editingId === cls.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="flex-1 p-2 border-2 border-[#2D3436] rounded-lg text-[#2D3436] font-bold"
                                                autoFocus
                                            />
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
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <button
                                                onClick={() => handleSelect(cls.id)}
                                                className="flex-1 text-left font-bold flex items-center gap-2"
                                            >
                                                <span className="text-lg">🏫</span> {cls.name}
                                                {currentClassId === cls.id && <Check size={18} />}
                                            </button>
                                            {isAdmin && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => { setEditingId(cls.id); setEditName(cls.name); }}
                                                        className="p-2 hover:text-[#54A0FF] transition-colors"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(cls.id)}
                                                        className="p-2 hover:text-[#FF6B6B] transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* 新增班級（僅管理員） */}
                            {isAdmin && isAdding ? (
                                <div className="p-4 border-2 border-dashed border-[#1DD1A1] rounded-lg bg-[#1DD1A1]/10">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={newClassName}
                                            onChange={(e) => setNewClassName(e.target.value)}
                                            placeholder="輸入班級名稱..."
                                            className="flex-1 p-2 border-2 border-[#2D3436] rounded-lg font-bold"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                        />
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
                            ) : isAdmin && (
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="w-full p-4 border-2 border-dashed border-[#1DD1A1] rounded-lg text-[#1DD1A1] font-bold flex items-center justify-center gap-2 hover:bg-[#1DD1A1]/10 transition-colors"
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
                    共 {classes.length} 個班級 | 點擊班級切換顯示的學生
                </div>
            </div>
        </div>
    );
};

export default ClassModal;
