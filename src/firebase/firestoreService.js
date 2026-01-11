/**
 * Firestore 資料服務
 * 學生資料、設定、範本、班級與歷史記錄的 CRUD 操作
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

// 集合名稱
const COLLECTIONS = {
    STUDENTS: 'students',
    SETTINGS: 'settings',
    TEMPLATES: 'templates',
    CLASSES: 'classes'
};

/**
 * 學生資料服務
 */
export const studentService = {
    subscribe: (callback, classId = null) => {
        let studentsRef = collection(db, COLLECTIONS.STUDENTS);

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
        });
    },

    add: async (student) => {
        try {
            const studentRef = doc(db, COLLECTIONS.STUDENTS, student.id.toString());
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
                const studentRef = doc(db, COLLECTIONS.STUDENTS, student.id.toString());
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
            const studentRef = doc(db, COLLECTIONS.STUDENTS, id.toString());
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
            const studentRef = doc(db, COLLECTIONS.STUDENTS, id.toString());
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
                const studentRef = doc(db, COLLECTIONS.STUDENTS, id.toString());
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
            const studentsRef = collection(db, COLLECTIONS.STUDENTS);
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
    }
};

/**
 * 設定服務
 */
export const settingsService = {
    subscribe: (callback) => {
        const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'global');
        return onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data());
            }
        }, (error) => {
            console.error('設定訂閱錯誤:', error);
        });
    },

    save: async (settings) => {
        try {
            const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'global');
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
 * 範本服務
 */
export const templateService = {
    subscribe: (callback) => {
        const templatesRef = collection(db, COLLECTIONS.TEMPLATES);
        return onSnapshot(templatesRef, (snapshot) => {
            const templates = [];
            snapshot.forEach((doc) => {
                templates.push({ id: doc.id, ...doc.data() });
            });
            templates.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
            callback(templates);
        }, (error) => {
            console.error('範本訂閱錯誤:', error);
        });
    },

    add: async (template) => {
        try {
            const templateId = Date.now().toString();
            const templateRef = doc(db, COLLECTIONS.TEMPLATES, templateId);
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
            const templateRef = doc(db, COLLECTIONS.TEMPLATES, id.toString());
            await deleteDoc(templateRef);
        } catch (error) {
            console.error('刪除範本失敗:', error);
            throw error;
        }
    },

    incrementUsage: async (id) => {
        try {
            const templateRef = doc(db, COLLECTIONS.TEMPLATES, id.toString());
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
 * 歷史記錄服務
 * 儲存在 students/{studentId}/history 子集合
 */
export const historyService = {
    subscribe: (studentId, callback) => {
        const historyRef = collection(db, COLLECTIONS.STUDENTS, studentId.toString(), 'history');
        return onSnapshot(historyRef, (snapshot) => {
            const history = [];
            snapshot.forEach((doc) => {
                history.push({ id: doc.id, ...doc.data() });
            });
            history.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
            callback(history);
        }, (error) => {
            console.error('歷史記錄訂閱錯誤:', error);
        });
    },

    add: async (studentId, comment, styles = []) => {
        try {
            const historyRef = collection(db, COLLECTIONS.STUDENTS, studentId.toString(), 'history');
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
        try {
            const historyRef = collection(db, COLLECTIONS.STUDENTS, studentId.toString(), 'history');
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
        try {
            const historyDocRef = doc(db, COLLECTIONS.STUDENTS, studentId.toString(), 'history', historyId);
            await deleteDoc(historyDocRef);
        } catch (error) {
            console.error('刪除歷史記錄失敗:', error);
            throw error;
        }
    }
};

export default { studentService, settingsService, templateService, classService, historyService };
