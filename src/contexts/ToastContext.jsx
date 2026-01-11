import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

/**
 * Toast Context
 */
const ToastContext = createContext(null);

/**
 * Toast 類型對應樣式
 */
const TOAST_STYLES = {
    success: {
        bg: 'bg-[#1DD1A1]',
        icon: CheckCircle,
        iconColor: 'text-white'
    },
    error: {
        bg: 'bg-[#FF6B6B]',
        icon: XCircle,
        iconColor: 'text-white'
    },
    warning: {
        bg: 'bg-[#FECA57]',
        icon: AlertCircle,
        iconColor: 'text-[#2D3436]'
    },
    info: {
        bg: 'bg-[#54A0FF]',
        icon: Info,
        iconColor: 'text-white'
    }
};

/**
 * 單一 Toast 元件
 */
const ToastItem = ({ id, message, type, onRemove }) => {
    const style = TOAST_STYLES[type] || TOAST_STYLES.info;
    const Icon = style.icon;

    return (
        <div
            className={`${style.bg} text-white px-4 py-3 rounded-lg shadow-lg border-2 border-[#2D3436] 
                       flex items-center gap-3 min-w-[280px] max-w-[400px] animate-in 
                       slide-in-from-right-5 duration-300`}
            role="alert"
        >
            <Icon size={20} className={style.iconColor} />
            <span className="flex-1 font-medium text-sm">{message}</span>
            <button
                onClick={() => onRemove(id)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
};

/**
 * Toast 容器
 */
const ToastContainer = ({ toasts, onRemove }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    {...toast}
                    onRemove={onRemove}
                />
            ))}
        </div>
    );
};

/**
 * Toast Provider
 */
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();

        setToasts(prev => [...prev, { id, message, type }]);

        // 自動移除
        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }

        return id;
    }, [removeToast]);

    // 快捷方法
    const toast = {
        success: (message, duration) => showToast(message, 'success', duration),
        error: (message, duration) => showToast(message, 'error', duration ?? 5000),
        warning: (message, duration) => showToast(message, 'warning', duration),
        info: (message, duration) => showToast(message, 'info', duration),
    };

    return (
        <ToastContext.Provider value={{ showToast, toast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
};

/**
 * useToast Hook
 */
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast 必須在 ToastProvider 內使用');
    }
    return context;
};

export default ToastProvider;
