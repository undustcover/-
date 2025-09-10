<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑角色' : '新建角色'"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="role-form"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="角色名称" prop="name">
            <el-input
              v-model="form.name"
              placeholder="请输入角色名称"
            />
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="角色标识" prop="code">
            <el-input
              v-model="form.code"
              placeholder="请输入角色标识"
              :disabled="isEdit"
            />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-form-item label="角色描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入角色描述"
        />
      </el-form-item>
      
      <el-form-item label="权限配置" prop="permissions">
        <div class="permissions-container">
          <div
            v-for="group in permissionGroups"
            :key="group.key"
            class="permission-group"
          >
            <div class="group-header">
              <el-checkbox
                :model-value="isGroupAllSelected(group)"
                :indeterminate="isGroupIndeterminate(group)"
                @change="handleGroupChange(group, $event)"
              >
                <span class="group-title">{{ group.name }}</span>
              </el-checkbox>
            </div>
            
            <div class="group-permissions">
              <el-checkbox
                v-for="permission in group.permissions"
                :key="permission.key"
                v-model="form.permissions"
                :label="permission.key"
                class="permission-item"
              >
                {{ permission.name }}
              </el-checkbox>
            </div>
          </div>
        </div>
      </el-form-item>
      
      <el-form-item label="状态">
        <el-switch
          v-model="form.is_active"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>
      
      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="2"
          placeholder="请输入备注信息"
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="loading"
        >
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

interface RoleForm {
  name: string
  code: string
  description: string
  permissions: string[]
  is_active: boolean
  remark: string
}

interface Permission {
  key: string
  name: string
}

interface PermissionGroup {
  key: string
  name: string
  permissions: Permission[]
}

interface Props {
  modelValue: boolean
  roleData?: any
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = withDefaults(defineProps<Props>(), {
  roleData: null
})

const emit = defineEmits<Emits>()

// 响应式数据
const formRef = ref<FormInstance>()
const loading = ref(false)

// 表单数据
const form = reactive<RoleForm>({
  name: '',
  code: '',
  description: '',
  permissions: [],
  is_active: true,
  remark: ''
})

// 权限分组
const permissionGroups: PermissionGroup[] = [
  {
    key: 'user',
    name: '用户管理',
    permissions: [
      { key: 'user:read', name: '查看用户' },
      { key: 'user:write', name: '管理用户' },
      { key: 'user:delete', name: '删除用户' }
    ]
  },
  {
    key: 'role',
    name: '角色管理',
    permissions: [
      { key: 'role:read', name: '查看角色' },
      { key: 'role:write', name: '管理角色' },
      { key: 'role:delete', name: '删除角色' }
    ]
  },
  {
    key: 'task',
    name: '任务管理',
    permissions: [
      { key: 'task:read', name: '查看任务' },
      { key: 'task:write', name: '管理任务' },
      { key: 'task:delete', name: '删除任务' },
      { key: 'task:assign', name: '分配任务' }
    ]
  },
  {
    key: 'project',
    name: '项目管理',
    permissions: [
      { key: 'project:read', name: '查看项目' },
      { key: 'project:write', name: '管理项目' },
      { key: 'project:delete', name: '删除项目' }
    ]
  },
  {
    key: 'file',
    name: '文件管理',
    permissions: [
      { key: 'file:read', name: '查看文件' },
      { key: 'file:write', name: '管理文件' },
      { key: 'file:delete', name: '删除文件' },
      { key: 'file:upload', name: '上传文件' }
    ]
  },
  {
    key: 'report',
    name: '报表统计',
    permissions: [
      { key: 'report:read', name: '查看报表' },
      { key: 'report:export', name: '导出报表' }
    ]
  },
  {
    key: 'system',
    name: '系统管理',
    permissions: [
      { key: 'system:read', name: '查看系统设置' },
      { key: 'system:write', name: '管理系统设置' },
      { key: 'system:log', name: '查看系统日志' }
    ]
  }
]

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.roleData)

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '角色名称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入角色标识', trigger: 'blur' },
    { min: 2, max: 20, message: '角色标识长度在 2 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '角色标识只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入角色描述', trigger: 'blur' },
    { max: 200, message: '描述不能超过 200 个字符', trigger: 'blur' }
  ],
  permissions: [
    {
      type: 'array',
      required: true,
      message: '请至少选择一个权限',
      trigger: 'change',
      min: 1
    }
  ]
}

// 检查分组是否全选
const isGroupAllSelected = (group: PermissionGroup): boolean => {
  return group.permissions.every(permission => 
    form.permissions.includes(permission.key)
  )
}

// 检查分组是否半选
const isGroupIndeterminate = (group: PermissionGroup): boolean => {
  const selectedCount = group.permissions.filter(permission => 
    form.permissions.includes(permission.key)
  ).length
  
  return selectedCount > 0 && selectedCount < group.permissions.length
}

// 处理分组选择变化
const handleGroupChange = (group: PermissionGroup, checked: boolean) => {
  if (checked) {
    // 全选该分组
    group.permissions.forEach(permission => {
      if (!form.permissions.includes(permission.key)) {
        form.permissions.push(permission.key)
      }
    })
  } else {
    // 取消该分组的所有选择
    group.permissions.forEach(permission => {
      const index = form.permissions.indexOf(permission.key)
      if (index > -1) {
        form.permissions.splice(index, 1)
      }
    })
  }
}

// 监听角色数据变化
watch(
  () => props.roleData,
  (newData) => {
    if (newData) {
      // 编辑模式，填充表单数据
      Object.assign(form, {
        name: newData.name || '',
        code: newData.code || '',
        description: newData.description || '',
        permissions: [...(newData.permissions || [])],
        is_active: newData.is_active ?? true,
        remark: newData.remark || ''
      })
    }
  },
  { immediate: true }
)

// 监听对话框显示状态
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && !props.roleData) {
      // 新建模式，重置表单
      resetForm()
    }
  }
)

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    name: '',
    code: '',
    description: '',
    permissions: [],
    is_active: true,
    remark: ''
  })
  
  formRef.value?.clearValidate()
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
  resetForm()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    loading.value = true
    
    // 准备提交数据
    const submitData = { ...form }
    
    // TODO: 调用API创建或更新角色
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success(isEdit.value ? '角色更新成功' : '角色创建成功')
    emit('success')
    handleClose()
    
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.role-form {
  padding: 0 20px;
}

.permissions-container {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.permission-group {
  margin-bottom: 20px;
}

.permission-group:last-child {
  margin-bottom: 0;
}

.group-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.group-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.group-permissions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  padding-left: 24px;
}

.permission-item {
  margin: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

:deep(.el-checkbox) {
  height: auto;
  line-height: 1.5;
}

:deep(.el-checkbox__label) {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

@media (max-width: 768px) {
  .role-form {
    padding: 0 10px;
  }
  
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto;
  }
  
  :deep(.el-col) {
    width: 100% !important;
  }
  
  .group-permissions {
    grid-template-columns: 1fr;
    padding-left: 16px;
  }
  
  .permissions-container {
    max-height: 300px;
  }
}
</style>