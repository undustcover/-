// 任务状态
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

// 任务优先级
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

// 任务类型
export type TaskType = 'production_coordination' | 'project_management' | 'general_work'

// 任务信息
export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  category: TaskType
  assignee_id?: string
  assignee_name?: string
  creator_id: string
  creator_name: string
  department_id?: string
  department_name?: string
  parent_id?: string
  start_date?: string
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  progress: number
  tags?: string[]
  attachments?: TaskAttachment[]
  created_at: string
  updated_at: string
  completed_at?: string
}

// 任务附件
export interface TaskAttachment {
  id: string
  task_id: string
  filename: string
  original_name: string
  file_size: number
  file_type: string
  file_url: string
  uploaded_by: string
  uploaded_at: string
}

// 创建任务请求
export interface CreateTaskRequest {
  title: string
  description?: string
  priority: TaskPriority
  category: TaskType
  assignee_id?: string
  department_id?: string
  parent_id?: string
  start_date?: string
  due_date?: string
  estimated_hours?: number
  tags?: string[]
}

// 更新任务请求
export interface UpdateTaskRequest {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  category?: TaskType
  assignee_id?: string
  department_id?: string
  parent_id?: string
  start_date?: string
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  progress?: number
  tags?: string[]
}

// 任务筛选条件
export interface TaskFilter {
  status?: string
  priority?: string
  assigned_to?: string
  created_by?: string
  category?: string
  due_date_start?: string
  due_date_end?: string
  keyword?: string
  tags?: string[]
}

// 任务统计
export interface TaskStats {
  total: number
  pending: number
  in_progress: number
  completed: number
  cancelled: number
  overdue: number
  by_priority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  by_category: Record<TaskType, number>
  completion_rate: number
  average_completion_time: number
}

// 任务评论
export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  user_name: string
  content: string
  created_at: string
  updated_at: string
}

// 任务历史记录
export interface TaskHistory {
  id: string
  task_id: string
  user_id: string
  user_name: string
  action: string
  old_value?: string
  new_value?: string
  description: string
  created_at: string
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  pages: number
}

// 看板列
export interface KanbanColumn {
  id: string
  title: string
  status: TaskStatus
  tasks: Task[]
  color?: string
}

// 甘特图任务
export interface GanttTask {
  id: string
  title: string
  start: string
  end: string
  progress: number
  dependencies?: string[]
  assignee?: string
  priority: TaskPriority
  status: TaskStatus
}