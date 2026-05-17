import React, { useState } from 'react';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import { authService } from '../firebase';
import { Btn, Card } from './atoms';

/**
 * 偵測 App 內嵌瀏覽器（LINE / FB / IG / WeChat / 通用 WebView）
 */
const detectInAppBrowser = () => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const inAppPatterns = ['Line/', 'FBAN', 'FBAV', 'Instagram', 'Twitter', 'MicroMessenger', 'WebView', 'wv)'];
    const isInApp = inAppPatterns.some(p => ua.includes(p));
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    return { isInApp, isIOS, isAndroid };
};

/**
 * Google 多色 G logo
 */
const GoogleG = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const FeatureChip = ({ icon, label, sub, color }) => (
    <div
        className="flex items-center gap-2.5 bg-white b-ink sh-sm r-btn px-3 h-12"
    >
        <div
            className="w-7 h-7 rounded-full b-ink flex items-center justify-center text-[13px] shrink-0"
            style={{ background: `var(--${color})` }}
            aria-hidden="true"
        >
            {icon}
        </div>
        <div className="leading-tight min-w-0">
            <div className="font-bold text-[12.5px] truncate">{label}</div>
            <div className="text-[10.5px] text-[var(--ink-soft)] truncate">{sub}</div>
        </div>
    </div>
);

/**
 * 登入頁面
 *
 * 設計：對照 login.html — 雙欄 hero（≥ lg）+ 浮動 chip + 紙膠帶 + bee mascot bob + BEGIN HERE sticker tab
 * Props 保留：onLogin（雖未直接呼叫，但 authService.signInWithGoogle 走 callback redirect）
 * 完整保留：App 內嵌瀏覽器警告 + popup-blocked error handling + 複製網址功能
 */
const LoginPage = ({ onLogin }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [browserInfo] = useState(() => detectInAppBrowser());

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        const result = await authService.signInWithGoogle();
        if (!result.success) {
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
        <div className="min-h-screen relative overflow-hidden">
            {/* 背景大蜜糖光暈 */}
            <div
                className="absolute pointer-events-none"
                style={{
                    top: -200,
                    left: -200,
                    width: 720,
                    height: 720,
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
                    bottom: -300,
                    right: -250,
                    width: 720,
                    height: 720,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, var(--peach-soft) 0%, transparent 60%)',
                    opacity: 0.7,
                    zIndex: 0,
                }}
                aria-hidden="true"
            />

            {/* 散落紙膠帶（僅桌面顯示，避免手機擠） */}
            <div
                className="tape hidden lg:block"
                style={{ top: 90, left: 130, width: 140, transform: 'rotate(-8deg)' }}
                aria-hidden="true"
            />
            <div
                className="tape hidden lg:block"
                style={{
                    top: 240,
                    right: 200,
                    width: 110,
                    transform: 'rotate(6deg)',
                    background: 'linear-gradient(180deg, rgba(185,168,230,0.55), rgba(185,168,230,0.4))',
                }}
                aria-hidden="true"
            />
            <div
                className="tape hidden lg:block"
                style={{
                    bottom: 180,
                    left: 240,
                    width: 120,
                    transform: 'rotate(-2deg)',
                    background: 'linear-gradient(180deg, rgba(118,183,230,0.45), rgba(118,183,230,0.3))',
                }}
                aria-hidden="true"
            />

            <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-2">

                {/* ── LEFT: 品牌介紹 ────────────────────────── */}
                <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-20 py-10 lg:py-0 order-2 lg:order-1">
                    <div className="max-w-[520px] mx-auto lg:mx-0 w-full">

                        {/* 版本小 chip */}
                        <div className="inline-flex items-center gap-2 b-ink r-btn sh-sm bg-white px-3 h-8 text-[12px] font-bold mb-5">
                            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--mint)' }} />
                            v2.9 · AI 智慧期末評語產生器
                        </div>

                        {/* 大標 */}
                        <h1 className="text-[36px] sm:text-[44px] lg:text-[56px] font-black tracking-tight leading-[1.05]">
                            寫評語<br />
                            不再讓老師<br />
                            <span className="relative inline-block">
                                <span className="relative z-10">熬到天亮</span>
                                <span
                                    className="absolute bottom-1 left-0 right-0 h-3 lg:h-4 -z-0"
                                    style={{ background: 'var(--honey)' }}
                                    aria-hidden="true"
                                />
                            </span>
                            <span style={{ color: 'var(--honey)' }}>。</span>
                        </h1>

                        <p className="text-[14px] sm:text-[16px] leading-[1.7] text-[var(--ink-soft)] mt-5 max-w-[460px]">
                            點石成金蜂🐝 是專為老師設計的 AI 評語工作台。輸入特質、按下生成，
                            <span className="uw inline-block font-bold text-[var(--ink)]">不到三秒就能寫好一篇</span>有溫度的學生評語。
                        </p>

                        <div className="mt-6 flex flex-col gap-2.5 max-w-[460px]">
                            <FeatureChip icon="⚡" color="honey-soft" label="批次生成全班評語" sub="一鍵 30 位學生" />
                            <FeatureChip icon="✏️" color="peach-soft" label="一鍵改寫風格" sub="精簡 / 詳細 / 換句話說" />
                            <FeatureChip icon="🐝" color="mint-soft" label="完全免費的工具" sub="Google 帳號即可開通" />
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: 登入卡 ────────────────────────── */}
                <div className="flex items-center justify-center px-4 sm:px-8 lg:px-20 py-10 lg:py-0 order-1 lg:order-2">
                    <div className="relative w-full max-w-[440px]">
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
                                background: 'linear-gradient(180deg, rgba(255,107,90,0.55), rgba(255,107,90,0.4))',
                            }}
                            aria-hidden="true"
                        />

                        <Card className="p-6 sm:p-8">
                            {/* sticker tab */}
                            <div
                                className="sticker-tab"
                                style={{ background: 'var(--honey)', left: '50%', transform: 'translateX(-50%)' }}
                            >
                                <span>BEGIN HERE ✦</span>
                            </div>

                            {/* bee mascot bob */}
                            <div className="flex justify-center mt-3 mb-4">
                                <div
                                    className="bee-bob"
                                    style={{
                                        width: 88,
                                        height: 88,
                                        background: 'var(--honey)',
                                        border: 'var(--b-w) solid var(--ink)',
                                        boxShadow: 'var(--shadow-card)',
                                        borderRadius: 18,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 50,
                                        lineHeight: 1,
                                    }}
                                    aria-hidden="true"
                                >
                                    🐝
                                </div>
                            </div>

                            {/* 標題 */}
                            <div className="text-center">
                                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[var(--ink-soft)]">
                                    點石成金蜂
                                </div>
                                <h2 className="text-[24px] sm:text-[26px] font-black tracking-tight mt-1">
                                    <span className="relative inline-block">
                                        <span className="relative z-10">歡迎回來</span>
                                        <span
                                            className="absolute bottom-0 left-0 right-0 h-3 -z-0"
                                            style={{ background: 'var(--coral-soft)' }}
                                            aria-hidden="true"
                                        />
                                    </span>
                                </h2>
                                <p className="text-[12.5px] text-[var(--ink-soft)] mt-2">
                                    登入後即可繼續你的評語工作
                                </p>
                            </div>

                            {/* App 內嵌瀏覽器警告 */}
                            {browserInfo.isInApp ? (
                                <div
                                    className="mt-5 b-ink r-card p-3.5"
                                    style={{ background: 'var(--peach-soft)' }}
                                    role="alert"
                                >
                                    <div className="flex items-start gap-2 mb-2.5">
                                        <AlertTriangle size={16} strokeWidth={1.8} className="shrink-0 mt-0.5" style={{ color: 'var(--coral)' }} />
                                        <div>
                                            <p className="font-bold text-[13px] text-[var(--ink)]">
                                                偵測到您使用 App 內建瀏覽器
                                            </p>
                                            <p className="text-[11.5px] text-[var(--ink-soft)] mt-0.5">
                                                Google 登入無法在 LINE / Facebook 等 App 內運作
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-white b-soft r-btn p-2.5">
                                        <p className="text-[11.5px] font-bold mb-1.5">📱 請以系統瀏覽器開啟：</p>
                                        <ol className="text-[11.5px] text-[var(--ink-soft)] space-y-1 ml-4 list-decimal">
                                            {browserInfo.isIOS ? (
                                                <>
                                                    <li>點右上角 <strong>⋯ / ⋮</strong> 選單</li>
                                                    <li>選「<strong>用 Safari 開啟</strong>」</li>
                                                </>
                                            ) : browserInfo.isAndroid ? (
                                                <>
                                                    <li>點右上角 <strong>⋮</strong> 選單</li>
                                                    <li>選「<strong>用 Chrome 開啟</strong>」</li>
                                                </>
                                            ) : (
                                                <>
                                                    <li>點右上角選單按鈕</li>
                                                    <li>選「<strong>以瀏覽器開啟</strong>」</li>
                                                </>
                                            )}
                                        </ol>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCopyUrl}
                                        className="mt-3 w-full b-ink sh-sm r-btn h-10 inline-flex items-center justify-center gap-1.5 font-bold text-[12.5px] btn-press"
                                        style={{ background: 'var(--coral)' }}
                                    >
                                        {copied ? (
                                            <><Check size={13} strokeWidth={2.2} /> 已複製網址</>
                                        ) : (
                                            <><Copy size={13} strokeWidth={1.8} /> 複製網址到外部瀏覽器</>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* 說明 banner */}
                                    <div
                                        className="mt-5 b-dash r-btn p-3 flex items-start gap-3"
                                        style={{ background: 'var(--sky-soft)' }}
                                    >
                                        <div className="text-[16px] leading-none mt-0.5" aria-hidden="true">📚</div>
                                        <div className="text-[12px] leading-[1.7] text-[var(--ink)]">
                                            使用 <span className="font-bold">Google 帳號</span>登入後，填寫學校班級即可
                                            <span className="font-bold text-[var(--ink)]">立即開通</span>，無需等待審核。
                                        </div>
                                    </div>

                                    {/* 錯誤訊息 */}
                                    {error && (
                                        <div
                                            className="mt-3 b-ink r-card p-3"
                                            style={{ background: 'var(--coral-soft)' }}
                                            role="alert"
                                        >
                                            {error === 'popup-blocked' ? (
                                                <>
                                                    <p className="font-bold text-[12.5px] mb-2" style={{ color: 'var(--coral)' }}>
                                                        ⚠️ Google 登入彈出視窗被阻擋
                                                    </p>
                                                    <p className="text-[11px] text-[var(--ink-soft)] mb-2">
                                                        請在系統瀏覽器（Safari / Chrome）重新開啟並登入
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={handleCopyUrl}
                                                        className="w-full b-ink sh-sm r-btn h-9 inline-flex items-center justify-center gap-1.5 font-bold text-[12px] btn-press"
                                                        style={{ background: 'var(--coral)' }}
                                                    >
                                                        {copied
                                                            ? <><Check size={12} strokeWidth={2.2} /> 已複製</>
                                                            : <><Copy size={12} strokeWidth={1.8} /> 複製網址</>}
                                                    </button>
                                                </>
                                            ) : (
                                                <p className="text-[12.5px] font-bold" style={{ color: 'var(--coral)' }}>⚠️ {error}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Google 登入按鈕 */}
                                    <button
                                        type="button"
                                        onClick={handleGoogleLogin}
                                        disabled={isLoading}
                                        className="mt-4 w-full b-ink sh-btn r-btn h-12 inline-flex items-center justify-center gap-3 font-bold text-[14px] btn-press bg-white disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                                    >
                                        {isLoading ? (
                                            <span className="text-2xl bee-bob inline-block" aria-hidden="true">🐝</span>
                                        ) : (
                                            <>
                                                <GoogleG />
                                                <span>使用 Google 帳號登入</span>
                                            </>
                                        )}
                                    </button>

                                    {/* 條款 */}
                                    <div className="mt-3 text-center text-[10.5px] text-[var(--ink-mute)]">
                                        登入即表示同意我們的
                                        <a className="text-[var(--ink-soft)] underline mx-1 cursor-pointer">服務條款</a>與
                                        <a className="text-[var(--ink-soft)] underline mx-1 cursor-pointer">隱私政策</a>
                                    </div>
                                </>
                            )}
                        </Card>

                        {/* 信任條 */}
                        <div className="mt-4 flex items-center justify-center gap-3 text-[11px] font-mono text-[var(--ink-soft)] tracking-wider flex-wrap">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--mint)' }} />
                                老師專屬工具
                            </span>
                            <span className="text-[var(--ink-mute)]">·</span>
                            <span>資料安全儲存於 Firebase</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
