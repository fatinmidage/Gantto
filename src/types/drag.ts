/**
 * 拖拽相关类型定义
 * 统一拖拽状态管理
 */

import { Task, MilestoneNode } from './task';

// 拖拽类型
export type DragType = 'move' | 'resize-left' | 'resize-right' | 'milestone-move' | null;
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

// 里程碑临时拖拽位置
export interface TempMilestoneDragPosition {
  id: string;
  x: number;
  y: number;
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

// 里程碑拖拽状态
export interface MilestoneDragState {
  isDragging: boolean;
  draggedMilestoneId: string | null;
  draggedMilestoneData: MilestoneNode | null;
  tempDragPosition: TempMilestoneDragPosition | null;
  previewPosition: { x: number; y: number } | null;
  originalPosition: { x: number; y: number } | null;
  potentialAttachmentBar: string | null; // 潜在的附着任务条ID
  startOffset: DragOffset;
  isWithinBounds: boolean;
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

// 里程碑拖拽操作接口
export interface MilestoneDragOperations {
  startMilestoneDrag: (milestone: MilestoneNode, clientX: number, clientY: number, containerElement: HTMLElement | null) => void;
  updateMilestoneDragPosition: (clientX: number, clientY: number, allTasks: Task[], taskHeight: number, containerWidth?: number, containerHeight?: number) => void;
  endMilestoneDrag: () => void;
  cancelMilestoneDrag: () => void;
  syncAttachedMilestones: (task: Task, milestones: MilestoneNode[], taskHeight: number) => MilestoneNode[];
  handleMilestoneOverlap: (milestones: MilestoneNode[], nodeSize?: number) => MilestoneNode[];
  getDragState: () => MilestoneDragState;
  getPreviewPosition: () => { x: number; y: number } | null;
  getIsWithinBounds: () => boolean;
  checkBounds: (x: number, y: number, containerWidth?: number, containerHeight?: number) => boolean;
  
  // 状态属性
  isDragging: boolean;
  draggedMilestone: string | null;
  previewPosition: { x: number; y: number } | null;
  isWithinBounds: boolean;
}

// 里程碑拖拽回调接口
export interface MilestoneDragCallbacks {
  onMilestoneUpdate: (milestoneId: string, updates: Partial<MilestoneNode>) => void;
  onAttachmentChange: (milestoneId: string, attachedToBar?: string, relativePosition?: number) => void;
  dateToPixel: (date: Date) => number;
  pixelToDate: (pixel: number) => Date;
  getTaskRowIndex: (taskId: string) => number;
}

// 里程碑边界检测配置
export interface MilestoneBoundsConfig {
  nodeSize: number;
  margin: number;
  containerWidth?: number;
  containerHeight?: number;
}