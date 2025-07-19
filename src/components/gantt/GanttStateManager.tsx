import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Task } from '../../types';
import { TimeGranularity } from '../../hooks/gantt/useTimeline';

// 导入自定义 Hooks
import {
  useDragAndDrop,
  useTaskManager,
  useTimeline,
  useTaskFilter,
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
  timeGranularity?: TimeGranularity;
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
  
  // 容器引用
  containerRef: React.RefObject<HTMLDivElement>;
  
  // 当前日期范围检查
  isCurrentDateInRange: boolean;
}

const GanttStateManager: React.FC<GanttStateManagerProps> = ({
  startDate,
  endDate,
  timelineHeight,
  taskHeight,
  timeGranularity = 'month',
  initialProjectRows,
  initialChartTasks,
  children
}) => {
  // === 容器宽度管理 ===
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  
  // 容器宽度监听
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setContainerWidth(width);
      }
    };
    
    // 初始化宽度
    updateContainerWidth();
    
    // 监听窗口大小变化
    const handleResize = () => {
      updateContainerWidth();
    };
    
    window.addEventListener('resize', handleResize);
    
    // 使用 ResizeObserver 监听容器大小变化（如果支持）
    let resizeObserver: ResizeObserver | null = null;
    if (window.ResizeObserver && containerRef.current) {
      resizeObserver = new ResizeObserver(updateContainerWidth);
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);
  // === 使用自定义 Hooks ===
  
  // 任务管理
  const taskManager = useTaskManager({
    projectRows: initialProjectRows,
    chartTasks: initialChartTasks
  });
  
  // 拖拽功能
  const dragAndDrop = useDragAndDrop();
  
  // 时间轴管理 - 传入容器宽度参数
  const timeline = useTimeline(startDate, endDate, timeGranularity, containerWidth);
  
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

  // === 任务过滤 ===
  const { filteredTasks, filterStats } = useTaskFilter(tasks, startDate, endDate);
  
  // 过滤后的图表任务
  const filteredChartTasks = useMemo(() => {
    if (!chartTasks || chartTasks.length === 0) {
      return [];
    }
    
    // 只保留过滤后任务中存在的图表任务
    const filteredTaskIds = new Set(filteredTasks.map(task => task.id));
    return chartTasks.filter(chartTask => filteredTaskIds.has(chartTask.id));
  }, [chartTasks, filteredTasks]);

  // === 使用统一的全局标签管理 ===
  const { availableTags } = useGlobalTags();

  // 事件处理 Hooks（使用原始任务数据，而非过滤后的）
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
    timeScales,
    isCurrentDateInRange
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
    containerRef,
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
  
  // 使用过滤后的图表任务，并添加位置计算
  const sortedChartTasks = useMemo(() => filteredChartTasks.map(task => {
    const x = dateToPixel(task.startDate);
    const width = dateToPixel(task.endDate) - x;
    return { ...task, x, width: Math.max(width, 20) };
  }), [filteredChartTasks, dateToPixel]);

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
    
    // 过滤状态
    filteredTasks,
    filterStats,
    
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
    availableTags,
    
    // 容器引用
    containerRef,
    
    // 当前日期范围检查
    isCurrentDateInRange: isCurrentDateInRange()
  };

  return children(stateData);
};

export default GanttStateManager;