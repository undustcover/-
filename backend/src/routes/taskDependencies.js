const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const taskDependencyController = require('../controllers/taskDependencyController');
const { authenticateToken } = require('../middleware/auth');

// 验证规则
const createDependencyValidation = [
  body('predecessor_id')
    .isInt({ min: 1 })
    .withMessage('前置任务ID必须是正整数'),
  body('successor_id')
    .isInt({ min: 1 })
    .withMessage('后续任务ID必须是正整数'),
  body('type')
    .optional()
    .isIn(['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'])
    .withMessage('依赖类型必须是有效值'),
  body('lag')
    .optional()
    .isInt({ min: -365, max: 365 })
    .withMessage('延迟天数必须在-365到365之间')
];

const updateDependencyValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('依赖关系ID必须是正整数'),
  body('dependency_type')
    .optional()
    .isIn(['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'])
    .withMessage('依赖类型必须是有效值'),
  body('lag_days')
    .optional()
    .isInt({ min: -365, max: 365 })
    .withMessage('延迟天数必须在-365到365之间')
];

const taskIdValidation = [
  param('taskId')
    .isInt({ min: 1 })
    .withMessage('任务ID必须是正整数')
];

const projectIdValidation = [
  param('projectId')
    .isInt({ min: 1 })
    .withMessage('项目ID必须是正整数')
];

const dependencyIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('依赖关系ID必须是正整数')
];

// 路由定义

// 创建任务依赖关系
router.post('/', 
  authenticateToken, 
  createDependencyValidation, 
  taskDependencyController.createDependency
);

// 获取任务的依赖关系
router.get('/task/:taskId', 
  authenticateToken, 
  taskIdValidation, 
  taskDependencyController.getTaskDependencies
);

// 获取项目的所有依赖关系
router.get('/project/:projectId', 
  authenticateToken, 
  projectIdValidation, 
  taskDependencyController.getProjectDependencies
);

// 更新依赖关系
router.put('/:id', 
  authenticateToken, 
  updateDependencyValidation, 
  taskDependencyController.updateDependency
);

// 删除依赖关系
router.delete('/:id', 
  authenticateToken, 
  dependencyIdValidation, 
  taskDependencyController.deleteDependency
);

// 删除任务的所有依赖关系
router.delete('/task/:taskId', 
  authenticateToken, 
  taskIdValidation, 
  taskDependencyController.deleteTaskDependencies
);

module.exports = router;