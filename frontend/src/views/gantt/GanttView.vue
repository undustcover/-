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
            日视图
          </el-button>
          <el-button
            :type="viewMode === 'week' ? 'primary' : ''"
            @click="setViewMode('week')"
          >
            周视图
          </el-button>
          <el-button
            :type="viewMode === 'month' ? 'primary' : ''"
            @click="setViewMode('month')"
          >
            月视图
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
        
        <el-dropdown @command="handleExport">
          <el-button>
            <el-icon><Download /></el-icon>
            导出
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="png">
                <el-icon><Picture /></el-icon>
                导出为图片
              </el-dropdown-item>
              <el-dropdown-item command="pdf">
                <el-icon><Document /></el-icon>
                导出为PDF
              </el-dropdown-item>
              <el-dropdown-item command="excel">
                <el-icon><Grid /></el-icon>
                导出为Excel
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <!-- 筛选器 -->
    <el-card class="filter-card">
      <div class="filter-row">
        <div class="filter-item">
          <label>项目筛选：</label>
          <el-select
            v-model="filters.project_id"
            placeholder="选择项目"
            clearable
            @change="loadGanttData"
          >
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
        </div>
        
        <div class="filter-item">
          <label>时间范围：</label>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="loadGanttData"
          />
        </div>
        
        <div class="filter-item">
          <label>负责人：</label>
          <el-select
            v-model="filters.assignee"
            placeholder="选择负责人"
            clearable
            @change="loadGanttData"
          >
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </div>
      </div>
    </el-card>
    
    <!-- 甘特图容器 -->
    <div class="gantt-container">
      <div ref="ganttContainer" class="gantt-chart"></div>
    </div>
    
    <!-- 任务创建对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="新建任务"
      width="600px"
      @close="resetCreateForm"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="100px"
      >
        <el-form-item label="任务标题" prop="title">
          <el-input v-model="createForm.title" placeholder="请输入任务标题" />
        </el-form-item>
        
        <el-form-item label="任务描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
          />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="start_date">
              <el-date-picker
                v-model="createForm.start_date"
                type="date"
                placeholder="选择开始时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="end_date">
              <el-date-picker
                v-model="createForm.end_date"
                type="date"
                placeholder="选择结束时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="createForm.priority" style="width: 100%">
                <el-option label="低" value="low" />
                <el-option label="中" value="medium" />
                <el-option label="高" value="high" />
                <el-option label="紧急" value="urgent" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人" prop="assigned_to">
              <el-select v-model="createForm.assigned_to" style="width: 100%">
                <el-option
                  v-for="user in users"
                  :key="user.id"
                  :label="user.username"
                  :value="user.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createTask" :loading="creating">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, Refresh, Plus, Download, ArrowDown, Picture, Document, Grid } from '@element-plus/icons-vue'
import { gantt } from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'
import api from '@/api'
import * as XLSX from 'xlsx'
import { useTasksStore } from '@/stores/tasks'

// 响应式数据
const ganttContainer = ref(null)
const showCreateDialog = ref(false)
const creating = ref(false)
const viewMode = ref('week')
const dateRange = ref([])
const projects = ref([])
const users = ref([])

// Store
const tasksStore = useTasksStore()

// 筛选器
const filters = reactive({
  project_id: null,
  assignee: null
})

// 创建表单
const createForm = reactive({
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  priority: 'medium',
  assigned_to: null
})

const createFormRef = ref(null)

// 表单验证规则
const createRules = {
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' }
  ],
  start_date: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  end_date: [
    { required: true, message: '请选择结束时间', trigger: 'change' }
  ]
}

// 初始化甘特图
const initGantt = () => {
  // 清除之前的配置和事件监听器
  gantt.clearAll()
  gantt.detachAllEvents()
  
  // 配置甘特图
  gantt.config.date_format = '%Y-%m-%d %H:%i:%s'
  gantt.config.xml_date = '%Y-%m-%d %H:%i:%s'
  gantt.config.scale_unit = 'day'
  gantt.config.date_scale = '%m/%d'
  gantt.config.subscales = [
    { unit: 'hour', step: 1, date: '%H' }
  ]
  gantt.config.duration_unit = 'day'
  gantt.config.duration_step = 1
  
  // 启用拖拽和调整大小
  gantt.config.drag_timeline = {
    useKey: false,
    ignore: '.gantt_task_line, .gantt_task_link'
  }
  gantt.config.drag_resize = true
  gantt.config.drag_progress = true
  gantt.config.drag_links = true
  
  // 启用依赖关系
  gantt.config.show_links = true
  
  // 自定义列
  gantt.config.columns = [
    { name: 'text', label: '任务名称', width: 200, tree: true },
    { name: 'assignee_name', label: '负责人', width: 100, align: 'center' },
    { name: 'priority', label: '优先级', width: 80, align: 'center' },
    { name: 'progress', label: '进度', width: 80, align: 'center' },
    { name: 'start_date', label: '开始时间', width: 100, align: 'center' },
    { name: 'duration', label: '工期', width: 60, align: 'center' }
  ]
  
  // 自定义任务条颜色
  gantt.templates.task_class = (start, end, task) => {
    switch(task.priority) {
      case 'urgent': return 'gantt-urgent'
      case 'high': return 'gantt-high'
      case 'medium': return 'gantt-medium'
      case 'low': return 'gantt-low'
      default: return 'gantt-medium'
    }
  }
  
  // 自定义进度显示
  gantt.templates.progress_text = (start, end, task) => {
    return Math.round(task.progress * 100) + '%'
  }
  
  // 事件监听
  gantt.attachEvent('onAfterTaskDrag', (id, mode, e) => {
    const task = gantt.getTask(id)
    updateTaskDates(task)
  })
  
  gantt.attachEvent('onAfterProgressDrag', (id, progress) => {
    const task = gantt.getTask(id)
    task.progress = progress
    updateTaskProgress(task)
  })
  
  gantt.attachEvent('onAfterLinkAdd', (id, link) => {
    createTaskDependency(link)
  })
  
  gantt.attachEvent('onAfterLinkDelete', (id, link) => {
    deleteTaskDependency(link.id)
  })
  
  // 初始化甘特图
  gantt.init(ganttContainer.value)
}

// 设置视图模式
const setViewMode = (mode) => {
  viewMode.value = mode
  
  switch(mode) {
    case 'day':
      gantt.config.scale_unit = 'day'
      gantt.config.date_scale = '%m/%d'
      gantt.config.subscales = [
        { unit: 'hour', step: 6, date: '%H:00' }
      ]
      break
    case 'week':
      gantt.config.scale_unit = 'week'
      gantt.config.date_scale = '第%W周'
      gantt.config.subscales = [
        { unit: 'day', step: 1, date: '%d' }
      ]
      break
    case 'month':
      gantt.config.scale_unit = 'month'
      gantt.config.date_scale = '%Y年%m月'
      gantt.config.subscales = [
        { unit: 'week', step: 1, date: '第%W周' }
      ]
      break
  }
  
  gantt.render()
}

// 跳转到今天
const goToToday = () => {
  gantt.showDate(new Date())
}

// 刷新数据
const refreshData = () => {
  loadGanttData()
}

// 加载甘特图数据
const loadGanttData = async () => {
  try {
    const params = {}
    
    if (filters.project_id) {
      params.project_id = filters.project_id
    }
    
    if (dateRange.value && dateRange.value.length === 2) {
      params.due_date_start = dateRange.value[0].toISOString().split('T')[0]
      params.due_date_end = dateRange.value[1].toISOString().split('T')[0]
    }
    
    await tasksStore.fetchTasks(params)
    const tasks = tasksStore.tasks
    
    if (tasks && tasks.length >= 0) {
      // 暂时没有依赖关系数据，使用空数组
      const dependencies = []
      
      // 转换任务数据格式
      const ganttTasks = tasks.map(task => ({
        id: task.id,
        text: task.title,
        start_date: task.start_date,
        end_date: task.end_date,
        duration: calculateDuration(task.start_date, task.end_date),
        progress: task.progress / 100,
        priority: task.priority,
        status: task.status,
        assignee_name: task.assignee_name || '未分配',
        parent: task.parent_task_id || 0
      }))
      
      // 转换依赖关系数据格式
      const ganttLinks = dependencies.map(dep => ({
        id: dep.id,
        source: dep.predecessor_task_id,
        target: dep.successor_task_id,
        type: convertDependencyType(dep.dependency_type)
      }))
      
      // 清空并加载数据
      gantt.clearAll()
      gantt.parse({
        data: ganttTasks,
        links: ganttLinks
      })
    }
  } catch (error) {
    console.error('加载甘特图数据失败:', error)
    ElMessage.error('加载甘特图数据失败')
  }
}

// 计算工期
const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 1
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays || 1
}

// 转换依赖关系类型
const convertDependencyType = (type) => {
  const typeMap = {
    'finish_to_start': '0',
    'start_to_start': '1',
    'finish_to_finish': '2',
    'start_to_finish': '3'
  }
  return typeMap[type] || '0'
}

// 更新任务时间
const updateTaskDates = async (task) => {
  try {
    const updates = [{
      id: task.id,
      start_date: gantt.date.date_to_str('%Y-%m-%d')(task.start_date),
      end_date: gantt.date.date_to_str('%Y-%m-%d')(task.end_date)
    }]
    
    await tasksStore.updateTask(task.id, {
      start_date: gantt.date.date_to_str('%Y-%m-%d')(task.start_date),
      end_date: gantt.date.date_to_str('%Y-%m-%d')(task.end_date)
    })
    ElMessage.success('任务时间更新成功')
  } catch (error) {
    console.error('更新任务时间失败:', error)
    ElMessage.error('更新任务时间失败')
    loadGanttData() // 重新加载数据
  }
}

// 更新任务进度
const updateTaskProgress = async (task) => {
  try {
    const updates = [{
      id: task.id,
      progress: Math.round(task.progress * 100)
    }]
    
    await tasksStore.updateTask(task.id, {
      progress: Math.round(task.progress * 100)
    })
    ElMessage.success('任务进度更新成功')
  } catch (error) {
    console.error('更新任务进度失败:', error)
    ElMessage.error('更新任务进度失败')
    loadGanttData() // 重新加载数据
  }
}

// 创建任务依赖关系
const createTaskDependency = async (link) => {
  try {
    // 注意：这里需要根据实际的任务依赖 API 调整
    // 暂时使用 tasks API，实际应该有专门的依赖关系 API
    await api.tasks.createTask({
      predecessor_task_id: link.source,
      successor_task_id: link.target,
      dependency_type: 'finish_to_start'
    })
    ElMessage.success('依赖关系创建成功')
  } catch (error) {
    console.error('创建依赖关系失败:', error)
    ElMessage.error('创建依赖关系失败')
    gantt.deleteLink(link.id) // 删除无效的连线
  }
}

// 删除任务依赖关系
const deleteTaskDependency = async (linkId) => {
  try {
    // 注意：这里需要根据实际的任务依赖 API 调整
    await api.tasks.deleteTask(linkId)
    ElMessage.success('依赖关系删除成功')
  } catch (error) {
    console.error('删除依赖关系失败:', error)
    ElMessage.error('删除依赖关系失败')
  }
}

// 创建任务
const createTask = async () => {
  if (!createFormRef.value) return
  
  try {
    await createFormRef.value.validate()
    creating.value = true
    
    const taskData = {
      ...createForm,
      start_date: createForm.start_date.toISOString().split('T')[0],
      end_date: createForm.end_date.toISOString().split('T')[0]
    }
    
    await tasksStore.createTask(taskData)
    
    ElMessage.success('任务创建成功')
    showCreateDialog.value = false
    resetCreateForm()
    loadGanttData()
  } catch (error) {
    console.error('创建任务失败:', error)
    ElMessage.error('创建任务失败')
  } finally {
    creating.value = false
  }
}

// 重置创建表单
const resetCreateForm = () => {
  Object.assign(createForm, {
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    priority: 'medium',
    assigned_to: null
  })
  
  if (createFormRef.value) {
    createFormRef.value.clearValidate()
  }
}

// 加载用户列表
const loadUsers = async () => {
  try {
    const response = await api.users.getUsers()
    
    if (response.data && response.data.success) {
      users.value = response.data.data || []
    } else if (response.data) {
      // 如果直接返回用户数组
      users.value = Array.isArray(response.data) ? response.data : []
    } else {
      users.value = []
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败')
    users.value = []
  }
}

// 加载项目列表
const loadProjects = async () => {
  try {
    // 这里需要根据实际的项目API调整
    // const response = await api.get('/projects')
    // if (response.data.success) {
    //   projects.value = response.data.data
    // }
    
    // 临时模拟数据
    projects.value = [
      { id: 1, name: '项目A' },
      { id: 2, name: '项目B' },
      { id: 3, name: '项目C' }
    ]
  } catch (error) {
    console.error('加载项目列表失败:', error)
  }
}

// 处理导出
const handleExport = async (command) => {
  try {
    switch (command) {
      case 'png':
        await exportToPNG()
        break
      case 'pdf':
        await exportToPDF()
        break
      case 'excel':
        await exportToExcel()
        break
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

// 导出为PNG图片
const exportToPNG = () => {
  return new Promise((resolve, reject) => {
    try {
      gantt.exportToPNG({
        name: `甘特图_${new Date().toISOString().split('T')[0]}.png`,
        header: '<div style="text-align: center; font-size: 18px; font-weight: bold; padding: 10px;">项目甘特图</div>',
        footer: '<div style="text-align: center; font-size: 12px; color: #666; padding: 5px;">导出时间: ' + new Date().toLocaleString() + '</div>',
        callback: function(result) {
          if (result.url) {
            // 创建下载链接
            const link = document.createElement('a')
            link.href = result.url
            link.download = `甘特图_${new Date().toISOString().split('T')[0]}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            ElMessage.success('图片导出成功')
            resolve()
          } else {
            reject(new Error('导出失败'))
          }
        }
      })
    } catch (error) {
      reject(error)
    }
  })
}

// 导出为PDF
const exportToPDF = () => {
  return new Promise((resolve, reject) => {
    try {
      gantt.exportToPDF({
        name: `甘特图_${new Date().toISOString().split('T')[0]}.pdf`,
        header: '<div style="text-align: center; font-size: 18px; font-weight: bold; padding: 10px;">项目甘特图</div>',
        footer: '<div style="text-align: center; font-size: 12px; color: #666; padding: 5px;">导出时间: ' + new Date().toLocaleString() + '</div>',
        format: 'A4',
        orientation: 'landscape',
        callback: function(result) {
          if (result.url) {
            // 创建下载链接
            const link = document.createElement('a')
            link.href = result.url
            link.download = `甘特图_${new Date().toISOString().split('T')[0]}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            ElMessage.success('PDF导出成功')
            resolve()
          } else {
            reject(new Error('导出失败'))
          }
        }
      })
    } catch (error) {
      reject(error)
    }
  })
}

// 导出为Excel
const exportToExcel = () => {
  try {
    const tasks = gantt.serialize().data
    
    // 准备Excel数据
    const excelData = tasks.map(task => ({
      '任务ID': task.id,
      '任务名称': task.text,
      '负责人': task.assignee_name || '未分配',
      '优先级': task.priority,
      '开始时间': gantt.date.date_to_str('%Y-%m-%d')(task.start_date),
      '结束时间': gantt.date.date_to_str('%Y-%m-%d')(task.end_date),
      '工期(天)': task.duration,
      '进度(%)': Math.round(task.progress * 100),
      '状态': task.status
    }))
    
    // 创建工作簿
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    
    // 设置列宽
    const colWidths = [
      { wch: 10 }, // 任务ID
      { wch: 30 }, // 任务名称
      { wch: 15 }, // 负责人
      { wch: 10 }, // 优先级
      { wch: 15 }, // 开始时间
      { wch: 15 }, // 结束时间
      { wch: 12 }, // 工期
      { wch: 12 }, // 进度
      { wch: 10 }  // 状态
    ]
    ws['!cols'] = colWidths
    
    // 添加工作表
    XLSX.utils.book_append_sheet(wb, ws, '甘特图数据')
    
    // 导出文件
    const fileName = `甘特图数据_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
    
    ElMessage.success('Excel导出成功')
  } catch (error) {
    console.error('Excel导出失败:', error)
    ElMessage.error('Excel导出失败')
  }
}

// 生命周期
onMounted(async () => {
  await nextTick()
  initGantt()
  await Promise.all([
    loadUsers(),
    loadProjects(),
    loadGanttData()
  ])
})

onUnmounted(() => {
  if (gantt) {
    gantt.clearAll()
    gantt.detachAllEvents()
    gantt.destructor()
  }
})
</script>

<style scoped>
.gantt-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-card {
  margin: 16px 24px;
}

.filter-row {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item label {
  font-weight: 500;
  color: #606266;
  white-space: nowrap;
}

.gantt-container {
  flex: 1;
  margin: 0 24px 24px;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.gantt-chart {
  height: 100%;
  width: 100%;
}
</style>

<style>
/* 甘特图自定义样式 */
.gantt-urgent .gantt_task_progress {
  background: #f56565 !important;
}

.gantt-high .gantt_task_progress {
  background: #ed8936 !important;
}

.gantt-medium .gantt_task_progress {
  background: #4299e1 !important;
}

.gantt-low .gantt_task_progress {
  background: #48bb78 !important;
}

.gantt_task_line.gantt-urgent {
  border-color: #f56565;
  background: rgba(245, 101, 101, 0.1);
}

.gantt_task_line.gantt-high {
  border-color: #ed8936;
  background: rgba(237, 137, 54, 0.1);
}

.gantt_task_line.gantt-medium {
  border-color: #4299e1;
  background: rgba(66, 153, 225, 0.1);
}

.gantt_task_line.gantt-low {
  border-color: #48bb78;
  background: rgba(72, 187, 120, 0.1);
}

/* 甘特图容器样式调整 */
.gantt_container {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

.gantt_grid_scale .gantt_grid_head_cell,
.gantt_task_scale .gantt_scale_cell {
  font-weight: 500;
  color: #303133;
}

.gantt_task_cell,
.gantt_cell {
  border-color: #ebeef5;
}

.gantt_grid_data .gantt_row:nth-child(odd) {
  background: #fafafa;
}

.gantt_grid_data .gantt_row:hover {
  background: #f5f7fa;
}
</style>