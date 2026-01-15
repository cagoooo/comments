import React, { useState, useEffect } from 'react';
import { LogIn, ExternalLink, Copy, Check, AlertTriangle, Smartphone } from 'lucide-react';
import { authService } from '../firebase';

/**
 * 檢測是否在 App 內嵌瀏覽器中
 * 常見的內嵌 WebView: LINE, Facebook, Instagram, WeChat, etc.
 */
const detectInAppBrowser = () => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const inAppPatterns = [
        'Line/',              // LINE
        'FBAN',               // Facebook App
        'FBAV',               // Facebook App
        'Instagram',          // Instagram
        'Twitter',            // Twitter
        'MicroMessenger',     // WeChat
        'WebView',            // Generic WebView
        'wv)',                // Android WebView
    ];

    const isInApp = inAppPatterns.some(pattern => ua.includes(pattern));

    // 檢測是否為 iOS/Android
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);

    return { isInApp, isIOS, isAndroid };
};

/**
 * 登入頁面
 * 顯示在未登入時
 */
const LoginPage = ({ onLogin }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [browserInfo] = useState(() => detectInAppBrowser());

    const currentUrl = window.location.href;

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);

        const result = await authService.signInWithGoogle();

        if (!result.success) {
            // 檢測是否為 popup blocked 錯誤
            if (result.error?.includes('popup') || result.error?.includes('blocked')) {
                setError('popup-blocked');
            } else {
                setError(result.error);
            }
        }

        setIsLoading(false);
    };

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(currentUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = currentUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFF9E6] flex items-center justify-center p-4">
            <div className="card-pop w-full max-w-md p-6 sm:p-8 text-center">
                {/* Logo */}
                <div className="mb-6">
                    <div className="inline-block bg-[#FECA57] text-[#2D3436] p-4 border-3 border-[#2D3436] shadow-[4px_4px_0_#2D3436] transform rotate-[-3deg] rounded-lg mb-4">
                        <span className="text-5xl">🐝</span>
                    </div>
                    <h1 className="text-3xl font-black text-[#2D3436]">
                        <span className="relative">
                            <span className="relative z-10">點石成金蜂</span>
                            <span className="absolute bottom-0 left-0 right-0 h-3 bg-[#FF6B9D] -z-0 transform -rotate-1"></span>
                        </span>
                    </h1>
                    <p className="text-[#636E72] font-bold mt-2">學生評語優化平台</p>
                </div>

                {/* 內嵌瀏覽器警告 - 偵測到時顯示（完全取代登入區塊） */}
                {browserInfo.isInApp ? (
                    <div className="bg-[#FF9F43]/20 border-2 border-[#FF9F43] rounded-lg p-4 mb-4 text-left">
                        <div className="flex items-start gap-2 mb-3">
                            <AlertTriangle size={20} className="text-[#FF9F43] flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-[#2D3436] text-sm">
                                    偵測到您使用 App 內建瀏覽器
                                </p>
                                <p className="text-xs text-[#636E72] mt-1">
                                    Google 登入無法在 LINE、Facebook 等 App 內正常運作
                                </p>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-[#FF9F43]/30">
                            <p className="text-xs font-bold text-[#2D3436] mb-2">📱 請使用以下方式開啟：</p>
                            <ol className="text-xs text-[#636E72] space-y-1.5 ml-4 list-decimal">
                                {browserInfo.isIOS ? (
                                    <>
                                        <li>點擊右上角 <strong>⋯</strong> 或 <strong>⋮</strong> 選單</li>
                                        <li>選擇「<strong>用 Safari 開啟</strong>」或「<strong>以瀏覽器開啟</strong>」</li>
                                    </>
                                ) : browserInfo.isAndroid ? (
                                    <>
                                        <li>點擊右上角 <strong>⋮</strong> 選單</li>
                                        <li>選擇「<strong>用 Chrome 開啟</strong>」或「<strong>以瀏覽器開啟</strong>」</li>
                                    </>
                                ) : (
                                    <>
                                        <li>點擊右上角選單按鈕</li>
                                        <li>選擇「<strong>以瀏覽器開啟</strong>」</li>
                                    </>
                                )}
                            </ol>
                        </div>
                        <button
                            onClick={handleCopyUrl}
                            className="w-full mt-3 py-3 px-3 bg-[#FF9F43] text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 active:opacity-80 border-2 border-[#2D3436] shadow-[3px_3px_0_#2D3436]"
                        >
                            {copied ? (
                                <><Check size={18} /> 已複製網址！請貼到外部瀏覽器</>
                            ) : (
                                <><Copy size={18} /> 複製網址到外部瀏覽器</>
                            )}
                        </button>
                        <p className="text-xs text-[#636E72] text-center mt-3">
                            ⚠️ 請務必使用 Safari / Chrome 等瀏覽器開啟
                        </p>
                    </div>
                ) : (
                    <>
                        {/* 說明 - 僅正常瀏覽器顯示 */}
                        <div className="bg-[#54A0FF]/20 border-2 border-dashed border-[#54A0FF] rounded-lg p-4 mb-4 text-center">
                            <p className="text-sm text-[#2D3436] font-medium">
                                📚 使用 Google 帳號登入後，請選擇學校並新增班級，提交後等待管理員審核即可使用。
                            </p>
                        </div>

                        {/* 錯誤訊息 */}
                        {error && (
                            <div className="bg-[#FF6B6B]/20 border-2 border-[#FF6B6B] rounded-lg p-3 mb-4 text-left">
                                {error === 'popup-blocked' ? (
                                    <>
                                        <p className="font-bold text-[#FF6B6B] text-sm mb-2">
                                            ⚠️ Firebase: Error (auth/popup-blocked).
                                        </p>
                                        <div className="text-xs text-[#636E72] space-y-2">
                                            <p>Google 登入彈出視窗被阻擋，請依照以下步驟操作：</p>
                                            <div className="bg-white rounded p-2 space-y-1">
                                                {browserInfo.isIOS ? (
                                                    <ol className="list-decimal ml-4 space-y-1">
                                                        <li>點右上角 <strong>⋯</strong> 選單</li>
                                                        <li>選「<strong>用 Safari 開啟</strong>」</li>
                                                        <li>在 Safari 重新登入即可</li>
                                                    </ol>
                                                ) : browserInfo.isAndroid ? (
                                                    <ol className="list-decimal ml-4 space-y-1">
                                                        <li>點右上角 <strong>⋮</strong> 選單</li>
                                                        <li>選「<strong>用 Chrome 開啟</strong>」</li>
                                                        <li>在 Chrome 重新登入即可</li>
                                                    </ol>
                                                ) : (
                                                    <ol className="list-decimal ml-4 space-y-1">
                                                        <li>複製以下網址</li>
                                                        <li>用手機的預設瀏覽器開啟</li>
                                                        <li>重新登入即可</li>
                                                    </ol>
                                                )}
                                            </div>
                                            <button
                                                onClick={handleCopyUrl}
                                                className="w-full py-2 bg-[#FF6B6B] text-white rounded font-bold text-xs flex items-center justify-center gap-1"
                                            >
                                                {copied ? <><Check size={14} /> 已複製！</> : <><Copy size={14} /> 複製網址</>}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-[#FF6B6B] font-bold">⚠️ {error}</p>
                                )}
                            </div>
                        )}

                        {/* Google 登入按鈕 - 僅正常瀏覽器顯示 */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="btn-pop w-full py-4 bg-white text-[#2D3436] font-bold flex items-center justify-center gap-3 text-lg disabled:opacity-50"
                        >
                            {isLoading ? (
                                <span className="animate-spin text-2xl">🐝</span>
                            ) : (
                                <>
                                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    使用 Google 帳號登入
                                </>
                            )}
                        </button>
                    </>
                )}

                {/* 版權 */}
                <p className="text-xs text-[#636E72]/50 mt-6">
                    © 2026 點石成金蜂🐝
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
