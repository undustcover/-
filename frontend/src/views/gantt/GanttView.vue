<template>
  <div class="gantt-view">
    <div class="page-header">
      <div class="title-section">
        <h1 class="page-title">甘特图</h1>
        <p class="page-subtitle">只读模式 - 任务编辑请前往任务管理模块</p>
      </div>
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
        
        <!-- 新建任务功能已移除，任务编辑请在任务管理模块进行 -->
        
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
          <label>项目类别：</label>
          <el-select
            v-model="filters.category"
            placeholder="选择项目类别"
            clearable
            @change="loadGanttData"
          >
            <el-option label="全部" value="" />
            <el-option label="生产协调" value="生产协调" />
            <el-option label="项目管理" value="项目管理" />
            <el-option label="综合工作" value="综合工作" />
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
              :label="user.real_name"
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
    
    <!-- 任务创建功能已移除，任务编辑请在任务管理模块进行 -->
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, Refresh, Download, ArrowDown, Picture, Document, Grid } from '@element-plus/icons-vue'
import { gantt } from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'
import api from '@/api'
import { taskApi } from '@/api/tasks'
import * as XLSX from 'xlsx'
import { useTasksStore } from '@/stores/tasks'
import { useAuthStore } from '@/stores/auth'

// 响应式数据
const ganttContainer = ref(null)
const viewMode = ref('week')
const dateRange = ref([])
const projects = ref([])
const users = ref([])
const ganttEventIds = []

// Store
const tasksStore = useTasksStore()
const authStore = useAuthStore()

// 筛选器
const filters = reactive({
  category: null,
  assignee: null
})

// 创建表单功能已移除，任务编辑请在任务管理模块进行

// 基于任务数据设置时间轴显示范围，确保横向滑块覆盖完整时间轴
const setTimelineRangeToTasks = (ganttTasks) => {
  if (!Array.isArray(ganttTasks) || ganttTasks.length === 0) return
  let minStart = null
  let maxEnd = null
  for (const t of ganttTasks) {
    const s = new Date(t.start_date)
    const e = new Date(t.end_date)
    if (!minStart || s < minStart) minStart = s
    if (!maxEnd || e > maxEnd) maxEnd = e
  }
  if (minStart && maxEnd) {
    const padding = 3
    const start = new Date(minStart)
    start.setDate(start.getDate() - padding)
    const end = new Date(maxEnd)
    end.setDate(end.getDate() + padding)
    gantt.config.start_date = start
    gantt.config.end_date = end
  }
}

// 从store中的原始任务估算时间轴范围（用于切换视图时）
const setTimelineRangeFromStore = () => {
  const src = tasksStore?.tasks || []
  if (!Array.isArray(src) || src.length === 0) return
  const mapped = src.map(task => {
    let startDate = task.start_date || task.created_at
    if (startDate) {
      startDate = startDate.split(' ')[0]
    } else {
      startDate = new Date().toISOString().split('T')[0]
    }
    let endDate = task.due_date || task.end_date
    if (endDate) {
      endDate = endDate.split(' ')[0]
    } else {
      const d = new Date(startDate)
      d.setDate(d.getDate() + (task.estimated_hours ? Math.ceil(task.estimated_hours / 8) : 7))
      endDate = d.toISOString().split('T')[0]
    }
    return { start_date: startDate, end_date: endDate }
  })
  setTimelineRangeToTasks(mapped)
}

// 初始化甘特图
const initGantt = () => {
  // 清除之前的配置和事件监听器（仅在已初始化时）
  try {
    if (gantt.getTaskByTime) { // Check if gantt is initialized
      gantt.clearAll()
      gantt.detachAllEvents()
    }
  } catch (e) {
    // 忽略清理错误，继续初始化
  }

  // 基础配置
  gantt.config.date_format = '%Y-%m-%d %H:%i:%s'
  gantt.config.xml_date = '%Y-%m-%d %H:%i:%s'
  gantt.config.duration_unit = 'day'
  gantt.config.duration_step = 1
  
  // 显示配置
  gantt.config.show_grid = true
  gantt.config.show_chart = true
  gantt.config.show_links = true
  gantt.config.show_task_cells = true
  gantt.config.static_background = true
  
  // 禁用所有编辑功能，只保留查看功能
  gantt.config.drag_timeline = {
    useKey: false,
    ignore: '.gantt_task_line, .gantt_task_link'
  }
  gantt.config.drag_resize = false
  gantt.config.drag_progress = false
  gantt.config.drag_links = false
  gantt.config.readonly = true
  
  // 基本尺寸配置 - 精确对齐网格与时间轴
  gantt.config.scale_height = 60 // 时间轴表头总高度（两行表头）
  gantt.config.row_height = 50 // 内容行高
  gantt.config.task_height = 45 // 任务条高度
  gantt.config.bar_height = 38 // 任务条内部高度
  
  // 网格表头高度配置 - 与时间轴表头完全对齐
  gantt.config.grid_header_height = 60 // 网格表头高度与时间轴表头总高度完全对齐
  
  // 基本布局配置
  gantt.config.autosize = true // 启用自动调整大小
  gantt.config.autofit = false
  gantt.config.fit_tasks = false
  gantt.config.scroll_on_load = true
  gantt.config.preserve_scroll = true
  
  // 优化网格列配置 - 确保内容完整显示
  gantt.config.columns = [
    { name: "text", label: "任务名称", width: 160, tree: true, resize: true },
    { name: "assignee_name", label: "负责人", align: "center", width: 70, resize: true },
    { name: "duration", label: "工期", align: "center", width: 60, resize: true },
    { name: "progress", label: "进度", align: "center", width: 55, resize: true, template: function(task) {
      return Math.round(task.progress * 100) + '%';
    }},
    { name: "start_date", label: "开始", align: "center", width: 75, resize: true, template: function(task) {
      return gantt.date.date_to_str('%m/%d')(task.start_date);
    }},
    { name: "end_date", label: "结束", align: "center", width: 75, resize: true, template: function(task) {
      return gantt.date.date_to_str('%m/%d')(task.end_date);
    }}
  ]
  
  // 调整网格宽度以适应新的列配置
  gantt.config.grid_width = 495 // 网格总宽度
  gantt.config.min_column_width = 40 // 最小列宽
  gantt.config.grid_resize = true // 启用列宽调整
  
  // 确保网格与时间轴对齐的关键配置
  gantt.config.grid_elastic_columns = false // 禁用弹性列宽
  gantt.config.keep_grid_width = true // 保持网格宽度固定
  
  // 任务条垂直对齐配置
  gantt.config.task_attribute = "" // 清除任务属性
  gantt.config.bar_height_padding = 4 // 任务条内边距
  gantt.config.autofit = false
  gantt.config.fit_tasks = false
  gantt.config.scroll_on_load = true
  gantt.config.preserve_scroll = true
  
  // 基本时间轴配置
  gantt.config.scale_unit = 'day'
  gantt.config.date_scale = '%m/%d'
  gantt.config.subscales = [
    { unit: 'hour', step: 8, date: '%H:00' }
  ]
  gantt.config.step = 1
  gantt.config.date_grid = '%Y-%m-%d'
  
  // 使用默认布局
  gantt.config.layout = {
    css: "gantt_container",
    rows: [
      {
        cols: [
          { 
            view: "grid", 
            group: "grids", 
            scrollX: "scrollHor", 
            scrollY: "scrollVer" 
          },
          { resizer: true, width: 1 },
          { 
            view: "timeline", 
            scrollX: "scrollHor", 
            scrollY: "scrollVer" 
          },
          { 
            view: "scrollbar", 
            id: "scrollVer", 
            group: "vertical" 
          }
        ]
      },
      { 
        view: "scrollbar", 
        id: "scrollHor" 
      }
    ]
  }
  
  // 基本任务条颜色
  gantt.templates.task_class = (start, end, task) => {
    switch(task.priority) {
      case 'urgent': return 'gantt-urgent'
      case 'high': return 'gantt-high'
      case 'medium': return 'gantt-medium'
      case 'low': return 'gantt-low'
      default: return 'gantt-medium'
    }
  }
  
  // 基本进度显示
  gantt.templates.progress_text = (start, end, task) => {
    return Math.round(task.progress * 100) + '%'
  }
  
  // 基本任务条文本显示
  gantt.templates.task_text = (start, end, task) => {
    return task.text
  }
  
  // 初始化甘特图
  gantt.init(ganttContainer.value)
  
  // 强制刷新甘特图尺寸
  setTimeout(() => {
    gantt.setSizes()
    gantt.render()
  }, 100)
}

// 设置视图模式
const setViewMode = (mode) => {
  viewMode.value = mode
  
  switch(mode) {
    case 'day':
      gantt.config.scale_unit = 'day'
      gantt.config.date_scale = '%Y年%m月%d日'
      gantt.config.subscales = [
        { unit: 'hour', step: 6, date: '%H:00' }
      ]
      break
    case 'week':
      gantt.config.scale_unit = 'week'
      gantt.config.date_scale = '%Y年第%W周'
      gantt.config.subscales = [
        { unit: 'day', step: 1, date: '%m/%d' }
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
  // 依据任务数据重设时间轴范围，保证横向滑块覆盖完整区间
  setTimelineRangeFromStore()
  
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
    
    if (filters.category) {
      params.category = filters.category
    }
    
    if (filters.assignee) {
      params.assignee_id = filters.assignee
    }
    
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0].toISOString().split('T')[0]
      params.end_date = dateRange.value[1].toISOString().split('T')[0]
    }
    
    // 调用甘特图专用API
    console.log('发送甘特图API请求，参数:', params)
    const response = await taskApi.getGanttData(params)
    console.log('甘特图API响应:', response)
    console.log('响应状态:', response.status)
    console.log('响应数据:', response.data)
    console.log('响应数据类型:', typeof response.data)
    
    // 根据后端API响应结构解析数据
    let tasks = []
    let dependencies = []
    
    if (response.data && response.data.success) {
      tasks = response.data.data?.tasks || []
      dependencies = response.data.data?.dependencies || []
    } else {
      console.error('API响应格式错误:', response.data)
      ElMessage.error('获取甘特图数据失败')
      return
    }
    
    if (tasks && tasks.length >= 0) {
      
      // 转换任务数据格式
      const ganttTasks = tasks.map(task => {
        // 为没有日期的任务生成默认日期
        let startDate = task.start_date || task.created_at
        if (startDate) {
          startDate = startDate.split(' ')[0] // 只取日期部分
        } else {
          startDate = new Date().toISOString().split('T')[0]
        }
        
        let endDate = task.due_date || task.end_date
        if (endDate) {
          endDate = endDate.split(' ')[0] // 只取日期部分
        } else {
          const defaultEnd = new Date(startDate)
          defaultEnd.setDate(defaultEnd.getDate() + (task.estimated_hours ? Math.ceil(task.estimated_hours / 8) : 7))
          endDate = defaultEnd.toISOString().split('T')[0]
        }
        
        return {
          id: task.id,
          text: task.title,
          start_date: startDate,
          end_date: endDate,
          duration: calculateDuration(startDate, endDate),
          progress: (task.progress || 0) / 100,
          priority: task.priority,
          status: task.status,
          assignee_name: task.assignee?.real_name || task.assignee_name || '未分配',
          parent: task.parent_task_id || 0
        }
      })
      
      // 转换依赖关系数据格式
      const ganttLinks = dependencies.map(dep => ({
        id: dep.id,
        source: dep.predecessor_task_id,
        target: dep.successor_task_id,
        type: convertDependencyType(dep.dependency_type)
      }))
      
      // 清空并加载数据
      // 在加载前先根据待加载的任务设置时间轴范围
      setTimelineRangeToTasks(ganttTasks)
      gantt.clearAll()
      gantt.parse({
        data: ganttTasks,
        links: ganttLinks
      })
      gantt.render()
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

// 任务更新功能已移除，任务编辑请在任务管理模块进行

// 任务依赖关系编辑功能已移除，甘特图仅用于查看

// 任务创建功能已移除，任务编辑请在任务管理模块进行

// 加载用户列表
const loadUsers = async () => {
  try {
    // 使用专门用于任务分配的用户API
    const response = await api.users.getUsersForAssignment()
    
    if (response.data && response.data.users) {
      users.value = response.data.users || []
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

let resizeObserver = null;

// 生命周期
onMounted(async () => {
  await nextTick();
  initGantt();
  await Promise.all([
    loadUsers(),
    loadProjects(),
    loadGanttData()
  ]);

  if (ganttContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      gantt.setSizes();
      gantt.render();
    });
    resizeObserver.observe(ganttContainer.value);
  }
});

onUnmounted(() => {
  if (resizeObserver && ganttContainer.value) {
    resizeObserver.unobserve(ganttContainer.value);
  }
  // 卸载所有事件监听器
  ganttEventIds.forEach(eventId => gantt.detachEvent(eventId));
  ganttEventIds.length = 0; // 清空数组
  
  if (gantt) {
    try {
      gantt.clearAll();
    } catch (e) {
      // 忽略清理错误
    }
  }
});
</script>

<style lang="scss" scoped>
.gantt-view {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 使用视口高度确保填满整个屏幕 */
  width: 100%;
  overflow: hidden; /* 防止页面滚动 */
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  height: 60px; /* 固定头部高度 */
  padding: 0 16px;
  background: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.title-section {
  .page-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: #303133;
  }
  .page-subtitle {
    font-size: 11px;
    color: #909399;
    margin-top: 2px;
  }
}

.header-actions {
  display: flex;
  gap: 8px;
  
  .el-button-group {
    .el-button {
      padding: 4px 8px;
      font-size: 11px;
    }
  }
  
  .el-button {
    padding: 4px 8px;
    font-size: 11px;
  }
}

.filter-card {
  flex-shrink: 0;
  margin: 0;
  border-radius: 0;
  border-left: none;
  border-right: none;
  
  :deep(.el-card__body) {
    padding: 8px 16px;
  }
}

.filter-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 6px;
  
  label {
    font-size: 12px;
    color: #606266;
    white-space: nowrap;
  }
  
  .el-select {
    min-width: 120px;
  }
  
  .el-date-editor {
    width: 200px;
  }
}

.gantt-container {
  flex: 1;
  position: relative;
  background: #fff;
  overflow: hidden;
  margin: 0;
  border: none;
  border-radius: 0;
  
  /* 确保甘特图容器占满剩余空间 */
  height: calc(100vh - 120px); /* 减去头部和筛选器的高度 */
  min-height: 500px;
}

.gantt-chart {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

/* dhtmlx-gantt 样式优化 */
:deep(.gantt_container) {
  width: 100% !important;
  height: 100% !important;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

/* 优化网格布局 */
:deep(.gantt_grid) {
  border-right: 1px solid #e4e7ed;
  background: #ffffff;
}

:deep(.gantt_grid_scale) {
  background: #f8f9fa !important;
  border-bottom: 1px solid #e9ecef !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  color: #495057 !important;
  /* 移除硬编码高度，让grid_header_height配置生效 */
}

:deep(.gantt_grid_head_cell) {
  background: #f8f9fa !important;
  border-right: 1px solid #e9ecef !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  color: #495057 !important;
  padding: 10px 12px !important;
  /* 移除硬编码高度，让grid_header_height配置生效 */
  line-height: 1.2 !important;
}

:deep(.gantt_grid_data .gantt_cell) {
  border-right: 1px solid #f1f3f4 !important;
  border-bottom: 1px solid #f1f3f4 !important;
  font-size: 13px !important;
  padding: 8px 12px !important;
  color: #303133 !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 优化时间轴显示 */
:deep(.gantt_task_scale) {
  background: #f8f9fa !important;
  border-bottom: 1px solid #e9ecef !important;
  height: 60px !important;
}

:deep(.gantt_scale_line) {
  border-bottom: 1px solid #e9ecef !important;
  font-size: 12px !important;
  line-height: 30px !important;
  font-weight: 500 !important;
  color: #495057 !important;
}

:deep(.gantt_scale_cell) {
  border-right: 1px solid #e9ecef !important;
  text-align: center !important;
  padding: 4px 8px !important;
}

/* 优化任务条样式 */
:deep(.gantt_task_line) {
  border-radius: 4px !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12) !important;
  height: 24px !important;
  line-height: 24px !important;
}

:deep(.gantt_task_line.gantt_selected) {
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3) !important;
}

:deep(.gantt_task_text) {
  color: #ffffff !important;
  font-weight: 500 !important;
  font-size: 12px !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
}

/* 任务条颜色 */
:deep(.gantt-urgent) { 
  background: linear-gradient(135deg, #f56c6c, #e55353) !important;
}
:deep(.gantt-high) { 
  background: linear-gradient(135deg, #e6a23c, #d4941e) !important;
}
:deep(.gantt-medium) { 
  background: linear-gradient(135deg, #409eff, #337ecc) !important;
}
:deep(.gantt-low) { 
  background: linear-gradient(135deg, #67c23a, #5daf34) !important;
}

/* 优化滚动条样式 */
:deep(.gantt_hor_scroll) {
  height: 16px !important;
  background: #f8f9fa !important;
  border-top: 1px solid #e9ecef !important;
}

:deep(.gantt_ver_scroll) {
  width: 16px !important;
  background: #f8f9fa !important;
  border-left: 1px solid #e9ecef !important;
}

:deep(.gantt_hor_scroll .gantt_scroll_hor) {
  background: #ced4da !important;
  border-radius: 8px !important;
  height: 10px !important;
  margin: 3px !important;
  transition: background-color 0.2s ease !important;
}

:deep(.gantt_ver_scroll .gantt_scroll_ver) {
  background: #ced4da !important;
  border-radius: 8px !important;
  width: 10px !important;
  margin: 3px !important;
  transition: background-color 0.2s ease !important;
}

:deep(.gantt_hor_scroll .gantt_scroll_hor:hover),
:deep(.gantt_ver_scroll .gantt_scroll_ver:hover) {
  background: #adb5bd !important;
}

/* 确保布局容器正确处理滚动 */
:deep(.gantt_layout_content) {
  overflow: hidden !important;
}

:deep(.gantt_grid_data) {
  overflow: visible !important;
}

:deep(.gantt_data_area) {
  overflow: visible !important;
}

:deep(.gantt_timeline) {
  overflow: visible !important;
}

/* 今日标记 */
:deep(.gantt_today) {
  background: rgba(64, 158, 255, 0.1) !important;
  border-left: 2px solid #409eff !important;
}

/* 周末标记 */
:deep(.gantt_weekend) {
  background: rgba(0, 0, 0, 0.03) !important;
}

/* 进度条样式 */
:deep(.gantt_task_progress) {
  background: rgba(255, 255, 255, 0.3) !important;
  border-radius: 2px !important;
}

/* 响应式优化 */
@media (max-width: 1200px) {
  .gantt-view {
    padding: 0;
  }
  
  .page-header {
    padding: 8px 12px 0;
    margin-bottom: 8px;
    
    .title-section .page-title {
      font-size: 18px;
    }
    
    .header-actions {
      gap: 6px;
      
      .el-button {
        padding: 4px 8px;
        font-size: 11px;
      }
    }
  }
  
  .filter-card {
    margin-left: 12px;
    margin-right: 12px;
    margin-bottom: 8px;
  }
  
  .gantt-container {
    margin: 0 12px 12px;
    min-height: 350px;
  }
  
  :deep(.gantt_grid_head_cell) {
    padding: 6px 8px !important;
    font-size: 12px !important;
  }
  
  :deep(.gantt_grid_data .gantt_cell) {
    padding: 6px 8px !important;
    font-size: 12px !important;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    height: 80px;
    padding: 8px 12px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .filter-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .filter-item {
    width: 100%;
    
    .el-select,
    .el-date-editor {
      width: 100%;
    }
  }
  
  .gantt-container {
    margin: 0 8px 8px;
    min-height: 300px;
  }
  
  :deep(.gantt_grid) {
    min-width: 200px;
  }
}
</style>