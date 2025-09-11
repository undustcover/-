import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'
import customParseFormat from 'dayjs/plugin/customParseFormat'

// 配置 dayjs
dayjs.locale('zh-cn')
dayjs.extend(relativeTime)
dayjs.extend(customParseFormat)

/**
 * 格式化日期时间
 * @param date 日期字符串或Date对象
 * @param format 格式化模板，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 */
export const formatDateTime = (date: string | Date, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!date) return ''
  return dayjs(date).format(format)
}

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @param format 格式化模板，默认为 'YYYY-MM-DD'
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: string | Date, format = 'YYYY-MM-DD'): string => {
  if (!date) return ''
  return dayjs(date).format(format)
}

/**
 * 格式化时间
 * @param date 日期字符串或Date对象
 * @param format 格式化模板，默认为 'HH:mm:ss'
 * @returns 格式化后的时间字符串
 */
export const formatTime = (date: string | Date, format = 'HH:mm:ss'): string => {
  if (!date) return ''
  return dayjs(date).format(format)
}

/**
 * 获取相对时间
 * @param date 日期字符串或Date对象
 * @returns 相对时间字符串，如 '2小时前'
 */
export const getRelativeTime = (date: string | Date): string => {
  if (!date) return ''
  return dayjs(date).fromNow()
}

/**
 * 判断日期是否为今天
 * @param date 日期字符串或Date对象
 * @returns 是否为今天
 */
export const isToday = (date: string | Date): boolean => {
  if (!date) return false
  return dayjs(date).isSame(dayjs(), 'day')
}

/**
 * 判断日期是否为昨天
 * @param date 日期字符串或Date对象
 * @returns 是否为昨天
 */
export const isYesterday = (date: string | Date): boolean => {
  if (!date) return false
  return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day')
}

/**
 * 判断日期是否已过期
 * @param date 日期字符串或Date对象
 * @returns 是否已过期
 */
export const isOverdue = (date: string | Date): boolean => {
  if (!date) return false
  return dayjs(date).isBefore(dayjs(), 'day')
}

/**
 * 计算两个日期之间的天数差
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 天数差
 */
export const getDaysDiff = (startDate: string | Date, endDate: string | Date): number => {
  if (!startDate || !endDate) return 0
  return dayjs(endDate).diff(dayjs(startDate), 'day')
}

/**
 * 获取日期范围内的所有日期
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 日期数组
 */
export const getDateRange = (startDate: string | Date, endDate: string | Date): string[] => {
  if (!startDate || !endDate) return []
  
  const dates: string[] = []
  let current = dayjs(startDate)
  const end = dayjs(endDate)
  
  while (current.isSameOrBefore(end, 'day')) {
    dates.push(current.format('YYYY-MM-DD'))
    current = current.add(1, 'day')
  }
  
  return dates
}

/**
 * 获取当前时间戳
 * @returns 时间戳
 */
export const getCurrentTimestamp = (): number => {
  return dayjs().valueOf()
}

/**
 * 获取当前日期时间字符串
 * @param format 格式化模板
 * @returns 当前日期时间字符串
 */
export const getCurrentDateTime = (format = 'YYYY-MM-DD HH:mm:ss'): string => {
  return dayjs().format(format)
}

/**
 * 获取当前日期字符串
 * @param format 格式化模板
 * @returns 当前日期字符串
 */
export const getCurrentDate = (format = 'YYYY-MM-DD'): string => {
  return dayjs().format(format)
}

/**
 * 解析日期字符串
 * @param dateStr 日期字符串
 * @param format 解析格式
 * @returns dayjs对象
 */
export const parseDate = (dateStr: string, format?: string) => {
  if (format) {
    return dayjs(dateStr, format)
  }
  return dayjs(dateStr)
}

/**
 * 添加时间
 * @param date 基础日期
 * @param amount 数量
 * @param unit 单位
 * @returns 新的日期字符串
 */
export const addTime = (
  date: string | Date, 
  amount: number, 
  unit: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' = 'day'
): string => {
  return dayjs(date).add(amount, unit).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * 减少时间
 * @param date 基础日期
 * @param amount 数量
 * @param unit 单位
 * @returns 新的日期字符串
 */
export const subtractTime = (
  date: string | Date, 
  amount: number, 
  unit: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' = 'day'
): string => {
  return dayjs(date).subtract(amount, unit).format('YYYY-MM-DD HH:mm:ss')
}