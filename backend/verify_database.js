const { db } = require('./src/config/sqlite');

console.log('=== 数据库初始化验证 ===\n');

// 获取所有表的信息
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('❌ 获取表列表失败:', err.message);
    return;
  }
  
  console.log('📊 数据库表列表:');
  tables.forEach((table, index) => {
    console.log(`   ${index + 1}. ${table.name}`);
  });
  
  console.log(`\n✅ 总共创建了 ${tables.length} 个表\n`);
  
  // 检查关键表的数据统计
  const checkTables = [
    { name: 'users', desc: '用户' },
    { name: 'tasks', desc: '任务' },
    { name: 'task_logs', desc: '任务日志' },
    { name: 'task_comments', desc: '任务评论' },
    { name: 'notifications', desc: '通知' },
    { name: 'files', desc: '文件' },
    { name: 'refresh_tokens', desc: '刷新令牌' }
  ];
  
  let completedChecks = 0;
  
  checkTables.forEach(table => {
    db.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, result) => {
      if (err) {
        console.log(`❌ ${table.desc}表 (${table.name}): 查询失败 - ${err.message}`);
      } else {
        console.log(`📋 ${table.desc}表 (${table.name}): ${result.count} 条记录`);
      }
      
      completedChecks++;
      if (completedChecks === checkTables.length) {
        // 显示用户角色分布
        console.log('\n👥 用户角色分布:');
        db.all('SELECT role, COUNT(*) as count FROM users GROUP BY role', (err, roles) => {
          if (!err) {
            roles.forEach(role => {
              console.log(`   ${role.role}: ${role.count} 人`);
            });
          }
          
          // 显示任务状态分布
          console.log('\n📊 任务状态分布:');
          db.all('SELECT status, COUNT(*) as count FROM tasks GROUP BY status', (err, statuses) => {
            if (!err) {
              statuses.forEach(status => {
                console.log(`   ${status.status}: ${status.count} 个`);
              });
            }
            
            // 显示部门分布
            console.log('\n🏢 部门分布:');
            db.all('SELECT department, COUNT(*) as count FROM users WHERE department IS NOT NULL GROUP BY department', (err, departments) => {
              if (!err) {
                departments.forEach(dept => {
                  console.log(`   ${dept.department}: ${dept.count} 人`);
                });
              }
              
              console.log('\n✅ 数据库初始化验证完成！');
              console.log('\n🎯 系统已准备就绪，可以开始使用任务管理系统。');
              
              db.close();
            });
          });
        });
      }
    });
  });
});