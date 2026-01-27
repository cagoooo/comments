/**
 * 使用者角色定義
 */
export const USER_ROLES = {
    ADMIN: 'admin',              // 管理員：可審核、指派班級
    TEACHER: 'teacher',          // 教師：已審核通過，可使用指定班級
    PENDING: 'pending',          // 待審核（兼容舊版）
    PENDING_INFO: 'pending_info',     // 待填寫資料：剛註冊，需填寫學校班級
    PENDING_REVIEW: 'pending_review'  // 待審核：已填資料，等待管理員審核
};
