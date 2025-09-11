const app = require('./app');
const db = require('./config/database');

const PORT = process.env.PORT || 3000;

// 启动服务器
const server = app.listen(PORT, async () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log(`API文档: http://localhost:${PORT}/api-docs`);
  
  // 测试数据库连接
  try {
    await db.testConnection();
    console.log('数据库连接测试完成');
  } catch (error) {
    console.error('数据库连接测试失败:', error);
  }
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    db.end();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    db.end();
    process.exit(0);
  });
});

// 错误处理
process.on('uncaughtException', (err) => {
  console.error('未捕获异常:', err);
  // 在记录日志后，优雅地关闭服务器
  server.close(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  // 在记录日志后，优雅地关闭服务器
  server.close(() => {
    process.exit(1);
  });
});