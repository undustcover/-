const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // 创建用户
  static async create(userData) {
    const { username, email, password, real_name, department, position, phone, role = 'employee' } = userData;
    
    // 检查是否是第一个用户，如果是则设为超级管理员
    const countSql = 'SELECT COUNT(*) as count FROM users';
    const countResult = await query(countSql);
    const isFirstUser = countResult[0].count === 0;
    // 临时：如果用户名包含admin，设为超级管理员
    const finalRole = isFirstUser || username.includes('admin') ? 'super_admin' : role;
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const sql = `
      INSERT INTO users (username, email, password_hash, real_name, department, position, phone, role, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now', 'localtime'))
    `;
    
    const result = await query(sql, [username, email, hashedPassword, real_name, department, position, phone, finalRole]);
    return result.insertId;
  }

  // 根据ID查找用户
  static async findById(id) {
    const sql = 'SELECT * FROM users WHERE id = ?';
    const users = await query(sql, [id]);
    return users[0] || null;
  }

  // 根据用户名查找用户
  static async findByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    const users = await query(sql, [username]);
    return users[0] || null;
  }

  // 根据邮箱查找用户
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const users = await query(sql, [email]);
    return users[0] || null;
  }

  // 验证密码
  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // 获取用户列表（分页）
  static async getList(options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'desc',
      status,
      role,
      department,
      keyword
    } = options;

    let whereConditions = [];
    let params = [];

    // 默认过滤掉已删除的用户
    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    } else {
      whereConditions.push('status != ?');
      params.push('deleted');
    }

    if (role) {
      whereConditions.push('role = ?');
      params.push(role);
    }

    if (department) {
      whereConditions.push('department = ?');
      params.push(department);
    }

    if (keyword) {
      whereConditions.push('(username LIKE ? OR real_name LIKE ? OR email LIKE ?)');
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // 获取数据
    const dataSql = `
      SELECT id, username, email, real_name, department, position, phone, role, status, 
             avatar, location, join_date, last_login_at as last_login, created_at, updated_at
      FROM users 
      ${whereClause}
      ORDER BY ${sort} ${order}
      LIMIT ? OFFSET ?
    `;
    
    const users = await query(dataSql, [...params, limit, offset]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // 更新用户信息
  static async update(id, updateData) {
    const allowedFields = ['real_name', 'department', 'position', 'phone', 'avatar', 'status', 'role', 'location', 'join_date'];
    const updates = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(updateData[key]);
      }
    });

    if (updates.length === 0) {
      throw new Error('没有有效的更新字段');
    }

    updates.push('updated_at = datetime(\'now\')');
    params.push(id);

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    const result = await query(sql, params);
    
    return result.affectedRows > 0;
  }

  // 更新密码
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const sql = 'UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?';
    const result = await query(sql, [hashedPassword, id]);
    
    return result.affectedRows > 0;
  }

  // 更新最后登录时间
  static async updateLastLogin(id) {
    const sql = 'UPDATE users SET last_login_at = datetime(\'now\') WHERE id = ?';
    await query(sql, [id]);
  }

  // 删除用户（软删除）
  static async delete(id) {
    const sql = 'UPDATE users SET status = "deleted", updated_at = datetime(\'now\') WHERE id = ?';
    const result = await query(sql, [id]);
    
    return result.affectedRows > 0;
  }

  // 获取用户统计信息
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'manager' THEN 1 ELSE 0 END) as managers,
        SUM(CASE WHEN role = 'employee' THEN 1 ELSE 0 END) as employees
      FROM users 
      WHERE status != 'deleted'
    `;
    
    const result = await query(sql);
    return result[0];
  }

  // 检查用户名是否存在
  static async isUsernameExists(username, excludeId = null) {
    let sql = 'SELECT COUNT(*) as count FROM users WHERE username = ? AND status != "deleted"';
    let params = [username];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const result = await query(sql, params);
    return result[0].count > 0;
  }

  // 检查邮箱是否存在
  static async isEmailExists(email, excludeId = null) {
    let sql = 'SELECT COUNT(*) as count FROM users WHERE email = ? AND status != "deleted"';
    let params = [email];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const result = await query(sql, params);
    return result[0].count > 0;
  }
}

module.exports = User;