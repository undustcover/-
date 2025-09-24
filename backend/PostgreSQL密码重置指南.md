# PostgreSQL密码重置指南

## 方法一：使用自动化脚本（推荐）

### 步骤1：以管理员身份运行PowerShell
1. 按 `Win + X`，选择「Windows PowerShell (管理员)」
2. 或者右键点击开始菜单，选择「Windows PowerShell (管理员)」

### 步骤2：执行重置脚本
```powershell
# 进入项目后端目录
cd d:\trae\proj6\backend

# 运行重置脚本
.\reset-postgres-manual.ps1
```

### 步骤3：按提示操作
- 脚本会自动停止PostgreSQL服务
- 修改配置文件允许无密码连接
- 提示输入新密码（可以直接按Enter使用默认密码 `postgres123`）
- 自动恢复配置并重启服务

## 方法二：手动重置（高级用户）

### 步骤1：停止PostgreSQL服务
```cmd
net stop postgresql-x64-17
```

### 步骤2：修改认证配置
1. 找到文件：`C:\Program Files\PostgreSQL\17\data\pg_hba.conf`
2. 备份原文件
3. 编辑文件，将所有 `md5` 或 `scram-sha-256` 改为 `trust`

### 步骤3：启动服务并重置密码
```cmd
net start postgresql-x64-17
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres
```

在psql命令行中执行：
```sql
ALTER USER postgres PASSWORD 'your_new_password';
\q
```

### 步骤4：恢复认证配置
1. 恢复 `pg_hba.conf` 文件
2. 重启PostgreSQL服务

## 方法三：重新安装PostgreSQL

如果以上方法都不行，可以考虑重新安装PostgreSQL：

1. 卸载当前PostgreSQL
2. 删除数据目录（注意备份重要数据）
3. 重新安装PostgreSQL
4. 在安装过程中设置新密码

## 验证密码重置

重置完成后，测试连接：

```powershell
$env:PGPASSWORD='your_new_password'
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "SELECT version();"
```

如果看到PostgreSQL版本信息，说明密码重置成功。

## 更新项目配置

密码重置成功后，更新 `.env` 文件：

```env
DB_TYPE=postgresql
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_new_password
DB_NAME=task_management
DB_PORT=5432
```

## 创建项目数据库

连接成功后，创建项目所需的数据库：

```sql
CREATE DATABASE task_management;
CREATE USER task_user WITH PASSWORD 'taskuser123';
GRANT ALL PRIVILEGES ON DATABASE task_management TO task_user;
```

## 常见问题

### Q: 提示"拒绝访问"
**A:** 确保以管理员身份运行命令

### Q: 找不到psql命令
**A:** PostgreSQL可能安装在不同位置，尝试：
- `C:\Program Files\PostgreSQL\16\bin\psql.exe`
- `C:\Program Files\PostgreSQL\15\bin\psql.exe`

### Q: 服务启动失败
**A:** 检查Windows事件查看器中的PostgreSQL日志

### Q: 仍然无法连接
**A:** 尝试重启计算机后再次测试

---

**注意：** 重置密码会影响所有使用PostgreSQL的应用程序，请确保更新所有相关配置。