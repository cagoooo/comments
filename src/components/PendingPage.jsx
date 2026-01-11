import React, { useState } from 'react';
import { Clock, Send, Building2, School, Plus, X, Check } from 'lucide-react';

// 台灣縣市列表
const CITIES = [
    '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
    '基隆市', '新竹市', '新竹縣', '苗栗縣', '彰化縣', '南投縣',
    '雲林縣', '嘉義市', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
    '台東縣', '澎湖縣', '金門縣', '連江縣'
];

/**
 * 待審核頁面
 * - pending_info: 顯示申請表單，讓用戶填寫學校和班級
 * - pending_review: 顯示等待管理員審核訊息
 */
const PendingPage = ({ user, onLogout, schools = [], onSubmitApplication, needsInfo }) => {
    // 學校選擇模式：'select' 選擇現有學校，'custom' 輸入自訂學校
    const [schoolMode, setSchoolMode] = useState('custom');
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [customCity, setCustomCity] = useState('桃園市');
    const [customSchoolName, setCustomSchoolName] = useState('');
    const [classList, setClassList] = useState([]);
    const [newClassName, setNewClassName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 新增班級
    const handleAddClass = () => {
        const trimmed = newClassName.trim();
        if (trimmed && !classList.includes(trimmed)) {
            setClassList([...classList, trimmed]);
            setNewClassName('');
        }
    };

    // 移除班級
    const handleRemoveClass = (className) => {
        setClassList(classList.filter(c => c !== className));
    };

    // 取得申請的學校資訊
    const getSchoolInfo = () => {
        if (schoolMode === 'select' && selectedSchool) {
            return { schoolId: selectedSchool, schoolName: null, schoolCity: null };
        } else if (schoolMode === 'custom' && customSchoolName.trim()) {
            return {
                schoolId: null,
                schoolName: customSchoolName.trim(),
                schoolCity: customCity
            };
        }
        return null;
    };

    // 檢查是否可提交
    const canSubmit = () => {
        const schoolInfo = getSchoolInfo();
        return schoolInfo && classList.length > 0;
    };

    // 提交申請
    const handleSubmit = async () => {
        if (!canSubmit()) return;

        const schoolInfo = getSchoolInfo();

        setIsSubmitting(true);
        try {
            await onSubmitApplication(user.uid, schoolInfo, classList);
        } catch (error) {
            console.error('提交申請失敗:', error);
        }
        setIsSubmitting(false);
    };

    // 按 Enter 新增班級
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddClass();
        }
    };

    return (
        <div className="min-h-screen bg-[#FFF9E6] flex items-center justify-center p-4">
            <div className="card-pop w-full max-w-lg p-6 sm:p-8">
                {/* 使用者頭像 */}
                <div className="mb-6 text-center">
                    {user?.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt={user.displayName}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 border-[#2D3436] shadow-[3px_3px_0_#2D3436] mx-auto"
                        />
                    ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FECA57] rounded-full border-3 border-[#2D3436] shadow-[3px_3px_0_#2D3436] mx-auto flex items-center justify-center">
                            <span className="text-3xl sm:text-4xl">👤</span>
                        </div>
                    )}
                </div>

                {/* 歡迎訊息 */}
                <h2 className="text-xl sm:text-2xl font-black text-[#2D3436] mb-2 text-center">
                    嗨，{user?.displayName || '使用者'}！
                </h2>
                <p className="text-[#636E72] text-xs sm:text-sm mb-6 text-center">{user?.email}</p>

                {needsInfo ? (
                    /* 申請表單 */
                    <div className="space-y-4">
                        <div className="bg-[#54A0FF]/10 border-2 border-dashed border-[#54A0FF] rounded-lg p-4 mb-4">
                            <p className="text-sm text-[#2D3436] font-medium text-center">
                                📝 請填寫您的學校與班級資訊，提交後等待管理員審核
                            </p>
                        </div>

                        {/* 學校選擇 */}
                        <div className="bg-white border-2 border-[#2D3436] rounded-lg p-4">
                            <h4 className="font-bold text-[#2D3436] mb-3 flex items-center gap-2 text-sm sm:text-base">
                                <Building2 size={18} />
                                您的學校
                            </h4>

                            {/* 模式切換 */}
                            <div className="flex gap-2 mb-3">
                                <button
                                    onClick={() => setSchoolMode('custom')}
                                    className={`flex-1 px-3 py-2 border-2 border-[#2D3436] rounded-lg font-bold text-xs sm:text-sm transition-all
                                        ${schoolMode === 'custom'
                                            ? 'bg-[#A29BFE] text-white shadow-[2px_2px_0_#2D3436]'
                                            : 'bg-white hover:bg-[#A29BFE]/20'}`}
                                >
                                    ✏️ 輸入學校
                                </button>
                                {schools.length > 0 && (
                                    <button
                                        onClick={() => setSchoolMode('select')}
                                        className={`flex-1 px-3 py-2 border-2 border-[#2D3436] rounded-lg font-bold text-xs sm:text-sm transition-all
                                            ${schoolMode === 'select'
                                                ? 'bg-[#A29BFE] text-white shadow-[2px_2px_0_#2D3436]'
                                                : 'bg-white hover:bg-[#A29BFE]/20'}`}
                                    >
                                        📋 選擇現有
                                    </button>
                                )}
                            </div>

                            {schoolMode === 'custom' ? (
                                /* 自訂學校輸入 */
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <select
                                            value={customCity}
                                            onChange={(e) => setCustomCity(e.target.value)}
                                            className="px-3 py-2 border-2 border-[#2D3436] rounded-lg font-medium bg-white text-sm"
                                        >
                                            {CITIES.map(city => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            value={customSchoolName}
                                            onChange={(e) => setCustomSchoolName(e.target.value)}
                                            placeholder="輸入學校名稱（例如：石門國小）"
                                            className="flex-1 px-3 py-2 border-2 border-[#2D3436] rounded-lg text-sm font-medium"
                                        />
                                    </div>
                                    {customSchoolName.trim() && (
                                        <div className="flex items-center gap-2 text-sm text-[#1DD1A1]">
                                            <Check size={16} />
                                            <span>將申請：{customCity} {customSchoolName.trim()}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* 選擇現有學校 */
                                <div className="flex flex-wrap gap-2">
                                    {schools.map((school) => (
                                        <button
                                            key={school.id}
                                            onClick={() => setSelectedSchool(selectedSchool === school.id ? null : school.id)}
                                            className={`px-3 py-2 border-2 border-[#2D3436] rounded-lg font-bold text-xs sm:text-sm transition-all
                                              ${selectedSchool === school.id
                                                    ? 'bg-[#A29BFE] text-white shadow-[2px_2px_0_#2D3436]'
                                                    : 'bg-white hover:bg-[#A29BFE]/20'}`}
                                        >
                                            {selectedSchool === school.id && <Check size={14} className="inline mr-1" />}
                                            🏫 {school.name}
                                            {school.city && <span className="opacity-70 ml-1">({school.city})</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 輸入班級 */}
                        <div className="bg-white border-2 border-[#2D3436] rounded-lg p-4">
                            <h4 className="font-bold text-[#2D3436] mb-3 flex items-center gap-2 text-sm sm:text-base">
                                <School size={18} />
                                您的班級
                            </h4>

                            {/* 已新增的班級 */}
                            {classList.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {classList.map((className) => (
                                        <span
                                            key={className}
                                            className="px-3 py-1.5 bg-[#1DD1A1] text-white text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1 border-2 border-[#2D3436]"
                                        >
                                            {className}
                                            <button
                                                onClick={() => handleRemoveClass(className)}
                                                className="hover:bg-white/20 rounded p-0.5"
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* 新增班級輸入 */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="輸入班級名稱（例如：六年七班）"
                                    className="flex-1 px-3 py-2 border-2 border-[#2D3436] rounded-lg text-sm font-medium"
                                />
                                <button
                                    onClick={handleAddClass}
                                    disabled={!newClassName.trim()}
                                    className="btn-pop px-3 py-2 bg-[#1DD1A1] text-white font-bold disabled:opacity-50 flex items-center gap-1"
                                >
                                    <Plus size={16} />
                                    <span className="hidden sm:inline">新增</span>
                                </button>
                            </div>
                        </div>

                        {/* 按鈕區 */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                            <button
                                onClick={onLogout}
                                className="btn-pop px-4 py-3 bg-[#636E72] text-white font-bold order-2 sm:order-1"
                            >
                                登出
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!canSubmit() || isSubmitting}
                                className="btn-pop px-4 py-3 bg-[#54A0FF] text-white font-bold flex-1 flex items-center justify-center gap-2 disabled:opacity-50 order-1 sm:order-2"
                            >
                                <Send size={18} />
                                {isSubmitting ? '提交中...' : '提交申請'}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* 等待審核狀態 */
                    <>
                        <div className="bg-[#FECA57]/30 border-3 border-[#FECA57] rounded-lg p-6 mb-6">
                            <div className="text-4xl mb-3 animate-bounce">
                                <Clock size={48} className="mx-auto text-[#FF9F43]" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-black text-[#2D3436] mb-2 text-center">
                                🕐 帳號審核中
                            </h3>
                            <p className="text-xs sm:text-sm text-[#636E72] font-medium text-center">
                                您的申請已提交，正在等待管理員審核。<br />
                                審核通過後，您將可以使用系統。
                            </p>
                        </div>

                        {/* 申請資訊摘要 */}
                        {(user?.requestedSchoolName || user?.requestedSchoolId || user?.requestedClasses?.length > 0) && (
                            <div className="bg-white border-2 border-[#2D3436] rounded-lg p-4 mb-6">
                                <h4 className="font-bold text-[#2D3436] mb-2 text-sm">📋 您的申請資訊</h4>
                                {user.requestedSchoolName && (
                                    <p className="text-xs sm:text-sm text-[#636E72]">
                                        <span className="font-medium">學校：</span>
                                        {user.requestedSchoolCity && `${user.requestedSchoolCity} `}
                                        {user.requestedSchoolName}
                                    </p>
                                )}
                                {user.requestedSchoolId && schools.length > 0 && !user.requestedSchoolName && (
                                    <p className="text-xs sm:text-sm text-[#636E72]">
                                        <span className="font-medium">學校：</span>
                                        {schools.find(s => s.id === user.requestedSchoolId)?.name || '未知'}
                                    </p>
                                )}
                                {user.requestedClasses?.length > 0 && (
                                    <p className="text-xs sm:text-sm text-[#636E72]">
                                        <span className="font-medium">班級：</span>
                                        {user.requestedClasses.join('、')}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* 提示 */}
                        <div className="bg-[#54A0FF]/10 border-2 border-dashed border-[#54A0FF] rounded-lg p-4 mb-6 text-left">
                            <p className="text-xs text-[#636E72]">
                                💡 <strong>小提示</strong>：請聯繫管理員 (cagooo@gmail.com) 加速審核流程。
                            </p>
                        </div>

                        {/* 登出按鈕 */}
                        <button
                            onClick={onLogout}
                            className="btn-pop w-full px-6 py-3 bg-[#636E72] text-white font-bold"
                        >
                            登出
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PendingPage;
