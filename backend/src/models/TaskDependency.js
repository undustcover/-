const { db } = require('../config/sqlite');

class TaskDependency {
  // 创建任务依赖关系
  static async create(dependencyData) {
    const { predecessor_id, successor_id, type = 'finish_to_start', lag = 0 } = dependencyData;
    
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO task_dependencies (predecessor_id, successor_id, type, lag, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `;
      
      db.run(sql, [predecessor_id, successor_id, type, lag], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...dependencyData });
        }
      });
    });
  }

  // 获取任务的所有依赖关系
  static async getByTaskId(taskId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          td.*,
          pt.title as predecessor_title,
          pt.status as predecessor_status,
          pt.start_date as predecessor_start_date,
          pt.due_date as predecessor_end_date,
          st.title as successor_title,
          st.status as successor_status,
          st.start_date as successor_start_date,
          st.due_date as successor_end_date
        FROM task_dependencies td
        LEFT JOIN tasks pt ON td.predecessor_id = pt.id
        LEFT JOIN tasks st ON td.successor_id = st.id
        WHERE td.predecessor_id = ? OR td.successor_id = ?
        ORDER BY td.created_at DESC
      `;
      
      db.all(sql, [taskId, taskId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 获取项目的所有依赖关系
  static async getByProjectId(projectId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          td.*,
          pt.title as predecessor_title,
          pt.status as predecessor_status,
          pt.start_date as predecessor_start_date,
          pt.due_date as predecessor_end_date,
          st.title as successor_title,
          st.status as successor_status,
          st.start_date as successor_start_date,
          st.due_date as successor_end_date
        FROM task_dependencies td
        LEFT JOIN tasks pt ON td.predecessor_id = pt.id
        LEFT JOIN tasks st ON td.successor_id = st.id
        WHERE pt.project_id = ? OR st.project_id = ?
        ORDER BY td.created_at DESC
      `;
      
      db.all(sql, [projectId, projectId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 删除依赖关系
  static async delete(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM task_dependencies WHERE id = ?';
      
      db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes > 0 });
        }
      });
    });
  }

  // 删除任务的所有依赖关系
  static async deleteByTaskId(taskId) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM task_dependencies WHERE predecessor_task_id = ? OR successor_task_id = ?';
      
      db.run(sql, [taskId, taskId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  }

  // 检查是否存在循环依赖
  static async checkCircularDependency(predecessorId, successorId) {
    return new Promise((resolve, reject) => {
      // 使用递归CTE查询是否存在从successorId到predecessorId的路径
      const sql = `
        WITH RECURSIVE dependency_path(task_id, path) AS (
          SELECT successor_task_id, predecessor_task_id || ',' || successor_task_id
          FROM task_dependencies
          WHERE predecessor_task_id = ?
          
          UNION ALL
          
          SELECT td.successor_task_id, dp.path || ',' || td.successor_task_id
          FROM task_dependencies td
          JOIN dependency_path dp ON td.predecessor_task_id = dp.task_id
          WHERE dp.path NOT LIKE '%,' || td.successor_task_id || ',%'
        )
        SELECT COUNT(*) as count
        FROM dependency_path
        WHERE task_id = ?
      `;
      
      db.get(sql, [successorId, predecessorId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count > 0);
        }
      });
    });
  }

  // 更新依赖关系
  static async update(id, updateData) {
    const { dependency_type, lag_days } = updateData;
    
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE task_dependencies 
        SET dependency_type = ?, lag_days = ?, updated_at = datetime('now')
        WHERE id = ?
      `;
      
      db.run(sql, [dependency_type, lag_days, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ updated: this.changes > 0 });
        }
      });
    });
  }
}

module.exports = TaskDependency;