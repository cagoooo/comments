import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

/**
 * 錯誤邊界元件
 * 捕捉子元件的錯誤，防止整個應用崩潰
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error('🐝 ErrorBoundary 捕捉到錯誤:', error, errorInfo);

        // 可在此處整合錯誤追蹤服務（如 Sentry）
        // if (window.Sentry) {
        //     window.Sentry.captureException(error, { extra: errorInfo });
        // }
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF9E6] to-[#FFE4E1] p-4">
                    <div className="card-pop max-w-md w-full p-8 bg-white text-center">
                        {/* 圖示 */}
                        <div className="mb-6">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#FF6B6B]/20 rounded-full mb-4">
                                <AlertTriangle size={40} className="text-[#FF6B6B]" />
                            </div>
                            <div className="text-4xl">🐝💔</div>
                        </div>

                        {/* 標題 */}
                        <h1 className="text-2xl font-black text-[#2D3436] mb-2">
                            哎呀，出了點問題！
                        </h1>

                        <p className="text-[#636E72] mb-6">
                            小蜜蜂遇到了一些困難，請重新整理頁面試試看
                        </p>

                        {/* 錯誤詳情（開發模式） */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-3 bg-[#FF6B6B]/10 border-2 border-[#FF6B6B]/30 rounded-lg text-left">
                                <p className="text-xs font-bold text-[#FF6B6B] mb-1">
                                    錯誤訊息（僅開發模式顯示）
                                </p>
                                <pre className="text-xs text-[#2D3436] overflow-auto max-h-32">
                                    {this.state.error.toString()}
                                </pre>
                            </div>
                        )}

                        {/* 按鈕 */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={this.handleReset}
                                className="btn-pop flex-1 py-3 px-4 bg-[#636E72] text-white font-bold flex items-center justify-center gap-2"
                            >
                                返回嘗試
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="btn-pop flex-1 py-3 px-4 bg-[#FF6B9D] text-white font-bold flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={18} />
                                重新載入
                            </button>
                        </div>

                        {/* 提示 */}
                        <p className="mt-6 text-xs text-[#636E72]">
                            如果問題持續發生，請聯繫系統管理員
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
