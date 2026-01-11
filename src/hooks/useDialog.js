import { useState, useCallback } from 'react';

/**
 * 對話框狀態管理 Hook
 * 提供確認對話框與提示對話框的狀態與操作函數
 */
export const useDialog = () => {
    const [dialog, setDialog] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
        onConfirm: null
    });

    const closeDialog = useCallback(() => {
        setDialog(prev => ({ ...prev, isOpen: false }));
    }, []);

    const showConfirm = useCallback((title, message, onConfirm) => {
        setDialog({
            isOpen: true,
            type: 'confirm',
            title,
            message,
            onConfirm
        });
    }, []);

    const showAlert = useCallback((message) => {
        setDialog({
            isOpen: true,
            type: 'info',
            title: '提示',
            message,
            onConfirm: null
        });
    }, []);

    return {
        dialog,
        closeDialog,
        showConfirm,
        showAlert
    };
};

export default useDialog;
