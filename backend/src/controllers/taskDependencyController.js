const TaskDependency = require('../models/TaskDependency');
const { validationResult } = require('express-validator');

// 创建任务依赖关系
exports.createDependency = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    const { predecessor_id, successor_id, type, lag } = req.body;

    // 检查是否会产生循环依赖
    const hasCircular = await TaskDependency.checkCircularDependency(predecessor_id, successor_id);
    if (hasCircular) {
      return res.status(400).json({
        success: false,
        message: '不能创建循环依赖关系'
      });
    }

    const dependency = await TaskDependency.create({
      predecessor_id,
      successor_id,
      type,
      lag
    });

    res.status(201).json({
      success: true,
      message: '依赖关系创建成功',
      data: dependency
    });
  } catch (error) {
    console.error('创建依赖关系失败:', error);
    res.status(500).json({
      success: false,
      message: '创建依赖关系失败',
      error: error.message
    });
  }
};

// 获取任务的依赖关系
exports.getTaskDependencies = async (req, res) => {
  try {
    const { taskId } = req.params;
    const dependencies = await TaskDependency.getByTaskId(taskId);

    res.json({
      success: true,
      data: dependencies
    });
  } catch (error) {
    console.error('获取任务依赖关系失败:', error);
    res.status(500).json({
      success: false,
      message: '获取任务依赖关系失败',
      error: error.message
    });
  }
};

// 获取项目的所有依赖关系
exports.getProjectDependencies = async (req, res) => {
  try {
    const { projectId } = req.params;
    const dependencies = await TaskDependency.getByProjectId(projectId);

    res.json({
      success: true,
      data: dependencies
    });
  } catch (error) {
    console.error('获取项目依赖关系失败:', error);
    res.status(500).json({
      success: false,
      message: '获取项目依赖关系失败',
      error: error.message
    });
  }
};

// 更新依赖关系
exports.updateDependency = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { dependency_type, lag_days } = req.body;

    const result = await TaskDependency.update(id, {
      dependency_type,
      lag_days
    });

    if (result.updated) {
      res.json({
        success: true,
        message: '依赖关系更新成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '依赖关系不存在'
      });
    }
  } catch (error) {
    console.error('更新依赖关系失败:', error);
    res.status(500).json({
      success: false,
      message: '更新依赖关系失败',
      error: error.message
    });
  }
};

// 删除依赖关系
exports.deleteDependency = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await TaskDependency.delete(id);

    if (result.deleted) {
      res.json({
        success: true,
        message: '依赖关系删除成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '依赖关系不存在'
      });
    }
  } catch (error) {
    console.error('删除依赖关系失败:', error);
    res.status(500).json({
      success: false,
      message: '删除依赖关系失败',
      error: error.message
    });
  }
};

// 删除任务的所有依赖关系
exports.deleteTaskDependencies = async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await TaskDependency.deleteByTaskId(taskId);

    res.json({
      success: true,
      message: `删除了 ${result.deleted} 个依赖关系`
    });
  } catch (error) {
    console.error('删除任务依赖关系失败:', error);
    res.status(500).json({
      success: false,
      message: '删除任务依赖关系失败',
      error: error.message
    });
  }
};

// 函数已通过 exports.functionName 方式导出