const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('创建任务相关表...');

// 创建task_comments表
const createCommentsTable = `
CREATE TABLE IF NOT EXISTS task_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`;

// 创建task_logs表
const createLogsTable = `
CREATE TABLE IF NOT EXISTS task_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  details TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`;

db.serialize(() => {
  // 创建task_comments表
  db.run(createCommentsTable, (err) => {
    if (err) {
      console.error('创建task_comments表失败:', err);
    } else {
      console.log('✅ task_comments表创建成功');
    }
  });
  
  // 创建task_logs表
  db.run(createLogsTable, (err) => {
    if (err) {
      console.error('创建task_logs表失败:', err);
    } else {
      console.log('✅ task_logs表创建成功');
    }
  });
  
  // 插入一些测试数据
  db.run(`INSERT OR IGNORE INTO task_comments (task_id, user_id, content, created_at) 
          VALUES (13, 1, '这是一个测试评论', datetime('now'))`, (err) => {
    if (err) {
      console.error('插入测试评论失败:', err);
    } else {
      console.log('✅ 插入测试评论成功');
    }
  });
  
  db.run(`INSERT OR IGNORE INTO task_logs (task_id, user_id, action, details, created_at) 
          VALUES (13, 1, 'create', '创建了任务', datetime('now'))`, (err) => {
    if (err) {
      console.error('插入测试日志失败:', err);
    } else {
      console.log('✅ 插入测试日志成功');
    }
    
    // 关闭数据库连接
    db.close(() => {
      console.log('\n数据库表创建完成！');
    });
  });
});