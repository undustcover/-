const { db } = require('./src/config/sqlite');

console.log('=== 检查和修复所有用户状态 ===\n');

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

async function fixUsersStatus() {
  try {
    // 1. 查看所有用户的当前状态
    console.log('=== 当前用户状态 ===');
    const allUsers = await query('SELECT id, username, real_name, status FROM users ORDER BY id');
    allUsers.forEach(user => {
      console.log(`ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.real_name}, 状态: ${user.status}`);
    });
    
    // 2. 将所有用户状态设置为active
    console.log('\n=== 修复用户状态 ===');
    const updateResult = await query(
      'UPDATE users SET status = ? WHERE status != ?',
      ['active', 'active']
    );
    console.log(`已更新 ${updateResult.changes} 个用户的状态为 active`);
    
    // 3. 验证修复结果
    console.log('\n=== 修复后的用户状态 ===');
    const updatedUsers = await query('SELECT id, username, real_name, status FROM users ORDER BY id');
    updatedUsers.forEach(user => {
      console.log(`ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.real_name}, 状态: ${user.status}`);
    });
    
    // 4. 统计状态分布
    console.log('\n=== 状态统计 ===');
    const statusStats = await query('SELECT status, COUNT(*) as count FROM users GROUP BY status');
    statusStats.forEach(stat => {
      console.log(`${stat.status}: ${stat.count} 个用户`);
    });
    
    console.log('\n✅ 用户状态修复完成！');
    
  } catch (error) {
    console.error('修复用户状态时出错:', error);
  } finally {
    db.close();
  }
}

// 执行修复
fixUsersStatus();