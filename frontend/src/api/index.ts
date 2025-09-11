import { authApi } from './auth'
import { taskApi } from './tasks'
import { usersApi } from './users'
import { milestoneApi } from './milestones'

// 统一导出所有 API
const api = {
  auth: authApi,
  tasks: taskApi,
  users: usersApi,
  milestones: milestoneApi
}

export default api

// 也可以单独导出各个模块
export { authApi, taskApi, usersApi, milestoneApi }