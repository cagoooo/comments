import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

/**
 * PWA 安裝提示 Banner
 */
const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // 檢查是否已經安裝
        const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
        if (isInstalled) return;

        // 檢查是否已經關閉過
        const dismissed = localStorage.getItem('pwa_install_dismissed');
        if (dismissed && Date.now() - parseInt(dismissed) < 1000 * 60 * 60 * 24 * 7) {
            return; // 7 天內不再顯示
        }

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowBanner(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('pwa_install_dismissed', Date.now().toString());
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[100] animate-in">
            <div className="bg-[#2D3436] text-white p-4 rounded-lg border-3 border-[#FECA57] shadow-[4px_4px_0_#FECA57] flex items-center gap-3">
                <div className="text-3xl">🐝</div>
                <div className="flex-1">
                    <h3 className="font-black text-sm">安裝到桌面</h3>
                    <p className="text-xs text-white/70 mt-0.5">離線也能使用，更方便！</p>
                </div>
                <button
                    onClick={handleInstall}
                    className="btn-pop px-3 py-2 bg-[#FECA57] text-[#2D3436] text-xs font-bold flex items-center gap-1"
                >
                    <Download size={14} />
                    安裝
                </button>
                <button
                    onClick={handleDismiss}
                    className="text-white/50 hover:text-white p-1"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default InstallPrompt;
