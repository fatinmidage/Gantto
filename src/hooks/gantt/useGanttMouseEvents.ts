import { useCallback, useEffect } from 'react';
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
  
  // 检测是否在任务条边界附近
  const detectEdgeHover = useCallback((e: React.MouseEvent, _task: any): 'left' | 'right' | null => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const edgeZone = 8; // 8px边界检测区域
    
    if (mouseX <= edgeZone) {
      return 'left';
    } else if (mouseX >= rect.width - edgeZone) {
      return 'right';
    }
    return null;
  }, []);

  // 简化的边界检测处理器
  const handleEdgeHover = useCallback((e: React.MouseEvent, task: any) => {
    if (!isDragging) {
      const edgeType = detectEdgeHover(e, task);
      if (isHoveringEdge !== edgeType) {
        setIsHoveringEdge(edgeType);
      }
    }
  }, [isDragging, isHoveringEdge, detectEdgeHover, setIsHoveringEdge]);

  // 水平拖拽处理
  const handleMouseDown = useCallback((e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    
    // 优先查找chartTask
    let task: any = sortedChartTasks.find(t => t.id === taskId);
    
    // 如果不是chartTask，查找兼容性task
    if (!task) {
      task = taskMapMemo.get(taskId);
    }
    
    if (!task || !containerRef.current) return;
    
    // 检测拖拽类型
    // 里程碑始终是移动操作，不支持resize
    const currentDragType = task.type === 'milestone' ? 'move' : (() => {
      const edgeType = detectEdgeHover(e, task);
      return edgeType ? `resize-${edgeType}` as 'resize-left' | 'resize-right' : 'move';
    })();
    
    // 更新拖拽度量缓存
    updateDragMetrics(task, dateToPixel(new Date(Date.now() + 24 * 60 * 60 * 1000)) - dateToPixel(new Date()));
    
    // 使用 Hook 方法开始水平拖拽
    startHorizontalDrag(
      taskId,
      task,
      e.clientX,
      e.clientY,
      currentDragType,
      containerRef.current
    );
  }, [
    sortedChartTasks,
    taskMapMemo,
    containerRef,
    detectEdgeHover,
    updateDragMetrics,
    dateToPixel,
    startHorizontalDrag
  ]);

  // 垂直拖拽处理
  const handleTitleMouseDown = useCallback((e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const taskIndex = leftPanelTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    
    // 使用 Hook 方法开始垂直拖拽
    startVerticalDrag(taskId, taskIndex, e.clientY);
  }, [leftPanelTasks, startVerticalDrag]);

  // 水平拖拽移动处理
  const handleMouseMoveCore = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    // 使用 Hook 方法更新水平拖拽位置
    updateHorizontalDragPosition(
      e.clientX,
      800,  // 图表宽度 - 可以作为参数传入
      20    // 最小宽度
    );
  }, [isDragging, updateHorizontalDragPosition]);

  // 垂直拖拽移动处理
  const handleTitleMouseMove = useCallback((e: MouseEvent) => {
    if (!verticalDragState.isDragging) return;
    
    // 使用 Hook 方法更新垂直拖拽位置
    updateVerticalDragPosition(
      e.clientY,
      40,                       // 任务行高度 (taskHeight + margin)
      leftPanelTasks.length     // 总任务数
    );
  }, [verticalDragState.isDragging, updateVerticalDragPosition, leftPanelTasks.length]);

  // 节流的鼠标移动处理
  const handleMouseMove = useThrottledMouseMove(handleMouseMoveCore, [isDragging]);

  // 水平拖拽结束处理
  const handleMouseUp = useCallback(() => {
    if (tempDragPosition && draggedTask && draggedTaskData && dragType) {
      let newStartDate: Date;
      let newEndDate: Date;
      
      if (dragType === 'move') {
        // 移动任务条：保持时间段长度，改变开始和结束时间
        newStartDate = pixelToDate(tempDragPosition.x);
        if (draggedTaskData.type === 'milestone') {
          // 里程碑只更新开始时间，结束时间保持与开始时间相同
          newEndDate = newStartDate;
        } else {
          // 普通任务保持时间段长度
          const duration = draggedTaskData.endDate.getTime() - draggedTaskData.startDate.getTime();
          newEndDate = new Date(newStartDate.getTime() + duration);
        }
      } else if (dragType === 'resize-left') {
        // 左边界拖拽：改变开始时间，保持结束时间
        newStartDate = pixelToDate(tempDragPosition.x);
        newEndDate = draggedTaskData.endDate;
      } else if (dragType === 'resize-right') {
        // 右边界拖拽：保持开始时间，改变结束时间
        newStartDate = draggedTaskData.startDate;
        newEndDate = pixelToDate(tempDragPosition.x + tempDragPosition.width);
      } else {
        resetHorizontalDrag();
        return;
      }
      
      // 更新任务时间
      updateTaskDates(draggedTask, newStartDate, newEndDate);
    }
    
    // 重置拖拽状态
    resetHorizontalDrag();
  }, [
    tempDragPosition,
    draggedTask,
    draggedTaskData,
    dragType,
    pixelToDate,
    resetHorizontalDrag,
    updateTaskDates
  ]);

  // 垂直拖拽结束处理
  const handleTitleMouseUp = useCallback(() => {
    if (!verticalDragState.isDragging) return;
    
    if (verticalDragState.targetIndex !== null && 
        verticalDragState.draggedTaskIndex !== null &&
        verticalDragState.targetIndex !== verticalDragState.draggedTaskIndex) {
      
      // 重新排序项目行
      updateProjectRowsOrder(
        verticalDragState.draggedTaskIndex,
        verticalDragState.targetIndex
      );
    }
    
    // 重置垂直拖拽状态
    resetVerticalDrag();
  }, [
    verticalDragState.isDragging,
    verticalDragState.targetIndex,
    verticalDragState.draggedTaskIndex,
    updateProjectRowsOrder,
    resetVerticalDrag
  ]);

  // 添加事件监听器
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 添加垂直拖拽事件监听器
  useEffect(() => {
    if (verticalDragState.isDragging) {
      document.addEventListener('mousemove', handleTitleMouseMove);
      document.addEventListener('mouseup', handleTitleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleTitleMouseMove);
        document.removeEventListener('mouseup', handleTitleMouseUp);
      };
    }
  }, [verticalDragState.isDragging, handleTitleMouseMove, handleTitleMouseUp]);

  return {
    // 鼠标事件处理器
    handleMouseDown,
    handleTitleMouseDown,
    handleEdgeHover,
    handleMouseMove,
    handleMouseUp,
    handleTitleMouseMove,
    handleTitleMouseUp,
    
    // 工具方法
    detectEdgeHover
  };
};