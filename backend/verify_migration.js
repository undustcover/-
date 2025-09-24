const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// PostgreSQL连接配置
const pgPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  database: process.env.DB_NAME || 'task_management',
  port: process.env.DB_PORT || 5432,
});

// SQLite数据库路径
const sqliteDbPath = path.join(__dirname, 'data', 'test.db');

// 验证数据迁移结果
async function verifyMigration() {
  const client = await pgPool.connect();
  const db = new sqlite3.Database(sqliteDbPath);
  
  try {
    console.log('=== 数据迁移验证报告 ===\n');
    
    // 要验证的表列表（只包含实际存在的表）
    const tablesToVerify = ['users', 'tasks', 'task_logs', 'milestones'];
    
    let totalSqliteRecords = 0;
    let totalPostgreSQLRecords = 0;
    
    for (const tableName of tablesToVerify) {
      console.log(`验证表: ${tableName}`);
      
      // 获取SQLite记录数
      const sqliteCount = await new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM ${tableName}`, [], (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      });
      
      // 获取PostgreSQL记录数
      const pgResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const pgCount = parseInt(pgResult.rows[0].count);
      
      totalSqliteRecords += sqliteCount;
      totalPostgreSQLRecords += pgCount;
      
      const status = sqliteCount === pgCount ? '✅ 完全匹配' : '❌ 数量不匹配';
      console.log(`  SQLite: ${sqliteCount} 条记录`);
      console.log(`  PostgreSQL: ${pgCount} 条记录`);
      console.log(`  状态: ${status}\n`);
    }
    
    // 特殊验证：task_files -> files
    console.log('验证表: task_files -> files (特殊迁移)');
    const sqliteFilesCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM task_files', [], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    const pgFilesResult = await client.query('SELECT COUNT(*) as count FROM files');
    const pgFilesCount = parseInt(pgFilesResult.rows[0].count);
    
    const filesStatus = sqliteFilesCount > 0 && pgFilesCount > 0 ? '✅ 已迁移' : '❌ 迁移失败';
    console.log(`  SQLite task_files: ${sqliteFilesCount} 条记录`);
    console.log(`  PostgreSQL files: ${pgFilesCount} 条记录`);
    console.log(`  状态: ${filesStatus}\n`);
    
    // 总结
    console.log('=== 迁移总结 ===');
    console.log(`SQLite总记录数: ${totalSqliteRecords + sqliteFilesCount}`);
    console.log(`PostgreSQL总记录数: ${totalPostgreSQLRecords + pgFilesCount}`);
    
    // 检查一些关键数据的完整性
    console.log('\n=== 数据完整性检查 ===');
    
    // 检查用户数据
    const userCheck = await client.query('SELECT id, username, email FROM users ORDER BY id LIMIT 3');
    console.log('前3个用户:');
    userCheck.rows.forEach(user => {
      console.log(`  ID: ${user.id}, 用户名: ${user.username}, 邮箱: ${user.email}`);
    });
    
    // 检查任务数据
    const taskCheck = await client.query('SELECT id, title, status FROM tasks ORDER BY id LIMIT 3');
    console.log('\n前3个任务:');
    taskCheck.rows.forEach(task => {
      console.log(`  ID: ${task.id}, 标题: ${task.title}, 状态: ${task.status}`);
    });
    
    // 检查里程碑数据
    const milestoneCheck = await client.query('SELECT id, name, due_date FROM milestones ORDER BY id LIMIT 3');
    console.log('\n前3个里程碑:');
    milestoneCheck.rows.forEach(milestone => {
      console.log(`  ID: ${milestone.id}, 名称: ${milestone.name}, 截止日期: ${milestone.due_date}`);
    });
    
    console.log('\n=== 验证完成 ===');
    
  } catch (error) {
    console.error('验证过程中发生错误:', error);
  } finally {
    client.release();
    db.close();
    await pgPool.end();
  }
}

if (require.main === module) {
  verifyMigration();
}

module.exports = { verifyMigration };