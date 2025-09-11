const express = require('express')
const router = express.Router()
const taskController = require('../controllers/taskController')
const { authenticateToken, requireManager } = require('../middleware/auth')
const { validate, taskSchemas, querySchemas } = require('../middleware/validation')

// 所有路由都需要认证
router.use(authenticateToken)

// 创建任务
router.post('/', 
  validate(taskSchemas.create),
  taskController.createTask
)

// 获取任务列表
router.get('/', 
  validate(querySchemas.pagination, 'query'),
  validate(querySchemas.taskFilter, 'query'),
  taskController.getTasks
)

// 获取任务统计信息
router.get('/stats', taskController.getTaskStats)

// 最近活动（基于任务日志）
router.get('/recent-activities', 
  validate(querySchemas.pagination, 'query'),
  taskController.getRecentActivities
)

// 获取任务详情
router.get('/:id', taskController.getTaskById)

// 更新任务
router.put('/:id', 
  validate(taskSchemas.update),
  taskController.updateTask
)

// 删除任务
router.delete('/:id', taskController.deleteTask)

// 转移任务
router.post('/:id/transfer', 
  validate(taskSchemas.transfer),
  taskController.transferTask
)

// 申请延期
router.post('/:id/extend', 
  validate(taskSchemas.extend),
  taskController.requestExtension
)

// 获取任务操作日志
router.get('/:id/logs', 
  validate(querySchemas.pagination, 'query'),
  taskController.getTaskLogs
)

// 获取任务评论
router.get('/:id/comments', taskController.getTaskComments)

// 添加任务评论
router.post('/:id/comments', 
  validate(taskSchemas.addComment),
  taskController.addTaskComment
)

// 获取甘特图数据
router.get('/gantt/data', taskController.getGanttData)

// 批量更新任务时间
router.put('/gantt/batch-update', taskController.batchUpdateTaskDates)

module.exports = router