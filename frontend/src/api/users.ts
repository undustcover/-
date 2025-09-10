import { request } from './http'

export interface User {
  id: string
  username: string
  email: string
  real_name: string
  phone?: string
  department?: string
  position?: string
  role: string
  status: string
  avatar?: string
  location?: string
  join_date?: string
  created_at: string
  updated_at: string
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  real_name: string
  phone?: string
  department?: string
  position?: string
  role?: string
}

export interface UpdateUserRequest {
  real_name?: string
  phone?: string
  department?: string
  position?: string
  role?: string
  status?: string
  password?: string
  location?: string
  join_date?: string
}

export interface UsersResponse {
  users: User[]
  total: number
  page: number
  limit: number
}

export const usersApi = {
  // 获取用户列表
  getUsers(params?: {
    page?: number
    limit?: number
    keyword?: string
    department?: string
    role?: string
    status?: string
  }) {
    return request.get<UsersResponse>('/users', { params })
  },

  // 获取用于任务分配的用户列表
  getUsersForAssignment(params?: {
    keyword?: string
    limit?: number
  }) {
    return request.get<{ users: User[] }>('/users/for-assignment', { params })
  },

  // 获取单个用户
  getUser(id: string) {
    return request.get<User>(`/users/${id}`)
  },

  // 创建用户
  createUser(userData: CreateUserRequest) {
    return request.post<User>('/users', userData)
  },

  // 更新用户
  updateUser(id: string, userData: UpdateUserRequest) {
    return request.put<User>(`/users/${id}`, userData)
  },

  // 删除用户
  deleteUser(id: string) {
    return request.delete(`/users/${id}`)
  },

  // 切换用户状态
  toggleUserStatus(id: string, status: string) {
    return request.put(`/users/${id}`, { status })
  }
}