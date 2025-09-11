const { query, transaction } = require('../config/database');

class Milestone {
  // 创建里程碑
  static async create(milestoneData) {
    const {
      task_id,
      title,
      description,
      target_date,
      reminder_days = 3,
      created_by
    } = milestoneData;

    const sql = `
      INSERT INTO milestones (task_id, title, description, target_date, reminder_days, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
    `;
    
    const result = await query(sql, [task_id, title, description, target_date, reminder_days, created_by]);
    return result.insertId || result.lastID;
  }

  // 根据ID查找里程碑
  static async findById(id) {
    const sql = `
      SELECT m.*, 
             json_object(
                'id', creator.id,
                'username', creator.username,
                'real_name', creator.real_name
             ) as creator
      FROM milestones m
      LEFT JOIN users creator ON m.created_by = creator.id
      WHERE m.id = ?
    `;
    
    const result = await query(sql, [id]);
    if (result.length === 0) {
      return null;
    }
    
    const milestone = result[0];
    if (milestone.creator) {
      milestone.creator = JSON.parse(milestone.creator);
    }
    
    return milestone;
  }

  // 根据任务ID获取里程碑列表
  static async findByTaskId(taskId) {
    const sql = `
      SELECT m.*, 
             json_object(
                'id', creator.id,
                'username', creator.username,
                'real_name', creator.real_name
             ) as creator
      FROM milestones m
      LEFT JOIN users creator ON m.created_by = creator.id
      WHERE m.task_id = ?
      ORDER BY m.target_date ASC
    `;
    
    const result = await query(sql, [taskId]);
    
    return result.map(milestone => {
      if (milestone.creator) {
        milestone.creator = JSON.parse(milestone.creator);
      }
      return milestone;
    });
  }

  // 更新里程碑
  static async update(id, updateData) {
    const {
      title,
      description,
      target_date,
      is_achieved,
      achieved_date,
      reminder_days
    } = updateData;

    const sql = `
      UPDATE milestones 
      SET title = ?, description = ?, target_date = ?, is_achieved = ?, 
          achieved_date = ?, reminder_days = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `;
    
    const result = await query(sql, [title, description, target_date, is_achieved, achieved_date, reminder_days, id]);
    return result.changes > 0;
  }

  // 标记里程碑为已达成
  static async markAsAchieved(id, achievedDate = null) {
    const sql = `
      UPDATE milestones 
      SET is_achieved = 1, achieved_date = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `;
    
    const date = achievedDate || new Date().toISOString().split('T')[0];
    const result = await query(sql, [date, id]);
    return result.changes > 0;
  }

  // 删除里程碑
  static async delete(id) {
    const sql = 'DELETE FROM milestones WHERE id = ?';
    const result = await query(sql, [id]);
    return result.changes > 0;
  }

  // 获取即将到期的里程碑
  static async getUpcoming(days = 7) {
    const sql = `
      SELECT m.*, 
             json_object(
                'id', creator.id,
                'username', creator.username,
                'real_name', creator.real_name
             ) as creator,
             json_object(
                'id', t.id,
                'title', t.title
             ) as task
      FROM milestones m
      LEFT JOIN users creator ON m.created_by = creator.id
      LEFT JOIN tasks t ON m.task_id = t.id
      WHERE m.is_achieved = 0 
        AND date(m.target_date) <= date('now', '+' || ? || ' days')
        AND date(m.target_date) >= date('now')
      ORDER BY m.target_date ASC
    `;
    
    const result = await query(sql, [days]);
    
    return result.map(milestone => {
      if (milestone.creator) {
        milestone.creator = JSON.parse(milestone.creator);
      }
      if (milestone.task) {
        milestone.task = JSON.parse(milestone.task);
      }
      return milestone;
    });
  }

  // 获取逾期的里程碑
  static async getOverdue() {
    const sql = `
      SELECT m.*, 
             json_object(
                'id', creator.id,
                'username', creator.username,
                'real_name', creator.real_name
             ) as creator,
             json_object(
                'id', t.id,
                'title', t.title
             ) as task
      FROM milestones m
      LEFT JOIN users creator ON m.created_by = creator.id
      LEFT JOIN tasks t ON m.task_id = t.id
      WHERE m.is_achieved = 0 
        AND date(m.target_date) < date('now')
      ORDER BY m.target_date ASC
    `;
    
    const result = await query(sql);
    
    return result.map(milestone => {
      if (milestone.creator) {
        milestone.creator = JSON.parse(milestone.creator);
      }
      if (milestone.task) {
        milestone.task = JSON.parse(milestone.task);
      }
      return milestone;
    });
  }
}

module.exports = Milestone;