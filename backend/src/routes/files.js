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

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip,rar').split(',');
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${ext}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 默认10MB
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
      
      const { task_id, description } = req.body;
      const userId = req.user.id;
      
      // 保存文件信息到数据库
      const sql = `
        INSERT INTO task_files (task_id, uploaded_by, original_name, filename, file_path, file_size, mime_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
      `;
      
      const params = [
        task_id || null,
        userId,
        req.file.originalname,
        req.file.filename,
        req.file.path,
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
    const {
      page = 1,
      limit = 10,
      task_id,
      uploaded_by,
      keyword
    } = req.query;
    
    let whereConditions = [];
    let params = [];
    
    if (task_id) {
      whereConditions.push('tf.task_id = ?');
      params.push(task_id);
    }
    
    if (uploaded_by) {
      whereConditions.push('tf.uploaded_by = ?');
      params.push(uploaded_by);
    }
    
    if (keyword) {
      whereConditions.push('tf.original_name LIKE ?');
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    
    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM task_files tf ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;
    
    // 获取数据
    const dataSql = `
      SELECT tf.*, u.real_name as uploader_name, t.title as task_title
      FROM task_files tf
      LEFT JOIN users u ON tf.uploaded_by = u.id
      LEFT JOIN tasks t ON tf.task_id = t.id
      ${whereClause}
      ORDER BY tf.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const files = await query(dataSql, [...params, parseInt(limit), offset]);
    
    // 添加下载URL
    files.forEach(file => {
      file.download_url = `/api/files/download/${file.id}`;
    });
    
    res.json({
      message: '获取文件列表成功',
      files,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取文件列表错误:', error);
    res.status(500).json({ error: '获取文件列表失败' });
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
    
    // 检查文件是否存在于磁盘
    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({ error: '文件已被删除' });
    }
    
    // 设置响应头
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
    res.setHeader('Content-Type', file.mime_type);
    
    // 发送文件
    res.sendFile(path.resolve(file.file_path));
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
    
    // 删除磁盘文件
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
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