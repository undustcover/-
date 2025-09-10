<template>
  <div class="file-list-view">
    <div class="page-header">
      <h1 class="page-title">文件列表</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showUploadDialog = true">
          <el-icon><Upload /></el-icon>
          上传文件
        </el-button>
        <el-button @click="createFolder">
          <el-icon><FolderAdd /></el-icon>
          新建文件夹
        </el-button>
      </div>
    </div>
    
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <!-- 面包屑导航 -->
        <el-breadcrumb separator="/" class="breadcrumb">
          <el-breadcrumb-item @click="navigateToPath('')">
            <el-icon><HomeFilled /></el-icon>
            根目录
          </el-breadcrumb-item>
          <el-breadcrumb-item
            v-for="(segment, index) in pathSegments"
            :key="index"
            @click="navigateToPath(getPathUpTo(index))"
          >
            {{ segment }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      
      <div class="toolbar-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索文件..."
          style="width: 200px"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select v-model="sortBy" style="width: 120px" @change="handleSort">
          <el-option label="名称" value="name" />
          <el-option label="大小" value="size" />
          <el-option label="修改时间" value="modifiedTime" />
          <el-option label="类型" value="type" />
        </el-select>
        
        <el-button-group>
          <el-button
            :type="viewMode === 'list' ? 'primary' : 'default'"
            @click="viewMode = 'list'"
          >
            <el-icon><List /></el-icon>
          </el-button>
          <el-button
            :type="viewMode === 'grid' ? 'primary' : 'default'"
            @click="viewMode = 'grid'"
          >
            <el-icon><Grid /></el-icon>
          </el-button>
        </el-button-group>
        
        <el-button @click="refreshFiles">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
    </div>
    
    <!-- 文件列表 -->
    <div class="file-content">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <div v-else-if="filteredFiles.length === 0" class="empty-container">
        <el-empty description="暂无文件" />
      </div>
      
      <!-- 列表视图 -->
      <el-table
        v-else-if="viewMode === 'list'"
        :data="paginatedFiles"
        style="width: 100%"
        @row-dblclick="handleFileDoubleClick"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="名称" min-width="300">
          <template #default="{ row }">
            <div class="file-name-cell">
              <el-icon class="file-icon" :style="{ color: getFileIconColor(row) }">
                <component :is="getFileIcon(row)" />
              </el-icon>
              <span class="file-name" @click="handleFileClick(row)">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="大小" width="120">
          <template #default="{ row }">
            {{ row.type === 'folder' ? '-' : formatFileSize(row.size) }}
          </template>
        </el-table-column>
        
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            {{ getFileTypeText(row) }}
          </template>
        </el-table-column>
        
        <el-table-column label="修改时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.modifiedTime) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.type !== 'folder'"
              size="small"
              @click="downloadFile(row)"
            >
              下载
            </el-button>
            <el-button size="small" @click="renameFile(row)">
              重命名
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteFile(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 网格视图 -->
      <div v-else class="file-grid">
        <div
          v-for="file in paginatedFiles"
          :key="file.id"
          class="file-card"
          @click="handleFileClick(file)"
          @dblclick="handleFileDoubleClick(file)"
        >
          <div class="file-card-icon">
            <el-icon :style="{ color: getFileIconColor(file), fontSize: '48px' }">
              <component :is="getFileIcon(file)" />
            </el-icon>
          </div>
          
          <div class="file-card-info">
            <div class="file-card-name" :title="file.name">{{ file.name }}</div>
            <div class="file-card-meta">
              <span>{{ getFileTypeText(file) }}</span>
              <span v-if="file.type !== 'folder'">{{ formatFileSize(file.size) }}</span>
            </div>
            <div class="file-card-time">{{ formatDateTime(file.modifiedTime) }}</div>
          </div>
          
          <div class="file-card-actions">
            <el-dropdown trigger="click" @command="handleFileAction">
              <el-button size="small" circle>
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-if="file.type !== 'folder'"
                    :command="{ action: 'download', file }"
                  >
                    下载
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'rename', file }">
                    重命名
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'delete', file }">
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 分页 -->
    <div v-if="filteredFiles.length > 0" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[20, 50, 100]"
        :total="filteredFiles.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 文件上传对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传文件" width="600px">
      <el-upload
        ref="uploadRef"
        class="upload-demo"
        :action="uploadUrl"
        :headers="uploadHeaders"
        :data="uploadData"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :on-progress="handleUploadProgress"
        :before-upload="beforeUpload"
        multiple
        drag
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持多文件上传，单个文件大小不超过 100MB
          </div>
        </template>
      </el-upload>
      
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmUpload">
          确定上传
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 重命名对话框 -->
    <el-dialog v-model="showRenameDialog" title="重命名" width="400px">
      <el-form @submit.prevent="confirmRename">
        <el-form-item label="新名称">
          <el-input
            v-model="newFileName"
            placeholder="请输入新名称"
            @keyup.enter="confirmRename"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showRenameDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmRename">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, type UploadInstance } from 'element-plus'
import {
  Upload,
  FolderAdd,
  HomeFilled,
  Search,
  List,
  Grid,
  Refresh,
  MoreFilled,
  UploadFilled,
  Folder,
  Document,
  Picture,
  VideoCamera,
  Headphones,
  Files
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const currentPath = ref('')
const searchKeyword = ref('')
const sortBy = ref('name')
const viewMode = ref<'list' | 'grid'>('list')
const currentPage = ref(1)
const pageSize = ref(20)
const selectedFiles = ref<any[]>([])
const showUploadDialog = ref(false)
const showRenameDialog = ref(false)
const renamingFile = ref<any>(null)
const newFileName = ref('')
const uploadRef = ref<UploadInstance>()

// 文件列表
const files = ref<any[]>([
  {
    id: '1',
    name: '项目文档',
    type: 'folder',
    size: 0,
    modifiedTime: '2024-01-20 10:30:00',
    path: '/项目文档'
  },
  {
    id: '2',
    name: '设计稿',
    type: 'folder',
    size: 0,
    modifiedTime: '2024-01-19 15:20:00',
    path: '/设计稿'
  },
  {
    id: '3',
    name: '需求文档.docx',
    type: 'document',
    size: 2048576,
    modifiedTime: '2024-01-20 09:15:00',
    path: '/需求文档.docx'
  },
  {
    id: '4',
    name: '系统架构图.png',
    type: 'image',
    size: 1024000,
    modifiedTime: '2024-01-19 14:30:00',
    path: '/系统架构图.png'
  },
  {
    id: '5',
    name: '演示视频.mp4',
    type: 'video',
    size: 52428800,
    modifiedTime: '2024-01-18 16:45:00',
    path: '/演示视频.mp4'
  },
  {
    id: '6',
    name: '会议录音.mp3',
    type: 'audio',
    size: 8388608,
    modifiedTime: '2024-01-17 11:20:00',
    path: '/会议录音.mp3'
  },
  {
    id: '7',
    name: 'README.md',
    type: 'document',
    size: 4096,
    modifiedTime: '2024-01-20 08:00:00',
    path: '/README.md'
  }
])

// 计算属性
const pathSegments = computed(() => {
  return currentPath.value ? currentPath.value.split('/').filter(Boolean) : []
})

const filteredFiles = computed(() => {
  let result = files.value
  
  // 搜索过滤
  if (searchKeyword.value) {
    result = result.filter(file => 
      file.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }
  
  // 排序
  result.sort((a, b) => {
    // 文件夹优先
    if (a.type === 'folder' && b.type !== 'folder') return -1
    if (a.type !== 'folder' && b.type === 'folder') return 1
    
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'size':
        return b.size - a.size
      case 'modifiedTime':
        return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
      case 'type':
        return a.type.localeCompare(b.type)
      default:
        return 0
    }
  })
  
  return result
})

const paginatedFiles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredFiles.value.slice(start, end)
})

const uploadUrl = computed(() => {
  return `${import.meta.env.VITE_API_BASE_URL}/files/upload`
})

const uploadHeaders = computed(() => {
  return {
    Authorization: `Bearer ${authStore.token}`
  }
})

const uploadData = computed(() => {
  return {
    path: currentPath.value
  }
})

// 获取文件图标
const getFileIcon = (file: any) => {
  switch (file.type) {
    case 'folder':
      return Folder
    case 'image':
      return Picture
    case 'video':
      return VideoCamera
    case 'audio':
      return Headphones
    case 'document':
      return Document
    default:
      return Files
  }
}

// 获取文件图标颜色
const getFileIconColor = (file: any) => {
  switch (file.type) {
    case 'folder':
      return '#409EFF'
    case 'image':
      return '#67C23A'
    case 'video':
      return '#E6A23C'
    case 'audio':
      return '#F56C6C'
    case 'document':
      return '#909399'
    default:
      return '#909399'
  }
}

// 获取文件类型文本
const getFileTypeText = (file: any) => {
  switch (file.type) {
    case 'folder':
      return '文件夹'
    case 'image':
      return '图片'
    case 'video':
      return '视频'
    case 'audio':
      return '音频'
    case 'document':
      return '文档'
    default:
      return '文件'
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期时间
const formatDateTime = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 获取路径到指定索引
const getPathUpTo = (index: number) => {
  return pathSegments.value.slice(0, index + 1).join('/')
}

// 导航到指定路径
const navigateToPath = (path: string) => {
  currentPath.value = path
  loadFiles()
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
}

// 处理排序
const handleSort = () => {
  currentPage.value = 1
}

// 刷新文件列表
const refreshFiles = () => {
  loadFiles()
}

// 处理文件点击
const handleFileClick = (file: any) => {
  // 单击选中文件
  console.log('文件点击:', file)
}

// 处理文件双击
const handleFileDoubleClick = (file: any) => {
  if (file.type === 'folder') {
    // 进入文件夹
    currentPath.value = file.path
    loadFiles()
  } else {
    // 预览或下载文件
    previewFile(file)
  }
}

// 处理选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedFiles.value = selection
}

// 处理文件操作
const handleFileAction = (command: any) => {
  const { action, file } = command
  
  switch (action) {
    case 'download':
      downloadFile(file)
      break
    case 'rename':
      renameFile(file)
      break
    case 'delete':
      deleteFile(file)
      break
  }
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

// 创建文件夹
const createFolder = async () => {
  try {
    const { value: folderName } = await ElMessageBox.prompt(
      '请输入文件夹名称',
      '新建文件夹',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^[^\\/:*?"<>|]+$/,
        inputErrorMessage: '文件夹名称不能包含特殊字符'
      }
    )
    
    if (folderName) {
      // TODO: 调用API创建文件夹
      const newFolder = {
        id: Date.now().toString(),
        name: folderName,
        type: 'folder',
        size: 0,
        modifiedTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        path: `${currentPath.value}/${folderName}`
      }
      
      files.value.unshift(newFolder)
      ElMessage.success('文件夹创建成功')
    }
  } catch {
    // 用户取消
  }
}

// 下载文件
const downloadFile = (file: any) => {
  // TODO: 实现文件下载
  const link = document.createElement('a')
  link.href = `${import.meta.env.VITE_API_BASE_URL}/files/download/${file.id}`
  link.download = file.name
  link.click()
  
  ElMessage.success('开始下载文件')
}

// 重命名文件
const renameFile = (file: any) => {
  renamingFile.value = file
  newFileName.value = file.name
  showRenameDialog.value = true
}

// 确认重命名
const confirmRename = async () => {
  if (!newFileName.value.trim()) {
    ElMessage.warning('请输入新名称')
    return
  }
  
  if (newFileName.value === renamingFile.value.name) {
    showRenameDialog.value = false
    return
  }
  
  try {
    // TODO: 调用API重命名文件
    renamingFile.value.name = newFileName.value
    
    showRenameDialog.value = false
    ElMessage.success('重命名成功')
  } catch (error) {
    ElMessage.error('重命名失败')
  }
}

// 删除文件
const deleteFile = async (file: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 "${file.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // TODO: 调用API删除文件
    const index = files.value.findIndex(f => f.id === file.id)
    if (index > -1) {
      files.value.splice(index, 1)
    }
    
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

// 预览文件
const previewFile = (file: any) => {
  // TODO: 实现文件预览
  if (file.type === 'image') {
    // 图片预览
    window.open(`${import.meta.env.VITE_API_BASE_URL}/files/preview/${file.id}`, '_blank')
  } else {
    // 其他文件类型下载
    downloadFile(file)
  }
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

// 上传成功
const handleUploadSuccess = (response: any, file: any) => {
  ElMessage.success(`${file.name} 上传成功`)
  loadFiles() // 刷新文件列表
}

// 上传失败
const handleUploadError = (error: any, file: any) => {
  ElMessage.error(`${file.name} 上传失败`)
}

// 上传进度
const handleUploadProgress = (event: any, file: any) => {
  // 可以在这里显示上传进度
}

// 确认上传
const confirmUpload = () => {
  uploadRef.value?.submit()
  showUploadDialog.value = false
}

// 加载文件列表
const loadFiles = async () => {
  loading.value = true
  try {
    // TODO: 调用API加载文件列表
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据已在初始化时设置
  } catch (error) {
    ElMessage.error('加载文件列表失败')
  } finally {
    loading.value = false
  }
}

// 监听路径变化
watch(currentPath, () => {
  currentPage.value = 1
})

onMounted(() => {
  loadFiles()
})
</script>

<style scoped>
.file-list-view {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.toolbar-left {
  flex: 1;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.breadcrumb {
  font-size: 14px;
}

.breadcrumb :deep(.el-breadcrumb__item) {
  cursor: pointer;
}

.breadcrumb :deep(.el-breadcrumb__item:hover) {
  color: var(--el-color-primary);
}

.file-content {
  flex: 1;
  min-height: 400px;
}

.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  font-size: 18px;
}

.file-name {
  cursor: pointer;
  color: var(--el-text-color-primary);
}

.file-name:hover {
  color: var(--el-color-primary);
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.file-card {
  position: relative;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--el-bg-color);
}

.file-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.file-card-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
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
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.file-card-time {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.file-card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.file-card:hover .file-card-actions {
  opacity: 1;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.upload-demo {
  width: 100%;
}

.upload-demo :deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
}

@media (max-width: 768px) {
  .file-list-view {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .toolbar {
    flex-direction: column;
    gap: 16px;
  }
  
  .toolbar-left,
  .toolbar-right {
    width: 100%;
  }
  
  .toolbar-right {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
  
  .file-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
  
  .file-card {
    padding: 12px;
  }
}
</style>