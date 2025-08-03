import React from 'react';
import { Task, MilestoneNode, ProjectRow, DragState, VerticalDragState, DragType, DateRange, ChartTaskRowContainer } from '../../../types';
import { TimeGranularity, LayeredTimeScale, TimelineLayerConfig } from '../../../utils/timelineLayerUtils';

// 里程碑管理器类型接口
export interface MilestoneManager {
  // 状态
  milestones: MilestoneNode[];
  selectedMilestone: string | null;
  
  // CRUD 操作
  createMilestone: (input: Omit<MilestoneNode, 'id'>) => void;
  updateMilestone: (updates: Partial<MilestoneNode> & { id: string }) => void;
  updateMilestoneDate: (milestoneId: string, newDate: Date) => void;
  deleteMilestone: (milestoneId: string) => void;
  deleteMilestones: (milestoneIds: string[]) => void;
  
  // 查询操作
  getAllMilestones: () => MilestoneNode[];
  getMilestonesByDateRange: (startDate: Date, endDate: Date) => MilestoneNode[];
  
  // 选择管理
  selectMilestone: (milestoneId: string | null) => void;
  
  // 数据回调（供统一拖拽系统使用）
  handleMilestoneUpdate: (milestoneId: string, updates: Partial<MilestoneNode>) => void;
  getMilestone: (milestoneId: string) => MilestoneNode | undefined;
  
  // 其他设置方法
  setMilestones: React.Dispatch<React.SetStateAction<MilestoneNode[]>>;
}

// 甘特图状态管理器属性接口
export interface GanttStateManagerProps {
  startDate: Date;
  endDate: Date;
  timelineHeight: number;
  taskHeight: number;
  timeGranularity?: TimeGranularity;
  layerConfig?: TimelineLayerConfig;
  initialProjectRows: ProjectRow[];
  initialChartTasks: Task[];
  initialMilestones?: MilestoneNode[];
  children: (state: GanttStateData) => React.ReactElement;
}

// 甘特图状态数据接口
export interface GanttStateData {
  // 数据状态
  projectRows: ProjectRow[];
  chartTasks: Task[];
  tasks: Task[];
  setProjectRows: React.Dispatch<React.SetStateAction<ProjectRow[]>>;
  setChartTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  
  // 过滤状态
  filteredTasks: Task[];
  filterStats: {
    totalTasks: number;
    filteredCount: number;
    hiddenCount: number;
    hasHiddenTasks: boolean;
  };
  
  // 拖拽状态
  draggedTask: string | null;
  isDragging: boolean;
  tempDragPosition: DragState['tempPosition'] | null;
  verticalDragState: VerticalDragState;
  isHoveringEdge: 'left' | 'right' | null;
  setIsHoveringEdge: (edge: 'left' | 'right' | null) => void;
  draggedTaskData: Task | null;
  dragType: DragType | null;
  startHorizontalDrag: (taskId: string, task: Task, clientX: number, clientY: number, dragType: DragType, container: HTMLElement) => void;
  startVerticalDrag: (taskId: string, taskIndex: number, clientY: number) => void;
  updateHorizontalDragPosition: (clientX: number, chartWidth: number, minWidth: number) => void;
  updateVerticalDragPosition: (clientY: number, rowHeight: number, totalRows: number) => void;
  updateDragMetrics: (task: Task, pixelPerDay: number) => void;
  resetHorizontalDrag: () => void;
  resetVerticalDrag: () => void;
  
  // 时间轴状态
  zoomLevel: number;
  dateRange: DateRange;
  dateToPixel: (date: Date) => number;
  pixelToDate: (pixel: number) => Date;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleViewToday: () => void;
  layeredTimeScales: LayeredTimeScale;
  layerConfig: TimelineLayerConfig;
  updateLayerConfig: (newConfig: Partial<TimelineLayerConfig>) => void;
  
  // UI状态
  selectedChartTaskId: string | null;
  setSelectedChartTaskId: (id: string | null) => void;
  
  // 计算数据
  sortedProjectRows: ProjectRow[];
  visibleProjectRows: ProjectRow[];
  sortedChartTasks: Task[];
  leftPanelTasks: Task[];
  chartTaskRows: ChartTaskRowContainer[];
  containerHeight: number;
  taskContentHeight: number;
  
  // 事件处理
  ganttEvents: {
    createTask: (task: Task) => void;
    createMilestone: (milestone: MilestoneNode) => void;
    addNewTask: () => void;
    deleteTaskCore: (taskId: string) => void;
    handleColorChange: (taskId: string, color: string) => void;
    handleTagAdd: (taskId: string, tag: string) => void;
    handleTagRemove: (taskId: string, tag: string) => void;
    handleLabelEdit: (taskId: string, label: string) => void;
    updateTaskDates: (taskId: string, startDate: Date, endDate: Date) => void;
  };
  ganttInteractions: {
    selectedTitleTaskId: string | null;
    setSelectedTitleTaskId: (id: string | null) => void;
    handleToggleExpand: (taskId: string) => void;
    handleCreateSubtask: (taskId: string) => void;
    handleTaskContextMenu: (e: React.MouseEvent, taskId: string) => void;
    handleContextMenu: (e: React.MouseEvent) => void;
    setContextMenu: (state: { visible: boolean; x: number; y: number; clickPosition?: { x: number; y: number } }) => void;
    setTaskContextMenu: (state: { visible: boolean; x: number; y: number; taskId: string | null }) => void;
    contextMenu: {
      visible: boolean;
      x: number;
      y: number;
      clickPosition?: { x: number; y: number };
    };
    taskContextMenu: {
      visible: boolean;
      x: number;
      y: number;
      taskId: string | null;
    };
  };
  handleTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  
  // 标签状态
  availableTags: string[];
  
  // 里程碑状态
  milestones: MilestoneNode[];
  selectedMilestone: string | null;
  milestoneManager: MilestoneManager;
  
  // 里程碑上下文菜单状态
  milestoneContextMenuState: {
    visible: boolean;
    x: number;
    y: number;
    milestoneId: string | null;
  };
  setMilestoneContextMenuState: React.Dispatch<React.SetStateAction<{
    visible: boolean;
    x: number;
    y: number;
    milestoneId: string | null;
  }>>;
  
  // 容器引用
  containerRef: React.RefObject<HTMLDivElement>;
  
  // 当前日期范围检查
  isCurrentDateInRange: boolean;
}