<template>
  <div class="kanban-view">
    <div class="page-header">
      <h1 class="page-title">看板</h1>
      <div class="header-actions">
        <el-button @click="refreshBoard">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="warning" @click="clearTestTasks">
          <el-icon><Delete /></el-icon>
          清理测试条目
        </el-button>
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新建任务
        </el-button>
      </div>
    </div>
    
    <!-- 筛选器 -->
    <el-card class="filter-card">
      <div class="filter-row">
        <div class="filter-item">
          <el-select
            v-model="filters.assignee"
            placeholder="负责人"
            clearable
            @change="handleFilter"
          >
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.real_name"
              :value="user.id"
            />
          </el-select>
        </div>
        
        <div class="filter-item">
          <el-select
            v-model="filters.priority"
            placeholder="优先级"
            clearable
            @change="handleFilter"
          >
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </div>
        
        <div class="filter-item">
          <el-select
            v-model="filters.category"
            placeholder="任务类型"
            clearable
            @change="handleFilter"
          >
            <el-option label="生产协调" value="production_coordination" />
            <el-option label="项目管理" value="project_management" />
            <el-option label="综合工作" value="general_work" />
          </el-select>
        </div>
        
        <div class="filter-item">
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 逾期任务列表视图 -->
    <el-card class="overdue-card" v-if="overdueTasks.length">
      <template #header>
        <div class="overdue-header">
          <span>逾期任务（{{ overdueTasks.length }}）</span>
        </div>
      </template>
      <el-table :data="overdueTasks" size="small" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80"/>
        <el-table-column prop="title" label="标题"/>
        <el-table-column label="负责人" width="140">
          <template #default="{ row }">
            <span>{{ row.assignee?.real_name || '未分配' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="截止时间" width="160">
          <template #default="{ row }">
            <span class="overdue-time">{{ formatDate(row.due_date) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <span class="overdue-status">{{ getStatusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="viewTask(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 看板主体 -->
    <div class="kanban-board" v-loading="loading">
      <div
        v-for="column in columns"
        :key="column.status"
        class="kanban-column"
        @drop="handleDrop($event, column.status)"
        @dragover.prevent
        @dragenter.prevent
      >
        <div class="column-header">
          <div class="column-title">
            <span class="column-name">{{ column.name }}</span>
            <el-badge :value="column.tasks.length" class="column-count" />
          </div>
          <div class="column-actions">
            <el-dropdown trigger="click">
              <el-button type="primary" text size="small">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="column.status !== 'completed'" @click="addTask(column.status)">
                    <el-icon><Plus /></el-icon>
                    添加任务
                  </el-dropdown-item>
                  <el-dropdown-item @click="clearColumn(column.status)">
                    <el-icon><Delete /></el-icon>
                    清空列
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        
        <div class="column-content">
          <div class="task-list">
            <div
              v-for="task in column.tasks"
              :key="task.id"
              class="task-card"
              :class="{
                'task-overdue': isOverdue(task.due_date),
                'task-urgent': task.priority === 'urgent'
              }"
              draggable="true"
              @dragstart="handleDragStart($event, task)"
              @click="viewTask(task)"
            >
              <!-- 任务头部 -->
              <div class="task-header">
                <div class="task-id">#{{ task.id }}</div>
                <div class="task-priority">
                  <el-tag
                    :type="getPriorityType(task.priority)"
                    size="small"
                    effect="plain"
                  >
                    {{ getPriorityText(task.priority) }}
                  </el-tag>
                </div>
              </div>
              
              <!-- 任务标题 -->
              <div class="task-title">{{ task.title }}</div>
              
              <!-- 任务标签 -->
              <div v-if="task.tags?.length" class="task-tags">
                <el-tag
                  v-for="tag in task.tags.slice(0, 2)"
                  :key="tag"
                  size="small"
                  effect="plain"
                >
                  {{ tag }}
                </el-tag>
                <span v-if="task.tags.length > 2" class="more-tags">
                  +{{ task.tags.length - 2 }}
                </span>
              </div>
              
              <!-- 任务类型 -->
              <div class="task-type">
                <el-tag
                  :type="getTypeColor(task.category)"
                  size="small"
                  effect="plain"
                >
                  {{ getTypeText(task.category) }}
                </el-tag>
              </div>
              
              <!-- 任务底部 -->
              <div class="task-footer">
                <div class="task-assignee">
                  <el-avatar
                    v-if="task.assignee"
                    :size="24"
                    :src="task.assignee.avatar"
                  >
                    {{ task.assignee.real_name?.charAt(0) }}
                  </el-avatar>
                  <span v-else class="unassigned">未分配</span>
                </div>
                
                <div class="task-meta">
                  <div v-if="task.due_date" class="task-due-date" :class="getDueDateClass(task.due_date)">
                    <el-icon><Clock /></el-icon>
                    <span>{{ formatDate(task.due_date) }}</span>
                  </div>
                  
                  <div v-if="task.attachments?.length" class="task-attachments">
                    <el-icon><Paperclip /></el-icon>
                    <span>{{ task.attachments.length }}</span>
                  </div>
                  
                  <div v-if="task.comments_count" class="task-comments">
                    <el-icon><ChatDotRound /></el-icon>
                    <span>{{ task.comments_count }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 添加任务按钮 -->
          <div class="add-task-btn" v-if="column.status !== 'completed'" @click="addTask(column.status)">
            <el-icon><Plus /></el-icon>
            <span>添加任务</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 创建任务对话框 -->
    <TaskCreateDialog
      v-model="showCreateDialog"
      :default-status="defaultStatus"
      @success="handleCreateSuccess"
    />
    
    <!-- 任务详情抽屉 -->
    <TaskDetailDrawer
      v-model="showDetailDrawer"
      :task="currentTask"
      @update="handleTaskUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  Plus,
  MoreFilled,
  Delete,
  Clock,
  Paperclip,
  ChatDotRound
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useTasksStore } from '@/stores/tasks'
import TaskCreateDialog from '@/components/tasks/TaskCreateDialog.vue'
import TaskDetailDrawer from '@/components/tasks/TaskDetailDrawer.vue'
import type { Task, KanbanColumn } from '@/types/task'

const router = useRouter()
const tasksStore = useTasksStore()

// 响应式数据
const loading = ref(false)
const showCreateDialog = ref(false)
const showDetailDrawer = ref(false)
const currentTask = ref<Task | null>(null)
const defaultStatus = ref('pending')

const filters = reactive({
  assignee: '',
  priority: '',
  category: ''
})

// 模拟用户数据
const users = ref([
  { id: '1', real_name: '张三' },
  { id: '2', real_name: '李四' },
  { id: '3', real_name: '王五' }
])

// 看板列配置
const columnConfig = [
  { status: 'pending', name: '待处理', color: '#909399' },
  { status: 'in_progress', name: '进行中', color: '#E6A23C' },
  { status: 'completed', name: '已完成', color: '#67C23A' }
]

// 计算属性
const overdueTasks = computed(() => {
  return tasksStore.tasks
    .filter(t => {
      if (isTestTask(t)) return false
      if (!t.due_date) return false
      const overdue = dayjs(t.due_date).isBefore(dayjs(), 'day')
      const notCompleted = t.status !== 'completed'
      return overdue && notCompleted
    })
    .sort((a, b) => dayjs(a.due_date).valueOf() - dayjs(b.due_date).valueOf())
})

const columns = computed(() => {
  return columnConfig.map(config => ({
    ...config,
    tasks: filteredTasks.value.filter(task => task.status === config.status)
  }))
})

const filteredTasks = computed(() => {
  let tasks = tasksStore.tasks
  
  if (filters.assignee) {
    tasks = tasks.filter(task => task.assignee?.id === filters.assignee)
  }
  
  if (filters.priority) {
    tasks = tasks.filter(task => task.priority === filters.priority)
  }
  
  if (filters.category) {
    tasks = tasks.filter(task => task.category === filters.category)
  }

  // 隐藏所有“测试”类任务
  tasks = tasks.filter(t => !isTestTask(t))
  
  return tasks
})

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

// 获取任务类型颜色
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

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待处理',
    in_progress: '进行中',
    testing: '测试中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

// 检查是否逾期
const isOverdue = (dueDate: string) => {
  if (!dueDate) return false
  return dayjs(dueDate).isBefore(dayjs(), 'day')
}

// 获取截止日期样式
const getDueDateClass = (dueDate: string) => {
  const now = dayjs()
  const due = dayjs(dueDate)
  const diff = due.diff(now, 'day')
  
  if (diff < 0) return 'overdue'
  if (diff <= 1) return 'urgent'
  if (diff <= 3) return 'warning'
  return ''
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return ''
  return dayjs(date).format('MM-DD')
}

// 处理拖拽开始
const handleDragStart = (event: DragEvent, task: Task) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', JSON.stringify(task))
    event.dataTransfer.effectAllowed = 'move'
  }
}

// 处理拖拽放置
const handleDrop = async (event: DragEvent, targetStatus: string) => {
  event.preventDefault()
  
  if (!event.dataTransfer) return
  
  try {
    const taskData = JSON.parse(event.dataTransfer.getData('text/plain'))
    const task = taskData as Task
    
    if (task.status === targetStatus) return
    
    // 更新任务状态
    await tasksStore.updateTaskStatus(task.id, targetStatus)
    ElMessage.success('任务状态更新成功')
    
    // 刷新数据
    await fetchTasks()
  } catch (error) {
    ElMessage.error('更新任务状态失败')
  }
}

// 查看任务详情
const viewTask = (task: Task) => {
  currentTask.value = task
  showDetailDrawer.value = true
}

// 添加任务
const addTask = (status: string) => {
  if (status === 'completed') {
    ElMessage.info('已完成列不支持新增任务')
    return
  }
  defaultStatus.value = status
  showCreateDialog.value = true
}

// 清空列
const clearColumn = async (status: string) => {
  const column = columns.value.find(col => col.status === status)
  if (!column || column.tasks.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要清空「${column.name}」列的所有任务吗？`,
      '确认清空',
      {
        type: 'warning'
      }
    )
    
    // TODO: 批量删除或移动任务
    ElMessage.success('列已清空')
    await fetchTasks()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清空失败')
    }
  }
}

// 处理筛选
const handleFilter = () => {
  // 筛选逻辑已在计算属性中处理
}

// 重置筛选器
const resetFilters = () => {
  Object.assign(filters, {
    assignee: '',
    priority: '',
    category: ''
  })
}

// 清理测试条目
const isTestTask = (t: Task) => {
  const title = (t.title || '').toLowerCase()
  const tags = (t.tags || []).map(s => s.toLowerCase())
  const cat = (t.category || '').toLowerCase()
  return t.status === 'testing' ||
    title.includes('测试') ||
    title.includes('test') ||
    tags.some(x => x.includes('测试') || x.includes('test')) ||
    cat.includes('测试') ||
    cat.includes('test')
}

const clearTestTasks = async () => {
  const testTasks = tasksStore.tasks.filter(isTestTask)
  if (!testTasks.length) {
    ElMessage.info('没有检测到测试条目')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除 ${testTasks.length} 条测试任务吗？`, '清理测试条目', { type: 'warning' })
    await Promise.all(testTasks.map(t => tasksStore.deleteTask(t.id)))
    ElMessage.success('测试条目已清理')
    await fetchTasks()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清理失败')
    }
  }
}

// 刷新看板
const refreshBoard = async () => {
  await fetchTasks()
  ElMessage.success('看板已刷新')
}

// 处理创建成功
const handleCreateSuccess = () => {
  showCreateDialog.value = false
  fetchTasks()
}

// 处理任务更新
const handleTaskUpdate = () => {
  fetchTasks()
}

// 获取任务列表
const fetchTasks = async () => {
  loading.value = true
  try {
    await tasksStore.fetchTasks()
  } catch (error) {
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTasks()
})
</script>

<style scoped>
.kanban-view {
  padding: 20px;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.filter-card {
  margin-bottom: 20px;
}

.overdue-card {
  margin-bottom: 20px;
}

.overdue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.overdue-time {
  color: var(--el-color-danger);
}

.overdue-status {
  color: var(--el-text-color-secondary);
}

.filter-row {
  display: flex;
  gap: 16px;
  align-items: center;
}

.filter-item {
  min-width: 150px;
}

.filter-item:last-child {
  min-width: auto;
}

.kanban-board {
  flex: 1;
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 20px;
}

.kanban-column {
  min-width: 300px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  height: fit-content;
  max-height: calc(100vh - 240px);
}

.column-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--el-fill-color-light);
  border-radius: 8px 8px 0 0;
}

.column-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.column-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.column-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.task-card {
  background: white;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.task-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.task-card.task-overdue {
  border-left: 4px solid var(--el-color-danger);
}

.task-card.task-urgent {
  border-left: 4px solid var(--el-color-warning);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-id {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-family: monospace;
}

.task-title {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-tags {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.more-tags {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.task-type {
  margin-bottom: 12px;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-assignee .unassigned {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

.task-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.task-due-date,
.task-attachments,
.task-comments {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.task-due-date.overdue {
  color: var(--el-color-danger);
}

.task-due-date.urgent {
  color: var(--el-color-warning);
}

.task-due-date.warning {
  color: var(--el-color-warning);
}

.add-task-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 2px dashed var(--el-border-color);
  border-radius: 6px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.add-task-btn:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

@media (max-width: 768px) {
  .kanban-board {
    flex-direction: column;
  }
  
  .kanban-column {
    min-width: auto;
    max-height: 400px;
  }
  
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-item {
    min-width: auto;
  }
}
</style>