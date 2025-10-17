<template>
  <div class="task-list-view">
    <div class="page-header">
      <h1 class="page-title">任务管理</h1>
      <div class="header-actions">
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
          <el-input
            v-model="filters.keyword"
            placeholder="搜索任务标题或描述"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
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
            <el-option label="逾期任务" value="overdue" />
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
            v-model="filters.assigned_to"
            placeholder="负责人"
            clearable
            filterable
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
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- 任务列表 -->
    <el-card class="task-table-card">
      <el-table
        v-loading="loading"
        :data="tasksTree"
        row-key="id"
        :tree-props="{ children: 'children' }"
        default-expand-all
        stripe
        @row-click="handleRowClick"
      >
        <el-table-column prop="title" label="任务标题" min-width="260">
          <template #default="{ row }">
            <div class="task-title-cell">
              <span
                class="task-title"
                :style="{ marginLeft: `${(row._depth || 0) * 12}px` }"
                >{{ row._pathDisplay || `[${row.title}]` }}</span>
              <div class="task-tags">
                <el-tag :type="getTypeColor(row.category)" size="small">
                  {{ getTypeText(row.category) }}
                </el-tag>
                <el-tag
                  v-for="tg in (row.tags || [])"
                  :key="tg"
                  size="small"
                  class="tag-chip"
                >{{ tg }}</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 内容列：完整显示任务描述，支持换行与自适应行高 -->
        <el-table-column prop="description" label="内容" min-width="300">
          <template #default="{ row }">
            <div class="content-cell">
              <span v-if="row.description && row.description.trim()">{{ row.description }}</span>
              <span v-else class="text-placeholder">无</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <!-- 移除优先级列以腾出空间显示完整内容 -->
        
        <el-table-column prop="assignee" label="负责人" width="120">
          <template #default="{ row }">
            <div v-if="row.assignee" class="assignee-cell">
              <el-avatar :size="24" :src="row.assignee.avatar">
                {{ row.assignee.real_name?.charAt(0) }}
              </el-avatar>
              <span class="assignee-name">{{ row.assignee.real_name }}</span>
            </div>
            <span v-else class="text-placeholder">未分配</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="due_date" label="截止日期" width="120">
          <template #default="{ row }">
            <span v-if="row.due_date" :class="getDueDateClass(row.due_date)">
              {{ formatDate(row.due_date) }}
            </span>
            <span v-else class="text-placeholder">无</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="创建时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="canEdit(row)"
              type="primary"
              size="small"
              text
              @click.stop="editTask(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canDelete(row)"
              type="danger"
              size="small"
              text
              @click.stop="deleteTask(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 创建任务对话框 -->
    <TaskCreateDialog
      v-model="showCreateDialog"
      @success="handleCreateSuccess"
    />
    
    <!-- 编辑任务对话框 -->
    <TaskEditDialog
      v-model="showEditDialog"
      :task="currentTask"
      @success="handleEditSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useTasksStore } from '@/stores/tasks'
import TaskCreateDialog from '@/components/tasks/TaskCreateDialog.vue'
import TaskEditDialog from '@/components/tasks/TaskEditDialog.vue'
import type { Task } from '@/types/task'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const tasksStore = useTasksStore()
const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const currentTask = ref<Task | null>(null)

const filters = reactive({
  keyword: '',
  status: '',
  priority: '',
  assigned_to: ''
})

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 模拟用户数据
const users = ref([
  { id: '1', real_name: '张三' },
  { id: '2', real_name: '李四' },
  { id: '3', real_name: '王五' }
])

// 计算属性
const tasks = computed(() => {
   const all = tasksStore.tasks
   const u = authStore.user
 
   // 非经理（含普通用户）：仅展示与自己相关的任务（创建者或负责人）
   if (!authStore.isManager) {
     return all.filter(t => {
       const creatorId = (t as any).creator_id ?? (t as any).created_by ?? (t as any).creator?.id
       const assigneeId = (t as any).assignee_id ?? (t as any).assigned_to ?? (t as any).assignee?.id
       return String(creatorId) === String(u?.id) || String(assigneeId) === String(u?.id)
     })
   }
 
   return all
 })

// 构建树状数据（根据 parent_id 组织 children）
const tasksTree = computed(() => {
  const list = tasks.value.map(t => ({ ...t })) as any[]
  const map: Record<string, any> = {}
  list.forEach(item => { map[String(item.id)] = item })
  const roots: any[] = []
  list.forEach(item => {
    const pid = (item as any).parent_id
    if (pid && map[String(pid)]) {
      const parent = map[String(pid)]
      parent.children = parent.children || []
      parent.children.push(item)
    } else {
      roots.push(item)
    }
  })
  // 注入层级深度与路径显示
  const seen = new Set<string>()
  const dfs = (node: any, pathTitles: string[]) => {
    const id = String(node.id)
    if (seen.has(id)) return
    seen.add(id)
    const titles = [...pathTitles, String(node.title || '#'+id)]
    node._depth = pathTitles.length
    node._pathDisplay = titles.map(t => `[${t}]`).join('-')
    if (Array.isArray(node.children)) {
      node.children.forEach((child: any) => dfs(child, titles))
    }
  }
  roots.forEach(r => dfs(r, []))
  return roots
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

// 获取任务类型颜色
const getTypeColor = (category: string) => {
  const colorMap: Record<string, string> = {
    '生产协调': 'success',
    '项目管理': 'primary',
    '综合工作': 'info',
    'production_coordination': 'success',
    'project_management': 'primary',
    'general_work': 'info'
  }
  return colorMap[category] || 'info'
}

// 获取任务类型文本
const getTypeText = (category: string) => {
  const textMap: Record<string, string> = {
    '生产协调': '生产协调',
    '项目管理': '项目管理',
    '综合工作': '综合工作',
    'production_coordination': '生产协调',
    'project_management': '项目管理',
    'general_work': '综合工作'
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

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD')
}

// 处理搜索
const handleSearch = () => {
  tasksStore.setFilter({ keyword: filters.keyword })
  fetchTasks()
}

// 处理筛选
const handleFilter = () => {
  tasksStore.setFilter({
    status: filters.status,
    priority: filters.priority,
    assigned_to: filters.assigned_to
  })
  fetchTasks()
}

// 重置筛选器
const resetFilters = () => {
  Object.assign(filters, {
    keyword: '',
    status: '',
    priority: '',
    assigned_to: ''
  })
  tasksStore.clearFilter()
  fetchTasks()
}

// 处理行点击
const handleRowClick = (row: Task) => {
  router.push(`/tasks/${row.id}`)
}

// 编辑任务
const editTask = (task: Task) => {
  currentTask.value = task
  showEditDialog.value = true
}

// 删除任务
const deleteTask = async (task: Task) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务「${task.title}」吗？`,
      '确认删除',
      {
        type: 'warning'
      }
    )
    
    await tasksStore.deleteTask(task.id)
    ElMessage.success('删除成功')
    fetchTasks()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 处理页面大小变化
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.page = 1
  fetchTasks()
}

// 处理当前页变化
const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchTasks()
}

// 处理创建成功
const handleCreateSuccess = () => {
  showCreateDialog.value = false
  // 清空过滤条件以确保新任务能显示
  Object.assign(filters, {
    keyword: '',
    status: '',
    priority: '',
    assigned_to: ''
  })
  tasksStore.clearFilter()
  fetchTasks()
}

// 处理编辑成功
const handleEditSuccess = () => {
  showEditDialog.value = false
  currentTask.value = null
  fetchTasks()
}

// 获取任务列表
const fetchTasks = async () => {
  loading.value = true
  console.log('开始获取任务列表...', {
    page: pagination.page,
    size: pagination.size,
    filters: filters
  })
  
  try {
    await tasksStore.fetchTasks({
      page: pagination.page,
      limit: pagination.size
    })
    pagination.total = tasksStore.pagination.total
    console.log('任务列表获取成功:', {
      taskCount: tasksStore.tasks.length,
      total: pagination.total
    })
  } catch (error) {
    console.error('获取任务列表失败:', error)
    console.error('错误详情:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })
    ElMessage.error(`获取任务列表失败: ${error.response?.data?.error || error.message}`)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 处理URL查询参数
  const query = route.query
  if (query.status) {
    filters.status = query.status as string
  }
  if (query.overdue === 'true') {
    // 对于逾期任务，可以通过添加特殊标识来处理
    // 这里暂时设置一个特殊状态，后续可以在fetchTasks中处理
    filters.status = 'overdue'
  }
  
  // 应用筛选条件
  if (filters.status || filters.priority || filters.assigned_to) {
    tasksStore.setFilter({
      status: filters.status === 'overdue' ? '' : filters.status,
      priority: filters.priority,
      assigned_to: filters.assigned_to
    })
  }
  
  fetchTasks()
})

// 根据用户角色和任务所有权判断是否可编辑
const canEdit = (t: Task) => {
  const u = authStore.user;
  if (!t || !u) return false;

  if (authStore.isAdmin || authStore.isSuperAdmin || authStore.isManager) {
    return true;
  }

  const assigneeId = (t as any).assignee_id ?? (t as any).assigned_to ?? (t as any).assignee?.id;
  return String(u.id) === String(assigneeId);
};

// 根据用户角色和任务所有权判断是否可删除
const canDelete = (t: Task) => {
  const u = authStore.user;
  if (!t || !u) return false;

  if (authStore.isAdmin || authStore.isSuperAdmin) {
    return true;
  }

  const creatorId = (t as any).creator_id ?? (t as any).created_by ?? (t as any).creator?.id;
  return String(u.id) === String(creatorId);
};
</script>

<style scoped>
.task-list-view {
  padding: 20px;
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
  min-width: 200px;
}

.filter-item:last-child {
  min-width: auto;
}

.task-table-card {
  min-height: 600px;
}

.task-title-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-title {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.task-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag-chip {
  margin-left: 4px;
}

.assignee-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assignee-name {
  font-size: 14px;
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

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.content-cell {
  white-space: normal;
  word-break: break-word;
  line-height: 1.6;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: var(--el-table-row-hover-bg-color);
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-item {
    min-width: auto;
  }
}
</style>