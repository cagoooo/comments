import React from 'react';
import { Heart } from 'lucide-react';

// 從 package.json 讀版本（Vite 會在 build time inline 替換）
const VERSION = 'v2.9.1';

/**
 * 頁尾
 *
 * 含蜜蜂 icon + mono 版本資訊 + 阿凱老師署名（連結至石門國小教師頁）+ 版權年份。
 */
const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer
            className="border-t-2 border-[var(--ink)] shrink-0"
            style={{ background: 'var(--paper-2)' }}
        >
            <div className="max-w-[1480px] mx-auto px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-stretch justify-between gap-2 sm:gap-4 text-[12px]">

                    {/* 左：小蜜蜂 + 產品名 + 版本 */}
                    <div className="flex items-center gap-2 text-[var(--ink-soft)]">
                        <span className="text-[14px]" aria-hidden="true">🐝</span>
                        <span className="font-bold text-[var(--ink)]">點石成金蜂</span>
                        <span className="font-mono text-[11px] text-[var(--ink-mute)]">{VERSION}</span>
                    </div>

                    {/* 中：阿凱老師署名（akai-author-footer skill 要求） */}
                    <div className="flex items-center gap-1.5 text-[var(--ink-soft)]">
                        <span>Made with</span>
                        <Heart size={11} strokeWidth={2} style={{ color: 'var(--coral)' }} fill="var(--coral)" aria-label="愛心" />
                        <span>by</span>
                        <a
                            href="https://www.smes.tyc.edu.tw/modules/tadnews/page.php?ncsn=11&nsn=16#a5"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-[var(--ink)] hover:text-[var(--honey)] underline-offset-2 hover:underline"
                            title="桃園市龍潭區石門國民小學 教師頁"
                        >
                            阿凱老師
                        </a>
                        <span className="text-[var(--ink-mute)]">·</span>
                        <span className="text-[var(--ink-mute)] hidden sm:inline">桃園市石門國小</span>
                    </div>

                    {/* 右：版權年份 */}
                    <div className="font-mono text-[11px] text-[var(--ink-mute)]">
                        © {year}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
