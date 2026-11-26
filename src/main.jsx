import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AuthWrapper from './components/AuthWrapper.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import PWAUpdatePrompt from './components/PWAUpdatePrompt.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'
import { bootstrapTheme } from './hooks/useTheme.js'
import { installChunkErrorRecovery } from './utils/chunkRecovery.js'
import './index.css'

// 在 React 渲染之前同步套用主題，避免亮 / 暗閃爍（FOUC）
bootstrapTheme()

// 網站換版後，開著的舊分頁抓不到舊程式分塊（404）時自動清快取重載，不讓老師看到錯誤畫面
installChunkErrorRecovery()

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

