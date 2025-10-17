import { request } from './http'
import type { AxiosResponse } from 'axios'

// 文件信息接口
export interface FileInfo {
  id: string
  name: string
  filename?: string
  original_name?: string
  file_size?: number
  size?: number
  file_type?: string
  type: 'file' | 'folder'
  file_path?: string
  path?: string
  mime_type?: string
  task_id?: string
  uploaded_by?: string
  uploaded_at?: string
  created_at?: string
  updated_at?: string
}

// 文件夹创建请求接口
export interface CreateFolderRequest {
  name: string
  path?: string
}

// 文件夹创建响应接口
export interface CreateFolderResponse {
  message: string
  folder: FileInfo
}

// 文件列表响应接口
export interface FileListResponse {
  files: FileInfo[]
  // 新版后端响应，将分页信息放在 pagination 中
  pagination?: {
    page: number
    limit: number
    total: number
    pages?: number
  }
  // 兼容旧版顶层字段
  total?: number
  page?: number
  limit?: number
}

// 文件上传响应接口
export interface FileUploadResponse {
  success: boolean
  message: string
  file: FileInfo
}

// 文件管理API
export const filesApi = {
  // 获取文件列表
  getFiles: (params?: {
    task_id?: string
    page?: number
    limit?: number
    currentPath?: string
    search?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }): Promise<AxiosResponse<FileListResponse>> => {
    return request.get('/files', { params })
  },

  // 创建文件夹
  createFolder: (data: CreateFolderRequest): Promise<AxiosResponse<CreateFolderResponse>> => {
    return request.post('/files/folder', data)
  },

  // 获取文件详情
  getFileDetail: (fileId: string): Promise<AxiosResponse<FileInfo>> => {
    return request.get(`/files/${fileId}`)
  },

  // 上传文件
  uploadFile: (formData: FormData): Promise<AxiosResponse<FileUploadResponse>> => {
    return request.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 下载文件
  downloadFile: (fileId: string): Promise<AxiosResponse<Blob>> => {
    return request.get(`/files/download/${fileId}`, {
      responseType: 'blob',
      timeout: 30000 // 增加超时时间到30秒
    })
  },

  // 删除文件
  deleteFile: (fileId: string): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
    return request.delete(`/files/${fileId}`)
  },

  // 批量删除文件
  batchDeleteFiles: (fileIds: string[]): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
    return request.post('/files/batch-delete', { file_ids: fileIds })
  },

  // 重命名文件
  renameFile: (fileId: string, newName: string): Promise<AxiosResponse<FileInfo>> => {
    return request.patch(`/files/${fileId}`, { filename: newName })
  },

  // 获取文件预览URL
  getPreviewUrl: (fileId: string): string => {
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/files/preview/${fileId}`
  },

  // 获取文件下载URL
  getDownloadUrl: (fileId: string): string => {
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/files/download/${fileId}`
  }
}

export default filesApi