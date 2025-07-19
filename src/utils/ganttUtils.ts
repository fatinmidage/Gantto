/**
 * 甘特图工具函数
 * 提供任务创建、位置计算等公共逻辑
 */

import { ProjectRow, Task } from '../types';

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
  const taskRowHeight = taskHeight + 10; // 任务高度 + 间距
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