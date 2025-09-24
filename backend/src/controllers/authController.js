const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { query } = require('../config/database');

// 生成JWT令牌
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  
  return { accessToken, refreshToken };
};

// 用户注册
const register = async (req, res) => {
  try {
    const { username, email, password, real_name, department, department_id, position, phone } = req.body;
    
    // 处理部门字段：优先使用department_id，如果没有则使用department
    const finalDepartment = department_id || department;
    
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
      department: finalDepartment,
      position,
      phone
    });
    
    // 获取创建的用户信息（不包含密码）
    const user = await User.findById(userId);
    delete user.password_hash;
    
    // 生成令牌
    const tokens = generateTokens(userId);
    
    // 保存刷新令牌到数据库
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW())',
      [userId, tokens.refreshToken]
    );
    
    res.status(201).json({
      message: '注册成功',
      user,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败' });
  }
};

// 用户登录
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 查找用户
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    // 检查用户状态
    if (user.status !== 'active') {
      return res.status(401).json({ error: '账户已被禁用' });
    }
    
    // 验证密码
    const isValidPassword = await User.validatePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    // 更新最后登录时间
    await User.updateLastLogin(user.id);
    
    // 生成令牌
    const tokens = generateTokens(user.id);
    
    // 保存刷新令牌到数据库
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW())',
      [user.id, tokens.refreshToken]
    );
    
    // 删除密码字段
    delete user.password_hash;
    
    res.json({
      message: '登录成功',
      user,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
};

// 刷新令牌
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: '刷新令牌缺失' });
    }
    
    // 验证刷新令牌
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({ error: '无效的刷新令牌' });
    }
    
    // 检查刷新令牌是否在数据库中存在且未过期
    const tokenRecord = await query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ? AND expires_at > datetime(\'now\')',
      [refreshToken, decoded.userId]
    );
    
    if (tokenRecord.length === 0) {
      return res.status(401).json({ error: '刷新令牌已过期或无效' });
    }
    
    // 检查用户是否存在且状态正常
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: '用户不存在或已被禁用' });
    }
    
    // 生成新的令牌
    const newTokens = generateTokens(decoded.userId);
    
    // 删除旧的刷新令牌
    await query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    
    // 保存新的刷新令牌
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW())',
      [decoded.userId, newTokens.refreshToken]
    );
    
    res.json({
      message: '令牌刷新成功',
      ...newTokens
    });
  } catch (error) {
    console.error('刷新令牌错误:', error);
    res.status(500).json({ error: '令牌刷新失败' });
  }
};

// 用户登出
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // 删除刷新令牌
      await query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }
    
    res.json({ message: '登出成功' });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({ error: '登出失败' });
  }
};

// 获取当前用户信息
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    delete user.password_hash;
    res.json({ user });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
};

// 修改密码
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // 获取用户当前密码
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 验证旧密码
    const isValidPassword = await User.validatePassword(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: '原密码错误' });
    }
    
    // 更新密码
    await User.updatePassword(userId, newPassword);
    
    // 删除所有刷新令牌（强制重新登录）
    await query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
    
    res.json({ message: '密码修改成功，请重新登录' });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ error: '修改密码失败' });
  }
};

// 更新用户资料
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { real_name, department, position, phone, avatar, location, join_date } = req.body;
    
    const updateData = {};
    if (real_name !== undefined) updateData.real_name = real_name;
    if (department !== undefined) updateData.department = department;
    if (position !== undefined) updateData.position = position;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (location !== undefined) updateData.location = location;
    if (join_date !== undefined) updateData.join_date = join_date;
    
    const success = await User.update(userId, updateData);
    if (!success) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 获取更新后的用户信息
    const user = await User.findById(userId);
    delete user.password;
    
    res.json({
      message: '资料更新成功',
      user
    });
  } catch (error) {
    console.error('更新资料错误:', error);
    res.status(500).json({ error: '更新资料失败' });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  changePassword,
  updateProfile
};