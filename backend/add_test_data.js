const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/test.db');

db.serialize(() => {
  const tasks = [
    {title: '项目启动', start_date: '2024-01-15', due_date: '2024-01-20', status: 'completed', progress: 100, assigned_to: 1, created_by: 1, category: '项目管理'},
    {title: '需求分析', start_date: '2024-01-21', due_date: '2024-01-30', status: 'completed', progress: 100, assigned_to: 2, created_by: 1, category: '综合工作'},
    {title: '系统设计', start_date: '2024-02-01', due_date: '2024-02-15', status: 'in_progress', progress: 60, assigned_to: 1, created_by: 1, category: '项目管理'},
    {title: '前端开发', start_date: '2024-02-16', due_date: '2024-03-15', status: 'pending', progress: 0, assigned_to: 3, created_by: 1, category: '生产协调'},
    {title: '后端开发', start_date: '2024-02-16', due_date: '2024-03-10', status: 'pending', progress: 0, assigned_to: 2, created_by: 1, category: '生产协调'}
  ];
  
  tasks.forEach(task => {
    db.run('INSERT INTO tasks (title, start_date, due_date, status, progress, assigned_to, created_by, category, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))', 
      [task.title, task.start_date, task.due_date, task.status, task.progress, task.assigned_to, task.created_by, task.category],
      function(err) {
        if (err) {
          console.error('插入任务失败:', err.message);
        } else {
          console.log('插入任务成功:', task.title);
        }
      }
    );
  });
  
  setTimeout(() => {
    console.log('测试任务数据添加完成');
    db.close();
  }, 1000);
});