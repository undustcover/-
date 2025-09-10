<template>
  <div class="notification-list">
    <!-- 通知头部 -->
    <div class="notification-header">
      <div class="header-left">
        <h3>通知中心</h3>
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
          <el-icon><Bell /></el-icon>
        </el-badge>
      </div>
      
      <div class="header-actions">
        <el-button
          v-if="unreadCount > 0"
          type="primary"
          text
          size="small"
          @click="markAllAsRead"
        >
          全部已读
        </el-button>
        
        <el-button
          type="primary"
          text
          size="small"
          @click="clearAll"
        >
          清空通知
        </el-button>
      </div>
    </div>
    
    <!-- 通知筛选 -->
    <div class="notification-filters">
      <el-radio-group v-model="activeFilter" size="small">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="unread">未读</el-radio-button>
        <el-radio-button label="system">系统</el-radio-button>
        <el-radio-button label="task">任务</el-radio-button>
        <el-radio-button label="mention">@我的</el-radio-button>
      </el-radio-group>
    </div>
    
    <!-- 通知列表 -->
    <div class="notification-content">
      <el-scrollbar height="400px">
        <div v-if="loading" class="loading-container">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>
        
        <div v-else-if="filteredNotifications.length === 0" class="empty-container">
          <el-empty description="暂无通知" />
        </div>
        
        <div v-else class="notifications-wrapper">
          <div
            v-for="notification in filteredNotifications"
            :key="notification.id"
            :class="[
              'notification-item',
              { 'is-unread': !notification.is_read },
              `notification-${notification.type}`
            ]"
            @click="handleNotificationClick(notification)"
          >
            <!-- 通知图标 -->
            <div class="notification-icon">
              <el-icon v-if="notification.type === 'system'" class="icon-system">
                <Setting />
              </el-icon>
              <el-icon v-else-if="notification.type === 'task'" class="icon-task">
                <Document />
              </el-icon>
              <el-icon v-else-if="notification.type === 'mention'" class="icon-mention">
                <ChatDotRound />
              </el-icon>
              <el-icon v-else-if="notification.type === 'reminder'" class="icon-reminder">
                <AlarmClock />
              </el-icon>
              <el-icon v-else class="icon-default">
                <Bell />
              </el-icon>
            </div>
            
            <!-- 通知内容 -->
            <div class="notification-content-wrapper">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-message">{{ notification.message }}</div>
              
              <div class="notification-meta">
                <span class="notification-time">
                  {{ formatTime(notification.created_at) }}
                </span>
                
                <el-tag
                  v-if="notification.category"
                  :type="getCategoryType(notification.category)"
                  size="small"
                  class="notification-category"
                >
                  {{ getCategoryText(notification.category) }}
                </el-tag>
              </div>
            </div>
            
            <!-- 未读标识 -->
            <div v-if="!notification.is_read" class="unread-dot"></div>
            
            <!-- 操作按钮 -->
            <div class="notification-actions">
              <el-button
                v-if="!notification.is_read"
                type="primary"
                text
                size="small"
                @click.stop="markAsRead(notification)"
              >
                标记已读
              </el-button>
              
              <el-button
                type="danger"
                text
                size="small"
                @click.stop="deleteNotification(notification)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>
    
    <!-- 分页 -->
    <div v-if="pagination.total > pagination.size" class="notification-pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        small
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Bell,
  Setting,
  Document,
  ChatDotRound,
  AlarmClock,
  Loading
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

// 配置dayjs
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// 通知接口
interface Notification {
  id: string
  type: 'system' | 'task' | 'mention' | 'reminder' | 'other'
  category: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  data?: any
}

const router = useRouter()

// 响应式数据
const loading = ref(false)
const activeFilter = ref('all')
const notifications = ref<Notification[]>([])

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 计算属性
const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.is_read).length
})

const filteredNotifications = computed(() => {
  let filtered = notifications.value
  
  switch (activeFilter.value) {
    case 'unread':
      filtered = filtered.filter(n => !n.is_read)
      break
    case 'system':
      filtered = filtered.filter(n => n.type === 'system')
      break
    case 'task':
      filtered = filtered.filter(n => n.type === 'task')
      break
    case 'mention':
      filtered = filtered.filter(n => n.type === 'mention')
      break
  }
  
  return filtered
})

// 获取分类类型
const getCategoryType = (category: string) => {
  const types = {
    urgent: 'danger',
    important: 'warning',
    normal: '',
    info: 'info'
  }
  return types[category] || ''
}

// 获取分类文本
const getCategoryText = (category: string) => {
  const texts = {
    urgent: '紧急',
    important: '重要',
    normal: '普通',
    info: '信息'
  }
  return texts[category] || category
}

// 格式化时间
const formatTime = (time: string) => {
  const now = dayjs()
  const target = dayjs(time)
  const diff = now.diff(target, 'minute')
  
  if (diff < 1) return '刚刚'
  if (diff < 60) return `${diff}分钟前`
  if (diff < 1440) return `${Math.floor(diff / 60)}小时前`
  if (diff < 10080) return `${Math.floor(diff / 1440)}天前`
  
  return target.format('YYYY-MM-DD HH:mm')
}

// 处理通知点击
const handleNotificationClick = async (notification: Notification) => {
  // 标记为已读
  if (!notification.is_read) {
    await markAsRead(notification)
  }
  
  // 根据通知类型跳转
  if (notification.data?.url) {
    router.push(notification.data.url)
  } else if (notification.type === 'task' && notification.data?.task_id) {
    router.push(`/tasks/${notification.data.task_id}`)
  }
}

// 标记为已读
const markAsRead = async (notification: Notification) => {
  try {
    // TODO: 调用API标记为已读
    notification.is_read = true
    ElMessage.success('已标记为已读')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 全部标记为已读
const markAllAsRead = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要将所有通知标记为已读吗？',
      '确认操作',
      {
        type: 'warning'
      }
    )
    
    // TODO: 调用API全部标记为已读
    notifications.value.forEach(n => {
      n.is_read = true
    })
    
    ElMessage.success('已全部标记为已读')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 删除通知
const deleteNotification = async (notification: Notification) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条通知吗？',
      '确认删除',
      {
        type: 'warning'
      }
    )
    
    // TODO: 调用API删除通知
    const index = notifications.value.findIndex(n => n.id === notification.id)
    if (index > -1) {
      notifications.value.splice(index, 1)
      pagination.total--
    }
    
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 清空所有通知
const clearAll = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有通知吗？此操作不可恢复。',
      '确认清空',
      {
        type: 'warning'
      }
    )
    
    // TODO: 调用API清空通知
    notifications.value = []
    pagination.total = 0
    pagination.page = 1
    
    ElMessage.success('已清空所有通知')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.page = page
  loadNotifications()
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.page = 1
  loadNotifications()
}

// 加载通知列表
const loadNotifications = async () => {
  loading.value = true
  try {
    // TODO: 调用API获取通知列表
    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'task',
        category: 'urgent',
        title: '任务分配通知',
        message: '您被分配了新任务：「用户登录功能开发」',
        is_read: false,
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        data: { task_id: '1', url: '/tasks/1' }
      },
      {
        id: '2',
        type: 'mention',
        category: 'important',
        title: '评论提醒',
        message: '张三在任务「数据库优化」中@了您',
        is_read: false,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        data: { task_id: '2', url: '/tasks/2' }
      },
      {
        id: '3',
        type: 'system',
        category: 'info',
        title: '系统维护通知',
        message: '系统将于今晚22:00-24:00进行维护，请提前保存工作',
        is_read: true,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        type: 'reminder',
        category: 'normal',
        title: '任务截止提醒',
        message: '任务「前端页面开发」将在明天截止，请及时完成',
        is_read: true,
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        data: { task_id: '3', url: '/tasks/3' }
      },
      {
        id: '5',
        type: 'task',
        category: 'normal',
        title: '任务状态更新',
        message: '任务「API接口开发」状态已更新为「已完成」',
        is_read: true,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        data: { task_id: '4', url: '/tasks/4' }
      }
    ]
    
    notifications.value = mockNotifications
    pagination.total = mockNotifications.length
  } catch (error) {
    ElMessage.error('加载通知失败')
  } finally {
    loading.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadNotifications()
})
</script>

<style scoped>
.notification-list {
  width: 100%;
  max-width: 400px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-left h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.notification-badge {
  margin-left: 8px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.notification-filters {
  padding: 12px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.notification-content {
  position: relative;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  flex-direction: column;
  gap: 12px;
  color: var(--el-text-color-secondary);
}

.empty-container {
  padding: 20px;
}

.notifications-wrapper {
  padding: 0;
}

.notification-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: var(--el-bg-color-page);
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item.is-unread {
  background-color: var(--el-color-primary-light-9);
}

.notification-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.icon-system {
  color: var(--el-color-info);
  background-color: var(--el-color-info-light-9);
}

.icon-task {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.icon-mention {
  color: var(--el-color-warning);
  background-color: var(--el-color-warning-light-9);
}

.icon-reminder {
  color: var(--el-color-success);
  background-color: var(--el-color-success-light-9);
}

.icon-default {
  color: var(--el-text-color-secondary);
  background-color: var(--el-fill-color-light);
}

.notification-content-wrapper {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  line-height: 1.4;
}

.notification-message {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.4;
  margin-bottom: 8px;
  word-break: break-word;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notification-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.notification-category {
  font-size: 11px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background-color: var(--el-color-primary);
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.notification-item:hover .notification-actions {
  opacity: 1;
}

.notification-pagination {
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: center;
}

:deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

:deep(.el-radio-button__inner) {
  padding: 6px 12px;
  font-size: 12px;
}

:deep(.el-scrollbar__view) {
  padding: 0;
}

:deep(.el-empty) {
  padding: 40px 20px;
}

:deep(.el-pagination) {
  justify-content: center;
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next),
:deep(.el-pagination .el-pager li) {
  min-width: 28px;
  height: 28px;
  line-height: 28px;
}
</style>