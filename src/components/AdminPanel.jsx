import React, { useState, useEffect } from 'react';
import { X, Check, XCircle, Users, School, Shield, Clock } from 'lucide-react';
import { userService, USER_ROLES, classService } from '../firebase';

/**
 * 管理員面板
 * 審核使用者、指派班級
 */
const AdminPanel = ({ isOpen, onClose, currentUser }) => {
    const [users, setUsers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedClasses, setSelectedClasses] = useState([]);

    // 訂閱使用者與班級
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

        return () => {
            unsubUsers();
            unsubClasses();
        };
    }, [isOpen]);

    // 開啟編輯模式
    const handleEditUser = (user) => {
        setSelectedUser(user);
        setSelectedClasses(user.assignedClasses || []);
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

        await userService.approve(selectedUser.id, selectedClasses);
        setSelectedUser(null);
        setSelectedClasses([]);
    };

    // 更新班級指派
    const handleUpdateClasses = async () => {
        if (!selectedUser) return;

        await userService.updateAssignedClasses(selectedUser.id, selectedClasses);
        setSelectedUser(null);
        setSelectedClasses([]);
    };

    // 拒絕/撤銷
    const handleReject = async (uid) => {
        if (!window.confirm('確定要拒絕/撤銷此使用者的權限嗎？')) return;
        await userService.reject(uid);
    };

    // 取得角色標籤
    const getRoleBadge = (role) => {
        switch (role) {
            case USER_ROLES.ADMIN:
                return <span className="px-2 py-0.5 bg-[#FF6B9D] text-white text-xs font-bold rounded-full">管理員</span>;
            case USER_ROLES.TEACHER:
                return <span className="px-2 py-0.5 bg-[#1DD1A1] text-white text-xs font-bold rounded-full">教師</span>;
            default:
                return <span className="px-2 py-0.5 bg-[#FECA57] text-[#2D3436] text-xs font-bold rounded-full">待審核</span>;
        }
    };

    // 格式化時間
    const formatTime = (timestamp) => {
        if (!timestamp?.toDate) return '-';
        return timestamp.toDate().toLocaleDateString('zh-TW');
    };

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
                            <div className="flex items-center gap-3 p-4 bg-white border-2 border-[#2D3436] rounded-lg">
                                {selectedUser.photoURL ? (
                                    <img src={selectedUser.photoURL} alt="" className="w-12 h-12 rounded-full border-2 border-[#2D3436]" />
                                ) : (
                                    <div className="w-12 h-12 bg-[#FECA57] rounded-full border-2 border-[#2D3436] flex items-center justify-center">👤</div>
                                )}
                                <div>
                                    <div className="font-bold text-[#2D3436]">{selectedUser.displayName}</div>
                                    <div className="text-sm text-[#636E72]">{selectedUser.email}</div>
                                </div>
                                {getRoleBadge(selectedUser.role)}
                            </div>

                            <div className="bg-white border-2 border-[#2D3436] rounded-lg p-4">
                                <h4 className="font-bold text-[#2D3436] mb-3 flex items-center gap-2">
                                    <School size={18} />
                                    指派班級
                                </h4>
                                {classes.length === 0 ? (
                                    <p className="text-sm text-[#636E72]">尚無班級，請先建立班級</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {classes.map((cls) => (
                                            <button
                                                key={cls.id}
                                                onClick={() => toggleClass(cls.id)}
                                                className={`px-3 py-2 border-2 border-[#2D3436] rounded-lg font-bold text-sm transition-all
                          ${selectedClasses.includes(cls.id)
                                                        ? 'bg-[#54A0FF] text-white shadow-[2px_2px_0_#2D3436]'
                                                        : 'bg-white hover:bg-[#FECA57]/20'}`}
                                            >
                                                {selectedClasses.includes(cls.id) && <Check size={14} className="inline mr-1" />}
                                                {cls.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setSelectedUser(null); setSelectedClasses([]); }}
                                    className="btn-pop px-4 py-2 bg-[#636E72] text-white font-bold"
                                >
                                    取消
                                </button>
                                {selectedUser.role === USER_ROLES.PENDING ? (
                                    <button
                                        onClick={handleApprove}
                                        className="btn-pop px-4 py-2 bg-[#1DD1A1] text-white font-bold flex-1 flex items-center justify-center gap-2"
                                    >
                                        <Check size={18} />
                                        審核通過
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleUpdateClasses}
                                        className="btn-pop px-4 py-2 bg-[#54A0FF] text-white font-bold flex-1 flex items-center justify-center gap-2"
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
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-[#FECA57] text-[#2D3436] p-3 border-2 border-[#2D3436] rounded-lg text-center">
                                    <div className="text-2xl font-black">{users.filter(u => u.role === USER_ROLES.PENDING).length}</div>
                                    <div className="text-xs font-bold">待審核</div>
                                </div>
                                <div className="bg-[#1DD1A1] text-white p-3 border-2 border-[#2D3436] rounded-lg text-center">
                                    <div className="text-2xl font-black">{users.filter(u => u.role === USER_ROLES.TEACHER).length}</div>
                                    <div className="text-xs font-bold">教師</div>
                                </div>
                                <div className="bg-[#FF6B9D] text-white p-3 border-2 border-[#2D3436] rounded-lg text-center">
                                    <div className="text-2xl font-black">{users.filter(u => u.role === USER_ROLES.ADMIN).length}</div>
                                    <div className="text-xs font-bold">管理員</div>
                                </div>
                            </div>

                            {/* 待審核 */}
                            {users.filter(u => u.role === USER_ROLES.PENDING).length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-bold text-[#FECA57] mb-2 flex items-center gap-2">
                                        <Clock size={18} />
                                        待審核 ({users.filter(u => u.role === USER_ROLES.PENDING).length})
                                    </h4>
                                    {users.filter(u => u.role === USER_ROLES.PENDING).map((user) => (
                                        <UserRow
                                            key={user.id}
                                            user={user}
                                            onEdit={handleEditUser}
                                            onReject={handleReject}
                                            getRoleBadge={getRoleBadge}
                                            formatTime={formatTime}
                                            classes={classes}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* 已審核 */}
                            <div>
                                <h4 className="font-bold text-[#1DD1A1] mb-2 flex items-center gap-2">
                                    <Users size={18} />
                                    已審核使用者
                                </h4>
                                {users.filter(u => u.role !== USER_ROLES.PENDING).map((user) => (
                                    <UserRow
                                        key={user.id}
                                        user={user}
                                        onEdit={handleEditUser}
                                        onReject={handleReject}
                                        getRoleBadge={getRoleBadge}
                                        formatTime={formatTime}
                                        classes={classes}
                                        isCurrentUser={user.id === currentUser?.uid}
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
const UserRow = ({ user, onEdit, onReject, getRoleBadge, formatTime, classes, isCurrentUser }) => {
    const assignedClassNames = (user.assignedClasses || [])
        .map(id => classes.find(c => c.id === id)?.name)
        .filter(Boolean)
        .join(', ');

    return (
        <div className={`p-3 bg-white border-2 border-[#2D3436] rounded-lg mb-2 flex items-center justify-between
      ${isCurrentUser ? 'ring-2 ring-[#FF6B9D]' : ''}`}>
            <div className="flex items-center gap-3">
                {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-[#2D3436]" />
                ) : (
                    <div className="w-10 h-10 bg-[#FECA57] rounded-full border-2 border-[#2D3436] flex items-center justify-center text-lg">👤</div>
                )}
                <div>
                    <div className="font-bold text-[#2D3436] text-sm flex items-center gap-2">
                        {user.displayName}
                        {getRoleBadge(user.role)}
                        {isCurrentUser && <span className="text-xs text-[#636E72]">(你)</span>}
                    </div>
                    <div className="text-xs text-[#636E72]">{user.email}</div>
                    {assignedClassNames && (
                        <div className="text-xs text-[#54A0FF] flex items-center gap-1 mt-0.5">
                            <School size={10} />
                            {assignedClassNames}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-1">
                {user.role !== USER_ROLES.ADMIN && (
                    <>
                        <button
                            onClick={() => onEdit(user)}
                            className="btn-pop px-3 py-1.5 bg-[#54A0FF] text-white text-xs font-bold"
                        >
                            {user.role === USER_ROLES.PENDING ? '審核' : '編輯'}
                        </button>
                        {user.role === USER_ROLES.TEACHER && (
                            <button
                                onClick={() => onReject(user.id)}
                                className="btn-pop p-1.5 bg-[#FF6B6B] text-white"
                            >
                                <XCircle size={14} />
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
