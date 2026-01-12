import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, AlertCircle, Loader2, ExternalLink, Cloud, Gift } from 'lucide-react';
import { settingsService, adminConfigService } from '../firebase';

/**
 * API Key 設定 Modal
 * 使用 Firebase 使用者隔離儲存，每位教師獨立 API Key
 * 支援管理員共享 API Key 功能
 */
const ApiKeyModal = ({ isOpen, onClose, currentUser }) => {
    const [apiKey, setApiKey] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [testResult, setTestResult] = useState(null); // 'success' | 'error' | null
    const [savedKey, setSavedKey] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // 共享 API Key 相關狀態
    const [hasSharedAccess, setHasSharedAccess] = useState(false);
    const [sharedApiKey, setSharedApiKey] = useState('');

    // 從 Firebase 載入已儲存的 API Key
    useEffect(() => {
        if (!isOpen || !currentUser) return;

        setIsLoading(true);
        const unsubscribe = settingsService.subscribe((settings) => {
            const stored = settings?.apiKey || '';
            setSavedKey(stored);
            setApiKey(stored);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen, currentUser]);

    // 檢查是否有共享 API Key 授權
    useEffect(() => {
        if (!isOpen || !currentUser) return;

        const checkSharedAccess = async () => {
            try {
                const sharedKey = await adminConfigService.getSharedApiKey(currentUser.uid);
                if (sharedKey) {
                    setHasSharedAccess(true);
                    setSharedApiKey(sharedKey);
                    // 自動設定到 localStorage 供 geminiApi 使用
                    localStorage.setItem('gemini_api_key', sharedKey);
                } else {
                    setHasSharedAccess(false);
                    setSharedApiKey('');
                }
            } catch (error) {
                console.error('檢查共享授權失敗:', error);
                setHasSharedAccess(false);
            }
        };

        checkSharedAccess();
    }, [isOpen, currentUser]);

    // 儲存 API Key 到 Firebase
    const handleSave = async () => {
        if (!apiKey.trim()) return;

        setIsSaving(true);
        try {
            await settingsService.save({ apiKey: apiKey.trim() });
            setSavedKey(apiKey.trim());
            setTestResult(null);

            // 同時更新 localStorage 供 geminiApi 使用
            localStorage.setItem('gemini_api_key', apiKey.trim());
        } catch (error) {
            console.error('儲存 API Key 失敗:', error);
            alert('儲存失敗，請稍後再試');
        }
        setIsSaving(false);
    };

    // 清除 API Key
    const handleClear = async () => {
        if (!window.confirm('確定要清除 API Key 嗎？')) return;

        setIsSaving(true);
        try {
            await settingsService.save({ apiKey: '' });
            setApiKey('');
            setSavedKey('');
            setTestResult(null);
            localStorage.removeItem('gemini_api_key');
        } catch (error) {
            console.error('清除 API Key 失敗:', error);
        }
        setIsSaving(false);
    };

    // 測試 API Key - 使用實際生成 API 來驗證，確保配額也足夠
    const handleTest = async () => {
        if (!apiKey.trim()) {
            setTestResult('error');
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            // 使用實際的 generateContent API 來測試，確保配額也足夠使用
            const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;
            const response = await fetch(generateUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: "回答「測試成功」這四個字" }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 10
                    }
                })
            });

            if (response.ok) {
                setTestResult('success');
                // 測試成功自動儲存到 Firebase
                await settingsService.save({ apiKey: apiKey.trim() });
                setSavedKey(apiKey.trim());
                localStorage.setItem('gemini_api_key', apiKey.trim());
            } else if (response.status === 429) {
                // 配額用完 - 不儲存，明確告知用戶無法使用
                setTestResult('quota');
            } else if (response.status === 400 || response.status === 403) {
                // API Key 無效或沒有權限
                setTestResult('error');
            } else {
                setTestResult('error');
            }
        } catch (error) {
            console.error('API 測試失敗:', error);
            setTestResult('network');
        }

        setIsTesting(false);
    };

    // 遮蔽顯示 API Key
    const maskKey = (key) => {
        if (!key || key.length < 10) return key;
        return key.substring(0, 6) + '••••••••' + key.substring(key.length - 4);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4">
            <div className="card-pop w-full max-w-lg flex flex-col animate-in bg-[#FFF9E6]">
                {/* Header */}
                <div className="p-3 sm:p-5 bg-[#FF9F43] border-b-3 border-[#2D3436] flex items-center justify-between">
                    <h3 className="font-black text-white flex items-center gap-2 text-lg sm:text-xl">
                        <Key size={24} />
                        API Key 設定
                    </h3>
                    <button
                        onClick={onClose}
                        className="btn-pop p-2 bg-white text-[#2D3436]"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 size={32} className="animate-spin text-[#FF9F43]" />
                        </div>
                    ) : (
                        <>
                            {/* 🎁 共享 API Key 授權狀態 */}
                            {hasSharedAccess && (
                                <div className="bg-gradient-to-r from-[#1DD1A1]/20 to-[#54A0FF]/20 border-2 border-[#1DD1A1] rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-[#1DD1A1] rounded-full flex items-center justify-center flex-shrink-0">
                                            <Gift size={24} className="text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-[#1DD1A1] text-base">🎉 管理員已授權您使用共享 API Key！</p>
                                            <p className="text-sm text-[#2D3436] mt-1">
                                                您無需自行申請 API Key，系統已自動為您設定。
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-[#1DD1A1]/30">
                                        <p className="text-xs text-[#636E72]">
                                            ✓ 共享 API Key 由管理員提供，可直接使用生成評語功能
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* 說明 - 只在沒有共享授權時顯示 */}
                            {!hasSharedAccess && (
                                <div className="bg-[#54A0FF]/20 border-2 border-[#54A0FF] rounded-lg p-3 text-sm text-[#2D3436]">
                                    <p className="font-bold mb-1">💡 如何取得 API Key？</p>
                                    <p className="text-[#636E72]">
                                        前往 Google AI Studio 申請免費的 Gemini API Key
                                    </p>
                                    <a
                                        href="https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Faistudio.google.com%2Fapikey&flowName=GlifWebSignIn&flowEntry=AddSession&Email=@gmail.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[#54A0FF] hover:underline font-bold mt-2"
                                    >
                                        <ExternalLink size={14} />
                                        前往申請 API Key
                                    </a>
                                </div>
                            )}

                            {/* ⚠️ 重要提醒 */}
                            <div className="bg-[#FF6B6B]/15 border-2 border-[#FF6B6B] rounded-lg p-3 text-sm">
                                <p className="font-bold text-[#FF6B6B] mb-1">⚠️ 重要提醒</p>
                                <p className="text-[#2D3436]">
                                    請使用<span className="font-bold text-[#FF6B6B]">「個人 Gmail 帳號」</span>申請 API Key！
                                </p>
                                <p className="text-[#636E72] text-xs mt-1">
                                    學校帳號（@xxx.edu.tw）申請的 API Key 可能無法正常使用
                                </p>
                            </div>

                            {/* 目前狀態 */}
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-bold text-[#2D3436]">目前狀態：</span>
                                {hasSharedAccess ? (
                                    <span className="flex items-center gap-1 text-[#1DD1A1] font-bold">
                                        <Gift size={16} />
                                        使用共享 API Key
                                    </span>
                                ) : savedKey ? (
                                    <span className="flex items-center gap-1 text-[#1DD1A1] font-bold">
                                        <CheckCircle size={16} />
                                        已設定 ({maskKey(savedKey)})
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[#FF6B6B] font-bold">
                                        <AlertCircle size={16} />
                                        尚未設定
                                    </span>
                                )}
                            </div>

                            {/* API Key 輸入 */}
                            <div className="bg-white border-3 border-[#2D3436] rounded-lg p-4 shadow-[4px_4px_0_#2D3436]">
                                <label className="block text-sm sm:text-base font-black text-[#2D3436] mb-3 flex items-center gap-2">
                                    🔑 Gemini API Key
                                </label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => {
                                        setApiKey(e.target.value);
                                        setTestResult(null);
                                    }}
                                    placeholder="輸入您的 API Key..."
                                    className="w-full p-3 sm:p-4 border-3 border-[#2D3436] rounded-lg text-base sm:text-lg text-[#2D3436] font-bold 
                                               bg-[#FFF9E6] placeholder:text-[#636E72]/60 placeholder:font-medium
                                               focus:border-[#FF9F43] focus:ring-4 focus:ring-[#FF9F43]/20 outline-none
                                               transition-all duration-200"
                                />
                                <p className="mt-2 text-xs text-[#636E72]">
                                    💡 API Key 格式：AIza... 開頭的字串
                                </p>
                            </div>

                            {/* 測試結果 */}
                            {testResult && (
                                <div className={`p-3 rounded-lg border-2 flex items-center gap-2 text-sm font-bold
                                  ${testResult === 'success'
                                        ? 'bg-[#1DD1A1]/20 border-[#1DD1A1] text-[#1DD1A1]'
                                        : 'bg-[#FF6B6B]/20 border-[#FF6B6B] text-[#FF6B6B]'}`}
                                >
                                    {testResult === 'success' ? (
                                        <>
                                            <CheckCircle size={18} />
                                            連線測試成功！API Key 已自動儲存 ✨
                                        </>
                                    ) : testResult === 'quota' ? (
                                        <>
                                            <AlertCircle size={18} />
                                            <div>
                                                <div>❌ API 免費額度已用完，無法使用</div>
                                                <div className="text-xs font-normal mt-1">請明天再試或使用其他 Google 帳號申請新的 API Key</div>
                                            </div>
                                        </>
                                    ) : testResult === 'network' ? (
                                        <>
                                            <AlertCircle size={18} />
                                            網路連線失敗，請檢查網路狀態
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle size={18} />
                                            連線失敗，請檢查 API Key 是否正確
                                        </>
                                    )}
                                </div>
                            )}

                            {/* 按鈕區 */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                                <button
                                    onClick={handleTest}
                                    disabled={!apiKey.trim() || isTesting || isSaving}
                                    className="btn-pop flex-1 py-3 bg-[#54A0FF] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isTesting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            測試中...
                                        </>
                                    ) : (
                                        <>🧪 測試連線</>
                                    )}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!apiKey.trim() || isSaving}
                                    className="btn-pop flex-1 py-3 bg-[#1DD1A1] text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            儲存中...
                                        </>
                                    ) : (
                                        <>💾 儲存</>
                                    )}
                                </button>
                            </div>

                            {savedKey && (
                                <button
                                    onClick={handleClear}
                                    disabled={isSaving}
                                    className="w-full text-center text-sm text-[#FF6B6B] hover:underline font-bold disabled:opacity-50"
                                >
                                    🗑️ 清除已儲存的 API Key
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Footer 提示 */}
                <div className="p-3 sm:p-4 bg-[#E8DCC8] border-t-2 border-dashed border-[#2D3436]/20 text-xs text-[#636E72] text-center flex items-center justify-center gap-1">
                    <Cloud size={14} />
                    API Key 安全儲存於您的個人帳號，不會與他人共用
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;

