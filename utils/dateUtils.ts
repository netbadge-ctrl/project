/**
 * 日期工具函数
 * 解决时区偏移和日期格式化问题
 */

/**
 * 将Date对象格式化为YYYY-MM-DD字符串（避免时区问题）
 * @param date Date对象
 * @returns YYYY-MM-DD格式的字符串
 */
export const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 将日期字符串解析为Date对象，并设置为当天的开始时间
 * @param dateStr YYYY-MM-DD格式的日期字符串
 * @returns Date对象，时间设置为00:00:00.000
 */
export const parseToStartOfDay = (dateStr: string): Date => {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * 将日期字符串解析为Date对象，并设置为当天的结束时间
 * @param dateStr YYYY-MM-DD格式的日期字符串
 * @returns Date对象，时间设置为23:59:59.999
 */
export const parseToEndOfDay = (dateStr: string): Date => {
  const date = new Date(dateStr);
  date.setHours(23, 59, 59, 999);
  return date;
};

/**
 * 检查项目日期是否在指定的日期范围内
 * @param projectDate 项目日期字符串
 * @param startDate 开始日期字符串（可选）
 * @param endDate 结束日期字符串（可选）
 * @returns 是否在范围内
 */
export const isDateInRange = (
  projectDate: string,
  startDate?: string,
  endDate?: string
): boolean => {
  if (!projectDate) return false;
  
  const projectDateObj = parseToStartOfDay(projectDate);
  
  if (startDate) {
    const startDateObj = parseToStartOfDay(startDate);
    if (projectDateObj < startDateObj) {
      return false;
    }
  }
  
  if (endDate) {
    const endDateObj = parseToEndOfDay(endDate);
    if (projectDateObj > endDateObj) {
      return false;
    }
  }
  
  return true;
};

/**
 * 获取今天的日期字符串
 * @returns YYYY-MM-DD格式的今天日期
 */
export const getTodayString = (): string => {
  return formatDateToString(new Date());
};

/**
 * 计算两个日期之间的天数差（包含边界日期）
 * @param startDate 开始日期字符串
 * @param endDate 结束日期字符串
 * @returns 天数差
 */
export const calculateDaysBetween = (startDate: string, endDate: string): number => {
  const start = parseToStartOfDay(startDate);
  const end = parseToStartOfDay(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};