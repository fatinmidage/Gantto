import { useEffect } from 'react';
import { useHorizontalDrag } from './useHorizontalDrag';
import { useVerticalDrag } from './useVerticalDrag';
import { Task } from '../../types';

interface UseGanttMouseEventsProps {
  // 拖拽相关
  isDragging: boolean;
  draggedTask: string | null;
  draggedTaskData: Task | null;
  dragType: 'move' | 'resize-left' | 'resize-right' | null;
  tempDragPosition: { x: number; width: number } | null;
  isHoveringEdge: 'left' | 'right' | null;
  
  // 垂直拖拽相关
  verticalDragState: {
    isDragging: boolean;
    draggedTaskIndex: number | null;
    startY: number;
    targetIndex: number | null;
  };
  
  // 任务和容器数据
  sortedChartTasks: Task[];
  leftPanelTasks: Task[];
  taskMapMemo: Map<string, Task>;
  containerRef: React.RefObject<HTMLDivElement>;
  
  // 拖拽系统方法
  startHorizontalDrag: (taskId: string, task: Task, clientX: number, clientY: number, dragType: string, container: HTMLDivElement) => void;
  updateHorizontalDragPosition: (clientX: number, chartWidth: number, minWidth: number) => void;
  resetHorizontalDrag: () => void;
  
  startVerticalDrag: (taskId: string, taskIndex: number, clientY: number) => void;
  updateVerticalDragPosition: (clientY: number, taskHeight: number, totalTasks: number) => void;
  resetVerticalDrag: () => void;
  
  // 数据更新方法
  updateTaskDates: (taskId: string, startDate: Date, endDate: Date) => void;
  updateProjectRowsOrder: (draggedIndex: number, targetIndex: number) => void;
  
  // 工具方法
  pixelToDate: (pixel: number) => Date;
  dateToPixel: (date: Date) => number;
  updateDragMetrics: (task: Task, pixelPerDay: number) => void;
  
  // 事件设置
  setIsHoveringEdge: (edge: 'left' | 'right' | null) => void;
  useThrottledMouseMove: (callback: (e: MouseEvent) => void, deps: any[]) => (e: MouseEvent) => void;
}

export const useGanttMouseEvents = ({
  isDragging,
  draggedTask,
  draggedTaskData,
  dragType,
  tempDragPosition,
  isHoveringEdge,
  verticalDragState,
  sortedChartTasks,
  leftPanelTasks,
  taskMapMemo,
  containerRef,
  startHorizontalDrag,
  updateHorizontalDragPosition,
  resetHorizontalDrag,
  startVerticalDrag,
  updateVerticalDragPosition,
  resetVerticalDrag,
  updateTaskDates,
  updateProjectRowsOrder,
  pixelToDate,
  dateToPixel,
  updateDragMetrics,
  setIsHoveringEdge,
  useThrottledMouseMove
}: UseGanttMouseEventsProps) => {
  
  // 使用水平拖拽子hook
  const horizontalDrag = useHorizontalDrag({
    isDragging,
    draggedTask,
    draggedTaskData,
    dragType,
    tempDragPosition,
    isHoveringEdge,
    sortedChartTasks,
    taskMapMemo,
    containerRef,
    startHorizontalDrag,
    updateHorizontalDragPosition,
    resetHorizontalDrag,
    pixelToDate,
    dateToPixel,
    updateDragMetrics,
    updateTaskDates,
    setIsHoveringEdge,
    useThrottledMouseMove
  });
  
  // 使用垂直拖拽子hook
  const verticalDrag = useVerticalDrag({
    verticalDragState,
    leftPanelTasks,
    startVerticalDrag,
    updateVerticalDragPosition,
    resetVerticalDrag,
    updateProjectRowsOrder
  });

  // 添加水平拖拽事件监听器
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', horizontalDrag.handleMouseMove);
      document.addEventListener('mouseup', horizontalDrag.handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', horizontalDrag.handleMouseMove);
        document.removeEventListener('mouseup', horizontalDrag.handleMouseUp);
      };
    }
  }, [isDragging, horizontalDrag.handleMouseMove, horizontalDrag.handleMouseUp]);

  return {
    // 水平拖拽事件处理器 (来自 useHorizontalDrag)
    handleMouseDown: horizontalDrag.handleMouseDown,
    handleEdgeHover: horizontalDrag.handleEdgeHover,
    handleMouseMove: horizontalDrag.handleMouseMove,
    handleMouseUp: horizontalDrag.handleMouseUp,
    detectEdgeHover: horizontalDrag.detectEdgeHover,
    
    // 垂直拖拽事件处理器 (来自 useVerticalDrag)
    handleTitleMouseDown: verticalDrag.handleTitleMouseDown,
    handleTitleMouseMove: verticalDrag.handleTitleMouseMove,
    handleTitleMouseUp: verticalDrag.handleTitleMouseUp
  };
};