import React from 'react';
import { LogIn } from 'lucide-react';
import { authService } from '../firebase';

/**
 * 登入頁面
 * 顯示在未登入時
 */
const LoginPage = ({ onLogin }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);

        const result = await authService.signInWithGoogle();

        if (!result.success) {
            setError(result.error);
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#FFF9E6] flex items-center justify-center p-4">
            <div className="card-pop w-full max-w-md p-8 text-center">
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
                    <p className="text-[#636E72] font-bold mt-2">AI 學生評語產生器</p>
                </div>

                {/* 說明 */}
                <div className="bg-[#54A0FF]/20 border-2 border-dashed border-[#54A0FF] rounded-lg p-4 mb-6 text-left">
                    <p className="text-sm text-[#2D3436] font-medium">
                        📚 使用 Google 帳號登入後，管理員將會審核您的帳號並指派班級使用權限。
                    </p>
                </div>

                {/* 錯誤訊息 */}
                {error && (
                    <div className="bg-[#FF6B6B]/20 border-2 border-[#FF6B6B] rounded-lg p-3 mb-4 text-sm text-[#FF6B6B] font-bold">
                        ⚠️ {error}
                    </div>
                )}

                {/* Google 登入按鈕 */}
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

                {/* 版權 */}
                <p className="text-xs text-[#636E72]/50 mt-6">
                    © 2026 點石成金蜂🐝
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
