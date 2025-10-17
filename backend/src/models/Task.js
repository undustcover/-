const { query, transaction } = require('../config/database');

class Task {
  // 创建任务
  static async create(taskData) {
    const {
      title,
      description,
      priority = 'medium',
      start_date,
      due_date,
      assigned_to,
      created_by,
      category,
      tags = [],
      parent_id,
      estimated_hours,
      status = 'pending' // 获取 status，默认值为 'pending'
    } = taskData;

    return await transaction(async (connection) => {
      // 统一处理标签为JSON字符串，兼容SQLite(TEXT)与MySQL(JSON)
      const tagsArray = Array.isArray(tags)
        ? tags
        : (typeof tags === 'string'
            ? tags.split(',').map(s => s.trim()).filter(Boolean)
            : []);
      const tagsJson = JSON.stringify(tagsArray);

      // 插入任务
      const taskSql = `
        INSERT INTO tasks (title, description, priority, start_date, due_date, assigned_to, created_by, 
                          category, estimated_hours, status, progress, created_at, parent_id, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now', 'localtime'), ?, ?)
      `;
      
      const taskResult = await query(taskSql, [
        title, description, priority, start_date, due_date, assigned_to, created_by, category, estimated_hours, status, // 使用 status
        parent_id || null, tagsJson
      ]);
      
      const taskId = taskResult.insertId || taskResult.lastID;

      // 记录操作日志
       const logSql = `
         INSERT INTO task_logs (task_id, user_id, action, details, created_at)
         VALUES (?, ?, 'create', ?, datetime('now', 'localtime'))
       `;
       await query(logSql, [taskId, created_by, `创建任务: ${title}`]);

       return taskId;
    });
  }

  // 根据ID查找任务
  static async findById(id) {
    const sql = `
      SELECT t.*, 
             json_object(
                'id', creator.id,
                'username', creator.username,
                'real_name', creator.real_name,
                'avatar', creator.avatar
              ) as creator,
              json_object(
                'id', assignee.id,
                'username', assignee.username,
                'real_name', assignee.real_name,
                'avatar', assignee.avatar
              ) as assignee
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.id = ?
    `;
    
    const tasks = await query(sql, [id]);
    if (tasks.length === 0) return null;
    
    const task = tasks[0];
    // 解析标签：优先解析JSON，其次按逗号分隔
    if (task.tags) {
      try {
        const parsed = JSON.parse(task.tags);
        task.tags = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        task.tags = typeof task.tags === 'string' ? task.tags.split(',').filter(Boolean) : [];
      }
    } else {
      task.tags = [];
    }

    if (task.creator) {
      try { task.creator = JSON.parse(task.creator); } catch (e) { /* a task must have a creator */ }
    }
    if (task.assignee) {
      try { 
        task.assignee = JSON.parse(task.assignee); 
        if (!task.assignee.id) task.assignee = null;
      } catch (e) { 
        task.assignee = null;
      }
    }
    
    // 查询任务的附件（使用当前的task_files表结构）
    const attachmentsSql = `
      SELECT tf.id, tf.filename, tf.original_name, tf.file_size as size, 
             tf.mime_type, tf.created_at
      FROM task_files tf
      WHERE tf.task_id = ?
      ORDER BY tf.created_at DESC
    `;
    
    const attachments = await query(attachmentsSql, [id]);
    task.attachments = attachments || [];
    
    return task;
  }

  // 获取任务列表（分页和筛选）
  static async getList(options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'desc',
      status,
      priority,
      assigned_to,
      created_by,
      category,
      due_date_start,
      due_date_end,
      keyword
    } = options;

    let whereConditions = ['t.status != "deleted"'];
    let params = [];

    if (status) {
      whereConditions.push('t.status = ?');
      params.push(status);
    }

    if (priority) {
      whereConditions.push('t.priority = ?');
      params.push(priority);
    }

    if (assigned_to) {
      whereConditions.push('t.assigned_to = ?');
      params.push(assigned_to);
    }

    if (created_by) {
      whereConditions.push('t.created_by = ?');
      params.push(created_by);
    }

    if (category) {
      whereConditions.push('t.category = ?');
      params.push(category);
    }

    if (due_date_start) {
      whereConditions.push('t.due_date >= ?');
      params.push(due_date_start);
    }

    if (due_date_end) {
      whereConditions.push('t.due_date <= ?');
      params.push(due_date_end);
    }

    if (keyword) {
      whereConditions.push('(t.title LIKE ? OR t.description LIKE ?)');
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    const offset = (page - 1) * limit;

    // 获取总数
    const countSql = `SELECT COUNT(DISTINCT t.id) as total FROM tasks t ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // 获取数据
    const dataSql = `
      SELECT 
        t.*,
        json_object(
          'id', creator.id,
          'username', creator.username,
          'real_name', creator.real_name,
          'avatar', creator.avatar
        ) as creator,
        json_object(
          'id', assignee.id,
          'username', assignee.username,
          'real_name', assignee.real_name,
          'avatar', assignee.avatar
        ) as assignee
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      ${whereClause}
      ORDER BY t.${sort} ${order}
      LIMIT ? OFFSET ?
    `;
    
    const tasks = await query(dataSql, [...params, limit, offset]);
    
    // 处理标签和JSON对象
    tasks.forEach(task => {
      if (task.tags) {
        try {
          const parsed = JSON.parse(task.tags);
          task.tags = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          task.tags = typeof task.tags === 'string' ? task.tags.split(',').filter(Boolean) : [];
        }
      } else {
        task.tags = [];
      }
      if (task.creator) {
        try { task.creator = JSON.parse(task.creator); } catch (e) { /* a task must have a creator */ }
      }
      if (task.assignee) {
        try { 
          task.assignee = JSON.parse(task.assignee); 
          if (!task.assignee.id) task.assignee = null;
        } catch (e) { 
          task.assignee = null;
        }
      }
    });

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // 更新任务
  static async update(id, updateData, userId) {
    const allowedFields = [
      'title', 'description', 'priority', 'status', 'start_date', 'due_date', 
      'assigned_to', 'category', 'estimated_hours', 'actual_hours', 'progress', 'parent_id'
    ];
    
    return await transaction(async (connection) => {
      // 先获取当前任务信息以便比较状态是否变化
      const existing = await query('SELECT status, title FROM tasks WHERE id = ?', [id]);
      if (!existing || existing.length === 0) {
        throw new Error('任务不存在');
      }
      const oldStatus = existing[0].status;
      const taskTitle = existing[0].title;

      const updates = [];
      const params = [];
      let logDetails = [];

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          updates.push(`${key} = ?`);
          params.push(updateData[key]);
          logDetails.push(`${key}: ${Array.isArray(updateData[key]) ? updateData[key].join(', ') : updateData[key]}`);
        }
      });

      // 特殊处理标签字段（数组）
      if (updateData.tags !== undefined) {
        const tagsArray = Array.isArray(updateData.tags)
          ? updateData.tags
          : (typeof updateData.tags === 'string'
              ? updateData.tags.split(',').map(s => s.trim()).filter(Boolean)
              : []);
        const tagsJson = JSON.stringify(tagsArray);
        updates.push('tags = ?');
        params.push(tagsJson);
        logDetails.push(`tags: ${tagsArray.join(', ')}`);
      }

      if (updates.length === 0) {
        throw new Error('没有有效的更新字段');
      }

      updates.push('updated_at = datetime(\'now\', \'localtime\')');
      params.push(id);

      const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;
      const result = await query(sql, params);
      
      if (!result || (result.changes !== undefined && result.changes === 0)) {
        throw new Error('任务不存在');
      }

      // 暂时跳过标签更新，后续可以从tags字段处理
      if (updateData.tags !== undefined) {
        logDetails.push(`tags: ${updateData.tags.join(', ')}`);
      }

      // 如果存在状态字段且状态有变化，则记录为 status_change 日志，否则记录为通用 update 日志
      const hasStatusUpdate = Object.prototype.hasOwnProperty.call(updateData, 'status');
      const newStatus = hasStatusUpdate ? updateData.status : oldStatus;

      if (hasStatusUpdate && newStatus !== oldStatus) {
        const logSql = `
        INSERT INTO task_logs (task_id, user_id, action, details, created_at)
        VALUES (?, ?, 'status_change', ?, datetime('now', 'localtime'))
      `;
        const details = `任务「${taskTitle || id}」状态从 ${oldStatus} 变更为 ${newStatus}`;
        await query(logSql, [id, userId, details]);
      } else {
        const logSql = `
        INSERT INTO task_logs (task_id, user_id, action, details, created_at)
        VALUES (?, ?, 'update', ?, datetime('now', 'localtime'))
      `;
        await query(logSql, [id, userId, `更新任务: ${logDetails.join(', ')}`]);
      }

      return true;
    });
  }

  // 转移任务
  static async transfer(id, newAssignee, reason, userId) {
    return await transaction(async (connection) => {
      // 获取当前任务信息
      const tasks = await query('SELECT assigned_to FROM tasks WHERE id = ?', [id]);
      if (tasks.length === 0) {
        throw new Error('任务不存在');
      }

      const oldAssignee = tasks[0].assigned_to;
      
      // 更新任务负责人
      await query(
        'UPDATE tasks SET assigned_to = ?, updated_at = datetime(\'now\') WHERE id = ?',
        [newAssignee, id]
      );

      // 记录转移日志
      const logSql = `
        INSERT INTO task_logs (task_id, user_id, action, details, created_at)
        VALUES (?, ?, 'transfer', ?, datetime('now', 'localtime'))
      `;
      const details = `任务转移: 从用户${oldAssignee}转移到用户${newAssignee}${reason ? ', 原因: ' + reason : ''}`;
      await query(logSql, [id, userId, details]);

      return true;
    });
  }

  // 申请延期
  static async requestExtension(id, newDueDate, reason, userId) {
    return await transaction(async (connection) => {
      // 插入延期申请
      const extensionSql = `
        INSERT INTO task_extensions (task_id, requested_by, original_due_date, new_due_date, reason, status, created_at)
        SELECT ?, ?, due_date, ?, ?, 'pending', datetime('now', 'localtime')
        FROM tasks WHERE id = ?
      `;
      
      await query(extensionSql, [id, userId, newDueDate, reason, id]);

      // 记录操作日志
      const logSql = `
        INSERT INTO task_logs (task_id, user_id, action, details, created_at)
        VALUES (?, ?, 'request_extension', ?, datetime('now', 'localtime'))
      `;
      const details = `申请延期至: ${newDueDate}, 原因: ${reason}`;
      await query(logSql, [id, userId, details]);

      return true;
    });
  }

  // 删除任务（软删除）
  static async delete(id, userId) {
    return await transaction(async (connection) => {
      const result = await query(
        'UPDATE tasks SET status = "deleted", updated_at = datetime(\'now\') WHERE id = ?',
        [id]
      );
      
      if (result.changes === 0) {
        throw new Error('任务不存在');
      }

      // 记录操作日志
      const logSql = `
        INSERT INTO task_logs (task_id, user_id, action, details, created_at)
        VALUES (?, ?, 'delete', '删除任务', datetime('now', 'localtime'))
      `;
      await query(logSql, [id, userId]);

      return true;
    });
  }

  // 获取任务统计信息
  static async getStats(userId = null, role = null) {
    let whereClause = 'WHERE status != "deleted"';
    let params = [];

    // 如果不是管理员，只能看到自己相关的任务
    if (role !== 'admin' && role !== 'super_admin' && userId) {
      whereClause += ' AND (assigned_to = ? OR created_by = ?)';
      params.push(userId, userId);
    }

    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
        SUM(CASE WHEN due_date < datetime('now') AND status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END) as overdue
      FROM tasks 
      ${whereClause}
    `;
    
    const result = await query(sql, params);
    return result[0];
  }

  // 获取任务操作日志
  static async getLogs(taskId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT tl.id, tl.task_id, tl.user_id, tl.action, tl.details, tl.created_at,
             u.real_name as user_name, u.avatar as user_avatar
      FROM task_logs tl
      LEFT JOIN users u ON tl.user_id = u.id
      WHERE tl.task_id = ?
      ORDER BY tl.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const logs = await query(sql, [taskId, limit, offset]);
    
    // 获取总数
    const countSql = 'SELECT COUNT(*) as total FROM task_logs WHERE task_id = ?';
    const countResult = await query(countSql, [taskId]);
    const total = countResult[0].total;
    
    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // 获取任务评论
  static async getComments(taskId) {
    const sql = `
      SELECT 
        c.id, c.task_id, c.user_id, c.content, c.created_at,
        json_object(
          'id', u.id,
          'real_name', u.real_name,
          'avatar', u.avatar
        ) as user
      FROM task_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ?
      ORDER BY c.created_at DESC
    `;
    const comments = await query(sql, [taskId]);
    
    // 解析user字段为JSON对象
    return comments.map(comment => {
      if (comment.user) {
        try {
          comment.user = JSON.parse(comment.user);
        } catch (e) {
          comment.user = null;
        }
      }
      return comment;
    });
  }

  static async addComment(taskId, userId, content) {
    return await transaction(async (connection) => {
      const commentSql = `
        INSERT INTO task_comments (task_id, user_id, content, created_at)
        VALUES (?, ?, ?, datetime('now', 'localtime'))
      `;
      const result = await query(commentSql, [taskId, userId, content]);
      const commentId = result.insertId || result.lastID;

      // 记录日志
      const logSql = `
        INSERT INTO task_logs (task_id, user_id, action, details, created_at)
        VALUES (?, ?, 'comment', ?, datetime('now', 'localtime'))
      `;
      await query(logSql, [taskId, userId, `发表了评论: ${content.substring(0, 50)}...`]);

      // 返回新评论的完整信息
      const newCommentResult = await query(
        `SELECT 
          c.id, c.task_id, c.user_id, c.content, c.created_at,
          json_object(
            'id', u.id,
            'real_name', u.real_name,
            'avatar', u.avatar
          ) as user
         FROM task_comments c 
         LEFT JOIN users u ON c.user_id = u.id 
         WHERE c.id = ?`,
        [commentId]
      );
      
      const newComment = newCommentResult[0];
      if (newComment && newComment.user) {
        try {
          newComment.user = JSON.parse(newComment.user);
        } catch (e) {
          // ignore
        }
      }

      return newComment;
    });
  }
}

module.exports = Task;