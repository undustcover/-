# PostgreSQL数据库设置指南

本指南将帮助您配置PostgreSQL数据库以供任务管理系统使用。

## 前提条件

1. 确保PostgreSQL已安装并运行
2. 确保您有PostgreSQL的管理员权限

## 设置步骤

### 1. 连接到PostgreSQL

使用以下命令连接到PostgreSQL（需要管理员权限）：

```bash
# Windows (如果psql在PATH中)
psql -U postgres

# 或者使用完整路径
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres
```

### 2. 创建数据库和用户

在PostgreSQL命令行中执行以下SQL命令：

```sql
-- 创建数据库
CREATE DATABASE task_management;

-- 创建用户（可选，如果不想使用postgres用户）
CREATE USER task_user WITH PASSWORD 'your_password_here';

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE task_management TO task_user;

-- 连接到新数据库
\c task_management;

-- 授予schema权限
GRANT ALL ON SCHEMA public TO task_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO task_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO task_user;

-- 退出
\q
```

### 3. 更新环境变量

在 `.env` 文件中更新以下配置：

```env
# 数据库配置
DB_TYPE=postgresql
DB_HOST=localhost
DB_USER=postgres  # 或者使用 task_user
DB_PASSWORD=your_actual_password  # 替换为实际密码
DB_NAME=task_management
DB_PORT=5432
```

### 4. 常见问题解决

#### 问题1: 密码认证失败

如果遇到密码认证失败，请按以下步骤重置密码：

**方法1: 使用自动化脚本（推荐）**

1. 以管理员身份运行PowerShell或命令提示符
2. 执行重置脚本：
```bash
# 进入后端目录
cd backend
# 以管理员身份运行重置脚本
.\reset-postgresql-password.bat
```
3. 按提示输入新密码
4. 将新密码更新到 `.env` 文件中

**方法2: 手动重置**

1. 停止PostgreSQL服务：
```bash
net stop postgresql-x64-17
```

2. 备份并修改 `pg_hba.conf` 文件（位于 `C:\Program Files\PostgreSQL\17\data\`）：
   - 备份原文件
   - 临时将认证方式改为 `trust`

3. 重启服务并重置密码：
```bash
net start postgresql-x64-17
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "ALTER USER postgres PASSWORD 'your_new_password';"
```

4. 恢复原始 `pg_hba.conf` 配置并重启服务

#### 问题2: 连接被拒绝

检查PostgreSQL服务是否运行：

```powershell
Get-Service -Name postgresql*
```

#### 问题3: 找不到psql命令

psql通常位于PostgreSQL安装目录的bin文件夹中：

```
C:\Program Files\PostgreSQL\17\bin\psql.exe
```

### 5. 验证连接

配置完成后，重启应用程序：

```bash
npm start
```

查看日志，应该看到：
- "开始初始化PostgreSQL表结构..."
- "PostgreSQL数据库连接成功"
- "PostgreSQL表结构初始化完成"

## 数据迁移

如果您需要从SQLite迁移数据到PostgreSQL，请：

1. 先备份SQLite数据
2. 确保PostgreSQL连接正常
3. 运行数据迁移脚本（如果有）

## 注意事项

1. 请确保PostgreSQL版本兼容（推荐12+）
2. 生产环境中请使用强密码
3. 定期备份数据库
4. 监控数据库性能

## 支持

如果遇到问题，请检查：
1. PostgreSQL日志文件
2. 应用程序日志
3. 网络连接
4. 防火墙设置