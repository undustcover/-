# Docker部署指南

## 系统要求

- Docker Engine 20.10+
- Docker Compose 2.0+
- 至少2GB可用内存
- 至少5GB可用磁盘空间

## 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd proj6
```

### 2. 配置环境变量（可选）
```bash
# 复制环境变量模板
cp .env.docker .env.production

# 编辑生产环境配置
# 重要：请修改JWT密钥等敏感信息
vim .env.production
```

### 3. 构建并启动服务
```bash
# 使用 Compose 项目名统一为 task-manager 构建并启动
docker compose -p task-manager up -d --build

# 查看服务状态
docker compose -p task-manager ps

# 查看日志
docker compose -p task-manager logs -f
```

### 4. 访问应用

- 前端应用：`http://localhost:8082`
- 后端API：`http://localhost:8081`
- API文档：`http://localhost:8081/api-docs`
- 健康检查：`http://localhost:8081/health`

说明：如需使用传统端口（`80`/`8080`），请确保宿主机未占用这些端口，并在 `docker-compose.yml` 中将 `ports` 映射改回 `80:80` 和 `8080:8080` 后重启。

## 常用命令

### 服务管理
```bash
# 启动服务
docker compose -p task-manager up -d

# 停止服务
docker compose -p task-manager down

# 重启服务
docker compose -p task-manager up -d --build

# 查看服务状态
docker compose -p task-manager ps

# 查看日志
docker compose -p task-manager logs -f [service-name]
```

### 数据管理
```bash
# 备份数据库
docker-compose exec backend cp /app/data/production.db /app/data/backup-$(date +%Y%m%d).db

# 查看数据卷
docker volume ls

# 清理未使用的数据卷
docker volume prune
```

### 更新部署
```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build

# 清理旧镜像
docker image prune -f
```

## 数据持久化

系统使用Docker数据卷来持久化重要数据：

- `backend_data`：SQLite数据库文件
- `backend_uploads`：用户上传的文件

## 安全注意事项

1. **修改默认密钥**：生产环境必须修改JWT密钥
2. **网络安全**：建议使用反向代理（如Nginx）
3. **数据备份**：定期备份数据库和上传文件
4. **日志监控**：监控应用日志和系统资源

## 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # Windows 检查端口占用
   netstat -ano | findstr :80
   netstat -ano | findstr :8080

   # 释放旧容器占用的端口
   docker stop task-management-frontend task-management-backend
   docker rm task-management-frontend task-management-backend
   ```

2. **内存不足**
   ```bash
   # 检查系统资源
   docker stats
   ```

3. **数据库连接失败**
   ```bash
   # 检查后端日志
   docker-compose logs backend
   ```

4. **前端无法访问后端**
   ```bash
   # 验证后端健康检查（宿主机）
   curl -i http://localhost:8081/health

   # 验证前端到后端代理（宿主机）
   curl -i -X POST http://localhost:8082/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'
   ```

### 重置系统
```bash
# 停止所有服务
docker-compose down

# 删除数据卷（注意：这会删除所有数据）
docker-compose down -v

# 重新启动
docker-compose up -d --build
```

## 性能优化

1. **资源限制**：在docker-compose.yml中设置内存和CPU限制
2. **镜像优化**：使用多阶段构建减小镜像大小
3. **缓存策略**：合理配置Nginx缓存
4. **日志轮转**：配置日志轮转避免磁盘空间不足

## 监控和维护

建议定期执行以下维护任务：

1. 检查服务健康状态
2. 备份重要数据
3. 更新系统和依赖
4. 清理无用的Docker镜像和容器
5. 监控系统资源使用情况