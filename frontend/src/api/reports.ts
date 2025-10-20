import request from './http'

// 报表统计相关API
export const reportsApi = {
  // 获取任务统计报表
  getTasksStats: (params?: {
    start_date?: string
    end_date?: string
    department?: string
    user_id?: string
  }) => {
    return request.get('/reports/tasks/stats', { params })
  },

  // 获取任务趋势报表
  getTasksTrend: (params?: {
    start_date?: string
    end_date?: string
    period?: 'week' | 'month' | 'quarter'
    department?: string
  }) => {
    return request.get('/reports/tasks/trends', { params })
  },

  // 获取工作类型统计报表
  getWorkTypesStats: (params?: {
    start_date?: string
    end_date?: string
  }) => {
    return request.get('/reports/work-types/stats', { params })
  },

  // 获取部门绩效报表
  getDepartmentsPerformance: (params?: {
    start_date?: string
    end_date?: string
  }) => {
    return request.get('/reports/departments/performance', { params })
  },

  // 获取个人绩效报表
  getUsersPerformance: (params?: {
    user_id?: string
    start_date?: string
    end_date?: string
  }) => {
    return request.get('/reports/users/performance', { params })
  },

  // 导出报表数据
  exportTasks: (params?: {
    start_date?: string
    end_date?: string
    status?: string
    department?: string
  }) => {
    return request.get('/reports/export/tasks', { 
      params,
      responseType: 'blob'
    })
  },
  // 获取逾期任务明细
  getOverdueTasks: (params?: {
    start_date?: string
    end_date?: string
    department?: string
    user_id?: string
    keyword?: string
    page?: number
    limit?: number
  }) => {
    return request.get('/reports/tasks/overdue', { params })
  }
}

export default reportsApi