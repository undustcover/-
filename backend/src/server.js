const app = require('./app');
const db = require('./config/database');

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

// 启动服务器
const server = app.listen(PORT, HOST, async () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`健康检查: http://${HOST}:${PORT}/health`);
  console.log(`API文档: http://${HOST}:${PORT}/api-docs`);
  console.log(`服务器正在监听地址: ${server.address().address}:${server.address().port}`);
  
  // 测试数据库连接
  try {
    await db.testConnection();
    console.log('数据库连接测试完成');
    console.log('服务器正在运行，等待请求...');
  } catch (error) {
    console.error('数据库连接测试失败:', error);
  }
});

// 监听服务器错误
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用`);
  } else {
    console.error('服务器启动错误:', err);
  }
  process.exit(1);
});

// 保持进程运行
process.stdin.resume();

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