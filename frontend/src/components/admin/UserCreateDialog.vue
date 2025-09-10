<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑用户' : '新建用户'"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="user-form"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              :disabled="isEdit"
            />
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="真实姓名" prop="real_name">
            <el-input
              v-model="form.real_name"
              placeholder="请输入真实姓名"
            />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="form.email"
              placeholder="请输入邮箱"
              type="email"
            />
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="手机号" prop="phone">
            <el-input
              v-model="form.phone"
              placeholder="请输入手机号"
            />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="岗位" prop="department">
            <el-select
              v-model="form.department"
              placeholder="请选择岗位"
              style="width: 100%"
            >
              <el-option
                v-for="dept in departments"
                :key="dept.value"
                :label="dept.label"
                :value="dept.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="角色" prop="role">
            <el-select
              v-model="form.role"
              placeholder="请选择角色"
              style="width: 100%"
            >
              <el-option
                v-for="role in roles"
                :key="role.value"
                :label="role.label"
                :value="role.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" v-if="!isEdit">
        <el-col :span="12">
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              show-password
            />
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="确认密码" prop="confirm_password">
            <el-input
              v-model="form.confirm_password"
              type="password"
              placeholder="请再次输入密码"
              show-password
            />
          </el-form-item>
        </el-col>
      </el-row>
      
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
          :rows="3"
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
import { usersApi, type CreateUserRequest } from '@/api/users'

interface UserForm {
  username: string
  real_name: string
  email: string
  phone: string
  department: string
  role: string
  password: string
  confirm_password: string
  is_active: boolean
  remark: string
}

interface Props {
  modelValue: boolean
  userData?: any
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = withDefaults(defineProps<Props>(), {
  userData: null
})

const emit = defineEmits<Emits>()

// 响应式数据
const formRef = ref<FormInstance>()
const loading = ref(false)

// 表单数据
const form = reactive<UserForm>({
  username: '',
  real_name: '',
  email: '',
  phone: '',
  department: '',
  role: 'user',
  password: '',
  confirm_password: '',
  is_active: true,
  remark: ''
})

// 岗位选项
const departments = [
  { label: '生产信息管理岗', value: '生产信息管理岗' },
  { label: '生产计划岗', value: '生产计划岗' },
  { label: '生产协调岗', value: '生产协调岗' },
  { label: '项目评价岗', value: '项目评价岗' },
  { label: '项目监控岗', value: '项目监控岗' },
  { label: '值班工程师', value: '值班工程师' },
  { label: '应急管理岗', value: '应急管理岗' }
]

// 角色选项
const roles = [
  { label: '普通用户', value: 'user' },
  { label: '项目经理', value: 'manager' },
  { label: '管理员', value: 'admin' }
]

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.userData)

// 自定义验证规则
const validateConfirmPassword = (rule: any, value: string, callback: Function) => {
  // 编辑模式下，如果密码为空，确认密码也可以为空
  if (isEdit.value && form.password === '' && value === '') {
    callback()
    return
  }
  
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

// 表单验证规则
const rules = computed((): FormRules => {
  const baseRules: FormRules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
      { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
    ],
    real_name: [
      { required: true, message: '请输入真实姓名', trigger: 'blur' },
      { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' }
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    phone: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
    ],
    department: [
      { required: true, message: '请选择部门', trigger: 'change' }
    ],
    role: [
      { required: true, message: '请选择角色', trigger: 'change' }
    ]
  }
  
  // 密码验证规则：新建时必填，编辑时可选
  if (isEdit.value) {
    // 编辑模式：密码可选，但如果填写则需要符合格式
    baseRules.password = [
      { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
      {
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
        message: '密码必须包含大小写字母和数字',
        trigger: 'blur'
      }
    ]
    baseRules.confirm_password = [
      { validator: validateConfirmPassword, trigger: 'blur' }
    ]
  } else {
    // 新建模式：密码必填
    baseRules.password = [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
      {
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
        message: '密码必须包含大小写字母和数字',
        trigger: 'blur'
      }
    ]
    baseRules.confirm_password = [
      { validator: validateConfirmPassword, trigger: 'blur' }
    ]
  }
  
  return baseRules
})

// 监听用户数据变化
watch(
  () => props.userData,
  (newData) => {
    if (newData) {
      // 编辑模式，填充表单数据
      Object.assign(form, {
        username: newData.username || '',
        real_name: newData.real_name || '',
        email: newData.email || '',
        phone: newData.phone || '',
        department: newData.position || '', // 使用position字段作为部门/岗位
        role: newData.role || 'user',
        password: '',
        confirm_password: '',
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
    if (newValue && !props.userData) {
      // 新建模式，重置表单
      resetForm()
    }
  }
)

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    username: '',
    real_name: '',
    email: '',
    phone: '',
    department: '',
    role: 'user',
    password: '',
    confirm_password: '',
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
    
    // 编辑模式下不提交密码字段（如果为空）
    if (isEdit.value && !submitData.password) {
      delete submitData.password
      delete submitData.confirm_password
    }
    
    if (isEdit.value) {
      // 调用更新用户API
      const updateData: UpdateUserRequest = {
        real_name: submitData.real_name,
        phone: submitData.phone,
        position: submitData.department, // 前端使用department字段，后端使用position字段
        role: submitData.role
      }
      
      // 如果密码不为空，则更新密码
      if (submitData.password) {
        updateData.password = submitData.password
      }
      
      await usersApi.updateUser(props.userData!.id, updateData)
      ElMessage.success('用户更新成功')
    } else {
      // 创建新用户
      const createData: CreateUserRequest = {
        username: submitData.username,
        email: submitData.email,
        password: submitData.password,
        real_name: submitData.real_name,
        phone: submitData.phone,
        position: submitData.department, // 前端使用department字段，后端使用position字段
        role: submitData.role
      }
      
      await usersApi.createUser(createData)
      ElMessage.success('用户创建成功')
    }
    
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
.user-form {
  padding: 0 20px;
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

:deep(.el-select) {
  width: 100%;
}

@media (max-width: 768px) {
  .user-form {
    padding: 0 10px;
  }
  
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto;
  }
  
  :deep(.el-col) {
    width: 100% !important;
  }
}
</style>