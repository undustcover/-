const fs = require('fs');
const path = require('path');
const { formatDateTime } = require('./helpers');

// 日志级别
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// 日志级别名称
const LEVEL_NAMES = {
  0: 'ERROR',
  1: 'WARN',
  2: 'INFO',
  3: 'DEBUG'
};

// 日志颜色（控制台输出）
const COLORS = {
  ERROR: '\x1b[31m', // 红色
  WARN: '\x1b[33m',  // 黄色
  INFO: '\x1b[36m',  // 青色
  DEBUG: '\x1b[37m', // 白色
  RESET: '\x1b[0m'   // 重置
};

class Logger {
  constructor(options = {}) {
    this.level = LOG_LEVELS[options.level] || LOG_LEVELS.INFO;
    this.logDir = options.logDir || path.join(process.cwd(), 'logs');
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    
    // 确保日志目录存在
    this.ensureLogDir();
  }
  
  /**
   * 确保日志目录存在
   */
  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }
  
  /**
   * 格式化日志消息
   * @param {string} level - 日志级别
   * @param {string} message - 消息
   * @param {object} meta - 元数据
   * @returns {string} 格式化后的消息
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = formatDateTime(new Date());
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }
  
  /**
   * 获取日志文件路径
   * @param {string} level - 日志级别
   * @returns {string} 文件路径
   */
  getLogFilePath(level) {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${level.toLowerCase()}-${date}.log`);
  }
  
  /**
   * 检查并轮转日志文件
   * @param {string} filePath - 文件路径
   */
  rotateLogFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) return;
      
      const stats = fs.statSync(filePath);
      if (stats.size < this.maxFileSize) return;
      
      // 轮转文件
      const ext = path.extname(filePath);
      const baseName = path.basename(filePath, ext);
      const dir = path.dirname(filePath);
      
      // 移动现有的轮转文件
      for (let i = this.maxFiles - 1; i > 0; i--) {
        const oldFile = path.join(dir, `${baseName}.${i}${ext}`);
        const newFile = path.join(dir, `${baseName}.${i + 1}${ext}`);
        
        if (fs.existsSync(oldFile)) {
          if (i === this.maxFiles - 1) {
            fs.unlinkSync(oldFile); // 删除最老的文件
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }
      
      // 轮转当前文件
      const rotatedFile = path.join(dir, `${baseName}.1${ext}`);
      fs.renameSync(filePath, rotatedFile);
    } catch (error) {
      console.error('日志文件轮转失败:', error);
    }
  }
  
  /**
   * 写入日志文件
   * @param {string} level - 日志级别
   * @param {string} message - 消息
   */
  writeToFile(level, message) {
    if (!this.enableFile) return;
    
    try {
      const filePath = this.getLogFilePath(level);
      this.rotateLogFile(filePath);
      
      fs.appendFileSync(filePath, message + '\n', 'utf8');
    } catch (error) {
      console.error('写入日志文件失败:', error);
    }
  }
  
  /**
   * 输出到控制台
   * @param {string} level - 日志级别
   * @param {string} message - 消息
   */
  writeToConsole(level, message) {
    if (!this.enableConsole) return;
    
    const color = COLORS[level] || COLORS.RESET;
    console.log(`${color}${message}${COLORS.RESET}`);
  }
  
  /**
   * 记录日志
   * @param {number} level - 日志级别
   * @param {string} message - 消息
   * @param {object} meta - 元数据
   */
  log(level, message, meta = {}) {
    if (level > this.level) return;
    
    const levelName = LEVEL_NAMES[level];
    const formattedMessage = this.formatMessage(levelName, message, meta);
    
    this.writeToConsole(levelName, formattedMessage);
    this.writeToFile(levelName, formattedMessage);
  }
  
  /**
   * 错误日志
   * @param {string} message - 消息
   * @param {object} meta - 元数据
   */
  error(message, meta = {}) {
    this.log(LOG_LEVELS.ERROR, message, meta);
  }
  
  /**
   * 警告日志
   * @param {string} message - 消息
   * @param {object} meta - 元数据
   */
  warn(message, meta = {}) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }
  
  /**
   * 信息日志
   * @param {string} message - 消息
   * @param {object} meta - 元数据
   */
  info(message, meta = {}) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }
  
  /**
   * 调试日志
   * @param {string} message - 消息
   * @param {object} meta - 元数据
   */
  debug(message, meta = {}) {
    this.log(LOG_LEVELS.DEBUG, message, meta);
  }
  
  /**
   * HTTP请求日志
   * @param {object} req - 请求对象
   * @param {object} res - 响应对象
   * @param {number} duration - 请求耗时
   */
  http(req, res, duration) {
    const { method, url, ip } = req;
    const { statusCode } = res;
    const userAgent = req.get('User-Agent') || '';
    const userId = req.user ? req.user.id : 'anonymous';
    
    const meta = {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      ip,
      userId,
      userAgent
    };
    
    const level = statusCode >= 400 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
    this.log(level, `${method} ${url} ${statusCode}`, meta);
  }
  
  /**
   * 数据库操作日志
   * @param {string} operation - 操作类型
   * @param {string} table - 表名
   * @param {object} meta - 元数据
   */
  database(operation, table, meta = {}) {
    this.info(`Database ${operation} on ${table}`, meta);
  }
  
  /**
   * 安全相关日志
   * @param {string} event - 事件类型
   * @param {object} meta - 元数据
   */
  security(event, meta = {}) {
    this.warn(`Security event: ${event}`, meta);
  }
  
  /**
   * 性能日志
   * @param {string} operation - 操作名称
   * @param {number} duration - 耗时
   * @param {object} meta - 元数据
   */
  performance(operation, duration, meta = {}) {
    const level = duration > 1000 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
    this.log(level, `Performance: ${operation} took ${duration}ms`, meta);
  }
  
  /**
   * 清理旧日志文件
   * @param {number} days - 保留天数
   */
  cleanOldLogs(days = 30) {
    try {
      const files = fs.readdirSync(this.logDir);
      const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
      
      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          fs.unlinkSync(filePath);
          this.info(`Cleaned old log file: ${file}`);
        }
      });
    } catch (error) {
      this.error('清理旧日志文件失败', { error: error.message });
    }
  }
}

// 创建默认logger实例
const defaultLogger = new Logger({
  level: process.env.LOG_LEVEL || 'INFO',
  logDir: process.env.LOG_DIR || path.join(process.cwd(), 'logs'),
  enableConsole: process.env.NODE_ENV !== 'production',
  enableFile: true
});

// 导出logger实例和类
module.exports = {
  Logger,
  logger: defaultLogger,
  LOG_LEVELS
};