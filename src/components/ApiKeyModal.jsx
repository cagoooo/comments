import React, { useState, useEffect } from 'react';
import { Key, CheckCircle, AlertCircle, Loader2, ExternalLink, Cloud, Gift } from 'lucide-react';
import { settingsService, adminConfigService } from '../firebase';
import ModalShell from './ui/ModalShell';
import { Btn } from './atoms';

/**
 * API Key 設定 Modal
 *
 * Props 保留：isOpen / onClose / currentUser
 * Firebase: settingsService.subscribe/save + adminConfigService.getSharedApiKey
 * 邏輯保留：共享授權檢查、test API quota 偵測、localStorage 自動同步、清除確認
 */
const ApiKeyModal = ({ isOpen, onClose, currentUser }) => {
    const [apiKey, setApiKey] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [savedKey, setSavedKey] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [hasSharedAccess, setHasSharedAccess] = useState(false);
    const [sharedApiKey, setSharedApiKey] = useState('');

    useEffect(() => {
        if (!isOpen || !currentUser) return;
        setIsLoading(true);
        const unsub = settingsService.subscribe((settings) => {
            const stored = settings?.apiKey || '';
            setSavedKey(stored);
            setApiKey(stored);
            setIsLoading(false);
        });
        return () => unsub();
    }, [isOpen, currentUser]);

    useEffect(() => {
        if (!isOpen || !currentUser) return;
        const check = async () => {
            try {
                const sharedKey = await adminConfigService.getSharedApiKey(currentUser.uid);
                if (sharedKey) {
                    setHasSharedAccess(true);
                    setSharedApiKey(sharedKey);
                    setApiKey(sharedKey);
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
        check();
    }, [isOpen, currentUser]);

    const handleSave = async () => {
        if (!apiKey.trim() || hasSharedAccess) return;
        setIsSaving(true);
        try {
            await settingsService.save({ apiKey: apiKey.trim() });
            setSavedKey(apiKey.trim());
            setTestResult(null);
            localStorage.setItem('gemini_api_key', apiKey.trim());
        } catch (error) {
            console.error('儲存 API Key 失敗:', error);
            alert('儲存失敗，請稍後再試');
        }
        setIsSaving(false);
    };

    const handleClear = async () => {
        if (hasSharedAccess) return;
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

    const handleTest = async () => {
        if (!apiKey.trim()) {
            setTestResult('error');
            return;
        }
        setIsTesting(true);
        setTestResult(null);
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: '回答「測試成功」這四個字' }] }],
                    generationConfig: { maxOutputTokens: 10 },
                }),
            });
            if (response.ok) {
                setTestResult('success');
                if (!hasSharedAccess) {
                    await settingsService.save({ apiKey: apiKey.trim() });
                    setSavedKey(apiKey.trim());
                }
                localStorage.setItem('gemini_api_key', apiKey.trim());
            } else if (response.status === 429) {
                setTestResult('quota');
            } else {
                setTestResult('error');
            }
        } catch (error) {
            console.error('API 測試失敗:', error);
            setTestResult('network');
        }
        setIsTesting(false);
    };

    const maskKey = (key) => {
        if (!key || key.length < 10) return key;
        return key.substring(0, 6) + '••••••••' + key.substring(key.length - 4);
    };

    if (!isOpen) return null;

    return (
        <ModalShell
            open={isOpen}
            onClose={onClose}
            width={560}
            eyebrow="Gemini API"
            tapeColor="honey"
            icon={<Key size={18} strokeWidth={1.8} />}
            title="API Key 設定"
            subtitle={
                <span className="inline-flex items-center gap-1.5">
                    <Cloud size={12} strokeWidth={1.8} />
                    安全儲存於您的個人帳號，不會與他人共用
                </span>
            }
            footer={
                <div className="flex items-center justify-end">
                    <Btn variant="outline" size="sm" onClick={onClose}>
                        關閉
                    </Btn>
                </div>
            }
        >
            <div className="px-5 sm:px-7 py-4 sm:py-5 space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 size={24} className="animate-spin text-[var(--honey)]" strokeWidth={1.8} />
                    </div>
                ) : (
                    <>
                        {/* 狀態 banner */}
                        {hasSharedAccess ? (
                            <div
                                className="b-ink r-card sh-sm p-4 flex items-center gap-3"
                                style={{ background: 'var(--mint-soft)' }}
                            >
                                <div
                                    className="w-10 h-10 b-ink r-btn flex items-center justify-center shrink-0"
                                    style={{ background: 'var(--mint)' }}
                                >
                                    <Gift size={18} strokeWidth={1.8} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-[14px]">🎉 管理員已授權共享 API Key</p>
                                    <p className="text-[12px] text-[var(--ink-soft)] mt-0.5">
                                        您無需自行申請，系統已自動設定可直接使用
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="b-ink r-card sh-sm p-4 space-y-2"
                                style={{ background: savedKey ? 'var(--mint-soft)' : 'var(--coral-soft)' }}
                            >
                                <div className="flex items-center gap-2 text-[13px] font-bold">
                                    {savedKey ? (
                                        <>
                                            <CheckCircle size={16} strokeWidth={1.8} style={{ color: 'var(--mint)' }} />
                                            <span>已設定</span>
                                            <span className="font-mono text-[12px] text-[var(--ink-soft)]">
                                                ({maskKey(savedKey)})
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle size={16} strokeWidth={1.8} style={{ color: 'var(--coral)' }} />
                                            <span>尚未設定 API Key</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 取得 API Key 說明 */}
                        {!hasSharedAccess && (
                            <div className="space-y-3">
                                {/* Step 1 */}
                                <div className="b-soft r-card p-3.5 bg-white">
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="w-7 h-7 b-ink r-btn flex items-center justify-center shrink-0 font-black text-[13px]"
                                            style={{ background: 'var(--sky-soft)' }}
                                        >
                                            1
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-[13px]">前往 Google AI Studio 申請 Key</p>
                                            <p className="text-[11.5px] text-[var(--ink-soft)] mt-0.5">
                                                免費額度足夠日常評語使用
                                            </p>
                                            <a
                                                href="https://aistudio.google.com/apikey"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 mt-2 text-[12px] font-bold text-[var(--sky)] hover:underline"
                                            >
                                                <ExternalLink size={12} strokeWidth={1.8} />
                                                aistudio.google.com/apikey
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="b-soft r-card p-3.5 bg-white">
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="w-7 h-7 b-ink r-btn flex items-center justify-center shrink-0 font-black text-[13px]"
                                            style={{ background: 'var(--coral-soft)' }}
                                        >
                                            2
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-[13px] text-[var(--coral)]">⚠️ 必須使用「個人 Gmail」</p>
                                            <p className="text-[11.5px] text-[var(--ink-soft)] mt-0.5">
                                                學校帳號（@xxx.edu.tw）申請的 Key 可能無法使用
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3 — input */}
                                <div className="b-ink r-card sh-sm p-3.5 bg-white">
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="w-7 h-7 b-ink r-btn flex items-center justify-center shrink-0 font-black text-[13px]"
                                            style={{ background: 'var(--honey-soft)' }}
                                        >
                                            3
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <label
                                                htmlFor="api-key-input"
                                                className="block font-bold text-[13px] mb-1.5"
                                            >
                                                🔑 貼上你的 API Key
                                            </label>
                                            <input
                                                id="api-key-input"
                                                type="password"
                                                value={apiKey}
                                                onChange={(e) => {
                                                    setApiKey(e.target.value);
                                                    setTestResult(null);
                                                }}
                                                placeholder="AIza..."
                                                className="w-full px-3 h-11 b-ink r-btn bg-white font-mono text-[13px] outline-none focus:ring-2 focus:ring-honey-soft placeholder:text-[var(--ink-mute)]"
                                            />
                                            <p className="mt-1.5 text-[10.5px] text-[var(--ink-mute)]">
                                                AIza 開頭的字串
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 已鎖定（共享模式下顯示遮蔽輸入框） */}
                        {hasSharedAccess && (
                            <div className="b-soft r-card p-3.5 bg-[var(--paper-2)]/40 opacity-70">
                                <label className="block font-bold text-[13px] mb-1.5 flex items-center gap-2">
                                    🔑 Gemini API Key
                                    <span className="text-[10px] font-mono bg-[var(--ink)] text-[var(--paper)] px-2 py-0.5 rounded-full">已鎖定</span>
                                </label>
                                <input
                                    type="password"
                                    value="••••••••••••••••"
                                    disabled
                                    className="w-full px-3 h-11 b-ink r-btn bg-white font-mono text-[13px] outline-none cursor-not-allowed"
                                />
                            </div>
                        )}

                        {/* 測試結果 */}
                        {testResult && (
                            <div
                                className="b-ink r-btn p-3 flex items-start gap-2 text-[13px] font-bold"
                                style={{
                                    background: testResult === 'success'
                                        ? 'var(--mint-soft)'
                                        : testResult === 'quota' ? 'var(--peach-soft)'
                                        : 'var(--coral-soft)',
                                }}
                                role="status"
                            >
                                {testResult === 'success' ? (
                                    <>
                                        <CheckCircle size={16} strokeWidth={1.8} className="mt-0.5 shrink-0" style={{ color: 'var(--mint)' }} />
                                        <span>連線測試成功！{hasSharedAccess ? '共享 Key 運作正常' : 'Key 已自動儲存'} ✨</span>
                                    </>
                                ) : testResult === 'quota' ? (
                                    <>
                                        <AlertCircle size={16} strokeWidth={1.8} className="mt-0.5 shrink-0" style={{ color: 'var(--peach)' }} />
                                        <div>
                                            <div>免費額度已用完</div>
                                            <div className="text-[11px] font-normal mt-0.5 text-[var(--ink-soft)]">
                                                請明天再試或用其他 Google 帳號申請新 Key
                                            </div>
                                        </div>
                                    </>
                                ) : testResult === 'network' ? (
                                    <>
                                        <AlertCircle size={16} strokeWidth={1.8} className="mt-0.5 shrink-0" style={{ color: 'var(--coral)' }} />
                                        <span>網路連線失敗，請檢查網路狀態</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={16} strokeWidth={1.8} className="mt-0.5 shrink-0" style={{ color: 'var(--coral)' }} />
                                        <span>連線失敗，請檢查 API Key 是否正確</span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* 動作按鈕 */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <Btn
                                color="sky"
                                onClick={handleTest}
                                disabled={!apiKey.trim() || isTesting || isSaving}
                                className="flex-1"
                                icon={isTesting
                                    ? <Loader2 size={15} strokeWidth={1.8} className="animate-spin" />
                                    : null}
                            >
                                {isTesting ? '測試中…' : '🧪 測試連線'}
                            </Btn>

                            {!hasSharedAccess && (
                                <Btn
                                    color="mint"
                                    onClick={handleSave}
                                    disabled={!apiKey.trim() || isSaving}
                                    className="flex-1"
                                    icon={isSaving
                                        ? <Loader2 size={15} strokeWidth={1.8} className="animate-spin" />
                                        : null}
                                >
                                    {isSaving ? '儲存中…' : '💾 儲存'}
                                </Btn>
                            )}
                        </div>

                        {savedKey && !hasSharedAccess && (
                            <button
                                type="button"
                                onClick={handleClear}
                                disabled={isSaving}
                                className="w-full text-center text-[12px] text-[var(--coral)] hover:underline font-bold disabled:opacity-50"
                            >
                                🗑️ 清除已儲存的 API Key
                            </button>
                        )}
                    </>
                )}
            </div>
        </ModalShell>
    );
};

export default ApiKeyModal;
