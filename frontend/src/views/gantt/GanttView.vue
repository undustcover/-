<template>
  <div class="gantt-view">
    <div class="page-header">
      <h1 class="page-title">甘特图</h1>
      <div class="header-actions">
        <el-button-group>
          <el-button
            :type="viewMode === 'day' ? 'primary' : ''"
            @click="setViewMode('day')"
          >
            日
          </el-button>
          <el-button
            :type="viewMode === 'week' ? 'primary' : ''"
            @click="setViewMode('week')"
          >
            周
          </el-button>
          <el-button
            :type="viewMode === 'month' ? 'primary' : ''"
            @click="setViewMode('month')"
          >
            月
          </el-button>
        </el-button-group>
        
        <el-button @click="goToToday">
          <el-icon><Calendar /></el-icon>
          今天
        </el-button>
        
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
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
            v-model="filters.status"
            placeholder="状态"
            clearable
            @change="handleFilter"
          >
            <el-option label="待处理" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </div>
        
        <div class="filter-item">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleDateRangeChange"
          />
        </div>
        
        <div class="filter-item">
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- 甘特图主体 -->
    <el-card class="gantt-card" v-loading="loading">
      <div class="gantt-container">
        <!-- 任务列表 -->
        <div class="task-list-panel">
          <div class="task-list-header">
            <div class="header-cell task-name">任务名称</div>
            <div class="header-cell assignee">负责人</div>
            <div class="header-cell duration">工期</div>
            <div class="header-cell progress">进度</div>
          </div>
          
          <div class="task-list-body">
            <div
              v-for="task in filteredTasks"
              :key="task.id"
              class="task-row"
              :class="{ 'task-selected': selectedTask?.id === task.id }"
              @click="selectTask(task)"
            >
              <div class="task-cell task-name">
                <div class="task-info">
                  <span class="task-title">{{ task.title }}</span>
                  <div class="task-meta">
                    <el-tag
                      :type="getPriorityType(task.priority)"
                      size="small"
                      effect="plain"
                    >
                      {{ getPriorityText(task.priority) }}
                    </el-tag>
                    <el-tag
                      :type="getStatusType(task.status)"
                      size="small"
                      effect="plain"
                    >
                      {{ getStatusText(task.status) }}
                    </el-tag>
                  </div>
                </div>
              </div>
              
              <div class="task-cell assignee">
                <div v-if="task.assignee" class="assignee-info">
                  <el-avatar :size="20" :src="task.assignee.avatar">
                    {{ task.assignee.real_name?.charAt(0) }}
                  </el-avatar>
                  <span class="assignee-name">{{ task.assignee.real_name }}</span>
                </div>
                <span v-else class="unassigned">未分配</span>
              </div>
              
              <div class="task-cell duration">
                {{ calculateDuration(task.start_date, task.due_date) }}天
              </div>
              
              <div class="task-cell progress">
                <el-progress
                  :percentage="task.progress || 0"
                  :stroke-width="6"
                  :show-text="false"
                />
                <span class="progress-text">{{ task.progress || 0 }}%</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 时间轴和甘特条 -->
        <div class="gantt-chart-panel">
          <!-- 时间轴头部 -->
          <div class="timeline-header">
            <div class="timeline-scale">
              <div
                v-for="date in timelineData"
                :key="date.key"
                class="timeline-cell"
                :style="{ width: cellWidth + 'px' }"
              >
                <div class="timeline-date">{{ date.label }}</div>
                <div v-if="date.subLabel" class="timeline-sub">{{ date.subLabel }}</div>
              </div>
            </div>
          </div>
          
          <!-- 甘特条区域 -->
          <div class="gantt-bars">
            <div
              v-for="task in filteredTasks"
              :key="task.id"
              class="gantt-row"
              :class="{ 'gantt-selected': selectedTask?.id === task.id }"
            >
              <!-- 今日线 -->
              <div
                class="today-line"
                :style="{ left: todayPosition + 'px' }"
              ></div>
              
              <!-- 任务条 -->
              <div
                v-if="task.start_date && task.due_date"
                class="gantt-bar"
                :class="[
                  `priority-${task.priority}`,
                  `status-${task.status}`,
                  { 'overdue': isOverdue(task.due_date) }
                ]"
                :style="getBarStyle(task)"
                @click="selectTask(task)"
              >
                <div class="bar-content">
                  <div class="bar-progress" :style="{ width: (task.progress || 0) + '%' }"></div>
                  <div class="bar-text">{{ task.title }}</div>
                </div>
                
                <!-- 依赖关系线 -->
                <div
                  v-if="task.dependencies?.length"
                  class="dependency-lines"
                >
                  <!-- TODO: 绘制依赖关系线 -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 任务详情侧边栏 -->
    <el-drawer
      v-model="showTaskDetail"
      title="任务详情"
      size="400px"
      direction="rtl"
    >
      <div v-if="selectedTask" class="task-detail-content">
        <div class="detail-section">
          <h3>基本信息</h3>
          <div class="detail-item">
            <label>任务标题</label>
            <span>{{ selectedTask.title }}</span>
          </div>
          <div class="detail-item">
            <label>状态</label>
            <el-tag :type="getStatusType(selectedTask.status)">
              {{ getStatusText(selectedTask.status) }}
            </el-tag>
          </div>
          <div class="detail-item">
            <label>优先级</label>
            <el-tag :type="getPriorityType(selectedTask.priority)">
              {{ getPriorityText(selectedTask.priority) }}
            </el-tag>
          </div>
          <div class="detail-item">
            <label>负责人</label>
            <div v-if="selectedTask.assignee" class="assignee-detail">
              <el-avatar :size="24" :src="selectedTask.assignee.avatar">
                {{ selectedTask.assignee.real_name?.charAt(0) }}
              </el-avatar>
              <span>{{ selectedTask.assignee.real_name }}</span>
            </div>
            <span v-else class="unassigned">未分配</span>
          </div>
        </div>
        
        <div class="detail-section">
          <h3>时间信息</h3>
          <div class="detail-item">
            <label>开始时间</label>
            <span>{{ formatDate(selectedTask.start_date) }}</span>
          </div>
          <div class="detail-item">
            <label>截止时间</label>
            <span>{{ formatDate(selectedTask.due_date) }}</span>
          </div>
          <div class="detail-item">
            <label>工期</label>
            <span>{{ calculateDuration(selectedTask.start_date, selectedTask.due_date) }}天</span>
          </div>
        </div>
        
        <div class="detail-section">
          <h3>进度信息</h3>
          <div class="detail-item">
            <label>完成进度</label>
            <el-progress :percentage="selectedTask.progress || 0" />
          </div>
          <div class="detail-item">
            <label>预估工时</label>
            <span>{{ selectedTask.estimated_hours || 0 }}小时</span>
          </div>
        </div>
        
        <div class="detail-actions">
          <el-button type="primary" @click="editTask(selectedTask)">
            编辑任务
          </el-button>
          <el-button @click="viewTaskDetail(selectedTask)">
            查看详情
          </el-button>
        </div>
      </div>
    </el-drawer>
    
    <!-- 创建任务对话框 -->
    <TaskCreateDialog
      v-model="showCreateDialog"
      @success="handleCreateSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Calendar,
  Refresh,
  Plus
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useTasksStore } from '@/stores/tasks'
import TaskCreateDialog from '@/components/tasks/TaskCreateDialog.vue'
import type { Task } from '@/types/task'

const router = useRouter()
const tasksStore = useTasksStore()

// 响应式数据
const loading = ref(false)
const showCreateDialog = ref(false)
const showTaskDetail = ref(false)
const selectedTask = ref<Task | null>(null)
const viewMode = ref<'day' | 'week' | 'month'>('week')
const dateRange = ref<[string, string] | null>(null)
const cellWidth = ref(60)

const filters = reactive({
  assignee: '',
  priority: '',
  status: ''
})

// 模拟用户数据
const users = ref([
  { id: '1', real_name: '张三' },
  { id: '2', real_name: '李四' },
  { id: '3', real_name: '王五' }
])

// 计算属性
const filteredTasks = computed(() => {
  let tasks = tasksStore.tasks.filter(task => task.start_date && task.due_date)
  
  if (filters.assignee) {
    tasks = tasks.filter(task => task.assignee?.id === filters.assignee)
  }
  
  if (filters.priority) {
    tasks = tasks.filter(task => task.priority === filters.priority)
  }
  
  if (filters.status) {
    tasks = tasks.filter(task => task.status === filters.status)
  }
  
  if (dateRange.value) {
    const [start, end] = dateRange.value
    tasks = tasks.filter(task => {
      const taskStart = dayjs(task.start_date)
      const taskEnd = dayjs(task.due_date)
      const rangeStart = dayjs(start)
      const rangeEnd = dayjs(end)
      
      return taskStart.isBefore(rangeEnd) && taskEnd.isAfter(rangeStart)
    })
  }
  
  return tasks.sort((a, b) => dayjs(a.start_date).diff(dayjs(b.start_date)))
})

// 时间轴数据
const timelineData = computed(() => {
  const data = []
  const today = dayjs()
  const startDate = today.subtract(30, 'day')
  const endDate = today.add(60, 'day')
  
  let current = startDate
  
  while (current.isBefore(endDate)) {
    if (viewMode.value === 'day') {
      data.push({
        key: current.format('YYYY-MM-DD'),
        label: current.format('MM-DD'),
        subLabel: current.format('ddd'),
        date: current.toDate()
      })
      current = current.add(1, 'day')
    } else if (viewMode.value === 'week') {
      data.push({
        key: current.format('YYYY-WW'),
        label: current.format('MM-DD'),
        subLabel: `第${current.week()}周`,
        date: current.toDate()
      })
      current = current.add(1, 'week')
    } else {
      data.push({
        key: current.format('YYYY-MM'),
        label: current.format('YYYY-MM'),
        subLabel: current.format('MMM'),
        date: current.toDate()
      })
      current = current.add(1, 'month')
    }
  }
  
  return data
})

// 今日位置
const todayPosition = computed(() => {
  const today = dayjs()
  const startDate = dayjs().subtract(30, 'day')
  
  let daysDiff = 0
  if (viewMode.value === 'day') {
    daysDiff = today.diff(startDate, 'day')
  } else if (viewMode.value === 'week') {
    daysDiff = today.diff(startDate, 'week')
  } else {
    daysDiff = today.diff(startDate, 'month')
  }
  
  return daysDiff * cellWidth.value
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

// 计算工期
const calculateDuration = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return 0
  return dayjs(endDate).diff(dayjs(startDate), 'day') + 1
}

// 检查是否逾期
const isOverdue = (dueDate: string) => {
  return dayjs(dueDate).isBefore(dayjs(), 'day')
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD')
}

// 获取甘特条样式
const getBarStyle = (task: Task) => {
  const startDate = dayjs(task.start_date)
  const endDate = dayjs(task.due_date)
  const timelineStart = dayjs().subtract(30, 'day')
  
  let startOffset = 0
  let duration = 0
  
  if (viewMode.value === 'day') {
    startOffset = startDate.diff(timelineStart, 'day')
    duration = endDate.diff(startDate, 'day') + 1
  } else if (viewMode.value === 'week') {
    startOffset = startDate.diff(timelineStart, 'week')
    duration = Math.max(1, endDate.diff(startDate, 'week') + 1)
  } else {
    startOffset = startDate.diff(timelineStart, 'month')
    duration = Math.max(1, endDate.diff(startDate, 'month') + 1)
  }
  
  return {
    left: startOffset * cellWidth.value + 'px',
    width: duration * cellWidth.value - 4 + 'px'
  }
}

// 设置视图模式
const setViewMode = (mode: 'day' | 'week' | 'month') => {
  viewMode.value = mode
  
  // 调整单元格宽度
  if (mode === 'day') {
    cellWidth.value = 40
  } else if (mode === 'week') {
    cellWidth.value = 60
  } else {
    cellWidth.value = 80
  }
}

// 跳转到今天
const goToToday = () => {
  // TODO: 滚动到今天的位置
  ElMessage.success('已跳转到今天')
}

// 选择任务
const selectTask = (task: Task) => {
  selectedTask.value = task
  showTaskDetail.value = true
}

// 编辑任务
const editTask = (task: Task) => {
  router.push(`/tasks/${task.id}/edit`)
}

// 查看任务详情
const viewTaskDetail = (task: Task) => {
  router.push(`/tasks/${task.id}`)
}

// 处理筛选
const handleFilter = () => {
  // 筛选逻辑已在计算属性中处理
}

// 处理日期范围变化
const handleDateRangeChange = () => {
  // 日期范围筛选逻辑已在计算属性中处理
}

// 重置筛选器
const resetFilters = () => {
  Object.assign(filters, {
    assignee: '',
    priority: '',
    status: ''
  })
  dateRange.value = null
}

// 刷新数据
const refreshData = async () => {
  await fetchTasks()
  ElMessage.success('数据已刷新')
}

// 处理创建成功
const handleCreateSuccess = () => {
  showCreateDialog.value = false
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
.gantt-view {
  padding: 20px;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-item {
  min-width: 150px;
}

.filter-item:last-child {
  min-width: auto;
}

.gantt-card {
  flex: 1;
  overflow: hidden;
}

.gantt-container {
  display: flex;
  height: 100%;
}

.task-list-panel {
  width: 400px;
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
}

.task-list-header {
  display: flex;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-cell {
  padding: 12px 8px;
  border-right: 1px solid var(--el-border-color-lighter);
}

.header-cell.task-name {
  flex: 1;
  min-width: 200px;
}

.header-cell.assignee {
  width: 80px;
}

.header-cell.duration {
  width: 60px;
}

.header-cell.progress {
  width: 80px;
}

.task-list-body {
  flex: 1;
  overflow-y: auto;
}

.task-row {
  display: flex;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: background-color 0.2s;
}

.task-row:hover,
.task-row.task-selected {
  background-color: var(--el-color-primary-light-9);
}

.task-cell {
  padding: 12px 8px;
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
}

.task-cell.task-name {
  flex: 1;
  min-width: 200px;
}

.task-cell.assignee {
  width: 80px;
}

.task-cell.duration {
  width: 60px;
  justify-content: center;
}

.task-cell.progress {
  width: 80px;
  flex-direction: column;
  gap: 4px;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-title {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.task-meta {
  display: flex;
  gap: 4px;
}

.assignee-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.assignee-name {
  font-size: 12px;
}

.unassigned {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

.progress-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.gantt-chart-panel {
  flex: 1;
  overflow-x: auto;
  display: flex;
  flex-direction: column;
}

.timeline-header {
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

.timeline-scale {
  display: flex;
}

.timeline-cell {
  border-right: 1px solid var(--el-border-color-lighter);
  padding: 8px 4px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.timeline-date {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.timeline-sub {
  font-size: 10px;
  color: var(--el-text-color-secondary);
}

.gantt-bars {
  flex: 1;
  overflow-y: auto;
}

.gantt-row {
  height: 60px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  position: relative;
  transition: background-color 0.2s;
}

.gantt-row:hover,
.gantt-row.gantt-selected {
  background-color: var(--el-color-primary-light-9);
}

.today-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--el-color-danger);
  z-index: 10;
}

.gantt-bar {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 5;
}

.gantt-bar.priority-low {
  background: var(--el-color-info-light-3);
  border: 1px solid var(--el-color-info);
}

.gantt-bar.priority-medium {
  background: var(--el-color-warning-light-3);
  border: 1px solid var(--el-color-warning);
}

.gantt-bar.priority-high,
.gantt-bar.priority-urgent {
  background: var(--el-color-danger-light-3);
  border: 1px solid var(--el-color-danger);
}

.gantt-bar.status-completed {
  background: var(--el-color-success-light-3);
  border: 1px solid var(--el-color-success);
}

.gantt-bar.overdue {
  background: var(--el-color-danger-light-5);
  border: 2px solid var(--el-color-danger);
}

.gantt-bar:hover {
  transform: translateY(-50%) scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.bar-content {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-radius: 3px;
}

.bar-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.bar-text {
  position: absolute;
  top: 50%;
  left: 8px;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 16px);
}

.task-detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.detail-item label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  min-width: 80px;
}

.assignee-detail {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .gantt-container {
    flex-direction: column;
  }
  
  .task-list-panel {
    width: 100%;
    max-height: 300px;
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-lighter);
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