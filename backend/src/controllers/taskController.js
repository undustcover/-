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
      due_date,
      assigned_to,
      assignee_id,
      category,
      tags,
      estimated_hours,
      status // 获取 status
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
      due_date,
      assigned_to: finalAssignedTo,
      created_by,
      category,
      tags,
      estimated_hours,
      status // 传递 status
    });
    
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
      page = 1,
      limit = 10,
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
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
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
    
    // 如果不是管理员，只能查看自己相关的任务
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
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
    
    // 权限检查：只有任务创建者、负责人或管理员可以查看
    if (
      req.user.role !== 'admin' && 
      req.user.role !== 'super_admin' &&
      task.created_by !== req.user.id &&
      task.assigned_to !== req.user.id
    ) {
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
    
    // 权限检查：只有任务创建者、负责人或管理员可以更新
    if (
      req.user.role !== 'admin' && 
      req.user.role !== 'super_admin' &&
      task.created_by !== req.user.id &&
      task.assigned_to !== req.user.id
    ) {
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
    
    // 权限检查：只有任务创建者或管理员可以删除
    if (
      req.user.role !== 'admin' && 
      req.user.role !== 'super_admin' &&
      task.created_by !== req.user.id
    ) {
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
    
    // 权限检查：只有任务创建者、负责人或管理员可以查看日志
    if (
      req.user.role !== 'admin' && 
      req.user.role !== 'super_admin' &&
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
  addTaskComment
};