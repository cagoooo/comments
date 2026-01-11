/**
 * 使用者認證服務
 * Google 登入、登出、使用者狀態管理
 */
import {
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import {
    doc,
    getDoc,
    setDoc,
    collection,
    onSnapshot,
    serverTimestamp,
    query,
    orderBy,
    updateDoc
} from 'firebase/firestore';
import { auth, googleProvider, db } from './config';

// 管理員 Email（寫死在 code 中做基本驗證，Firestore 規則會再驗證一次）
const ADMIN_EMAIL = 'cagooo@gmail.com';

// 集合名稱
const COLLECTIONS = {
    USERS: 'users'
};

/**
 * 使用者角色定義
 */
export const USER_ROLES = {
    ADMIN: 'admin',       // 管理員：可審核、指派班級
    TEACHER: 'teacher',   // 教師：已審核通過，可使用指定班級
    PENDING: 'pending'    // 待審核：剛註冊，等待管理員審核
};

/**
 * 認證服務
 */
export const authService = {
    /**
     * 取得當前使用者
     */
    getCurrentUser: () => auth.currentUser,

    /**
     * 訂閱認證狀態變化
     */
    onAuthStateChange: (callback) => {
        return onAuthStateChanged(auth, async (user) => {
            if (user) {
                // 取得或建立使用者資料
                const userData = await userService.getOrCreate(user);
                callback({ ...user, ...userData });
            } else {
                callback(null);
            }
        });
    },

    /**
     * Google 登入
     */
    signInWithGoogle: async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // 建立或更新使用者資料
            await userService.getOrCreate(user);

            return { success: true, user };
        } catch (error) {
            console.error('Google 登入失敗:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 登出
     */
    signOut: async () => {
        try {
            await firebaseSignOut(auth);
            return { success: true };
        } catch (error) {
            console.error('登出失敗:', error);
            return { success: false, error: error.message };
        }
    }
};

/**
 * 使用者資料服務
 */
export const userService = {
    /**
     * 取得或建立使用者資料
     */
    getOrCreate: async (authUser) => {
        const userRef = doc(db, COLLECTIONS.USERS, authUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            // 更新最後登入時間
            await setDoc(userRef, {
                lastLoginAt: serverTimestamp()
            }, { merge: true });

            return { id: userSnap.id, ...userSnap.data() };
        }

        // 建立新使用者
        const isAdmin = authUser.email === ADMIN_EMAIL;
        const newUser = {
            uid: authUser.uid,
            email: authUser.email,
            displayName: authUser.displayName || '未命名',
            photoURL: authUser.photoURL || null,
            role: isAdmin ? USER_ROLES.ADMIN : USER_ROLES.PENDING,
            assignedClasses: [], // 指派的班級 ID 列表
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            approvedAt: isAdmin ? serverTimestamp() : null,
            approvedBy: isAdmin ? 'system' : null
        };

        await setDoc(userRef, newUser);
        return { id: authUser.uid, ...newUser };
    },

    /**
     * 取得使用者資料
     */
    get: async (uid) => {
        const userRef = doc(db, COLLECTIONS.USERS, uid);
        const userSnap = await getDoc(userRef);
        return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
    },

    /**
     * 訂閱所有使用者（管理員用）
     */
    subscribeAll: (callback) => {
        const usersRef = collection(db, COLLECTIONS.USERS);
        const q = query(usersRef, orderBy('createdAt', 'desc'));

        return onSnapshot(q, (snapshot) => {
            const users = [];
            snapshot.forEach((doc) => {
                users.push({ id: doc.id, ...doc.data() });
            });
            callback(users);
        }, (error) => {
            console.error('使用者訂閱錯誤:', error);
        });
    },

    /**
     * 審核使用者（管理員用）
     * @param {string} uid - 使用者 ID
     * @param {string[]} assignedClasses - 指派的班級 ID 陣列
     * @param {string|null} schoolId - 指派的學校 ID
     */
    approve: async (uid, assignedClasses = [], schoolId = null) => {
        try {
            const userRef = doc(db, COLLECTIONS.USERS, uid);
            const updateData = {
                role: USER_ROLES.TEACHER,
                assignedClasses,
                approvedAt: serverTimestamp(),
                approvedBy: auth.currentUser?.uid || 'unknown'
            };
            if (schoolId) {
                updateData.schoolId = schoolId;
            }
            await updateDoc(userRef, updateData);
            return { success: true };
        } catch (error) {
            console.error('審核使用者失敗:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 更新使用者學校與班級指派（管理員用）
     * @param {string} uid - 使用者 ID
     * @param {string[]} assignedClasses - 指派的班級 ID 陣列
     * @param {string|null} schoolId - 指派的學校 ID
     */
    updateAssignedClasses: async (uid, assignedClasses, schoolId = null) => {
        try {
            const userRef = doc(db, COLLECTIONS.USERS, uid);
            const updateData = {
                assignedClasses,
                updatedAt: serverTimestamp()
            };
            if (schoolId !== undefined) {
                updateData.schoolId = schoolId;
            }
            await updateDoc(userRef, updateData);
            return { success: true };
        } catch (error) {
            console.error('更新班級指派失敗:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 拒絕使用者（管理員用）
     */
    reject: async (uid) => {
        try {
            const userRef = doc(db, COLLECTIONS.USERS, uid);
            await updateDoc(userRef, {
                role: USER_ROLES.PENDING,
                assignedClasses: [],
                rejectedAt: serverTimestamp(),
                rejectedBy: auth.currentUser?.uid || 'unknown'
            });
            return { success: true };
        } catch (error) {
            console.error('拒絕使用者失敗:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 檢查是否為管理員
     */
    isAdmin: (user) => user?.role === USER_ROLES.ADMIN,

    /**
     * 檢查是否已審核通過
     */
    isApproved: (user) => user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.TEACHER
};

export default { authService, userService, USER_ROLES };
