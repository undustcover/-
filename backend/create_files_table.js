const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 使用正确的数据库路径
const dbPath = path.join(__dirname, 'task_management.db');
const db = new sqlite3.Database(dbPath);

console.log('创建files表...');

// 创建files表
const createFilesTable = `
CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(100),
  mime_type VARCHAR(100),
  task_id INTEGER,
  uploaded_by INTEGER NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
)`;

// 创建task_files表（如果不存在）
const createTaskFilesTable = `
CREATE TABLE IF NOT EXISTS task_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  file_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  UNIQUE(task_id, file_id)
)`;

db.serialize(() => {
  // 创建files表
  db.run(createFilesTable, (err) => {
    if (err) {
      console.error('创建files表失败:', err);
    } else {
      console.log('✅ files表创建成功');
    }
  });
  
  // 创建task_files表
  db.run(createTaskFilesTable, (err) => {
    if (err) {
      console.error('创建task_files表失败:', err);
    } else {
      console.log('✅ task_files表创建成功');
    }
    
    // 关闭数据库连接
    db.close(() => {
      console.log('\nfiles表创建完成！');
    });
  });
});