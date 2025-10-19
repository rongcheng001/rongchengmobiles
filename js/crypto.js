// js/crypto.js
const crypto = window.crypto || window.msCrypto;

/**
 * 加密数据（AES-256-CBC，与电脑端一致）
 * @param {any} data - 待加密数据
 * @param {string} key - 64位十六进制加密密钥
 * @returns {Promise<string|null>} 加密后的数据（iv:encrypted）
 */
export async function encryptData(data, key) {
    try {
        // 密钥转换：64位十六进制字符串 → 32字节Uint8Array
        const keyBuffer = hexToUint8Array(key);
        if (keyBuffer.length !== 32) {
            throw new Error('加密密钥必须是64位十六进制字符串(32字节)');
        }

        // 生成16字节随机IV
        const iv = crypto.getRandomValues(new Uint8Array(16));
        // 数据编码：JSON字符串 → Uint8Array
        const dataBuffer = new TextEncoder().encode(JSON.stringify(data));

        // 导入密钥
        const cryptoKey = await window.crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: 'AES-CBC' },
            false,
            ['encrypt']
        );

        // 执行加密
        const encryptedBuffer = await window.crypto.subtle.encrypt(
            { name: 'AES-CBC', iv: iv },
            cryptoKey,
            dataBuffer
        );

        // 格式化结果：iv(十六进制) + 加密数据(十六进制)
        return `${uint8ArrayToHex(iv)}:${uint8ArrayToHex(new Uint8Array(encryptedBuffer))}`;
    } catch (error) {
        console.error('加密失败:', error);
        return null;
    }
}

/**
 * 解密数据（与电脑端一致）
 * @param {string} encryptedData - 加密数据（iv:encrypted）
 * @param {string} key - 64位十六进制加密密钥
 * @returns {Promise<any|null>} 解密后的数据
 */
export async function decryptData(encryptedData, key) {
    try {
        const keyBuffer = hexToUint8Array(key);
        if (keyBuffer.length !== 32) {
            throw new Error('加密密钥必须是64位十六进制字符串(32字节)');
        }

        // 拆分IV和加密数据
        const parts = encryptedData.split(':');
        if (parts.length !== 2) {
            throw new Error('无效的加密数据格式');
        }
        const iv = hexToUint8Array(parts[0]);
        const encryptedBuffer = hexToUint8Array(parts[1]);

        // 导入密钥
        const cryptoKey = await window.crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: 'AES-CBC' },
            false,
            ['decrypt']
        );

        // 执行解密
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: 'AES-CBC', iv: iv },
            cryptoKey,
            encryptedBuffer
        );

        // 解码结果：Uint8Array → JSON → 原始数据
        return JSON.parse(new TextDecoder().decode(decryptedBuffer));
    } catch (error) {
        console.error('解密失败:', error);
        return null;
    }
}

/**
 * UUID生成（与电脑端一致）
 * @returns {string} UUID
 */
export function generateUUID() {
    if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // 降级方案
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * UUID验证（与电脑端一致）
 * @param {string} uuid - 待验证UUID
 * @returns {boolean} 验证结果
 */
export function isValidUUID(uuid) {
    if (!uuid || typeof uuid !== 'string') return false;
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
}

// ------------------------------
// 辅助工具函数
// ------------------------------
/**
 * Uint8Array转十六进制字符串
 * @param {Uint8Array} arr - 待转换数组
 * @returns {string} 十六进制字符串
 */
function uint8ArrayToHex(arr) {
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 十六进制字符串转Uint8Array
 * @param {string} hex - 十六进制字符串
 * @returns {Uint8Array} 转换后的数组
 */
function hexToUint8Array(hex) {
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        arr[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return arr;
}