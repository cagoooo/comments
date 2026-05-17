import React from 'react';
import { Palette, Edit3, Check } from 'lucide-react';
import { STYLE_DEFINITIONS } from '../data/styleDefinitions';

/**
 * 風格設定顯示條
 *
 * 新設計：honey-soft 底色 strip + 已選風格 chip + 「更改風格」按鈕。
 * 保留既有 props：globalStyles (string[]), onOpenStyleModal, isGenerating。
 *
 * 12 個風格 id 對映到 8 個 token 色（同 hue 共用），確保整體和諧不超出設計系統。
 */
const styleColorMap = {
    qualitative: 'mint',
    emotional: 'coral',
    friendly: 'honey',
    humorous: 'peach',
    internal: 'sky',
    philosophical: 'lav',
    practical: 'mint',
    resonance: 'coral',
    blessing: 'honey',
    scenario: 'peach',
    milestone: 'sky',
    journey: 'lav',
};

const StyleBar = ({ globalStyles, onOpenStyleModal, isGenerating }) => {
    const hasStyles = globalStyles?.length > 0;

    return (
        <div
            className="mb-4 sm:mb-6 b-ink r-btn sh-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 px-3 sm:px-4 py-3 sm:py-2 sm:min-h-12"
            style={{ background: 'var(--honey-soft)' }}
        >
            {/* 左：標題 + 已選風格 chips */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink-soft)] shrink-0">
                    <Palette size={13} strokeWidth={1.8} />
                    目前風格
                </span>

                <div className="flex items-center gap-1.5 flex-wrap">
                    {hasStyles ? (
                        globalStyles.map(id => {
                            const color = styleColorMap[id] || 'honey';
                            const name = STYLE_DEFINITIONS.find(d => d.id === id)?.name || id;
                            return (
                                <span
                                    key={id}
                                    style={{ background: `var(--${color})`, color: 'var(--ink)' }}
                                    className="px-2.5 h-7 b-ink r-btn text-[12px] font-bold inline-flex items-center gap-1"
                                >
                                    <Check size={11} strokeWidth={1.8} />
                                    {name}
                                </span>
                            );
                        })
                    ) : (
                        <span className="text-[var(--ink-soft)] text-[12px] italic">
                            未設定（預設：質性描述）
                        </span>
                    )}
                </div>
            </div>

            {/* 右：更改風格按鈕 */}
            <button
                onClick={onOpenStyleModal}
                disabled={isGenerating}
                className="sm:ml-auto w-full sm:w-auto h-10 sm:h-9 px-3 b-ink sh-btn r-btn bg-white inline-flex items-center justify-center gap-1.5 font-bold text-[12.5px] btn-press disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                aria-label="開啟風格選擇 Modal"
            >
                <Edit3 size={13} strokeWidth={1.8} />
                更改風格
            </button>
        </div>
    );
};

export default StyleBar;
