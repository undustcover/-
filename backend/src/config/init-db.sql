-- 任务管理系统数据库初始化脚本
-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS task_management DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE task_management;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  email VARCHAR(100) UNIQUE NOT NULL COMMENT '邮箱',
  password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
  real_name VARCHAR(100) NOT NULL COMMENT '真实姓名',
  phone VARCHAR(20) COMMENT '手机号',
  department VARCHAR(100) COMMENT '部门',
  position VARCHAR(100) COMMENT '职位',
  role ENUM('user', 'manager', 'admin', 'super_admin') DEFAULT 'user' COMMENT '角色',
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active' COMMENT '状态',
  avatar VARCHAR(255) COMMENT '头像URL',
  last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at TIMESTAMP NULL COMMENT '删除时间',
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_department (department),
  INDEX idx_role (role),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL COMMENT '任务标题',
  description TEXT COMMENT '任务描述',
  priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal' COMMENT '优先级',
  status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'overdue') DEFAULT 'pending' COMMENT '状态',
  category ENUM('生产协调', '项目管理', '综合工作') NOT NULL COMMENT '分类',
  tags JSON COMMENT '标签',
  created_by INT NOT NULL COMMENT '创建人ID',
  assigned_to INT COMMENT '负责人ID',
  estimated_hours DECIMAL(8,2) DEFAULT 0 COMMENT '预估工时',
  actual_hours DECIMAL(8,2) DEFAULT 0 COMMENT '实际工时',
  progress INT DEFAULT 0 COMMENT '进度百分比',
  due_date TIMESTAMP NULL COMMENT '截止日期',
  start_date TIMESTAMP NULL COMMENT '开始日期',
  completed_at TIMESTAMP NULL COMMENT '完成时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at TIMESTAMP NULL COMMENT '删除时间',
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_title (title),
  INDEX idx_priority (priority),
  INDEX idx_status (status),
  INDEX idx_category (category),
  INDEX idx_created_by (created_by),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_due_date (due_date),
  INDEX idx_created_at (created_at),
  FULLTEXT idx_fulltext (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务表';

-- 任务操作日志表
CREATE TABLE IF NOT EXISTS task_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT NOT NULL COMMENT '任务ID',
  user_id INT NOT NULL COMMENT '操作用户ID',
  action VARCHAR(50) NOT NULL COMMENT '操作类型',
  old_values JSON COMMENT '旧值',
  new_values JSON COMMENT '新值',
  comment TEXT COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_task_id (task_id),
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务操作日志表';

-- 任务依赖关系表
CREATE TABLE IF NOT EXISTS task_dependencies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  predecessor_id INT NOT NULL COMMENT '前置任务ID',
  successor_id INT NOT NULL COMMENT '后续任务ID',
  dependency_type ENUM('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish') DEFAULT 'finish_to_start' COMMENT '依赖类型',
  lag_days INT DEFAULT 0 COMMENT '滞后天数',
  created_by INT NOT NULL COMMENT '创建人ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (predecessor_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (successor_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_dependency (predecessor_id, successor_id),
  INDEX idx_predecessor (predecessor_id),
  INDEX idx_successor (successor_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务依赖关系表';

-- 文件表
CREATE TABLE IF NOT EXISTS files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  original_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
  filename VARCHAR(255) NOT NULL COMMENT '存储文件名',
  file_path VARCHAR(500) NOT NULL COMMENT '文件路径',
  file_size BIGINT NOT NULL COMMENT '文件大小',
  mime_type VARCHAR(100) COMMENT 'MIME类型',
  uploaded_by INT NOT NULL COMMENT '上传用户ID',
  task_id INT COMMENT '关联任务ID',
  description TEXT COMMENT '文件描述',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at TIMESTAMP NULL COMMENT '删除时间',
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  INDEX idx_original_name (original_name),
  INDEX idx_filename (filename),
  INDEX idx_uploaded_by (uploaded_by),
  INDEX idx_task_id (task_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件表';

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '接收用户ID',
  title VARCHAR(200) NOT NULL COMMENT '通知标题',
  content TEXT COMMENT '通知内容',
  type VARCHAR(50) DEFAULT 'info' COMMENT '通知类型',
  related_type VARCHAR(50) COMMENT '关联类型',
  related_id INT COMMENT '关联ID',
  is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
  read_at TIMESTAMP NULL COMMENT '阅读时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at TIMESTAMP NULL COMMENT '删除时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- 任务延期申请表
CREATE TABLE IF NOT EXISTS task_extensions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT NOT NULL COMMENT '任务ID',
  requested_by INT NOT NULL COMMENT '申请人ID',
  original_due_date TIMESTAMP NOT NULL COMMENT '原截止日期',
  requested_due_date TIMESTAMP NOT NULL COMMENT '申请截止日期',
  reason TEXT NOT NULL COMMENT '申请理由',
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '状态',
  reviewed_by INT COMMENT '审核人ID',
  reviewed_at TIMESTAMP NULL COMMENT '审核时间',
  review_comment TEXT COMMENT '审核意见',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_task_id (task_id),
  INDEX idx_requested_by (requested_by),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务延期申请表';

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
  config_value TEXT COMMENT '配置值',
  description TEXT COMMENT '配置描述',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 插入默认管理员用户
-- 密码: admin123 (请在生产环境中修改)
INSERT INTO users (username, email, password_hash, real_name, role, status) VALUES 
('admin', 'admin@example.com', '$2b$10$rQZ8kHWKtGY.ZvGY8sQxUeJ5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K', '系统管理员', 'super_admin', 'active')
ON DUPLICATE KEY UPDATE username = username;

-- 插入默认系统配置
INSERT INTO system_configs (config_key, config_value, description) VALUES 
('system_name', '任务管理系统', '系统名称'),
('max_file_size', '10485760', '最大文件上传大小（字节）'),
('allowed_file_types', 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip,rar', '允许上传的文件类型'),
('task_auto_overdue', 'true', '是否自动标记过期任务'),
('notification_enabled', 'true', '是否启用通知功能'),
('email_notification', 'false', '是否启用邮件通知')
ON DUPLICATE KEY UPDATE config_key = config_key;

-- 创建视图：任务统计视图
CREATE OR REPLACE VIEW task_stats AS
SELECT 
  u.id as user_id,
  u.real_name,
  u.department,
  COUNT(t.id) as total_tasks,
  SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
  SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
  SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
  SUM(CASE WHEN t.status = 'overdue' THEN 1 ELSE 0 END) as overdue_tasks,
  ROUND(SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) / COUNT(t.id) * 100, 2) as completion_rate
FROM users u
LEFT JOIN tasks t ON u.id = t.assigned_to AND t.deleted_at IS NULL
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.real_name, u.department;

-- 创建存储过程：更新过期任务
DELIMITER //
CREATE PROCEDURE UpdateOverdueTasks()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE task_id INT;
  DECLARE cur CURSOR FOR 
    SELECT id FROM tasks 
    WHERE status IN ('pending', 'in_progress') 
    AND due_date < NOW() 
    AND deleted_at IS NULL;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  
  read_loop: LOOP
    FETCH cur INTO task_id;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- 更新任务状态为过期
    UPDATE tasks SET status = 'overdue' WHERE id = task_id;
    
    -- 记录操作日志
    INSERT INTO task_logs (task_id, user_id, action, comment)
    VALUES (task_id, 1, 'auto_overdue', '系统自动标记为过期');
    
  END LOOP;
  
  CLOSE cur;
END //
DELIMITER ;

-- 创建触发器：任务状态变更时记录日志
DELIMITER //
CREATE TRIGGER task_status_change_log
AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO task_logs (task_id, user_id, action, old_values, new_values, comment)
    VALUES (
      NEW.id,
      1, -- 系统用户ID，实际应用中应该从上下文获取
      'status_change',
      JSON_OBJECT('status', OLD.status),
      JSON_OBJECT('status', NEW.status),
      CONCAT('状态从 ', OLD.status, ' 变更为 ', NEW.status)
    );
  END IF;
END //
DELIMITER ;

-- 创建索引优化查询性能
CREATE INDEX idx_tasks_status_due_date ON tasks(status, due_date);
CREATE INDEX idx_tasks_assigned_status ON tasks(assigned_to, status);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_task_logs_task_created ON task_logs(task_id, created_at);

-- 显示创建结果
SELECT 'Database initialization completed successfully!' as message;