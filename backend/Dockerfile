# 使用官方Node.js 18镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 安装curl用于健康检查
RUN apk add --no-cache curl

# 复制源代码
COPY . .

# 创建数据目录
RUN mkdir -p data

# 创建上传目录
RUN mkdir -p uploads

# 设置权限
RUN chown -R node:node /app

# 切换到非root用户
USER node

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# 启动应用
CMD ["node", "src/server.js"]