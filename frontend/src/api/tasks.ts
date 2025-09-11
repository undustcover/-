import { request } from './http'
import type { Task, CreateTaskRequest, UpdateTaskRequest, TaskFilter, PaginatedResponse } from '@/types/task'

export const taskApi = {
  // 获取任务列表
  getTasks(params?: TaskFilter & { page?: number; limit?: number }) {
    return request.get<PaginatedResponse<Task>>('/tasks', { params })
  },

  // 获取单个任务详情
  getTask(id: string) {
    return request.get<Task>(`/tasks/${id}`)
  },

  // 创建任务
  createTask(data: CreateTaskRequest) {
    return request.post<Task>('/tasks', data)
  },

  // 更新任务
  updateTask(id: string, data: UpdateTaskRequest) {
    return request.put<Task>(`/tasks/${id}`, data)
  },

  // 删除任务
  deleteTask(id: string) {
    return request.delete(`/tasks/${id}`)
  },

  // 更新任务状态
  updateTaskStatus(id: string, status: string) {
    return request.patch<Task>(`/tasks/${id}/status`, { status })
  },

  // 分配任务
  assignTask(id: string, assignee_id: string) {
    return request.patch<Task>(`/tasks/${id}/assign`, { assignee_id })
  },

  // 获取任务统计
  getTaskStats(params?: { department_id?: string; start_date?: string; end_date?: string }) {
    return request.get('/tasks/stats', { params })
  },

  // 获取我的任务
  getMyTasks(params?: { status?: string; page?: number; limit?: number }) {
    return request.get<PaginatedResponse<Task>>('/tasks/my', { params })
  },

  // 获取部门任务
  getDepartmentTasks(departmentId: string, params?: TaskFilter & { page?: number; limit?: number }) {
    return request.get<PaginatedResponse<Task>>(`/departments/${departmentId}/tasks`, { params })
  },

  // 批量更新任务
  batchUpdateTasks(taskIds: string[], data: Partial<UpdateTaskRequest>) {
    return request.patch('/tasks/batch', { task_ids: taskIds, ...data })
  },

  // 复制任务
  duplicateTask(id: string) {
    return request.post<Task>(`/tasks/${id}/duplicate`)
  },

  // 获取任务操作日志
  getTaskLogs(id: string, params?: { page?: number; limit?: number }) {
    return request.get(`/tasks/${id}/logs`, { params })
  },

  // 最近活动（任务创建与状态变更）
  getRecentActivities(params?: { limit?: number; offset?: number }) {
    return request.get('/tasks/recent-activities', { params })
  },

  // 添加任务评论
  addTaskComment(id: string, content: string) {
    return request.post(`/tasks/${id}/comments`, { content })
  },

  // 获取任务评论
  getTaskComments(id: string) {
    return request.get(`/tasks/${id}/comments`)
  }
}