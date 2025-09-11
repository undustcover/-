require('dotenv').config();

// 根据环境变量选择数据库类型
const dbType = process.env.DB_TYPE || 'mysql';

let pool, promisePool, db;

if (dbType === 'sqlite') {
  // SQLite配置
  const { db: sqliteDb, initTables } = require('./sqlite');
  db = sqliteDb;
  
  // 初始化表结构（不阻塞启动）
  initTables().catch(err => {
    console.error('SQLite表初始化失败:', err);
  });
} else {
  // MySQL配置
  const mysql = require('mysql2');
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'task_management',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    charset: 'utf8mb4'
  });
  promisePool = pool.promise();
}

// 测试数据库连接
const testConnection = async () => {
  try {
    if (dbType === 'sqlite') {
      return new Promise((resolve) => {
        db.get('SELECT 1', (err) => {
          if (err) {
            console.error('SQLite连接测试失败:', err.message);
            resolve(false);
          } else {
            console.log('SQLite数据库连接测试成功');
            resolve(true);
          }
        });
      });
    } else {
      const connection = await promisePool.getConnection();
      console.log('MySQL数据库连接成功');
      connection.release();
      return true;
    }
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    return false;
  }
};

// 查询辅助函数
const query = async (sql, params = []) => {
  try {
    if (dbType === 'sqlite') {
      return new Promise((resolve, reject) => {
        const sqlLower = sql.trim().toLowerCase();
        if (sqlLower.startsWith('insert') || sqlLower.startsWith('update') || sqlLower.startsWith('delete')) {
          db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ insertId: this.lastID, affectedRows: this.changes });
          });
        } else {
          db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        }
      });
    } else {
      const [rows] = await promisePool.execute(sql, params);
      return rows;
    }
  } catch (error) {
    console.error('查询执行失败:', error.message);
    throw error;
  }
};

// 事务辅助函数
const transaction = async (callback) => {
  if (dbType === 'sqlite') {
    return new Promise(async (resolve, reject) => {
      db.serialize(async () => {
        db.run('BEGIN TRANSACTION');
        try {
          const result = await callback(db);
          db.run('COMMIT');
          resolve(result);
        } catch (error) {
          db.run('ROLLBACK');
          reject(error);
        }
      });
    });
  } else {
    const connection = await promisePool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

const end = () => {
  if (dbType === 'sqlite') {
    db.close((err) => {
      if (err) {
        console.error('关闭SQLite连接时出错:', err.message);
      }
    });
  } else if (pool) {
    pool.end();
  }
};

module.exports = {
  pool,
  promisePool,
  db,
  query,
  transaction,
  testConnection,
  end
};