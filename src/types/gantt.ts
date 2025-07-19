/**
 * 甘特图组件专用类型定义
 * 用于GanttContainer和相关组件的类型安全
 */

import { Task } from './task';
import { ProjectRow } from './project';
import { VerticalDragState, TempDragPosition, DragMetrics } from './drag';

// 图表任务行 - 用于右侧图表区域
export interface ChartTaskRow {
  id: string;
  taskId: string;
  title: string;
  level: number;
  isExpanded: boolean;
  hasChildren: boolean;
  order: number;
}

// 时间刻度
export interface TimeScale {
  date: Date;
  label: string;
  type: 'year' | 'month' | 'week' | 'day' | 'hour';
  width: number;
  x: number;
}

// 上下文菜单状态
export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  rowId?: string;
}

// 任务上下文菜单状态
export interface TaskContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  taskId: string;
  task: Task;
}

// 创建任务输入
export interface CreateTaskInput {
  title: string;
  startDate: Date;
  endDate: Date;
  rowId: string;
  type?: Task['type'];
  color?: string;
}

// 创建里程碑输入
export interface CreateMilestoneInput {
  title: string;
  date: Date;
  rowId: string;
  color?: string;
}

// 拖拽位置信息
export interface DragPositionInfo {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 甘特图布局信息
export interface GanttLayout {
  titleColumnWidth: number;
  chartWidth: number;
  chartHeight: number;
  timelineHeight: number;
  taskHeight: number;
  taskContentHeight: number;
}

// 甘特图状态
export interface GanttState {
  tasks: Task[];
  projectRows: ProjectRow[];
  chartTaskRows: ChartTaskRow[];
  selectedTaskId: string | null;
  zoomLevel: number;
  viewStartDate: Date;
  viewEndDate: Date;
  isDragging: boolean;
  dragType: 'move' | 'resize-left' | 'resize-right' | null;
  verticalDragState: VerticalDragState;
  tempDragPosition: TempDragPosition | null;
  dragMetrics: DragMetrics;
}