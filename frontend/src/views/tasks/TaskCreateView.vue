<template>
  <div class="task-create-view">
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
        <h1 class="page-title">创建任务</h1>
      </div>
    </div>
    
    <el-card class="create-form-card">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        @submit.prevent="handleSubmit"
      >
        <div class="form-grid">
          <!-- 左侧表单 -->
          <div class="form-left">
            <el-form-item label="任务标题" prop="title">
              <el-input
                v-model="form.title"
                placeholder="请输入任务标题"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="任务描述" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="6"
                placeholder="请输入任务描述"
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="任务类型" prop="category">
              <el-select v-model="form.category" placeholder="请选择任务类型">
                <el-option label="生产协调" value="production_coordination" />
                <el-option label="项目管理" value="project_management" />
                <el-option label="综合工作" value="general_work" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="form.priority" placeholder="请选择优先级">
                <el-option label="低" value="low" />
                <el-option label="中" value="medium" />
                <el-option label="高" value="high" />
                <el-option label="紧急" value="urgent" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="负责人" prop="assignee_id">
              <el-select
                v-model="form.assignee_id"
                placeholder="请选择负责人"
                filterable
                clearable
              >
                <el-option
                  v-for="user in users"
                  :key="user.id"
                  :label="user.real_name"
                  :value="user.id"
                >
                  <div class="user-option">
                    <el-avatar :size="20" :src="user.avatar">
                      {{ user.real_name?.charAt(0) }}
                    </el-avatar>
                    <span>{{ user.real_name }}</span>
                    <span class="user-department">{{ user.department }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="截止时间" prop="due_date">
              <el-date-picker
                v-model="form.due_date"
                type="datetime"
                placeholder="请选择截止时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                :disabled-date="disabledDate"
              />
            </el-form-item>
            
            <el-form-item label="预估工时" prop="estimated_hours">
              <el-input-number
                v-model="form.estimated_hours"
                :min="0"
                :max="999"
                :step="0.5"
                placeholder="预估工时（小时）"
              />
            </el-form-item>
          </div>
          
          <!-- 右侧表单 -->
          <div class="form-right">
            <el-form-item label="标签">
              <el-select
                v-model="form.tags"
                multiple
                filterable
                allow-create
                placeholder="请选择或输入标签"
              >
                <el-option
                  v-for="tag in availableTags"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                />
              </el-select>
            </el-form-item>
            

            
            <el-form-item label="关联任务">
              <el-select
                v-model="form.related_tasks"
                multiple
                filterable
                remote
                placeholder="搜索关联任务"
                :remote-method="searchTasks"
                :loading="searchLoading"
              >
                <el-option
                  v-for="task in searchResults"
                  :key="task.id"
                  :label="task.title"
                  :value="task.id"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="通知设置">
              <el-checkbox-group v-model="form.notifications">
                <el-checkbox label="email">邮件通知</el-checkbox>
                <el-checkbox label="system">系统通知</el-checkbox>
                <el-checkbox label="sms">短信通知</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <el-form-item label="其他选项">
              <el-checkbox v-model="form.is_private">私有任务</el-checkbox>
              <el-checkbox v-model="form.auto_assign">自动分配</el-checkbox>
            </el-form-item>
          </div>
        </div>
        
        <!-- 表单操作 -->
        <div class="form-actions">
          <el-button @click="$router.back()">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            创建任务
          </el-button>
          <el-button type="success" :loading="submitting" @click="handleSubmitAndContinue">
            创建并继续
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { ArrowLeft, UploadFilled } from '@element-plus/icons-vue'
import { useTasksStore } from '@/stores/tasks'
import { usersApi } from '@/api/users'
import type { CreateTaskRequest } from '@/types/task'

const router = useRouter()
const tasksStore = useTasksStore()

// 表单引用
const formRef = ref<FormInstance>()
const uploadRef = ref()

// 响应式数据
const submitting = ref(false)
const searchLoading = ref(false)

const users = ref([])
const availableTags = ref(['前端', '后端', '测试', '设计', '文档', '优化', '重构'])
const searchResults = ref([])

// 表单数据
const form = reactive<CreateTaskRequest>({
  title: '',
  description: '',
  category: 'general_work',
  priority: 'medium',
  assignee_id: '',
  due_date: '',
  estimated_hours: 0,
  tags: [],
  related_tasks: [],
  notifications: ['system'],
  is_private: false,
  auto_assign: false
})

// 表单验证规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择任务类型', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  due_date: [
    { required: true, message: '请选择截止时间', trigger: 'change' }
  ]
}

// 禁用过去的日期
const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 8.64e7 // 昨天之前的日期
}



// 搜索任务
const searchTasks = async (query: string) => {
  if (!query) {
    searchResults.value = []
    return
  }
  
  searchLoading.value = true
  try {
    // TODO: 调用API搜索任务
    // 模拟搜索结果
    await new Promise(resolve => setTimeout(resolve, 300))
    searchResults.value = [
      { id: '1', title: '相关任务1' },
      { id: '2', title: '相关任务2' }
    ].filter(task => task.title.includes(query))
  } catch (error) {
    ElMessage.error('搜索任务失败')
  } finally {
    searchLoading.value = false
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

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    submitting.value = true
    
    const taskData = {
      ...form,
      category: mapCategoryToDatabase(form.category)
    }
    
    await tasksStore.createTask(taskData)
    ElMessage.success('任务创建成功')
    router.push('/tasks')
  } catch (error) {
    if (error !== 'validation failed') {
      ElMessage.error('创建任务失败')
    }
  } finally {
    submitting.value = false
  }
}

// 提交并继续创建
const handleSubmitAndContinue = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    submitting.value = true
    
    const taskData = {
      ...form,
      category: mapCategoryToDatabase(form.category)
    }
    await tasksStore.createTask(taskData)
    
    ElMessage.success('任务创建成功')
    
    // 重置表单
    formRef.value.resetFields()
    Object.assign(form, {
      title: '',
      description: '',
      category: 'general_work',
      priority: 'medium',
      assignee_id: '',
      due_date: '',
      estimated_hours: 0,
      tags: [],
      related_tasks: [],
      notifications: ['system'],
      is_private: false,
      auto_assign: false
    })

  } catch (error) {
    if (error !== 'validation failed') {
      ElMessage.error('创建任务失败')
    }
  } finally {
    submitting.value = false
  }
}

// 获取用户列表
const fetchUsers = async () => {
  try {
    const response = await usersApi.getUsers({
      status: 'active',
      role: 'user,manager',
      limit: 100 // 获取所有活跃用户
    })
    
    users.value = response.data.users
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.task-create-view {
  padding: 20px;
}

.create-form-card {
  max-width: 1200px;
  margin: 20px auto 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.form-left,
.form-right {
  display: flex;
  flex-direction: column;
}

.user-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-department {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: auto;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 120px;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>