import React from 'react';
import { Palette, Check } from 'lucide-react';
import { STYLE_DEFINITIONS } from '../data/styleDefinitions';
import ModalShell from './ui/ModalShell';
import { Btn } from './atoms';

/**
 * 風格選擇 Modal — 最多選 2 種風格組合
 *
 * Props 保留：isOpen / onClose / globalStyles (string[]) / toggleGlobalStyle
 * 12 個風格 id 對映 8 個 token 色（與 StyleBar 一致）
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

const StyleModal = ({ isOpen, onClose, globalStyles, toggleGlobalStyle }) => {
    if (!isOpen) return null;

    return (
        <ModalShell
            open={isOpen}
            onClose={onClose}
            width={760}
            eyebrow="Writing Style"
            tapeColor="lav"
            icon={<Palette size={18} strokeWidth={1.8} />}
            title="選擇寫作風格"
            subtitle={
                <>最多選 <span className="font-bold text-[var(--ink)]">2</span> 種，將組合應用於 AI 生成評語</>
            }
            footer={
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-[13px] font-bold text-[var(--ink-soft)]">
                        已選 <span className="font-mono text-[var(--ink)]">{globalStyles.length}</span> / 2 種 ✨
                    </span>
                    <Btn color="mint" size="sm" onClick={onClose} icon={<Check size={14} strokeWidth={1.8} />}>
                        完成
                    </Btn>
                </div>
            }
        >
            <div className="px-5 sm:px-7 py-4">
                {/* 提示 banner */}
                <div
                    className="b-dash r-btn p-3 mb-4 flex items-center gap-2 text-[12.5px] font-bold text-[var(--ink)]"
                    style={{ background: 'var(--honey-soft)' }}
                >
                    <span className="text-base" aria-hidden="true">💡</span>
                    最多可選 2 種風格組合
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {STYLE_DEFINITIONS.map((style) => {
                        const isSelected = globalStyles.includes(style.id);
                        const isDisabled = !isSelected && globalStyles.length >= 2;
                        const color = styleColorMap[style.id] || 'honey';

                        return (
                            <button
                                key={style.id}
                                type="button"
                                onClick={() => !isDisabled && toggleGlobalStyle(style.id)}
                                disabled={isDisabled}
                                aria-pressed={isSelected}
                                style={{
                                    background: isSelected ? `var(--${color})` : 'white',
                                }}
                                className={[
                                    'b-ink r-card p-3 sm:p-4 text-left transition-all relative',
                                    isSelected ? 'sh-card -translate-x-[1px] -translate-y-[1px]' : 'sh-sm',
                                    isDisabled ? 'opacity-50 cursor-not-allowed' : 'btn-press cursor-pointer',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft',
                                ].filter(Boolean).join(' ')}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-6 h-6 b-ink r-btn flex items-center justify-center shrink-0"
                                        style={{ background: isSelected ? 'var(--ink)' : 'white' }}
                                    >
                                        {isSelected && (
                                            <Check size={14} strokeWidth={2.4} style={{ color: 'var(--paper)' }} />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-black text-[14px] sm:text-[15px] tracking-tight">
                                            {style.name}
                                        </h4>
                                        <p className="text-[11.5px] sm:text-[12px] mt-1 leading-relaxed text-[var(--ink-soft)]">
                                            {style.desc}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </ModalShell>
    );
};

export default StyleModal;
