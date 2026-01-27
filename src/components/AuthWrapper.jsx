import React, { useState, useEffect } from 'react';
import { authService, userService, classService, schoolService } from '../firebase';
import LoginPage from './LoginPage';
import PendingPage from './PendingPage';

/**
 * 認證包裝元件
 * 處理登入狀態、待審核狀態
 * 並附加學校與班級名稱到使用者資料
 */
const AuthWrapper = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [schools, setSchools] = useState([]);
    const [classes, setClasses] = useState([]);

    // 訂閱認證狀態
    useEffect(() => {
        const unsubscribe = authService.onAuthStateChange((userData) => {
            setUser(userData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // 訂閱學校和班級資料（所有登入用戶都需要，用於申請表單）
    useEffect(() => {
        if (!user) return;

        const unsubSchools = schoolService.subscribe((data) => {
            setSchools(data);
        });

        const unsubClasses = classService.subscribe((data) => {
            setClasses(data);
        });

        return () => {
            unsubSchools();
            unsubClasses();
        };
    }, [user]);

    // 合併使用者資料與學校/班級名稱
    const enrichedUser = user ? {
        ...user,
        // 優先使用現有學校，其次使用自訂學校
        schoolName: user.schoolId
            ? schools.find(s => s.id === user.schoolId)?.name
            : (user.customSchoolName
                ? (user.customSchoolCity ? `${user.customSchoolCity} ${user.customSchoolName}` : user.customSchoolName)
                : null),
        assignedClassNames: (user.assignedClasses || [])
            .map(classId => classes.find(c => c.id === classId)?.name)
            .filter(Boolean)
    } : null;

    // 登出處理
    const handleLogout = async () => {
        await authService.signOut();
        setUser(null);
    };

    // 處理提交申請
    const handleSubmitApplication = async (uid, schoolInfo, requestedClasses) => {
        const result = await userService.submitApplication(uid, schoolInfo, requestedClasses);
        if (result.success) {
            // 重新取得使用者資料以更新狀態
            const updatedUser = await userService.get(uid);
            if (updatedUser) {
                setUser(updatedUser);
            }
        }
        return result;
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

    // 待審核（需填資料或待審核）
    if (!userService.isApproved(user)) {
        return (
            <PendingPage
                user={user}
                onLogout={handleLogout}
                schools={schools}
                onSubmitApplication={handleSubmitApplication}
                needsInfo={userService.needsInfo(user)}
            />
        );
    }

    // 已審核通過，渲染主應用並傳遞使用者資訊（包含學校/班級名稱）
    return React.cloneElement(children, {
        currentUser: enrichedUser,
        onLogout: handleLogout,
        isAdmin: userService.isAdmin(user)
    });
};

export default AuthWrapper;
