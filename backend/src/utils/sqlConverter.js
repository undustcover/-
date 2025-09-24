// SQL语法转换工具 - 将SQLite/MySQL语法转换为PostgreSQL兼容语法

/**
 * 转换datetime函数为PostgreSQL兼容语法
 * @param {string} sql - 原始SQL语句
 * @returns {string} - 转换后的SQL语句
 */
function convertDateTimeFunctions(sql) {
  // SQLite的datetime('now') -> PostgreSQL的NOW()
  sql = sql.replace(/datetime\('now'\)/g, 'NOW()');
  
  // SQLite的datetime('now', 'localtime') -> PostgreSQL的NOW()
  sql = sql.replace(/datetime\('now',\s*'localtime'\)/g, 'NOW()');
  
  // SQLite的datetime('now', '+7 days') -> PostgreSQL的NOW() + INTERVAL '7 days'
  sql = sql.replace(/datetime\('now',\s*'\+(\d+)\s+days'\)/g, "NOW() + INTERVAL '$1 days'");
  
  return sql;
}

/**
 * 转换LIMIT OFFSET语法
 * @param {string} sql - 原始SQL语句
 * @returns {string} - 转换后的SQL语句
 */
function convertLimitOffset(sql) {
  // MySQL/SQLite的LIMIT ? OFFSET ? -> PostgreSQL的LIMIT ? OFFSET ?
  // PostgreSQL本身就支持这种语法，所以不需要转换
  return sql;
}

/**
 * 转换AUTO_INCREMENT为SERIAL
 * @param {string} sql - 原始SQL语句
 * @returns {string} - 转换后的SQL语句
 */
function convertAutoIncrement(sql) {
  // MySQL的AUTO_INCREMENT -> PostgreSQL的SERIAL
  sql = sql.replace(/INT\s+PRIMARY\s+KEY\s+AUTO_INCREMENT/gi, 'SERIAL PRIMARY KEY');
  sql = sql.replace(/INTEGER\s+PRIMARY\s+KEY\s+AUTO_INCREMENT/gi, 'SERIAL PRIMARY KEY');
  
  return sql;
}

/**
 * 转换数据类型
 * @param {string} sql - 原始SQL语句
 * @returns {string} - 转换后的SQL语句
 */
function convertDataTypes(sql) {
  // MySQL的DATETIME -> PostgreSQL的TIMESTAMP
  sql = sql.replace(/DATETIME/gi, 'TIMESTAMP');
  
  // MySQL的TINYINT -> PostgreSQL的SMALLINT
  sql = sql.replace(/TINYINT/gi, 'SMALLINT');
  
  // MySQL的MEDIUMTEXT -> PostgreSQL的TEXT
  sql = sql.replace(/MEDIUMTEXT/gi, 'TEXT');
  
  // MySQL的LONGTEXT -> PostgreSQL的TEXT
  sql = sql.replace(/LONGTEXT/gi, 'TEXT');
  
  return sql;
}

/**
 * 主转换函数
 * @param {string} sql - 原始SQL语句
 * @returns {string} - 转换后的SQL语句
 */
function convertSqlToPostgreSQL(sql) {
  if (!sql || typeof sql !== 'string') {
    return sql;
  }
  
  let convertedSql = sql;
  
  // 应用所有转换
  convertedSql = convertDateTimeFunctions(convertedSql);
  convertedSql = convertLimitOffset(convertedSql);
  convertedSql = convertAutoIncrement(convertedSql);
  convertedSql = convertDataTypes(convertedSql);
  
  return convertedSql;
}

/**
 * 转换查询参数占位符
 * PostgreSQL使用$1, $2, $3... 而不是?
 * @param {string} sql - 原始SQL语句
 * @returns {string} - 转换后的SQL语句
 */
function convertParameterPlaceholders(sql) {
  if (!sql || typeof sql !== 'string') {
    return sql;
  }
  
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

module.exports = {
  convertSqlToPostgreSQL,
  convertParameterPlaceholders,
  convertDateTimeFunctions,
  convertLimitOffset,
  convertAutoIncrement,
  convertDataTypes
};