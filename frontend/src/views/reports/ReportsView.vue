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
        
        <!-- 部门任务统计 -->
        <el-card class="chart-card" v-loading="loading">
          <template #header>
            <span>部门任务统计</span>
          </template>
          <div ref="departmentChartRef" class="chart-container"></div>
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

// 响应式数据
const loading = ref(false)
const dateRange = ref<[string, string] | null>(null)
const trendPeriod = ref<'week' | 'month' | 'quarter'>('month')
const selectedDepartment = ref('')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

// 图表引用
const trendChartRef = ref()
const statusChartRef = ref()
const priorityChartRef = ref()
const departmentChartRef = ref()
const efficiencyChartRef = ref()

// 图表实例
let trendChart: echarts.ECharts | null = null
let statusChart: echarts.ECharts | null = null
let priorityChart: echarts.ECharts | null = null
let departmentChart: echarts.ECharts | null = null
let efficiencyChart: echarts.ECharts | null = null

// 统计数据
const stats = reactive({
  totalTasks: 1248,
  completedTasks: 892,
  completionRate: 71.5,
  overdueTasks: 45,
  taskGrowth: 12.5,
  completionGrowth: 8.3,
  rateGrowth: 2.1,
  overdueGrowth: -15.2
})

// 表格数据
const tableData = ref([
  {
    user: '张三',
    department: '生产信息管理岗',
    avatar: '',
    totalTasks: 45,
    completedTasks: 38,
    inProgressTasks: 5,
    pendingTasks: 2,
    overdueTasks: 0,
    completionRate: 84,
    avgCompletionTime: 3.2,
    efficiency: 'A'
  },
  {
    user: '李四',
    department: '生产计划岗',
    avatar: '',
    totalTasks: 32,
    completedTasks: 25,
    inProgressTasks: 4,
    pendingTasks: 2,
    overdueTasks: 1,
    completionRate: 78,
    avgCompletionTime: 4.1,
    efficiency: 'B'
  },
  {
    user: '王五',
    department: '生产协调岗',
    avatar: '',
    totalTasks: 28,
    completedTasks: 22,
    inProgressTasks: 3,
    pendingTasks: 2,
    overdueTasks: 1,
    completionRate: 79,
    avgCompletionTime: 3.8,
    efficiency: 'B'
  },
  {
    user: '赵六',
    department: '项目评价岗',
    avatar: '',
    totalTasks: 38,
    completedTasks: 35,
    inProgressTasks: 2,
    pendingTasks: 1,
    overdueTasks: 0,
    completionRate: 92,
    avgCompletionTime: 2.5,
    efficiency: 'A'
  }
])

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
const exportReport = () => {
  ElMessage.success('报表导出功能开发中...')
}

// 刷新数据
const refreshData = async () => {
  loading.value = true
  try {
    // TODO: 调用API获取数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 更新所有图表
    await nextTick()
    updateAllCharts()
    
    ElMessage.success('数据已刷新')
  } catch (error) {
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
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '新建任务',
        type: 'line',
        data: [120, 132, 101, 134, 90, 230, 210, 182, 191, 234, 290, 330],
        smooth: true,
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '完成任务',
        type: 'line',
        data: [85, 98, 87, 112, 78, 195, 178, 165, 172, 198, 245, 285],
        smooth: true,
        itemStyle: {
          color: '#67C23A'
        }
      },
      {
        name: '逾期任务',
        type: 'line',
        data: [12, 8, 15, 6, 18, 22, 15, 8, 12, 18, 25, 20],
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
        data: [
          { value: 892, name: '已完成', itemStyle: { color: '#67C23A' } },
          { value: 234, name: '进行中', itemStyle: { color: '#E6A23C' } },
          { value: 77, name: '待处理', itemStyle: { color: '#909399' } },
          { value: 45, name: '逾期', itemStyle: { color: '#F56C6C' } }
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
        data: [
          { value: 156, name: '紧急', itemStyle: { color: '#F56C6C' } },
          { value: 312, name: '高', itemStyle: { color: '#E6A23C' } },
          { value: 468, name: '中', itemStyle: { color: '#409EFF' } },
          { value: 312, name: '低', itemStyle: { color: '#909399' } }
        ]
      }
    ]
  }
  
  priorityChart.setOption(option)
}

// 初始化部门统计图
const initDepartmentChart = () => {
  if (!departmentChartRef.value) return
  
  departmentChart = echarts.init(departmentChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
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
      data: ['生产信息管理岗', '生产计划岗', '生产协调岗', '项目评价岗', '项目监控岗', '值班工程师', '应急管理岗']
    },
    series: [
      {
        name: '任务数量',
        type: 'bar',
        data: [385, 298, 234, 187, 144],
        itemStyle: {
          color: '#409EFF'
        }
      }
    ]
  }
  
  departmentChart.setOption(option)
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
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      }
    },
    legend: {
      data: ['任务数量', '完成率']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'],
        axisPointer: {
          type: 'shadow'
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '任务数量',
        min: 0,
        max: 50,
        interval: 10,
        axisLabel: {
          formatter: '{value}'
        }
      },
      {
        type: 'value',
        name: '完成率',
        min: 0,
        max: 100,
        interval: 20,
        axisLabel: {
          formatter: '{value}%'
        }
      }
    ],
    series: [
      {
        name: '任务数量',
        type: 'bar',
        data: [45, 32, 28, 38, 25, 30, 22, 35],
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '完成率',
        type: 'line',
        yAxisIndex: 1,
        data: [84, 78, 79, 92, 68, 75, 82, 88],
        itemStyle: {
          color: '#67C23A'
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
  departmentChart?.setOption(departmentChart.getOption())
  updateEfficiencyChart()
}

// 窗口大小变化时重新调整图表
const handleResize = () => {
  trendChart?.resize()
  statusChart?.resize()
  priorityChart?.resize()
  departmentChart?.resize()
  efficiencyChart?.resize()
}

onMounted(async () => {
  await nextTick()
  
  // 初始化所有图表
  initTrendChart()
  initStatusChart()
  initPriorityChart()
  initDepartmentChart()
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
  departmentChart?.dispose()
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