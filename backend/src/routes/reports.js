const express = require('express');
const router = express.Router();
const { authenticateToken, requireManager } = require('../middleware/auth');
const { query } = require('../config/database');

// 所有路由都需要认证
router.use(authenticateToken);

// 获取任务统计报表
router.get('/tasks/stats', requireManager, async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      department,
      user_id
    } = req.query;
    
    let whereConditions = ['t.status != "deleted"'];
    let params = [];
    
    if (start_date) {
      whereConditions.push('t.created_at >= ?');
      params.push(start_date);
    }
    
    if (end_date) {
      whereConditions.push('t.created_at <= ?');
      params.push(end_date);
    }
    
    if (department) {
      whereConditions.push('u.department = ?');
      params.push(department);
    }
    
    if (user_id) {
      whereConditions.push('(t.assigned_to = ? OR t.created_by = ?)');
      params.push(user_id, user_id);
    }
    
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    
    // 基础统计
    const basicStatsSql = `
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN t.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_tasks,
        SUM(CASE WHEN t.priority = 'urgent' THEN 1 ELSE 0 END) as urgent_tasks,
        SUM(CASE WHEN t.due_date < NOW() AND t.status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END) as overdue_tasks,
        AVG(CASE WHEN t.status = 'completed' AND t.estimated_hours > 0 THEN t.actual_hours / t.estimated_hours * 100 ELSE NULL END) as avg_completion_rate
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      ${whereClause}
    `;
    
    const basicStats = await query(basicStatsSql, params);
    
    // 按优先级统计
    const priorityStatsSql = `
      SELECT 
        t.priority,
        COUNT(*) as count,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      ${whereClause}
      GROUP BY t.priority
    `;
    
    const priorityStats = await query(priorityStatsSql, params);
    
    // 按状态统计
    const statusStatsSql = `
      SELECT 
        t.status,
        COUNT(*) as count
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      ${whereClause}
      GROUP BY t.status
    `;
    
    const statusStats = await query(statusStatsSql, params);
    
    // 按用户统计
    const userStatsSql = `
      SELECT 
        u.id,
        u.real_name,
        u.department,
        COUNT(t.id) as assigned_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN t.status = 'overdue' THEN 1 ELSE 0 END) as overdue_tasks
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assigned_to AND t.status != 'deleted'
      WHERE u.status = 'active'
      GROUP BY u.id, u.real_name, u.department
      HAVING assigned_tasks > 0
      ORDER BY assigned_tasks DESC
    `;
    
    const userStats = await query(userStatsSql);
    
    res.json({
      message: '获取任务统计报表成功',
      data: {
        basic_stats: basicStats[0],
        priority_stats: priorityStats,
        status_stats: statusStats,
        user_stats: userStats
      }
    });
  } catch (error) {
    console.error('获取任务统计报表错误:', error);
    res.status(500).json({ error: '获取任务统计报表失败' });
  }
});

// 获取任务趋势报表
router.get('/tasks/trends', requireManager, async (req, res) => {
  try {
    const {
      period = 'week', // week, month, quarter
      start_date,
      end_date
    } = req.query;
    
    let dateFormat, dateInterval;
    switch (period) {
      case 'week':
        dateFormat = '%Y-%u';
        dateInterval = 'WEEK';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        dateInterval = 'MONTH';
        break;
      case 'quarter':
        dateFormat = '%Y-Q%q';
        dateInterval = 'QUARTER';
        break;
      default:
        dateFormat = '%Y-%m-%d';
        dateInterval = 'DAY';
    }
    
    let whereConditions = ['status != "deleted"'];
    let params = [];
    
    if (start_date) {
      whereConditions.push('created_at >= ?');
      params.push(start_date);
    }
    
    if (end_date) {
      whereConditions.push('created_at <= ?');
      params.push(end_date);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // 任务创建趋势
    const creationTrendSql = `
      SELECT 
        DATE_FORMAT(created_at, '${dateFormat}') as period,
        COUNT(*) as created_count
      FROM tasks
      ${whereClause}
      GROUP BY DATE_FORMAT(created_at, '${dateFormat}')
      ORDER BY period
    `;
    
    const creationTrend = await query(creationTrendSql, params);
    
    // 任务完成趋势
    const completionTrendSql = `
      SELECT 
        DATE_FORMAT(updated_at, '${dateFormat}') as period,
        COUNT(*) as completed_count
      FROM tasks
      WHERE status = 'completed' ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
      GROUP BY DATE_FORMAT(updated_at, '${dateFormat}')
      ORDER BY period
    `;
    
    const completionTrend = await query(completionTrendSql, params);
    
    res.json({
      message: '获取任务趋势报表成功',
      data: {
        creation_trend: creationTrend,
        completion_trend: completionTrend
      }
    });
  } catch (error) {
    console.error('获取任务趋势报表错误:', error);
    res.status(500).json({ error: '获取任务趋势报表失败' });
  }
});

// 获取部门绩效报表
router.get('/departments/performance', requireManager, async (req, res) => {
  try {
    const {
      start_date,
      end_date
    } = req.query;
    
    let whereConditions = ['t.status != "deleted"'];
    let params = [];
    
    if (start_date) {
      whereConditions.push('t.created_at >= ?');
      params.push(start_date);
    }
    
    if (end_date) {
      whereConditions.push('t.created_at <= ?');
      params.push(end_date);
    }
    
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    
    const sql = `
      SELECT 
        u.department,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN t.due_date < NOW() AND t.status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END) as overdue_tasks,
        AVG(CASE WHEN t.status = 'completed' THEN DATEDIFF(t.updated_at, t.created_at) ELSE NULL END) as avg_completion_days,
        ROUND(SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) / COUNT(t.id) * 100, 2) as completion_rate
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      ${whereClause} AND u.department IS NOT NULL
      GROUP BY u.department
      ORDER BY completion_rate DESC
    `;
    
    const departmentStats = await query(sql, params);
    
    res.json({
      message: '获取部门绩效报表成功',
      data: departmentStats
    });
  } catch (error) {
    console.error('获取部门绩效报表错误:', error);
    res.status(500).json({ error: '获取部门绩效报表失败' });
  }
});

// 获取个人绩效报表
router.get('/users/performance', async (req, res) => {
  try {
    const {
      user_id,
      start_date,
      end_date
    } = req.query;
    
    // 管理员、超级管理员、经理可查看任意用户绩效；其他用户仅能查看自己的绩效
    const targetUserId = (req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'manager') 
      ? (user_id || req.user.id) 
      : req.user.id;
    
    let whereConditions = ['t.assigned_to = ?', 't.status != "deleted"'];
    let params = [targetUserId];
    
    if (start_date) {
      whereConditions.push('t.created_at >= ?');
      params.push(start_date);
    }
    
    if (end_date) {
      whereConditions.push('t.created_at <= ?');
      params.push(end_date);
    }
    
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    
    // 基础统计
    const basicStatsSql = `
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN t.due_date < NOW() AND t.status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END) as overdue_tasks,
        AVG(CASE WHEN t.status = 'completed' THEN DATEDIFF(t.updated_at, t.created_at) ELSE NULL END) as avg_completion_days,
        SUM(CASE WHEN t.status = 'completed' THEN t.actual_hours ELSE 0 END) as total_work_hours
      FROM tasks t
      ${whereClause}
    `;
    
    const basicStats = await query(basicStatsSql, params);
    
    // 按优先级完成情况
    const priorityStatsSql = `
      SELECT 
        t.priority,
        COUNT(*) as total_count,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count
      FROM tasks t
      ${whereClause}
      GROUP BY t.priority
    `;
    
    const priorityStats = await query(priorityStatsSql, params);
    
    // 月度完成趋势
    const monthlyTrendSql = `
      SELECT 
        DATE_FORMAT(t.updated_at, '%Y-%m') as month,
        COUNT(*) as completed_count
      FROM tasks t
      ${whereClause} AND t.status = 'completed'
      GROUP BY DATE_FORMAT(t.updated_at, '%Y-%m')
      ORDER BY month
    `;
    
    const monthlyTrend = await query(monthlyTrendSql, params);
    
    res.json({
      message: '获取个人绩效报表成功',
      data: {
        basic_stats: basicStats[0],
        priority_stats: priorityStats,
        monthly_trend: monthlyTrend
      }
    });
  } catch (error) {
    console.error('获取个人绩效报表错误:', error);
    res.status(500).json({ error: '获取个人绩效报表失败' });
  }
});

// 导出报表数据（CSV格式）
router.get('/export/tasks', requireManager, async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      status,
      department
    } = req.query;
    
    let whereConditions = ['t.status != "deleted"'];
    let params = [];
    
    if (start_date) {
      whereConditions.push('t.created_at >= ?');
      params.push(start_date);
    }
    
    if (end_date) {
      whereConditions.push('t.created_at <= ?');
      params.push(end_date);
    }
    
    if (status) {
      whereConditions.push('t.status = ?');
      params.push(status);
    }
    
    if (department) {
      whereConditions.push('u.department = ?');
      params.push(department);
    }
    
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    
    const sql = `
      SELECT 
        t.id as '任务ID',
        t.title as '任务标题',
        t.description as '任务描述',
        t.priority as '优先级',
        t.status as '状态',
        t.category as '分类',
        creator.real_name as '创建人',
        assignee.real_name as '负责人',
        assignee.department as '部门',
        t.estimated_hours as '预估工时',
        t.actual_hours as '实际工时',
        t.progress as '进度',
        t.due_date as '截止日期',
        t.created_at as '创建时间',
        t.updated_at as '更新时间'
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      LEFT JOIN users u ON t.assigned_to = u.id
      ${whereClause}
      ORDER BY t.created_at DESC
    `;
    
    const tasks = await query(sql, params);
    
    // 转换为CSV格式
    const csvHeader = Object.keys(tasks[0] || {}).join(',');
    const csvRows = tasks.map(task => 
      Object.values(task).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="tasks_export_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send('\uFEFF' + csvContent); // 添加BOM以支持中文
  } catch (error) {
    console.error('导出报表错误:', error);
    res.status(500).json({ error: '导出报表失败' });
  }
});

module.exports = router;