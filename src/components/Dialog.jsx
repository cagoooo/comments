import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import ModalShell from './ui/ModalShell';
import { Btn } from './atoms';

/**
 * 警告 / 確認對話框
 *
 * Props 保留：dialog（{ isOpen, type, title, message, onConfirm }）+ closeDialog。
 * - type === 'confirm' → coral 警告色 + 取消/確定 兩鈕
 * - 其他              → honey 訊息色 + 知道了 單鈕
 */
const Dialog = ({ dialog, closeDialog }) => {
    if (!dialog.isOpen) return null;

    const isConfirm = dialog.type === 'confirm';
    const tapeColor = isConfirm ? 'coral' : 'honey';
    const Icon = isConfirm ? AlertTriangle : Info;

    return (
        <ModalShell
            open={dialog.isOpen}
            onClose={closeDialog}
            width={420}
            tapeColor={tapeColor}
            icon={<Icon size={18} strokeWidth={1.8} />}
            title={dialog.title}
            footer={
                <div className="flex justify-end gap-2 sm:gap-3">
                    {isConfirm ? (
                        <>
                            <Btn variant="outline" onClick={closeDialog} size="sm">
                                取消
                            </Btn>
                            <Btn color="coral" onClick={dialog.onConfirm} size="sm">
                                確定刪除
                            </Btn>
                        </>
                    ) : (
                        <Btn color="mint" onClick={closeDialog} size="sm">
                            知道了
                        </Btn>
                    )}
                </div>
            }
        >
            <div className="px-5 sm:px-7 py-5 sm:py-6 text-[14px] sm:text-[15px] font-medium text-[var(--ink)] leading-relaxed">
                {dialog.message}
            </div>
        </ModalShell>
    );
};

export default Dialog;
