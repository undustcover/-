const { db } = require('./src/config/sqlite');
const bcrypt = require('bcryptjs');

console.log('=== 开始注册用户 ===\n');

// 用户数据（来自人员信息注册.md）
const users = [
  {
    username: 'mali',
    password: 'Mali123',
    real_name: '马里',
    phone: '13558655051',
    email: 'mali0413@cnpc.com.cn',
    position: '生产信息管理岗',
    role: 'manager',
    department: '生产部'
  },
  {
    username: 'jingxd',
    password: 'Jingxd123',
    real_name: '景向东',
    phone: '15390089812',
    email: 'jingxd@cnpc.com.cn',
    position: '生产信息管理岗',
    role: 'manager',
    department: '生产部'
  },
  {
    username: 'xubo',
    password: 'Xubo123',
    real_name: '徐波',
    phone: '18982409575',
    email: 'xubo1@cnpc.com.cn',
    position: '项目监控岗',
    role: 'user',
    department: '项目部'
  },
  {
    username: 'gejf',
    password: 'Gejf123',
    real_name: '葛景峰',
    phone: '18782421760',
    email: 'gejf@cnpc.com.cn',
    position: '生产计划管理岗',
    role: 'user',
    department: '生产部'
  },
  {
    username: 'xuhy',
    password: 'Xuhy123',
    real_name: '徐皓宇',
    phone: '15882337236',
    email: 'xuhy1@cnpc.com.cn',
    position: '生产信息管理岗',
    role: 'super_admin',
    department: '管理部'
  },
  {
    username: 'mazp',
    password: 'Mazp123',
    real_name: '马中平',
    phone: '13550080833',
    email: 'mazp01@cnpc.com.cn',
    position: '应急管理岗',
    role: 'user',
    department: '安全部'
  },
  {
    username: 'masj',
    password: 'Masj123',
    real_name: '马生居',
    phone: '18828048688',
    email: 'mashengju@cnpc.com.cn',
    position: '值班工程师',
    role: 'user',
    department: '运维部'
  },
  {
    username: 'wangjz',
    password: 'Wangjz123',
    real_name: '王军智',
    phone: '13981861124',
    email: 'wangjz2@cnpc.com.cn',
    position: '值班工程师',
    role: 'user',
    department: '运维部'
  },
  {
    username: 'wangzf',
    password: 'Wangzf123',
    real_name: '王泽发',
    phone: '13088011428',
    email: 'wangzf01@cnpc.com.cn',
    position: '项目监控岗',
    role: 'user',
    department: '项目部'
  },
  {
    username: 'wenhb',
    password: 'Wenhb123',
    real_name: '温海波',
    phone: '18710393950',
    email: 'wenhb@cnpc.com.cn',
    position: '项目评价岗',
    role: 'user',
    department: '项目部'
  },
  {
    username: 'yanx',
    password: 'Yanx123',
    real_name: '严翔',
    phone: '18868006805',
    email: 'yanxiang_sc@cnpc.com.cn',
    position: '项目监控岗',
    role: 'user',
    department: '项目部'
  },
  {
    username: 'gaofl',
    password: 'Gaofl123',
    real_name: '高富林',
    phone: '15501250708',
    email: 'gaofl@cnpc.com.cn',
    position: '项目监控岗',
    role: 'user',
    department: '项目部'
  },
  {
    username: 'licy',
    password: 'Licy123',
    real_name: '李晟毅',
    phone: '13251317467',
    email: 'lichengyi@cnpc.com.cn',
    position: '项目监控岗',
    role: 'user',
    department: '项目部'
  },
  {
    username: 'xuehr',
    password: 'Xuehr123',
    real_name: '薛昊瑞',
    phone: '13315001349',
    email: 'xuehr@cnpc.com.cn',
    position: '项目监控岗',
    role: 'user',
    department: '项目部'
  }
];

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

// 注册用户函数
async function registerUsers() {
  try {
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        // 检查用户名是否已存在
        const existingUser = await query(
          'SELECT id FROM users WHERE username = ?',
          [user.username]
        );
        
        if (existingUser.length > 0) {
          console.log(`❌ 用户 ${user.username} (${user.real_name}) 已存在，跳过`);
          continue;
        }
        
        // 加密密码
        const passwordHash = await bcrypt.hash(user.password, 10);
        
        // 插入用户
        const result = await query(`
          INSERT INTO users (
            username, email, password_hash, real_name, phone, 
            department, position, role, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
        `, [
          user.username,
          user.email,
          passwordHash,
          user.real_name,
          user.phone,
          user.department,
          user.position,
          user.role
        ]);
        
        console.log(`✅ 用户 ${user.username} (${user.real_name}) 注册成功，ID: ${result.lastID}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ 用户 ${user.username} (${user.real_name}) 注册失败:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n=== 注册完成 ===`);
    console.log(`✅ 成功注册: ${successCount} 个用户`);
    console.log(`❌ 注册失败: ${errorCount} 个用户`);
    
    // 显示最终用户列表
    console.log('\n=== 当前用户列表 ===');
    const allUsers = await query('SELECT id, username, real_name, role, department FROM users ORDER BY id');
    allUsers.forEach(user => {
      console.log(`ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.real_name}, 角色: ${user.role}, 部门: ${user.department}`);
    });
    
    console.log(`\n👥 总用户数: ${allUsers.length}`);
    
  } catch (error) {
    console.error('注册用户时出错:', error);
  } finally {
    db.close();
  }
}

// 执行注册
registerUsers();