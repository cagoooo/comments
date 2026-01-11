/**
 * Firebase 模組入口
 */
export { db, auth, googleProvider } from './config';
export {
    studentService,
    settingsService,
    templateService,
    classService,
    schoolService,
    historyService,
    setCurrentUserId,
    getCurrentUserId
} from './firestoreService';
export { authService, userService, USER_ROLES } from './authService';
