import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

/**
 * API Key 設定 Modal
 * 讓使用者設定 Gemini API Key
 */
const ApiKeyModal = ({ isOpen, onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState(null); // 'success' | 'error' | null
    const [savedKey, setSavedKey] = useState('');

    // 載入已儲存的 API Key
    useEffect(() => {
        const stored = localStorage.getItem('gemini_api_key') || '';
        setSavedKey(stored);
        setApiKey(stored);
    }, [isOpen]);

    // 儲存 API Key
    const handleSave = () => {
        localStorage.setItem('gemini_api_key', apiKey.trim());
        setSavedKey(apiKey.trim());
        setTestResult(null);
    };

    // 清除 API Key
    const handleClear = () => {
        localStorage.removeItem('gemini_api_key');
        setApiKey('');
        setSavedKey('');
        setTestResult(null);
    };

    // 測試 API Key
    const handleTest = async () => {
        if (!apiKey.trim()) {
            setTestResult('error');
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: '請回覆「連線成功」四個字' }] }]
                })
            });

            if (response.ok) {
                setTestResult('success');
                // 測試成功自動儲存
                localStorage.setItem('gemini_api_key', apiKey.trim());
                setSavedKey(apiKey.trim());
            } else {
                setTestResult('error');
            }
        } catch (error) {
            console.error('API 測試失敗:', error);
            setTestResult('error');
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
                    {/* 說明 */}
                    <div className="bg-[#54A0FF]/20 border-2 border-[#54A0FF] rounded-lg p-3 text-sm text-[#2D3436]">
                        <p className="font-bold mb-1">💡 如何取得 API Key？</p>
                        <p className="text-[#636E72]">
                            前往 Google AI Studio 申請免費的 Gemini API Key
                        </p>
                        <a
                            href="https://aistudio.google.com/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#54A0FF] hover:underline font-bold mt-2"
                        >
                            <ExternalLink size={14} />
                            前往申請 API Key
                        </a>
                    </div>

                    {/* 目前狀態 */}
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-bold text-[#2D3436]">目前狀態：</span>
                        {savedKey ? (
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
                    <div>
                        <label className="block text-sm font-bold text-[#2D3436] mb-2">
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
                            className="w-full p-3 border-3 border-[#2D3436] rounded-lg text-[#2D3436] font-medium placeholder:text-[#636E72]/50 focus:border-[#FF9F43] outline-none"
                        />
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
                            disabled={!apiKey.trim() || isTesting}
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
                            disabled={!apiKey.trim()}
                            className="btn-pop flex-1 py-3 bg-[#1DD1A1] text-white font-bold disabled:opacity-50"
                        >
                            💾 儲存
                        </button>
                    </div>

                    {savedKey && (
                        <button
                            onClick={handleClear}
                            className="w-full text-center text-sm text-[#FF6B6B] hover:underline font-bold"
                        >
                            🗑️ 清除已儲存的 API Key
                        </button>
                    )}
                </div>

                {/* Footer 提示 */}
                <div className="p-3 sm:p-4 bg-[#E8DCC8] border-t-2 border-dashed border-[#2D3436]/20 text-xs text-[#636E72] text-center">
                    API Key 僅儲存在您的瀏覽器本地，不會上傳至任何伺服器
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
