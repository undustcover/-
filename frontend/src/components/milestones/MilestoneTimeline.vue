<template>
  <div class="milestone-timeline">
    <!-- 头部操作区 -->
    <div class="timeline-header">
      <h3 class="timeline-title">
        <el-icon><Clock /></el-icon>
        里程碑时间轴
      </h3>
      <el-button 
        type="primary" 
        size="small" 
        @click="showAddDialog = true"
        :disabled="!taskId"
      >
        <el-icon><Plus /></el-icon>
        添加里程碑
      </el-button>
    </div>

    <!-- 时间轴内容 -->
    <div class="timeline-content" v-loading="loading">
      <el-empty v-if="!loading && milestones.length === 0" description="暂无里程碑" />
      
      <el-timeline v-else>
        <el-timeline-item
          v-for="milestone in sortedMilestones"
          :key="milestone.id"
          :type="getTimelineType(milestone)"
          :color="getTimelineColor(milestone)"
          :timestamp="formatDate(milestone.target_date)"
          placement="top"
        >
          <div class="milestone-item">
            <div class="milestone-header">
              <div class="milestone-info">
                <h4 class="milestone-title">
                  {{ milestone.title }}
                  <el-tag 
                    v-if="milestone.is_achieved" 
                    type="success" 
                    size="small"
                  >
                    已完成
                  </el-tag>
                  <el-tag 
                    v-else-if="isOverdue(milestone)" 
                    type="danger" 
                    size="small"
                  >
                    已逾期
                  </el-tag>
                  <el-tag 
                    v-else-if="isUpcoming(milestone)" 
                    type="warning" 
                    size="small"
                  >
                    即将到期
                  </el-tag>
                </h4>
                <p v-if="milestone.description" class="milestone-description">
                  {{ milestone.description }}
                </p>
              </div>
              
              <div class="milestone-actions">
                <el-button-group size="small">
                  <el-button 
                    v-if="!milestone.is_achieved"
                    type="success"
                    @click="markAsAchieved(milestone)"
                    :loading="actionLoading === milestone.id"
                  >
                    <el-icon><Check /></el-icon>
                  </el-button>
                  <el-button 
                    @click="editMilestone(milestone)"
                    :loading="actionLoading === milestone.id"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button 
                    type="danger"
                    @click="deleteMilestone(milestone)"
                    :loading="actionLoading === milestone.id"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </el-button-group>
              </div>
            </div>
            
            <div class="milestone-meta">
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                目标日期: {{ formatDate(milestone.target_date) }}
              </span>
              <span v-if="milestone.achieved_date" class="meta-item">
                <el-icon><Check /></el-icon>
                完成日期: {{ formatDate(milestone.achieved_date) }}
              </span>
              <span v-if="milestone.reminder_days" class="meta-item">
                <el-icon><Bell /></el-icon>
                提前 {{ milestone.reminder_days }} 天提醒
              </span>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>

    <!-- 添加/编辑里程碑对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingMilestone ? '编辑里程碑' : '添加里程碑'"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="milestoneForm"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input 
            v-model="milestoneForm.title" 
            placeholder="请输入里程碑标题"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="milestoneForm.description" 
            type="textarea"
            placeholder="请输入里程碑描述（可选）"
            :rows="3"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="目标日期" prop="target_date">
          <el-date-picker
            v-model="milestoneForm.target_date"
            type="date"
            placeholder="选择目标日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="提醒设置" prop="reminder_days">
          <el-select 
            v-model="milestoneForm.reminder_days" 
            placeholder="选择提醒时间"
            style="width: 100%"
            clearable
          >
            <el-option label="不提醒" :value="0" />
            <el-option label="提前1天" :value="1" />
            <el-option label="提前3天" :value="3" />
            <el-option label="提前7天" :value="7" />
            <el-option label="提前15天" :value="15" />
            <el-option label="提前30天" :value="30" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="submitForm"
          :loading="submitLoading"
        >
          {{ editingMilestone ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Clock, Plus, Check, Edit, Delete, Calendar, Bell } from '@element-plus/icons-vue'
import { milestoneApi } from '@/api/milestones'
import type { Milestone, CreateMilestoneRequest, UpdateMilestoneRequest } from '@/types/milestone'
import { formatDateTime } from '@/utils/date'

// Props
interface Props {
  taskId: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  milestoneUpdated: []
}>()

// 响应式数据
const loading = ref(false)
const actionLoading = ref('')
const submitLoading = ref(false)
const showAddDialog = ref(false)
const milestones = ref<Milestone[]>([])
const editingMilestone = ref<Milestone | null>(null)

// 表单相关
const formRef = ref<FormInstance>()
const milestoneForm = ref<CreateMilestoneRequest & { id?: string }>({
  task_id: props.taskId,
  title: '',
  description: '',
  target_date: '',
  reminder_days: 7
})

const formRules: FormRules = {
  title: [
    { required: true, message: '请输入里程碑标题', trigger: 'blur' },
    { min: 1, max: 200, message: '标题长度在 1 到 200 个字符', trigger: 'blur' }
  ],
  target_date: [
    { required: true, message: '请选择目标日期', trigger: 'change' }
  ]
}

// 计算属性
const sortedMilestones = computed(() => {
  return [...milestones.value].sort((a, b) => {
    // 按目标日期排序，未完成的在前
    if (a.is_achieved !== b.is_achieved) {
      return a.is_achieved ? 1 : -1
    }
    return new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
  })
})

// 方法
const loadMilestones = async () => {
  if (!props.taskId) {
    console.log('loadMilestones skipped: taskId is missing.');
    return;
  }
  
  console.log(`loadMilestones called with taskId: ${props.taskId}`);
  loading.value = true
  try {
    const response = await milestoneApi.getMilestonesByTaskId(props.taskId)
    console.log('API response received:', response);
    milestones.value = response.data.data || []
    console.log('Milestones data updated:', milestones.value);
  } catch (error) {
    console.error('加载里程碑失败:', error)
    ElMessage.error('加载里程碑失败')
  } finally {
    loading.value = false
  }
}

const getTimelineType = (milestone: Milestone) => {
  if (milestone.is_achieved) return 'success'
  if (isOverdue(milestone)) return 'danger'
  if (isUpcoming(milestone)) return 'warning'
  return 'primary'
}

const getTimelineColor = (milestone: Milestone) => {
  if (milestone.is_achieved) return '#67c23a'
  if (isOverdue(milestone)) return '#f56c6c'
  if (isUpcoming(milestone)) return '#e6a23c'
  return '#409eff'
}

const isOverdue = (milestone: Milestone) => {
  if (milestone.is_achieved) return false
  return new Date(milestone.target_date) < new Date()
}

const isUpcoming = (milestone: Milestone) => {
  if (milestone.is_achieved) return false
  const targetDate = new Date(milestone.target_date)
  const now = new Date()
  const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays <= 7 && diffDays >= 0
}

const formatDate = (dateStr: string) => {
  return formatDateTime(dateStr, 'YYYY-MM-DD')
}

const editMilestone = (milestone: Milestone) => {
  editingMilestone.value = milestone
  milestoneForm.value = {
    id: milestone.id,
    task_id: milestone.task_id,
    title: milestone.title,
    description: milestone.description || '',
    target_date: milestone.target_date,
    reminder_days: milestone.reminder_days || 7
  }
  showAddDialog.value = true
}

const markAsAchieved = async (milestone: Milestone) => {
  try {
    await ElMessageBox.confirm(
      `确定要标记里程碑"${milestone.title}"为已完成吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    actionLoading.value = milestone.id
    await milestoneApi.markMilestoneAsAchieved(milestone.id, {
      achieved_date: new Date().toISOString().split('T')[0]
    })
    
    ElMessage.success('里程碑已标记为完成')
    await loadMilestones()
    emit('milestoneUpdated')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('标记里程碑完成失败:', error)
      ElMessage.error('标记里程碑完成失败')
    }
  } finally {
    actionLoading.value = ''
  }
}

const deleteMilestone = async (milestone: Milestone) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除里程碑"${milestone.title}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    actionLoading.value = milestone.id
    await milestoneApi.deleteMilestone(milestone.id)
    
    ElMessage.success('里程碑已删除')
    await loadMilestones()
    emit('milestoneUpdated')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除里程碑失败:', error)
      ElMessage.error('删除里程碑失败')
    }
  } finally {
    actionLoading.value = ''
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    submitLoading.value = true
    
    if (editingMilestone.value) {
      // 更新里程碑
      const updateData: UpdateMilestoneRequest = {
        title: milestoneForm.value.title,
        description: milestoneForm.value.description,
        target_date: milestoneForm.value.target_date,
        reminder_days: milestoneForm.value.reminder_days
      }
      await milestoneApi.updateMilestone(editingMilestone.value.id, updateData)
      ElMessage.success('里程碑更新成功')
    } else {
      // 创建里程碑
      const createData: CreateMilestoneRequest = {
        task_id: props.taskId,
        title: milestoneForm.value.title,
        description: milestoneForm.value.description,
        target_date: milestoneForm.value.target_date,
        reminder_days: milestoneForm.value.reminder_days
      }
      await milestoneApi.createMilestone(createData)
      ElMessage.success('里程碑创建成功')
    }
    
    showAddDialog.value = false
    await loadMilestones()
    emit('milestoneUpdated')
  } catch (error) {
    console.error('提交里程碑失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    submitLoading.value = false
  }
}

const resetForm = () => {
  editingMilestone.value = null
  milestoneForm.value = {
    task_id: props.taskId,
    title: '',
    description: '',
    target_date: '',
    reminder_days: 7
  }
  formRef.value?.resetFields()
}

watch(
  () => props.taskId,
  (newTaskId) => {
    if (newTaskId) {
      milestoneForm.value.task_id = newTaskId
      loadMilestones()
    } else {
      // 如果 taskId 变为无效，清空里程碑列表
      milestones.value = []
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.milestone-timeline {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.timeline-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-content {
  min-height: 200px;
}

.milestone-item {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 8px;
}

.milestone-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.milestone-info {
  flex: 1;
}

.milestone-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.milestone-description {
  margin: 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.milestone-actions {
  margin-left: 16px;
}

.milestone-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.el-timeline-item__timestamp) {
  font-size: 12px;
  font-weight: 500;
}

:deep(.el-timeline-item__content) {
  padding-bottom: 16px;
}

:deep(.el-empty) {
  padding: 40px 0;
}
</style>