// js/utils.js
/**
 * 日期格式化（友好显示）
 * @param {string|Date} date - 日期
 * @returns {string} 格式化结果（如：刚刚、5分钟前、昨天 14:30）
 */
export function formatRelativeTime(date) {
    if (!date) return '';
    const target = new Date(date);
    const now = new Date();
    const diff = now - target;

    // 计算时间差（毫秒）
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    // 友好显示
    if (seconds < 60) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days === 1) return `昨天 ${target.getHours().toString().padStart(2, '0')}:${target.getMinutes().toString().padStart(2, '0')}`;
    if (days < 7) return `${days}天前`;

    // 超过7天：显示完整日期
    return `${target.getFullYear()}-${(target.getMonth() + 1).toString().padStart(2, '0')}-${target.getDate().toString().padStart(2, '0')}`;
}

/**
 * 显示提示框
 * @param {string} message - 提示内容
 * @param {string} type - 类型（success/error/info）
 * @param {number} duration - 显示时长（毫秒，默认2000）
 */
export function showToast(message, type = 'info', duration = 2000) {
    // 创建提示框元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // 添加到页面
    document.body.appendChild(toast);

    // 显示动画
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // 自动关闭
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, duration);
}

/**
 * 防抖函数
 * @param {Function} func - 目标函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}