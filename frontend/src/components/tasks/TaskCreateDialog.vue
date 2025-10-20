<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑任务' : '创建任务'"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      label-position="top"
    >
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="任务标题 *" prop="title">
            <el-input
              v-model="formData.title"
              placeholder="请输入任务标题"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="任务类别 *" prop="category">
            <el-select v-model="formData.category" placeholder="请选择任务类别" style="width: 100%">
              <el-option label="生产协调" value="production_coordination" />
              <el-option label="项目管理" value="project_management" />
              <el-option label="综合工作" value="general_work" />
            </el-select>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="优先级 *" prop="priority">
            <el-select v-model="formData.priority" placeholder="请选择优先级" style="width: 100%">
              <el-option label="低" value="low" />
              <el-option label="中" value="medium" />
              <el-option label="高" value="high" />
              <el-option label="紧急" value="urgent" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="上级任务" prop="parent_id">
            <el-select
              v-model="formData.parent_id"
              placeholder="搜索并选择上级任务"
              clearable
              filterable
              remote
              :remote-method="searchParentTasks"
              :loading="parentTaskLoading"
              style="width: 100%"
            >
              <el-option
                v-for="pt in parentTaskList"
                :key="pt.id"
                :label="pt.title"
                :value="String(pt.id)"
              />
            </el-select>
          </el-form-item>
        </el-col>
        
        <el-col :span="12" v-if="authStore.isManager">
          <el-form-item label="负责人" prop="assigned_to">
            <el-select
              v-model="formData.assigned_to"
              placeholder="请选择负责人"
              filterable
              :loading="userLoading"
              style="width: 100%"
            >
              <el-option
                v-for="user in userList"
                :key="user.id"
                :label="user.real_name"
                :value="user.id"
              >
                <div class="user-option">
                  <el-avatar :size="24" :src="user.avatar">
                    {{ user.real_name?.charAt(0) }}
                  </el-avatar>
                  <span>{{ user.real_name }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="状态 *" prop="status">
            <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
              <el-option label="待处理" value="pending" />
              <el-option label="进行中" value="in_progress" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="开始时间" prop="start_date">
            <el-date-picker
              v-model="formData.start_date"
              type="datetime"
              placeholder="请选择开始时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="截止时间" prop="due_date">
            <el-date-picker
              v-model="formData.due_date"
              type="datetime"
              placeholder="请选择截止时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="预估工时（小时）" prop="estimated_hours">
            <el-input-number
              v-model="formData.estimated_hours"
              :min="0"
              :max="999"
              :precision="1"
              placeholder="请输入预估工时"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="完成进度（%）" prop="progress">
            <el-slider
              v-model="formData.progress"
              :min="0"
              :max="100"
              :step="5"
              show-input
              input-size="small"
            />
          </el-form-item>
        </el-col>
        
        <el-col :span="24">
          <el-form-item label="任务描述" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="4"
              placeholder="请输入任务描述"
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>
        </el-col>
        
        <el-col :span="24">
          <el-form-item label="标签">
            <el-tag
              v-for="tag in formData.tags"
              :key="tag"
              closable
              @close="removeTag(tag)"
              class="tag-item"
            >
              {{ tag }}
            </el-tag>
            
            <el-input
              v-if="inputVisible"
              ref="inputRef"
              v-model="inputValue"
              size="small"
              class="tag-input"
              @keyup.enter="handleInputConfirm"
              @blur="handleInputConfirm"
            />
            
            <el-button
              v-else
              size="small"
              @click="showInput"
            >
              + 添加标签
            </el-button>
          </el-form-item>
        </el-col>
        
        <el-col :span="24">
          <el-form-item label="关联任务">
            <el-select
              v-model="formData.related_tasks"
              multiple
              filterable
              remote
              :remote-method="searchTasks"
              :loading="taskLoading"
              placeholder="搜索并选择关联任务"
              style="width: 100%"
            >
              <el-option
                v-for="task in taskList"
                :key="task.id"
                :label="task.title"
                :value="task.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        

        
        <el-col :span="24">
          <el-form-item label="通知设置">
            <el-checkbox-group v-model="formData.notifications">
              <el-checkbox label="email">邮件通知</el-checkbox>
              <el-checkbox label="sms">短信通知</el-checkbox>
              <el-checkbox label="system">系统通知</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-col>
        
        <!-- 项目管理字段 -->
        <el-col v-if="isProjectCategory" :span="12">
          <el-form-item label="合同编号" prop="contract_number">
            <el-input v-model="formData.contract_number" placeholder="请输入合同编号" />
          </el-form-item>
        </el-col>
        <el-col v-if="isProjectCategory" :span="12">
          <el-form-item label="合同金额" prop="contract_amount">
            <el-input-number
              v-model="formData.contract_amount"
              :min="0"
              :precision="2"
              :step="0.01"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col v-if="isProjectCategory" :span="12">
          <el-form-item label="客户负责人" prop="client_owner">
            <el-input v-model="formData.client_owner" placeholder="请输入客户负责人" />
          </el-form-item>
        </el-col>
        <el-col v-if="isProjectCategory" :span="12">
          <el-form-item label="合同开始日期" prop="contract_start_date">
            <el-date-picker
              v-model="formData.contract_start_date"
              type="date"
              placeholder="请选择开始日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col v-if="isProjectCategory" :span="12">
          <el-form-item label="合同结束日期" prop="contract_end_date">
            <el-date-picker
              v-model="formData.contract_end_date"
              type="date"
              placeholder="请选择结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col v-if="isProjectCategory" :span="12">
          <el-form-item label="年度营收计划" prop="annual_revenue_plan">
            <el-input-number
              v-model="formData.annual_revenue_plan"
              :min="0"
              :precision="2"
              :step="0.01"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col v-if="isProjectCategory" :span="12">
          <el-form-item label="实际营收" prop="actual_revenue">
            <el-input-number
              v-model="formData.actual_revenue"
              :min="0"
              :precision="2"
              :step="0.01"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col v-if="isProjectCategory" :span="12">
          <el-form-item label="实际价值工作量" prop="actual_value_workload">
            <el-input-number
              v-model="formData.actual_value_workload"
              :min="0"
              :precision="2"
              :step="0.01"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col v-if="isProjectCategory" :span="12">
          <el-form-item label="实际成本" prop="actual_cost">
            <el-input-number
              v-model="formData.actual_cost"
              :min="0"
              :precision="2"
              :step="0.01"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        
        <el-col :span="24">
          <el-form-item label="通知设置">
            <el-checkbox-group v-model="formData.notifications">
              <el-checkbox label="email">邮件通知</el-checkbox>
              <el-checkbox label="sms">短信通知</el-checkbox>
              <el-checkbox label="system">系统通知</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usersApi } from '@/api/users'
import { useAuthStore } from '@/stores/auth'
import { useTasksStore } from '@/stores/tasks'
import { taskApi } from '@/api/tasks'
import type { FormInstance, FormRules } from 'element-plus'
import type { Task, User } from '@/types/task'

// 获取store
const authStore = useAuthStore()
const tasksStore = useTasksStore()

// Props
interface Props {
  modelValue: boolean
  task?: Task | null
  isEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  task: null,
  isEdit: false
})

// Emits
interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success', task: Task): void
}

const emit = defineEmits<Emits>()

// 响应式数据
const formRef = ref<FormInstance>()
const inputRef = ref()
const submitLoading = ref(false)
const userLoading = ref(false)
const taskLoading = ref(false)
const parentTaskLoading = ref(false)
const inputVisible = ref(false)
const inputValue = ref('')
const userList = ref<User[]>([])
const taskList = ref<Task[]>([])
const parentTaskList = ref<Task[]>([])

// 表单数据
const formData = ref({
  title: '',
  category: 'production_coordination',
  priority: 'medium',
  assigned_to: '',
  status: 'pending',
  start_date: '',
  due_date: '',
  estimated_hours: 0,
  progress: 0,
  description: '',
  tags: [] as string[],
  related_tasks: [] as string[],
  parent_id: '' as string | '',
  notifications: ['system'] as string[],
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

// 表单验证规则
const formRules: FormRules = {
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择任务类别', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  parent_id: [
    {
      validator: (rule, value, callback) => {
        // 允许为空（不选择上级）
        if (value === '' || value === null || typeof value === 'undefined') {
          return callback()
        }
        const v = String(value)
        // 不允许选择自身为上级
        if (props.isEdit && props.task && v === String(props.task.id)) {
          return callback(new Error('不能选择自身作为上级任务'))
        }
        // 校验是否存在于候选列表（避免类型不一致导致误判）
        const exists = parentTaskList.value.some(t => String(t.id) === v)
        if (!exists) {
          return callback(new Error('请选择有效的上级任务'))
        }
        return callback()
      },
      trigger: 'change'
    }
  ],
  due_date: [
    {
      validator: (rule, value, callback) => {
        if (value && formData.value.start_date && value <= formData.value.start_date) {
          callback(new Error('截止时间必须晚于开始时间'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  contract_number: [
    {
      validator: (rule, value, callback) => {
        if (formData.value.category !== 'project_management') return callback()
        if (!value) return callback(new Error('请输入合同编号'))
        callback()
      },
      trigger: 'blur'
    }
  ],
  contract_amount: [
    {
      validator: (rule, value, callback) => {
        if (formData.value.category !== 'project_management') return callback()
        if (value === null || value === undefined || value === '') {
          return callback(new Error('请输入合同金额'))
        }
        const num = Number(value)
        if (isNaN(num) || num < 0) {
          return callback(new Error('合同金额不能为负数'))
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  client_owner: [
    {
      validator: (rule, value, callback) => {
        if (formData.value.category !== 'project_management') return callback()
        if (!value) return callback(new Error('请输入客户负责人'))
        callback()
      },
      trigger: 'blur'
    }
  ],
  contract_start_date: [
    {
      validator: (rule, value, callback) => {
        if (formData.value.category !== 'project_management') return callback()
        if (!value) return callback(new Error('请选择合同开始日期'))
        if (formData.value.contract_end_date && value > formData.value.contract_end_date) {
          return callback(new Error('开始日期不能晚于结束日期'))
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  contract_end_date: [
    {
      validator: (rule, value, callback) => {
        if (formData.value.category !== 'project_management') return callback()
        if (!value) return callback(new Error('请选择合同结束日期'))
        if (formData.value.contract_start_date && value < formData.value.contract_start_date) {
          return callback(new Error('结束日期不能早于开始日期'))
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  annual_revenue_plan: [
    {
      validator: (rule, value, callback) => {
        if (formData.value.category !== 'project_management') return callback()
        if (value === null || value === undefined || value === '') {
          return callback(new Error('请输入年度营收计划'))
        }
        const num = Number(value)
        if (isNaN(num) || num < 0) {
          return callback(new Error('年度营收计划不能为负数'))
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  actual_revenue: [
    {
      validator: (rule, value, callback) => {
        if (formData.value.category !== 'project_management') return callback()
        if (value === null || value === undefined || value === '') {
          return callback(new Error('请输入实际营收'))
        }
        const num = Number(value)
        if (isNaN(num) || num < 0) {
          return callback(new Error('实际营收不能为负数'))
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  actual_value_workload: [
    {
      validator: (rule, value, callback) => {
        if (formData.value.category !== 'project_management') return callback()
        if (value === null || value === undefined || value === '') {
          return callback(new Error('请输入实际价值工作量'))
        }
        const num = Number(value)
        if (isNaN(num) || num < 0) {
          return callback(new Error('实际价值工作量不能为负数'))
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  actual_cost: [
    {
      validator: (rule, value, callback) => {
        if (formData.value.category !== 'project_management') return callback()
        if (value === null || value === undefined || value === '') {
          return callback(new Error('请输入实际成本'))
        }
        const num = Number(value)
        if (isNaN(num) || num < 0) {
          return callback(new Error('实际成本不能为负数'))
        }
        callback()
      },
      trigger: 'blur'
    }
  ]
}

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 加载用户列表
const loadUsers = async () => {
  userLoading.value = true
  try {
    const response = await usersApi.getUsersForAssignment({
      limit: 100
    })
    
    userList.value = response.users || response.data?.users || []
  } catch (error) {
    console.error('加载用户失败:', error)
    ElMessage.error('加载用户失败')
  } finally {
    userLoading.value = false
  }
}

// 搜索用户
const searchUsers = async (query: string) => {
  if (!query) {
    // 如果没有搜索关键词，显示所有用户
    await loadUsers()
    return
  }
  
  userLoading.value = true
  try {
    const response = await usersApi.getUsersForAssignment({
      keyword: query,
      limit: 20
    })
    
    userList.value = response.users || response.data?.users || []
  } catch (error) {
    console.error('搜索用户失败:', error)
    ElMessage.error('搜索用户失败')
  } finally {
    userLoading.value = false
  }
}

// 搜索任务
const searchTasks = async (query: string) => {
  if (!query) {
    taskList.value = []
    return
  }
  
  taskLoading.value = true
  try {
    // TODO: 调用API搜索任务
    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 300))
    taskList.value = [
      {
        id: '1',
        title: '用户登录功能开发',
        category: 'production_coordination',
        priority: 'high',
        status: 'completed',
        creator_id: '1',
        assignee_id: '2',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        title: '数据库性能优化',
        category: 'general_work',
        priority: 'medium',
        status: 'in_progress',
        creator_id: '1',
        assignee_id: '3',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      }
    ].filter(task => 
      task.title.includes(query) && 
      task.id !== props.task?.id // 排除当前任务
    )
  } catch (error) {
    ElMessage.error('搜索任务失败')
  } finally {
    taskLoading.value = false
  }
}

// 搜索上级任务（实时远程）
const searchParentTasks = async (query: string) => {
  if (!query) {
    parentTaskList.value = []
    return
  }

  parentTaskLoading.value = true
  try {
    const res = await taskApi.getTasks({ keyword: query, limit: 20 })
    const list = (res.data as any)?.tasks ?? (res.data as any)?.data ?? []
    const currentId = props.task?.id
    parentTaskList.value = list.filter((t: any) => String(t.id) !== String(currentId))
  } catch (error) {
    console.error('搜索上级任务失败:', error)
    ElMessage.error('搜索上级任务失败')
  } finally {
    parentTaskLoading.value = false
  }
}

// 显示标签输入框
const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// 确认输入标签
const handleInputConfirm = () => {
  const value = inputValue.value.trim()
  if (value && !formData.value.tags.includes(value)) {
    formData.value.tags.push(value)
  }
  inputVisible.value = false
  inputValue.value = ''
}

// 移除标签
const removeTag = (tag: string) => {
  const index = formData.value.tags.indexOf(tag)
  if (index > -1) {
    formData.value.tags.splice(index, 1)
  }
}



// 重置表单
const resetForm = () => {
  formData.value = {
    title: '',
    category: 'production_coordination',
    priority: 'medium',
    assigned_to: '',
    status: 'pending',
    start_date: '',
    due_date: '',
    estimated_hours: 0,
    progress: 0,
    description: '',
    tags: [],
    related_tasks: [],
    parent_id: '',
    notifications: ['system']
  }
  formRef.value?.clearValidate()
}

// 填充表单数据
const fillFormData = (task: Task) => {
  formData.value = {
    title: task.title || '',
    category: mapDatabaseCategory(task.category) || 'production_coordination',
    priority: task.priority || 'medium',
    assigned_to: task.assignee?.id || task.assigned_to || '',
    status: task.status || 'pending',
    start_date: task.start_date || '',
    due_date: task.due_date || '',
    estimated_hours: task.estimated_hours || 0,
    progress: task.progress || 0,
    description: task.description || '',
    tags: task.tags || [],
    related_tasks: (task as any).related_tasks || [],
    parent_id: (task as any).parent_id ? String((task as any).parent_id) : '',
    notifications: (task as any).notifications || ['system'],
    // 项目管理字段
    contract_number: (task as any).contract_number || '',
    contract_amount: (task as any).contract_amount ?? null,
    annual_revenue_plan: (task as any).annual_revenue_plan ?? null,
    client_owner: (task as any).client_owner || '',
    contract_start_date: (task as any).contract_start_date || '',
    contract_end_date: (task as any).contract_end_date || '',
    actual_revenue: (task as any).actual_revenue ?? null,
    actual_value_workload: (task as any).actual_value_workload ?? null,
    actual_cost: (task as any).actual_cost ?? null
  }
}

// 分类映射函数
const mapCategoryToDatabase = (category: string) => {
  const categoryMap: Record<string, string> = {
    'production_coordination': '生产协调',
    'project_management': '项目管理',
    'general_work': '综合工作'
  }
  return categoryMap[category] || category
}

// 反向映射：将数据库中的中文类别映射为前端枚举值
const mapDatabaseCategory = (dbCategory: string) => {
  const reverseMap: Record<string, string> = {
    '生产协调': 'production_coordination',
    '项目管理': 'project_management',
    '综合工作': 'general_work'
  }
  return reverseMap[dbCategory] || dbCategory
}

// 项目管理字段仅在“项目管理”类别下显示的计算属性
const isProjectCategory = computed(() => formData.value.category === 'project_management')

// 清空项目管理字段
const clearProjectFields = () => {
  formData.value.contract_number = ''
  formData.value.contract_amount = null
  formData.value.annual_revenue_plan = null
  formData.value.client_owner = ''
  formData.value.contract_start_date = ''
  formData.value.contract_end_date = ''
  formData.value.actual_revenue = null
  formData.value.actual_value_workload = null
  formData.value.actual_cost = null
}

// 类别切换时，如果不是项目管理则清空相关字段
watch(() => formData.value.category, (val) => {
  if (val !== 'project_management') {
    clearProjectFields()
  }
})

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitLoading.value = true

    const includePM = isProjectCategory.value

    if (props.isEdit && props.task) {
      // 更新任务
      const updateData = {
        title: formData.value.title,
        description: formData.value.description,
        category: mapCategoryToDatabase(formData.value.category),
        priority: formData.value.priority,
        assigned_to: formData.value.assigned_to || undefined,
        status: formData.value.status,
        start_date: formData.value.start_date || undefined,
        due_date: formData.value.due_date || undefined,
        estimated_hours: formData.value.estimated_hours,
        progress: formData.value.progress,
        tags: formData.value.tags,
        parent_id: formData.value.parent_id || undefined,
        ...(includePM ? {
          contract_number: formData.value.contract_number || undefined,
          contract_amount: formData.value.contract_amount ?? undefined,
          annual_revenue_plan: formData.value.annual_revenue_plan ?? undefined,
          client_owner: formData.value.client_owner || undefined,
          contract_start_date: formData.value.contract_start_date || undefined,
          contract_end_date: formData.value.contract_end_date || undefined,
          actual_revenue: formData.value.actual_revenue ?? undefined,
          actual_value_workload: formData.value.actual_value_workload ?? undefined,
          actual_cost: formData.value.actual_cost ?? undefined
        } : {})
      }

      const res = await tasksStore.updateTask(props.task.id, updateData)
      ElMessage.success('任务更新成功')
      emit('success', (res as any)?.data?.task ?? (res as any)?.data ?? props.task)
      visible.value = false
    } else {
      // 创建任务
      const createData = {
        title: formData.value.title,
        description: formData.value.description,
        category: mapCategoryToDatabase(formData.value.category),
        priority: formData.value.priority,
        status: formData.value.status,
        assigned_to: formData.value.assigned_to || undefined,
        start_date: formData.value.start_date || undefined,
        due_date: formData.value.due_date || undefined,
        estimated_hours: formData.value.estimated_hours,
        tags: formData.value.tags,
        parent_id: formData.value.parent_id || undefined,
        ...(includePM ? {
          contract_number: formData.value.contract_number || undefined,
          contract_amount: formData.value.contract_amount ?? undefined,
          annual_revenue_plan: formData.value.annual_revenue_plan ?? undefined,
          client_owner: formData.value.client_owner || undefined,
          contract_start_date: formData.value.contract_start_date || undefined,
          contract_end_date: formData.value.contract_end_date || undefined,
          actual_revenue: formData.value.actual_revenue ?? undefined,
          actual_value_workload: formData.value.actual_value_workload ?? undefined,
          actual_cost: formData.value.actual_cost ?? undefined
        } : {})
      }

      const res = await tasksStore.createTask(createData)
      ElMessage.success('任务创建成功')
      emit('success', (res as any)?.data?.task ?? (res as any)?.data)
      visible.value = false
    }
  } catch (error) {
    console.error('提交任务失败:', error)
    ElMessage.error('提交任务失败，请检查表单')
  } finally {
    submitLoading.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
  resetForm()
}

// 监听任务变化
watch(
  () => props.task,
  (newTask) => {
    if (newTask && props.isEdit) {
      fillFormData(newTask)
    }
  },
  { immediate: true }
)

// 监听对话框显示状态
watch(visible, (newVal) => {
  if (newVal) {
    // 根据角色决定是否加载用户列表
    if (authStore.isManager) {
      loadUsers()
    }
    
    if (props.isEdit && props.task) {
      fillFormData(props.task)
    } else {
      resetForm()
      // 如果不是管理员或经理，自动将负责人设置为自己
      if (!authStore.isManager) {
        formData.value.assigned_to = authStore.user?.id || ''
      }
    }
  }
})
</script>

<style scoped>
.user-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag-item {
  margin-right: 8px;
  margin-bottom: 8px;
}

.tag-input {
  width: 90px;
  margin-right: 8px;
  margin-bottom: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

:deep(.el-upload-dragger) {
  padding: 40px 20px;
}

:deep(.el-upload__tip) {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

:deep(.el-slider__input) {
  width: 80px;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
</style>