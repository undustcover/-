const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyData() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('连接到MySQL数据库成功');

    const tables = ['users', 'tasks', 'task_logs', 'task_comments', 'milestones', 'task_dependencies', 'refresh_tokens'];
    
    for (const table of tables) {
      const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`${table}表记录数: ${rows[0].count}`);
    }

    // 检查一些关键数据
    const [users] = await connection.execute('SELECT id, username, email FROM users LIMIT 3');
    console.log('\n用户表示例数据:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, 用户名: ${user.username}, 邮箱: ${user.email}`);
    });

    const [tasks] = await connection.execute('SELECT id, title, status FROM tasks LIMIT 3');
    console.log('\n任务表示例数据:');
    tasks.forEach(task => {
      console.log(`- ID: ${task.id}, 标题: ${task.title}, 状态: ${task.status}`);
    });

    await connection.end();
    console.log('\n数据验证完成');
  } catch (error) {
    console.error('数据验证失败:', error.message);
  }
}

verifyData();