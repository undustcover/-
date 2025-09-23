<template>
  <el-drawer
    v-model="visible"
    :title="task?.title || '任务详情'"
    direction="rtl"
    size="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    
    <div v-else-if="!task" class="empty-container">
      <el-empty description="任务不存在" />
    </div>
    
    <div v-else class="task-detail-content">
      <!-- 任务基本信息 -->
      <div class="task-header">
        <div class="task-status">
          <el-tag :type="getStatusType(task.status)" size="large">
            {{ getStatusText(task.status) }}
          </el-tag>
          <el-tag :type="getPriorityType(task.priority)" size="small">
            {{ getPriorityText(task.priority) }}
          </el-tag>
        </div>
        
        <div class="task-actions">
          <el-button size="small" v-if="canEdit" @click="editTask">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button size="small" v-if="canDelete" type="danger" @click="deleteTask">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </div>
      
      <!-- 任务信息卡片 -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <span>基本信息</span>
        </template>
        
        <div class="info-grid">
          <div class="info-item">
            <label>负责人</label>
            <div v-if="task.assignee" class="assignee-info">
              <el-avatar :size="24" :src="task.assignee.avatar">
                {{ task.assignee.real_name?.charAt(0) }}
              </el-avatar>
              <span>{{ task.assignee.real_name }}</span>
            </div>
            <span v-else class="text-placeholder">未分配</span>
          </div>
          
          <div class="info-item">
            <label>创建人</label>
            <div v-if="task.creator" class="creator-info">
              <el-avatar :size="24" :src="task.creator.avatar">
                {{ task.creator.real_name?.charAt(0) }}
              </el-avatar>
              <span>{{ task.creator.real_name }}</span>
            </div>
          </div>
          
          <div class="info-item">
            <label>创建时间</label>
            <span>{{ formatDateTime(task.created_at) }}</span>
          </div>
          
          <div class="info-item">
            <label>截止时间</label>
            <span v-if="task.due_date" :class="getDueDateClass(task.due_date)">
              {{ formatDateTime(task.due_date) }}
            </span>
            <span v-else class="text-placeholder">无</span>
          </div>
          
          <div class="info-item">
            <label>预估工时</label>
            <span>{{ task.estimated_hours || 0 }} 小时</span>
          </div>
          
          <div class="info-item">
            <label>完成进度</label>
            <el-progress :percentage="task.progress || 0" :stroke-width="8" />
          </div>
        </div>
      </el-card>
      
      <!-- 任务描述 -->
      <el-card class="description-card" shadow="never">
        <template #header>
          <span>任务描述</span>
        </template>
        
        <div v-if="task.description" class="description-content">
          <div v-html="task.description"></div>
        </div>
        <div v-else class="empty-description">
          <span class="text-placeholder">暂无描述</span>
        </div>
      </el-card>
      
      <!-- 标签 -->
      <el-card v-if="task.tags?.length" class="tags-card" shadow="never">
        <template #header>
          <span>标签</span>
        </template>
        
        <div class="tags-list">
          <el-tag
            v-for="tag in task.tags"
            :key="tag"
            size="small"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
        </div>
      </el-card>
      
      <!-- 附件 -->
      <el-card v-if="task.attachments?.length" class="attachments-card" shadow="never">
        <template #header>
          <span>附件 ({{ task.attachments.length }})</span>
        </template>
        
        <div class="attachments-list">
          <div
            v-for="attachment in task.attachments"
            :key="attachment.id"
            class="attachment-item"
          >
            <div class="attachment-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="attachment-info">
              <div class="attachment-name">{{ attachment.original_name || attachment.filename }}</div>
              <div class="attachment-meta">
                <span class="attachment-size">{{ formatFileSize(attachment.size) }}</span>
                <span class="attachment-time">{{ formatDateTime(attachment.created_at) }}</span>
              </div>
            </div>
            <div class="attachment-actions">
              <el-button type="primary" text size="small" @click="downloadAttachment(attachment)">
                下载
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
      
      <!-- 评论区 -->
      <el-card class="comments-card" shadow="never">
        <template #header>
          <span>评论 ({{ comments.length }})</span>
        </template>
        
        <!-- 添加评论 -->
        <div class="add-comment">
          <el-input
            v-model="newComment"
            type="textarea"
            :rows="3"
            placeholder="添加评论..."
            maxlength="500"
            show-word-limit
          />
          <div class="comment-actions">
            <el-button
              type="primary"
              size="small"
              :disabled="!newComment.trim()"
              @click="addComment"
            >
              发表评论
            </el-button>
          </div>
        </div>
        
        <!-- 评论列表 -->
        <div v-if="comments.length" class="comments-list">
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="comment-item"
          >
            <div class="comment-avatar">
              <el-avatar :size="32" :src="comment.user.avatar">
                {{ comment.user.real_name?.charAt(0) }}
              </el-avatar>
            </div>
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-user">{{ comment.user.real_name }}</span>
                <span class="comment-time">{{ formatDateTime(comment.created_at) }}</span>
              </div>
              <div class="comment-text">{{ comment.content }}</div>
            </div>
          </div>
        </div>
        
        <div v-else class="empty-comments">
          <span class="text-placeholder">暂无评论</span>
        </div>
      </el-card>
    </div>
    
    <!-- 编辑任务对话框 -->
    <TaskEditDialog
      v-model="showEditDialog"
      :task="task"
      :is-edit="true"
      @success="handleEditSuccess"
    />
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Edit,
  Delete,
  Loading,
  Document
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import TaskEditDialog from './TaskEditDialog.vue'
import type { Task, TaskComment } from '@/types/task'
import { filesApi } from '@/api/files'
import { useAuthStore } from '@/stores/auth'

// Props
interface Props {
  modelValue: boolean
  taskId?: string
  task?: Task | null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  taskId: '',
  task: null
})

// Emits
interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'edit', task: Task): void
  (e: 'delete', taskId: string): void
  (e: 'refresh'): void
}

const emit = defineEmits<Emits>()

// 响应式数据
const loading = ref(false)
const showEditDialog = ref(false)
const newComment = ref('')
const comments = ref<TaskComment[]>([])

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 获取状态类型
const getStatusType = (status: string) => {
  const types = {
    pending: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'danger'
  }
  return types[status] || ''
}

// 获取状态文本
const getStatusText = (status: string) => {
  const texts = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

// 获取优先级类型
const getPriorityType = (priority: string) => {
  const types = {
    low: '',
    medium: 'warning',
    high: 'danger',
    urgent: 'danger'
  }
  return types[priority] || ''
}

// 获取优先级文本
const getPriorityText = (priority: string) => {
  const texts = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }
  return texts[priority] || priority
}

// 获取截止日期样式
const getDueDateClass = (dueDate: string) => {
  const now = dayjs()
  const due = dayjs(dueDate)
  const diff = due.diff(now, 'day')
  
  if (diff < 0) return 'text-danger' // 已逾期
  if (diff <= 3) return 'text-warning' // 即将到期
  return ''
}

// 格式化日期时间
const formatDateTime = (date: string) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

// 编辑任务
const editTask = () => {
  if (!props.task) return
  showEditDialog.value = true
}

// 删除任务
const deleteTask = async () => {
  if (!props.task) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除任务「${props.task.title}」吗？`,
      '确认删除',
      {
        type: 'warning'
      }
    )
    
    emit('delete', props.task.id)
    handleClose()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 下载附件
const downloadAttachment = async (attachment: any) => {
  try {
    const response = await filesApi.downloadFile(attachment.id)
    
    // 确保响应数据是blob类型
    let blob: Blob
    if (response.data instanceof Blob) {
      blob = response.data
    } else {
      // 如果不是blob，创建一个新的blob
      blob = new Blob([response.data], { type: attachment.mime_type || 'application/octet-stream' })
    }
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = attachment.original_name || attachment.filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error(`下载失败: ${error.message || '未知错误'}`)
  }
}

// 添加评论
const addComment = async () => {
  if (!newComment.value.trim() || !props.task) return
  
  try {
    // TODO: 调用API添加评论
    const comment: TaskComment = {
      id: Date.now().toString(),
      task_id: props.task.id,
      user: {
        id: '1',
        real_name: '当前用户',
        avatar: ''
      },
      content: newComment.value.trim(),
      created_at: new Date().toISOString()
    }
    
    comments.value.unshift(comment)
    newComment.value = ''
    ElMessage.success('评论添加成功')
  } catch (error) {
    ElMessage.error('添加评论失败')
  }
}

// 处理编辑成功
const handleEditSuccess = () => {
  showEditDialog.value = false
  emit('refresh')
}

// 关闭抽屉
const handleClose = () => {
  visible.value = false
  newComment.value = ''
}

// 加载评论
const loadComments = async () => {
  if (!props.task) return
  
  // TODO: 调用API获取评论
  // 模拟数据
  comments.value = [
    {
      id: '1',
      task_id: props.task.id,
      user: {
        id: '2',
        real_name: '张三',
        avatar: ''
      },
      content: '这个任务需要注意数据库性能优化',
      created_at: '2024-01-10T10:30:00Z'
    }
  ]
}

// 监听任务变化
watch(
  () => props.task,
  (newTask) => {
    if (newTask && visible.value) {
      loadComments()
    }
  },
  { immediate: true }
)

// 监听抽屉显示状态
watch(visible, (newVal) => {
  if (newVal && props.task) {
    loadComments()
  }
})

const authStore = useAuthStore()

// 根据用户角色和任务所有权判断是否可编辑
const canEdit = computed(() => {
  const t = props.task;
  const u = authStore.user;
  if (!t || !u) return false;

  if (authStore.isAdmin || authStore.isSuperAdmin || authStore.isManager) {
    return true;
  }

  const assigneeId = (t as any).assignee_id ?? (t as any).assigned_to ?? (t as any).assignee?.id;
  return String(u.id) === String(assigneeId);
});

// 根据用户角色和任务所有权判断是否可删除
const canDelete = computed(() => {
  const t = props.task;
  const u = authStore.user;
  if (!t || !u) return false;

  if (authStore.isAdmin || authStore.isSuperAdmin) {
    return true;
  }

  const creatorId = (t as any).creator_id ?? (t as any).created_by ?? (t as any).creator?.id;
  return String(u.id) === String(creatorId);
});
</script>

<style scoped>
.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  flex-direction: column;
  gap: 16px;
}

.task-detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 20px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.task-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-actions {
  display: flex;
  gap: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.assignee-info,
.creator-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.description-content {
  line-height: 1.6;
  color: var(--el-text-color-primary);
}

.empty-description {
  text-align: center;
  padding: 20px 0;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  margin: 0;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  transition: border-color 0.2s;
}

.attachment-item:hover {
  border-color: var(--el-color-primary);
}

.attachment-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-radius: 4px;
}

.attachment-info {
  flex: 1;
}

.attachment-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.attachment-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.add-comment {
  margin-bottom: 20px;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-user {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.comment-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.comment-text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
}

.empty-comments {
  text-align: center;
  padding: 20px 0;
}

.text-placeholder {
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

.text-danger {
  color: var(--el-color-danger);
}

.text-warning {
  color: var(--el-color-warning);
}

:deep(.el-card) {
  border: 1px solid var(--el-border-color-lighter);
}

:deep(.el-card__header) {
  padding: 16px 20px;
  background: var(--el-bg-color-page);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-progress-bar__outer) {
  background-color: var(--el-border-color-lighter);
}
</style>