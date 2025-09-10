// 用户角色类型
export type UserRole = 'admin' | 'manager' | 'member'

// 用户信息
export interface User {
  id: string
  username: string
  email: string
  real_name: string
  role: UserRole
  department_id?: string
  department_name?: string
  avatar?: string
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 登录请求
export interface LoginRequest {
  username: string
  password: string
  remember_me?: boolean
}

// 注册请求
export interface RegisterRequest {
  username: string
  email: string
  password: string
  real_name: string
  department_id?: string
  phone?: string
}

// 认证响应
export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

// 刷新token响应
export interface RefreshTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

// 修改密码请求
export interface ChangePasswordRequest {
  old_password: string
  new_password: string
  confirm_password: string
}

// 重置密码请求
export interface ResetPasswordRequest {
  email: string
}

// 重置密码确认
export interface ResetPasswordConfirmRequest {
  token: string
  new_password: string
  confirm_password: string
}