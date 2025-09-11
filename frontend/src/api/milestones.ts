import { request } from './http'
import type { 
  Milestone, 
  CreateMilestoneRequest, 
  UpdateMilestoneRequest, 
  MarkMilestoneAchievedRequest,
  MilestoneFilter,
  PaginatedResponse
} from '@/types/milestone'

export const milestoneApi = {
  // 创建里程碑
  createMilestone(data: CreateMilestoneRequest) {
    return request.post<Milestone>('/milestones', data)
  },

  // 获取里程碑详情
  getMilestone(id: string) {
    return request.get<Milestone>(`/milestones/${id}`)
  },

  // 根据任务ID获取里程碑列表
  getMilestonesByTaskId(taskId: string, params?: MilestoneFilter) {
    return request.get<Milestone[]>(`/milestones/task/${taskId}`, {
      params: {
        ...params,
        _t: new Date().getTime(),
      },
    })
  },

  // 获取即将到期的里程碑
  getUpcomingMilestones(params?: { days?: number; page?: number; limit?: number }) {
    return request.get<PaginatedResponse<Milestone>>('/milestones/upcoming', { params })
  },

  // 获取逾期的里程碑
  getOverdueMilestones(params?: { page?: number; limit?: number }) {
    return request.get<PaginatedResponse<Milestone>>('/milestones/overdue', { params })
  },

  // 更新里程碑
  updateMilestone(id: string, data: UpdateMilestoneRequest) {
    return request.put<Milestone>(`/milestones/${id}`, data)
  },

  // 标记里程碑为已达成
  markMilestoneAsAchieved(id: string, data?: MarkMilestoneAchievedRequest) {
    return request.post<Milestone>(`/milestones/${id}/achieve`, data || {})
  },

  // 删除里程碑
  deleteMilestone(id: string) {
    return request.delete(`/milestones/${id}`)
  },

  // 批量操作里程碑
  batchUpdateMilestones(milestoneIds: string[], data: Partial<UpdateMilestoneRequest>) {
    return request.patch('/milestones/batch', { milestone_ids: milestoneIds, ...data })
  },

  // 批量删除里程碑
  batchDeleteMilestones(milestoneIds: string[]) {
    return request.delete('/milestones/batch', { data: { milestone_ids: milestoneIds } })
  },

  // 获取里程碑统计信息
  getMilestoneStats(params?: { task_id?: string; start_date?: string; end_date?: string }) {
    return request.get('/milestones/stats', { params })
  }
}