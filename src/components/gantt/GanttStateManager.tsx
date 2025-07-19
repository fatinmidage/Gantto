import React, { useMemo } from 'react';
import { Task } from '../../types';

// 导入自定义 Hooks
import {
  useDragAndDrop,
  useTaskManager,
  useTimeline,
  useGanttUI,
  useGanttEvents,
  useGanttInteractions,
  useGanttKeyboard,
  useGlobalTags
} from '../../hooks';

// 导入层级帮助函数
import {
  getVisibleProjectRows
} from './GanttHelpers';

// 导入样式常量
import {
  LAYOUT_CONSTANTS
} from './ganttStyles';

interface GanttStateManagerProps {
  startDate: Date;
  endDate: Date;
  timelineHeight: number;
  taskHeight: number;
  initialProjectRows: any[];
  initialChartTasks: any[];
  children: (state: GanttStateData) => React.ReactElement;
}

interface GanttStateData {
  // 数据状态
  projectRows: any[];
  chartTasks: any[];
  tasks: any[];
  setProjectRows: React.Dispatch<React.SetStateAction<any[]>>;
  setChartTasks: React.Dispatch<React.SetStateAction<any[]>>;
  setTasks: React.Dispatch<React.SetStateAction<any[]>>;
  
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
  timeScales: any[];
  
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
  
  // 标签状态
  availableTags: string[];
}

const GanttStateManager: React.FC<GanttStateManagerProps> = ({
  startDate,
  endDate,
  timelineHeight,
  taskHeight,
  initialProjectRows,
  initialChartTasks,
  children
}) => {
  // === 使用自定义 Hooks ===
  
  // 任务管理
  const taskManager = useTaskManager({
    projectRows: initialProjectRows,
    chartTasks: initialChartTasks
  });
  
  // 拖拽功能
  const dragAndDrop = useDragAndDrop();
  
  // 时间轴管理
  const timeline = useTimeline(startDate, endDate);
  
  // UI 状态管理
  const ganttUI = useGanttUI();

  // === 数据状态 ===
  const { 
    projectRows, 
    chartTasks, 
    tasks, 
    setProjectRows, 
    setChartTasks, 
    setTasks
  } = taskManager;

  // === 使用统一的全局标签管理 ===
  const { availableTags } = useGlobalTags();

  // 事件处理 Hooks
  const ganttEvents = useGanttEvents({
    tasks,
    chartTasks,
    projectRows,
    setTasks,
    setChartTasks,
    setProjectRows
  });
  
  // 拖拽状态和方法
  const {
    draggedTask,
    isDragging,
    tempDragPosition,
    verticalDragState,
    isHoveringEdge,
    setIsHoveringEdge,
    draggedTaskData,
    dragType,
    startHorizontalDrag,
    startVerticalDrag,
    updateHorizontalDragPosition,
    updateVerticalDragPosition,
    updateDragMetrics,
    resetHorizontalDrag,
    resetVerticalDrag
  } = dragAndDrop;
  
  // 时间轴状态和方法
  const {
    zoomLevel,
    dateRange,
    dateToPixel,
    pixelToDate,
    handleZoomIn,
    handleZoomOut,
    handleViewToday,
    timeScales
  } = timeline;
  
  // UI状态和方法
  const {
    selectedChartTaskId,
    setSelectedChartTaskId
  } = ganttUI;
  
  // 甘特图交互功能
  const ganttInteractions = useGanttInteractions({
    setTasks,
    setChartTasks,
    setProjectRows,
    deleteTaskCore: ganttEvents.deleteTaskCore,
    projectRows,
    containerRef: { current: null },
    pixelToDate,
    taskHeight,
    timelineHeight
  });
  
  // 键盘事件处理
  useGanttKeyboard({
    selectedTaskId: selectedChartTaskId || undefined,
    selectedTitleTaskId: ganttInteractions.selectedTitleTaskId || undefined,
    onTaskDelete: ganttEvents.deleteTaskCore,
    onTaskCreate: ganttEvents.addNewTask,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    enabled: true
  });
  
  // === 计算派生状态 ===
  const MIN_CONTAINER_HEIGHT = LAYOUT_CONSTANTS.MIN_CONTAINER_HEIGHT;
  
  const sortedProjectRows = useMemo(() => 
    [...projectRows].sort((a, b) => a.order - b.order), 
    [projectRows]
  );
  
  const projectRowMapMemo = useMemo(() => 
    new Map(sortedProjectRows.map(row => [row.id, row])), 
    [sortedProjectRows]
  );
  
  const visibleProjectRows = useMemo(() => 
    getVisibleProjectRows(sortedProjectRows, projectRowMapMemo), 
    [sortedProjectRows, projectRowMapMemo]
  );
  
  const sortedChartTasks = useMemo(() => chartTasks.map(task => {
    const x = dateToPixel(task.startDate);
    const width = dateToPixel(task.endDate) - x;
    return { ...task, x, width: Math.max(width, 20) };
  }), [chartTasks, dateToPixel]);

  const leftPanelTasks = useMemo(() => visibleProjectRows.map(row => ({
    ...row,
    startDate: new Date(),
    endDate: new Date(),
    color: '#ccc',
    x: 0,
    width: 0,
    status: 'pending' as const,
    rowId: row.id,
    isCreatedFromContext: false,
    isPlaceholder: false,
    type: (row.type || 'default') as 'milestone' | 'development' | 'testing' | 'delivery' | 'default'
  })), [visibleProjectRows]);

  const chartTaskRows = useMemo(() => {
    const rowMap = new Map<string, Task[]>();
    visibleProjectRows.forEach(row => rowMap.set(row.id, []));
    sortedChartTasks.forEach(task => task.rowId && rowMap.has(task.rowId) && rowMap.get(task.rowId)!.push(task));
    return visibleProjectRows.map(row => ({
      rowId: row.id,
      tasks: rowMap.get(row.id)!.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    }));
  }, [visibleProjectRows, sortedChartTasks]);

  const containerHeight = useMemo(() => 
    Math.max(MIN_CONTAINER_HEIGHT, leftPanelTasks.length * (taskHeight + 10) + 20), 
    [leftPanelTasks.length, taskHeight]
  );

  const taskContentHeight = useMemo(() => containerHeight, [containerHeight]);

  // 构建状态数据对象
  const stateData: GanttStateData = {
    // 数据状态
    projectRows,
    chartTasks,
    tasks,
    setProjectRows,
    setChartTasks,
    setTasks,
    
    // 拖拽状态
    draggedTask,
    isDragging,
    tempDragPosition,
    verticalDragState,
    isHoveringEdge,
    setIsHoveringEdge,
    draggedTaskData,
    dragType,
    startHorizontalDrag,
    startVerticalDrag,
    updateHorizontalDragPosition,
    updateVerticalDragPosition,
    updateDragMetrics,
    resetHorizontalDrag,
    resetVerticalDrag,
    
    // 时间轴状态
    zoomLevel,
    dateRange,
    dateToPixel,
    pixelToDate,
    handleZoomIn,
    handleZoomOut,
    handleViewToday,
    timeScales,
    
    // UI状态
    selectedChartTaskId,
    setSelectedChartTaskId,
    
    // 计算数据
    sortedProjectRows,
    visibleProjectRows,
    sortedChartTasks,
    leftPanelTasks,
    chartTaskRows,
    containerHeight,
    taskContentHeight,
    
    // 事件处理
    ganttEvents,
    ganttInteractions,
    
    // 标签状态
    availableTags
  };

  return children(stateData);
};

export default GanttStateManager;