/**
 * 拖拽相关类型定义
 * 统一拖拽状态管理
 */

import { Task } from './task';

// 拖拽类型
export type DragType = 'move' | 'resize-left' | 'resize-right' | null;
export type EdgeHover = 'left' | 'right' | null;

// 拖拽偏移量
export interface DragOffset {
  x: number;
  y: number;
}

// 临时拖拽位置
export interface TempDragPosition {
  id: string;
  x: number;
  width: number;
}

// 垂直拖拽状态
export interface VerticalDragState {
  isDragging: boolean;
  draggedTaskId: string | null;
  draggedTaskIndex: number | null;
  targetIndex: number | null;
  startY: number;
  currentY: number;
  shouldShowIndicator: boolean;
}

// 拖拽缓存
export interface DragMetrics {
  duration: number;
  pixelPerDay: number;
  minWidth: number;
}

// 拖拽事件处理器
export interface DragEventHandlers {
  // 边界检测
  detectEdgeHover: (e: React.MouseEvent, task: Task) => 'left' | 'right' | null;
  handleEdgeHover: (e: React.MouseEvent, task: Task) => void;
  
  // 鼠标事件
  handleMouseDown: (e: React.MouseEvent, taskId: string) => void;
  handleTitleMouseDown: (e: React.MouseEvent, taskId: string) => void;
  handleMouseMove: (e: MouseEvent) => void;
  handleMouseUp: () => void;
  handleTitleMouseMove: (e: MouseEvent) => void;
  handleTitleMouseUp: () => void;
}

// 拖拽数据
export interface DragData {
  draggedTask: string | null;
  isDragging: boolean;
  tempDragPosition: TempDragPosition | null;
  draggedTaskData: Task | null;
  dragType: DragType;
  isHoveringEdge: EdgeHover;
  verticalDragState: VerticalDragState;
}

// 拖拽操作接口
export interface DragOperations {
  startHorizontalDrag: (taskId: string, task: Task, dragType: DragType, offset: DragOffset) => void;
  updateHorizontalDrag: (tempPosition: TempDragPosition) => void;
  endHorizontalDrag: () => void;
  startVerticalDrag: (taskId: string, taskIndex: number, startY: number) => void;
  updateVerticalDrag: (currentY: number, targetIndex: number | null, shouldShowIndicator: boolean) => void;
  endVerticalDrag: () => void;
  setEdgeHover: (edge: EdgeHover) => void;
  resetDragState: () => void;
  updateDragMetrics: (metrics: DragMetrics) => void;
  getDragMetrics: () => DragMetrics;
}