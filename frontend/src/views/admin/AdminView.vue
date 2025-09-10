<template>
  <div class="admin-view">
    <div class="page-header">
      <h1 class="page-title">系统管理</h1>
    </div>
    
    <!-- 管理菜单 -->
    <div class="admin-menu">
      <el-card
        v-for="item in menuItems"
        :key="item.key"
        class="menu-card"
        :class="{ active: activeMenu === item.key }"
        @click="setActiveMenu(item.key)"
      >
        <div class="menu-content">
          <div class="menu-icon">
            <el-icon><component :is="item.icon" /></el-icon>
          </div>
          <div class="menu-info">
            <div class="menu-title">{{ item.title }}</div>
            <div class="menu-desc">{{ item.description }}</div>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 内容区域 -->
    <el-card class="content-card">
      <!-- 用户管理 -->
      <div v-if="activeMenu === 'users'" class="admin-content">
        <div class="content-header">
          <h2>用户管理</h2>
          <div class="header-actions">
            <el-input
              v-model="userSearch"
              placeholder="搜索用户"
              clearable
              style="width: 250px;"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            
            <el-button type="primary" @click="showCreateUserDialog = true">
              <el-icon><Plus /></el-icon>
              新建用户
            </el-button>
          </div>
        </div>
        
        <el-table
          :data="filteredUsers"
          stripe
          style="width: 100%"
          v-loading="loading"
        >
          <el-table-column prop="username" label="用户名" width="120" />
          
          <el-table-column prop="real_name" label="真实姓名" width="120" />
          
          <el-table-column prop="email" label="邮箱" width="200" />
          
          <el-table-column prop="phone" label="手机号" width="130" />
          
          <el-table-column prop="department" label="岗位" width="100" />
          
          <el-table-column prop="role" label="角色" width="100">
            <template #default="{ row }">
              <el-tag
                :type="getRoleType(row.role)"
                size="small"
              >
                {{ getRoleText(row.role) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-switch
                v-model="row.is_active"
                @change="toggleUserStatus(row)"
              />
            </template>
          </el-table-column>
          
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="editUser(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              
              <el-button
                size="small"
                type="danger"
                @click="deleteUser(row)"
                :disabled="row.role === 'admin'"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="userCurrentPage"
            v-model:page-size="userPageSize"
            :total="users.length"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </div>
      
      <!-- 角色管理 -->
      <div v-else-if="activeMenu === 'roles'" class="admin-content">
        <div class="content-header">
          <h2>角色管理</h2>
          <div class="header-actions">
            <el-button type="primary" @click="showCreateRoleDialog = true">
              <el-icon><Plus /></el-icon>
              新建角色
            </el-button>
          </div>
        </div>
        
        <div class="roles-grid">
          <el-card
            v-for="role in roles"
            :key="role.id"
            class="role-card"
          >
            <div class="role-header">
              <div class="role-info">
                <h3>{{ role.name }}</h3>
                <p>{{ role.description }}</p>
              </div>
              <div class="role-actions">
                <el-button size="small" @click="editRole(role)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  @click="deleteRole(role)"
                  :disabled="role.is_system"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            
            <div class="role-permissions">
              <div class="permission-title">权限列表：</div>
              <div class="permission-tags">
                <el-tag
                  v-for="permission in role.permissions"
                  :key="permission"
                  size="small"
                  style="margin: 2px;"
                >
                  {{ getPermissionText(permission) }}
                </el-tag>
              </div>
            </div>
            
            <div class="role-stats">
              <span class="user-count">{{ role.user_count }} 个用户</span>
            </div>
          </el-card>
        </div>
      </div>
      
      <!-- 系统设置 -->
      <div v-else-if="activeMenu === 'settings'" class="admin-content">
        <div class="content-header">
          <h2>系统设置</h2>
        </div>
        
        <el-form
          :model="systemSettings"
          label-width="150px"
          class="settings-form"
        >
          <el-card class="setting-section">
            <template #header>
              <span>基本设置</span>
            </template>
            
            <el-form-item label="系统名称">
              <el-input v-model="systemSettings.system_name" />
            </el-form-item>
            
            <el-form-item label="系统描述">
              <el-input
                v-model="systemSettings.system_description"
                type="textarea"
                :rows="3"
              />
            </el-form-item>
            
            <el-form-item label="系统Logo">
              <el-upload
                class="logo-uploader"
                :action="uploadUrl"
                :headers="uploadHeaders"
                :show-file-list="false"
                :on-success="handleLogoSuccess"
                :before-upload="beforeLogoUpload"
              >
                <img v-if="systemSettings.logo_url" :src="systemSettings.logo_url" class="logo" />
                <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
          </el-card>
          
          <el-card class="setting-section">
            <template #header>
              <span>安全设置</span>
            </template>
            
            <el-form-item label="密码最小长度">
              <el-input-number
                v-model="systemSettings.password_min_length"
                :min="6"
                :max="20"
              />
            </el-form-item>
            
            <el-form-item label="登录失败锁定">
              <el-switch v-model="systemSettings.login_lock_enabled" />
            </el-form-item>
            
            <el-form-item label="最大失败次数" v-if="systemSettings.login_lock_enabled">
              <el-input-number
                v-model="systemSettings.max_login_attempts"
                :min="3"
                :max="10"
              />
            </el-form-item>
            
            <el-form-item label="锁定时间(分钟)" v-if="systemSettings.login_lock_enabled">
              <el-input-number
                v-model="systemSettings.lock_duration"
                :min="5"
                :max="60"
              />
            </el-form-item>
          </el-card>
          
          <el-card class="setting-section">
            <template #header>
              <span>邮件设置</span>
            </template>
            
            <el-form-item label="SMTP服务器">
              <el-input v-model="systemSettings.smtp_host" />
            </el-form-item>
            
            <el-form-item label="SMTP端口">
              <el-input-number v-model="systemSettings.smtp_port" />
            </el-form-item>
            
            <el-form-item label="发件人邮箱">
              <el-input v-model="systemSettings.smtp_username" />
            </el-form-item>
            
            <el-form-item label="邮箱密码">
              <el-input
                v-model="systemSettings.smtp_password"
                type="password"
                show-password
              />
            </el-form-item>
            
            <el-form-item label="启用SSL">
              <el-switch v-model="systemSettings.smtp_ssl" />
            </el-form-item>
          </el-card>
          
          <div class="form-actions">
            <el-button type="primary" @click="saveSettings" :loading="saving">
              保存设置
            </el-button>
            <el-button @click="resetSettings">
              重置
            </el-button>
          </div>
        </el-form>
      </div>
      
      <!-- 系统日志 -->
      <div v-else-if="activeMenu === 'logs'" class="admin-content">
        <div class="content-header">
          <h2>系统日志</h2>
          <div class="header-actions">
            <el-select
              v-model="logLevel"
              placeholder="日志级别"
              clearable
              style="width: 120px;"
            >
              <el-option label="全部" value="" />
              <el-option label="错误" value="error" />
              <el-option label="警告" value="warning" />
              <el-option label="信息" value="info" />
              <el-option label="调试" value="debug" />
            </el-select>
            
            <el-date-picker
              v-model="logDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
            
            <el-button @click="refreshLogs">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
        
        <el-table
          :data="filteredLogs"
          stripe
          style="width: 100%"
          v-loading="loading"
        >
          <el-table-column prop="level" label="级别" width="80">
            <template #default="{ row }">
              <el-tag
                :type="getLogLevelType(row.level)"
                size="small"
              >
                {{ row.level.toUpperCase() }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="message" label="消息" min-width="300" />
          
          <el-table-column prop="user" label="用户" width="120" />
          
          <el-table-column prop="ip" label="IP地址" width="130" />
          
          <el-table-column prop="created_at" label="时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.created_at) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button size="small" @click="viewLogDetail(row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="logCurrentPage"
            v-model:page-size="logPageSize"
            :total="logs.length"
            :page-sizes="[20, 50, 100, 200]"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </div>
    </el-card>
    
    <!-- 创建用户对话框 -->
    <UserCreateDialog
      v-model="showCreateUserDialog"
      :user-data="editingUser"
      @success="handleCreateUserSuccess"
    />
    
    <!-- 创建角色对话框 -->
    <RoleCreateDialog
      v-model="showCreateRoleDialog"
      @success="handleCreateRoleSuccess"
    />
    
    <!-- 日志详情对话框 -->
    <el-dialog
      v-model="showLogDetailDialog"
      title="日志详情"
      width="600px"
    >
      <div v-if="selectedLog" class="log-detail">
        <div class="detail-item">
          <label>级别：</label>
          <el-tag :type="getLogLevelType(selectedLog.level)" size="small">
            {{ selectedLog.level.toUpperCase() }}
          </el-tag>
        </div>
        <div class="detail-item">
          <label>消息：</label>
          <span>{{ selectedLog.message }}</span>
        </div>
        <div class="detail-item">
          <label>用户：</label>
          <span>{{ selectedLog.user || '系统' }}</span>
        </div>
        <div class="detail-item">
          <label>IP地址：</label>
          <span>{{ selectedLog.ip }}</span>
        </div>
        <div class="detail-item">
          <label>时间：</label>
          <span>{{ formatDateTime(selectedLog.created_at) }}</span>
        </div>
        <div class="detail-item" v-if="selectedLog.details">
          <label>详细信息：</label>
          <pre class="log-details">{{ selectedLog.details }}</pre>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  Lock,
  Setting,
  Document,
  Search,
  Plus,
  Edit,
  Delete,
  Refresh
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/auth'
import { usersApi, type User as UserType } from '@/api/users'
import UserCreateDialog from '@/components/admin/UserCreateDialog.vue'
import RoleCreateDialog from '@/components/admin/RoleCreateDialog.vue'

// 调试信息
console.log('AdminView 组件加载');
const authStore = useAuthStore();
console.log('当前认证状态:', {
  isAuthenticated: authStore.isAuthenticated,
  isAdmin: authStore.isAdmin,
  user: authStore.user,
  token: authStore.token ? '存在' : '不存在'
});

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const activeMenu = ref('users')
const showCreateUserDialog = ref(false)
const showCreateRoleDialog = ref(false)
const showLogDetailDialog = ref(false)
const selectedLog = ref(null)
const editingUser = ref<UserType | null>(null)

// 搜索和分页
const userSearch = ref('')
const userCurrentPage = ref(1)
const userPageSize = ref(20)
const logLevel = ref('')
const logDateRange = ref<[string, string] | null>(null)
const logCurrentPage = ref(1)
const logPageSize = ref(50)

// 菜单项
const menuItems = [
  {
    key: 'users',
    title: '用户管理',
    description: '管理系统用户账户',
    icon: User
  },
  {
    key: 'roles',
    title: '角色管理',
    description: '管理用户角色和权限',
    icon: Lock
  },
  {
    key: 'settings',
    title: '系统设置',
    description: '配置系统参数',
    icon: Setting
  },
  {
    key: 'logs',
    title: '系统日志',
    description: '查看系统操作日志',
    icon: Document
  }
]

// 用户数据
const users = ref<UserType[]>([])
const userTotal = ref(0)

// 角色数据
const roles = ref([
  {
    id: '1',
    name: '管理员',
    description: '系统管理员，拥有所有权限',
    permissions: ['user:read', 'user:write', 'role:read', 'role:write', 'system:read', 'system:write'],
    user_count: 1,
    is_system: true
  },
  {
    id: '2',
    name: '普通用户',
    description: '普通用户，基本权限',
    permissions: ['task:read', 'task:write', 'file:read', 'file:write'],
    user_count: 15,
    is_system: true
  },
  {
    id: '3',
    name: '项目经理',
    description: '项目经理，项目管理权限',
    permissions: ['task:read', 'task:write', 'project:read', 'project:write', 'report:read'],
    user_count: 3,
    is_system: false
  }
])

// 日志数据
const logs = ref([
  {
    id: '1',
    level: 'info',
    message: '用户登录成功',
    user: '张三',
    ip: '192.168.1.100',
    created_at: '2024-01-20 09:30:00',
    details: null
  },
  {
    id: '2',
    level: 'warning',
    message: '用户登录失败，密码错误',
    user: '李四',
    ip: '192.168.1.101',
    created_at: '2024-01-20 09:25:00',
    details: 'Login attempt with incorrect password'
  },
  {
    id: '3',
    level: 'error',
    message: '数据库连接失败',
    user: null,
    ip: '127.0.0.1',
    created_at: '2024-01-20 08:15:00',
    details: 'Connection timeout after 30 seconds'
  }
])

// 系统设置
const systemSettings = reactive({
  system_name: '部门工作任务管理系统',
  system_description: '高效的部门工作任务管理平台',
  logo_url: '',
  password_min_length: 8,
  login_lock_enabled: true,
  max_login_attempts: 5,
  lock_duration: 15,
  smtp_host: 'smtp.example.com',
  smtp_port: 587,
  smtp_username: 'noreply@example.com',
  smtp_password: '',
  smtp_ssl: true
})

// 计算属性
const filteredUsers = computed(() => {
  let result = users.value
  
  if (userSearch.value) {
    result = result.filter(user =>
      user.username.toLowerCase().includes(userSearch.value.toLowerCase()) ||
      user.real_name.toLowerCase().includes(userSearch.value.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.value.toLowerCase())
    )
  }
  
  const start = (userCurrentPage.value - 1) * userPageSize.value
  const end = start + userPageSize.value
  
  return result.slice(start, end)
})

const filteredLogs = computed(() => {
  let result = logs.value
  
  if (logLevel.value) {
    result = result.filter(log => log.level === logLevel.value)
  }
  
  if (logDateRange.value) {
    const [start, end] = logDateRange.value
    result = result.filter(log => {
      const logDate = dayjs(log.created_at).format('YYYY-MM-DD')
      return logDate >= start && logDate <= end
    })
  }
  
  const startIndex = (logCurrentPage.value - 1) * logPageSize.value
  const endIndex = startIndex + logPageSize.value
  
  return result.slice(startIndex, endIndex)
})

const uploadUrl = computed(() => {
  return `${import.meta.env.VITE_API_BASE_URL}/upload`
})

const uploadHeaders = computed(() => {
  return {
    Authorization: `Bearer ${authStore.token}`
  }
})

// 设置活动菜单
const setActiveMenu = (menu: string) => {
  activeMenu.value = menu
}

// 获取角色类型
const getRoleType = (role: string) => {
  const types = {
    admin: 'danger',
    manager: 'warning',
    user: 'info'
  }
  return types[role] || 'info'
}

// 获取角色文本
const getRoleText = (role: string) => {
  const texts = {
    admin: '管理员',
    manager: '经理',
    user: '用户'
  }
  return texts[role] || role
}

// 获取权限文本
const getPermissionText = (permission: string) => {
  const texts = {
    'user:read': '查看用户',
    'user:write': '管理用户',
    'role:read': '查看角色',
    'role:write': '管理角色',
    'system:read': '查看系统',
    'system:write': '管理系统',
    'task:read': '查看任务',
    'task:write': '管理任务',
    'project:read': '查看项目',
    'project:write': '管理项目',
    'file:read': '查看文件',
    'file:write': '管理文件',
    'report:read': '查看报表'
  }
  return texts[permission] || permission
}

// 获取日志级别类型
const getLogLevelType = (level: string) => {
  const types = {
    error: 'danger',
    warning: 'warning',
    info: 'info',
    debug: 'info'
  }
  return types[level] || 'info'
}

// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 格式化日期时间
const formatDateTime = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await usersApi.getUsers({
      page: userCurrentPage.value,
      limit: userPageSize.value,
      search: userSearch.value || undefined
    })
    users.value = response.data.users.map(user => ({
      ...user,
      is_active: user.status === 'active'
    }))
    userTotal.value = response.data.pagination?.total || 0
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 切换用户状态
const toggleUserStatus = async (user: any) => {
  try {
    const newStatus = user.is_active ? 'active' : 'inactive'
    await usersApi.toggleUserStatus(String(user.id), newStatus)
    ElMessage.success(`用户 ${user.real_name} 状态已更新`)
  } catch (error) {
    ElMessage.error('更新用户状态失败')
    user.is_active = !user.is_active // 回滚状态
  }
}

// 编辑用户
const editUser = (user: any) => {
  // 设置编辑的用户数据
  editingUser.value = user
  // 打开编辑对话框
  showCreateUserDialog.value = true
}

// 删除用户
const deleteUser = async (user: any) => {
  try {
    console.log('开始删除用户:', user)
    console.log('当前登录用户信息:', authStore.user)
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.real_name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    console.log('用户确认删除，准备调用API，用户ID:', String(user.id))
    console.log('请求URL:', `http://localhost:3000/api/users/${String(user.id)}`)
    console.log('认证token:', authStore.token)
    // 调用删除API，确保ID是字符串类型
    const response = await usersApi.deleteUser(String(user.id))
    console.log('删除API响应:', response)
    ElMessage.success('用户删除成功')
    // 刷新用户列表
    await fetchUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error)
      console.error('错误详情:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })
      console.error('错误状态码:', error.response?.status)
      // 显示更详细的错误信息
      const errorMessage = error.response?.data?.error || error.message || '删除用户失败'
      ElMessage.error(errorMessage)
    }
  }
}

// 编辑角色
const editRole = (role: any) => {
  ElMessage.info(`编辑角色 ${role.name} 功能开发中...`)
}

// 删除角色
const deleteRole = async (role: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${role.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // TODO: 调用删除API
    ElMessage.success('角色删除成功')
  } catch {
    // 用户取消删除
  }
}

// 查看日志详情
const viewLogDetail = (log: any) => {
  selectedLog.value = log
  showLogDetailDialog.value = true
}

// 刷新日志
const refreshLogs = async () => {
  loading.value = true
  try {
    // TODO: 调用API获取日志
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success('日志已刷新')
  } catch (error) {
    ElMessage.error('刷新日志失败')
  } finally {
    loading.value = false
  }
}

// Logo上传前检查
const beforeLogoUpload = (file: File) => {
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

// Logo上传成功
const handleLogoSuccess = (response: any) => {
  systemSettings.logo_url = response.url
  ElMessage.success('Logo上传成功')
}

// 保存设置
const saveSettings = async () => {
  saving.value = true
  try {
    // TODO: 调用API保存设置
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('设置保存成功')
  } catch (error) {
    ElMessage.error('保存设置失败')
  } finally {
    saving.value = false
  }
}

// 重置设置
const resetSettings = () => {
  // TODO: 重置为默认值
  ElMessage.info('设置已重置')
}

// 处理创建用户成功
const handleCreateUserSuccess = () => {
  showCreateUserDialog.value = false
  editingUser.value = null // 清空编辑用户数据
  fetchUsers() // 刷新用户列表
}

// 处理创建角色成功
const handleCreateRoleSuccess = () => {
  showCreateRoleDialog.value = false
  // TODO: 刷新角色列表
}

onMounted(() => {
  // 初始化数据
  fetchUsers()
})
</script>

<style scoped>
.admin-view {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.admin-menu {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.menu-card {
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.menu-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.menu-card.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.menu-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: var(--el-color-primary-light-8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--el-color-primary);
}

.menu-info {
  flex: 1;
}

.menu-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.menu-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.content-card {
  flex: 1;
}

.admin-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.content-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.role-card {
  border: 1px solid var(--el-border-color-lighter);
}

.role-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.role-info h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.role-info p {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.role-actions {
  display: flex;
  gap: 8px;
}

.role-permissions {
  margin-bottom: 16px;
}

.permission-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.permission-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.role-stats {
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.user-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.settings-form {
  max-width: 800px;
}

.setting-section {
  margin-bottom: 24px;
}

.logo-uploader {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.logo-uploader:hover {
  border-color: var(--el-color-primary);
}

.logo {
  width: 100px;
  height: 100px;
  object-fit: cover;
  display: block;
}

.logo-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

.log-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.detail-item label {
  min-width: 80px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.log-details {
  background: var(--el-fill-color-light);
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  word-break: break-all;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .admin-view {
    padding: 16px;
  }
  
  .admin-menu {
    grid-template-columns: 1fr;
  }
  
  .content-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .roles-grid {
    grid-template-columns: 1fr;
  }
  
  .settings-form {
    max-width: none;
  }
}
</style>