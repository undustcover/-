const Milestone = require('../models/Milestone');
const Task = require('../models/Task');

// 创建里程碑
const createMilestone = async (req, res) => {
  try {
    const {
      task_id,
      title,
      description,
      target_date,
      reminder_days
    } = req.body;
    
    const created_by = req.user.id;
    
    // 验证必填字段
    if (!task_id || !title || !target_date) {
      return res.status(400).json({ 
        success: false,
        error: '任务ID、标题和目标日期为必填项' 
      });
    }
    
    // 检查任务是否存在
    const task = await Task.findById(task_id);
    if (!task) {
      return res.status(404).json({ 
        success: false,
        error: '指定的任务不存在' 
      });
    }
    
    const milestoneId = await Milestone.create({
      task_id,
      title,
      description,
      target_date,
      reminder_days,
      created_by
    });
    
    // 获取创建的里程碑详情
    const milestone = await Milestone.findById(milestoneId);
    
    res.status(201).json({
      success: true,
      message: '里程碑创建成功',
      data: milestone
    });
  } catch (error) {
    console.error('创建里程碑失败:', error);
    res.status(500).json({ 
      success: false,
      error: '创建里程碑失败' 
    });
  }
};

// 获取任务的里程碑列表
const getMilestonesByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // 检查任务是否存在
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ 
        success: false,
        error: '任务不存在' 
      });
    }
    
    const milestones = await Milestone.findByTaskId(taskId);
    
    res.json({
      success: true,
      data: milestones
    });
  } catch (error) {
    console.error('获取里程碑列表失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取里程碑列表失败' 
    });
  }
};

// 根据ID获取里程碑详情
const getMilestoneById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const milestone = await Milestone.findById(id);
    if (!milestone) {
      return res.status(404).json({ 
        success: false,
        error: '里程碑不存在' 
      });
    }
    
    res.json({
      success: true,
      data: milestone
    });
  } catch (error) {
    console.error('获取里程碑详情失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取里程碑详情失败' 
    });
  }
};

// 更新里程碑
const updateMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      target_date,
      is_achieved,
      achieved_date,
      reminder_days
    } = req.body;
    
    // 检查里程碑是否存在
    const existingMilestone = await Milestone.findById(id);
    if (!existingMilestone) {
      return res.status(404).json({ 
        success: false,
        error: '里程碑不存在' 
      });
    }
    
    const success = await Milestone.update(id, {
      title,
      description,
      target_date,
      is_achieved,
      achieved_date,
      reminder_days
    });
    
    if (!success) {
      return res.status(400).json({ 
        success: false,
        error: '更新里程碑失败' 
      });
    }
    
    // 获取更新后的里程碑详情
    const milestone = await Milestone.findById(id);
    
    res.json({
      success: true,
      message: '里程碑更新成功',
      data: milestone
    });
  } catch (error) {
    console.error('更新里程碑失败:', error);
    res.status(500).json({ 
      success: false,
      error: '更新里程碑失败' 
    });
  }
};

// 标记里程碑为已达成
const markMilestoneAsAchieved = async (req, res) => {
  try {
    const { id } = req.params;
    const { achieved_date } = req.body;
    
    // 检查里程碑是否存在
    const existingMilestone = await Milestone.findById(id);
    if (!existingMilestone) {
      return res.status(404).json({ 
        success: false,
        error: '里程碑不存在' 
      });
    }
    
    const success = await Milestone.markAsAchieved(id, achieved_date);
    
    if (!success) {
      return res.status(400).json({ 
        success: false,
        error: '标记里程碑失败' 
      });
    }
    
    // 获取更新后的里程碑详情
    const milestone = await Milestone.findById(id);
    
    res.json({
      success: true,
      message: '里程碑已标记为达成',
      data: milestone
    });
  } catch (error) {
    console.error('标记里程碑失败:', error);
    res.status(500).json({ 
      success: false,
      error: '标记里程碑失败' 
    });
  }
};

// 删除里程碑
const deleteMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查里程碑是否存在
    const existingMilestone = await Milestone.findById(id);
    if (!existingMilestone) {
      return res.status(404).json({ 
        success: false,
        error: '里程碑不存在' 
      });
    }
    
    const success = await Milestone.delete(id);
    
    if (!success) {
      return res.status(400).json({ 
        success: false,
        error: '删除里程碑失败' 
      });
    }
    
    res.json({
      success: true,
      message: '里程碑删除成功'
    });
  } catch (error) {
    console.error('删除里程碑失败:', error);
    res.status(500).json({ 
      success: false,
      error: '删除里程碑失败' 
    });
  }
};

// 获取即将到期的里程碑
const getUpcomingMilestones = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const milestones = await Milestone.getUpcoming(parseInt(days));
    
    res.json({
      success: true,
      data: milestones
    });
  } catch (error) {
    console.error('获取即将到期里程碑失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取即将到期里程碑失败' 
    });
  }
};

// 获取逾期的里程碑
const getOverdueMilestones = async (req, res) => {
  try {
    const milestones = await Milestone.getOverdue();
    
    res.json({
      success: true,
      data: milestones
    });
  } catch (error) {
    console.error('获取逾期里程碑失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取逾期里程碑失败' 
    });
  }
};

module.exports = {
  createMilestone,
  getMilestonesByTaskId,
  getMilestoneById,
  updateMilestone,
  markMilestoneAsAchieved,
  deleteMilestone,
  getUpcomingMilestones,
  getOverdueMilestones
};