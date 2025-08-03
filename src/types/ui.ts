/**
 * UI状态相关类型定义
 * 包含所有用户界面交互状态
 */

import { Position, ViewType, ContextMenuType } from './common';
import { DragType } from './drag';

// 拖拽状态接口
export interface DragState {
  isDragging: boolean;
  dragType: DragType | null;
  draggedItemId: string | null;
  startPosition: Position;
  currentPosition: Position;
  targetPosition?: Position;
  
  // 拖拽过程中的预览位置
  tempPosition?: {
    id: string;
    x: number;
    width: number;
  };
}

// 垂直拖拽状态（任务重排序）
export interface VerticalDragState {
  isDragging: boolean;
  draggedTaskId: string | null;
  draggedTaskIndex: number | null;
  targetIndex: number | null;
  startY: number;
  currentY: number;
  shouldShowIndicator: boolean; // 是否显示拖拽指示线
}

// 选择状态
export interface SelectionState {
  selectedTaskIds: Set<string>;
  selectedRowIds: Set<string>;
  lastSelectedId: string | null;
  selectionMode: 'single' | 'multiple';
  
  // 专门的选择状态（兼容现有代码）
  selectedTitleTaskId: string | null; // 左侧任务标题选中
  selectedChartTaskId: string | null; // 右侧图表任务选中
}

// 交互状态
export interface InteractionState {
  hoveredTaskId: string | null;
  hoveredRowId: string | null;
  focusedElementId: string | null;
  
  // 边缘悬停状态（用于调整大小）
  isHoveringEdge: 'left' | 'right' | null;
}

// 右键菜单状态
export interface ContextMenuState {
  visible: boolean;
  position: Position;
  targetId: string | null;
  menuType: ContextMenuType;
}

// 任务条右键菜单状态（兼容现有代码）
export interface TaskContextMenu {
  visible: boolean;
  x: number;
  y: number;
  taskId: string | null;
}

// 颜色选择器状态
export interface ColorPickerState {
  visible: boolean;
  taskId: string | null;
  milestoneId?: string | null;
  currentColor?: string;
  position?: Position;
  targetType?: 'task' | 'milestone';
  onColorChange?: (color: string) => void;
  onClose?: () => void;
}

// 标签管理器状态
export interface TagManagerState {
  visible: boolean;
  taskId: string | null;
  newTag: string;
  availableTags?: string[];
  selectedTags?: string[];
  position?: Position;
  onTagsChange?: (tags: string[]) => void;
  onClose?: () => void;
  allowCreate?: boolean;
}

// 项目行数据接口
export interface ProjectRowData {
  id: string;
  title: string;
  isExpanded?: boolean;
  level?: number;
  parentId?: string;
  children?: string[];
  order: number; // 改为必需字段，与ProjectRow保持一致
  metadata?: Record<string, unknown>;
}

// 可见行数据接口（用于渲染优化）
export interface VisibleRowData extends ProjectRowData {
  index: number;
  isVisible: boolean;
  yPosition: number;
  height: number;
}

// 模态框状态集合
export interface ModalState {
  colorPicker: ColorPickerState;
  tagManager: TagManagerState;
  
  // 其他可能的模态框
  taskEditor?: {
    visible: boolean;
    taskId: string | null;
    mode: 'create' | 'edit';
  };
  
  projectSettings?: {
    visible: boolean;
    section: 'general' | 'display' | 'advanced';
  };
}

// 视图状态
export interface ViewState {
  currentView: ViewType;
  
  // 时间轴视图设置
  timeline: {
    zoomLevel: number;
    startDate: Date;
    endDate: Date;
    showWeekends: boolean;
    showCurrentDate: boolean;
  };
  
  // 列表视图设置
  list: {
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    groupBy?: string;
  };
  
  // 网格视图设置
  grid: {
    columns: string[];
    rowHeight: number;
  };
}

// 应用程序整体UI状态
export interface AppUIState {
  drag: DragState;
  verticalDrag: VerticalDragState;
  selection: SelectionState;
  interaction: InteractionState;
  contextMenu: ContextMenuState;
  modals: ModalState;
  view: ViewState;
  
  // 全局UI设置
  theme: 'light' | 'dark' | 'auto';
  sidebarCollapsed: boolean;
  showMinimap: boolean;
  
  // 性能相关
  enableVirtualization: boolean;
  debugMode: boolean;
}