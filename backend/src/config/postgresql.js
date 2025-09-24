const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'task_management',
  port: process.env.DB_PORT || 5432,
});

// PostgreSQL表结构初始化
const initTables = async () => {
  try {
    console.log('开始初始化PostgreSQL表结构...');

    // 用户表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        department VARCHAR(100),
        position VARCHAR(100),
        phone VARCHAR(20),
        avatar VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active',
        join_date TIMESTAMP,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      )
    `);

    // 刷新令牌表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 任务表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'medium',
        work_type VARCHAR(50),
        assigned_to INTEGER REFERENCES users(id),
        created_by INTEGER REFERENCES users(id),
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        actual_start_date TIMESTAMP,
        actual_end_date TIMESTAMP,
        due_date TIMESTAMP,
        progress INTEGER DEFAULT 0,
        estimated_hours DECIMAL(10,2),
        actual_hours DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,
        department VARCHAR(100)
      )
    `);

    // 任务依赖表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_dependencies (
        id SERIAL PRIMARY KEY,
        predecessor_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        successor_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        dependency_type VARCHAR(20) DEFAULT 'finish_to_start',
        lag_days INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      )
    `);

    // 任务日志表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_logs (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 里程碑表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS milestones (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        due_date TIMESTAMP NOT NULL,
        is_achieved BOOLEAN DEFAULT FALSE,
        achieved_date TIMESTAMP,
        reminder_days INTEGER DEFAULT 7,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 通知表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 文件表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        original_name VARCHAR(255) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        path VARCHAR(500) NOT NULL,
        size INTEGER NOT NULL,
        mime_type VARCHAR(100),
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        uploaded_by INTEGER REFERENCES users(id),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 任务评论表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_comments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引
    await pool.query('CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_files_task_id ON files(task_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id)');

    console.log('PostgreSQL表结构初始化完成');
  } catch (error) {
    console.error('PostgreSQL表初始化失败:', error);
    throw error;
  }
};

module.exports = {
  pool,
  initTables
};