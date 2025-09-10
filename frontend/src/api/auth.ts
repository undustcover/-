import { request } from './http'
import type { LoginRequest, RegisterRequest, AuthResponse, RefreshTokenResponse } from '@/types/auth'

export const authApi = {
  // 用户登录
  login(credentials: LoginRequest) {
    return request.post<AuthResponse>('/auth/login', credentials)
  },

  // 用户注册
  register(userData: RegisterRequest) {
    console.log('AuthAPI register called with:', userData)
    return request.post<AuthResponse>('/auth/register', userData)
  },

  // 刷新token
  refreshToken(refreshToken: string) {
    return request.post<RefreshTokenResponse>('/auth/refresh', {
      refresh_token: refreshToken
    })
  },

  // 用户登出
  logout() {
    return request.post('/auth/logout')
  },

  // 获取当前用户信息
  getCurrentUser() {
    return request.get('/auth/me')
  },

  // 修改密码
  changePassword(data: { old_password: string; new_password: string }) {
    return request.post('/auth/change-password', data)
  },

  // 重置密码请求
  requestPasswordReset(email: string) {
    return request.post('/auth/password-reset-request', { email })
  },

  // 重置密码
  resetPassword(data: { token: string; new_password: string }) {
    return request.post('/auth/password-reset', data)
  }
}