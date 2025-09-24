const Task = require('../models/Task');
const User = require('../models/User');
const { query } = require('../config/database');

// 创建任务
const createTask = async (req, res) => {
  console.log('Received request to create task with body:', req.body); // 添加日志
  try {
    const {
      title,
      description,
      priority,
      start_date,
      due_date,
      assigned_to,
      assignee_id,
      category,
      tags,
      estimated_hours,
      status, // 获取 status
      attachment_ids // 获取附件ID数组
    } = req.body;
    
    // 兼容前端字段名
    const finalAssignedTo = assigned_to || assignee_id;
    
    const created_by = req.user.id;
    
    // 如果指定了负责人，检查用户是否存在
    if (finalAssignedTo) {
      const assignee = await User.findById(finalAssignedTo);
      if (!assignee || assignee.status !== 'active') {
        return res.status(400).json({ error: '指定的负责人不存在或已被禁用' });
      }
    }
    
    const taskId = await Task.create({
      title,
      description,
      priority,
      start_date,
      due_date,
      assigned_to: finalAssignedTo,
      created_by,
      category,
      tags,
      estimated_hours,
      status // 传递 status
    });
    
    // 如果有附件，将附件关联到任务
    if (attachment_ids && attachment_ids.length > 0) {
      for (const fileId of attachment_ids) {
        await query(
          'INSERT INTO task_files (task_id, file_id, created_at) VALUES (?, ?, NOW())',
          [taskId, fileId]
        );
        
        // 更新文件表中的task_id字段
        await query(
          'UPDATE files SET task_id = ? WHERE id = ?',
          [taskId, fileId]
        );
      }
    }
    
    // 获取创建的任务详情
    const task = await Task.findById(taskId);
    
    res.status(201).json({
      message: '任务创建成功',
      task
    });
  } catch (error) {
    console.error('创建任务错误:', error);
    res.status(500).json({ error: '创建任务失败' });
  }
};

// 获取任务列表
const getTasks = async (req, res) => {
  try {
    const {
      page: pageStr = '1',
      limit: limitStr = '10',
      sort = 'created_at',
      order = 'desc',
      status,
      priority,
      assigned_to,
      created_by,
      category,
      due_date_start,
      due_date_end,
      keyword
    } = req.query;

    const page = parseInt(pageStr, 10);
    const limit = parseInt(limitStr, 10);
    
    const options = {
      page: isNaN(page) || page < 1 ? 1 : page,
      limit: isNaN(limit) || limit < 1 ? 10 : limit,
      sort,
      order,
      status,
      priority,
      assigned_to: assigned_to ? parseInt(assigned_to) : undefined,
      created_by: created_by ? parseInt(created_by) : undefined,
      category,
      due_date_start,
      due_date_end,
      keyword
    };
    
    // 如果不是管理员或经理，只能查看自己相关的任务
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.role !== 'manager') {
      if (!options.assigned_to && !options.created_by) {
        // 如果没有指定筛选条件，默认显示与自己相关的任务
        options.user_related = req.user.id;
      }
    }
    
    const result = await Task.getList(options);
    
    res.json({
      message: '获取任务列表成功',
      ...result
    });
  } catch (error) {
    console.error('获取任务列表错误:', error);
    res.status(500).json({ error: '获取任务列表失败' });
  }
};

// 获取任务详情
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }
    
    // 权限检查（需求对齐）：
    // - 管理员、超级管理员、经理：可查看所有任务
    // - 普通用户：仅可查看自己作为负责人（assigned_to/assignee）的任务
    const canView =
      req.user.role === 'admin' ||
      req.user.role === 'super_admin' ||
      req.user.role === 'manager' ||
      (req.user.role === 'user' && task.assigned_to === req.user.id);

    if (!canView) {
      return res.status(403).json({ error: '无权查看此任务' });
    }
    
    res.json({
      message: '获取任务详情成功',
      task
    });
  } catch (error) {
    console.error('获取任务详情错误:', error);
    res.status(500).json({ error: '获取任务详情失败' });
  }
};

// 更新任务
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    const userId = req.user.id;
    
    // 兼容前端字段名
    if (updateData.assignee_id !== undefined) {
      updateData.assigned_to = updateData.assignee_id;
      delete updateData.assignee_id;
    }
    
    // 获取任务信息进行权限检查
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }
    
    // 权限检查（需求对齐）：
    // - 管理员、超级管理员：可更新所有任务
    // - 经理：可更新所有任务
    // - 普通用户：仅可更新自己作为负责人（assigned_to/assignee）的任务
    const canUpdate =
      req.user.role === 'admin' ||
      req.user.role === 'super_admin' ||
      req.user.role === 'manager' ||
      (req.user.role === 'user' && task.assigned_to === req.user.id);

    if (!canUpdate) {
      return res.status(403).json({ error: '无权修改此任务' });
    }
    
    // 如果要修改负责人，检查新负责人是否存在
    if (updateData.assigned_to && updateData.assigned_to !== task.assigned_to) {
      const assignee = await User.findById(updateData.assigned_to);
      if (!assignee || assignee.status !== 'active') {
        return res.status(400).json({ error: '指定的负责人不存在或已被禁用' });
      }
    }
    
    await Task.update(id, updateData, userId);
    
    // 获取更新后的任务信息
    const updatedTask = await Task.findById(id);
    
    res.json({
      message: '任务更新成功',
      task: updatedTask
    });
  } catch (error) {
    console.error('更新任务错误:', error);
    res.status(500).json({ error: error.message || '更新任务失败' });
  }
};

// 删除任务
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // 获取任务信息进行权限检查
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }
    
    // 权限检查：管理员可以删除任何任务；经理和普通用户只能删除自己创建的任务
    const canDelete =
      req.user.role === 'admin' ||
      req.user.role === 'super_admin' ||
      ((req.user.role === 'manager' || req.user.role === 'user') && task.created_by === req.user.id);

    if (!canDelete) {
      return res.status(403).json({ error: '无权删除此任务' });
    }
    
    await Task.delete(id, userId);
    
    res.json({ message: '任务删除成功' });
  } catch (error) {
    console.error('删除任务错误:', error);
    res.status(500).json({ error: error.message || '删除任务失败' });
  }
};

// 转移任务
const transferTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_assignee, reason } = req.body;
    const userId = req.user.id;
    
    // 获取任务信息进行权限检查
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }
    
    // 权限检查：只有任务创建者、当前负责人或管理员可以转移
    if (
      req.user.role !== 'admin' && 
      req.user.role !== 'super_admin' &&
      task.created_by !== req.user.id &&
      task.assigned_to !== req.user.id
    ) {
      return res.status(403).json({ error: '无权转移此任务' });
    }
    
    // 检查新负责人是否存在
    const newAssignee = await User.findById(new_assignee);
    if (!newAssignee || newAssignee.status !== 'active') {
      return res.status(400).json({ error: '指定的新负责人不存在或已被禁用' });
    }
    
    await Task.transfer(id, new_assignee, reason, userId);
    
    // 获取更新后的任务信息
    const updatedTask = await Task.findById(id);
    
    res.json({
      message: '任务转移成功',
      task: updatedTask
    });
  } catch (error) {
    console.error('转移任务错误:', error);
    res.status(500).json({ error: error.message || '转移任务失败' });
  }
};

// 申请延期
const requestExtension = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_due_date, reason } = req.body;
    const userId = req.user.id;
    
    // 获取任务信息进行权限检查
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }
    
    // 权限检查：只有任务负责人可以申请延期
    if (task.assigned_to !== req.user.id) {
      return res.status(403).json({ error: '只有任务负责人可以申请延期' });
    }
    
    // 检查新截止日期是否晚于当前截止日期
    if (new Date(new_due_date) <= new Date(task.due_date)) {
      return res.status(400).json({ error: '新截止日期必须晚于当前截止日期' });
    }
    
    await Task.requestExtension(id, new_due_date, reason, userId);
    
    res.json({ message: '延期申请提交成功，等待审批' });
  } catch (error) {
    console.error('申请延期错误:', error);
    res.status(500).json({ error: error.message || '申请延期失败' });
  }
};

// 获取任务统计信息
const getTaskStats = async (req, res) => {
  try {
    const userId = req.user.role === 'admin' || req.user.role === 'super_admin' ? null : req.user.id;
    const stats = await Task.getStats(userId, req.user.role);
    
    res.json({
      message: '获取任务统计成功',
      stats
    });
  } catch (error) {
    console.error('获取任务统计错误:', error);
    res.status(500).json({ error: '获取任务统计失败' });
  }
};

// 获取任务操作日志
const getTaskLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // 获取任务信息进行权限检查
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }
    
    // 权限检查：任务创建者、负责人、管理员或经理可以查看日志
    if (
      req.user.role !== 'admin' && 
      req.user.role !== 'super_admin' &&
      req.user.role !== 'manager' &&
      task.created_by !== req.user.id &&
      task.assigned_to !== req.user.id
    ) {
      return res.status(403).json({ error: '无权查看此任务的日志' });
    }
    
    const result = await Task.getLogs(id, parseInt(page), parseInt(limit));
    
    res.json({
      message: '获取任务日志成功',
      ...result
    });
  } catch (error) {
    console.error('获取任务日志错误:', error);
    res.status(500).json({ error: '获取任务日志失败' });
  }
};

// 最近活动（仅任务创建与状态变更）
const getRecentActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
    const offset = parseInt(req.query.offset || '0', 10);

    // 管理员可查看全量；其他用户仅限与其相关的任务
    let whereExtra = '';
    let params = [];

    if (role === 'admin' || role === 'super_admin') {
      whereExtra = '';
    } else {
      whereExtra = 'AND (t.created_by = ? OR t.assigned_to = ?)';
      params.push(userId, userId);
    }

    const sql = `
      SELECT 
        tl.id,
        tl.task_id,
        tl.user_id,
        tl.action,
        tl.details,
        tl.created_at,
        u.real_name AS user_name,
        IFNULL(u.avatar, '') AS user_avatar,
        t.title AS task_title,
        CASE 
          WHEN tl.action = 'create' THEN (u.real_name || ' 创建了任务「' || t.title || '」')
          WHEN tl.action = 'status_change' THEN (u.real_name || ' ' || tl.details)
          ELSE tl.details
        END AS description
      FROM task_logs tl
      LEFT JOIN users u ON tl.user_id = u.id
      LEFT JOIN tasks t ON tl.task_id = t.id
      WHERE tl.action IN ('create', 'status_change')
      ${whereExtra}
      ORDER BY tl.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = await query(sql, [...params, limit, offset]);

    res.json({
      message: '获取最近活动成功',
      activities: rows
    });
  } catch (error) {
    console.error('获取最近活动错误:', error);
    res.status(500).json({ error: '获取最近活动失败' });
  }
};

// 获取任务评论
const getTaskComments = async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await Task.getComments(id);
    res.json({
      message: '获取任务评论成功',
      comments
    });
  } catch (error) {
    console.error('获取任务评论错误:', error);
    res.status(500).json({ error: '获取任务评论失败' });
  }
};

// 添加任务评论
const addTaskComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: '评论内容不能为空' });
    }

    const newComment = await Task.addComment(id, userId, content);

    res.status(201).json({
      message: '评论添加成功',
      comment: newComment
    });
  } catch (error) {
    console.error('添加任务评论错误:', error);
    res.status(500).json({ error: '添加任务评论失败' });
  }
};

// 获取甘特图数据
const getGanttData = async (req, res) => {
  try {
    const { project_id, start_date, end_date, assignee_id, category } = req.query;
    const userId = req.user.id;
    
    let whereConditions = [];
    let params = [];
    
    // 添加权限过滤 - 与任务列表API保持一致
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.role !== 'manager') {
      whereConditions.push('(t.created_by = ? OR t.assigned_to = ?)');
      params.push(userId, userId);
    }
    
    // 项目筛选
    if (project_id) {
      whereConditions.push('t.project_id = ?');
      params.push(project_id);
    }
    
    // 负责人筛选
    if (assignee_id) {
      whereConditions.push('t.assigned_to = ?');
      params.push(assignee_id);
    }
    
    // 项目类别筛选
    if (category) {
      whereConditions.push('t.category = ?');
      params.push(category);
    }
    
    // 时间范围筛选
    if (start_date && end_date) {
      whereConditions.push('(t.start_date <= ? AND t.end_date >= ?)');
      params.push(end_date, start_date);
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    const sql = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.start_date,
        t.due_date as end_date,
        t.progress,
        t.assigned_to,
        t.created_by,
        u.real_name as assignee_name,
        creator.real_name as creator_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
      ${whereClause}
      ORDER BY t.start_date ASC, t.created_at ASC
    `;
    
    const tasks = await query(sql, params);
    
    // 获取任务依赖关系
    const TaskDependency = require('../models/TaskDependency');
    let dependencies = [];
    
    if (project_id) {
      dependencies = await TaskDependency.getByProjectId(project_id);
    } else {
      // 获取所有相关任务的依赖关系
      const taskIds = tasks.map(task => task.id);
      if (taskIds.length > 0) {
        const dependencyPromises = taskIds.map(taskId => TaskDependency.getByTaskId(taskId));
        const allDependencies = await Promise.all(dependencyPromises);
        dependencies = allDependencies.flat();
        
        // 去重
        const uniqueDependencies = [];
        const seenIds = new Set();
        dependencies.forEach(dep => {
          if (!seenIds.has(dep.id)) {
            seenIds.add(dep.id);
            uniqueDependencies.push(dep);
          }
        });
        dependencies = uniqueDependencies;
      }
    }
    
    res.json({
      success: true,
      data: {
        tasks: tasks,
        dependencies: dependencies
      }
    });
  } catch (error) {
    console.error('获取甘特图数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取甘特图数据失败',
      error: error.message
    });
  }
};

// 批量更新任务时间
const batchUpdateTaskDates = async (req, res) => {
  try {
    const { updates } = req.body; // [{ id, start_date, end_date, progress }]
    const userId = req.user.id;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '更新数据不能为空'
      });
    }
    
    const results = [];
    
    for (const update of updates) {
      const { id, start_date, end_date, progress } = update;
      
      // 检查权限
      const task = await Task.findById(id);
      if (!task) {
        results.push({ id, success: false, message: '任务不存在' });
        continue;
      }
      
      if (task.created_by !== userId && task.assigned_to !== userId) {
        results.push({ id, success: false, message: '无权限修改此任务' });
        continue;
      }
      
      try {
        await Task.update(id, {
          start_date,
          end_date,
          progress: progress !== undefined ? progress : task.progress
        });
        results.push({ id, success: true, message: '更新成功' });
      } catch (error) {
        results.push({ id, success: false, message: error.message });
      }
    }
    
    res.json({
      success: true,
      message: '批量更新完成',
      data: results
    });
  } catch (error) {
    console.error('批量更新任务时间失败:', error);
    res.status(500).json({
      success: false,
      message: '批量更新任务时间失败',
      error: error.message
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  transferTask,
  requestExtension,
  getTaskStats,
  getTaskLogs,
  getTaskComments,
  addTaskComment,
  getRecentActivities,
  getGanttData,
  batchUpdateTaskDates
};