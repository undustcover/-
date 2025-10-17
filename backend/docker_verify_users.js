const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('=== 验证Docker容器中的用户数据 ===\n');

// 数据库文件路径
const dbPath = path.join(__dirname, 'data', 'test.db');

console.log('数据库路径:', dbPath);

// 连接数据库
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('连接数据库失败:', err.message);
        return;
    }
    console.log('成功连接到SQLite数据库\n');
});

// 查询所有用户
db.all('SELECT id, username, real_name, email, role, position, created_at FROM users ORDER BY id', (err, users) => {
    if (err) {
        console.error('查询用户失败:', err.message);
        return;
    }
    
    console.log(`📊 Docker容器中共有 ${users.length} 个用户:\n`);
    
    // 显示前10个用户信息
    const displayUsers = users.slice(0, 10);
    displayUsers.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id} | 用户名: ${user.username} | 姓名: ${user.real_name} | 角色: ${user.role}`);
    });
    
    if (users.length > 10) {
        console.log(`... 还有 ${users.length - 10} 个用户\n`);
    } else {
        console.log('');
    }
    
    // 检查关键用户
    const keyUsers = ['mali', 'xuhy', 'jingxd', 'xubo'];
    console.log('🔍 检查关键用户:');
    
    keyUsers.forEach(username => {
        const user = users.find(u => u.username === username);
        if (user) {
            console.log(`✅ ${username} - 存在 (${user.real_name}, ${user.role})`);
        } else {
            console.log(`❌ ${username} - 不存在`);
        }
    });
    
    // 统计角色分布
    const roleStats = {};
    users.forEach(user => {
        roleStats[user.role] = (roleStats[user.role] || 0) + 1;
    });
    
    console.log('\n📈 角色分布统计:');
    Object.entries(roleStats).forEach(([role, count]) => {
        console.log(`   ${role}: ${count} 人`);
    });
    
    // 关闭数据库连接
    db.close((err) => {
        if (err) {
            console.error('关闭数据库连接失败:', err.message);
        } else {
            console.log('\n✅ Docker容器用户数据验证完成');
        }
    });
});