const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 确保数据目录存在
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'test.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('SQLite连接失败:', err.message);
  } else {
    console.log('SQLite数据库连接成功');
  }
});

// 初始化表结构
const initTables = () => {
  return new Promise((resolve, reject) => {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        real_name TEXT NOT NULL,
        phone TEXT,
        department TEXT,
        position TEXT,
        role TEXT DEFAULT 'user',
        status TEXT DEFAULT 'active',
        avatar TEXT,
        location TEXT,
        join_date DATETIME,
        last_login_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME
      )
    `;
    
    const createRefreshTokensTable = `
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;
    
    const createTasksTable = `
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'pending',
        category TEXT NOT NULL CHECK (category IN ('生产协调', '项目管理', '综合工作')),
        tags TEXT,
        created_by INTEGER NOT NULL,
        assigned_to INTEGER,
        estimated_hours REAL DEFAULT 0,
        actual_hours REAL DEFAULT 0,
        progress INTEGER DEFAULT 0,
        due_date DATETIME,
        start_date DATETIME,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id)
      )
    `;
    
    const createTaskLogsTable = `
      CREATE TABLE IF NOT EXISTS task_logs (\n        id INTEGER PRIMARY KEY AUTOINCREMENT,\n        task_id INTEGER NOT NULL,\n        user_id INTEGER NOT NULL,\n        action TEXT NOT NULL,\n        details TEXT,\n        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n        FOREIGN KEY (task_id) REFERENCES tasks(id),\n        FOREIGN KEY (user_id) REFERENCES users(id)\n      )\n    `;

    const createTaskCommentsTable = `
      CREATE TABLE IF NOT EXISTS task_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;
    
    const createTaskExtensionsTable = `
      CREATE TABLE IF NOT EXISTS task_extensions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        requested_by INTEGER NOT NULL,
        old_due_date DATETIME,
        new_due_date DATETIME NOT NULL,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        approved_by INTEGER,
        approved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (requested_by) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      )
    `;
    
    const createTaskFilesTable = `
      CREATE TABLE IF NOT EXISTS task_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        uploaded_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `;
    
    const createNotificationsTable = `
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read INTEGER DEFAULT 0,
        related_id INTEGER,
        related_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;
    
    db.run(createUsersTable, (err) => {
      if (err) {
        console.error('创建用户表失败:', err.message);
        reject(err);
      } else {
        console.log('用户表创建成功');
        
        // 确保新增列存在（对于已存在的数据库执行迁移）
        db.all("PRAGMA table_info('users')", (err, columns) => {
          const proceedNext = () => {
            // 创建refresh_tokens表
            db.run(createRefreshTokensTable, (err) => {
              if (err) {
                console.error('创建refresh_tokens表失败:', err.message);
                reject(err);
              } else {
                console.log('refresh_tokens表创建成功');
                
                // 创建tasks表
                db.run(createTasksTable, (err) => {
                  if (err) {
                    console.error('创建tasks表失败:', err.message);
                    reject(err);
                  } else {
                    console.log('tasks表创建成功');
                    
                    // 创建task_logs表
                        db.run(createTaskLogsTable, (err) => {
                          if (err) {
                            console.error('创建task_logs表失败:', err.message);
                            reject(err);
                          } else {
                            console.log('task_logs表创建成功');

                            // 创建task_comments表
                            db.run(createTaskCommentsTable, (err) => {
                              if (err) {
                                console.error('创建task_comments表失败:', err.message);
                                reject(err);
                              } else {
                                console.log('task_comments表创建成功');
                                
                                // 创建task_extensions表
                                db.run(createTaskExtensionsTable, (err) => {
                                  if (err) {
                                    console.error('创建task_extensions表失败:', err.message);
                                    reject(err);
                                  } else {
                                    console.log('task_extensions表创建成功');
                                    
                                    // 创建task_files表
                                    db.run(createTaskFilesTable, (err) => {
                                      if (err) {
                                        console.error('创建task_files表失败:', err.message);
                                        reject(err);
                                      } else {
                                        console.log('task_files表创建成功');
                                        
                                        // 创建notifications表
                                        db.run(createNotificationsTable, (err) => {
                                          if (err) {
                                            console.error('创建notifications表失败:', err.message);
                                            reject(err);
                                          } else {
                                            console.log('notifications表创建成功');
                                            resolve();
                                          }
                                        });
                                      }
                                    });
                                  }
                                });
                              }
                            });
                          }
                        });
                  }
                });
              }
            });
          };

          if (err) {
            console.error('检查users表结构失败:', err.message);
            proceedNext();
            return;
          }
          const colNames = columns.map(c => c.name);

          const addColumnIfMissing = (name, sql, cb) => {
            if (!colNames.includes(name)) {
              db.run(sql, (e) => {
                if (e) console.error(`添加列${name}失败:`, e.message);
                else console.log(`列${name}添加成功`);
                cb();
              });
            } else {
              cb();
            }
          };

          // 依次检查并添加列
          addColumnIfMissing('location', "ALTER TABLE users ADD COLUMN location TEXT", () => {
            addColumnIfMissing('join_date', "ALTER TABLE users ADD COLUMN join_date DATETIME", () => {
              proceedNext();
            });
          });
        });
      }
    });
  });
};

module.exports = {
  db,
  initTables
};