const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, 'data', 'test.db');

console.log('开始清理数据库数据...');
console.log('数据库路径:', dbPath);

// 连接数据库
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('连接数据库失败:', err.message);
        return;
    }
    console.log('成功连接到SQLite数据库');
});

// 清理所有表的数据
const clearTables = [
    'DELETE FROM users',
    'DELETE FROM tasks', 
    'DELETE FROM task_assignments',
    'DELETE FROM task_comments',
    'DELETE FROM task_files',
    'DELETE FROM notifications',
    'DELETE FROM user_sessions'
];

// 执行清理操作
let completedQueries = 0;
const totalQueries = clearTables.length;

clearTables.forEach((query, index) => {
    db.run(query, function(err) {
        if (err) {
            console.error(`执行查询失败 [${index + 1}/${totalQueries}]:`, err.message);
        } else {
            console.log(`✓ 清理完成 [${index + 1}/${totalQueries}]: ${query}`);
        }
        
        completedQueries++;
        if (completedQueries === totalQueries) {
            console.log('\n数据库清理完成!');
            
            // 重置自增ID
            db.run("UPDATE sqlite_sequence SET seq = 0", (err) => {
                if (err) {
                    console.error('重置自增ID失败:', err.message);
                } else {
                    console.log('✓ 自增ID已重置');
                }
                
                // 关闭数据库连接
                db.close((err) => {
                    if (err) {
                        console.error('关闭数据库连接失败:', err.message);
                    } else {
                        console.log('数据库连接已关闭');
                    }
                });
            });
        }
    });
});