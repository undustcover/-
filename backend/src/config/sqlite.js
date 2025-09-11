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

// 创建表结构
const createTables = () => {
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
        token TEXT UNIQUE NOT NULL,
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
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        assignee_id INTEGER,
        creator_id INTEGER NOT NULL,
        project_id INTEGER,
        parent_id INTEGER,
        start_date DATETIME,
        end_date DATETIME,
        actual_start_date DATETIME,
        actual_end_date DATETIME,
        progress INTEGER DEFAULT 0,
        estimated_hours REAL,
        actual_hours REAL,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME,
        FOREIGN KEY (assignee_id) REFERENCES users(id),
        FOREIGN KEY (creator_id) REFERENCES users(id),
        FOREIGN KEY (parent_id) REFERENCES tasks(id)
      )
    `;
    
    const createTaskLogsTable = `
      CREATE TABLE IF NOT EXISTS task_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;
    
    const createTaskCommentsTable = `
      CREATE TABLE IF NOT EXISTS task_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;
    
    const createTaskDependenciesTable = `
      CREATE TABLE IF NOT EXISTS task_dependencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        predecessor_id INTEGER NOT NULL,
        successor_id INTEGER NOT NULL,
        type TEXT DEFAULT 'finish_to_start',
        lag INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (predecessor_id) REFERENCES tasks(id),
        FOREIGN KEY (successor_id) REFERENCES tasks(id),
        UNIQUE(predecessor_id, successor_id)
      )
    `;
    
    const createMilestonesTable = `
      CREATE TABLE IF NOT EXISTS milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        due_date DATETIME NOT NULL,
        status TEXT DEFAULT 'pending',
        project_id INTEGER,
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
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
    
    // 按顺序创建表
    db.run(createUsersTable, (err) => {
      if (err) {
        console.error('创建用户表失败:', err.message);
        reject(err);
      } else {
        console.log('用户表创建成功');
        
        db.run(createRefreshTokensTable, (err) => {
          if (err) {
            console.error('创建refresh_tokens表失败:', err.message);
            reject(err);
          } else {
            console.log('refresh_tokens表创建成功');
            
            db.run(createTasksTable, (err) => {
              if (err) {
                console.error('创建tasks表失败:', err.message);
                reject(err);
              } else {
                console.log('tasks表创建成功');
                
                db.run(createTaskLogsTable, (err) => {
                  if (err) {
                    console.error('创建task_logs表失败:', err.message);
                    reject(err);
                  } else {
                    console.log('task_logs表创建成功');
                    
                    db.run(createTaskCommentsTable, (err) => {
                      if (err) {
                        console.error('创建task_comments表失败:', err.message);
                        reject(err);
                      } else {
                        console.log('task_comments表创建成功');
                        
                        db.run(createTaskDependenciesTable, (err) => {
                          if (err) {
                            console.error('创建task_dependencies表失败:', err.message);
                            reject(err);
                          } else {
                            console.log('task_dependencies表创建成功');
                            
                            db.run(createMilestonesTable, (err) => {
                              if (err) {
                                console.error('创建milestones表失败:', err.message);
                                reject(err);
                              } else {
                                console.log('milestones表创建成功');
                                
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
      }
    });
  });
};

// 检查并添加用户表的新列
const checkAndAddUserColumns = () => {
  return new Promise((resolve, reject) => {
    db.all("PRAGMA table_info('users')", (err, columns) => {
      if (err) {
        console.error('检查users表结构失败:', err.message);
        resolve(); // 不阻塞初始化过程
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
          resolve();
        });
      });
    });
  });
};

// 初始化表结构
const initTables = async () => {
  try {
    await createTables();
    await checkAndAddUserColumns();
    console.log('所有数据库表初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
};

module.exports = {
  db,
  initTables
};