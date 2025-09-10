const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');

// 所有路由都需要认证
router.use(authenticateToken);

// 获取通知列表
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      is_read,
      start_date,
      end_date
    } = req.query;
    
    const userId = req.user.id;
    let whereConditions = ['user_id = ?'];
    let params = [userId];
    
    if (type) {
      whereConditions.push('type = ?');
      params.push(type);
    }
    
    if (is_read !== undefined) {
      whereConditions.push('is_read = ?');
      params.push(is_read === 'true' ? 1 : 0);
    }
    
    if (start_date) {
      whereConditions.push('created_at >= ?');
      params.push(start_date);
    }
    
    if (end_date) {
      whereConditions.push('created_at <= ?');
      params.push(end_date);
    }
    
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    const offset = (page - 1) * limit;
    
    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM notifications ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;
    
    // 获取数据
    const dataSql = `
      SELECT *
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const notifications = await query(dataSql, [...params, parseInt(limit), offset]);
    
    res.json({
      message: '获取通知列表成功',
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取通知列表错误:', error);
    res.status(500).json({ error: '获取通知列表失败' });
  }
});

// 获取未读通知数量
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const sql = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0';
    const result = await query(sql, [userId]);
    
    res.json({
      message: '获取未读通知数量成功',
      unread_count: result[0].count
    });
  } catch (error) {
    console.error('获取未读通知数量错误:', error);
    res.status(500).json({ error: '获取未读通知数量失败' });
  }
});

// 标记通知为已读
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const sql = 'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?';
    const result = await query(sql, [id, userId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '通知不存在' });
    }
    
    res.json({ message: '通知已标记为已读' });
  } catch (error) {
    console.error('标记通知已读错误:', error);
    res.status(500).json({ error: '标记通知已读失败' });
  }
});

// 批量标记通知为已读
router.put('/batch/read', async (req, res) => {
  try {
    const { notification_ids } = req.body;
    const userId = req.user.id;
    
    if (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
      return res.status(400).json({ error: '请提供有效的通知ID列表' });
    }
    
    const placeholders = notification_ids.map(() => '?').join(',');
    const sql = `UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id IN (${placeholders}) AND user_id = ?`;
    const params = [...notification_ids, userId];
    
    const result = await query(sql, params);
    
    res.json({
      message: '批量标记通知已读成功',
      affected_count: result.affectedRows
    });
  } catch (error) {
    console.error('批量标记通知已读错误:', error);
    res.status(500).json({ error: '批量标记通知已读失败' });
  }
});

// 标记所有通知为已读
router.put('/all/read', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const sql = 'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0';
    const result = await query(sql, [userId]);
    
    res.json({
      message: '所有通知已标记为已读',
      affected_count: result.affectedRows
    });
  } catch (error) {
    console.error('标记所有通知已读错误:', error);
    res.status(500).json({ error: '标记所有通知已读失败' });
  }
});

// 删除通知
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const sql = 'DELETE FROM notifications WHERE id = ? AND user_id = ?';
    const result = await query(sql, [id, userId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '通知不存在' });
    }
    
    res.json({ message: '通知删除成功' });
  } catch (error) {
    console.error('删除通知错误:', error);
    res.status(500).json({ error: '删除通知失败' });
  }
});

// 批量删除通知
router.delete('/batch', async (req, res) => {
  try {
    const { notification_ids } = req.body;
    const userId = req.user.id;
    
    if (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
      return res.status(400).json({ error: '请提供有效的通知ID列表' });
    }
    
    const placeholders = notification_ids.map(() => '?').join(',');
    const sql = `DELETE FROM notifications WHERE id IN (${placeholders}) AND user_id = ?`;
    const params = [...notification_ids, userId];
    
    const result = await query(sql, params);
    
    res.json({
      message: '批量删除通知成功',
      affected_count: result.affectedRows
    });
  } catch (error) {
    console.error('批量删除通知错误:', error);
    res.status(500).json({ error: '批量删除通知失败' });
  }
});

// 创建通知（系统内部使用）
const createNotification = async (userId, type, title, content, relatedId = null) => {
  try {
    const sql = `
      INSERT INTO notifications (user_id, type, title, content, related_id, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, 0, NOW())
    `;
    
    const result = await query(sql, [userId, type, title, content, relatedId]);
    return result.insertId;
  } catch (error) {
    console.error('创建通知错误:', error);
    throw error;
  }
};

// 批量创建通知（系统内部使用）
const createBatchNotifications = async (notifications) => {
  try {
    if (!notifications || notifications.length === 0) return;
    
    const sql = `
      INSERT INTO notifications (user_id, type, title, content, related_id, is_read, created_at)
      VALUES ?
    `;
    
    const values = notifications.map(notif => [
      notif.userId,
      notif.type,
      notif.title,
      notif.content,
      notif.relatedId || null,
      0,
      new Date()
    ]);
    
    await query(sql, [values]);
  } catch (error) {
    console.error('批量创建通知错误:', error);
    throw error;
  }
};

// 导出通知创建函数供其他模块使用
router.createNotification = createNotification;
router.createBatchNotifications = createBatchNotifications;

module.exports = router;