const { initTables } = require('./src/config/sqlite');
const { db } = require('./src/config/sqlite');
const bcrypt = require('bcryptjs');

console.log('=== 初始化数据库和测试数据 ===\n');

// 初始化表结构
initTables().then(() => {
  console.log('\n=== 开始插入测试数据 ===\n');
  
  // 插入测试用户
  const users = [
    {
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      real_name: '系统管理员',
      role: 'admin',
      department: '信息技术部',
      position: '系统管理员'
    },
    {
      username: 'manager1',
      email: 'manager1@example.com',
      password: 'manager123',
      real_name: '部门经理1',
      role: 'manager',
      department: '生产部',
      position: '部门经理'
    },
    {
      username: 'user3',
      email: 'user3@example.com',
      password: 'user123',
      real_name: '普通用户3',
      role: 'user',
      department: '生产部',
      position: '技术员'
    },
    {
      username: 'user4',
      email: 'user4@example.com',
      password: 'user123',
      real_name: '普通用户4',
      role: 'user',
      department: '项目部',
      position: '项目助理'
    }
  ];
  
  let userInsertCount = 0;
  
  // 插入用户数据
  users.forEach((user, index) => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    
    const insertUserSql = `
      INSERT OR IGNORE INTO users (
        username, email, password_hash, real_name, role, 
        department, position, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))
    `;
    
    db.run(insertUserSql, [
      user.username, user.email, hashedPassword, user.real_name, 
      user.role, user.department, user.position
    ], function(err) {
      if (err) {
        console.error(`插入用户 ${user.username} 失败:`, err.message);
      } else {
        console.log(`✅ 用户 ${user.username} (${user.real_name}) 插入成功，ID: ${this.lastID || '已存在'}`);
      }
      
      userInsertCount++;
      
      // 当所有用户插入完成后，插入任务数据
      if (userInsertCount === users.length) {
        insertTasks();
      }
    });
  });
  
  function insertTasks() {
    console.log('\n=== 插入任务数据 ===\n');
    
    const tasks = [
      {
        title: '生产线设备维护检查',
        description: '对生产线主要设备进行定期维护检查，确保设备正常运行',
        priority: 'high',
        status: 'pending',
        category: '生产协调',
        assigned_to: 3, // 分配给用户ID为3的用户
        created_by: 2,  // 由经理创建
        due_date: '2025-01-15 18:00:00',
        estimated_hours: 8
      },
      {
        title: '月度生产报表整理',
        description: '整理本月生产数据，制作月度生产报表',
        priority: 'medium',
        status: 'in_progress',
        category: '综合工作',
        assigned_to: 3, // 分配给用户ID为3的用户
        created_by: 2,
        due_date: '2025-01-20 17:00:00',
        estimated_hours: 4
      },
      {
        title: '新员工培训材料准备',
        description: '为新入职员工准备培训材料和操作手册',
        priority: 'medium',
        status: 'pending',
        category: '项目管理',
        assigned_to: 4, // 分配给用户ID为4的用户
        created_by: 1,
        due_date: '2025-01-25 16:00:00',
        estimated_hours: 6
      },
      {
        title: '安全检查记录整理',
        description: '整理本周安全检查记录，上报安全部门',
        priority: 'high',
        status: 'completed',
        category: '生产协调',
        assigned_to: 3, // 分配给用户ID为3的用户
        created_by: 2,
        due_date: '2025-01-10 15:00:00',
        completed_at: '2025-01-09 14:30:00',
        estimated_hours: 2,
        actual_hours: 1.5
      }
    ];
    
    let taskInsertCount = 0;
    
    tasks.forEach((task, index) => {
      const insertTaskSql = `
        INSERT INTO tasks (
          title, description, priority, status, category, 
          assigned_to, created_by, due_date, estimated_hours, 
          actual_hours, completed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;
      
      db.run(insertTaskSql, [
        task.title, task.description, task.priority, task.status, task.category,
        task.assigned_to, task.created_by, task.due_date, task.estimated_hours,
        task.actual_hours || null, task.completed_at || null
      ], function(err) {
        if (err) {
          console.error(`插入任务 "${task.title}" 失败:`, err.message);
        } else {
          console.log(`✅ 任务 "${task.title}" 插入成功，ID: ${this.lastID}`);
        }
        
        taskInsertCount++;
        
        // 当所有任务插入完成后，显示统计信息
        if (taskInsertCount === tasks.length) {
          showSummary();
        }
      });
    });
  }
  
  function showSummary() {
    console.log('\n=== 数据插入完成，统计信息 ===\n');
    
    // 查询用户统计
    db.all('SELECT COUNT(*) as count FROM users', (err, result) => {
      if (!err) {
        console.log(`👥 总用户数: ${result[0].count}`);
      }
    });
    
    // 查询任务统计
    db.all('SELECT COUNT(*) as count FROM tasks', (err, result) => {
      if (!err) {
        console.log(`📋 总任务数: ${result[0].count}`);
      }
    });
    
    // 查询用户ID为3的任务
    db.all('SELECT COUNT(*) as count FROM tasks WHERE assigned_to = 3', (err, result) => {
      if (!err) {
        console.log(`🎯 分配给用户ID为3的任务数: ${result[0].count}`);
      }
      
      console.log('\n✅ 数据库初始化完成！现在用户ID为3应该能看到工作台数据了。');
      db.close();
    });
  }
  
}).catch(err => {
  console.error('初始化表结构失败:', err);
  process.exit(1);
});