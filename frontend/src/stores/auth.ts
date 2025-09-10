import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { User, LoginRequest, RegisterRequest } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const loading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin' || user.value?.role === 'super_admin')
  const isManager = computed(() => user.value?.role === 'manager' || user.value?.role === 'admin' || user.value?.role === 'super_admin')

  // 方法
  const login = async (credentials: LoginRequest) => {
    loading.value = true
    try {
      console.log('AuthStore: 开始登录请求', credentials.username)
      const response = await authApi.login(credentials)
      console.log('AuthStore: 登录响应数据', response.data)
      
      const { user: userData, access_token, refresh_token } = response.data
      console.log('AuthStore: 解构后的数据', { userData, access_token: access_token ? '存在' : '不存在', refresh_token: refresh_token ? '存在' : '不存在' })
      
      user.value = userData
      token.value = access_token
      refreshToken.value = refresh_token
      
      console.log('AuthStore: 状态更新后', {
        user: user.value,
        token: token.value ? '存在' : '不存在',
        isAuthenticated: isAuthenticated.value
      })
      
      // 保存到本地存储
      localStorage.setItem('token', access_token)
      localStorage.setItem('refreshToken', refresh_token)
      localStorage.setItem('user', JSON.stringify(userData))
      
      console.log('AuthStore: 本地存储已保存')
      return response
    } catch (error) {
      console.error('AuthStore: 登录失败', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const register = async (userData: RegisterRequest) => {
    loading.value = true
    try {
      console.log('AuthStore register called with:', userData)
      const response = await authApi.register(userData)
      console.log('AuthStore register response:', response)
      const { user: newUser, access_token, refresh_token } = response.data
      
      user.value = newUser
      token.value = access_token
      refreshToken.value = refresh_token
      
      // 保存到本地存储
      localStorage.setItem('token', access_token)
      localStorage.setItem('refreshToken', refresh_token)
      localStorage.setItem('user', JSON.stringify(newUser))
      
      return response
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    refreshToken.value = null
    
    // 清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  const refreshAccessToken = async () => {
    if (!refreshToken.value) {
      throw new Error('No refresh token available')
    }
    
    try {
      const response = await authApi.refreshToken(refreshToken.value)
      const { access_token } = response.data
      
      token.value = access_token
      localStorage.setItem('token', access_token)
      
      return access_token
    } catch (error) {
      // 刷新失败，清除所有认证信息
      logout()
      throw error
    }
  }

  const initializeAuth = () => {
    console.log('AuthStore: 初始化认证状态')
    const storedToken = localStorage.getItem('token')
    const storedRefreshToken = localStorage.getItem('refreshToken')
    const storedUser = localStorage.getItem('user')
    
    console.log('AuthStore: 本地存储数据', {
      token: storedToken ? '存在' : '不存在',
      refreshToken: storedRefreshToken ? '存在' : '不存在',
      user: storedUser ? '存在' : '不存在'
    })
    
    if (storedToken && storedUser) {
      try {
        token.value = storedToken
        refreshToken.value = storedRefreshToken
        user.value = JSON.parse(storedUser)
        console.log('AuthStore: 认证状态初始化成功', {
          user: user.value?.username,
          isAuthenticated: isAuthenticated.value
        })
      } catch (error) {
        console.error('AuthStore: 解析本地存储数据失败:', error)
        logout()
      }
    } else {
      console.log('AuthStore: 本地存储无有效认证信息')
    }
  }

  // 初始化认证状态
  initializeAuth()

  return {
    // 状态
    user,
    token,
    refreshToken,
    loading,
    // 计算属性
    isAuthenticated,
    isAdmin,
    isManager,
    // 方法
    login,
    register,
    logout,
    refreshAccessToken,
    initializeAuth
  }
})