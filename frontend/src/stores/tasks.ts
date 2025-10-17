import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { taskApi } from '@/api/tasks'
import type { Task, CreateTaskRequest, UpdateTaskRequest, TaskFilter } from '@/types/task'

export const useTasksStore = defineStore('tasks', () => {
  // 状态
  const tasks = ref<Task[]>([])
  const currentTask = ref<Task | null>(null)
  const loading = ref(false)
  const filter = ref<TaskFilter>({
    status: '',
    priority: '',
    assigned_to: '',
    category: '',
    keyword: '',
    due_date_start: '',
    due_date_end: ''
  })
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0
  })

  // 计算属性
  const tasksByStatus = computed(() => {
    return {
      pending: tasks.value.filter(task => task.status === 'pending'),
      in_progress: tasks.value.filter(task => task.status === 'in_progress'),
      completed: tasks.value.filter(task => task.status === 'completed'),
      cancelled: tasks.value.filter(task => task.status === 'cancelled')
    }
  })

  const tasksByPriority = computed(() => {
    return {
      low: tasks.value.filter(task => task.priority === 'low'),
      medium: tasks.value.filter(task => task.priority === 'medium'),
      high: tasks.value.filter(task => task.priority === 'high'),
      urgent: tasks.value.filter(task => task.priority === 'urgent')
    }
  })

  // 将后端任务结构映射为前端Task结构
  const mapBackendTask = (t: any): Task => {
    let tags: string[] = []
    if (Array.isArray(t?.tags)) {
      tags = t.tags
    } else if (typeof t?.tags === 'string') {
      try {
        const parsed = JSON.parse(t.tags)
        tags = Array.isArray(parsed) ? parsed : (t.tags.split(',').filter(Boolean))
      } catch {
        tags = t.tags.split(',').filter(Boolean)
      }
    }
    return {
      ...t,
      tags
    }
  }

  // 方法
  const fetchTasks = async (params?: any) => {
    loading.value = true
    const requestParams = {
      ...filter.value,
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...params
    }
    
    // 过滤掉空值参数
    const filteredParams = Object.fromEntries(
      Object.entries(requestParams).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
    )
    
    console.log('Tasks Store: 发送请求参数:', filteredParams)
    
    try {
      const response = await taskApi.getTasks(filteredParams)
      
      console.log('Tasks Store: API响应:', {
        status: response.status,
        dataType: typeof response.data,
        hasData: !!(response.data as any)?.tasks || !!(response.data as any)?.data,
        dataLength: ((response.data as any)?.tasks ?? (response.data as any)?.data ?? []).length,
        total: (response.data as any)?.pagination?.total ?? (response.data as any)?.total
      })
      
      const list = (response.data as any)?.tasks ?? (response.data as any)?.data ?? []
      tasks.value = list.map(mapBackendTask)
      
      const pg = (response.data as any)?.pagination
      if (pg) {
        pagination.value.total = pg.total ?? 0
        if (typeof pg.page !== 'undefined') pagination.value.page = pg.page
        if (typeof pg.limit !== 'undefined') pagination.value.limit = pg.limit
      } else {
        pagination.value.total = (response.data as any)?.total ?? 0
      }
      
      return response
    } catch (error: any) {
      console.error('Tasks Store: 请求失败:', error)
      console.error('Tasks Store: 错误详情:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchTask = async (id: string) => {
    loading.value = true
    try {
      const response = await taskApi.getTask(id)
      const dataTask = (response.data as any)?.task ?? response.data
      currentTask.value = mapBackendTask(dataTask)
      return response
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  const createTask = async (taskData: CreateTaskRequest) => {
    loading.value = true
    try {
      const response = await taskApi.createTask(taskData)
      const dataTask = (response.data as any)?.task ?? response.data
      tasks.value.unshift(mapBackendTask(dataTask))
      return response
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateTask = async (id: string, taskData: UpdateTaskRequest) => {
    loading.value = true
    try {
      const response = await taskApi.updateTask(id, taskData)
      const dataTask = (response.data as any)?.task ?? response.data
      const mapped = mapBackendTask(dataTask)
      const index = tasks.value.findIndex(task => task.id === id)
      if (index !== -1) {
        tasks.value[index] = mapped
      }
      if (currentTask.value?.id === id) {
        currentTask.value = mapped
      }
      return response
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteTask = async (id: string) => {
    loading.value = true
    try {
      await taskApi.deleteTask(id)
      tasks.value = tasks.value.filter(task => task.id !== id)
      if (currentTask.value?.id === id) {
        currentTask.value = null
      }
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateTaskStatus = async (id: string, status: string) => {
    return updateTask(id, { status })
  }

  const assignTask = async (id: string, assigned_to: string) => {
    return updateTask(id, { assigned_to })
  }

  const setFilter = (newFilter: Partial<TaskFilter>) => {
    filter.value = { ...filter.value, ...newFilter }
  }

  const clearFilter = () => {
    filter.value = {
      status: '',
      priority: '',
      assigned_to: '',
      category: '',
      keyword: '',
      due_date_start: '',
      due_date_end: ''
    }
  }

  const setPage = (page: number) => {
    pagination.value.page = page
  }

  const setPageSize = (limit: number) => {
    pagination.value.limit = limit
    pagination.value.page = 1
  }

  return {
    // 状态
    tasks,
    currentTask,
    loading,
    filter,
    pagination,
    // 计算属性
    tasksByStatus,
    tasksByPriority,
    // 方法
    fetchTasks,
    fetchTask,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    assignTask,
    setFilter,
    clearFilter,
    setPage,
    setPageSize
  }
})