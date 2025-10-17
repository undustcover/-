# 多阶段构建
# 第一阶段：构建应用
FROM node:20-alpine as build-stage

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖（包括开发依赖，用于构建）
RUN npm ci --include=dev

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 第二阶段：生产环境
FROM nginx:alpine as production-stage

# 复制构建产物到nginx目录
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 复制nginx配置文件
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]