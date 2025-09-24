const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabase() {
  try {
    // 连接到MySQL服务器（不指定数据库）
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    console.log('连接到MySQL服务器成功');

    // 创建数据库
    await connection.query('CREATE DATABASE IF NOT EXISTS task_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('数据库 task_management 创建成功');

    // 使用数据库
    await connection.query('USE task_management');

    // Drop tables in reverse order of creation to handle foreign key constraints
    await connection.query('DROP TABLE IF EXISTS refresh_tokens');
    await connection.query('DROP TABLE IF EXISTS task_dependencies');
    await connection.query('DROP TABLE IF EXISTS milestones');
    await connection.query('DROP TABLE IF EXISTS task_comments');
    await connection.query('DROP TABLE IF EXISTS task_logs');
    await connection.query('DROP TABLE IF EXISTS tasks');
    await connection.query('DROP TABLE IF EXISTS users');
    console.log('Existing tables dropped successfully.');

    // 创建用户表
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        real_name VARCHAR(100),
        department VARCHAR(100),
        position VARCHAR(100),
        phone VARCHAR(20),
        avatar VARCHAR(255),
        location VARCHAR(255),
        join_date DATETIME,
        role ENUM('admin', 'manager', 'employee', 'user') DEFAULT 'employee',
        status ENUM('active', 'inactive', 'deleted') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP NULL,
        deleted_at DATETIME NULL
      )
    `;
    await connection.query(createUsersTable);
    console.log('用户表创建成功');

    // 创建任务表
    const createTasksTable = `
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        start_date DATE,
        due_date DATE,
        assigned_to INT,
        created_by INT NOT NULL,
        category VARCHAR(50),
        tags TEXT,
        estimated_hours DECIMAL(5,2),
        actual_hours DECIMAL(5,2) DEFAULT 0,
        status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'deleted') DEFAULT 'pending',
        progress INT DEFAULT 0,
        completed_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL,
        FOREIGN KEY (assigned_to) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `;
    await connection.query(createTasksTable);
    console.log('任务表创建成功');

    // 创建任务日志表
    const createTaskLogsTable = `
      CREATE TABLE IF NOT EXISTS task_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        user_id INT NOT NULL,
        action VARCHAR(50) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;
    await connection.query(createTaskLogsTable);
    console.log('任务日志表创建成功');

    // 创建任务评论表
    const createTaskCommentsTable = `
      CREATE TABLE IF NOT EXISTS task_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;
    await connection.query(createTaskCommentsTable);
    console.log('任务评论表创建成功');

    // 创建里程碑表
    const createMilestonesTable = `
      CREATE TABLE IF NOT EXISTS milestones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        target_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        is_achieved BOOLEAN DEFAULT FALSE,
        achieved_date DATE,
        reminder_days INT DEFAULT 3,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `;
    await connection.query(createMilestonesTable);
    console.log('里程碑表创建成功');

    // 创建任务依赖表
    const createTaskDependenciesTable = `
      CREATE TABLE IF NOT EXISTS task_dependencies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        predecessor_id INT NOT NULL,
        successor_id INT NOT NULL,
        type ENUM('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish') DEFAULT 'finish_to_start',
        \`lag\` INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (predecessor_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (successor_id) REFERENCES tasks(id) ON DELETE CASCADE,
        UNIQUE KEY unique_dependency (predecessor_id, successor_id)
      )
    `;
    await connection.query(createTaskDependenciesTable);
    console.log('任务依赖表创建成功');

    // 创建刷新令牌表
    const createRefreshTokensTable = `
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    await connection.query(createRefreshTokensTable);
    console.log('刷新令牌表创建成功');

    await connection.end();
    console.log('所有表创建完成，数据库连接已关闭');

  } catch (error) {
    console.error('创建数据库失败:', error.message);
    process.exit(1);
  }
}

createDatabase();