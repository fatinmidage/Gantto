/**
 * 调试工具函数
 * 用于任务条拖拽功能的调试信息输出
 */

import { Task } from '../types/task';
import { DragType } from '../types/drag';

/**
 * 格式化日期为易读格式
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0];
};

/**
 * 格式化日期范围
 */
export const formatDateRange = (startDate: Date, endDate: Date): string => {
  return `${formatDate(startDate)} → ${formatDate(endDate)}`;
};

/**
 * 记录拖拽开始时的任务状态
 */
export const logDragStart = (_taskId: string, task: Task, dragType: DragType) => {
  console.log(`🎯 [拖拽开始] ${dragType} | 原始日期: ${formatDateRange(task.startDate, task.endDate)}`);
};


/**
 * 记录鼠标释放时的位置信息（专用于调试左侧边界调整问题）
 */
export const logMouseReleasePosition = (data: {
  taskId: string;
  dragType: DragType;
  mousePosition: {
    clientX: number;
    clientY: number;
    relativeX?: number;
    relativeY?: number;
  };
  pixelToDateResult?: {
    pixel: number;
    convertedDate: Date;
    pixelPerDay?: number;
  };
  containerInfo?: {
    width: number;
    bounds?: DOMRect;
  };
}) => {
  // 特别针对边界调整问题的调试
  const isLeftResize = data.dragType === 'resize-left';
  const isRightResize = data.dragType === 'resize-right';
  const isEdgeResize = isLeftResize || isRightResize;
  
  const prefix = isLeftResize ? '🔍 [左侧边界调试]' 
    : isRightResize ? '🔍 [右侧边界调试]' 
    : '🖱️ [鼠标释放]';
  
  console.group(`${prefix} ${data.dragType} | 任务ID: ${data.taskId}`);
  console.log(`原始坐标: clientX=${data.mousePosition.clientX}, clientY=${data.mousePosition.clientY}`);
  
  if (data.mousePosition.relativeX !== undefined && data.mousePosition.relativeY !== undefined) {
    console.log(`容器坐标: relativeX=${data.mousePosition.relativeX}, relativeY=${data.mousePosition.relativeY}`);
  }
  
  if (data.pixelToDateResult) {
    console.log(`转换日期: ${formatDate(data.pixelToDateResult.convertedDate)}`);
    console.log(`像素位置: ${data.pixelToDateResult.pixel}px`);
    if (data.pixelToDateResult.pixelPerDay) {
      console.log(`像素密度: ${data.pixelToDateResult.pixelPerDay.toFixed(2)}px/day`);
    }
  }
  
  if (data.containerInfo) {
    console.log(`容器信息: 宽度=${data.containerInfo.width}px`);
    if (data.containerInfo.bounds) {
      console.log(`容器边界: left=${data.containerInfo.bounds.left}, top=${data.containerInfo.bounds.top}`);
    }
  }
  
  // 边界调整特殊调试信息
  if (isEdgeResize) {
    const warningMessage = isLeftResize 
      ? '⚠️ 左侧边界调整检测: 请检查鼠标位置是否与预期的任务开始日期一致'
      : '⚠️ 右侧边界调整检测: 请检查鼠标位置是否与预期的任务结束日期一致';
    
    console.warn(warningMessage);
    if (data.pixelToDateResult && data.containerInfo) {
      const datePosition = (data.pixelToDateResult.pixel / data.containerInfo.width) * 100;
      console.log(`📍 相对位置: ${datePosition.toFixed(1)}% of 容器宽度`);
    }
  }
  
  console.groupEnd();
};

/**
 * 记录拖拽完成后的最终结果
 */
export const logDragComplete = (data: {
  taskId: string;
  dragType: DragType;
  tempPosition: { x: number; width: number };
  originalStartDate: Date;
  originalEndDate: Date;
  newStartDate: Date;
  newEndDate: Date;
  pixelToDateConversion?: {
    startPixel: number;
    endPixel: number;
  };
}) => {
  console.log(`✅ [拖拽结束] ${data.dragType} | 计算日期: ${formatDateRange(data.newStartDate, data.newEndDate)}`);
};

/**
 * 记录任务实际渲染的日期
 */
export const logActualRender = (taskId: string, task: Task) => {
  console.log(`📱 [实际渲染] ${taskId} | 渲染日期: ${formatDateRange(task.startDate, task.endDate)}`);
};

/**
 * 记录像素到日期转换的调试信息
 */
export const logPixelToDate = (pixel: number, resultDate: Date, context: string = '') => {
  console.log(`📐 [PixelToDate] ${context} ${pixel}px → ${formatDate(resultDate)}`);
};

/**
 * 记录任务数据对比
 */
export const logTaskComparison = (label: string, originalTask: Task, updatedTask: Partial<Task>) => {
  console.group(`🔍 [TaskBar Debug] ${label}`);
  console.log('原始任务:', {
    startDate: originalTask.startDate,
    endDate: originalTask.endDate,
    x: originalTask.x,
    width: originalTask.width
  });
  console.log('更新数据:', updatedTask);
  console.groupEnd();
};