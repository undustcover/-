<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <div class="logo">
          <el-icon class="logo-icon"><Management /></el-icon>
          <h1 class="title">部门工作任务管理系统</h1>
        </div>
        <p class="subtitle">创建您的账户</p>
      </div>
      
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        @submit.prevent="handleRegister"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="邮箱地址"
            size="large"
            :prefix-icon="Message"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="real_name">
          <el-input
            v-model="registerForm.real_name"
            placeholder="真实姓名"
            size="large"
            :prefix-icon="UserFilled"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="phone">
          <el-input
            v-model="registerForm.phone"
            placeholder="手机号码（可选）"
            size="large"
            :prefix-icon="Phone"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="department_id">
          <el-select
            v-model="registerForm.department_id"
            placeholder="选择部门（可选）"
            size="large"
            clearable
            class="full-width"
          >
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="确认密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleRegister"
          />
        </el-form-item>
        
        <el-form-item>
          <div class="agreement">
            <el-checkbox v-model="agreeTerms" size="large">
              我已阅读并同意
              <el-link type="primary" @click="showTerms">
                《用户协议》
              </el-link>
              和
              <el-link type="primary" @click="showPrivacy">
                《隐私政策》
              </el-link>
            </el-checkbox>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="register-btn"
            :loading="loading"
            :disabled="!agreeTerms"
            @click="handleRegister"
          >
            {{ loading ? '注册中...' : '注册' }}
          </el-button>
        </el-form-item>
        
        <div class="login-link">
          <span>已有账户？</span>
          <el-link type="primary" @click="$router.push('/login')">
            立即登录
          </el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Management, Message, UserFilled, Phone } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import type { RegisterRequest } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()

// 表单引用
const registerFormRef = ref<FormInstance>()

// 加载状态
const loading = ref(false)

// 协议同意状态
const agreeTerms = ref(false)

// 确认密码已移到registerForm中

// 部门列表
const departments = ref([
  { id: '1', name: '生产信息管理岗' },
    { id: '2', name: '生产计划岗' },
    { id: '3', name: '生产协调岗' },
    { id: '4', name: '项目评价岗' },
    { id: '5', name: '项目监控岗' },
    { id: '6', name: '值班工程师' },
    { id: '7', name: '应急管理岗' }
])

// 注册表单
const registerForm = reactive<RegisterRequest & { confirmPassword: string }>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  real_name: '',
  phone: '',
  department_id: ''
})

// 自定义验证器
const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

// 表单验证规则
const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  real_name: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度在 6 到 50 个字符', trigger: 'blur' },
    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/, message: '密码必须包含大小写字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  try {
    await registerFormRef.value.validate()
    
    if (!agreeTerms.value) {
      ElMessage.warning('请先同意用户协议和隐私政策')
      return
    }
    
    loading.value = true
    
    // 移除空字段和确认密码字段
    const submitData = { ...registerForm }
    delete submitData.confirmPassword
    if (!submitData.phone) delete submitData.phone
    // 确保department_id是字符串类型
    if (submitData.department_id) {
      submitData.department_id = String(submitData.department_id)
    }
    
    console.log('Sending registration data:', submitData)
    await authStore.register(submitData)
    
    ElMessage.success('注册成功，欢迎使用！')
    router.push('/')
    
  } catch (error: any) {
    console.error('Register failed:', error)
    console.error('Error response:', error.response?.data)
    console.error('Error status:', error.response?.status)
    const errorMessage = error.response?.data?.error || error.response?.data?.message || '注册失败，请重试'
    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
  }
}

// 显示用户协议
const showTerms = () => {
  ElMessage.info('用户协议功能待实现')
}

// 显示隐私政策
const showPrivacy = () => {
  ElMessage.info('隐私政策功能待实现')
}

// 获取部门列表
const fetchDepartments = async () => {
  try {
    // TODO: 从API获取部门列表
    // const response = await departmentApi.getDepartments()
    // departments.value = response.data
  } catch (error) {
    console.error('Failed to fetch departments:', error)
  }
}

onMounted(() => {
  fetchDepartments()
})
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-card {
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.register-header {
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

.register-form {
  margin-top: 24px;
}

.full-width {
  width: 100%;
}

.agreement {
  width: 100%;
  font-size: 14px;
}

.register-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

.login-link {
  text-align: center;
  margin-top: 24px;
  color: #909399;
  font-size: 14px;
}

.login-link span {
  margin-right: 8px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .register-card {
    padding: 24px;
    margin: 0 16px;
  }
  
  .title {
    font-size: 20px;
  }
}

/* 表单项样式调整 */
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-button) {
  border-radius: 8px;
}

:deep(.el-select) {
  width: 100%;
}
</style>