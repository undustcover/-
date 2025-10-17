const { initTables } = require('./src/config/sqlite');
const { db } = require('./src/config/sqlite');
const bcrypt = require('bcryptjs');

console.log('=== 初始化数据库并添加用户信息 ===\n');

// 从人员信息注册.md中的用户数据
const users = [
  {
    username: 'mali',
    password: 'Mali123',
    real_name: '马里',
    phone: '13558655051',
    email: 'mali0413@cnpc.com.cn',
    position: '生产信息管理岗',
    role: 'manager'
  },
  {
    username: 'jingxd',
    password: 'Jingxd123',
    real_name: '景向东',
    phone: '15390089812',
    email: 'jingxd@cnpc.com.cn',
    position: '生产信息管理岗',
    role: 'manager'
  },
  {
    username: 'xubo',
    password: 'Xubo123',
    real_name: '徐波',
    phone: '18982409575',
    email: 'xubo1@cnpc.com.cn',
    position: '项目监控岗',
    role: 'user'
  },
  {
    username: 'gejf',
    password: 'Gejf123',
    real_name: '葛景峰',
    phone: '18782421760',
    email: 'gejf@cnpc.com.cn',
    position: '生产计划管理岗',
    role: 'user'
  },
  {
    username: 'xuhy',
    password: 'Xuhy123',
    real_name: '徐皓宇',
    phone: '15882337236',
    email: 'xuhy1@cnpc.com.cn',
    position: '生产信息管理岗',
    role: 'super_admin'
  },
  {
    username: 'mazp',
    password: 'Mazp123',
    real_name: '马中平',
    phone: '13550080833',
    email: 'mazp01@cnpc.com.cn',
    position: '应急管理岗',
    role: 'user'
  },
  {
    username: 'masj',
    password: 'Masj123',
    real_name: '马生居',
    phone: '18828048688',
    email: 'mashengju@cnpc.com.cn',
    position: '值班工程师',
    role: 'user'
  },
  {
    username: 'wangjz',
    password: 'Wangjz123',
    real_name: '王军智',
    phone: '13981861124',
    email: 'wangjz2@cnpc.com.cn',
    position: '值班工程师',
    role: 'user'
  },
  {
    username: 'wangzf',
    password: 'Wangzf123',
    real_name: '王泽发',
    phone: '13088011428',
    email: 'wangzf01@cnpc.com.cn',
    position: '项目监控岗',
    role: 'user'
  },
  {
    username: 'wenhb',
    password: 'Wenhb123',
    real_name: '温海波',
    phone: '18710393950',
    email: 'wenhb@cnpc.com.cn',
    position: '项目评价岗',
    role: 'user'
  },
  {
    username: 'yanx',
    password: 'Yanx123',
    real_name: '严翔',
    phone: '18868006805',
    email: 'yanxiang_sc@cnpc.com.cn',
    position: '项目监控岗',
    role: 'user'
  },
  {
    username: 'gaofl',
    password: 'Gaofl123',
    real_name: '高富林',
    phone: '15501250708',
    email: 'gaofl@cnpc.com.cn',
    position: '项目监控岗',
    role: 'user'
  },
  {
    username: 'licy',
    password: 'Licy123',
    real_name: '李晟毅',
    phone: '13251317467',
    email: 'lichengyi@cnpc.com.cn',
    position: '项目监控岗',
    role: 'user'
  },
  {
    username: 'xuehr',
    password: 'Xuehr123',
    real_name: '薛昊瑞',
    phone: '13315001349',
    email: 'xuehr@cnpc.com.cn',
    position: '项目监控岗',
    role: 'user'
  }
];

// 初始化表结构
initTables().then(() => {
  console.log('\n=== 开始插入用户数据 ===\n');
  
  let userInsertCount = 0;
  let successCount = 0;
  let errorCount = 0;
  
  // 插入用户数据
  users.forEach((user, index) => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    
    const insertUserSql = `
      INSERT OR REPLACE INTO users (
        username, email, password_hash, real_name, phone, 
        position, role, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
    `;
    
    db.run(insertUserSql, [
      user.username, user.email, hashedPassword, user.real_name, 
      user.phone, user.position, user.role
    ], function(err) {
      if (err) {
        console.error(`❌ 插入用户 ${user.username} (${user.real_name}) 失败:`, err.message);
        errorCount++;
      } else {
        console.log(`✅ 用户 ${user.username} (${user.real_name}) - ${user.position} - ${user.role} 插入成功`);
        successCount++;
      }
      
      userInsertCount++;
      
      // 当所有用户插入完成后，显示统计信息
      if (userInsertCount === users.length) {
        showSummary();
      }
    });
  });
  
  function showSummary() {
    console.log('\n=== 用户数据插入完成 ===\n');
    console.log(`✅ 成功插入: ${successCount} 个用户`);
    console.log(`❌ 插入失败: ${errorCount} 个用户`);
    console.log(`📊 总计处理: ${users.length} 个用户`);
    
    // 查询用户统计
    db.all('SELECT COUNT(*) as count FROM users', (err, result) => {
      if (!err) {
        console.log(`\n👥 数据库中总用户数: ${result[0].count}`);
      }
      
      // 按角色统计
      db.all(`
        SELECT role, COUNT(*) as count 
        FROM users 
        GROUP BY role 
        ORDER BY role
      `, (err, results) => {
        if (!err) {
          console.log('\n📋 用户角色分布:');
          results.forEach(row => {
            console.log(`   ${row.role}: ${row.count} 人`);
          });
        }
        
        // 按岗位统计
        db.all(`
          SELECT position, COUNT(*) as count 
          FROM users 
          WHERE position IS NOT NULL
          GROUP BY position 
          ORDER BY count DESC
        `, (err, results) => {
          if (!err) {
            console.log('\n🏢 岗位分布:');
            results.forEach(row => {
              console.log(`   ${row.position}: ${row.count} 人`);
            });
          }
          
          console.log('\n🎉 数据库初始化和用户添加完成！');
          console.log('\n💡 提示: 现在可以使用以下任一账号登录系统:');
          console.log('   - mali / Mali123 (部门经理)');
          console.log('   - xuhy / Xuhy123 (超级管理员)');
          console.log('   - xubo / Xubo123 (普通用户)');
          
          db.close();
        });
      });
    });
  }
  
}).catch(err => {
  console.error('❌ 初始化表结构失败:', err);
  process.exit(1);
});