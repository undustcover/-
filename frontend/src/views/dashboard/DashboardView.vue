<template>
  <div class="dashboard">
    <div class="page-header">
      <h1 class="page-title">工作台</h1>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card clickable" @click="navigateToTasks('pending')">
        <div class="stat-content">
          <div class="stat-icon pending">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.pending }}</div>
            <div class="stat-label">待处理任务</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card clickable" @click="navigateToTasks('in_progress')">
        <div class="stat-content">
          <div class="stat-icon progress">
            <el-icon><Loading /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.in_progress }}</div>
            <div class="stat-label">进行中任务</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card clickable" @click="navigateToTasks('completed')">
        <div class="stat-content">
          <div class="stat-icon completed">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.completed }}</div>
            <div class="stat-label">已完成任务</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card clickable" @click="navigateToTasks('overdue')">
        <div class="stat-content">
          <div class="stat-icon overdue">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.overdue }}</div>
            <div class="stat-label">逾期任务</div>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="dashboard-content">
      <!-- 我的任务 -->
      <div class="content-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>我的任务</span>
              <el-button type="primary" size="small" @click="$router.push('/tasks')">
                查看全部
              </el-button>
            </div>
          </template>
          
          <div v-if="loading" class="loading-container">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
          
          <div v-else-if="myTasks.length === 0" class="empty-container">
            <el-icon class="empty-icon"><DocumentRemove /></el-icon>
            <div class="empty-text">暂无任务</div>
          </div>
          
          <div v-else class="task-list">
            <div
              v-for="task in myTasks"
              :key="task.id"
              class="task-item"
              @click="$router.push(`/tasks/${task.id}`)"
            >
              <div class="task-info">
                <div class="task-title">{{ task.title }}</div>
                <div class="task-meta">
                  <el-tag :type="getPriorityType(task.priority)" size="small">
                    {{ getPriorityText(task.priority) }}
                  </el-tag>
                  <span class="task-date">{{ formatDate(task.due_date) }}</span>
                </div>
              </div>
              <div class="task-status">
                <el-tag :type="getStatusType(task.status)" size="small">
                  {{ getStatusText(task.status) }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </div>
      
      <!-- 最近活动 -->
      <div class="content-section">
        <el-card>
          <template #header>
            <span>最近活动</span>
          </template>
          
          <div class="activity-list">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="activity-item"
            >
              <div class="activity-icon">
                <el-icon><Bell /></el-icon>
              </div>
              <div class="activity-content">
                <div class="activity-text">{{ activity.description }}</div>
                <div class="activity-time">{{ formatTime(activity.created_at) }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Clock, Loading, Check, Warning, DocumentRemove, Bell } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { taskApi } from '@/api/tasks'
import { request } from '@/api/http'
import { useAuthStore } from '@/stores/auth'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const stats = ref({
  pending: 0,
  in_progress: 0,
  completed: 0,
  overdue: 0
})

const myTasks = ref<any[]>([])
const recentActivities = ref<any[]>([])

// 获取优先级类型
const getPriorityType = (priority: string) => {
  const types: Record<string, '' | 'warning' | 'danger'> = {
    low: '',
    medium: 'warning',
    high: 'danger',
    urgent: 'danger'
  }
  return types[priority] || ''
}

// 获取优先级文本
const getPriorityText = (priority: string) => {
  const texts: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }
  return texts[priority] || priority
}

// 获取状态类型
const getStatusType = (status: string) => {
  const types: Record<string, 'info' | 'warning' | 'success' | 'danger' | ''> = {
    pending: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'danger'
  }
  return types[status] || ''
}

// 获取状态文本
const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return ''
  return dayjs(date).format('MM-DD')
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return ''
  return dayjs(time).fromNow()
}

// 导航到任务页面并应用筛选
const navigateToTasks = (filterType: string) => {
  const query: any = {}
  
  switch (filterType) {
    case 'pending':
      query.status = 'pending'
      break
    case 'in_progress':
      query.status = 'in_progress'
      break
    case 'completed':
      query.status = 'completed'
      break
    case 'overdue':
      query.overdue = 'true'
      break
  }
  
  router.push({
    path: '/tasks',
    query
  })
}

// 获取仪表板数据（真实接口）
const fetchDashboardData = async () => {
  loading.value = true
  console.log('Fetching dashboard data. Current authStore.user:', JSON.stringify(authStore.user));
  try {
    const userId = authStore.user?.id
    console.log('User ID for fetch:', userId);

    const [statsRes, myTasksRes, activitiesRes] = await Promise.all([
      taskApi.getTaskStats(),
      taskApi.getTasks({ assigned_to: userId ? String(userId) : undefined, limit: 5, sort: 'updated_at', order: 'desc' }),
      taskApi.getRecentActivities({ limit: 10 })
    ])

    // 任务统计（兼容不同返回结构）
    const statsPayload = (statsRes as any)?.data?.stats ?? (statsRes as any)?.stats
    if (statsPayload) {
      stats.value = statsPayload
    } else {
      console.warn('Dashboard: stats payload not found, statsRes shape =', statsRes)
    }

    // 我的任务列表（兼容不同返回结构）
    const tasksData = (myTasksRes as any)?.data?.tasks ?? (myTasksRes as any)?.tasks ?? (myTasksRes as any)?.data ?? []
    myTasks.value = Array.isArray(tasksData) ? tasksData : []
    if (!Array.isArray(tasksData)) {
      console.warn('Dashboard: tasks payload not array, myTasksRes shape =', myTasksRes)
    }

    // 最近活动（任务日志：创建与状态变更）
    const activitiesList = (activitiesRes as any)?.data?.activities ?? (activitiesRes as any)?.activities ?? []
    recentActivities.value = (Array.isArray(activitiesList) ? activitiesList : []).map((a: any) => ({
      id: a.id,
      description: a.description || `${a.user_name || '有人'} ${a.details || ''}`,
      created_at: a.created_at
    }))
  } catch (error) {
    console.error('获取仪表板数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})

watch(() => authStore.user, () => {
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 8px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.stat-icon.pending {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.progress {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.overdue {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.content-section {
  min-height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-list {
  max-height: 400px;
  overflow-y: auto;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: background-color 0.2s;
}

.task-item:hover {
  background-color: var(--el-fill-color-light);
  margin: 0 -16px;
  padding: 12px 16px;
  border-radius: 6px;
}

.task-item:last-child {
  border-bottom: none;
}

.task-info {
  flex: 1;
}

.task-title {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-date {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.activity-list {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-text {
  font-size: 14px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.activity-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>