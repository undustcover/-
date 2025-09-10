<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <el-icon class="logo-icon"><Management /></el-icon>
          <h1 class="title">部门工作任务管理系统</h1>
        </div>
        <p class="subtitle">请登录您的账户</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名或邮箱"
            size="large"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <div class="form-options">
            <el-checkbox v-model="loginForm.remember_me">
              记住我
            </el-checkbox>
            <el-link type="primary" @click="showForgotPassword">
              忘记密码？
            </el-link>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
        
        <div class="register-link">
          <span>还没有账户？</span>
          <el-link type="primary" @click="$router.push('/register')">
            立即注册
          </el-link>
        </div>
      </el-form>
    </div>
    
    <!-- 忘记密码对话框 -->
    <el-dialog
      v-model="forgotPasswordVisible"
      title="重置密码"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="forgotPasswordFormRef"
        :model="forgotPasswordForm"
        :rules="forgotPasswordRules"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="forgotPasswordForm.email"
            placeholder="请输入注册邮箱"
            :prefix-icon="Message"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="forgotPasswordVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="forgotPasswordLoading"
          @click="handleForgotPassword"
        >
          发送重置邮件
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Management, Message } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/auth'
import type { LoginRequest } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()

// 表单引用
const loginFormRef = ref<FormInstance>()
const forgotPasswordFormRef = ref<FormInstance>()

// 加载状态
const loading = ref(false)
const forgotPasswordLoading = ref(false)

// 忘记密码对话框
const forgotPasswordVisible = ref(false)

// 登录表单
const loginForm = reactive<LoginRequest>({
  username: '',
  password: '',
  remember_me: false
})

// 忘记密码表单
const forgotPasswordForm = reactive({
  email: ''
})

// 表单验证规则
const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度在 6 到 50 个字符', trigger: 'blur' }
  ]
}

const forgotPasswordRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    console.log('=== 登录流程开始 ===')
    console.log('1. 登录前状态:', {
      isAuthenticated: authStore.isAuthenticated,
      user: authStore.user,
      token: authStore.token ? '存在' : '不存在'
    })
    
    console.log('2. 调用登录API...')
    const response = await authStore.login(loginForm)
    console.log('3. 登录API响应:', response)
    
    console.log('4. 登录后状态:', {
      isAuthenticated: authStore.isAuthenticated,
      user: authStore.user,
      token: authStore.token ? '存在' : '不存在'
    })
    
    ElMessage.success('登录成功')
    
    // 使用nextTick确保响应式状态更新完成
    await nextTick()
    console.log('5. nextTick后状态:', {
      isAuthenticated: authStore.isAuthenticated,
      user: authStore.user,
      token: authStore.token ? '存在' : '不存在'
    })
    
    // 跳转到首页或之前访问的页面
    const redirect = router.currentRoute.value.query.redirect as string
    const targetPath = redirect || '/'
    console.log('6. 准备跳转到:', targetPath)
    
    // 强制替换当前路由而不是推入新路由
    console.log('7. 执行路由跳转...')
    await router.replace(targetPath)
    console.log('8. 路由跳转完成，当前路由:', router.currentRoute.value.path)
    console.log('=== 登录流程结束 ===')
    
  } catch (error: any) {
    console.error('登录失败:', error)
    ElMessage.error(error.response?.data?.message || '登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}

// 显示忘记密码对话框
const showForgotPassword = () => {
  forgotPasswordVisible.value = true
  forgotPasswordForm.email = ''
}

// 处理忘记密码
const handleForgotPassword = async () => {
  if (!forgotPasswordFormRef.value) return
  
  try {
    await forgotPasswordFormRef.value.validate()
    forgotPasswordLoading.value = true
    
    await authApi.requestPasswordReset(forgotPasswordForm.email)
    
    ElMessage.success('重置邮件已发送，请查收邮箱')
    forgotPasswordVisible.value = false
    
  } catch (error: any) {
    console.error('Forgot password failed:', error)
    ElMessage.error(error.response?.data?.message || '发送重置邮件失败')
  } finally {
    forgotPasswordLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.logo-icon {
  font-size: 32px;
  color: #409eff;
  margin-right: 8px;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.subtitle {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.login-form {
  margin-top: 24px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

.register-link {
  text-align: center;
  margin-top: 24px;
  color: #909399;
  font-size: 14px;
}

.register-link span {
  margin-right: 8px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
    padding: 24px;
    margin: 0 16px;
  }
  
  .title {
    font-size: 20px;
  }
}

/* 表单项样式调整 */
:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-button) {
  border-radius: 8px;
}
</style>