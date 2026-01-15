/**
 * Firestore 資料服務
 * 學生資料、設定、範本、班級與歷史記錄的 CRUD 操作
 * 
 * 資料隔離架構：
 * - 學生資料: users/{userId}/students/{studentId}
 * - 範本資料: users/{userId}/templates/{templateId}
 * - 設定資料: users/{userId}/settings/user
 * - 歷史記錄: users/{userId}/students/{studentId}/history/{historyId}
 * - 班級資料: classes/{classId} (全域共用)
 */
import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    deleteDoc,
    onSnapshot,
    writeBatch,
    serverTimestamp,
    query,
    orderBy,
    limit,
    where,
    addDoc
} from 'firebase/firestore';
import { db } from './config';

// 當前使用者 ID（用於資料隔離）
let currentUserId = null;

/**
 * 設定當前使用者 ID
 * @param {string} userId - 使用者 UID
 */
export const setCurrentUserId = (userId) => {
    currentUserId = userId;
};

/**
 * 取得當前使用者 ID
 * @returns {string|null}
 */
export const getCurrentUserId = () => currentUserId;

// 集合名稱
const COLLECTIONS = {
    USERS: 'users',
    STUDENTS: 'students',
    SETTINGS: 'settings',
    TEMPLATES: 'templates',
    CLASSES: 'classes',
    SCHOOLS: 'schools',
    ADMIN_CONFIG: 'adminConfig'
};

/**
 * 取得使用者專屬的集合參考
 * @param {string} collectionName - 集合名稱
 * @returns {CollectionReference}
 */
const getUserCollection = (collectionName) => {
    if (!currentUserId) {
        throw new Error('使用者 ID 未設定，請先呼叫 setCurrentUserId()');
    }
    return collection(db, COLLECTIONS.USERS, currentUserId, collectionName);
};

/**
 * 取得使用者專屬的文件參考
 * @param {string} collectionName - 集合名稱
 * @param {string} docId - 文件 ID
 * @returns {DocumentReference}
 */
const getUserDoc = (collectionName, docId) => {
    if (!currentUserId) {
        throw new Error('使用者 ID 未設定，請先呼叫 setCurrentUserId()');
    }
    return doc(db, COLLECTIONS.USERS, currentUserId, collectionName, docId);
};

/**
 * 學生資料服務
 */
export const studentService = {
    subscribe: (callback, classId = null) => {
        if (!currentUserId) {
            console.error('使用者 ID 未設定');
            callback([]);
            return () => { };
        }

        const studentsRef = getUserCollection(COLLECTIONS.STUDENTS);

        return onSnapshot(studentsRef, (snapshot) => {
            let students = [];
            snapshot.forEach((doc) => {
                const data = { id: doc.id, ...doc.data() };
                // 如果指定班級，則過濾
                if (!classId || data.classId === classId) {
                    students.push(data);
                }
            });
            students.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
            callback(students);
        }, (error) => {
            console.error('Firestore 訂閱錯誤:', error);
            callback([]);
        });
    },

    /**
     * 訂閱指定用戶的學生資料（管理員專用）
     * @param {string} userId - 要查詢的用戶 ID
     * @param {Function} callback - 回調函數
     * @returns {Function} 取消訂閱函數
     */
    subscribeByUserId: (userId, callback) => {
        if (!userId) {
            console.error('用戶 ID 未提供');
            callback([]);
            return () => { };
        }

        const studentsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.STUDENTS);

        return onSnapshot(studentsRef, (snapshot) => {
            let students = [];
            snapshot.forEach((doc) => {
                students.push({ id: doc.id, ...doc.data() });
            });
            students.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
            callback(students);
        }, (error) => {
            console.error('Firestore 訂閱錯誤:', error);
            callback([]);
        });
    },

    add: async (student) => {
        try {
            const studentRef = getUserDoc(COLLECTIONS.STUDENTS, student.id.toString());
            await setDoc(studentRef, {
                ...student,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('新增學生失敗:', error);
            throw error;
        }
    },

    addBatch: async (students) => {
        try {
            const batch = writeBatch(db);
            students.forEach((student) => {
                const studentRef = getUserDoc(COLLECTIONS.STUDENTS, student.id.toString());
                batch.set(studentRef, {
                    ...student,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            });
            await batch.commit();
        } catch (error) {
            console.error('批次新增學生失敗:', error);
            throw error;
        }
    },

    update: async (id, updates) => {
        try {
            const studentRef = getUserDoc(COLLECTIONS.STUDENTS, id.toString());
            await setDoc(studentRef, {
                ...updates,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error('更新學生失敗:', error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            const studentRef = getUserDoc(COLLECTIONS.STUDENTS, id.toString());
            await deleteDoc(studentRef);
        } catch (error) {
            console.error('刪除學生失敗:', error);
            throw error;
        }
    },

    deleteBatch: async (ids) => {
        try {
            const batch = writeBatch(db);
            ids.forEach((id) => {
                const studentRef = getUserDoc(COLLECTIONS.STUDENTS, id.toString());
                batch.delete(studentRef);
            });
            await batch.commit();
        } catch (error) {
            console.error('批次刪除學生失敗:', error);
            throw error;
        }
    },

    deleteAll: async () => {
        try {
            const studentsRef = getUserCollection(COLLECTIONS.STUDENTS);
            const snapshot = await getDocs(studentsRef);
            const batch = writeBatch(db);
            snapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        } catch (error) {
            console.error('清空學生失敗:', error);
            throw error;
        }
    },

    // ===== 管理員專用方法（跨使用者操作） =====

    /**
     * 管理員專用：更新指定用戶的學生資料
     * @param {string} userId - 目標用戶 ID
     * @param {string} studentId - 學生 ID
     * @param {Object} updates - 更新內容
     */
    updateByUserId: async (userId, studentId, updates) => {
        if (!userId) {
            throw new Error('用戶 ID 未提供');
        }
        try {
            const studentRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.STUDENTS, studentId.toString());
            await setDoc(studentRef, {
                ...updates,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error('管理員更新學生失敗:', error);
            throw error;
        }
    },

    /**
     * 管理員專用：刪除指定用戶的學生資料
     * @param {string} userId - 目標用戶 ID
     * @param {string} studentId - 學生 ID
     */
    deleteByUserId: async (userId, studentId) => {
        if (!userId) {
            throw new Error('用戶 ID 未提供');
        }
        try {
            const studentRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.STUDENTS, studentId.toString());
            await deleteDoc(studentRef);
        } catch (error) {
            console.error('管理員刪除學生失敗:', error);
            throw error;
        }
    },

    /**
     * 管理員專用：新增指定用戶的學生資料
     * @param {string} userId - 目標用戶 ID
     * @param {Object} student - 學生資料
     */
    addByUserId: async (userId, student) => {
        if (!userId) {
            throw new Error('用戶 ID 未提供');
        }
        try {
            const studentRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.STUDENTS, student.id.toString());
            await setDoc(studentRef, {
                ...student,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('管理員新增學生失敗:', error);
            throw error;
        }
    },

    /**
     * 管理員專用：批次新增指定用戶的學生資料
     * @param {string} userId - 目標用戶 ID
     * @param {Array} students - 學生資料陣列
     */
    addBatchByUserId: async (userId, students) => {
        if (!userId) {
            throw new Error('用戶 ID 未提供');
        }
        try {
            const batch = writeBatch(db);
            students.forEach((student) => {
                const studentRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.STUDENTS, student.id.toString());
                batch.set(studentRef, {
                    ...student,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            });
            await batch.commit();
        } catch (error) {
            console.error('管理員批次新增學生失敗:', error);
            throw error;
        }
    },

    /**
     * 管理員專用：清空指定用戶的所有學生資料
     * @param {string} userId - 目標用戶 ID
     */
    deleteAllByUserId: async (userId) => {
        if (!userId) {
            throw new Error('用戶 ID 未提供');
        }
        try {
            const studentsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.STUDENTS);
            const snapshot = await getDocs(studentsRef);
            const batch = writeBatch(db);
            snapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        } catch (error) {
            console.error('管理員清空學生失敗:', error);
            throw error;
        }
    }
};

/**
 * 設定服務（使用者隔離）
 */
export const settingsService = {
    subscribe: (callback) => {
        if (!currentUserId) {
            console.error('使用者 ID 未設定');
            callback({});
            return () => { };
        }

        const settingsRef = getUserDoc(COLLECTIONS.SETTINGS, 'user');
        return onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data());
            } else {
                callback({});
            }
        }, (error) => {
            console.error('設定訂閱錯誤:', error);
            callback({});
        });
    },

    save: async (settings) => {
        try {
            const settingsRef = getUserDoc(COLLECTIONS.SETTINGS, 'user');
            await setDoc(settingsRef, {
                ...settings,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error('儲存設定失敗:', error);
            throw error;
        }
    }
};

/**
 * 範本服務（使用者隔離）
 */
export const templateService = {
    subscribe: (callback) => {
        if (!currentUserId) {
            console.error('使用者 ID 未設定');
            callback([]);
            return () => { };
        }

        const templatesRef = getUserCollection(COLLECTIONS.TEMPLATES);
        return onSnapshot(templatesRef, (snapshot) => {
            const templates = [];
            snapshot.forEach((doc) => {
                templates.push({ id: doc.id, ...doc.data() });
            });
            templates.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
            callback(templates);
        }, (error) => {
            console.error('範本訂閱錯誤:', error);
            callback([]);
        });
    },

    add: async (template) => {
        try {
            const templateId = Date.now().toString();
            const templateRef = getUserDoc(COLLECTIONS.TEMPLATES, templateId);
            await setDoc(templateRef, {
                ...template,
                createdAt: serverTimestamp(),
                usageCount: 0
            });
            return templateId;
        } catch (error) {
            console.error('新增範本失敗:', error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            const templateRef = getUserDoc(COLLECTIONS.TEMPLATES, id.toString());
            await deleteDoc(templateRef);
        } catch (error) {
            console.error('刪除範本失敗:', error);
            throw error;
        }
    },

    incrementUsage: async (id) => {
        try {
            const templateRef = getUserDoc(COLLECTIONS.TEMPLATES, id.toString());
            const docSnap = await getDoc(templateRef);
            if (docSnap.exists()) {
                await setDoc(templateRef, {
                    usageCount: (docSnap.data().usageCount || 0) + 1,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }
        } catch (error) {
            console.error('更新使用次數失敗:', error);
        }
    }
};

/**
 * 班級服務
 */
export const classService = {
    subscribe: (callback) => {
        const classesRef = collection(db, COLLECTIONS.CLASSES);
        return onSnapshot(classesRef, (snapshot) => {
            const classes = [];
            snapshot.forEach((doc) => {
                classes.push({ id: doc.id, ...doc.data() });
            });
            classes.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
            callback(classes);
        }, (error) => {
            console.error('班級訂閱錯誤:', error);
        });
    },

    add: async (classData) => {
        try {
            const classId = Date.now().toString();
            const classRef = doc(db, COLLECTIONS.CLASSES, classId);
            await setDoc(classRef, {
                ...classData,
                schoolId: classData.schoolId || null, // 確保 schoolId 被儲存
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return classId;
        } catch (error) {
            console.error('新增班級失敗:', error);
            throw error;
        }
    },

    update: async (id, updates) => {
        try {
            const classRef = doc(db, COLLECTIONS.CLASSES, id.toString());
            await setDoc(classRef, {
                ...updates,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error('更新班級失敗:', error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            const classRef = doc(db, COLLECTIONS.CLASSES, id.toString());
            await deleteDoc(classRef);
        } catch (error) {
            console.error('刪除班級失敗:', error);
            throw error;
        }
    }
};

/**
 * 學校服務（全域共用）
 * 用於多校支援
 */
export const schoolService = {
    subscribe: (callback) => {
        const schoolsRef = collection(db, COLLECTIONS.SCHOOLS);
        return onSnapshot(schoolsRef, (snapshot) => {
            const schools = [];
            snapshot.forEach((doc) => {
                schools.push({ id: doc.id, ...doc.data() });
            });
            schools.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-TW'));
            callback(schools);
        }, (error) => {
            console.error('學校訂閱錯誤:', error);
            callback([]);
        });
    },

    add: async (schoolData) => {
        try {
            const schoolId = Date.now().toString();
            const schoolRef = doc(db, COLLECTIONS.SCHOOLS, schoolId);
            await setDoc(schoolRef, {
                ...schoolData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return schoolId;
        } catch (error) {
            console.error('新增學校失敗:', error);
            throw error;
        }
    },

    update: async (id, updates) => {
        try {
            const schoolRef = doc(db, COLLECTIONS.SCHOOLS, id.toString());
            await setDoc(schoolRef, {
                ...updates,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error('更新學校失敗:', error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            const schoolRef = doc(db, COLLECTIONS.SCHOOLS, id.toString());
            await deleteDoc(schoolRef);
        } catch (error) {
            console.error('刪除學校失敗:', error);
            throw error;
        }
    }
};

/**
 * 歷史記錄服務（使用者隔離）
 * 儲存在 users/{userId}/students/{studentId}/history 子集合
 */
export const historyService = {
    subscribe: (studentId, callback) => {
        if (!currentUserId) {
            console.error('使用者 ID 未設定');
            callback([]);
            return () => { };
        }

        const historyRef = collection(db, COLLECTIONS.USERS, currentUserId, COLLECTIONS.STUDENTS, studentId.toString(), 'history');
        return onSnapshot(historyRef, (snapshot) => {
            const history = [];
            snapshot.forEach((doc) => {
                history.push({ id: doc.id, ...doc.data() });
            });
            history.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
            callback(history);
        }, (error) => {
            console.error('歷史記錄訂閱錯誤:', error);
            callback([]);
        });
    },

    add: async (studentId, comment, styles = []) => {
        if (!currentUserId) {
            throw new Error('使用者 ID 未設定');
        }
        try {
            const historyRef = collection(db, COLLECTIONS.USERS, currentUserId, COLLECTIONS.STUDENTS, studentId.toString(), 'history');
            await addDoc(historyRef, {
                comment,
                styles,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error('新增歷史記錄失敗:', error);
            throw error;
        }
    },

    getAll: async (studentId) => {
        if (!currentUserId) {
            console.error('使用者 ID 未設定');
            return [];
        }
        try {
            const historyRef = collection(db, COLLECTIONS.USERS, currentUserId, COLLECTIONS.STUDENTS, studentId.toString(), 'history');
            const snapshot = await getDocs(historyRef);
            const history = [];
            snapshot.forEach((doc) => {
                history.push({ id: doc.id, ...doc.data() });
            });
            return history.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        } catch (error) {
            console.error('取得歷史記錄失敗:', error);
            return [];
        }
    },

    delete: async (studentId, historyId) => {
        if (!currentUserId) {
            throw new Error('使用者 ID 未設定');
        }
        try {
            const historyDocRef = doc(db, COLLECTIONS.USERS, currentUserId, COLLECTIONS.STUDENTS, studentId.toString(), 'history', historyId);
            await deleteDoc(historyDocRef);
        } catch (error) {
            console.error('刪除歷史記錄失敗:', error);
            throw error;
        }
    }
};

/**
 * 管理員共享 API Key 服務
 * 用於管理員將付費 API Key 授權給教師使用
 * 
 * 資料結構: adminConfig/shared
 * {
 *   sharedApiKey: "AIza...",
 *   authorizedUsers: ["uid1", "uid2", ...],
 *   updatedAt: Timestamp,
 *   updatedBy: "admin-uid"
 * }
 */
export const adminConfigService = {
    /**
     * 訂閱共享設定（管理員專用）
     * @param {Function} callback - 回調函數
     * @returns {Function} 取消訂閱函數
     */
    subscribe: (callback) => {
        const configRef = doc(db, COLLECTIONS.ADMIN_CONFIG, 'shared');
        return onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data());
            } else {
                callback(null);
            }
        }, (error) => {
            console.error('共享設定訂閱錯誤:', error);
            callback(null);
        });
    },

    /**
     * 取得共享設定
     * @returns {Promise<Object|null>}
     */
    getSharedConfig: async () => {
        try {
            const configRef = doc(db, COLLECTIONS.ADMIN_CONFIG, 'shared');
            const docSnap = await getDoc(configRef);
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error('取得共享設定失敗:', error);
            return null;
        }
    },

    /**
     * 儲存共享 API Key（管理員專用）
     * @param {string} apiKey - API Key
     * @param {string} adminUid - 管理員 UID
     */
    saveSharedApiKey: async (apiKey, adminUid) => {
        try {
            const configRef = doc(db, COLLECTIONS.ADMIN_CONFIG, 'shared');
            const docSnap = await getDoc(configRef);
            const existingData = docSnap.exists() ? docSnap.data() : {};

            await setDoc(configRef, {
                ...existingData,
                sharedApiKey: apiKey,
                updatedAt: serverTimestamp(),
                updatedBy: adminUid
            }, { merge: true });
        } catch (error) {
            console.error('儲存共享 API Key 失敗:', error);
            throw error;
        }
    },

    /**
     * 清除共享 API Key（管理員專用）
     * @param {string} adminUid - 管理員 UID
     */
    clearSharedApiKey: async (adminUid) => {
        try {
            const configRef = doc(db, COLLECTIONS.ADMIN_CONFIG, 'shared');
            const docSnap = await getDoc(configRef);
            const existingData = docSnap.exists() ? docSnap.data() : {};

            await setDoc(configRef, {
                ...existingData,
                sharedApiKey: '',
                updatedAt: serverTimestamp(),
                updatedBy: adminUid
            }, { merge: true });
        } catch (error) {
            console.error('清除共享 API Key 失敗:', error);
            throw error;
        }
    },

    /**
     * 授權用戶使用共享 API Key（管理員專用）
     * @param {string} userId - 要授權的用戶 UID
     * @param {string} adminUid - 管理員 UID
     */
    grantAccess: async (userId, adminUid) => {
        try {
            const configRef = doc(db, COLLECTIONS.ADMIN_CONFIG, 'shared');
            const docSnap = await getDoc(configRef);
            const existingData = docSnap.exists() ? docSnap.data() : {};
            const authorizedUsers = existingData.authorizedUsers || [];

            if (!authorizedUsers.includes(userId)) {
                authorizedUsers.push(userId);
            }

            await setDoc(configRef, {
                ...existingData,
                authorizedUsers,
                updatedAt: serverTimestamp(),
                updatedBy: adminUid
            }, { merge: true });
        } catch (error) {
            console.error('授權用戶失敗:', error);
            throw error;
        }
    },

    /**
     * 撤銷用戶的共享 API Key 授權（管理員專用）
     * @param {string} userId - 要撤銷的用戶 UID
     * @param {string} adminUid - 管理員 UID
     */
    revokeAccess: async (userId, adminUid) => {
        try {
            const configRef = doc(db, COLLECTIONS.ADMIN_CONFIG, 'shared');
            const docSnap = await getDoc(configRef);
            const existingData = docSnap.exists() ? docSnap.data() : {};
            const authorizedUsers = (existingData.authorizedUsers || []).filter(uid => uid !== userId);

            await setDoc(configRef, {
                ...existingData,
                authorizedUsers,
                updatedAt: serverTimestamp(),
                updatedBy: adminUid
            }, { merge: true });
        } catch (error) {
            console.error('撤銷授權失敗:', error);
            throw error;
        }
    },

    /**
     * 檢查用戶是否有共享 API Key 授權
     * @param {string} userId - 用戶 UID
     * @returns {Promise<boolean>}
     */
    checkAuthorization: async (userId) => {
        try {
            const configRef = doc(db, COLLECTIONS.ADMIN_CONFIG, 'shared');
            const docSnap = await getDoc(configRef);
            if (!docSnap.exists()) return false;

            const data = docSnap.data();
            return (data.authorizedUsers || []).includes(userId);
        } catch (error) {
            console.error('檢查授權失敗:', error);
            return false;
        }
    },

    /**
     * 取得共享 API Key（僅限已授權用戶）
     * @param {string} userId - 用戶 UID
     * @returns {Promise<string|null>}
     */
    getSharedApiKey: async (userId) => {
        try {
            const configRef = doc(db, COLLECTIONS.ADMIN_CONFIG, 'shared');
            const docSnap = await getDoc(configRef);
            if (!docSnap.exists()) return null;

            const data = docSnap.data();
            // 檢查是否已授權
            if (!(data.authorizedUsers || []).includes(userId)) {
                return null;
            }

            return data.sharedApiKey || null;
        } catch (error) {
            console.error('取得共享 API Key 失敗:', error);
            return null;
        }
    }
};

export default { studentService, settingsService, templateService, classService, schoolService, historyService, adminConfigService, setCurrentUserId, getCurrentUserId };
