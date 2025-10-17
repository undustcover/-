const { db } = require('./src/config/sqlite');

console.log('=== 修复用户状态问题 ===\n');

// 查询mali用户的详细信息
db.get('SELECT * FROM users WHERE username = ?', ['mali'], (err, user) => {
  if (err) {
    console.error('❌ 查询用户失败:', err.message);
    return;
  }
  
  if (!user) {
    console.log('❌ 用户mali不存在');
    return;
  }
  
  console.log('👤 当前用户信息:');
  console.log(`   ID: ${user.id}`);
  console.log(`   用户名: ${user.username}`);
  console.log(`   真实姓名: ${user.real_name}`);
  console.log(`   邮箱: ${user.email}`);
  console.log(`   角色: ${user.role}`);
  console.log(`   状态: ${user.status}`);
  console.log(`   岗位: ${user.position}`);
  console.log(`   部门: ${user.department}`);
  
  // 强制更新用户状态为active
  console.log('\n🔧 正在修复用户状态...');
  
  db.run('UPDATE users SET status = ? WHERE username = ?', ['active', 'mali'], function(err) {
    if (err) {
      console.error('❌ 更新用户状态失败:', err.message);
      return;
    }
    
    console.log(`✅ 用户状态已更新，影响行数: ${this.changes}`);
    
    // 验证更新结果
    db.get('SELECT username, status FROM users WHERE username = ?', ['mali'], (err, updatedUser) => {
      if (err) {
        console.error('❌ 验证更新失败:', err.message);
      } else {
        console.log(`\n✅ 验证结果:`);
        console.log(`   用户名: ${updatedUser.username}`);
        console.log(`   状态: ${updatedUser.status}`);
        
        if (updatedUser.status === 'active') {
          console.log('\n🎉 用户状态修复成功！现在可以正常登录了。');
        } else {
          console.log('\n⚠️  状态仍然不正确，可能存在其他问题。');
        }
      }
      
      // 同时检查是否有其他状态异常的用户
      console.log('\n📊 检查所有用户状态分布:');
      db.all('SELECT status, COUNT(*) as count FROM users GROUP BY status', (err, statuses) => {
        if (!err) {
          statuses.forEach(status => {
            console.log(`   ${status.status}: ${status.count} 人`);
          });
        }
        
        db.close();
      });
    });
  });
});