const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: '访问令牌缺失' });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 检查用户是否存在且状态正常
    const users = await query(
      'SELECT id, username, email, role, status FROM users WHERE id = ? AND status = "active"',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: '用户不存在或已被禁用' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '访问令牌已过期' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '无效的访问令牌' });
    }
    console.error('认证中间件错误:', error);
    return res.status(500).json({ error: '认证服务异常' });
  }
};

// 角色权限检查中间件
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '用户未认证' });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: '权限不足' });
    }

    next();
  };
};

// 管理员权限检查
const requireAdmin = requireRole(['admin', 'super_admin']);

// 部门经理权限检查
const requireManager = requireRole(['manager', 'admin', 'super_admin']);

// 可选认证中间件（不强制要求登录）
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const users = await query(
        'SELECT id, username, email, role, status FROM users WHERE id = ? AND status = "active"',
        [decoded.userId]
      );
      
      if (users.length > 0) {
        req.user = users[0];
      }
    }
    
    next();
  } catch (error) {
    // 可选认证失败时不阻止请求继续
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireManager,
  optionalAuth
};