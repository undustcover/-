const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

// SQLite数据库路径
const sqliteDbPath = path.join(__dirname, 'data', 'test.db');

// PostgreSQL连接配置
const pgPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  database: process.env.DB_NAME || 'task_management',
  port: process.env.DB_PORT || 5432,
});

// 检查SQLite数据库内容
async function checkSQLiteData() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(sqliteDbPath, (err) => {
      if (err) {
        console.error('连接SQLite数据库失败:', err.message);
        reject(err);
        return;
      }
      console.log('SQLite数据库连接成功');
    });

    // 获取所有表名
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
      if (err) {
        reject(err);
        return;
      }

      console.log('\n=== SQLite数据库表结构 ===');
      console.log('表名:', tables.map(t => t.name).join(', '));

      const tableData = {};
      let completedTables = 0;

      if (tables.length === 0) {
        console.log('SQLite数据库中没有表');
        db.close();
        resolve(tableData);
        return;
      }

      // 检查每个表的数据
      tables.forEach(table => {
        const tableName = table.name;
        
        // 获取表结构
        db.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
          if (err) {
            console.error(`获取表${tableName}结构失败:`, err.message);
            completedTables++;
            if (completedTables === tables.length) {
              db.close();
              resolve(tableData);
            }
            return;
          }

          // 获取表数据
          db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
            if (err) {
              console.error(`获取表${tableName}数据失败:`, err.message);
            } else {
              tableData[tableName] = {
                columns: columns,
                rows: rows,
                count: rows.length
              };
              console.log(`\n表 ${tableName}:`);
              console.log(`  列数: ${columns.length}`);
              console.log(`  行数: ${rows.length}`);
              console.log(`  列名: ${columns.map(c => c.name).join(', ')}`);
              
              if (rows.length > 0) {
                console.log(`  示例数据:`, JSON.stringify(rows[0], null, 2));
              }
            }

            completedTables++;
            if (completedTables === tables.length) {
              db.close();
              resolve(tableData);
            }
          });
        });
      });
    });
  });
}

// 字段映射配置
const fieldMappings = {
  milestones: {
    'title': 'name',  // SQLite的title字段映射到PostgreSQL的name字段
    'target_date': 'due_date'  // SQLite的target_date字段映射到PostgreSQL的due_date字段
  },
  files: {
    'file_path': 'path',  // SQLite的file_path映射到PostgreSQL的path
    'file_size': 'size',  // SQLite的file_size映射到PostgreSQL的size
    'file_type': null,    // PostgreSQL没有file_type字段
  },
  task_logs: {
    'details': 'description',  // SQLite的details映射到PostgreSQL的description
  },
  notifications: {
    'content': 'message',  // SQLite的content映射到PostgreSQL的message
  }
};

// 迁移数据到PostgreSQL
async function migrateData(tableData) {
  const client = await pgPool.connect();
  
  try {
    console.log('\n=== 开始数据迁移 ===');
    
    // 按依赖顺序迁移表
    const migrationOrder = ['users', 'refresh_tokens', 'tasks', 'task_logs', 'task_dependencies', 'milestones', 'notifications', 'task_files'];
    
    for (const tableName of migrationOrder) {
      if (tableData[tableName] && tableData[tableName].rows.length > 0) {
        console.log(`\n迁移表: ${tableName}`);
        
        // 特殊处理task_files表
        if (tableName === 'task_files') {
          await migrateTaskFiles(client, tableData[tableName].rows);
        } else {
          await migrateTable(client, tableName, tableData[tableName]);
        }
      } else {
        console.log(`跳过表 ${tableName}: 无数据或表不存在`);
      }
    }
    
    console.log('\n=== 数据迁移完成 ===');
    
  } catch (error) {
    console.error('数据迁移失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 获取PostgreSQL表结构
async function getPostgreSQLTableColumns(client, tableName) {
  try {
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
      ORDER BY ordinal_position
    `, [tableName]);
    return result.rows.map(row => row.column_name);
  } catch (error) {
    console.error(`获取PostgreSQL表${tableName}结构失败:`, error.message);
    return [];
  }
}

// 迁移单个表
async function migrateTable(client, tableName, tableInfo) {
  const { columns, rows } = tableInfo;
  
  if (rows.length === 0) {
    console.log(`  表 ${tableName} 无数据，跳过`);
    return;
  }
  
  // 获取PostgreSQL表的列结构
  const pgColumns = await getPostgreSQLTableColumns(client, tableName);
  if (pgColumns.length === 0) {
    console.log(`  PostgreSQL中不存在表 ${tableName}，跳过`);
    return;
  }
  
  // 处理字段映射
  const sqliteColumnNames = columns.map(c => c.name);
  const mapping = fieldMappings[tableName] || {};
  
  // 构建列映射关系
  const columnMapping = {};
  const targetColumns = [];
  
  sqliteColumnNames.forEach(sqliteCol => {
    if (mapping[sqliteCol] === null) {
      // 跳过映射为null的字段
      return;
    }
    
    const pgCol = mapping[sqliteCol] || sqliteCol;
    if (pgColumns.includes(pgCol)) {
      columnMapping[sqliteCol] = pgCol;
      targetColumns.push(pgCol);
    }
  });
  
  if (targetColumns.length === 0) {
    console.log(`  表 ${tableName} 没有匹配的列，跳过`);
    return;
  }
  
  console.log(`  表 ${tableName}: SQLite列(${sqliteColumnNames.length}) -> PostgreSQL列(${pgColumns.length}) -> 映射列(${targetColumns.length})`);
  console.log(`  列映射:`, Object.entries(columnMapping).map(([s, p]) => `${s}->${p}`).join(', '));
  
  // 特殊处理task_files表
  if (tableName === 'task_files') {
    await migrateTaskFiles(client, rows);
    return;
  }
  
  // 清空PostgreSQL表中的数据（可选）
  console.log(`  清空PostgreSQL表 ${tableName}`);
  await client.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
  
  // 构建插入语句
  const placeholders = targetColumns.map((_, index) => `$${index + 1}`).join(', ');
  const insertSql = `INSERT INTO ${tableName} (${targetColumns.join(', ')}) VALUES (${placeholders})`;
  
  console.log(`  插入 ${rows.length} 条记录到 ${tableName}`);
  
  // 批量插入数据
  let successCount = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const values = targetColumns.map(pgCol => {
      // 找到对应的SQLite列名
      const sqliteCol = Object.keys(columnMapping).find(key => columnMapping[key] === pgCol) || pgCol;
      let value = row[sqliteCol];
      
      // 处理特殊值
      if (value === null || value === undefined) {
        return null;
      }
      
      // 处理日期时间字段
      if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/) && (pgCol.includes('_at') || pgCol.includes('_date'))) {
        return new Date(value);
      }
      
      return value;
    });
    
    try {
      await client.query(insertSql, values);
      successCount++;
    } catch (error) {
      console.error(`  插入第 ${i + 1} 条记录失败:`, error.message);
      console.error(`  SQL:`, insertSql);
      console.error(`  值:`, values);
      // 继续处理其他记录
    }
  }
  
  console.log(`  表 ${tableName} 迁移完成: ${successCount}/${rows.length} 条记录成功`);
}

// 特殊处理task_files表（SQLite中是文件信息，PostgreSQL中只有files表）
async function migrateTaskFiles(client, rows) {
  console.log(`  特殊处理task_files表: 将文件信息迁移到files表`);
  
  // 清空files表
  await client.query(`TRUNCATE TABLE files RESTART IDENTITY CASCADE`);
  
  let successCount = 0;
  
  // 插入到files表的SQL语句
  const insertSql = `
    INSERT INTO files (filename, original_name, path, size, mime_type, task_id, uploaded_by, uploaded_at, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id
  `;
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    try {
      const values = [
        row.filename,
        row.original_name,
        row.file_path,  // SQLite的file_path -> PostgreSQL的path
        row.file_size,  // SQLite的file_size -> PostgreSQL的size
        row.mime_type,
        row.task_id,
        row.uploaded_by,
        row.created_at ? new Date(row.created_at) : new Date(),
        row.created_at ? new Date(row.created_at) : new Date(),
        row.created_at ? new Date(row.created_at) : new Date()
      ];
      
      await client.query(insertSql, values);
      successCount++;
    } catch (error) {
      console.error(`  插入文件记录失败:`, error.message);
      console.error(`  SQL:`, insertSql);
      console.error(`  数据:`, JSON.stringify(row, null, 2));
    }
  }
  
  console.log(`  task_files表迁移完成: ${successCount}/${rows.length} 条记录成功`);
}

// 主函数
async function main() {
  try {
    console.log('开始SQLite到PostgreSQL数据迁移...');
    
    // 检查SQLite数据
    const tableData = await checkSQLiteData();
    
    if (Object.keys(tableData).length === 0) {
      console.log('SQLite数据库中没有数据需要迁移');
      return;
    }
    
    // 测试PostgreSQL连接
    console.log('\n测试PostgreSQL连接...');
    const client = await pgPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('PostgreSQL连接成功');
    
    // 迁移数据
    await migrateData(tableData);
    
    console.log('\n数据迁移完成！');
    
  } catch (error) {
    console.error('迁移过程中发生错误:', error);
  } finally {
    await pgPool.end();
  }
}

// 运行迁移
if (require.main === module) {
  main();
}

module.exports = { main, checkSQLiteData, migrateData };