import React, { useState } from 'react';
import { Send, Building2, School, Plus, X, Check } from 'lucide-react';
import { Btn, Chip, Card, StickerTab, BeeMascot } from './atoms';

// 台灣縣市列表
const CITIES = [
    '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
    '基隆市', '新竹市', '新竹縣', '苗栗縣', '彰化縣', '南投縣',
    '雲林縣', '嘉義市', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
    '台東縣', '澎湖縣', '金門縣', '連江縣',
];

/**
 * 待審核頁面 — 填寫學校 + 班級的申請表
 *
 * Props 保留：user / onLogout / schools / onSubmitApplication / needsInfo
 * 設計：套用 login.html 的紙感卡片 + sticker tab + 紙膠帶，但文案改為「完成註冊」流程
 */
const PendingPage = ({ user, onLogout, schools = [], onSubmitApplication, needsInfo }) => {
    const [schoolMode, setSchoolMode] = useState('custom');
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [customCity, setCustomCity] = useState('桃園市');
    const [customSchoolName, setCustomSchoolName] = useState('');
    const [classList, setClassList] = useState([]);
    const [newClassName, setNewClassName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState(null);

    const handleAddClass = () => {
        const trimmed = newClassName.trim();
        if (trimmed && !classList.includes(trimmed)) {
            setClassList([...classList, trimmed]);
            setNewClassName('');
        }
    };

    const handleRemoveClass = (className) => {
        setClassList(classList.filter(c => c !== className));
    };

    const getSchoolInfo = () => {
        if (schoolMode === 'select' && selectedSchool) {
            return { schoolId: selectedSchool, schoolName: null, schoolCity: null };
        }
        if (schoolMode === 'custom' && customSchoolName.trim()) {
            return {
                schoolId: null,
                schoolName: customSchoolName.trim(),
                schoolCity: customCity,
            };
        }
        return null;
    };

    const handleSubmit = async () => {
        const schoolInfo = getSchoolInfo();
        if (!schoolInfo) {
            setValidationError('請填寫學校名稱');
            return;
        }

        let finalClassList = [...classList];
        const trimmedNewClass = newClassName.trim();
        if (trimmedNewClass && !classList.includes(trimmedNewClass)) {
            finalClassList.push(trimmedNewClass);
            setClassList(finalClassList);
            setNewClassName('');
        }

        if (finalClassList.length === 0) {
            setValidationError('請新增至少一個班級');
            return;
        }

        setValidationError(null);
        setIsSubmitting(true);
        try {
            await onSubmitApplication(user.uid, schoolInfo, finalClassList);
        } catch (error) {
            console.error('提交申請失敗:', error);
            setValidationError('提交失敗，請稍後再試');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6">
            {/* 背景大蜜糖光暈 */}
            <div
                className="absolute pointer-events-none"
                style={{
                    top: -200,
                    left: -200,
                    width: 600,
                    height: 600,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, var(--honey-soft) 0%, transparent 60%)',
                    opacity: 0.7,
                    zIndex: 0,
                }}
                aria-hidden="true"
            />
            <div
                className="absolute pointer-events-none"
                style={{
                    bottom: -250,
                    right: -200,
                    width: 600,
                    height: 600,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, var(--peach-soft) 0%, transparent 60%)',
                    opacity: 0.7,
                    zIndex: 0,
                }}
                aria-hidden="true"
            />

            <Card className="w-full max-w-lg p-6 sm:p-8 relative z-10">
                {/* 紙膠帶 */}
                <div
                    className="tape"
                    style={{ top: -14, left: 40, transform: 'rotate(-3deg)' }}
                    aria-hidden="true"
                />
                <div
                    className="tape"
                    style={{
                        top: -14,
                        right: 60,
                        transform: 'rotate(4deg)',
                        background: 'linear-gradient(180deg, var(--lav-soft), var(--lav-soft))',
                    }}
                    aria-hidden="true"
                />

                {/* Sticker tab */}
                <div
                    className="sticker-tab"
                    style={{ background: 'var(--peach)', left: '50%', transform: 'translateX(-50%)' }}
                >
                    <span>STEP 2 · 完成註冊</span>
                </div>

                {/* 使用者頭像 */}
                <div className="mt-3 mb-4 flex flex-col items-center">
                    {user?.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt={user.displayName}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[var(--ink)] sh-card"
                        />
                    ) : (
                        <div
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[var(--ink)] sh-card flex items-center justify-center text-[24px] sm:text-[30px] font-black"
                            style={{ background: 'var(--honey)' }}
                        >
                            {(user?.displayName || '?').charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                <div className="text-center mb-5">
                    <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.25em] text-[var(--ink-soft)]">
                        Welcome
                    </div>
                    <h2 className="text-[20px] sm:text-[24px] font-black tracking-tight mt-1 uw inline-block">
                        嗨，{user?.displayName || '使用者'}！
                    </h2>
                    <p className="text-[12px] text-[var(--ink-soft)] mt-2 font-mono break-all">
                        {user?.email}
                    </p>
                </div>

                {/* 提示 banner */}
                <div
                    className="b-dash r-btn p-3.5 flex items-start gap-3 mb-4"
                    style={{ background: 'var(--sky-soft)' }}
                >
                    <div className="text-[16px] leading-none mt-0.5" aria-hidden="true">📝</div>
                    <div className="text-[12.5px] leading-[1.7] text-[var(--ink)]">
                        填寫<span className="font-bold">學校 & 班級</span>後即可
                        <span className="font-bold">立即開通</span>，無需等待管理員審核。
                    </div>
                </div>

                {/* 學校選擇 */}
                <div className="b-ink r-card p-3.5 bg-white mb-3">
                    <h4 className="font-black text-[13px] mb-3 flex items-center gap-2">
                        <Building2 size={15} strokeWidth={1.8} />
                        您的學校
                    </h4>

                    {/* 模式切換 */}
                    <div className="flex gap-2 mb-3">
                        <button
                            type="button"
                            onClick={() => setSchoolMode('custom')}
                            style={{
                                background: schoolMode === 'custom' ? 'var(--lav)' : 'white',
                            }}
                            className="flex-1 b-ink r-btn px-3 h-9 font-bold text-[12.5px] btn-press inline-flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                            aria-pressed={schoolMode === 'custom'}
                        >
                            ✏️ 輸入學校
                        </button>
                        {schools.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setSchoolMode('select')}
                                style={{
                                    background: schoolMode === 'select' ? 'var(--lav)' : 'white',
                                }}
                                className="flex-1 b-ink r-btn px-3 h-9 font-bold text-[12.5px] btn-press inline-flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                                aria-pressed={schoolMode === 'select'}
                            >
                                📋 選擇現有
                            </button>
                        )}
                    </div>

                    {schoolMode === 'custom' ? (
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <select
                                    value={customCity}
                                    onChange={(e) => setCustomCity(e.target.value)}
                                    className="px-3 h-10 b-ink r-btn font-medium text-[13px] bg-white outline-none focus:ring-2 focus:ring-honey-soft"
                                    aria-label="縣市"
                                >
                                    {CITIES.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    value={customSchoolName}
                                    onChange={(e) => setCustomSchoolName(e.target.value)}
                                    placeholder="輸入學校名稱（例：石門國小）"
                                    className="flex-1 px-3 h-10 b-ink r-btn text-[13px] font-medium outline-none focus:ring-2 focus:ring-honey-soft"
                                    aria-label="學校名稱"
                                />
                            </div>
                            {customSchoolName.trim() && (
                                <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--mint)' }}>
                                    <Check size={14} strokeWidth={2} />
                                    <span>將申請：{customCity} {customSchoolName.trim()}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-1.5">
                            {schools.map((school) => (
                                <button
                                    key={school.id}
                                    type="button"
                                    onClick={() => setSelectedSchool(selectedSchool === school.id ? null : school.id)}
                                    style={{
                                        background: selectedSchool === school.id ? 'var(--lav)' : 'white',
                                    }}
                                    className="px-2.5 h-8 b-ink r-btn text-[12.5px] font-bold inline-flex items-center gap-1 btn-press"
                                >
                                    {selectedSchool === school.id && <Check size={11} strokeWidth={2.2} />}
                                    🏫 {school.name}
                                    {school.city && (
                                        <span className="text-[var(--ink-soft)] ml-0.5">({school.city})</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 班級輸入 */}
                <div className="b-ink r-card p-3.5 bg-white mb-3">
                    <h4 className="font-black text-[13px] mb-3 flex items-center gap-2">
                        <School size={15} strokeWidth={1.8} />
                        您的班級
                    </h4>

                    {classList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {classList.map((className) => (
                                <Chip
                                    key={className}
                                    color="mint"
                                    size="md"
                                    onClose={() => handleRemoveClass(className)}
                                >
                                    {className}
                                </Chip>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddClass();
                                }
                            }}
                            placeholder="輸入班級名稱（例：六年七班）"
                            className="flex-1 px-3 h-10 b-ink r-btn text-[13px] font-medium outline-none focus:ring-2 focus:ring-honey-soft"
                            aria-label="新班級名稱"
                        />
                        <Btn
                            color="mint"
                            size="md"
                            icon={<Plus size={15} strokeWidth={1.8} />}
                            onClick={handleAddClass}
                            disabled={!newClassName.trim()}
                            ariaLabel="新增班級"
                        >
                            <span className="hidden sm:inline">新增</span>
                        </Btn>
                    </div>
                </div>

                {/* 驗證錯誤 */}
                {validationError && (
                    <div
                        className="b-ink r-btn p-3 mb-3 text-[13px] font-bold text-center"
                        style={{ background: 'var(--coral-soft)', color: 'var(--coral)' }}
                        role="alert"
                    >
                        ⚠️ {validationError}
                    </div>
                )}

                {/* 動作按鈕 */}
                <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
                    <Btn variant="outline" onClick={onLogout}>
                        登出
                    </Btn>
                    <Btn
                        color="honey"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1"
                        icon={<Send size={15} strokeWidth={1.8} />}
                    >
                        {isSubmitting ? '註冊中…' : '完成註冊'}
                    </Btn>
                </div>
            </Card>
        </div>
    );
};

export default PendingPage;
