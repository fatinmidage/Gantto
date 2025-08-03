/**
 * Gantt图事件系统类型定义
 * 包含事件处理和交互相关的接口
 */

import { Task, MilestoneNode } from './task';
import { DragType } from './drag';
import { Position } from './common';

// 事件类型枚举
export type GanttEventType = 
  | 'task:create'
  | 'task:update'
  | 'task:delete'
  | 'task:select'
  | 'task:drag:start'
  | 'task:drag:move'
  | 'task:drag:end'
  | 'milestone:create'
  | 'milestone:update'
  | 'milestone:delete'
  | 'milestone:drag:start'
  | 'milestone:drag:move'
  | 'milestone:drag:end'
  | 'timeline:zoom'
  | 'timeline:scroll'
  | 'view:change';

// 事件载荷类型
export type GanttEventPayload = 
  | TaskEventPayload
  | MilestoneEventPayload
  | DragEventPayload
  | TimelineEventPayload
  | ViewEventPayload;

// 任务相关事件载荷
export interface TaskEventPayload {
  type: 'task';
  task: Task;
  previousTask?: Task;
  position?: Position;
}

// 里程碑相关事件载荷
export interface MilestoneEventPayload {
  type: 'milestone';
  milestone: MilestoneNode;
  previousMilestone?: MilestoneNode;
  position?: Position;
}

// 拖拽相关事件载荷
export interface DragEventPayload {
  type: 'drag';
  dragType: DragType;
  taskId?: string;
  milestoneId?: string;
  startPosition: Position;
  currentPosition?: Position;
  deltaX?: number;
  deltaY?: number;
}

// 时间轴相关事件载荷
export interface TimelineEventPayload {
  type: 'timeline';
  action: 'zoom' | 'scroll';
  scale?: number;
  position?: Position;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

// 视图相关事件载荷
export interface ViewEventPayload {
  type: 'view';
  viewType: 'timeline' | 'list' | 'grid';
  previousViewType?: string;
}

// Gantt事件接口
export interface GanttEvent {
  id: string;
  type: GanttEventType;
  payload: GanttEventPayload;
  timestamp: Date;
  source: 'user' | 'system' | 'api';
  metadata?: Record<string, unknown>;
}

// 事件处理器类型
export type GanttEventHandler = (event: GanttEvent) => void | Promise<void>;

// 事件监听器配置
export interface GanttEventListener {
  type: GanttEventType | GanttEventType[];
  handler: GanttEventHandler;
  once?: boolean;
  priority?: number;
}

// Gantt交互状态接口
export interface GanttInteraction {
  // 当前活动状态
  isActive: boolean;
  activeType?: 'drag' | 'resize' | 'select' | 'create';
  
  // 选中状态
  selectedTaskIds: string[];
  selectedMilestoneIds: string[];
  
  // 拖拽状态
  isDragging: boolean;
  dragTarget?: {
    type: 'task' | 'milestone';
    id: string;
    startPosition: Position;
  };
  
  // 悬停状态
  hoveredTaskId?: string;
  hoveredMilestoneId?: string;
  hoveredEdge?: 'left' | 'right' | null;
  
  // 右键菜单状态
  contextMenu?: {
    isVisible: boolean;
    position: Position;
    targetType: 'task' | 'milestone' | 'timeline' | 'row';
    targetId?: string;
  };
  
  // 模态框状态
  modals: {
    colorPicker: boolean;
    tagManager: boolean;
    taskEditor: boolean;
    milestoneEditor: boolean;
  };
  
  // 键盘状态
  keyboardState: {
    ctrlPressed: boolean;
    shiftPressed: boolean;
    altPressed: boolean;
  };
}

// 交互操作接口
export interface GanttInteractionOperations {
  // 选择操作
  selectTask: (taskId: string, multiSelect?: boolean) => void;
  selectMilestone: (milestoneId: string, multiSelect?: boolean) => void;
  clearSelection: () => void;
  
  // 拖拽操作
  startDrag: (type: 'task' | 'milestone', id: string, position: Position) => void;
  updateDrag: (position: Position) => void;
  endDrag: () => void;
  
  // 悬停操作
  setHoveredTask: (taskId: string | undefined) => void;
  setHoveredMilestone: (milestoneId: string | undefined) => void;
  setHoveredEdge: (edge: 'left' | 'right' | null) => void;
  
  // 右键菜单操作
  showContextMenu: (type: 'task' | 'milestone' | 'timeline' | 'row', position: Position, targetId?: string) => void;
  hideContextMenu: () => void;
  
  // 模态框操作
  toggleModal: (modalType: keyof GanttInteraction['modals']) => void;
  
  // 键盘状态更新
  updateKeyboardState: (key: keyof GanttInteraction['keyboardState'], pressed: boolean) => void;
}

// 事件系统配置
export interface GanttEventConfig {
  enableEventLogging?: boolean;
  maxEventHistory?: number;
  debounceDelay?: number;
  enableBubbling?: boolean;
}