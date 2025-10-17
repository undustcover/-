const { db } = require('./src/config/sqlite');

console.log('=== 验证用户注册情况 ===\n');

// 查询所有用户
db.all('SELECT id, username, real_name, email, role, position, created_at FROM users ORDER BY id', (err, users) => {
    if (err) {
        console.error('查询用户失败:', err.message);
        return;
    }
    
    console.log(`📊 数据库中共有 ${users.length} 个用户:\n`);
    
    // 显示所有用户信息
    users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   用户名: ${user.username}`);
        console.log(`   真实姓名: ${user.real_name}`);
        console.log(`   邮箱: ${user.email}`);
        console.log(`   角色: ${user.role}`);
        console.log(`   岗位: ${user.position}`);
        console.log(`   创建时间: ${user.created_at}`);
        console.log('---');
    });
    
    // 检查特定用户
    const targetUsers = ['mali', 'mali222', 'xuhy', 'jingxd'];
    console.log('\n🔍 检查特定用户:');
    
    targetUsers.forEach(username => {
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
            console.log('\n✅ 用户验证完成，数据库连接已关闭');
        }
    });
});