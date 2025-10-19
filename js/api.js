// js/api.js
import { encryptData, decryptData } from './crypto.js';
import { auth } from './auth.js';

// ------------------------------
// 接口配置（与电脑端一致的环境变量）
// ------------------------------
const API_CONFIG = {
    baseUrl: 'https://pwsmicdepzjqsodpedlw.supabase.co', // Supabase REST接口
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3c21pY2RlcHpqcXNvZHBlZGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMTY3MDIsImV4cCI6MjA3MzU5MjcwMn0.GCvgIDRunf6U9SFK8affQr13y9nWmxr3IKbzCb-HPbA',
    encryptionKey: '54b4706bd3ed19acb74318dfd1652a5b7216d63410abfc98d8464820d358fb4e' // 与电脑端完全一致
};

// ------------------------------
// 通用请求工具
// ------------------------------
async function request(url, options = {}) {
    // 基础配置
    const headers = {
        'Content-Type': 'application/json',
        'apikey': API_CONFIG.anonKey,
        'Authorization': `Bearer ${API_CONFIG.anonKey}`,
        ...options.headers
    };

    // 添加认证Token（如有）
    const token = auth.getToken();
    if (token) {
        headers['X-Custom-Token'] = token;
    }

    try {
        const response = await fetch(url, { ...options, headers });
        const data = await response.json();

        // 处理错误
        if (!response.ok) {
            throw new Error(data.message || `请求失败 (${response.status})`);
        }

        return data;
    } catch (error) {
        console.error('接口请求错误:', error);
        throw error;
    }
}

// ------------------------------
// 认证相关接口
// ------------------------------
/**
 * 管理员登录（与电脑端账号互通）
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @returns {Promise<{success: boolean, data?: object, message?: string}>} 登录结果
 */
export async function login(email, password) {
    try {
        // 加密登录数据（与电脑端一致）
        const encryptedLoginData = await encryptData(
            { email, password },
            API_CONFIG.encryptionKey
        );

        if (!encryptedLoginData) {
            return { success: false, message: '数据加密失败' };
        }

        // 调用登录接口（对应电脑端ipcMain.handle('login')逻辑）
        const data = await request(`${API_CONFIG.baseUrl}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({
                encrypted_data: encryptedLoginData
            })
        });

        if (data.success && data.data.token && data.data.user) {
            // 存储认证信息
            auth.setToken(data.data.token);
            auth.setCurrentUser(data.data.user);
            return { success: true, data: data.data };
        }

        return { success: false, message: data.message || '登录失败' };
    } catch (error) {
        return { success: false, message: error.message || '登录异常' };
    }
}

/**
 * 退出登录
 * @returns {Promise<{success: boolean}>} 退出结果
 */
export async function logout() {
    try {
        // 调用退出接口（清理服务端会话）
        await request(`${API_CONFIG.baseUrl}/auth/logout`, {
            method: 'POST'
        });
    } finally {
        // 清理本地认证信息
        auth.clearAuth();
        return { success: true };
    }
}

// ------------------------------
// 用户管理接口（超级管理员专用）
// ------------------------------
/**
 * 获取用户列表（支持筛选）
 * @param {object} filters - 筛选条件 { role?: string, search?: string }
 * @returns {Promise<{success: boolean, data?: array, message?: string}>} 用户列表
 */
export async function getUsers(filters = {}) {
    try {
        if (!auth.isSuperAdmin()) {
            return { success: false, message: '仅超级管理员可访问' };
        }

        // 加密筛选条件
        const encryptedFilters = await encryptData(
            filters,
            API_CONFIG.encryptionKey
        );

        const data = await request(`${API_CONFIG.baseUrl}/users?filters=${encodeURIComponent(encryptedFilters)}`, {
            method: 'GET'
        });

        if (data.success && data.data) {
            // 解密用户数据
            const decryptedData = await decryptData(
                data.data,
                API_CONFIG.encryptionKey
            );
            return { success: true, data: decryptedData };
        }

        return { success: false, message: data.message || '获取用户失败' };
    } catch (error) {
        return { success: false, message: error.message || '获取用户异常' };
    }
}

/**
 * 创建新用户（与电脑端逻辑一致）
 * @param {object} userData - 用户数据 { name, email, password, role, store_limit }
 * @returns {Promise<{success: boolean, message?: string}>} 创建结果
 */
export async function createUser(userData) {
    try {
        if (!auth.isSuperAdmin()) {
            return { success: false, message: '仅超级管理员可创建用户' };
        }

        // 数据验证（与电脑端validateUser一致）
        const validationError = validateUser(userData);
        if (validationError) {
            return { success: false, message: validationError };
        }

        // 加密用户数据
        const encryptedUserData = await encryptData(
            userData,
            API_CONFIG.encryptionKey
        );

        if (!encryptedUserData) {
            return { success: false, message: '用户数据加密失败' };
        }

        const data = await request(`${API_CONFIG.baseUrl}/users`, {
            method: 'POST',
            body: JSON.stringify({
                encrypted_data: encryptedUserData
            })
        });

        return {
            success: data.success,
            message: data.success ? '用户创建成功' : (data.message || '创建用户失败')
        };
    } catch (error) {
        return { success: false, message: error.message || '创建用户异常' };
    }
}

// ------------------------------
// 应用使用情况接口
// ------------------------------
/**
 * 获取应用使用统计（门店、用户活跃度等）
 * @returns {Promise<{success: boolean, data?: object, message?: string}>} 使用数据
 */
export async function getAppUsageStats() {
    try {
        if (!auth.isLoggedIn()) {
            return { success: false, message: '请先登录' };
        }

        const data = await request(`${API_CONFIG.baseUrl}/usage/stats`, {
            method: 'GET'
        });

        if (data.success && data.data) {
            // 解密统计数据
            const decryptedData = await decryptData(
                data.data,
                API_CONFIG.encryptionKey
            );
            return { success: true, data: decryptedData };
        }

        return { success: false, message: data.message || '获取使用数据失败' };
    } catch (error) {
        return { success: false, message: error.message || '获取使用数据异常' };
    }
}

// ------------------------------
// 最近动态接口
// ------------------------------
/**
 * 获取系统最近动态（门店创建、用户操作等）
 * @param {number} limit - 条数限制（默认20）
 * @returns {Promise<{success: boolean, data?: array, message?: string}>} 动态列表
 */
export async function getRecentActivities(limit = 20) {
    try {
        if (!auth.isLoggedIn()) {
            return { success: false, message: '请先登录' };
        }

        const encryptedParams = await encryptData(
            { limit },
            API_CONFIG.encryptionKey
        );

        const data = await request(`${API_CONFIG.baseUrl}/activities?params=${encodeURIComponent(encryptedParams)}`, {
            method: 'GET'
        });

        if (data.success && data.data) {
            const decryptedData = await decryptData(
                data.data,
                API_CONFIG.encryptionKey
            );
            return { success: true, data: decryptedData };
        }

        return { success: false, message: data.message || '获取最近动态失败' };
    } catch (error) {
        return { success: false, message: error.message || '获取最近动态异常' };
    }
}

// ------------------------------
// 辅助函数：用户数据验证（与电脑端一致）
// ------------------------------
function validateUser(userData, isUpdate = false) {
    // 角色白名单
    const validRoles = ['super_admin', 'admin', 'employee'];
    // 门店数量限制范围
    const storeLimitRange = [1, 1000];

    // 验证姓名
    if (!userData.name || userData.name.length < 2 || userData.name.length > 20) {
        return '姓名需2-20个字符';
    }

    // 验证邮箱
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userData.email || !emailRegex.test(userData.email)) {
        return '请输入有效的邮箱';
    }

    // 验证密码（创建时必填，更新时可选）
    if (!isUpdate && (!userData.password || userData.password.length < 6)) {
        return '密码需至少6个字符';
    }
    if (isUpdate && userData.password && userData.password.length > 0 && userData.password.length < 6) {
        return '密码需至少6个字符';
    }

    // 验证角色
    if (!userData.role || !validRoles.includes(userData.role)) {
        return `角色需为${validRoles.join('、')}之一`;
    }

    // 验证门店限制
    if (userData.store_limit === undefined || userData.store_limit < storeLimitRange[0] || userData.store_limit > storeLimitRange[1]) {
        return `门店限制需为${storeLimitRange[0]}-${storeLimitRange[1]}之间的数字`;
    }

    return null; // 验证通过

}
