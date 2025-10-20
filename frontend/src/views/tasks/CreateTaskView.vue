<template>
  <div class="create-task-view">
    <div class="page-header">
      <div class="header-left">
        <el-button
          @click="$router.go(-1)"
          :icon="ArrowLeft"
          circle
        />
        <h1 class="page-title">创建任务</h1>
      </div>
    </div>
    
    <el-card class="task-form-card">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="task-form"
      >
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="任务标题" prop="title">
              <el-input
                v-model="form.title"
                placeholder="请输入任务标题"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="任务描述" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="4"
                placeholder="请输入任务描述"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="任务类别" prop="category">
              <el-select v-model="form.category" placeholder="请选择任务类别" style="width: 100%">
                <el-option label="生产协调" value="production_coordination" />
                <el-option label="项目管理" value="project_management" />
                <el-option label="综合工作" value="general_work" />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="8">
            <el-form-item label="负责人" prop="assigned_to">
              <el-select
                v-model="form.assigned_to"
                placeholder="请选择负责人"
                style="width: 100%"
                filterable
                remote
                :remote-method="searchUsers"
                :loading="userLoading"
              >
                <el-option
                  v-for="user in users"
                  :key="user.id"
                  :label="user.name"
                  :value="user.id"
                >
                  <div class="user-option">
                    <el-avatar :size="24" :src="user.avatar">
                      {{ user.name.charAt(0) }}
                    </el-avatar>
                    <span class="user-name">{{ user.name }}</span>
                    <span class="user-dept">{{ user.department }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="优先级" prop="priority">
              <el-select
                v-model="form.priority"
                placeholder="请选择优先级"
                style="width: 100%"
              >
                <el-option
                  v-for="priority in priorities"
                  :key="priority.value"
                  :label="priority.label"
                  :value="priority.value"
                >
                  <template #default>
                    <div class="priority-option">
                      <el-tag
                        :type="getPriorityType(priority.value)"
                        size="small"
                        effect="plain"
                      >
                        {{ priority.label }}
                      </el-tag>
                    </div>
                  </template>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="8">
            <el-form-item label="开始时间" prop="start_date">
              <el-date-picker
                v-model="form.start_date"
                type="datetime"
                placeholder="选择开始时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="8">
            <el-form-item label="截止时间" prop="due_date">
              <el-date-picker
                v-model="form.due_date"
                type="datetime"
                placeholder="选择截止时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
                :disabled-date="disabledDate"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="8">
            <el-form-item label="预估工时" prop="estimated_hours">
              <el-input-number
                v-model="form.estimated_hours"
                :min="0.5"
                :max="999"
                :step="0.5"
                :precision="1"
                style="width: 100%"
              />
              <span class="input-suffix">小时</span>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="标签">
              <el-select
                v-model="form.tags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="请选择或输入标签"
                style="width: 100%"
              >
                <el-option
                  v-for="tag in availableTags"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="关联任务">
              <el-select
                v-model="form.related_tasks"
                multiple
                filterable
                remote
                placeholder="搜索关联任务"
                style="width: 100%"
                :remote-method="searchTasks"
                :loading="taskLoading"
              >
                <el-option
                  v-for="task in relatedTasks"
                  :key="task.id"
                  :label="task.title"
                  :value="task.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        

        
        <!-- 项目管理字段（仅项目管理类别显示） -->
        <el-row v-if="isProjectCategory" :gutter="20">
          <el-col :span="12">
            <el-form-item label="合同编号">
              <el-input v-model="form.contract_number" placeholder="请输入合同编号" />
            </el-form-item>
          </el-col>

         <el-col :span="12">
           <el-form-item label="合同金额" prop="contract_amount">
             <el-input-number
               v-model="form.contract_amount"
               :min="0"
               :precision="2"
               :step="0.01"
               controls-position="right"
               style="width: 100%"
             />
           </el-form-item>
         </el-col>
          
          <el-col :span="12">

            <el-form-item label="客户负责人" prop="client_owner">
              <el-input v-model="form.client_owner" placeholder="请输入客户负责人" />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">

            <el-form-item label="合同开始日期" prop="contract_start_date">
              <el-date-picker
                v-model="form.contract_start_date"
                type="date"
                placeholder="请选择开始日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">

            <el-form-item label="合同结束日期" prop="contract_end_date">
              <el-date-picker
                v-model="form.contract_end_date"
                type="date"
                placeholder="请选择结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">

            <el-form-item label="年度营收计划" prop="annual_revenue_plan">
              <el-input-number
                v-model="form.annual_revenue_plan"
                :min="0"
                :precision="2"
                :step="0.01"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">

            <el-form-item label="实际营收" prop="actual_revenue">
              <el-input-number
                v-model="form.actual_revenue"
                :min="0"
                :precision="2"
                :step="0.01"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">

            <el-form-item label="实际价值工作量" prop="actual_value_workload">
              <el-input-number
                v-model="form.actual_value_workload"
                :min="0"
                :precision="2"
                :step="0.01"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">

            <el-form-item label="实际成本" prop="actual_cost">
              <el-input-number
                v-model="form.actual_cost"
                :min="0"
                :precision="2"
                :step="0.01"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        
        <el-form-item label="通知设置">
          <el-checkbox-group v-model="form.notifications">
            <el-checkbox label="email">邮件通知</el-checkbox>
            <el-checkbox label="sms">短信通知</el-checkbox>
            <el-checkbox label="system">系统通知</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="其他选项">
          <el-checkbox v-model="form.is_urgent">紧急任务</el-checkbox>
          <el-checkbox v-model="form.is_private">私有任务</el-checkbox>
          <el-checkbox v-model="form.auto_assign">自动分配</el-checkbox>
        </el-form-item>
      </el-form>
      
      <div class="form-actions">
        <el-button @click="$router.go(-1)">取消</el-button>
        <el-button @click="saveDraft" :loading="draftLoading">
          保存草稿
        </el-button>
        <el-button
          type="primary"
          @click="submitTask"
          :loading="submitLoading"
        >
          创建任务
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/auth'
import { useTasksStore } from '@/stores/tasks'

const router = useRouter()
const authStore = useAuthStore()
const tasksStore = useTasksStore()

// 响应式数据
const formRef = ref<FormInstance>()

const submitLoading = ref(false)
const draftLoading = ref(false)
const userLoading = ref(false)
const taskLoading = ref(false)

// 表单数据
const form = reactive({
  title: '',
  description: '',
  category: 'general_work',
  priority: 'medium',
  assigned_to: '',
  due_date: '',
  estimated_hours: 0,
  tags: [],
  related_tasks: [],
  notifications: ['system'],
  is_private: false,
  auto_assign: false,
  // 项目管理字段
  contract_number: '',
  contract_amount: null as number | null,
  annual_revenue_plan: null as number | null,
  client_owner: '',
  contract_start_date: '',
  contract_end_date: '',
  actual_revenue: null as number | null,
  actual_value_workload: null as number | null,
  actual_cost: null as number | null
})



// 用户列表
const users = ref([
  {
    id: '1',
    name: '张三',
    department: '生产信息管理岗',
    avatar: ''
  },
  {
    id: '2',
    name: '李四',
    department: '生产计划岗',
    avatar: ''
  }
])

// 关联任务列表
const relatedTasks = ref([])

// 任务类型选项
const taskTypes = [
  { label: '开发任务', value: 'development' },
  { label: '测试任务', value: 'testing' },
  { label: '设计任务', value: 'design' },
  { label: '文档任务', value: 'documentation' },
  { label: '会议任务', value: 'meeting' },
  { label: '其他', value: 'other' }
]

// 优先级选项
const priorities = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '紧急', value: 'urgent' }
]

// 可用标签
const availableTags = ref([
  '前端', '后端', '数据库', '测试', '部署', '优化', '修复', '新功能'
])



// 表单验证规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入任务描述', trigger: 'blur' },
    { min: 10, max: 500, message: '描述长度在 10 到 500 个字符', trigger: 'blur' }
  ],

  category: [
    { required: true, message: '请选择任务类别', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],

  assigned_to: [
    { required: true, message: '请选择负责人', trigger: 'change' }
  ],
  due_date: [
    { required: true, message: '请选择截止时间', trigger: 'change' }
  ],
  estimated_hours: [
    { required: true, message: '请输入预估工时', trigger: 'blur' },
    { type: 'number', min: 0.5, message: '工时不能少于0.5小时', trigger: 'blur' }
  ]
}

// 获取优先级类型
const getPriorityType = (priority: string) => {
  const types = {
    low: 'info',
    medium: 'warning',
    high: 'danger',
    urgent: 'danger'
  }
  return types[priority] || 'info'
}

// 禁用日期
const disabledDate = (time: Date) => {
  if (form.start_date) {
    return time.getTime() < new Date(form.start_date).getTime()
  }
  return time.getTime() < Date.now() - 8.64e7 // 昨天之前的日期
}

// 搜索用户
const searchUsers = async (query: string) => {
  if (query) {
    userLoading.value = true
    try {
      // TODO: 调用API搜索用户
      await new Promise(resolve => setTimeout(resolve, 300))
      // 模拟搜索结果
    } catch (error) {
      ElMessage.error('搜索用户失败')
    } finally {
      userLoading.value = false
    }
  }
}

// 搜索任务
const searchTasks = async (query: string) => {
  if (query) {
    taskLoading.value = true
    try {
      // TODO: 调用API搜索任务
      await new Promise(resolve => setTimeout(resolve, 300))
      // 模拟搜索结果
    } catch (error) {
      ElMessage.error('搜索任务失败')
    } finally {
      taskLoading.value = false
    }
  }
}



// 保存草稿
const saveDraft = async () => {
  draftLoading.value = true
  try {
    // TODO: 调用API保存草稿
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('草稿保存成功')
  } catch (error) {
    ElMessage.error('保存草稿失败')
  } finally {
    draftLoading.value = false
  }
}

// 提交任务
const submitTask = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    submitLoading.value = true
    
    // 准备提交数据（仅在项目管理时包含项目字段，且映射类别到后端）
    const categoryMap: Record<string, string> = {
      production_coordination: '生产协调',
      project_management: '项目管理',
      general_work: '综合工作'
    }
    const mappedCategory = categoryMap[form.category] || form.category

    const baseData = {
      title: form.title,
      description: form.description,
      category: mappedCategory,
      priority: form.priority,
      assigned_to: form.assigned_to || '',
      due_date: form.due_date,
      estimated_hours: form.estimated_hours,
      tags: form.tags,
      related_tasks: form.related_tasks,
      notifications: form.notifications,
      is_private: form.is_private,
      auto_assign: form.auto_assign
    }

    const submitData = isProjectCategory.value
      ? {
          ...baseData,
          contract_number: form.contract_number || '',
          contract_amount: form.contract_amount ?? null,
          annual_revenue_plan: form.annual_revenue_plan ?? null,
          client_owner: form.client_owner || '',
          contract_start_date: form.contract_start_date || '',
          contract_end_date: form.contract_end_date || '',
          actual_revenue: form.actual_revenue ?? null,
          actual_value_workload: form.actual_value_workload ?? null,
          actual_cost: form.actual_cost ?? null
        }
      : baseData
     
     // 调用API创建任务
     console.log('提交任务数据:', submitData)
     await tasksStore.createTask(submitData)
     
     ElMessage.success('任务创建成功')
     router.push('/tasks')
     
   } catch (error) {
     console.error('表单验证失败:', error)
   } finally {
     submitLoading.value = false
   }
 }
onMounted(() => {
  // 初始化数据
})
watch(() => form.category, (newVal) => {
  if (newVal !== 'project_management') {
    form.contract_number = ''
    form.contract_amount = null
    form.annual_revenue_plan = null
    form.client_owner = ''
    form.contract_start_date = ''
    form.contract_end_date = ''
    form.actual_revenue = null
    form.actual_value_workload = null
    form.actual_cost = null
  }
})
</script>

<style scoped>
.create-task-view {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.task-form-card {
  flex: 1;
}

.task-form {
  max-width: 1000px;
}

.priority-option {
  display: flex;
  align-items: center;
}

.user-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-weight: 500;
}

.user-dept {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.input-suffix {
  margin-left: 8px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.upload-demo {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input__wrapper) {
  transition: all 0.2s;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-color-primary-light-7) inset;
}

:deep(.el-upload-dragger) {
  border: 2px dashed var(--el-border-color-lighter);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

:deep(.el-upload-dragger:hover) {
  border-color: var(--el-color-primary);
}

:deep(.el-checkbox-group) {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .create-task-view {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .task-form {
    max-width: none;
  }
  
  :deep(.el-col) {
    width: 100% !important;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>