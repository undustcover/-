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
              <span class="file-name" @click="handleFileClick(row)">{{ row.original_name || row.filename }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="大小" width="120">
          <template #default="{ row }">
            {{ formatFileSize(row.file_size) }}
          </template>
        </el-table-column>
        
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            {{ getFileTypeText(row) }}
          </template>
        </el-table-column>
        
        <el-table-column label="上传时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.uploaded_at) }}
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
            <div class="file-card-name" :title="file.original_name || file.filename">{{ file.original_name || file.filename }}</div>
            <div class="file-card-meta">
              <span>{{ getFileTypeText(file) }}</span>
              <span>{{ formatFileSize(file.file_size) }}</span>
            </div>
            <div class="file-card-time">{{ formatDateTime(file.uploaded_at) }}</div>
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
    <div v-if="total > 0" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 文件上传对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传文件" width="700px">
      <div class="upload-container">
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
          :file-list="uploadFileList"
          :auto-upload="false"
          multiple
          drag
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击选择文件</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持多文件上传，单个文件大小不超过 100MB
            </div>
          </template>
        </el-upload>
        
        <!-- 上传进度 -->
        <div v-if="uploadProgress.show" class="upload-progress">
          <div class="progress-header">
            <span>上传进度</span>
            <span>{{ uploadProgress.current }}/{{ uploadProgress.total }}</span>
          </div>
          <el-progress
            :percentage="uploadProgress.percentage"
            :status="uploadProgress.status"
          />
          <div class="progress-info">
            <span>{{ uploadProgress.currentFile }}</span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="cancelUpload">取消</el-button>
        <el-button 
          type="primary" 
          :loading="uploadProgress.show"
          :disabled="uploadFileList.length === 0"
          @click="startUpload"
        >
          {{ uploadProgress.show ? '上传中...' : '开始上传' }}
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
    
    <!-- 文件预览对话框 -->
    <el-dialog 
      v-model="showPreviewDialog" 
      :title="previewFileData?.original_name || previewFileData?.filename" 
      width="80%"
      top="5vh"
      class="preview-dialog"
    >
      <div class="preview-container">
        <!-- 图片预览 -->
        <div v-if="isImageFile(previewFileData)" class="image-preview">
          <img 
            :src="getPreviewUrl(previewFileData)"
            :alt="previewFileData?.original_name || previewFileData?.filename"
            @load="handleImageLoad"
            @error="handleImageError"
          />
        </div>
        
        <!-- 视频预览 -->
        <div v-else-if="isVideoFile(previewFileData)" class="video-preview">
          <video 
            :src="getPreviewUrl(previewFileData)"
            controls
            preload="metadata"
          >
            您的浏览器不支持视频播放
          </video>
        </div>
        
        <!-- 音频预览 -->
        <div v-else-if="isAudioFile(previewFileData)" class="audio-preview">
          <audio 
            :src="getPreviewUrl(previewFileData)"
            controls
            preload="metadata"
          >
            您的浏览器不支持音频播放
          </audio>
        </div>
        
        <!-- 文本文件预览 -->
        <div v-else-if="isTextFile(previewFileData)" class="text-preview">
          <div v-if="textContent" class="text-content">
            <pre>{{ textContent }}</pre>
          </div>
          <div v-else class="loading-text">
            <el-icon class="is-loading"><Loading /></el-icon>
            正在加载文件内容...
          </div>
        </div>
        
        <!-- 不支持预览的文件 -->
        <div v-else class="unsupported-preview">
          <el-icon><Document /></el-icon>
          <p>此文件类型不支持预览</p>
          <el-button type="primary" @click="downloadFile(previewFileData!)">
            <el-icon><Download /></el-icon>
            下载文件
          </el-button>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
        <el-button type="primary" @click="downloadFile(previewFileData!)">
          <el-icon><Download /></el-icon>
          下载
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
  Microphone,
  Files,
  Download,
  Loading
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/auth'
import { filesApi, type FileInfo } from '@/api/files'

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

// 预览相关
const showPreviewDialog = ref(false)
const previewFileData = ref<FileInfo | null>(null)
const textContent = ref('')

// 文件列表
const files = ref<FileInfo[]>([])
const total = ref(0)

// 上传相关
const uploadFileList = ref<any[]>([])
const uploadProgress = reactive({
  show: false,
  percentage: 0,
  current: 0,
  total: 0,
  currentFile: '',
  status: 'success' as 'success' | 'exception' | 'warning'
})

// 计算属性
const pathSegments = computed(() => {
  return currentPath.value ? currentPath.value.split('/').filter(Boolean) : []
})

const filteredFiles = computed(() => {
  return files.value
})

const paginatedFiles = computed(() => {
  return filteredFiles.value
})

const uploadUrl = computed(() => {
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/files/upload`
})

const uploadHeaders = computed(() => {
  return {
    Authorization: `Bearer ${authStore.token}`
  }
})

const uploadData = computed(() => {
  return {
    task_id: 1 // 默认任务ID，实际应该从路由或上下文获取
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
      return Microphone
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
    if (canPreview(file)) {
      previewFileHandler(file)
    } else {
      downloadFile(file)
    }
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
const downloadFile = async (file: FileInfo) => {
  try {
    const response = await filesApi.downloadFile(file.id)
    
    // 创建下载链接
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.original_name || file.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('文件下载成功')
  } catch (error) {
    console.error('文件下载失败:', error)
    ElMessage.error('文件下载失败')
  }
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
    ElMessage.success('文件删除成功')
    loadFiles() // 刷新文件列表
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('文件删除失败:', error)
      ElMessage.error('文件删除失败')
    }
  }
}

// 预览文件功能已在 previewFileHandler 函数中实现

// 上传前检查
const beforeUpload = (file: File) => {
  const isLt100M = file.size / 1024 / 1024 < 100
  
  if (!isLt100M) {
    ElMessage.error('文件大小不能超过 100MB')
    return false
  }
  
  return true
}

// 开始上传
const startUpload = () => {
  if (uploadFileList.value.length === 0) {
    ElMessage.warning('请先选择要上传的文件')
    return
  }
  
  uploadProgress.show = true
  uploadProgress.current = 0
  uploadProgress.total = uploadFileList.value.length
  uploadProgress.percentage = 0
  uploadProgress.status = 'success'
  
  uploadRef.value?.submit()
}

// 取消上传
const cancelUpload = () => {
  uploadRef.value?.clearFiles()
  uploadFileList.value = []
  uploadProgress.show = false
  uploadProgress.percentage = 0
  uploadProgress.current = 0
  uploadProgress.total = 0
  uploadProgress.currentFile = ''
  showUploadDialog.value = false
}

// 上传成功
const handleUploadSuccess = (response: any, file: any) => {
  uploadProgress.current++
  uploadProgress.percentage = Math.round((uploadProgress.current / uploadProgress.total) * 100)
  
  if (response.success) {
    ElMessage.success(`${file.name} 上传成功`)
  } else {
    ElMessage.error(response.message || `${file.name} 上传失败`)
    uploadProgress.status = 'exception'
  }
  
  // 所有文件上传完成
  if (uploadProgress.current >= uploadProgress.total) {
    setTimeout(() => {
      uploadProgress.show = false
      showUploadDialog.value = false
      loadFiles() // 刷新文件列表
      uploadRef.value?.clearFiles()
      uploadFileList.value = []
    }, 1000)
  }
}

// 上传失败
const handleUploadError = (error: any, file: any) => {
  console.error('文件上传失败:', error)
  uploadProgress.current++
  uploadProgress.percentage = Math.round((uploadProgress.current / uploadProgress.total) * 100)
  uploadProgress.status = 'exception'
  
  ElMessage.error(`${file.name} 上传失败`)
  
  // 所有文件处理完成
  if (uploadProgress.current >= uploadProgress.total) {
    setTimeout(() => {
      uploadProgress.show = false
      loadFiles() // 刷新文件列表
    }, 1000)
  }
}

// 上传进度
const handleUploadProgress = (event: any, file: any) => {
  uploadProgress.currentFile = file.name
}

// 获取文件扩展名
const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

// 预览文件处理
const previewFileHandler = async (file: FileInfo) => {
  previewFileData.value = file
  textContent.value = ''
  
  // 如果是文本文件，加载内容
  if (isTextFile(file)) {
    try {
      const response = await filesApi.getFileContent(file.id)
      textContent.value = response.data
    } catch (error) {
      console.error('加载文件内容失败:', error)
      textContent.value = '加载文件内容失败'
    }
  }
  
  showPreviewDialog.value = true
}

// 判断是否可以预览
const canPreview = (file: FileInfo | null): boolean => {
  if (!file) return false
  return isImageFile(file) || isVideoFile(file) || isAudioFile(file) || isTextFile(file)
}

// 判断是否为图片文件
const isImageFile = (file: FileInfo | null): boolean => {
  if (!file) return false
  const extension = getFileExtension(file.filename)
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)
}

// 判断是否为视频文件
const isVideoFile = (file: FileInfo | null): boolean => {
  if (!file) return false
  const extension = getFileExtension(file.filename)
  return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(extension)
}

// 判断是否为音频文件
const isAudioFile = (file: FileInfo | null): boolean => {
  if (!file) return false
  const extension = getFileExtension(file.filename)
  return ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(extension)
}

// 判断是否为文本文件
const isTextFile = (file: FileInfo | null): boolean => {
  if (!file) return false
  const extension = getFileExtension(file.filename)
  return ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'vue', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp'].includes(extension)
}

// 获取预览URL
const getPreviewUrl = (file: FileInfo | null): string => {
  if (!file) return ''
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/files/preview/${file.id}`
}

// 图片加载成功
const handleImageLoad = () => {
  console.log('图片加载成功')
}

// 图片加载失败
const handleImageError = () => {
  ElMessage.error('图片加载失败')
}

// 加载文件列表
const loadFiles = async () => {
  loading.value = true
  try {
    const response = await filesApi.getFiles({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchKeyword.value || undefined,
      sort_by: sortBy.value,
      sort_order: 'desc'
    })
    
    files.value = response.data.files
    total.value = response.data.total
  } catch (error) {
    console.error('加载文件列表失败:', error)
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

.upload-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-progress {
  padding: 16px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.progress-info {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
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