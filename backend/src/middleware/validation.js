const Joi = require('joi');

// 通用验证中间件
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { allowUnknown: true });
    if (error) {
      const errorMessage = error.details[0].message;
      return res.status(400).json({ error: errorMessage });
    }
    next();
  };
};

// 用户相关验证规则
const userSchemas = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      'string.alphanum': '用户名只能包含字母和数字',
      'string.min': '用户名至少3个字符',
      'string.max': '用户名最多30个字符',
      'any.required': '用户名是必填项'
    }),
    email: Joi.string().email().required().messages({
      'string.email': '请输入有效的邮箱地址',
      'any.required': '邮箱是必填项'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': '密码至少6个字符',
      'any.required': '密码是必填项'
    }),
    real_name: Joi.string().max(50).required().messages({
      'string.max': '真实姓名最多50个字符',
      'any.required': '真实姓名是必填项'
    }),
    department: Joi.string().max(100).optional(),
    department_id: Joi.string().max(100).allow('').optional(),
    position: Joi.string().max(100).optional(),
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/).allow('').optional().messages({
      'string.pattern.base': '请输入有效的手机号码'
    })
  }),

  login: Joi.object({
    username: Joi.string().required().messages({
      'any.required': '用户名是必填项'
    }),
    password: Joi.string().required().messages({
      'any.required': '密码是必填项'
    })
  }),

  updateProfile: Joi.object({
    real_name: Joi.string().max(50).optional(),
    department: Joi.string().max(100).optional(),
    position: Joi.string().max(100).optional(),
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional().messages({
      'string.pattern.base': '请输入有效的手机号码'
    }),
    avatar: Joi.string().uri().optional(),
    location: Joi.string().max(100).allow('').optional(),
    join_date: Joi.date().iso().optional()
  }),

  updateUserByAdmin: Joi.object({
    real_name: Joi.string().max(50).optional(),
    department: Joi.string().max(100).optional(),
    position: Joi.string().max(100).optional(),
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional().messages({
      'string.pattern.base': '请输入有效的手机号码'
    }),
    avatar: Joi.string().uri().optional(),
    role: Joi.string().valid('employee', 'manager', 'admin', 'super_admin').optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
    location: Joi.string().max(100).allow('').optional(),
    join_date: Joi.date().iso().optional()
  }),

  changePassword: Joi.object({
    oldPassword: Joi.string().required().messages({
      'any.required': '原密码是必填项'
    }),
    newPassword: Joi.string().min(6).required().messages({
      'string.min': '新密码至少6个字符',
      'any.required': '新密码是必填项'
    })
  })
};

// 任务相关验证规则
const taskSchemas = {
  create: Joi.object({
    title: Joi.string().max(200).required().messages({
      'string.max': '任务标题最多200个字符',
      'any.required': '任务标题是必填项'
    }),
    description: Joi.string().optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    due_date: Joi.date().iso().optional(),
    assigned_to: Joi.number().integer().optional(),
    assignee_id: Joi.number().integer().optional(),
    category: Joi.string().valid('生产协调', '项目管理', '综合工作').optional(),
    tags: Joi.array().items(Joi.string().max(30)).optional(),
    estimated_hours: Joi.number().min(0).optional()
  }),

  update: Joi.object({
    title: Joi.string().max(200).optional(),
    description: Joi.string().optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled').optional(),
    due_date: Joi.date().iso().optional(),
    assigned_to: Joi.number().integer().optional(),
    assignee_id: Joi.number().integer().optional(),
    category: Joi.string().valid('生产协调', '项目管理', '综合工作').optional(),
    tags: Joi.array().items(Joi.string().max(30)).optional(),
    estimated_hours: Joi.number().min(0).optional(),
    actual_hours: Joi.number().min(0).optional(),
    progress: Joi.number().min(0).max(100).optional()
  }),

  transfer: Joi.object({
    new_assignee: Joi.number().integer().required().messages({
      'any.required': '新负责人是必填项'
    }),
    reason: Joi.string().max(500).optional()
  }),

  extend: Joi.object({
    new_due_date: Joi.date().iso().required().messages({
      'any.required': '新截止日期是必填项'
    }),
    reason: Joi.string().max(500).required().messages({
      'any.required': '延期原因是必填项'
    })
  }),

  addComment: Joi.object({
    content: Joi.string().min(1).max(1000).required().messages({
      'string.min': '评论内容不能为空',
      'string.max': '评论内容最多1000个字符',
      'any.required': '评论内容是必填项'
    })
  })
};

// 里程碑相关验证规则
const milestoneSchemas = {
  create: Joi.object({
    task_id: Joi.number().integer().required().messages({
      'any.required': '任务ID是必填项'
    }),
    title: Joi.string().max(200).required().messages({
      'string.max': '里程碑标题最多200个字符',
      'any.required': '里程碑标题是必填项'
    }),
    description: Joi.string().optional(),
    target_date: Joi.date().iso().required().messages({
      'any.required': '目标日期是必填项'
    }),
    reminder_days: Joi.number().integer().min(0).default(3)
  }),

  update: Joi.object({
    title: Joi.string().max(200).optional(),
    description: Joi.string().optional(),
    target_date: Joi.date().iso().optional(),
    reminder_days: Joi.number().integer().min(0).optional(),
    is_achieved: Joi.boolean().optional(),
    achieved_date: Joi.date().iso().optional()
  })
};

// 查询相关验证规则
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  taskFilter: Joi.object({
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled').optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
    assigned_to: Joi.number().integer().optional(),
    created_by: Joi.number().integer().optional(),
    category: Joi.string().optional(),
    due_date_start: Joi.date().iso().optional(),
    due_date_end: Joi.date().iso().optional(),
    keyword: Joi.string().max(100).optional()
  })
};

module.exports = {
  validate,
  userSchemas,
  taskSchemas,
  milestoneSchemas,
  querySchemas
};