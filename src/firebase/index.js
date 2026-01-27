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
    adminConfigService,
    setCurrentUserId,
    getCurrentUserId
} from './firestoreService';
export { authService, userService } from './authService';
export { USER_ROLES } from './roles';
