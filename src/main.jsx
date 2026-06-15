import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AuthWrapper from './components/AuthWrapper.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import PWAUpdatePrompt from './components/PWAUpdatePrompt.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'
import { bootstrapTheme } from './hooks/useTheme.js'
import './index.css'

// 在 React 渲染之前同步套用主題，避免亮 / 暗閃爍（FOUC）
bootstrapTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <ToastProvider>
                <AuthWrapper>
                    <App />
                </AuthWrapper>
                {/* PWA 版本更新通知條（登入頁與 App 都會顯示） */}
                <PWAUpdatePrompt />
            </ToastProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)

