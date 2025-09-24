const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateData() {
  let sqliteDb;
  try {
    // 连接到SQLite数据库
    sqliteDb = new sqlite3.Database(process.env.DB_PATH || './data/test.db', sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error('连接到SQLite数据库失败:', err.message);
        throw err;
      }
      console.log('连接到SQLite数据库成功');
    });

    // 连接到MySQL数据库
    const mysqlConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'task_management',
      port: process.env.DB_PORT || 3306
    });
    console.log('连接到MySQL数据库成功');

    // 迁移用户表
    await migrateTable(sqliteDb, mysqlConnection, 'users', 'id');
    // 迁移任务表
    await migrateTable(sqliteDb, mysqlConnection, 'tasks', 'id');
    // 迁移任务日志表
    await migrateTable(sqliteDb, mysqlConnection, 'task_logs', 'id');
    // 迁移任务评论表
    await migrateTable(sqliteDb, mysqlConnection, 'task_comments', 'id');
    // 迁移里程碑表
    await migrateTable(sqliteDb, mysqlConnection, 'milestones', 'id');
    // 迁移任务依赖表
    await migrateTable(sqliteDb, mysqlConnection, 'task_dependencies', 'id');
    // 迁移刷新令牌表
    await migrateTable(sqliteDb, mysqlConnection, 'refresh_tokens', 'id');


    await mysqlConnection.end();
    console.log('数据迁移完成，MySQL数据库连接已关闭');

  } catch (error) {
    console.error('数据迁移失败:', error.message);
    process.exit(1);
  } finally {
    if (sqliteDb) {
      sqliteDb.close((err) => {
        if (err) {
          console.error('关闭SQLite数据库连接失败:', err.message);
        } else {
          console.log('SQLite数据库连接已关闭');
        }
      });
    }
  }
}

async function migrateTable(sqliteDb, mysqlConnection, tableName, primaryKey) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(`SELECT * FROM ${tableName}`, [], async (err, rows) => {
      if (err) {
        return reject(new Error(`从SQLite读取表 ${tableName} 数据失败: ${err.message}`));
      }

      if (rows.length === 0) {
        console.log(`表 ${tableName} 中没有数据，跳过迁移`);
        return resolve();
      }

      try {
        // 禁用外键检查
        await mysqlConnection.query('SET FOREIGN_KEY_CHECKS = 0');

        // 清空MySQL中的表
        await mysqlConnection.query(`TRUNCATE TABLE ${tableName}`);

        const columns = Object.keys(rows[0]);
        const placeholders = columns.map(() => '?').join(',');
        const sql = `INSERT INTO ${tableName} (${columns.join(',')}) VALUES ?`;

        const values = rows.map(row => columns.map(col => {
          let value = row[col];
          // 处理日期格式转换
          if (value && typeof value === 'string') {
            // 检查是否是ISO日期格式
            if (value.includes('T') && (value.includes('Z') || value.includes('+'))) {
              try {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                  // 将ISO日期字符串转换为MySQL DATETIME格式
                  value = date.toISOString().slice(0, 19).replace('T', ' ');
                }
              } catch (e) {
                // 如果转换失败，保持原值
              }
            }
            // 检查是否是其他日期格式
            else if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // YYYY-MM-DD 格式，保持不变
            }
            else if (value.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
              // YYYY-MM-DD HH:MM:SS 格式，保持不变
            }
          }
          return value;
        }));

        await mysqlConnection.query(sql, [values]);

        // 启用外键检查
        await mysqlConnection.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log(`表 ${tableName} 数据迁移成功`);
        resolve();
      } catch (error) {
        reject(new Error(`向MySQL表 ${tableName} 插入数据失败: ${error.message}`));
      }
    });
  });
}

migrateData();