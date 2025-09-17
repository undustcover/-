<template>
  <div class="file-manager-view">
    <div class="page-header">
      <h1 class="page-title">文件管理</h1>
      <div class="header-actions">
        <el-button @click="refreshFiles">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        
        <el-upload
          ref="uploadRef"
          :action="uploadUrl"
          :headers="uploadHeaders"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :before-upload="beforeUpload"
          :show-file-list="false"
          multiple
        >
          <el-button type="primary">
            <el-icon><Upload /></el-icon>
            上传文件
          </el-button>
        </el-upload>
        
        <el-button @click="showCreateFolderDialog = true">
          <el-icon><FolderAdd /></el-icon>
          新建文件夹
        </el-button>
      </div>
    </div>
    
    <!-- 面包屑导航 -->
    <el-card class="breadcrumb-card">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>
          <el-button
            text
            @click="navigateToPath('')"
            :class="{ active: currentPath === '' }"
          >
            <el-icon><HomeFilled /></el-icon>
            根目录
          </el-button>
        </el-breadcrumb-item>
        <el-breadcrumb-item
          v-for="(segment, index) in pathSegments"
          :key="index"
        >
          <el-button
            text
            @click="navigateToPath(getPathUpTo(index))"
            :class="{ active: index === pathSegments.length - 1 }"
          >
            {{ segment }}
          </el-button>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>
    
    <!-- 工具栏 -->
    <el-card class="toolbar-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button-group>
            <el-button
              :type="viewMode === 'list' ? 'primary' : ''"
              @click="setViewMode('list')"
            >
              <el-icon><List /></el-icon>
              列表
            </el-button>
            <el-button
              :type="viewMode === 'grid' ? 'primary' : ''"
              @click="setViewMode('grid')"
            >
              <el-icon><Grid /></el-icon>
              网格
            </el-button>
          </el-button-group>
          
          <el-input
            v-model="searchKeyword"
            placeholder="搜索文件或文件夹"
            clearable
            style="width: 300px; margin-left: 16px;"
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        
        <div class="toolbar-right">
          <el-select
            v-model="sortBy"
            placeholder="排序方式"
            style="width: 120px;"
            @change="handleSort"
          >
            <el-option label="名称" value="name" />
            <el-option label="大小" value="size" />
            <el-option label="类型" value="type" />
            <el-option label="修改时间" value="modified" />
          </el-select>
          
          <el-button
            :icon="sortOrder === 'asc' ? 'sort-up' : 'sort-down'"
            @click="toggleSortOrder"
          >
            {{ sortOrder === 'asc' ? '升序' : '降序' }}
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- 文件列表 -->
    <el-card class="file-list-card" v-loading="loading">
      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="list-view">
        <el-table
          :data="filteredFiles"
          @selection-change="handleSelectionChange"
          @row-dblclick="handleDoubleClick"
        >
          <el-table-column type="selection" width="55" />
          
          <el-table-column label="名称" min-width="300">
            <template #default="{ row }">
              <div class="file-item" @click="selectFile(row)">
                <el-icon class="file-icon" :class="getFileIconClass(row)">
                  <component :is="getFileIcon(row)" />
                </el-icon>
                <span class="file-name">{{ row.original_name || row.filename }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="大小" width="120">
            <template #default="{ row }">
              <span>{{ formatFileSize(row.file_size) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="类型" width="120">
            <template #default="{ row }">
              <el-tag
                type="info"
                size="small"
                effect="plain"
              >
                {{ getFileTypeText(row) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="上传时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.uploaded_at) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button
                size="small"
                @click="downloadFile(row)"
              >
                <el-icon><Download /></el-icon>
                下载
              </el-button>
              
              <el-button
                size="small"
                type="danger"
                @click="deleteFile(row)"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 网格视图 -->
      <div v-else class="grid-view">
        <div class="file-grid">
          <div
            v-for="file in filteredFiles"
            :key="file.id"
            class="file-card"
            :class="{ selected: selectedFiles.includes(file.id) }"
            @click="selectFile(file)"
            @dblclick="handleDoubleClick(file)"
          >
            <div class="file-card-icon">
              <el-icon :class="getFileIconClass(file)">
                <component :is="getFileIcon(file)" />
              </el-icon>
            </div>
            
            <div class="file-card-info">
              <div class="file-card-name" :title="file.original_name || file.filename">
                {{ file.original_name || file.filename }}
              </div>
              <div class="file-card-meta">
                <span class="file-size">
                  {{ formatFileSize(file.file_size) }}
                </span>
                <span class="file-date">
                  {{ formatDate(file.uploaded_at) }}
                </span>
              </div>
            </div>
            
            <div class="file-card-actions">
              <el-dropdown trigger="click">
                <el-button size="small" circle>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="downloadFile(file)">
                      <el-icon><Download /></el-icon>
                      下载
                    </el-dropdown-item>
                    <el-dropdown-item @click="deleteFile(file)">
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <el-empty
        v-if="!loading && filteredFiles.length === 0"
        description="暂无文件"
      >
        <el-button type="primary" @click="$refs.uploadRef.$el.click()">
          上传文件
        </el-button>
      </el-empty>
    </el-card>
    
    <!-- 分页 -->
    <div class="pagination-container" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 新建文件夹对话框 -->
    <el-dialog
      v-model="showCreateFolderDialog"
      title="新建文件夹"
      width="400px"
    >
      <el-form :model="folderForm" :rules="folderRules" ref="folderFormRef">
        <el-form-item label="文件夹名称" prop="name">
          <el-input
            v-model="folderForm.name"
            placeholder="请输入文件夹名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateFolderDialog = false">取消</el-button>
        <el-button type="primary" @click="createFolder" :loading="creating">
          确定
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 重命名对话框 -->
    <el-dialog
      v-model="showRenameDialog"
      title="重命名"
      width="400px"
    >
      <el-form :model="renameForm" :rules="renameRules" ref="renameFormRef">
        <el-form-item label="新名称" prop="name">
          <el-input
            v-model="renameForm.name"
            placeholder="请输入新名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showRenameDialog = false">取消</el-button>
        <el-button type="primary" @click="renameFile" :loading="renaming">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  Upload,
  FolderAdd,
  HomeFilled,
  List,
  Grid,
  Search,
  Download,
  Edit,
  Delete,
  MoreFilled,
  Folder,
  Document,
  Picture,
  VideoCamera,
  Microphone,
  Files
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/auth'
import { filesApi, type FileInfo } from '@/api/files'

const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const creating = ref(false)
const renaming = ref(false)
const showCreateFolderDialog = ref(false)
const showRenameDialog = ref(false)
const currentPath = ref('')
const viewMode = ref<'list' | 'grid'>('list')
const searchKeyword = ref('')
const sortBy = ref('name')
const sortOrder = ref<'asc' | 'desc'>('asc')
const selectedFiles = ref<string[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 表单数据
const folderForm = reactive({
  name: ''
})

const renameForm = reactive({
  name: '',
  id: '',
  type: ''
})

// 表单验证规则
const folderRules = {
  name: [
    { required: true, message: '请输入文件夹名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' },
    {
      pattern: /^[^<>:"/\\|?*]+$/,
      message: '文件夹名称不能包含特殊字符',
      trigger: 'blur'
    }
  ]
}

const renameRules = {
  name: [
    { required: true, message: '请输入新名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' },
    {
      pattern: /^[^<>:"/\\|?*]+$/,
      message: '名称不能包含特殊字符',
      trigger: 'blur'
    }
  ]
}

// 文件数据
const files = ref<FileInfo[]>([])

// 计算属性
const pathSegments = computed(() => {
  return currentPath.value ? currentPath.value.split('/').filter(Boolean) : []
})

const filteredFiles = computed(() => {
  return files.value
})

const uploadUrl = computed(() => {
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/files/upload`
})

const uploadHeaders = computed(() => {
  return {
    Authorization: `Bearer ${authStore.token}`
  }
})

// 获取文件图标
const getFileIcon = (file: FileInfo) => {
  const extension = getFileExtension(file.filename)
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
    return Picture
  }
  
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(extension)) {
    return VideoCamera
  }
  
  if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension)) {
    return Microphone
  }
  
  if (['doc', 'docx', 'pdf', 'txt', 'rtf', 'md'].includes(extension)) {
    return Document
  }
  
  return Files
}

// 获取文件扩展名
const getFileExtension = (filename: string): string => {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

// 获取文件图标样式类
const getFileIconClass = (file: FileInfo) => {
  const extension = getFileExtension(file.filename)
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
    return 'image-icon'
  }
  
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(extension)) {
    return 'video-icon'
  }
  
  if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension)) {
    return 'audio-icon'
  }
  
  if (['doc', 'docx', 'pdf', 'txt', 'rtf', 'md'].includes(extension)) {
    return 'document-icon'
  }
  
  return 'file-icon'
}

// 获取文件类型文本
const getFileTypeText = (file: FileInfo) => {
  const extension = getFileExtension(file.filename)
  return extension ? extension.toUpperCase() : '文件'
}

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size === 0) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(size) / Math.log(k))
  
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 获取路径到指定索引
const getPathUpTo = (index: number) => {
  return pathSegments.value.slice(0, index + 1).join('/')
}

// 导航到指定路径
const navigateToPath = (path: string) => {
  currentPath.value = path
  fetchFiles()
}

// 设置视图模式
const setViewMode = (mode: 'list' | 'grid') => {
  viewMode.value = mode
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchFiles()
}

// 处理排序
const handleSort = () => {
  currentPage.value = 1
  fetchFiles()
}

// 切换排序顺序
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

// 选择文件
const selectFile = (file: any) => {
  const index = selectedFiles.value.indexOf(file.id)
  if (index > -1) {
    selectedFiles.value.splice(index, 1)
  } else {
    selectedFiles.value.push(file.id)
  }
}

// 处理选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedFiles.value = selection.map(item => item.id)
}

// 处理双击
const handleDoubleClick = (file: FileInfo) => {
  // 直接下载文件
  downloadFile(file)
}

// 下载文件
const downloadFile = async (file: FileInfo) => {
  try {
    const response = await filesApi.downloadFile(file.id)
    
    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = file.original_name || file.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('开始下载文件')
  } catch (error) {
    ElMessage.error('下载文件失败')
  }
}

// 显示重命名对话框 (暂时移除)
// const showRenameDialog = (file: FileInfo) => {
//   renameForm.name = file.original_name || file.filename
//   renameForm.id = file.id
//   showRenameDialog.value = true
// }

// 删除文件
const deleteFile = async (file: FileInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件 "${file.original_name || file.filename}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await filesApi.deleteFile(file.id)
    ElMessage.success('删除成功')
    fetchFiles()
  } catch {
    // 用户取消删除
  }
}

// 创建文件夹
const createFolder = async () => {
  const formRef = folderFormRef.value
  if (!formRef) return
  
  try {
    await formRef.validate()
    creating.value = true
    
    // TODO: 实现创建文件夹API
    // await filesApi.createFolder({
    //   name: folderForm.name,
    //   path: currentPath.value
    // })
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('文件夹创建成功')
    showCreateFolderDialog.value = false
    folderForm.name = ''
    fetchFiles()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('创建文件夹失败')
    }
  } finally {
    creating.value = false
  }
}

// 重命名文件 (暂时移除)
// const renameFile = async () => {
//   const formRef = renameFormRef.value
//   if (!formRef) return
//   
//   try {
//     await formRef.validate()
//     renaming.value = true
//     
//     await filesApi.renameFile(renameForm.id, {
//       name: renameForm.name
//     })
//     
//     ElMessage.success('重命名成功')
//     showRenameDialog.value = false
//     fetchFiles()
//   } catch (error) {
//     if (error !== false) {
//       ElMessage.error('重命名失败')
//     }
//   } finally {
//     renaming.value = false
//   }
// }

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchFiles()
}

// 处理当前页变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  fetchFiles()
}

// 上传前检查
const beforeUpload = (file: File) => {
  const isLt100M = file.size / 1024 / 1024 < 100
  
  if (!isLt100M) {
    ElMessage.error('文件大小不能超过 100MB')
    return false
  }
  
  return true
}

// 上传成功处理
const handleUploadSuccess = (response: any, file: any) => {
  if (response.success) {
    ElMessage.success(`${file.name} 上传成功`)
    fetchFiles()
  } else {
    ElMessage.error(response.message || `${file.name} 上传失败`)
  }
}

// 上传失败处理
const handleUploadError = (error: any, file: any) => {
  console.error('上传失败:', error)
  ElMessage.error(`${file.name} 上传失败`)
}

// 重复的工具函数已在上方定义

// 刷新文件列表
const refreshFiles = () => {
  fetchFiles()
  ElMessage.success('文件列表已刷新')
}

// 获取文件列表
const fetchFiles = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      page_size: pageSize.value,
      path: currentPath.value,
      search: searchKeyword.value,
      sort_by: sortBy.value,
      sort_order: sortOrder.value
    }
    
    const response = await filesApi.getFiles(params)
    files.value = response.data.files
    total.value = response.data.total
  } catch (error) {
    ElMessage.error('获取文件列表失败')
  } finally {
    loading.value = false
  }
}

// 引用
const uploadRef = ref()
const folderFormRef = ref()
const renameFormRef = ref()

onMounted(() => {
  fetchFiles()
})
</script>

<style scoped>
.file-manager-view {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: calc(100vh - 120px);
}

.breadcrumb-card,
.toolbar-card {
  padding: 16px;
}

.breadcrumb-card .el-breadcrumb {
  font-size: 14px;
}

.breadcrumb-card .el-button {
  padding: 0;
  font-size: 14px;
}

.breadcrumb-card .el-button.active {
  color: var(--el-color-primary);
  font-weight: 500;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.file-list-card {
  flex: 1;
  overflow: hidden;
}

.file-list-card .el-card__body {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list-view {
  flex: 1;
  overflow: auto;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.file-icon {
  font-size: 20px;
}

.file-icon.folder-icon {
  color: var(--el-color-warning);
}

.file-icon.image-icon {
  color: var(--el-color-success);
}

.file-icon.video-icon {
  color: var(--el-color-danger);
}

.file-icon.audio-icon {
  color: var(--el-color-info);
}

.file-icon.document-icon {
  color: var(--el-color-primary);
}

.file-icon.file-icon {
  color: var(--el-text-color-secondary);
}

.file-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.folder-size {
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

.grid-view {
  flex: 1;
  overflow: auto;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.file-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  background: var(--el-bg-color);
}

.file-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.file-card.selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.file-card-icon {
  text-align: center;
  margin-bottom: 12px;
}

.file-card-icon .el-icon {
  font-size: 48px;
}

.file-card-info {
  text-align: center;
}

.file-card-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-card-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.file-card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.file-card:hover .file-card-actions {
  opacity: 1;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

@media (max-width: 768px) {
  .file-manager-view {
    padding: 16px;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }
  
  .file-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
  
  .file-card {
    padding: 12px;
  }
  
  .file-card-icon .el-icon {
    font-size: 36px;
  }
}
</style>