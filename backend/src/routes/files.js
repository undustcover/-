const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');

// 所有路由都需要认证
router.use(authenticateToken);

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器已移至multer配置中

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 默认10MB
  },
  // 确保正确处理中文文件名
  preservePath: false,
  fileFilter: (req, file, cb) => {
    // 处理中文文件名编码
    if (file.originalname) {
      try {
        // 尝试修复可能的编码问题
        const originalBuffer = Buffer.from(file.originalname, 'latin1');
        file.originalname = originalBuffer.toString('utf8');
      } catch (error) {
        console.log('文件名编码处理失败:', error.message);
      }
    }
    
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip,rar').split(',');
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${ext}`), false);
    }
  }
});

// 创建文件夹
router.post('/folder', async (req, res) => {
  try {
    const { name, path: folderPath } = req.body;
    const userId = req.user.id;
    
    if (!name) {
      return res.status(400).json({ error: '文件夹名称不能为空' });
    }
    
    // 检查文件夹名称是否已存在
    const existingFolder = await query(
      'SELECT id FROM task_files WHERE original_name = ? AND is_folder = 1 AND (file_path = ? OR file_path IS NULL)',
      [name, folderPath || '']
    );
    
    if (existingFolder.length > 0) {
      return res.status(400).json({ error: '文件夹名称已存在' });
    }
    
    // 创建文件夹记录
    const sql = `
      INSERT INTO task_files (
        original_name, 
        filename, 
        file_path, 
        file_size, 
        mime_type, 
        uploaded_by, 
        is_folder,
        created_at
      ) VALUES (?, ?, ?, 0, 'folder', ?, 1, datetime('now', 'localtime'))
    `;
    
    const folderFullPath = folderPath ? `${folderPath}/${name}` : name;
    // file_path应该是父路径，不包含当前文件夹名
    const result = await query(sql, [name, name, folderPath || '', userId]);
    
    res.status(201).json({
      message: '文件夹创建成功',
      folder: {
        id: result.lastID,
        name: name,
        path: folderPath || '',
        type: 'folder',
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('创建文件夹错误:', error);
    res.status(500).json({ error: '创建文件夹失败' });
  }
});

// 上传文件
router.post('/upload', 
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '请选择要上传的文件' });
      }
      
      const { task_id, description, path } = req.body;
      const userId = req.user.id;
      
      // 保存文件信息到数据库
      // 处理可能的中文文件名编码问题
      let originalName = req.file.originalname;
      
      // 检测并修复编码问题
      try {
        // 如果文件名包含乱码字符，尝试重新编码
        if (originalName.includes('�') || /[\x80-\xFF]/.test(originalName)) {
          // 尝试从ISO-8859-1转换为UTF-8
          const buffer = Buffer.from(originalName, 'binary');
          originalName = buffer.toString('utf8');
          console.log('文件名编码修复:', req.file.originalname, '->', originalName);
        }
      } catch (error) {
        console.log('文件名编码修复失败:', error.message);
        originalName = req.file.originalname; // 使用原始名称
      }
      
      console.log('最终文件名:', originalName);
      
      // 逻辑文件夹路径（用于目录隔离），不存储磁盘绝对路径
      // 根目录使用空字符串''，子目录为'folder/subfolder'形式
      const folderPath = (typeof path === 'string') ? path.trim() : '';
      
      // 仅存储父目录路径到数据库，文件名单独存储在 filename 字段
      // 兼容旧数据：后续列表查询对旧数据进行前端过滤
      const storedFilePath = folderPath;
      
      const sql = `
        INSERT INTO task_files (task_id, uploaded_by, original_name, filename, file_path, file_size, mime_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
      `;
      
      const params = [
        task_id || null,
        userId,
        originalName, // 使用修复后的文件名
        req.file.filename,
        storedFilePath, // 仅存储父目录路径
        req.file.size,
        req.file.mimetype
      ];
      
      console.log('执行SQL:', sql);
      console.log('参数:', params);
      
      const result = await query(sql, params);
      
      const fileInfo = {
        id: result.insertId,
        task_id: task_id || null,
        original_name: req.file.originalname,
        filename: req.file.filename,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        upload_url: `/api/files/download/${result.insertId}`,
        path: storedFilePath,
        created_at: new Date()
      };
      
      res.status(201).json({
        message: '文件上传成功',
        file: fileInfo
      });
    } catch (error) {
      console.error('文件上传错误:', error);
      res.status(500).json({ error: error.message || '文件上传失败' });
    }
  }
);

// 获取文件列表
router.get('/', async (req, res) => {
  try {
    console.log('获取文件列表请求:', req.query);
    const { task_id, page = 1, limit = 20, currentPath = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT 
        id,
        original_name as name,
        filename,
        file_path as path,
        file_size as size,
        mime_type,
        task_id,
        uploaded_by,
        is_folder,
        created_at,
        updated_at
      FROM task_files 
      WHERE 1=1
    `;
    
    const params = [];
    
    if (task_id) {
      sql += ' AND task_id = ?';
      params.push(task_id);
    }
    
    // 添加路径过滤
    if (currentPath && currentPath.trim() !== '') {
      // 当前目录：仅显示直接子文件夹和文件
      // 子文件夹：is_folder = 1 且 file_path = currentPath
      // 子文件：is_folder = 0 且 file_path = currentPath
      sql += ' AND ((is_folder = 1 AND file_path = ?) OR (is_folder = 0 AND file_path = ?))';
      params.push(currentPath, currentPath);
    } else {
      // 根目录：只显示没有路径或路径为空的文件和文件夹
      sql += ' AND (file_path IS NULL OR file_path = "")';
    }
    
    sql += ' ORDER BY is_folder DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    console.log('执行SQL:', sql);
    console.log('参数:', params);
    
    const files = await query(sql, params);
    console.log('查询结果:', files);
    
    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM task_files WHERE 1=1';
    const countParams = [];
    
    if (task_id) {
      countSql += ' AND task_id = ?';
      countParams.push(task_id);
    }
    
    // 添加路径过滤到计数查询
    if (currentPath && currentPath.trim() !== '') {
      // 当前目录：仅统计直接子文件夹和文件
      countSql += ' AND ((is_folder = 1 AND file_path = ?) OR (is_folder = 0 AND file_path = ?))';
      countParams.push(currentPath, currentPath);
    } else {
      // 根目录：只显示没有路径或路径为空的文件和文件夹
      countSql += ' AND (file_path IS NULL OR file_path = "")';
    }
    
    const countResult = await query(countSql, countParams);
    const total = countResult[0].total;
    
    // 格式化文件数据
    const formattedFiles = files.map(file => ({
      id: file.id,
      name: file.name,
      type: file.is_folder ? 'folder' : 'file',
      size: file.size,
      mime_type: file.mime_type,
      path: file.path,
      task_id: file.task_id,
      uploaded_by: file.uploaded_by,
      created_at: file.created_at,
      updated_at: file.updated_at
    }));
    
    res.json({
      files: formattedFiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取文件列表错误:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ error: '获取文件列表失败', details: error.message });
  }
});

// 下载文件
router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取文件信息
    const sql = 'SELECT * FROM task_files WHERE id = ?';
    const files = await query(sql, [id]);
    
    if (files.length === 0) {
      return res.status(404).json({ error: '文件不存在' });
    }
    
    const file = files[0];
    
    // 统一使用uploads目录 + filename定位磁盘文件
    const diskPath = path.resolve(__dirname, '../../uploads', file.filename);
    
    // 检查文件是否存在于磁盘
    if (!fs.existsSync(diskPath)) {
      return res.status(404).json({ error: '文件已被删除' });
    }
    
    // 设置响应头，正确处理中文文件名
    // 移除文件名中的所有可能导致HTTP头部错误的特殊字符
    const safeFilename = file.original_name
      .replace(/[\r\n\t]/g, '_')  // 将换行符、回车符、制表符替换为下划线
      .replace(/[\\"']/g, '')  // 移除引号
      .replace(/[\x00-\x1f\x7f-\x9f]/g, '')  // 移除控制字符
      .trim(); // 移除首尾空格
    
    // 使用更安全的方式设置Content-Disposition，只使用UTF-8编码的filename*参数
    const encodedFilename = encodeURIComponent(safeFilename);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Type', file.mime_type);
    
    // 发送文件
    res.sendFile(diskPath);
  } catch (error) {
    console.error('文件下载错误:', error);
    res.status(500).json({ error: '文件下载失败' });
  }
});

// 删除文件
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // 获取文件信息
    const sql = 'SELECT * FROM task_files WHERE id = ?';
    const files = await query(sql, [id]);
    
    if (files.length === 0) {
      return res.status(404).json({ error: '文件不存在' });
    }
    
    const file = files[0];
    
    // 权限检查：只有文件上传者或管理员可以删除
    if (
      file.uploaded_by !== userId &&
      req.user.role !== 'admin' &&
      req.user.role !== 'super_admin'
    ) {
      return res.status(403).json({ error: '无权删除此文件' });
    }
    
    // 从数据库删除记录
    await query('DELETE FROM task_files WHERE id = ?', [id]);
    
    // 删除磁盘文件（统一从uploads目录定位）
    const diskPath = path.resolve(__dirname, '../../uploads', file.filename);
    if (fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath);
    }
    
    res.json({ message: '文件删除成功' });
  } catch (error) {
    console.error('删除文件错误:', error);
    res.status(500).json({ error: '删除文件失败' });
  }
});

// 获取文件详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT tf.*, u.real_name as uploader_name, t.title as task_title
      FROM task_files tf
      LEFT JOIN users u ON tf.uploaded_by = u.id
      LEFT JOIN tasks t ON tf.task_id = t.id
      WHERE tf.id = ?
    `;
    
    const files = await query(sql, [id]);
    
    if (files.length === 0) {
      return res.status(404).json({ error: '文件不存在' });
    }
    
    const file = files[0];
    file.download_url = `/api/files/download/${file.id}`;
    
    res.json({
      message: '获取文件详情成功',
      file
    });
  } catch (error) {
    console.error('获取文件详情错误:', error);
    res.status(500).json({ error: '获取文件详情失败' });
  }
});

module.exports = router;