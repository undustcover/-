const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin, requireManager } = require('../middleware/auth');
const { validate, userSchemas, querySchemas } = require('../middleware/validation');

// 所有路由都需要认证
router.use(authenticateToken);

// 获取用于任务分配的用户列表（所有认证用户可访问）
router.get('/for-assignment', async (req, res) => {
  try {
    const {
      keyword,
      limit = 50
    } = req.query;
    
    let whereConditions = ['status = "active"', 'role != "admin"'];
    let params = [];
    
    if (keyword) {
      whereConditions.push('(username LIKE ? OR real_name LIKE ?)');
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm);
    }
    
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    
    // 获取用户数据（只返回必要字段）
    const sql = `
      SELECT id, username, real_name, department, position, avatar
      FROM users 
      ${whereClause}
      ORDER BY real_name
      LIMIT ?
    `;
    
    params.push(parseInt(limit));
    const users = await query(sql, params);
    
    res.json({
      message: '获取用户列表成功',
      users
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// 获取用户列表（管理员和经理可访问）
router.get('/', 
  requireManager,
  validate(querySchemas.pagination, 'query'),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'created_at',
        order = 'desc',
        status,
        role,
        department,
        keyword
      } = req.query;
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        order,
        status,
        role,
        department,
        keyword
      };
      
      const result = await User.getList(options);
      
      res.json({
        message: '获取用户列表成功',
        ...result
      });
    } catch (error) {
      console.error('获取用户列表错误:', error);
      res.status(500).json({ error: '获取用户列表失败' });
    }
  }
);

// 创建用户（仅管理员）
router.post('/', 
  requireAdmin,
  validate(userSchemas.register),
  async (req, res) => {
    try {
      const { username, email, password, real_name, department, position, phone, role } = req.body;
      
      // 检查用户名是否已存在
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: '用户名已存在' });
      }
      
      // 检查邮箱是否已存在
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: '邮箱已被注册' });
      }
      
      // 创建用户
      const userId = await User.create({
        username,
        email,
        password,
        real_name,
        department,
        position,
        phone,
        role: role || 'employee'
      });
      
      // 获取创建的用户信息（不包含密码）
      const user = await User.findById(userId);
      delete user.password;
      
      res.status(201).json({
        message: '用户创建成功',
        user
      });
    } catch (error) {
      console.error('创建用户错误:', error);
      res.status(500).json({ error: '创建用户失败' });
    }
  }
);

// 获取用户详情
router.get('/:id', 
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // 权限检查：只能查看自己的信息，或者管理员/经理可以查看所有用户
      if (
        req.user.id !== parseInt(id) &&
        req.user.role !== 'admin' &&
        req.user.role !== 'super_admin' &&
        req.user.role !== 'manager'
      ) {
        return res.status(403).json({ error: '无权查看此用户信息' });
      }
      
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }
      
      delete user.password;
      
      res.json({
        message: '获取用户详情成功',
        user
      });
    } catch (error) {
      console.error('获取用户详情错误:', error);
      res.status(500).json({ error: '获取用户详情失败' });
    }
  }
);

// 更新用户信息
router.put('/:id', 
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // 权限检查：只能更新自己的信息，或者管理员可以更新所有用户
      if (
        req.user.id !== parseInt(id) &&
        req.user.role !== 'admin' &&
        req.user.role !== 'super_admin'
      ) {
        return res.status(403).json({ error: '无权修改此用户信息' });
      }
      
      // 验证输入数据
      const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
      const validationSchema = isAdmin ? userSchemas.updateUserByAdmin : userSchemas.updateProfile;
      
      const { error } = validationSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }
      
      // 如果是管理员，可以修改角色和状态
      if (isAdmin) {
        if (req.body.role !== undefined) updateData.role = req.body.role;
        if (req.body.status !== undefined) updateData.status = req.body.status;
      }
      
      const success = await User.update(id, updateData);
      if (!success) {
        return res.status(404).json({ error: '用户不存在' });
      }
      
      // 获取更新后的用户信息
      const user = await User.findById(id);
      delete user.password;
      
      res.json({
        message: '用户信息更新成功',
        user
      });
    } catch (error) {
      console.error('更新用户信息错误:', error);
      res.status(500).json({ error: error.message || '更新用户信息失败' });
    }
  }
);

// 删除用户（仅管理员）
router.delete('/:id', 
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      console.log('收到删除用户请求:', { id, user: req.user });
      
      let targetUser;
      // 检查id是否为数字（用户ID）还是字符串（用户名）
      if (/^\d+$/.test(id)) {
        // 数字ID
        console.log('通过ID查找用户:', id);
        targetUser = await User.findById(parseInt(id));
      } else {
        // 用户名
        console.log('通过用户名查找用户:', id);
        targetUser = await User.findByUsername(id);
      }
      
      if (!targetUser) {
        console.log('用户不存在:', id);
        return res.status(404).json({ error: '用户不存在' });
      }
      
      console.log('找到目标用户:', targetUser);
      
      // 不能删除自己
      if (req.user.id === targetUser.id) {
        console.log('尝试删除自己的账户');
        return res.status(400).json({ error: '不能删除自己的账户' });
      }
      
      console.log('开始删除用户:', targetUser.id);
      const success = await User.delete(targetUser.id);
      console.log('删除结果:', success);
      if (!success) {
        return res.status(500).json({ error: '删除用户失败' });
      }
      
      console.log('用户删除成功');
      res.json({ message: '用户删除成功' });
    } catch (error) {
      console.error('删除用户错误:', error);
      res.status(500).json({ error: '删除用户失败' });
    }
  }
);

// 获取用户统计信息（管理员和经理可访问）
router.get('/stats/overview', 
  requireManager,
  async (req, res) => {
    try {
      const stats = await User.getStats();
      
      res.json({
        message: '获取用户统计成功',
        stats
      });
    } catch (error) {
      console.error('获取用户统计错误:', error);
      res.status(500).json({ error: '获取用户统计失败' });
    }
  }
);

// 重置用户密码（仅管理员）
router.post('/:id/reset-password', 
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: '新密码至少6个字符' });
      }
      
      const success = await User.updatePassword(id, newPassword);
      if (!success) {
        return res.status(404).json({ error: '用户不存在' });
      }
      
      res.json({ message: '密码重置成功' });
    } catch (error) {
      console.error('重置密码错误:', error);
      res.status(500).json({ error: '重置密码失败' });
    }
  }
);

module.exports = router;