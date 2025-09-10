<template>
  <div class="profile-view">
    <div class="page-header">
      <h1 class="page-title">个人资料</h1>
    </div>
    
    <el-row :gutter="20">
      <!-- 左侧个人信息 -->
      <el-col :span="8">
        <el-card class="profile-card">
          <div class="profile-header">
            <div class="avatar-section">
              <el-avatar :size="80" :src="userInfo.avatar">
                {{ userInfo.name?.charAt(0) }}
              </el-avatar>
              <el-button
                size="small"
                class="change-avatar-btn"
                @click="showAvatarDialog = true"
              >
                更换头像
              </el-button>
            </div>
            
            <div class="user-basic">
              <h3>{{ userInfo.name }}</h3>
              <p class="user-title">{{ userInfo.position }} · {{ userInfo.department }}</p>
              <div class="user-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ userStats.totalTasks }}</span>
                  <span class="stat-label">总任务</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ userStats.completedTasks }}</span>
                  <span class="stat-label">已完成</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ userStats.completionRate }}%</span>
                  <span class="stat-label">完成率</span>
                </div>
              </div>
            </div>
          </div>
          
          <el-divider />
          
          <div class="contact-info">
            <div class="info-item">
              <el-icon><Message /></el-icon>
              <span>{{ userInfo.email }}</span>
            </div>
            <div class="info-item">
              <el-icon><Phone /></el-icon>
              <span>{{ userInfo.phone }}</span>
            </div>
            <div class="info-item">
              <el-icon><Location /></el-icon>
              <span>{{ userInfo.location }}</span>
            </div>
            <div class="info-item">
              <el-icon><Calendar /></el-icon>
              <span>入职时间：{{ formatDate(userInfo.joinDate) }}</span>
            </div>
          </div>
        </el-card>
        
        <!-- 技能标签 -->
        <el-card class="skills-card">
          <template #header>
            <span>技能标签</span>
            <el-button size="small" @click="showSkillDialog = true">
              编辑
            </el-button>
          </template>
          
          <div class="skills-container">
            <el-tag
              v-for="skill in userInfo.skills"
              :key="skill"
              class="skill-tag"
              :type="getSkillType(skill)"
            >
              {{ skill }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
      
      <!-- 右侧详细信息 -->
      <el-col :span="16">
        <el-tabs v-model="activeTab" class="profile-tabs">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="basic">
            <el-card>
              <el-form
                ref="basicFormRef"
                :model="basicForm"
                :rules="basicRules"
                label-width="100px"
                class="profile-form"
              >
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="真实姓名" prop="name">
                      <el-input v-model="basicForm.name" />
                    </el-form-item>
                  </el-col>
                  
                  <el-col :span="12">
                    <el-form-item label="用户名" prop="username">
                      <el-input v-model="basicForm.username" disabled />
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="邮箱" prop="email">
                      <el-input v-model="basicForm.email" />
                    </el-form-item>
                  </el-col>
                  
                  <el-col :span="12">
                    <el-form-item label="手机号" prop="phone">
                      <el-input v-model="basicForm.phone" />
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="岗位" prop="department">
                      <el-select v-model="basicForm.department" style="width: 100%">
                        <el-option
                          v-for="dept in departments"
                          :key="dept.value"
                          :label="dept.label"
                          :value="dept.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  
                  <el-col :span="12">
                    <el-form-item label="职位" prop="position">
                      <el-input v-model="basicForm.position" />
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="生日" prop="birthday">
                      <el-date-picker
                        v-model="basicForm.birthday"
                        type="date"
                        placeholder="选择生日"
                        format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>
                  
                  <el-col :span="12">
                    <el-form-item label="性别" prop="gender">
                      <el-radio-group v-model="basicForm.gender">
                        <el-radio label="male">男</el-radio>
                        <el-radio label="female">女</el-radio>
                      </el-radio-group>
                    </el-form-item>
                  </el-col>
                </el-row>
                 
                 <el-row :gutter="20">
                   <el-col :span="12">
                     <el-form-item label="入职时间" prop="joinDate">
                       <el-date-picker
                         v-model="basicForm.joinDate"
                         type="date"
                         placeholder="选择入职时间"
                         format="YYYY-MM-DD"
                         value-format="YYYY-MM-DD"
                         style="width: 100%"
                       />
                     </el-form-item>
                   </el-col>
                 </el-row>
                 
                 <el-form-item label="工作地址" prop="location">
                   <el-input v-model="basicForm.location" />
                 </el-form-item>
                 
                 <el-form-item label="个人简介" prop="bio">
                   <el-input
                     v-model="basicForm.bio"
                     type="textarea"
                     :rows="4"
                     placeholder="请输入个人简介"
                     maxlength="200"
                     show-word-limit
                   />
                 </el-form-item>
                 
                 <div class="form-actions">
                   <el-button type="primary" @click="saveBasicInfo" :loading="saving">
                     保存
                   </el-button>
                   <el-button @click="resetBasicForm">
                     重置
                   </el-button>
                 </div>
              </el-form>
            </el-card>
          </el-tab-pane>
          
          <!-- 安全设置 -->
          <el-tab-pane label="安全设置" name="security">
            <el-card>
              <el-form
                ref="passwordFormRef"
                :model="passwordForm"
                :rules="passwordRules"
                label-width="120px"
                class="profile-form"
              >
                <el-form-item label="当前密码" prop="currentPassword">
                  <el-input
                    v-model="passwordForm.currentPassword"
                    type="password"
                    show-password
                    placeholder="请输入当前密码"
                  />
                </el-form-item>
                
                <el-form-item label="新密码" prop="newPassword">
                  <el-input
                    v-model="passwordForm.newPassword"
                    type="password"
                    show-password
                    placeholder="请输入新密码"
                  />
                </el-form-item>
                
                <el-form-item label="确认新密码" prop="confirmPassword">
                  <el-input
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    show-password
                    placeholder="请再次输入新密码"
                  />
                </el-form-item>
                
                <div class="form-actions">
                  <el-button type="primary" @click="changePassword" :loading="changingPassword">
                    修改密码
                  </el-button>
                </div>
              </el-form>
              
              <el-divider />
              
              <!-- 两步验证 -->
              <div class="security-section">
                <h4>两步验证</h4>
                <div class="security-item">
                  <div class="security-info">
                    <span>短信验证</span>
                    <p>通过手机短信接收验证码</p>
                  </div>
                  <el-switch v-model="securitySettings.smsAuth" />
                </div>
                
                <div class="security-item">
                  <div class="security-info">
                    <span>邮箱验证</span>
                    <p>通过邮箱接收验证码</p>
                  </div>
                  <el-switch v-model="securitySettings.emailAuth" />
                </div>
              </div>
              
              <el-divider />
              
              <!-- 登录设备 -->
              <div class="security-section">
                <h4>登录设备</h4>
                <div class="device-list">
                  <div
                    v-for="device in loginDevices"
                    :key="device.id"
                    class="device-item"
                  >
                    <div class="device-info">
                      <div class="device-name">
                        <el-icon><Monitor /></el-icon>
                        {{ device.name }}
                      </div>
                      <div class="device-details">
                        <span>{{ device.location }}</span>
                        <span>{{ formatDateTime(device.lastLogin) }}</span>
                      </div>
                    </div>
                    
                    <el-button
                      v-if="!device.current"
                      size="small"
                      type="danger"
                      @click="removeDevice(device)"
                    >
                      移除
                    </el-button>
                    
                    <el-tag v-else type="success" size="small">
                      当前设备
                    </el-tag>
                  </div>
                </div>
              </div>
            </el-card>
          </el-tab-pane>
          
          <!-- 通知设置 -->
          <el-tab-pane label="通知设置" name="notifications">
            <el-card>
              <div class="notification-section">
                <h4>任务通知</h4>
                <div class="notification-item">
                  <div class="notification-info">
                    <span>任务分配通知</span>
                    <p>当有新任务分配给您时</p>
                  </div>
                  <div class="notification-methods">
                    <el-checkbox v-model="notifications.taskAssign.email">邮件</el-checkbox>
                    <el-checkbox v-model="notifications.taskAssign.sms">短信</el-checkbox>
                    <el-checkbox v-model="notifications.taskAssign.system">系统</el-checkbox>
                  </div>
                </div>
                
                <div class="notification-item">
                  <div class="notification-info">
                    <span>任务截止提醒</span>
                    <p>任务即将到期时</p>
                  </div>
                  <div class="notification-methods">
                    <el-checkbox v-model="notifications.taskDue.email">邮件</el-checkbox>
                    <el-checkbox v-model="notifications.taskDue.sms">短信</el-checkbox>
                    <el-checkbox v-model="notifications.taskDue.system">系统</el-checkbox>
                  </div>
                </div>
                
                <div class="notification-item">
                  <div class="notification-info">
                    <span>任务状态变更</span>
                    <p>任务状态发生变化时</p>
                  </div>
                  <div class="notification-methods">
                    <el-checkbox v-model="notifications.taskStatus.email">邮件</el-checkbox>
                    <el-checkbox v-model="notifications.taskStatus.sms">短信</el-checkbox>
                    <el-checkbox v-model="notifications.taskStatus.system">系统</el-checkbox>
                  </div>
                </div>
              </div>
              
              <el-divider />
              
              <div class="notification-section">
                <h4>系统通知</h4>
                <div class="notification-item">
                  <div class="notification-info">
                    <span>系统维护通知</span>
                    <p>系统维护和更新通知</p>
                  </div>
                  <div class="notification-methods">
                    <el-checkbox v-model="notifications.system.email">邮件</el-checkbox>
                    <el-checkbox v-model="notifications.system.system">系统</el-checkbox>
                  </div>
                </div>
              </div>
              
              <div class="form-actions">
                <el-button type="primary" @click="saveNotifications" :loading="savingNotifications">
                  保存设置
                </el-button>
              </div>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
    
    <!-- 头像上传对话框 -->
    <el-dialog v-model="showAvatarDialog" title="更换头像" width="400px">
      <el-upload
        class="avatar-uploader"
        :action="uploadUrl"
        :headers="uploadHeaders"
        :show-file-list="false"
        :on-success="handleAvatarSuccess"
        :before-upload="beforeAvatarUpload"
      >
        <img v-if="previewAvatar" :src="previewAvatar" class="avatar-preview" />
        <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
      </el-upload>
      
      <template #footer>
        <el-button @click="showAvatarDialog = false">取消</el-button>
        <el-button type="primary" @click="saveAvatar" :loading="uploadingAvatar">
          保存
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 技能编辑对话框 -->
    <el-dialog v-model="showSkillDialog" title="编辑技能" width="500px">
      <el-select
        v-model="editingSkills"
        multiple
        filterable
        allow-create
        default-first-option
        placeholder="请选择或输入技能"
        style="width: 100%"
      >
        <el-option
          v-for="skill in availableSkills"
          :key="skill"
          :label="skill"
          :value="skill"
        />
      </el-select>
      
      <template #footer>
        <el-button @click="showSkillDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSkills">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Message,
  Phone,
  Location,
  Calendar,
  Monitor,
  Plus
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/auth'
import { usersApi } from '@/api/users'
import { authApi } from '@/api/auth'

const authStore = useAuthStore()

// 响应式数据
const activeTab = ref('basic')
const basicFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()
const saving = ref(false)
const changingPassword = ref(false)
const savingNotifications = ref(false)
const uploadingAvatar = ref(false)
const showAvatarDialog = ref(false)
const showSkillDialog = ref(false)
const previewAvatar = ref('')
const editingSkills = ref<string[]>([])

// 用户信息
const userInfo = reactive({
  id: '',
  username: '',
  name: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  avatar: '',
  location: '',
  joinDate: '',
  birthday: '',
  gender: '',
  bio: '',
  skills: [] as string[]
})

// 用户统计
const userStats = reactive({
  totalTasks: 156,
  completedTasks: 142,
  completionRate: 91
})

// 基本信息表单
const basicForm = reactive({
  name: '',
  username: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  birthday: '',
  gender: '',
  location: '',
  joinDate: '',
  bio: ''
})

// 密码表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 安全设置
const securitySettings = reactive({
  smsAuth: false,
  emailAuth: true
})

// 通知设置
const notifications = reactive({
  taskAssign: {
    email: true,
    sms: false,
    system: true
  },
  taskDue: {
    email: true,
    sms: true,
    system: true
  },
  taskStatus: {
    email: false,
    sms: false,
    system: true
  },
  system: {
    email: true,
    system: true
  }
})

// 登录设备
const loginDevices = ref([
  {
    id: '1',
    name: 'Windows PC - Chrome',
    location: '北京市',
    lastLogin: '2024-01-20 14:30:00',
    current: true
  },
  {
    id: '2',
    name: 'iPhone 13 - Safari',
    location: '北京市',
    lastLogin: '2024-01-19 09:15:00',
    current: false
  }
])

// 部门选项
const departments = [
  { label: '生产信息管理岗', value: '生产信息管理岗' },
        { label: '生产计划岗', value: '生产计划岗' },
        { label: '生产协调岗', value: '生产协调岗' },
        { label: '项目评价岗', value: '项目评价岗' },
        { label: '项目监控岗', value: '项目监控岗' },
        { label: '值班工程师', value: '值班工程师' },
        { label: '应急管理岗', value: '应急管理岗' }
]

// 可用技能
const availableSkills = [
  'Vue.js', 'React', 'Angular', 'TypeScript', 'JavaScript',
  'Node.js', 'Python', 'Java', 'Go', 'PHP',
  'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
  'UI设计', 'UX设计', '产品设计', '项目管理', '数据分析'
]

// 计算属性
const uploadUrl = computed(() => {
  return `${import.meta.env.VITE_API_BASE_URL}/upload/avatar`
})

const uploadHeaders = computed(() => {
  return {
    Authorization: `Bearer ${authStore.token}`
  }
})

// 表单验证规则
const basicRules: FormRules = {
  name: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  department: [
    // 部门改为可选，后端允许为 null/空
  ],
  position: [
    { required: true, message: '请输入职位', trigger: 'blur' }
  ]
}

const passwordRules: FormRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
      message: '密码必须包含大小写字母和数字',
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 获取技能标签类型
const getSkillType = (skill: string) => {
  const frontendSkills = ['Vue.js', 'React', 'Angular', 'TypeScript', 'JavaScript']
  const backendSkills = ['Node.js', 'Python', 'Java', 'Go', 'PHP']
  const designSkills = ['UI设计', 'UX设计', '产品设计']
  
  if (frontendSkills.includes(skill)) return 'primary'
  if (backendSkills.includes(skill)) return 'success'
  if (designSkills.includes(skill)) return 'warning'
  return 'info'
}

// 格式化日期
const formatDate = (date: string) => {
  return date ? dayjs(date).format('YYYY年MM月DD日') : '-'
}

// 格式化日期时间
const formatDateTime = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 初始化表单数据
const initFormData = () => {
  Object.assign(basicForm, {
    name: userInfo.name,
    username: userInfo.username,
    email: userInfo.email,
    phone: userInfo.phone,
    department: userInfo.department,
    position: userInfo.position,
    birthday: userInfo.birthday,
    gender: userInfo.gender,
    location: userInfo.location,
    joinDate: userInfo.joinDate,
    bio: userInfo.bio
  })
}

// 从后端加载当前用户信息
const loadCurrentUser = async () => {
  try {
    const res = await authApi.getCurrentUser()
    const u = (res.data && (res.data.user || res.data)) as any
    if (!u) return
    Object.assign(userInfo, {
      id: String(u.id ?? ''),
      username: u.username ?? '',
      name: u.real_name ?? '',
      email: u.email ?? '',
      phone: u.phone ?? '',
      department: u.department ?? '',
      position: u.position ?? '',
      avatar: u.avatar ?? '',
      // 后端现已提供以下字段
      location: u.location ?? '',
      joinDate: u.join_date ? dayjs(u.join_date).format('YYYY-MM-DD') : ''
    })
    // 同步到认证存储
    authStore.user = { ...(authStore.user as any), ...u }
    localStorage.setItem('user', JSON.stringify(u))
  } catch (e) {
    console.error('加载当前用户信息失败:', e)
  }
}

// 保存基本信息
const saveBasicInfo = async () => {
  if (!basicFormRef.value) return
  try {
    await basicFormRef.value.validate()
    saving.value = true

    const payload: any = {
      real_name: basicForm.name,
      phone: basicForm.phone || undefined,
      department: basicForm.department || undefined,
      position: basicForm.position || undefined,
      location: basicForm.location !== undefined ? basicForm.location : undefined,
      join_date: basicForm.joinDate ? dayjs(basicForm.joinDate).format('YYYY-MM-DD') : undefined
    }

    const userId = (authStore.user as any)?.id?.toString()
    if (userId) {
      await usersApi.updateUser(userId, payload)
      // 更新成功后从后端拉取最新用户数据，确保显示与实际一致
      await loadCurrentUser()
      // 重新初始化表单
      initFormData()
      // 保留仅本地的扩展字段（后端暂不支持）
      userInfo.birthday = basicForm.birthday
      userInfo.gender = basicForm.gender
      userInfo.bio = basicForm.bio
    } else {
      // 回退：仅本地更新
      Object.assign(userInfo, basicForm)
    }

    ElMessage.success('基本信息保存成功')
  } catch (error) {
    console.error('表单验证或保存失败:', error)
  } finally {
    saving.value = false
  }
}

// 重置基本信息表单
const resetBasicForm = () => {
  initFormData()
  basicFormRef.value?.clearValidate()
}

// 修改密码
const changePassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    
    changingPassword.value = true
    
    // TODO: 调用API修改密码
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('密码修改成功')
    
    // 清空表单
    Object.assign(passwordForm, {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    changingPassword.value = false
  }
}

// 保存通知设置
const saveNotifications = async () => {
  savingNotifications.value = true
  try {
    // TODO: 调用API保存通知设置
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('通知设置保存成功')
  } catch (error) {
    ElMessage.error('保存通知设置失败')
  } finally {
    savingNotifications.value = false
  }
}

// 移除设备
const removeDevice = async (device: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要移除设备 "${device.name}" 吗？`,
      '确认移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // TODO: 调用API移除设备
    const index = loginDevices.value.findIndex(d => d.id === device.id)
    if (index > -1) {
      loginDevices.value.splice(index, 1)
    }
    
    ElMessage.success('设备移除成功')
  } catch {
    // 用户取消
  }
}

// 头像上传前检查
const beforeAvatarUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  
  return true
}

// 头像上传成功
const handleAvatarSuccess = (response: any) => {
  previewAvatar.value = response.url
}

// 保存头像
const saveAvatar = async () => {
  if (!previewAvatar.value) {
    ElMessage.warning('请先上传头像')
    return
  }
  
  uploadingAvatar.value = true
  try {
    // TODO: 调用API保存头像
    await new Promise(resolve => setTimeout(resolve, 500))
    
    userInfo.avatar = previewAvatar.value
    showAvatarDialog.value = false
    previewAvatar.value = ''
    
    ElMessage.success('头像更新成功')
  } catch (error) {
    ElMessage.error('头像保存失败')
  } finally {
    uploadingAvatar.value = false
  }
}

// 保存技能
const saveSkills = () => {
  userInfo.skills = [...editingSkills.value]
  showSkillDialog.value = false
  ElMessage.success('技能更新成功')
}

onMounted(async () => {
  // 先加载后端当前用户，保证展示与实际一致
  await loadCurrentUser()
  initFormData()
  editingSkills.value = [...userInfo.skills]
})</script>

<style scoped>
.profile-view {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-card {
  height: fit-content;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.change-avatar-btn {
  font-size: 12px;
}

.user-basic {
  text-align: center;
}

.user-basic h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.user-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.user-stats {
  display: flex;
  justify-content: space-around;
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.skills-card {
  margin-top: 20px;
}

.skills-card :deep(.el-card__header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skills-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-tag {
  margin: 0;
}

.profile-tabs {
  height: 100%;
}

.profile-form {
  max-width: 600px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.security-section {
  margin-bottom: 24px;
}

.security-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.security-item:last-child {
  border-bottom: none;
}

.security-info span {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.security-info p {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.device-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.device-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.device-details {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.notification-section {
  margin-bottom: 24px;
}

.notification-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-info span {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.notification-info p {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.notification-methods {
  display: flex;
  gap: 16px;
}

.avatar-uploader {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.avatar-uploader:hover {
  border-color: var(--el-color-primary);
}

.avatar-preview {
  width: 150px;
  height: 150px;
  object-fit: cover;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

@media (max-width: 768px) {
  .profile-view {
    padding: 16px;
  }
  
  :deep(.el-col) {
    width: 100% !important;
    margin-bottom: 20px;
  }
  
  .user-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .security-item,
  .notification-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .notification-methods {
    flex-direction: column;
    gap: 8px;
  }
  
  .device-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>