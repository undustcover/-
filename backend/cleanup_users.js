const { db } = require('./src/config/sqlite');

console.log('数据库连接成功');

// 查询函数
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (sql.toLowerCase().includes('select')) {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    } else {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes, lastID: this.lastID });
      });
    }
  });
}

async function cleanupUsers() {
  try {
    console.log('开始清理用户数据...');
    
    // 1. 查看当前所有用户
    console.log('\n=== 当前用户列表 ===');
    const allUsers = await query('SELECT id, username, real_name, role FROM users ORDER BY id');
    allUsers.forEach(user => {
      console.log(`ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.real_name}, 角色: ${user.role}`);
    });
    
    // 2. 删除除了admin123和admin之外的所有用户
    console.log('\n=== 删除用户 ===');
    const deleteResult = await query(
      'DELETE FROM users WHERE username NOT IN (?, ?)',
      ['admin123', 'admin']
    );
    console.log(`已删除 ${deleteResult.changes} 个用户`);
    
    // 3. 查看删除后的用户列表
    console.log('\n=== 删除后的用户列表 ===');
    const remainingUsers = await query('SELECT id, username, real_name, role FROM users ORDER BY id');
    remainingUsers.forEach(user => {
      console.log(`ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.real_name}, 角色: ${user.role}`);
    });
    
    // 4. 清理相关的任务数据（如果有的话）
    console.log('\n=== 清理相关数据 ===');
    
    // 删除被删除用户创建的任务
    const taskDeleteResult = await query(
      'DELETE FROM tasks WHERE created_by NOT IN (SELECT id FROM users)'
    );
    console.log(`已删除 ${taskDeleteResult.changes} 个孤立任务`);
    
    // 删除被删除用户分配的任务
    const assignedTaskResult = await query(
      'UPDATE tasks SET assigned_to = NULL WHERE assigned_to NOT IN (SELECT id FROM users)'
    );
    console.log(`已清理 ${assignedTaskResult.changes} 个任务的分配关系`);
    
    // 删除被删除用户的通知
    const notificationResult = await query(
      'DELETE FROM notifications WHERE user_id NOT IN (SELECT id FROM users)'
    );
    console.log(`已删除 ${notificationResult.changes} 个孤立通知`);
    
    // 删除被删除用户的文件
    const fileResult = await query(
      'DELETE FROM files WHERE uploaded_by NOT IN (SELECT id FROM users)'
    );
    console.log(`已删除 ${fileResult.changes} 个孤立文件`);
    
    console.log('\n用户数据清理完成！');
    console.log('现在可以重新注册用户了。');
    
  } catch (error) {
    console.error('清理用户数据时出错:', error);
  } finally {
    db.close();
  }
}

// 执行清理
cleanupUsers();