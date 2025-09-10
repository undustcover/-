# API接口文档与开发记录

## 📋 文档信息
- **文档版本**: V1.0
- **创建日期**: 2024年
- **项目名称**: 部门工作任务管理系统
- **API版本**: v1
- **基础URL**: `http://localhost:3000/api`

---

## 🔧 API设计规范

### 通用规范
1. **RESTful设计**: 遵循REST API设计原则
2. **统一响应格式**: 所有接口返回统一的JSON格式
3. **HTTP状态码**: 正确使用HTTP状态码
4. **认证方式**: JWT Token认证
5. **错误处理**: 统一的错误响应格式

### 请求格式
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

### 响应格式
```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 错误响应格式
```json
{
  "success": false,
  "code": 400,
  "message": "错误描述",
  "error": "详细错误信息",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 🔐 认证授权接口

### 用户登录
**接口地址**: `POST /api/auth/login`

**请求参数**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_string",
    "user": {
      "id": 1,
      "username": "admin",
      "name": "管理员",
      "role": "admin",
      "email": "admin@example.com"
    },
    "expires_in": 86400
  }
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 用户注册
**接口地址**: `POST /api/auth/register`

**请求参数**:
```json
{
  "username": "string",
  "password": "string",
  "name": "string",
  "email": "string",
  "role": "member"
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "newuser",
    "name": "新用户",
    "role": "member"
  }
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 刷新Token
**接口地址**: `POST /api/auth/refresh`

**请求参数**:
```json
{
  "refresh_token": "string"
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

---

## 👥 用户管理接口

### 获取用户列表
**接口地址**: `GET /api/users`

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)
- `role`: 角色筛选 (可选)
- `search`: 搜索关键词 (可选)

**响应数据**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "admin",
        "name": "管理员",
        "email": "admin@example.com",
        "role": "admin",
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 创建用户
**接口地址**: `POST /api/users`

**请求参数**:
```json
{
  "username": "string",
  "password": "string",
  "name": "string",
  "email": "string",
  "role": "admin|manager|member"
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 更新用户信息
**接口地址**: `PUT /api/users/:id`

**请求参数**:
```json
{
  "name": "string",
  "email": "string",
  "role": "admin|manager|member",
  "status": "active|inactive"
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 删除用户
**接口地址**: `DELETE /api/users/:id`

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

---

## 📋 任务管理接口

### 获取任务列表
**接口地址**: `GET /api/tasks`

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)
- `status`: 状态筛选 (可选)
- `assignee`: 负责人筛选 (可选)
- `project`: 项目筛选 (可选)
- `priority`: 优先级筛选 (可选)
- `start_date`: 开始时间筛选 (可选)
- `end_date`: 结束时间筛选 (可选)

**响应数据**:
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": 1,
        "title": "任务标题",
        "description": "任务描述",
        "status": "pending|in_progress|completed|paused|cancelled",
        "priority": "high|medium|low",
        "start_date": "2024-01-01",
        "end_date": "2024-01-10",
        "assignee": {
          "id": 1,
          "name": "张三",
          "username": "zhangsan"
        },
        "collaborators": [
          {
            "id": 2,
            "name": "李四",
            "username": "lisi"
          }
        ],
        "parent_id": null,
        "level": 1,
        "category": "production|project|comprehensive",
        "progress": 50,
        "created_by": {
          "id": 1,
          "name": "管理员"
        },
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 创建任务
**接口地址**: `POST /api/tasks`

**请求参数**:
```json
{
  "title": "string",
  "description": "string",
  "start_date": "2024-01-01",
  "end_date": "2024-01-10",
  "assignee_id": 1,
  "collaborator_ids": [2, 3],
  "priority": "high|medium|low",
  "category": "production|project|comprehensive",
  "parent_id": null,
  "dependencies": [1, 2]
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 获取任务详情
**接口地址**: `GET /api/tasks/:id`

**响应数据**:
```json
{
  "success": true,
  "data": {
    "task": {
      "id": 1,
      "title": "任务标题",
      "description": "任务描述",
      "status": "in_progress",
      "priority": "high",
      "start_date": "2024-01-01",
      "end_date": "2024-01-10",
      "assignee": {
        "id": 1,
        "name": "张三"
      },
      "collaborators": [],
      "dependencies": [],
      "subtasks": [],
      "steps": [],
      "milestones": [],
      "files": [],
      "comments": [],
      "change_logs": []
    }
  }
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 更新任务
**接口地址**: `PUT /api/tasks/:id`

**请求参数**:
```json
{
  "title": "string",
  "description": "string",
  "status": "pending|in_progress|completed|paused|cancelled",
  "priority": "high|medium|low",
  "start_date": "2024-01-01",
  "end_date": "2024-01-10",
  "progress": 75
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 删除任务
**接口地址**: `DELETE /api/tasks/:id`

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 任务分配
**接口地址**: `PUT /api/tasks/:id/assign`

**请求参数**:
```json
{
  "assignee_id": 1,
  "reason": "分配原因"
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 任务转移
**接口地址**: `POST /api/tasks/:id/transfer`

**请求参数**:
```json
{
  "new_assignee_id": 2,
  "reason": "转移原因"
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 任务延期申请
**接口地址**: `POST /api/tasks/:id/extend`

**请求参数**:
```json
{
  "new_end_date": "2024-01-20",
  "reason": "延期原因"
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

---

## 📁 文件管理接口

### 上传文件
**接口地址**: `POST /api/files/upload`

**请求参数**: `multipart/form-data`
- `file`: 文件对象
- `task_id`: 关联任务ID (可选)
- `description`: 文件描述 (可选)

**响应数据**:
```json
{
  "success": true,
  "data": {
    "file": {
      "id": 1,
      "filename": "document.pdf",
      "original_name": "需求文档.pdf",
      "size": 1024000,
      "mime_type": "application/pdf",
      "path": "/uploads/2024/01/document.pdf",
      "task_id": 1,
      "uploaded_by": {
        "id": 1,
        "name": "张三"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 获取文件列表
**接口地址**: `GET /api/files`

**查询参数**:
- `task_id`: 任务ID筛选 (可选)
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 下载文件
**接口地址**: `GET /api/files/:id/download`

**响应**: 文件流

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 删除文件
**接口地址**: `DELETE /api/files/:id`

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

---

## 🔔 通知管理接口

### 获取通知列表
**接口地址**: `GET /api/notifications`

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)
- `read`: 是否已读 (可选)
- `type`: 通知类型 (可选)

**响应数据**:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "title": "任务即将到期",
        "content": "您的任务'系统开发'将在3天后到期，请及时处理。",
        "type": "task_deadline",
        "read": false,
        "user_id": 1,
        "related_id": 1,
        "related_type": "task",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "unread_count": 5
  }
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 标记通知已读
**接口地址**: `PUT /api/notifications/:id/read`

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 批量标记已读
**接口地址**: `PUT /api/notifications/read-all`

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

---

## 📊 统计报表接口

### 获取任务统计
**接口地址**: `GET /api/statistics/tasks`

**查询参数**:
- `start_date`: 开始日期
- `end_date`: 结束日期
- `user_id`: 用户ID筛选 (可选)
- `category`: 任务类别筛选 (可选)

**响应数据**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_tasks": 100,
      "completed_tasks": 80,
      "in_progress_tasks": 15,
      "overdue_tasks": 5,
      "completion_rate": 80.0
    },
    "by_category": {
      "production": 40,
      "project": 35,
      "comprehensive": 25
    },
    "by_priority": {
      "high": 20,
      "medium": 50,
      "low": 30
    },
    "trend_data": [
      {
        "date": "2024-01-01",
        "completed": 5,
        "created": 8
      }
    ]
  }
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 生成报表
**接口地址**: `POST /api/reports/generate`

**请求参数**:
```json
{
  "type": "task_completion|project_progress|user_workload",
  "format": "excel|pdf|word",
  "filters": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "user_id": 1,
    "category": "project"
  }
}
```

**响应数据**:
```json
{
  "success": true,
  "data": {
    "report_id": "report_123456",
    "download_url": "/api/reports/report_123456/download",
    "expires_at": "2024-01-02T00:00:00Z"
  }
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

---

## 📋 看板接口

### 获取看板数据
**接口地址**: `GET /api/kanban/tasks`

**查询参数**:
- `view`: 视图类型 (status|user|project)
- `project_id`: 项目ID筛选 (可选)
- `user_id`: 用户ID筛选 (可选)

**响应数据**:
```json
{
  "success": true,
  "data": {
    "columns": [
      {
        "id": "pending",
        "title": "待开始",
        "tasks": [
          {
            "id": 1,
            "title": "任务标题",
            "assignee": "张三",
            "priority": "high",
            "end_date": "2024-01-10",
            "progress": 0
          }
        ]
      }
    ]
  }
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

---

## 📈 甘特图接口

### 获取甘特图数据
**接口地址**: `GET /api/gantt/project/:id`

**响应数据**:
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": 1,
        "text": "任务名称",
        "start_date": "2024-01-01",
        "end_date": "2024-01-10",
        "duration": 10,
        "progress": 0.5,
        "parent": 0,
        "type": "task",
        "dependencies": [2, 3]
      }
    ],
    "links": [
      {
        "id": 1,
        "source": 1,
        "target": 2,
        "type": "finish_to_start"
      }
    ]
  }
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 获取关键路径
**接口地址**: `GET /api/gantt/critical-path`

**查询参数**:
- `project_id`: 项目ID

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

---

## 🔧 后台管理接口

### 获取系统配置
**接口地址**: `GET /api/admin/config`

**响应数据**:
```json
{
  "success": true,
  "data": {
    "config": {
      "system_name": "任务管理系统",
      "max_file_size": 20971520,
      "notification_retention_days": 14,
      "auto_cleanup_enabled": true,
      "reminder_days_before_deadline": 3
    }
  }
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 更新系统配置
**接口地址**: `PUT /api/admin/config`

**请求参数**:
```json
{
  "max_file_size": 20971520,
  "notification_retention_days": 14,
  "reminder_days_before_deadline": 3
}
```

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

### 获取操作日志
**接口地址**: `GET /api/admin/logs`

**查询参数**:
- `page`: 页码
- `limit`: 每页数量
- `user_id`: 用户ID筛选
- `action`: 操作类型筛选
- `start_date`: 开始日期
- `end_date`: 结束日期

**开发记录**:
- 开发时间: [待填写]
- 开发人员: [待填写]
- 测试状态: [待测试]
- 问题记录: [无]

---

## 📝 开发记录模板

### 接口开发记录格式
```markdown
## 接口名称: [接口描述]
**接口地址**: `METHOD /api/endpoint`

### 开发信息
- **开发人员**: [姓名]
- **开发开始时间**: [YYYY-MM-DD HH:mm]
- **开发完成时间**: [YYYY-MM-DD HH:mm]
- **预计工时**: [X小时]
- **实际工时**: [X小时]

### 技术实现
- **使用技术**: [技术栈]
- **核心逻辑**: [实现思路]
- **数据库操作**: [SQL语句或ORM操作]
- **依赖模块**: [相关模块]

### 测试记录
- **单元测试**: [通过/失败]
- **集成测试**: [通过/失败]
- **测试用例**: [测试场景]
- **测试数据**: [测试数据说明]

### 问题记录
- **遇到问题**: [问题描述]
- **解决方案**: [解决过程]
- **影响范围**: [影响的其他模块]
- **经验总结**: [开发心得]

### 接口变更记录
- **变更时间**: [YYYY-MM-DD]
- **变更原因**: [变更说明]
- **变更内容**: [具体变更]
- **影响评估**: [对其他接口的影响]
```

---

## 🔄 版本更新记录

### V1.0 (初始版本)
- 创建API文档基础结构
- 定义所有核心接口
- 建立开发记录规范

### 后续版本
[在开发过程中持续更新]

---

**维护说明**: 
1. 每个接口开发完成后，必须更新对应的开发记录
2. 接口有任何变更，必须记录变更历史
3. 定期review接口文档，确保与实际实现一致
4. 所有接口必须通过测试后才能标记为完成

**责任人**: 
- API设计: 架构师
- 接口开发: 后端开发工程师
- 文档维护: 项目经理
- 测试验证: 测试工程师