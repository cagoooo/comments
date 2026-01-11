import React, { useState, useEffect } from 'react';
import { authService, userService } from '../firebase';
import LoginPage from './LoginPage';
import PendingPage from './PendingPage';

/**
 * 認證包裝元件
 * 處理登入狀態、待審核狀態
 */
const AuthWrapper = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // 訂閱認證狀態
    useEffect(() => {
        const unsubscribe = authService.onAuthStateChange((userData) => {
            setUser(userData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // 登出處理
    const handleLogout = async () => {
        await authService.signOut();
        setUser(null);
    };

    // 載入中
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FFF9E6] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl animate-bounce mb-4">🐝</div>
                    <p className="font-bold text-[#2D3436]">載入中...</p>
                </div>
            </div>
        );
    }

    // 未登入
    if (!user) {
        return <LoginPage />;
    }

    // 待審核
    if (!userService.isApproved(user)) {
        return <PendingPage user={user} onLogout={handleLogout} />;
    }

    // 已審核通過，渲染主應用並傳遞使用者資訊
    return React.cloneElement(children, {
        currentUser: user,
        onLogout: handleLogout,
        isAdmin: userService.isAdmin(user)
    });
};

export default AuthWrapper;
