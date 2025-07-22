import React from 'react';
import { Task } from '../../../types';
import { TimeGranularity, LayeredTimeScale, TimelineLayerConfig } from '../../../utils/timelineLayerUtils';

// 甘特图状态管理器属性接口
export interface GanttStateManagerProps {
  startDate: Date;
  endDate: Date;
  timelineHeight: number;
  taskHeight: number;
  timeGranularity?: TimeGranularity;
  initialProjectRows: any[];
  initialChartTasks: any[];
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
  
  // 容器引用
  containerRef: React.RefObject<HTMLDivElement>;
  
  // 当前日期范围检查
  isCurrentDateInRange: boolean;
}