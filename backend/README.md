# 任务管理系统后端 API

基于 Node.js + Express + MySQL 构建的任务管理系统后端服务。

## 功能特性

- 🔐 用户认证与授权（JWT）
- 👥 多角色权限管理（用户、经理、管理员）
- 📋 任务创建、分配、跟踪管理
- 📊 任务统计与报表分析
- 📁 文件上传与管理
- 🔔 系统通知功能
- 📈 任务延期申请流程
- 🗃️ 操作日志记录
- 🔍 全文搜索支持

## 技术栈

- **运行环境**: Node.js 16+
- **Web框架**: Express.js
- **数据库**: MySQL 8.0+
- **认证**: JWT (JSON Web Token)
- **密码加密**: bcryptjs
- **数据验证**: Joi
- **文件上传**: Multer
- **日志记录**: 自定义Logger
- **开发工具**: Nodemon, ESLint, Prettier

## 项目结构

```
backend/
├── src/
│   ├── app.js              # Express应用配置
│   ├── server.js           # 服务器启动文件
│   ├── config/
│   │   ├── database.js     # 数据库连接配置
│   │   └── init-db.sql     # 数据库初始化脚本
│   ├── controllers/        # 控制器层
│   │   ├── authController.js
│   │   └── taskController.js
│   ├── middleware/         # 中间件
│   │   ├── auth.js         # 认证中间件
│   │   └── validation.js   # 数据验证中间件
│   ├── models/             # 数据模型层
│   │   ├── User.js
│   │   └── Task.js
│   ├── routes/             # 路由层
│   │   ├── auth.js         # 认证路由
│   │   ├── tasks.js        # 任务路由
│   │   ├── users.js        # 用户路由
│   │   ├── files.js        # 文件路由
│   │   ├── notifications.js # 通知路由
│   │   └── reports.js      # 报表路由
│   └── utils/              # 工具函数
│       ├── helpers.js      # 通用工具函数
│       └── logger.js       # 日志工具
├── uploads/                # 文件上传目录
├── logs/                   # 日志文件目录
├── .env                    # 环境变量配置
├── package.json
└── README.md
```

## 快速开始

### 1. 环境要求

- Node.js 16.0 或更高版本
- MySQL 8.0 或更高版本
- npm 或 yarn 包管理器

### 2. 安装依赖

```bash
cd backend
npm install
```

### 3. 数据库配置

1. 创建 MySQL 数据库：
```sql
CREATE DATABASE task_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 执行数据库初始化脚本：
```bash
npm run init-db
```

或手动执行：
```bash
mysql -u root -p task_management < src/config/init-db.sql
```

### 4. 环境变量配置

复制并修改 `.env` 文件：

```bash
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=task_management

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=7d

# 文件上传配置
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip,rar
```

### 5. 启动服务

开发模式（热重载）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

服务启动后访问：http://localhost:3000

## API 文档

### 认证相关 API

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "real_name": "测试用户",
  "phone": "13800138000",
  "department": "技术部"
}
```

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

#### 获取当前用户信息
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### 任务相关 API

#### 创建任务
```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "任务标题",
  "description": "任务描述",
  "priority": "high",
  "category": "开发",
  "assigned_to": 2,
  "due_date": "2024-12-31 23:59:59",
  "estimated_hours": 8
}
```

#### 获取任务列表
```http
GET /api/tasks?page=1&limit=10&status=pending&priority=high
Authorization: Bearer <token>
```

#### 更新任务
```http
PUT /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_progress",
  "progress": 50,
  "actual_hours": 4
}
```

### 文件上传 API

#### 上传文件
```http
POST /api/files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <file>
task_id: 1
description: 文件描述
```

### 报表统计 API

#### 获取任务统计
```http
GET /api/reports/tasks/stats?start_date=2024-01-01&end_date=2024-12-31
Authorization: Bearer <token>
```

## 数据库设计

### 主要数据表

- **users**: 用户表
- **tasks**: 任务表
- **task_logs**: 任务操作日志表
- **files**: 文件表
- **notifications**: 通知表
- **task_extensions**: 任务延期申请表
- **system_configs**: 系统配置表

### 用户角色权限

- **user**: 普通用户 - 可以查看和操作自己的任务
- **manager**: 部门经理 - 可以管理部门内的任务和用户
- **admin**: 系统管理员 - 可以管理所有用户和任务
- **super_admin**: 超级管理员 - 拥有所有权限

## 开发指南

### 代码规范

运行代码检查：
```bash
npm run lint
```

格式化代码：
```bash
npm run format
```

### 日志系统

系统使用自定义的日志工具，支持多级别日志记录：

```javascript
const { logger } = require('./src/utils/logger');

logger.info('信息日志');
logger.warn('警告日志');
logger.error('错误日志');
logger.debug('调试日志');
```

### 错误处理

统一的错误响应格式：

```json
{
  "error": "错误信息",
  "code": "ERROR_CODE",
  "details": {}
}
```

### 数据验证

使用 Joi 进行数据验证，所有输入数据都会经过验证中间件处理。

## 部署说明

### 生产环境配置

1. 设置环境变量 `NODE_ENV=production`
2. 配置生产数据库连接
3. 设置强密码的 JWT 密钥
4. 配置反向代理（如 Nginx）
5. 设置 SSL 证书
6. 配置日志轮转

### Docker 部署

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

## 常见问题

### Q: 数据库连接失败
A: 检查数据库配置信息，确保 MySQL 服务正在运行，用户名密码正确。

### Q: JWT Token 过期
A: 使用刷新令牌接口获取新的访问令牌，或重新登录。

### Q: 文件上传失败
A: 检查上传目录权限，确认文件大小和类型符合限制。

### Q: 权限不足
A: 确认用户角色和权限设置，某些操作需要管理员权限。

## 更新日志

### v1.0.0 (2024-01-15)
- 初始版本发布
- 基础用户认证功能
- 任务管理核心功能
- 文件上传功能
- 基础报表统计

## 许可证

ISC License

## 联系方式

如有问题或建议，请联系开发团队。