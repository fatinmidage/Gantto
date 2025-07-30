import React from 'react';
import { Task, MilestoneNode } from '../../../types';
import { TimeGranularity, LayeredTimeScale, TimelineLayerConfig } from '../../../utils/timelineLayerUtils';

// 里程碑管理器类型接口
export interface MilestoneManager {
  // 状态
  milestones: MilestoneNode[];
  selectedMilestone: string | null;
  
  // CRUD 操作
  createMilestone: (input: any) => void;
  updateMilestone: (updates: any) => void;
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
  initialProjectRows: any[];
  initialChartTasks: any[];
  initialMilestones?: MilestoneNode[];
  children: (state: GanttStateData) => React.ReactElement;
}

// 甘特图状态数据接口
export interface GanttStateData {
  // 数据状态
  projectRows: any[];
  chartTasks: any[];
  tasks: any[];
  setProjectRows: React.Dispatch<React.SetStateAction<any[]>>;
  setChartTasks: React.Dispatch<React.SetStateAction<any[]>>;
  setTasks: React.Dispatch<React.SetStateAction<any[]>>;
  
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
  tempDragPosition: any;
  verticalDragState: any;
  isHoveringEdge: 'left' | 'right' | null;
  setIsHoveringEdge: (edge: 'left' | 'right' | null) => void;
  draggedTaskData: any;
  dragType: any;
  startHorizontalDrag: (taskId: string, task: any, clientX: number, clientY: number, dragType: any, container: HTMLElement) => void;
  startVerticalDrag: (taskId: string, taskIndex: number, clientY: number) => void;
  updateHorizontalDragPosition: (clientX: number, chartWidth: number, minWidth: number) => void;
  updateVerticalDragPosition: (clientY: number, rowHeight: number, totalRows: number) => void;
  updateDragMetrics: (task: any, pixelPerDay: number) => void;
  resetHorizontalDrag: () => void;
  resetVerticalDrag: () => void;
  
  // 时间轴状态
  zoomLevel: number;
  dateRange: any;
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
  sortedProjectRows: any[];
  visibleProjectRows: any[];
  sortedChartTasks: any[];
  leftPanelTasks: any[];
  chartTaskRows: any[];
  containerHeight: number;
  taskContentHeight: number;
  
  // 事件处理
  ganttEvents: any;
  ganttInteractions: any;
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