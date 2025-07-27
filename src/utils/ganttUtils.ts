/**
 * 甘特图工具函数
 * 提供任务创建、位置计算等公共逻辑
 */

import { ProjectRow, Task } from '../types';
import { layoutUtils } from '../components/gantt/ganttStyles';

/**
 * 根据Y坐标计算对应的项目行ID
 * @param y 点击的Y坐标
 * @param taskHeight 任务高度
 * @param projectRows 项目行列表
 * @returns 目标行ID
 */
export const calculateTargetRowId = (
  y: number,
  taskHeight: number,
  projectRows: ProjectRow[]
): string => {
  const taskRowHeight = layoutUtils.calculateRowHeight(taskHeight);
  const clickedRowIndex = Math.floor(y / taskRowHeight);
  
  if (clickedRowIndex < projectRows.length) {
    const targetRow = projectRows[clickedRowIndex];
    return targetRow.id;
  } else if (projectRows.length > 0) {
    // 如果点击在空白区域，使用最后一个项目行
    const lastRow = projectRows[projectRows.length - 1];
    return lastRow.id;
  }
  
  // 默认返回第一个行或默认行
  return projectRows[0]?.id || 'row-0';
};

/**
 * 根据缩放级别计算智能任务宽度
 * @param zoomLevel 缩放级别
 * @returns 默认任务天数
 */
export const calculateSmartTaskDuration = (zoomLevel: number): number => {
  if (zoomLevel > 0.5) return 3;
  if (zoomLevel > 0.2) return 7;
  return 14;
};

/**
 * 格式化日期为显示用的字符串
 * @param date 日期对象
 * @returns 格式化的日期字符串
 */
export const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * 格式化日期为M.D格式的标签字符串（用于里程碑默认标签）
 * @param date 日期对象
 * @returns M.D格式的字符串，如"1.15"、"12.3"
 */
export const formatDateToMD = (date: Date): string => {
  const month = date.getMonth() + 1; // getMonth() 返回0-11，需要+1
  const day = date.getDate();
  return `${month}.${day}`;
};

/**
 * 日期检测结果接口
 */
interface DateDetectionResult {
  hasDate: boolean;
  matches: Array<{
    match: string;
    index: number;
    format: 'MD' | 'YYYY_M_D';
  }>;
}

/**
 * 检测标签中是否包含日期模式
 * @param label 标签文本
 * @returns 检测结果
 */
export const detectDateInLabel = (label: string): DateDetectionResult => {
  if (!label || typeof label !== 'string') {
    return { hasDate: false, matches: [] };
  }

  const matches: DateDetectionResult['matches'] = [];

  // 定义各种日期格式的正则表达式
  const patterns = [
    {
      regex: /\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g,
      format: 'YYYY_M_D' as const
    },
    {
      // 匹配可能的月日格式，支持01-12月和01-31日
      regex: /\b(?:0?[1-9]|1[0-2])\.(?:0?[1-9]|[12][0-9]|3[01])\b/g,
      format: 'MD' as const
    }
  ];

  // 按优先级检测各种格式
  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern.regex);
    
    while ((match = regex.exec(label)) !== null) {
      // 验证是否为有效日期，并排除版本号等情况
      if (isValidDateString(match[0], pattern.format) && !isVersionNumber(label, match.index, match[0])) {
        matches.push({
          match: match[0],
          index: match.index,
          format: pattern.format
        });
      }
    }
  }

  return {
    hasDate: matches.length > 0,
    matches
  };
};

/**
 * 检测是否为版本号或其他非日期格式
 * @param fullText 完整文本
 * @param matchIndex 匹配位置
 * @param matchStr 匹配的字符串
 * @returns 是否为版本号
 */
const isVersionNumber = (fullText: string, matchIndex: number, matchStr: string): boolean => {
  // 检查前后是否有额外的数字和点，表明这是版本号
  const before = fullText.substring(Math.max(0, matchIndex - 2), matchIndex);
  const after = fullText.substring(matchIndex + matchStr.length, matchIndex + matchStr.length + 2);
  
  // 如果前面有数字和点，或者后面有点和数字，很可能是版本号
  return /\d\.$/.test(before) || /^\.\d/.test(after);
};

/**
 * 验证日期字符串是否有效
 * @param dateStr 日期字符串
 * @param format 日期格式
 * @returns 是否有效
 */
const isValidDateString = (dateStr: string, format: string): boolean => {
  try {
    switch (format) {
      case 'MD': {
        const [month, day] = dateStr.split('.').map(Number);
        // 排除明显不是日期的格式，如版本号
        if (month > 12 || day > 31 || month <= 0 || day <= 0) {
          return false;
        }
        // 额外检查：如果是像 1.5.3 这样的多段格式，不应该被匹配
        const fullMatch = dateStr.match(/^\d{1,2}\.\d{1,2}$/);
        return fullMatch !== null;
      }
      case 'YYYY_M_D': {
        const parts = dateStr.split(/[\/\-]/);
        if (parts.length !== 3) return false;
        const [year, month, day] = parts.map(Number);
        return year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31;
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
};

/**
 * 智能替换标签中的日期部分
 * @param label 原标签文本
 * @param newDate 新的日期对象
 * @returns 替换后的标签文本
 */
export const replaceDateInLabel = (label: string, newDate: Date): string => {
  if (!label || typeof label !== 'string') {
    const result = formatDateToMD(newDate);
    return result;
  }

  const detection = detectDateInLabel(label);
  
  if (!detection.hasDate) {
    return label; // 如果没有检测到日期，返回原标签
  }

  let result = label;
  
  // 按索引逆序处理，避免替换后位置偏移
  const sortedMatches = detection.matches.sort((a, b) => b.index - a.index);
  
  for (const dateMatch of sortedMatches) {
    // 根据原始匹配的格式来格式化新日期
    const newDateStr = formatDateByOriginalMatch(newDate, dateMatch.match);
    
    result = result.substring(0, dateMatch.index) + 
             newDateStr + 
             result.substring(dateMatch.index + dateMatch.match.length);
  }
  
  return result;
};


/**
 * 根据原始匹配字符串的格式来格式化新日期
 * @param date 新日期
 * @param originalMatch 原始匹配的字符串
 * @returns 格式化的日期字符串
 */
const formatDateByOriginalMatch = (date: Date, originalMatch: string): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // 检测原始匹配的格式特征
  if (originalMatch.includes('/') || originalMatch.includes('-')) {
    // YYYY/M/D 或 YYYY-M-D 格式
    const separator = originalMatch.includes('/') ? '/' : '-';
    return `${year}${separator}${month}${separator}${day}`;
  } else if (originalMatch.includes('.')) {
    // M.D 格式，保持原始的零填充风格
    const parts = originalMatch.split('.');
    const originalMonth = parts[0];
    const originalDay = parts[1];
    
    // 如果原始格式有零填充，保持零填充
    const monthStr = originalMonth.length === 2 && originalMonth.startsWith('0') 
      ? month.toString().padStart(2, '0')
      : month.toString();
    const dayStr = originalDay.length === 2 && originalDay.startsWith('0')
      ? day.toString().padStart(2, '0')
      : day.toString();
    
    return `${monthStr}.${dayStr}`;
  }
  
  // 默认返回 M.D 格式
  return formatDateToMD(date);
};

/**
 * 检查标签是否包含日期内容（替换原有的 isDateLabel 逻辑）
 * @param label 标签文本
 * @returns 是否包含日期
 */
export const hasDateInLabel = (label: string): boolean => {
  const result = detectDateInLabel(label).hasDate;
  return result;
};

/**
 * 检查任务是否与现有任务重叠
 * @param startDate 新任务开始时间
 * @param endDate 新任务结束时间
 * @param existingTasks 现有任务列表
 * @param rowId 任务所在行ID
 * @returns 是否重叠
 */
export const checkTaskOverlap = (
  startDate: Date,
  endDate: Date,
  existingTasks: Task[],
  rowId: string
): boolean => {
  const rowTasks = existingTasks.filter(task => task.rowId === rowId);
  
  return rowTasks.some(task => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    
    // 检查是否有时间重叠
    return (startDate < taskEnd && endDate > taskStart);
  });
};