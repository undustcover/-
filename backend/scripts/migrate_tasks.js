const { db, initTables } = require('../src/config/sqlite');

const inspectTasksSchema = () => {
  return new Promise((resolve) => {
    db.all("PRAGMA table_info('tasks')", (err, rows) => {
      if (err) {
        console.error('PRAGMA 查询失败:', err.message);
        resolve([]);
      } else {
        console.log('当前 tasks 表列:');
        rows.forEach((r) => console.log(` - ${r.name} (${r.type})`));
        resolve(rows.map((r) => r.name));
      }
    });
  });
};

(async () => {
  console.log('开始初始化并检查 tasks 表结构...');
  try {
    await initTables();
    const cols = await inspectTasksSchema();
    const needed = [
      { name: 'parent_id', sql: 'ALTER TABLE tasks ADD COLUMN parent_id INTEGER' },
      { name: 'tags', sql: 'ALTER TABLE tasks ADD COLUMN tags TEXT' },
      { name: 'category', sql: 'ALTER TABLE tasks ADD COLUMN category TEXT' }
    ];
    for (const { name, sql } of needed) {
      if (!cols.includes(name)) {
        console.log(`检测到缺失列: ${name}，正在添加...`);
        await new Promise((resolve) => {
          db.run(sql, (e) => {
            if (e) console.error(`添加列 ${name} 失败:`, e.message);
            else console.log(`列 ${name} 添加成功`);
            resolve();
          });
        });
      }
    }
    console.log('再次检查列...');
    await inspectTasksSchema();
    console.log('迁移检查完成');
  } catch (e) {
    console.error('迁移执行失败:', e);
  }
})();