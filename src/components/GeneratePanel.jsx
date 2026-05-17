import React from 'react';
import { Sparkles, Check, Download, Trash2, FileSpreadsheet, Eye } from 'lucide-react';
import { Card, StickerTab } from './atoms';

/**
 * AI 評語產生控制面板（Step 2）
 *
 * 新設計：紙質卡片 + honey StickerTab + tone 卡片三選一 + 自繪 slider + 下載 chips。
 * 保留全部既有 props 與行為（extraSettings、selectedIds、isViewingMode、disabled 邏輯）。
 *
 * 變動：
 *  - 字數 slider range 從 20~500 改為 40~160 step=10（對齊 proto 視覺；
 *    既有預設 80 仍在範圍內，超出範圍的歷史值會 clamp）
 *  - 下載新增 XLSX 按鈕（既有 downloadHelper 已支援）
 */
const GeneratePanel = ({
    students,
    selectedIds,
    isGenerating,
    extraSettings,
    setExtraSettings,
    onGenerateSelected,
    onGenerateAll,
    onDownload,
    onDeleteSelected,
    onResetList,
    isViewingMode = false,
}) => {
    const tones = [
        { id: 'normal', label: '標準', desc: '溫和平衡' },
        { id: 'casual', label: '口語', desc: '親近自然' },
        { id: 'formal', label: '正式', desc: '莊重莊嚴' },
    ];

    const WORDS_MIN = 40;
    const WORDS_MAX = 160;
    const wordCount = Math.max(WORDS_MIN, Math.min(WORDS_MAX, extraSettings.wordCount || 80));
    const wordsPct = ((wordCount - WORDS_MIN) / (WORDS_MAX - WORDS_MIN)) * 100;

    const setTone = (id) => setExtraSettings(p => ({ ...p, tone: id }));
    const setWords = (n) => setExtraSettings(p => ({ ...p, wordCount: n }));

    const selectedCount = selectedIds?.size ?? 0;
    const hasStudents = students?.length > 0;
    const canGenerateSelected = selectedCount > 0 && !isGenerating;
    const canGenerateAll = hasStudents && !isGenerating;

    return (
        <div className="relative pt-4 flex-1 w-full">
            <Card className="overflow-visible">
                <StickerTab color="honey" number="2">AI 魔法產生</StickerTab>

                {/* 頂部裝飾紙膠帶（薰衣草色） */}
                <div
                    className="tape"
                    style={{
                        top: -10,
                        right: 80,
                        transform: 'rotate(-6deg)',
                        background: 'linear-gradient(180deg, rgba(185,168,230,0.7), rgba(185,168,230,0.5))',
                    }}
                    aria-hidden="true"
                />

                <div className="p-4 sm:p-5 pt-7 space-y-4">

                    {/* ── 語氣 三選一 ───────────────────── */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                                語氣風格
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {tones.map(t => {
                                const active = extraSettings.tone === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => setTone(t.id)}
                                        disabled={isGenerating}
                                        style={{ background: active ? 'var(--honey)' : 'var(--paper-2)' }}
                                        className={[
                                            'b-ink r-btn h-[58px] px-3 text-left flex flex-col justify-center btn-press',
                                            active ? 'sh-btn' : '',
                                            isGenerating ? 'opacity-60 cursor-not-allowed' : '',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft',
                                        ].filter(Boolean).join(' ')}
                                        aria-pressed={active}
                                        aria-label={`語氣：${t.label}（${t.desc}）`}
                                    >
                                        <div className="font-black text-[14px]">{t.label}</div>
                                        <div className="text-[10.5px] text-[var(--ink-soft)] mt-0.5">{t.desc}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── 字數上限 slider ───────────────────── */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                                字數上限
                            </span>
                            <span className="font-mono font-bold text-[14px]">
                                {wordCount} <span className="text-[11px] text-[var(--ink-soft)]">字</span>
                            </span>
                        </div>
                        <div
                            className="b-ink r-btn px-3 h-12 flex items-center gap-3"
                            style={{ background: 'var(--paper-2)' }}
                        >
                            <span className="text-[10px] font-mono text-[var(--ink-soft)] shrink-0">{WORDS_MIN}</span>
                            <div className="flex-1 relative h-2">
                                <div className="absolute inset-0 rounded-full bg-white border-2 border-[var(--ink)]" />
                                <div
                                    className="absolute inset-y-0 left-0 rounded-full border-2 border-[var(--ink)]"
                                    style={{
                                        width: `${wordsPct}%`,
                                        background: 'var(--honey)',
                                    }}
                                />
                                <input
                                    type="range"
                                    min={WORDS_MIN}
                                    max={WORDS_MAX}
                                    step={10}
                                    value={wordCount}
                                    onChange={(e) => setWords(Number(e.target.value))}
                                    disabled={isGenerating}
                                    className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    aria-label="評語字數上限"
                                />
                                <div
                                    className="progress-nub absolute top-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{ left: `calc(${wordsPct}% - 8px)` }}
                                />
                            </div>
                            <span className="text-[10px] font-mono text-[var(--ink-soft)] shrink-0">{WORDS_MAX}</span>
                        </div>
                    </div>

                    {/* ── 生成 ACTION ───────────────────── */}
                    {!isViewingMode ? (
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr] gap-2 pt-1">
                            <button
                                onClick={onGenerateSelected}
                                disabled={!canGenerateSelected}
                                style={{ background: canGenerateSelected ? 'var(--mint-soft)' : 'var(--paper-2)' }}
                                className={[
                                    'b-ink r-btn h-12 flex items-center justify-center gap-2 font-bold text-[13px] btn-press',
                                    canGenerateSelected ? 'sh-btn' : 'sh-sm opacity-60 cursor-not-allowed',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft',
                                ].join(' ')}
                                aria-label={`生成已選 ${selectedCount} 位學生的評語`}
                            >
                                <Check size={14} strokeWidth={1.8} />
                                {isGenerating ? '產生中…' : `生成已選 (${selectedCount})`}
                            </button>
                            <button
                                onClick={onGenerateAll}
                                disabled={!canGenerateAll}
                                style={{ background: 'var(--honey)' }}
                                className={[
                                    'b-ink sh-btn r-btn h-12 flex items-center justify-center gap-2 font-black text-[14.5px] btn-press relative overflow-hidden',
                                    !canGenerateAll ? 'opacity-60 cursor-not-allowed' : '',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft',
                                ].join(' ')}
                                aria-label="生成全部學生的評語（快捷鍵 Cmd/Ctrl + G）"
                            >
                                <Sparkles size={17} strokeWidth={1.8} />
                                {isGenerating ? 'AI 撰寫中…' : '全部生成！'}
                                <span className="absolute right-3 top-1.5 text-[10px] font-mono opacity-50 hidden sm:inline">
                                    ⌘G
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="b-dash r-btn p-3 text-center text-[13px] font-bold text-[var(--ink-soft)] flex items-center justify-center gap-2">
                            <Eye size={14} strokeWidth={1.8} />
                            檢視模式 — 可匯出學生資料
                        </div>
                    )}

                    {/* ── 下載 + 全部清空 ───────────────────── */}
                    <div className="pt-2 border-t-2 border-dashed border-[var(--line-soft)] flex flex-wrap items-center justify-between gap-2 text-[12px] font-bold">
                        <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[var(--ink-soft)] mr-1">下載</span>
                            <button
                                onClick={() => onDownload('txt')}
                                disabled={!hasStudents}
                                className="px-2.5 h-7 b-ink r-btn sh-sm bg-white inline-flex items-center gap-1 btn-press disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                                aria-label="下載 TXT"
                            >
                                <Download size={11} strokeWidth={1.8} /> TXT
                            </button>
                            <button
                                onClick={() => onDownload('csv')}
                                disabled={!hasStudents}
                                className="px-2.5 h-7 b-ink r-btn sh-sm bg-white inline-flex items-center gap-1 btn-press disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                                aria-label="下載 CSV"
                            >
                                <Download size={11} strokeWidth={1.8} /> CSV
                            </button>
                            <button
                                onClick={() => onDownload('xlsx')}
                                disabled={!hasStudents}
                                className="px-2.5 h-7 b-ink r-btn sh-sm bg-white inline-flex items-center gap-1 btn-press disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-soft"
                                aria-label="下載 XLSX"
                            >
                                <FileSpreadsheet size={11} strokeWidth={1.8} /> XLSX
                            </button>
                        </div>

                        {!isViewingMode && (
                            <div className="flex items-center gap-2">
                                {selectedCount > 0 && (
                                    <button
                                        onClick={onDeleteSelected}
                                        disabled={isGenerating}
                                        style={{ background: 'var(--coral-soft)' }}
                                        className="px-2.5 h-7 b-ink r-btn sh-sm inline-flex items-center gap-1 btn-press disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-soft"
                                        aria-label={`刪除已選 ${selectedCount} 位學生`}
                                    >
                                        <Trash2 size={11} strokeWidth={1.8} /> 刪除 ({selectedCount})
                                    </button>
                                )}
                                <button
                                    onClick={onResetList}
                                    disabled={isGenerating || !hasStudents}
                                    className="text-[var(--ink-soft)] hover:text-[var(--coral)] inline-flex items-center gap-1 disabled:opacity-50"
                                    aria-label="全部清空"
                                >
                                    <Trash2 size={11} strokeWidth={1.8} /> 全部清空
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default GeneratePanel;
