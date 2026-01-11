import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AuthWrapper from './components/AuthWrapper.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <ToastProvider>
                <AuthWrapper>
                    <App />
                </AuthWrapper>
            </ToastProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)

