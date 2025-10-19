// js/auth.js
/**
 * 认证工具：管理Token存储与登录状态
 */
export const auth = {
    /**
     * 获取存储的认证Token
     * @returns {string|null} Token
     */
    getToken() {
        return localStorage.getItem('admin_token');
    },

    /**
     * 存储认证Token
     * @param {string} token - 认证Token
     */
    setToken(token) {
        localStorage.setItem('admin_token', token);
    },

    /**
     * 清除认证信息（退出登录）
     */
    clearAuth() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('current_user');
    },

    /**
     * 存储当前登录用户信息
     * @param {object} user - 用户信息
     */
    setCurrentUser(user) {
        localStorage.setItem('current_user', JSON.stringify(user));
    },

    /**
     * 获取当前登录用户信息
     * @returns {object|null} 用户信息
     */
    getCurrentUser() {
        const userStr = localStorage.getItem('current_user');
        return userStr ? JSON.parse(userStr) : null;
    },

    /**
     * 检查是否已登录
     * @returns {boolean} 登录状态
     */
    isLoggedIn() {
        return !!this.getToken() && !!this.getCurrentUser();
    },

    /**
     * 检查是否为超级管理员
     * @returns {boolean} 超级管理员状态
     */
    isSuperAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'super_admin';
    }
};