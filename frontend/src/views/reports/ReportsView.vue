<template>
  <div class="reports-view">
    <div class="page-header">
      <h1 class="page-title">报表统计</h1>
      <div class="header-actions">
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
        
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        
        <el-button type="primary" @click="exportReport">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </div>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon tasks">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalTasks }}</div>
            <div class="stat-label">总任务数</div>
            <div class="stat-change" :class="{ positive: stats.taskGrowth > 0, negative: stats.taskGrowth < 0 }">
              <el-icon v-if="stats.taskGrowth > 0"><ArrowUp /></el-icon>
              <el-icon v-else-if="stats.taskGrowth < 0"><ArrowDown /></el-icon>
              {{ Math.abs(stats.taskGrowth) }}%
            </div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon completed">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.completedTasks }}</div>
            <div class="stat-label">已完成任务</div>
            <div class="stat-change" :class="{ positive: stats.completionGrowth > 0, negative: stats.completionGrowth < 0 }">
              <el-icon v-if="stats.completionGrowth > 0"><ArrowUp /></el-icon>
              <el-icon v-else-if="stats.completionGrowth < 0"><ArrowDown /></el-icon>
              {{ Math.abs(stats.completionGrowth) }}%
            </div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon rate">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.completionRate }}%</div>
            <div class="stat-label">完成率</div>
            <div class="stat-change" :class="{ positive: stats.rateGrowth > 0, negative: stats.rateGrowth < 0 }">
              <el-icon v-if="stats.rateGrowth > 0"><ArrowUp /></el-icon>
              <el-icon v-else-if="stats.rateGrowth < 0"><ArrowDown /></el-icon>
              {{ Math.abs(stats.rateGrowth) }}%
            </div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon overdue">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.overdueTasks }}</div>
            <div class="stat-label">逾期任务</div>
            <div class="stat-change" :class="{ positive: stats.overdueGrowth < 0, negative: stats.overdueGrowth > 0 }">
              <el-icon v-if="stats.overdueGrowth > 0"><ArrowUp /></el-icon>
              <el-icon v-else-if="stats.overdueGrowth < 0"><ArrowDown /></el-icon>
              {{ Math.abs(stats.overdueGrowth) }}%
            </div>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 图表区域 -->
    <div class="charts-container">
      <div class="chart-row">
        <!-- 任务趋势图 -->
        <el-card class="chart-card" v-loading="loading">
          <template #header>
            <div class="chart-header">
              <span>任务趋势</span>
              <el-button-group size="small">
                <el-button
                  :type="trendPeriod === 'week' ? 'primary' : ''"
                  @click="setTrendPeriod('week')"
                >
                  周
                </el-button>
                <el-button
                  :type="trendPeriod === 'month' ? 'primary' : ''"
                  @click="setTrendPeriod('month')"
                >
                  月
                </el-button>
                <el-button
                  :type="trendPeriod === 'quarter' ? 'primary' : ''"
                  @click="setTrendPeriod('quarter')"
                >
                  季度
                </el-button>
              </el-button-group>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
        
        <!-- 任务状态分布 -->
        <el-card class="chart-card" v-loading="loading">
          <template #header>
            <span>任务状态分布</span>
          </template>
          <div ref="statusChartRef" class="chart-container"></div>
        </el-card>
      </div>
      
      <div class="chart-row">
        <!-- 优先级分布 -->
        <el-card class="chart-card" v-loading="loading">
          <template #header>
            <span>优先级分布</span>
          </template>
          <div ref="priorityChartRef" class="chart-container"></div>
        </el-card>
        
        <!-- 工作类型统计 -->
        <el-card class="chart-card" v-loading="loading">
          <template #header>
            <span>工作类型统计</span>
          </template>
          <div ref="workTypeChartRef" class="chart-container"></div>
        </el-card>
      </div>
      
      <div class="chart-row">
        <!-- 人员效率统计 -->
        <el-card class="chart-card full-width" v-loading="loading">
          <template #header>
            <div class="chart-header">
              <span>人员效率统计</span>
              <el-select
                v-model="selectedDepartment"
                placeholder="选择部门"
                clearable
                style="width: 150px;"
                @change="updateEfficiencyChart"
              >
                <el-option label="全部部门" value="" />
                <el-option label="生产信息管理岗" value="生产信息管理岗" />
              <el-option label="生产计划岗" value="生产计划岗" />
              <el-option label="生产协调岗" value="生产协调岗" />
              <el-option label="项目评价岗" value="项目评价岗" />
              <el-option label="项目监控岗" value="项目监控岗" />
              <el-option label="值班工程师" value="值班工程师" />
              <el-option label="应急管理岗" value="应急管理岗" />
              </el-select>
            </div>
          </template>
          <div ref="efficiencyChartRef" class="chart-container large"></div>
        </el-card>
      </div>
    </div>
    
    <!-- 详细数据表格 -->
    <el-card class="table-card">
      <template #header>
        <div class="table-header">
          <span>详细数据</span>
          <div class="table-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索用户"
              clearable
              style="width: 200px;"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </template>
      
      <el-table
        :data="filteredTableData"
        stripe
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="user" label="用户" width="120">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="24" :src="row.avatar">
                {{ row.user.charAt(0) }}
              </el-avatar>
              <span class="user-name">{{ row.user }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="department" label="岗位" width="100" />
        
        <el-table-column prop="totalTasks" label="总任务" width="80" align="center" />
        
        <el-table-column prop="completedTasks" label="已完成" width="80" align="center">
          <template #default="{ row }">
            <span class="completed-count">{{ row.completedTasks }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="inProgressTasks" label="进行中" width="80" align="center">
          <template #default="{ row }">
            <span class="in-progress-count">{{ row.inProgressTasks }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="pendingTasks" label="待处理" width="80" align="center">
          <template #default="{ row }">
            <span class="pending-count">{{ row.pendingTasks }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="overdueTasks" label="逾期" width="80" align="center">
          <template #default="{ row }">
            <span class="overdue-count">{{ row.overdueTasks }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="completionRate" label="完成率" width="100" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="row.completionRate"
              :stroke-width="6"
              :show-text="false"
            />
            <span class="rate-text">{{ row.completionRate }}%</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="avgCompletionTime" label="平均完成时间" width="120" align="center">
          <template #default="{ row }">
            {{ row.avgCompletionTime }}天
          </template>
        </el-table-column>
        
        <el-table-column prop="efficiency" label="效率评分" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getEfficiencyType(row.efficiency)"
              size="small"
            >
              {{ row.efficiency }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              @click="viewUserDetail(row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="tableData.length"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 逾期任务明细 -->
    <el-card class="table-card">
      <template #header>
        <div class="table-header">
          <span>逾期任务明细</span>
          <div class="table-actions">
            <el-input
              v-model="overdueKeyword"
              placeholder="搜索任务"
              clearable
              style="width: 240px;"
              @change="fetchOverdueTasks"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </template>

      <el-table
        :data="overdueItems"
        stripe
        style="width: 100%"
        v-loading="overdueLoading"
      >
        <el-table-column prop="title" label="任务标题" min-width="220" />
        <el-table-column prop="assignee_name" label="负责人" width="120" />
        <el-table-column prop="assignee_department" label="岗位" width="140" />
        <el-table-column prop="priority" label="优先级" width="90" />
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column prop="due_date" label="截止日期" width="160">
          <template #default="{ row }">
            {{ formatDate(row.due_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="days_overdue" label="逾期天数" width="100" align="center">
          <template #default="{ row }">
            <span class="overdue-count">{{ row.days_overdue }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="overduePage"
          v-model:page-size="overduePageSize"
          :total="overdueTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleOverdueSizeChange"
          @current-change="handleOverdueCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  Download,
  Document,
  CircleCheck,
  TrendCharts,
  Warning,
  ArrowUp,
  ArrowDown,
  Search
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import api from '@/api'

// 响应式数据
const loading = ref(false)
const dateRange = ref<[string, string] | null>(null)
const trendPeriod = ref<'week' | 'month' | 'quarter'>('month')
const selectedDepartment = ref('')
const searchKeyword = ref('')

// 用户绩效表格分页
const currentPage = ref(1)
const pageSize = ref(20)

// 逾期任务明细列表状态
const overdueItems = ref<any[]>([])
const overdueTotal = ref(0)
const overdueLoading = ref(false)
const overduePage = ref(1)
const overduePageSize = ref(10)
const overdueKeyword = ref('')

// 图表引用
const trendChartRef = ref()
const statusChartRef = ref()
const priorityChartRef = ref()
const workTypeChartRef = ref()
const efficiencyChartRef = ref()

// 图表实例
let trendChart: echarts.ECharts | null = null
let statusChart: echarts.ECharts | null = null
let priorityChart: echarts.ECharts | null = null
let workTypeChart: echarts.ECharts | null = null
let efficiencyChart: echarts.ECharts | null = null

// 统计数据
const stats = reactive({
  totalTasks: 0,
  completedTasks: 0,
  completionRate: 0,
  overdueTasks: 0,
  taskGrowth: 0,
  completionGrowth: 0,
  rateGrowth: 0,
  overdueGrowth: 0
})

// 图表数据
const chartData = reactive({
  trendData: {
    categories: [],
    newTasks: [],
    completedTasks: [],
    overdueTasks: []
  },
  statusData: [],
  priorityData: [],
  workTypeData: {
    categories: [],
    values: [],
    completionRates: []
  },
  efficiencyData: {
    categories: [],
    efficiency: [],
    completion: []
  }
})

// 表格数据
const tableData = ref([])
const totalUsers = ref(0)

// 计算属性
const filteredTableData = computed(() => {
  let data = tableData.value
  
  if (searchKeyword.value) {
    data = data.filter(item =>
      item.user.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      item.department.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  
  return data.slice(start, end)
})

// 工具函数：日期格式化
const formatDate = (d: string) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'

// 获取逾期任务明细
const fetchOverdueTasks = async () => {
  overdueLoading.value = true
  try {
    const params = {
      start_date: dateRange.value?.[0],
      end_date: dateRange.value?.[1],
      department: selectedDepartment.value || undefined,
      keyword: overdueKeyword.value || undefined,
      page: overduePage.value,
      limit: overduePageSize.value
    }
    const resp = await api.reports.getOverdueTasks(params)
    const { items = [], total = 0 } = resp.data || {}
    overdueItems.value = items
    overdueTotal.value = total
  } catch (e) {
    console.error('获取逾期任务明细失败:', e)
    ElMessage.error('获取逾期任务明细失败')
  } finally {
    overdueLoading.value = false
  }
}

// 逾期表格分页变更
const handleOverdueSizeChange = (size: number) => {
  overduePageSize.value = size
  overduePage.value = 1
  fetchOverdueTasks()
}
const handleOverdueCurrentChange = (page: number) => {
  overduePage.value = page
  fetchOverdueTasks()
}

// 获取效率评分类型
const getEfficiencyType = (efficiency: string) => {
  const types = {
    'A': 'success',
    'B': 'warning',
    'C': 'info',
    'D': 'danger'
  }
  return types[efficiency] || 'info'
}

// 设置趋势周期
const setTrendPeriod = (period: 'week' | 'month' | 'quarter') => {
  trendPeriod.value = period
  updateTrendChart()
}

// 处理日期范围变化
const handleDateRangeChange = () => {
  refreshData()
}

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

// 处理当前页变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 查看用户详情
const viewUserDetail = (user: any) => {
  ElMessage.info(`查看用户 ${user.user} 的详细信息`)
}

// 导出报表
const exportReport = async () => {
  try {
    ElMessage.info('正在导出报表，请稍候...')
    
    const params = {
      start_date: dateRange.value?.[0],
      end_date: dateRange.value?.[1]
    }
    
    const response = await api.reports.exportTasks(params)
    
    // 创建下载链接
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // 生成文件名
    const today = new Date().toISOString().split('T')[0]
    const startDate = dateRange.value?.[0] || '全部'
    const endDate = dateRange.value?.[1] || '全部'
    const filename = `任务报表_${startDate}_${endDate}_${today}.csv`
    
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('报表导出成功！')
  } catch (error) {
    console.error('导出报表失败:', error)
    ElMessage.error('导出报表失败，请重试')
  }
}

// 获取任务统计数据
const fetchTasksStats = async () => {
  try {
    const params = {
      start_date: dateRange.value?.[0],
      end_date: dateRange.value?.[1]
    }
    const response = await api.reports.getTasksStats(params)
    const payload = response.data?.data || {}

    const basic = payload.basic_stats || {}
    const statusStats = payload.status_stats || []
    const priorityStats = payload.priority_stats || []

    // 更新统计数据
    const total = basic.total_tasks || 0
    const completed = basic.completed_tasks || 0
    const overdue = basic.overdue_tasks || 0

    Object.assign(stats, {
      totalTasks: total,
      completedTasks: completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      overdueTasks: overdue,
      taskGrowth: 0,
      completionGrowth: 0,
      rateGrowth: 0,
      overdueGrowth: 0
    })

    // 更新状态分布数据（后端返回按状态聚合的数组 + 逾期来自基础统计）
    const getStatusCount = (key: string) => {
      const item = statusStats.find((s: any) => s.status === key)
      return item ? (item.count || 0) : 0
    }
    chartData.statusData = [
      { value: getStatusCount('completed'), name: '已完成', itemStyle: { color: '#67C23A' } },
      { value: getStatusCount('in_progress'), name: '进行中', itemStyle: { color: '#E6A23C' } },
      { value: getStatusCount('pending'), name: '待处理', itemStyle: { color: '#909399' } },
      { value: overdue, name: '逾期', itemStyle: { color: '#F56C6C' } }
    ]

    // 更新优先级分布数据（后端返回数组 priority/count）
    const priorityMap: Record<string, number> = {}
    priorityStats.forEach((p: any) => {
      priorityMap[p.priority] = (p.count || 0)
    })
    chartData.priorityData = [
      { value: priorityMap['urgent'] || 0, name: '紧急', itemStyle: { color: '#F56C6C' } },
      { value: priorityMap['high'] || 0, name: '高', itemStyle: { color: '#E6A23C' } },
      { value: priorityMap['medium'] || 0, name: '中', itemStyle: { color: '#409EFF' } },
      { value: priorityMap['low'] || 0, name: '低', itemStyle: { color: '#909399' } }
    ]
  } catch (error) {
    console.error('获取任务统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
  }
}

// 获取任务趋势数据
const fetchTasksTrend = async () => {
  try {
    const params = {
      start_date: dateRange.value?.[0],
      end_date: dateRange.value?.[1],
      period: trendPeriod.value
    }
    const response = await api.reports.getTasksTrend(params)
    const payload = response.data?.data || {}

    const creation = payload.creation_trend || []
    const completion = payload.completion_trend || []

    const createdMap: Record<string, number> = {}
    creation.forEach((it: any) => { createdMap[it.period] = it.created_count || it.count || 0 })
    const completedMap: Record<string, number> = {}
    completion.forEach((it: any) => { completedMap[it.period] = it.completed_count || it.count || 0 })

    const periodsSet = new Set<string>([
      ...creation.map((it: any) => it.period),
      ...completion.map((it: any) => it.period)
    ])
    const periods = Array.from(periodsSet).sort()

    chartData.trendData.categories = periods
    chartData.trendData.newTasks = periods.map(p => createdMap[p] || 0)
    chartData.trendData.completedTasks = periods.map(p => completedMap[p] || 0)
    chartData.trendData.overdueTasks = periods.map(() => 0)
  } catch (error) {
    console.error('获取任务趋势数据失败:', error)
    ElMessage.error('获取趋势数据失败')
  }
}

// 获取工作类型统计数据
const fetchWorkTypesStats = async () => {
  try {
    const params = {
      start_date: dateRange.value?.[0],
      end_date: dateRange.value?.[1]
    }
    const response = await api.reports.getWorkTypesStats(params)
    const data = response.data?.data || []

    if (data && data.length > 0) {
      chartData.workTypeData.categories = data.map((item: any) => item.work_type)
      chartData.workTypeData.values = data.map((item: any) => item.total_tasks || 0)
      chartData.workTypeData.completionRates = data.map((item: any) => item.completion_rate || 0)
    }
  } catch (error) {
    console.error('获取工作类型统计数据失败:', error)
    ElMessage.error('获取工作类型数据失败')
  }
}

// 获取部门绩效数据（保留原有功能）
const fetchDepartmentsPerformance = async () => {
  try {
    const params = {
      start_date: dateRange.value?.[0],
      end_date: dateRange.value?.[1]
    }
    const response = await api.reports.getDepartmentsPerformance(params)
    const data = response.data?.data || []

    if (data && data.length > 0) {
      chartData.departmentData.categories = data.map((item: any) => item.department)
      chartData.departmentData.values = data.map((item: any) => item.total_tasks || 0)
    }
  } catch (error) {
    console.error('获取部门绩效数据失败:', error)
    ElMessage.error('获取部门数据失败')
  }
}

// 获取用户绩效数据
const fetchUsersPerformance = async () => {
  try {
    const params = {
      start_date: dateRange.value?.[0],
      end_date: dateRange.value?.[1]
    }
    // 使用任务统计接口返回的 user_stats 填充用户表格与效率图表
    const response = await api.reports.getTasksStats(params)
    const payload = response.data?.data || {}
    const users = payload.user_stats || []

    if (users && users.length > 0) {
      // 更新表格数据
      tableData.value = users.map((u: any) => {
        const total = u.assigned_tasks || 0
        const completed = u.completed_tasks || 0
        const overdue = u.overdue_tasks || 0
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
        const efficiencyScore = total > 0 ? Math.max(0, Math.round(((completed - overdue) / total) * 100)) : 0
        return {
          user: u.real_name || `用户${u.id}`,
          department: u.department || '-',
          avatar: u.avatar || '',
          totalTasks: total,
          completedTasks: completed,
          inProgressTasks: u.in_progress_tasks || 0,
          pendingTasks: 0,
          overdueTasks: overdue,
          completionRate,
          avgCompletionTime: u.avg_completion_days || 0,
          efficiency: getEfficiencyGrade(completionRate)
        }
      })

      totalUsers.value = users.length

      // 更新效率图表数据
      chartData.efficiencyData.categories = users.map((u: any) => u.real_name || `用户${u.id}`)
      chartData.efficiencyData.efficiency = users.map((u: any) => {
        const total = u.assigned_tasks || 0
        const completed = u.completed_tasks || 0
        const overdue = u.overdue_tasks || 0
        return total > 0 ? Math.max(0, Math.round(((completed - overdue) / total) * 100)) : 0
      })
      chartData.efficiencyData.completion = users.map((u: any) => {
        const total = u.assigned_tasks || 0
        const completed = u.completed_tasks || 0
        return total > 0 ? Math.round((completed / total) * 100) : 0
      })
    }
  } catch (error) {
    console.error('获取用户绩效数据失败:', error)
    ElMessage.error('获取用户数据失败')
  }
}

// 根据完成率计算效率等级
const getEfficiencyGrade = (completionRate: number): string => {
  if (completionRate >= 90) return 'A'
  if (completionRate >= 80) return 'B'
  if (completionRate >= 70) return 'C'
  return 'D'
}

// 刷新数据
const refreshData = async () => {
  loading.value = true
  try {
    // 并行获取所有数据
    await Promise.all([
      fetchTasksStats(),
      fetchTasksTrend(),
      fetchWorkTypesStats(),
      fetchUsersPerformance(),
      fetchOverdueTasks()
    ])
    
    // 更新所有图表
    await nextTick()
    updateTrendChart()
    updateStatusChart()
    updatePriorityChart()
    updateWorkTypeChart()
    updateEfficiencyChart()
    
    ElMessage.success('数据已刷新')
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('刷新数据失败')
  } finally {
    loading.value = false
  }
}

// 初始化趋势图
const initTrendChart = () => {
  if (!trendChartRef.value) return
  
  trendChart = echarts.init(trendChartRef.value)
  updateTrendChart()
}

// 更新趋势图
const updateTrendChart = () => {
  if (!trendChart) return
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['新建任务', '完成任务', '逾期任务']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.trendData.categories.length > 0 ? chartData.trendData.categories : ['暂无数据']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '新建任务',
        type: 'line',
        data: chartData.trendData.newTasks,
        smooth: true,
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '完成任务',
        type: 'line',
        data: chartData.trendData.completedTasks,
        smooth: true,
        itemStyle: {
          color: '#67C23A'
        }
      },
      {
        name: '逾期任务',
        type: 'line',
        data: chartData.trendData.overdueTasks,
        smooth: true,
        itemStyle: {
          color: '#F56C6C'
        }
      }
    ]
  }
  
  trendChart.setOption(option)
}

// 初始化状态分布图
const initStatusChart = () => {
  if (!statusChartRef.value) return
  
  statusChart = echarts.init(statusChartRef.value)
  updateStatusChart()
}

// 更新状态分布图
const updateStatusChart = () => {
  if (!statusChart) return
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '任务状态',
        type: 'pie',
        radius: '50%',
        data: chartData.statusData.length > 0 ? chartData.statusData : [
          { value: 0, name: '暂无数据', itemStyle: { color: '#E4E7ED' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  statusChart.setOption(option)
}

// 初始化优先级分布图
const initPriorityChart = () => {
  if (!priorityChartRef.value) return
  
  priorityChart = echarts.init(priorityChartRef.value)
  updatePriorityChart()
}

// 更新优先级分布图
const updatePriorityChart = () => {
  if (!priorityChart) return
  
  const option = {
    tooltip: {
      trigger: 'item'
    },
    series: [
      {
        name: '优先级分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '30',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: chartData.priorityData.length > 0 ? chartData.priorityData : [
          { value: 0, name: '暂无数据', itemStyle: { color: '#E4E7ED' } }
        ]
      }
    ]
  }
  
  priorityChart.setOption(option)
}

// 初始化工作类型统计图
const initWorkTypeChart = () => {
  if (!workTypeChartRef.value) return
  
  workTypeChart = echarts.init(workTypeChartRef.value)
  updateWorkTypeChart()
}

// 更新工作类型统计图
const updateWorkTypeChart = () => {
  if (!workTypeChart) return
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params: any) {
        const dataIndex = params[0].dataIndex
        const workType = chartData.workTypeData.categories[dataIndex]
        const taskCount = chartData.workTypeData.values[dataIndex]
        const completionRate = chartData.workTypeData.completionRates[dataIndex]
        return `${workType}<br/>任务数量: ${taskCount}<br/>完成率: ${completionRate}%`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      boundaryGap: [0, 0.01]
    },
    yAxis: {
      type: 'category',
      data: chartData.workTypeData.categories.length > 0 ? chartData.workTypeData.categories : ['暂无数据']
    },
    series: [
      {
        name: '任务数量',
        type: 'bar',
        data: chartData.workTypeData.values,
        itemStyle: {
          color: function(params: any) {
            const colors = ['#67C23A', '#E6A23C', '#409EFF', '#909399']
            return colors[params.dataIndex % colors.length]
          }
        }
      }
    ]
  }
  
  workTypeChart.setOption(option)
}

// 初始化效率统计图
const initEfficiencyChart = () => {
  if (!efficiencyChartRef.value) return
  
  efficiencyChart = echarts.init(efficiencyChartRef.value)
  updateEfficiencyChart()
}

// 更新效率统计图
const updateEfficiencyChart = () => {
  if (!efficiencyChart) return
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['平均效率', '完成率']
    },
    xAxis: {
      type: 'category',
      data: chartData.efficiencyData.categories.length > 0 ? chartData.efficiencyData.categories : ['暂无数据']
    },
    yAxis: [
      {
        type: 'value',
        name: '效率分数',
        min: 0,
        max: 100,
        position: 'left',
        axisLabel: {
          formatter: '{value}'
        }
      },
      {
        type: 'value',
        name: '完成率',
        min: 0,
        max: 100,
        position: 'right',
        axisLabel: {
          formatter: '{value}%'
        }
      }
    ],
    series: [
      {
        name: '平均效率',
        type: 'bar',
        data: chartData.efficiencyData.efficiency,
        itemStyle: {
          color: '#67C23A'
        }
      },
      {
        name: '完成率',
        type: 'line',
        yAxisIndex: 1,
        data: chartData.efficiencyData.completion,
        itemStyle: {
          color: '#E6A23C'
        }
      }
    ]
  }
  
  efficiencyChart.setOption(option)
}

// 更新所有图表
const updateAllCharts = () => {
  updateTrendChart()
  statusChart?.setOption(statusChart.getOption())
  priorityChart?.setOption(priorityChart.getOption())
  workTypeChart?.setOption(workTypeChart.getOption())
  updateEfficiencyChart()
}

// 窗口大小变化时重新调整图表
const handleResize = () => {
  trendChart?.resize()
  statusChart?.resize()
  priorityChart?.resize()
  workTypeChart?.resize()
  efficiencyChart?.resize()
}

onMounted(async () => {
  await nextTick()
  
  // 初始化所有图表
  initTrendChart()
  initStatusChart()
  initPriorityChart()
  initWorkTypeChart()
  initEfficiencyChart()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  
  // 获取初始数据
  refreshData()
})

// 组件卸载时清理
const cleanup = () => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  statusChart?.dispose()
  priorityChart?.dispose()
  workTypeChart?.dispose()
  efficiencyChart?.dispose()
}

// 在组件卸载时清理
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup)
}
</script>

<style scoped>
.reports-view {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.tasks {
  background: linear-gradient(135deg, #409EFF, #66B1FF);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #67C23A, #85CE61);
}

.stat-icon.rate {
  background: linear-gradient(135deg, #E6A23C, #EEBE77);
}

.stat-icon.overdue {
  background: linear-gradient(135deg, #F56C6C, #F78989);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.stat-change.positive {
  color: var(--el-color-success);
}

.stat-change.negative {
  color: var(--el-color-danger);
}

.charts-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-card {
  min-height: 400px;
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.chart-container.large {
  height: 400px;
}

.table-card {
  margin-top: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-weight: 500;
}

.completed-count {
  color: var(--el-color-success);
  font-weight: 500;
}

.in-progress-count {
  color: var(--el-color-warning);
  font-weight: 500;
}

.pending-count {
  color: var(--el-color-info);
  font-weight: 500;
}

.overdue-count {
  color: var(--el-color-danger);
  font-weight: 500;
}

.rate-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: 8px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

@media (max-width: 1200px) {
  .chart-row {
    grid-template-columns: 1fr;
  }
  
  .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .reports-view {
    padding: 16px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .stat-content {
    gap: 12px;
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .chart-container.large {
    height: 300px;
  }
  
  .table-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}
</style>