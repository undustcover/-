<template>
  <div class="task-detail-view">
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    
    <div v-else-if="!task" class="error-container">
      <el-result
        icon="warning"
        title="任务不存在"
        sub-title="您访问的任务可能已被删除或不存在"
      >
        <template #extra>
          <el-button type="primary" @click="$router.push('/tasks')">
            返回任务列表
          </el-button>
        </template>
      </el-result>
    </div>
    
    <div v-else class="task-content">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-left">
          <el-button
            type="primary"
            text
            @click="$router.back()"
          >
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <h1 class="page-title">{{ task.title }}</h1>
        </div>
        <div class="header-actions">
          <el-button v-if="canEdit" @click="showEditDialog = true">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button v-if="canDelete" type="danger" @click="deleteTask">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </div>
      
      <!-- 主要内容 -->
      <div class="task-main">
        <!-- 左侧内容 -->
        <div class="task-left">
          <!-- 基本信息 -->
          <el-card class="info-card">
            <template #header>
              <span>基本信息</span>
            </template>
            
            <div class="info-grid">
              <div class="info-item">
                <label>状态</label>
                <el-tag :type="getStatusType(task.status)">
                  {{ getStatusText(task.status) }}
                </el-tag>
              </div>
              
              <div class="info-item">
                <label>优先级</label>
                <el-tag :type="getPriorityType(task.priority)">
                  {{ getPriorityText(task.priority) }}
                </el-tag>
              </div>
              
              <div class="info-item">
                <label>类型</label>
                <el-tag :type="getTypeColor(task.category)">
                  {{ getTypeText(task.category) }}
                </el-tag>
              </div>
              
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
                <label>更新时间</label>
                <span>{{ formatDateTime(task.updated_at) }}</span>
              </div>
              
              <div class="info-item">
                <label>截止时间</label>
                <span v-if="task.due_date" :class="getDueDateClass(task.due_date)">
                  {{ formatDateTime(task.due_date) }}
                </span>
                <span v-else class="text-placeholder">无</span>
              </div>
            </div>
          </el-card>
          
          <!-- 任务描述 -->
          <el-card class="description-card">
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
          
          <!-- 附件列表 -->
          <el-card class="attachments-card">
            <template #header>
              <div class="attachments-header">
                <span>附件 ({{ task.attachments?.length || 0 }})</span>
                <el-button v-if="canEdit" type="primary" size="small" @click="triggerFileUpload">
                  <el-icon><Upload /></el-icon>
                  上传文件
                </el-button>
              </div>
            </template>
            
            <!-- 文件上传组件 -->
            <div v-if="canEdit" class="upload-section">
              <el-upload
                 ref="uploadRef"
                 :action="uploadAction"
                 :headers="uploadHeaders"
                 :data="uploadData"
                 :on-success="handleUploadSuccess"
                 :on-error="handleUploadError"
                 :on-progress="handleUploadProgress"
                 :before-upload="beforeUpload"
                 :show-file-list="false"
                 :auto-upload="true"
                 multiple
                 drag
                 class="upload-dragger"
               >
                <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                <div class="el-upload__text">
                  将文件拖拽到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    支持 jpg/png/gif/pdf/doc/docx/xls/xlsx/ppt/pptx/txt/zip/rar 格式，单个文件不超过 10MB
                  </div>
                </template>
              </el-upload>
              
              <!-- 上传进度 -->
              <div v-if="uploadProgress.length > 0" class="upload-progress">
                <div v-for="(progress, index) in uploadProgress" :key="index" class="progress-item">
                  <div class="progress-info">
                    <span class="file-name">{{ progress.fileName }}</span>
                    <span class="progress-percent">{{ progress.percent }}%</span>
                  </div>
                  <el-progress :percentage="progress.percent" :status="progress.status" />
                </div>
              </div>
            </div>
            
            <!-- 附件列表 -->
            <div v-if="task.attachments?.length" class="attachments-list">
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
                    <el-icon><Download /></el-icon>
                    下载
                  </el-button>
                  <el-button v-if="canEdit" type="danger" text size="small" @click="deleteAttachment(attachment)">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
              </div>
            </div>
            
            <!-- 空状态 -->
            <div v-if="!task.attachments?.length && !canEdit" class="empty-attachments">
              <span class="text-placeholder">暂无附件</span>
            </div>
          </el-card>
        </div>
        
        <!-- 右侧内容 -->
        <div class="task-detail-right">
          <!-- 里程碑时间轴 -->
          <div class="milestone-section">
            <MilestoneTimeline 
              :task-id="route.params.id as string" 
              @milestone-updated="handleMilestoneUpdated"
            />
          </div>

          <!-- 操作历史 -->
          <el-card class="history-card">
            <template #header>
              <span>操作历史</span>
            </template>
            
            <div class="history-timeline">
              <el-timeline>
                <el-timeline-item
                  v-for="item in taskHistory"
                  :key="item.id"
                  :timestamp="formatDateTime(item.created_at)"
                  placement="top"
                >
                  <div class="history-content">
                    <div class="history-user">
                      <el-avatar :size="20" :src="item.user_avatar">
                        {{ item.user_name?.charAt(0) }}
                      </el-avatar>
                      <span class="history-username">{{ item.user_name }}</span>
                    </div>
                    <div class="history-action">{{ item.action }}</div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-card>
          
          <!-- 评论区 -->
          <el-card class="comments-card">
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
                  <el-avatar :size="32" :src="comment.user?.avatar">
                    {{ comment.user?.real_name?.charAt(0) || '?' }}
                  </el-avatar>
                </div>
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="comment-user">{{ comment.user?.real_name || '未知用户' }}</span>
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
      </div>
    </div>
    
    <!-- 编辑任务对话框 -->
    <TaskEditDialog
      v-model="showEditDialog"
      :task="task"
      @success="handleEditSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Edit,
  Delete,
  Loading,
  Document,
  Download,
  Upload,
  UploadFilled
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useTasksStore } from '@/stores/tasks'
import TaskEditDialog from '@/components/tasks/TaskEditDialog.vue'
import MilestoneTimeline from '@/components/milestones/MilestoneTimeline.vue'
import type { Task, TaskComment, TaskHistory } from '@/types/task'
import { taskApi } from '@/api/tasks'
import { filesApi } from '@/api/files'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const tasksStore = useTasksStore()
const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const showEditDialog = ref(false)
const newComment = ref('')
const comments = ref<TaskComment[]>([])
const taskHistory = ref<TaskHistory[]>([])
const uploadRef = ref()
const uploadProgress = ref<Array<{fileName: string, percent: number, status: string}>>([])

// 文件上传配置
const uploadAction = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/files/upload`
const uploadHeaders = computed(() => ({
  'Authorization': `Bearer ${authStore.token}`
}))
const uploadData = computed(() => ({
  task_id: route.params.id
}))

// 计算属性
const task = computed(() => tasksStore.currentTask)

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

// 获取类型颜色
const getTypeColor = (category: string) => {
  const colorMap: Record<string, string> = {
    production_coordination: 'success',
    project_management: 'primary',
    general_work: 'info'
  }
  return colorMap[category] || 'info'
}

// 获取任务类型文本
const getTypeText = (category: string) => {
  const textMap: Record<string, string> = {
    production_coordination: '生产协调',
    project_management: '项目管理',
    general_work: '综合工作',
    '生产协调': '生产协调',
    '项目管理': '项目管理',
    '综合工作': '综合工作'
  }
  return textMap[category] || category || '未知类型'
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
  return dayjs(date).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss')
}

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

// 删除任务
const deleteTask = async () => {
  if (!task.value) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除任务「${task.value.title}」吗？`,
      '确认删除',
      {
        type: 'warning'
      }
    )
    
    await tasksStore.deleteTask(task.value.id)
    ElMessage.success('删除成功')
    router.push('/tasks')
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

// 删除附件
const deleteAttachment = async (attachment: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除附件「${attachment.original_name || attachment.filename}」吗？`,
      '确认删除',
      {
        type: 'warning'
      }
    )
    
    await filesApi.deleteFile(attachment.id)
    ElMessage.success('删除成功')
    
    // 重新获取任务详情以更新附件列表
    fetchTaskDetail()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除附件失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 触发文件上传
const triggerFileUpload = () => {
  uploadRef.value?.clearFiles()
  const input = uploadRef.value?.$el.querySelector('input[type="file"]')
  input?.click()
}

// 上传前验证
const beforeUpload = (file: File) => {
  const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar']
  const fileExt = file.name.split('.').pop()?.toLowerCase()
  
  if (!fileExt || !allowedTypes.includes(fileExt)) {
    ElMessage.error(`不支持的文件类型: ${fileExt}`)
    return false
  }
  
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  
  // 添加到上传进度列表
  uploadProgress.value.push({
    fileName: file.name,
    percent: 0,
    status: 'uploading'
  })
  
  return true
}

// 上传进度
const handleUploadProgress = (event: any, file: any) => {
  const progress = uploadProgress.value.find(p => p.fileName === file.name)
  if (progress) {
    progress.percent = Math.round(event.percent)
  }
}

// 上传成功
const handleUploadSuccess = (response: any, file: any) => {
  const progress = uploadProgress.value.find(p => p.fileName === file.name)
  if (progress) {
    progress.percent = 100
    progress.status = 'success'
  }
  
  ElMessage.success(`文件 ${file.name} 上传成功`)
  
  // 延迟清除进度并刷新任务详情
  setTimeout(() => {
    uploadProgress.value = uploadProgress.value.filter(p => p.fileName !== file.name)
    fetchTaskDetail()
  }, 1500)
}

// 上传失败
const handleUploadError = (error: any, file: any) => {
  const progress = uploadProgress.value.find(p => p.fileName === file.name)
  if (progress) {
    progress.status = 'exception'
  }
  
  console.error('文件上传失败:', error)
  ElMessage.error(`文件 ${file.name} 上传失败`)
  
  // 延迟清除进度
  setTimeout(() => {
    uploadProgress.value = uploadProgress.value.filter(p => p.fileName !== file.name)
  }, 3000)
}

// 添加评论
const addComment = async () => {
  if (!newComment.value.trim() || !task.value) return

  try {
    const response = await taskApi.addTaskComment(task.value.id, newComment.value)
    comments.value.unshift(response.data.comment)
    newComment.value = ''
    ElMessage.success('评论添加成功')
  } catch (error) {
    ElMessage.error('添加评论失败')
  }
}

// 处理编辑成功
const handleEditSuccess = () => {
  showEditDialog.value = false
  fetchTaskDetail()
}

// 处理里程碑更新
const handleMilestoneUpdated = () => {
  fetchTaskDetail()
}

const fetchComments = async (taskId: string) => {
  try {
    const res = await taskApi.getTaskComments(taskId)
    comments.value = res.data.comments
  } catch (error) {
    console.error('获取评论失败:', error)
  }
}

const fetchHistory = async (taskId: string) => {
  try {
    const res = await taskApi.getTaskLogs(taskId)
    taskHistory.value = res.data.logs
  } catch (error) {
    console.error('获取操作历史失败:', error)
  }
}

// 获取任务详情
const fetchTaskDetail = async () => {
  const taskId = route.params.id as string
  if (!taskId) return
  
  loading.value = true
  try {
    await tasksStore.fetchTask(taskId)
    
    // 获取评论和历史记录
    fetchComments(taskId)
    fetchHistory(taskId)
  } catch (error: any) {
    // 如果接口返回403但用户是经理/管理员，仍允许展示详情（后端已放开，这里仅兜底）
    const isManagerOrAbove = authStore.isManager || authStore.isAdmin || authStore.isSuperAdmin
    if (error?.response?.status === 403 && isManagerOrAbove) {
      // 静默处理，不弹全局无权限提示
      return
    }
    ElMessage.error('获取任务详情失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTaskDetail()
})

// 根据用户角色和任务所有权判断是否可编辑
const canEdit = computed(() => {
  const t = task.value;
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
  const t = task.value;
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
.task-detail-view {
  padding: 20px;
}

.loading-container,
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  flex-direction: column;
  gap: 16px;
}

.task-main {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-top: 20px;
}

.task-left {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.task-detail-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.milestone-section {
  margin-bottom: 24px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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
  padding: 40px 0;
}

.attachments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-section {
  margin-bottom: 20px;
}

.upload-dragger {
  width: 100%;
}

.upload-progress {
  margin-top: 16px;
}

.progress-item {
  margin-bottom: 12px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.file-name {
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.progress-percent {
  font-size: 12px;
  color: var(--el-text-color-secondary);
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

.empty-attachments {
  text-align: center;
  padding: 40px 0;
  color: var(--el-text-color-secondary);
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

.history-timeline {
  max-height: 400px;
  overflow-y: auto;
}

.history-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-user {
  display: flex;
  align-items: center;
  gap: 6px;
}

.history-username {
  font-size: 12px;
  font-weight: 500;
}

.history-action {
  font-size: 14px;
  color: var(--el-text-color-primary);
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
  padding: 40px 0;
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

@media (max-width: 768px) {
  .task-main {
    grid-template-columns: 1fr;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>