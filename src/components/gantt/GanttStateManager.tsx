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
  layerConfig,
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
  // 转换旧的timeGranularity参数为layerConfig
  const computedLayerConfig = React.useMemo(() => {
    // 优先使用传入的layerConfig
    if (layerConfig) {
      return layerConfig;
    }
    
    // 为了兼容性，将旧的timeGranularity转换为新的layerConfig
    if (timeGranularity) {
      switch (timeGranularity) {
        case 'day':
          return { layers: 2 as const, bottom: 'day' as const, middle: 'week' as const };
        case 'week':
          return { layers: 2 as const, bottom: 'day' as const, middle: 'week' as const };
        case 'month':
          return { layers: 2 as const, bottom: 'day' as const, middle: 'month' as const };
        case 'quarter':
          return { layers: 2 as const, bottom: 'month' as const, middle: 'quarter' as const };
        case 'year':
          return { layers: 2 as const, bottom: 'month' as const, middle: 'year' as const };
        default:
          return { layers: 2 as const, bottom: 'day' as const, middle: 'month' as const };
      }
    }
    return undefined;
  }, [layerConfig, timeGranularity]);
  
  const timeline = useTimeline(startDate, endDate, computedLayerConfig, containerWidth);
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

  // === updateDragMetrics 适配器函数 ===
  const updateDragMetrics = React.useCallback((task: any, pixelPerDay: number) => {
    const duration = task.endDate.getTime() - task.startDate.getTime();
    const isMilestone = task.type === 'milestone';
    
    // 验证输入参数
    if (isNaN(duration)) {
      console.error('🐛 updateDragMetrics: Invalid duration:', {
        task: { id: task.id, title: task.title, startDate: task.startDate, endDate: task.endDate },
        duration,
        startTime: task.startDate.getTime(),
        endTime: task.endDate.getTime()
      });
    }
    
    if (isNaN(pixelPerDay) || pixelPerDay <= 0) {
      console.error('🐛 updateDragMetrics: Invalid pixelPerDay:', pixelPerDay);
    }
    
    // 安全的 minWidth 计算
    let minWidth: number;
    if (isMilestone) {
      minWidth = 16;
    } else {
      const daysWidth = duration / (24 * 60 * 60 * 1000) * pixelPerDay;
      minWidth = isNaN(daysWidth) ? 20 : Math.max(20, Math.ceil(daysWidth));
    }
    
    // 修复里程碑的度量计算 - 使用传入的统一像素比率
    const metrics = {
      duration: isMilestone ? 0 : (isNaN(duration) ? 0 : duration),
      pixelPerDay: isNaN(pixelPerDay) ? 1 : pixelPerDay, // 使用传入的统一像素比率，不区分任务类型
      minWidth: isNaN(minWidth) ? 20 : minWidth
    };
    
    // 度量计算完成
    
    // 里程碑度量适配器处理完成
    
    dragAndDrop.updateDragMetrics(metrics);
  }, [dragAndDrop]);

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
    updateDragMetrics, // 添加高级适配器函数
    
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