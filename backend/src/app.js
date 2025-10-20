const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();

// 中间件配置
app.use(helmet()); // 安全头
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173'
  ],
  credentials: true
})); // 跨域

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
app.use(compression()); // 压缩
app.use(morgan('combined')); // 日志
app.use(express.json({ limit: '10mb' })); // JSON解析
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL编码解析

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 路由配置
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const taskDependencyRoutes = require('./routes/taskDependencies');
const milestoneRoutes = require('./routes/milestones');
const fileRoutes = require('./routes/files');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/task-dependencies', taskDependencyRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;