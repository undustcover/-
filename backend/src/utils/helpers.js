const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

/**
 * 生成随机字符串
 * @param {number} length - 字符串长度
 * @returns {string} 随机字符串
 */
function generateRandomString(length = 32) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

/**
 * 生成文件名（避免重复）
 * @param {string} originalName - 原始文件名
 * @returns {string} 新文件名
 */
function generateFileName(originalName) {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const timestamp = Date.now();
  const random = generateRandomString(8);
  return `${name}_${timestamp}_${random}${ext}`;
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证手机号格式（中国大陆）
 * @param {string} phone - 手机号
 * @returns {boolean} 是否有效
 */
function isValidPhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 生成分页信息
 * @param {number} page - 当前页码
 * @param {number} limit - 每页数量
 * @param {number} total - 总数量
 * @returns {object} 分页信息
 */
function generatePagination(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  
  return {
    current_page: page,
    per_page: limit,
    total_items: total,
    total_pages: totalPages,
    has_prev: page > 1,
    has_next: page < totalPages,
    prev_page: page > 1 ? page - 1 : null,
    next_page: page < totalPages ? page + 1 : null,
    offset
  };
}

/**
 * 格式化日期时间
 * @param {Date|string} date - 日期
 * @param {string} format - 格式 ('datetime', 'date', 'time')
 * @returns {string} 格式化后的日期时间
 */
function formatDateTime(date, format = 'datetime') {
  if (!date) return null;
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  switch (format) {
    case 'date':
      return `${year}-${month}-${day}`;
    case 'time':
      return `${hours}:${minutes}:${seconds}`;
    case 'datetime':
    default:
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
}

/**
 * 计算两个日期之间的天数差
 * @param {Date|string} startDate - 开始日期
 * @param {Date|string} endDate - 结束日期
 * @returns {number} 天数差
 */
function daysBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 检查日期是否过期
 * @param {Date|string} date - 要检查的日期
 * @returns {boolean} 是否过期
 */
function isExpired(date) {
  if (!date) return false;
  return new Date(date) < new Date();
}

/**
 * 深度克隆对象
 * @param {any} obj - 要克隆的对象
 * @returns {any} 克隆后的对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * 移除对象中的空值
 * @param {object} obj - 对象
 * @returns {object} 清理后的对象
 */
function removeEmptyValues(obj) {
  const cleaned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (value !== null && value !== undefined && value !== '') {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 延迟执行
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise} Promise对象
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试函数
 * @param {Function} fn - 要重试的函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delayMs - 重试间隔
 * @returns {Promise} Promise对象
 */
async function retry(fn, maxRetries = 3, delayMs = 1000) {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        await delay(delayMs);
      }
    }
  }
  
  throw lastError;
}

/**
 * 确保目录存在
 * @param {string} dirPath - 目录路径
 */
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

/**
 * 安全删除文件
 * @param {string} filePath - 文件路径
 * @returns {boolean} 是否删除成功
 */
async function safeDeleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('删除文件失败:', error);
    }
    return false;
  }
}

/**
 * 获取文件信息
 * @param {string} filePath - 文件路径
 * @returns {object|null} 文件信息
 */
async function getFileInfo(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created_at: stats.birthtime,
      modified_at: stats.mtime,
      is_directory: stats.isDirectory(),
      is_file: stats.isFile()
    };
  } catch (error) {
    return null;
  }
}

/**
 * 转义HTML特殊字符
 * @param {string} text - 文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * 截断文本
 * @param {string} text - 文本
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀
 * @returns {string} 截断后的文本
 */
function truncateText(text, maxLength = 100, suffix = '...') {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 生成颜色（基于字符串）
 * @param {string} str - 字符串
 * @returns {string} 十六进制颜色值
 */
function generateColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - color.length) + color;
}

module.exports = {
  generateRandomString,
  generateFileName,
  formatFileSize,
  isValidEmail,
  isValidPhone,
  generatePagination,
  formatDateTime,
  daysBetween,
  isExpired,
  deepClone,
  removeEmptyValues,
  generateUniqueId,
  delay,
  retry,
  ensureDir,
  safeDeleteFile,
  getFileInfo,
  escapeHtml,
  truncateText,
  generateColor
};