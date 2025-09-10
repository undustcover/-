const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validate, userSchemas } = require('../middleware/validation');

// 用户注册
router.post('/register', 
  validate(userSchemas.register),
  authController.register
);

// 用户登录
router.post('/login', 
  validate(userSchemas.login),
  authController.login
);

// 刷新令牌
router.post('/refresh', authController.refreshToken);

// 用户登出
router.post('/logout', authController.logout);

// 获取当前用户信息
router.get('/me', 
  authenticateToken,
  authController.getCurrentUser
);

// 修改密码
router.put('/change-password', 
  authenticateToken,
  validate(userSchemas.changePassword),
  authController.changePassword
);

// 更新用户资料
router.put('/profile', 
  authenticateToken,
  validate(userSchemas.updateProfile),
  authController.updateProfile
);

module.exports = router;