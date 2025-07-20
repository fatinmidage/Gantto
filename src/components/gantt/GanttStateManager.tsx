import React from 'react';
import { GanttStateManagerProps, GanttStateData } from './state/GanttStateTypes';
import { useGanttContainerManager } from './state/GanttContainerManager';
import { useGanttStateCalculations } from './state/GanttStateCalculations';

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

/**
 * 甘特图状态管理器 - 重构后的主协调组件
 * 职责：协调各个Hook，组装最终状态数据
 */
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
  // === 容器管理 ===
  const { containerRef, containerWidth } = useGanttContainerManager();

  // === 核心数据管理 ===
  const taskManager = useTaskManager({
    projectRows: initialProjectRows,
    chartTasks: initialChartTasks
  });

  const { 
    projectRows, 
    chartTasks, 
    tasks, 
    setProjectRows, 
    setChartTasks, 
    setTasks
  } = taskManager;

  // === 功能性Hooks ===
  const dragAndDrop = useDragAndDrop();
  const timeline = useTimeline(startDate, endDate, timeGranularity, containerWidth);
  const ganttUI = useGanttUI();
  const { filteredTasks, filterStats } = useTaskFilter(chartTasks, startDate, endDate);
  const { availableTags } = useGlobalTags();

  // === 计算逻辑 ===
  const calculations = useGanttStateCalculations({
    projectRows,
    chartTasks,
    filteredTasks,
    dateToPixel: timeline.dateToPixel,
    taskHeight,
    setTasks,
    setProjectRows
  });

  // === 事件处理 ===
  const ganttEvents = useGanttEvents({
    tasks,
    chartTasks,
    projectRows,
    setTasks,
    setChartTasks,
    setProjectRows
  });

  const ganttInteractions = useGanttInteractions({
    setTasks,
    setChartTasks,
    setProjectRows,
    deleteTaskCore: ganttEvents.deleteTaskCore,
    projectRows,
    containerRef,
    pixelToDate: timeline.pixelToDate,
    taskHeight,
    timelineHeight
  });

  // === 键盘事件处理 ===
  useGanttKeyboard({
    selectedTaskId: ganttUI.selectedChartTaskId || undefined,
    selectedTitleTaskId: ganttInteractions.selectedTitleTaskId || undefined,
    onTaskDelete: ganttEvents.deleteTaskCore,
    onTaskCreate: ganttEvents.addNewTask,
    onZoomIn: timeline.handleZoomIn,
    onZoomOut: timeline.handleZoomOut,
    enabled: true
  });

  // === 状态数据组装 ===
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
    ...dragAndDrop,
    
    // 时间轴状态
    ...timeline,
    
    // UI状态
    ...ganttUI,
    
    // 计算数据
    ...calculations,
    
    // 事件处理
    ganttEvents,
    ganttInteractions,
    
    // 标签状态
    availableTags,
    
    // 容器引用
    containerRef,
    
    // 当前日期范围检查
    isCurrentDateInRange: timeline.isCurrentDateInRange()
  };

  return children(stateData);
};

export default GanttStateManager;