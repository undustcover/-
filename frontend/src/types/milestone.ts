// 里程碑信息
export interface Milestone {
  id: string
  task_id: string
  title: string
  description?: string
  target_date: string
  is_achieved: boolean
  achieved_date?: string
  reminder_days?: number
  created_by: string
  created_at: string
  updated_at: string
}

// 创建里程碑请求
export interface CreateMilestoneRequest {
  task_id: string
  title: string
  description?: string
  target_date: string
  reminder_days?: number
}

// 更新里程碑请求
export interface UpdateMilestoneRequest {
  title?: string
  description?: string
  target_date?: string
  is_achieved?: boolean
  achieved_date?: string
  reminder_days?: number
}

// 标记里程碑为已达成请求
export interface MarkMilestoneAchievedRequest {
  achieved_date?: string
}

// 里程碑时间轴项目
export interface MilestoneTimelineItem {
  id: string
  title: string
  description?: string
  target_date: string
  is_achieved: boolean
  achieved_date?: string
  is_overdue: boolean
  days_until_due: number
  reminder_days?: number
}

// 里程碑统计信息
export interface MilestoneStats {
  total: number
  achieved: number
  pending: number
  overdue: number
  upcoming: number // 即将到期（7天内）
  achievement_rate: number
}

// 里程碑过滤条件
export interface MilestoneFilter {
  task_id?: string
  is_achieved?: boolean
  target_date_start?: string
  target_date_end?: string
  is_overdue?: boolean
  keyword?: string
}

// 里程碑排序选项
export type MilestoneSortBy = 'target_date' | 'created_at' | 'title' | 'is_achieved'
export type SortOrder = 'asc' | 'desc'

export interface MilestoneSortOptions {
  sort_by: MilestoneSortBy
  order: SortOrder
}