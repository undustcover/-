const express = require('express');
const router = express.Router();
const milestoneController = require('../controllers/milestoneController');
const { authenticateToken } = require('../middleware/auth');
const { validate, milestoneSchemas } = require('../middleware/validation');

// 所有路由都需要认证
router.use(authenticateToken);



// 创建里程碑
router.post('/', 
  validate(milestoneSchemas.create),
  milestoneController.createMilestone
);

// 获取即将到期的里程碑
router.get('/upcoming', milestoneController.getUpcomingMilestones);

// 获取逾期的里程碑
router.get('/overdue', milestoneController.getOverdueMilestones);

// 根据任务ID获取里程碑列表
router.get('/task/:taskId', milestoneController.getMilestonesByTaskId);

// 获取里程碑详情
router.get('/:id', milestoneController.getMilestoneById);

// 更新里程碑
router.put('/:id', 
  validate(milestoneSchemas.update),
  milestoneController.updateMilestone
);

// 标记里程碑为已达成
router.post('/:id/achieve', 
  milestoneController.markMilestoneAsAchieved
);

// 删除里程碑
router.delete('/:id', milestoneController.deleteMilestone);

module.exports = router;