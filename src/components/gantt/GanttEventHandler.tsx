import React, { useCallback, useEffect } from 'react';
import { Task, MilestoneNode } from '../../types';

// 导入样式常量
import { LAYOUT_CONSTANTS } from './ganttStyles';

// 导入自定义 Hook
import { useThrottledMouseMove } from '../../hooks';

// 事件处理器属性接口
interface GanttEventHandlerProps {
  children: React.ReactNode;
  
  // 数据状态
  tasks: Task[];
  sortedChartTasks: Task[];
  leftPanelTasks: Task[];
  taskMapMemo: Map<string, Task>;
  setProjectRows: (rows: any) => void;
  taskHeight: number;
  
  // 拖拽状态
  isDragging: boolean;
  draggedTask: string | null;
  draggedTaskData: Task | null;
  dragType: string | null;
  tempDragPosition: any;
  verticalDragState: any;
  isHoveringEdge: string | null;
  setIsHoveringEdge: (edge: string | null) => void;
  
  // 拖拽方法
  startHorizontalDrag: (
    taskId: string, 
    task: Task, 
    clientX: number, 
    clientY: number, 
    dragType: string, 
    container: HTMLElement
  ) => void;
  startVerticalDrag: (taskId: string, taskIndex: number, clientY: number) => void;
  updateHorizontalDragPosition: (clientX: number, chartWidth: number, minTaskWidth: number) => void;
  updateVerticalDragPosition: (clientY: number, taskRowHeight: number, totalTasks: number) => void;
  updateDragMetrics: (task: Task, pixelPerDay: number) => void;
  resetHorizontalDrag: () => void;
  resetVerticalDrag: () => void;
  
  // 事件处理方法
  ganttEvents: any;
  ganttInteractions: any;
  
  // 时间轴方法
  pixelToDate: (pixel: number) => Date;
  dateRange: { 
    startDate: Date; 
    endDate: Date; 
    pixelPerDay?: number; 
  };
  
  // 容器引用
  containerRef: React.RefObject<HTMLDivElement>;
  
  // 布局常量
  CHART_WIDTH: number;
  
  // 菜单状态设置
  setColorPickerState: (state: any) => void;
  setTagManagerState: (state: any) => void;
}

/**
 * 甘特图事件处理器组件
 * 负责处理所有用户交互事件，包括拖拽、点击、悬停等
 */
export const GanttEventHandler: React.FC<GanttEventHandlerProps> = ({
  children,
  tasks,
  sortedChartTasks,
  leftPanelTasks,
  taskMapMemo,
  setProjectRows,
  taskHeight,
  isDragging,
  draggedTask,
  draggedTaskData,
  dragType,
  tempDragPosition,
  verticalDragState,
  isHoveringEdge,
  setIsHoveringEdge,
  startHorizontalDrag,
  startVerticalDrag,
  updateHorizontalDragPosition,
  updateVerticalDragPosition,
  updateDragMetrics,
  resetHorizontalDrag,
  resetVerticalDrag,
  ganttEvents,
  ganttInteractions,
  pixelToDate,
  dateRange,
  containerRef,
  CHART_WIDTH,
  setColorPickerState,
  setTagManagerState
}) => {

  // === 任务操作事件处理器 ===

  const handleCreateTask = useCallback((task: Task) => {
    ganttEvents.createTask(task);
  }, [ganttEvents]);

  const handleCreateMilestone = useCallback((milestone: MilestoneNode) => {
    ganttEvents.createMilestone(milestone);
  }, [ganttEvents]);

  const handleShowColorPicker = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setColorPickerState({
      visible: true,
      x: ganttInteractions.taskContextMenu.x,
      y: ganttInteractions.taskContextMenu.y,
      taskId,
      currentColor: task?.color
    });
  }, [tasks, ganttInteractions.taskContextMenu, setColorPickerState]);

  const handleShowTagManager = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setTagManagerState({
      visible: true,
      x: ganttInteractions.taskContextMenu.x,
      y: ganttInteractions.taskContextMenu.y,
      taskId,
      task
    });
  }, [tasks, ganttInteractions.taskContextMenu, setTagManagerState]);

  const handleTaskDelete = useCallback((taskId: string) => {
    ganttEvents.deleteTaskCore(taskId);
  }, [ganttEvents.deleteTaskCore]);

  const handleColorChange = useCallback((taskId: string, color: string) => {
    ganttEvents.handleColorChange(taskId, color);
    setColorPickerState({ visible: false, x: 0, y: 0 });
  }, [ganttEvents, setColorPickerState]);

  const handleTagAdd = useCallback((taskId: string, tag: string) => {
    ganttEvents.handleTagAdd(taskId, tag);
  }, [ganttEvents]);

  const handleTagRemove = useCallback((taskId: string, tag: string) => {
    ganttEvents.handleTagRemove(taskId, tag);
  }, [ganttEvents]);

  // === 边界检测和拖拽事件处理器 ===

  const detectEdgeHover = useCallback((e: React.MouseEvent, _task: any): 'left' | 'right' | null => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const edgeZone = LAYOUT_CONSTANTS.EDGE_DETECTION_ZONE;
    
    if (mouseX <= edgeZone) return 'left';
    if (mouseX >= rect.width - edgeZone) return 'right';
    return null;
  }, []);

  const handleEdgeHover = useCallback((e: React.MouseEvent, task: any) => {
    if (!isDragging) {
      const edgeType = detectEdgeHover(e, task);
      if (isHoveringEdge !== edgeType) {
        setIsHoveringEdge(edgeType);
      }
    }
  }, [isDragging, isHoveringEdge, detectEdgeHover, setIsHoveringEdge]);

  const handleMouseDown = useCallback((e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    
    const task = sortedChartTasks.find(t => t.id === taskId) || taskMapMemo.get(taskId);
    if (!task || !containerRef.current) return;
    
    const currentDragType = (() => {
      const edgeType = detectEdgeHover(e, task);
      return edgeType ? `resize-${edgeType}` as 'resize-left' | 'resize-right' : 'move';
    })();
    
    // 直接使用固定的 pixelPerDay 计算，避免依赖 dateToPixel
    const totalDays = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (24 * 60 * 60 * 1000));
    const calculatedPixelPerDay = CHART_WIDTH && totalDays > 0 ? CHART_WIDTH / totalDays : 1;
    const safePixelPerDay = typeof calculatedPixelPerDay === 'number' && !isNaN(calculatedPixelPerDay) && calculatedPixelPerDay > 0 
      ? calculatedPixelPerDay 
      : 1;
    
    updateDragMetrics(task, safePixelPerDay);
    startHorizontalDrag(taskId, task, e.clientX, e.clientY, currentDragType, containerRef.current);
  }, [sortedChartTasks, taskMapMemo, detectEdgeHover, updateDragMetrics, dateRange, CHART_WIDTH, startHorizontalDrag, containerRef]);

  const handleTitleMouseDown = useCallback((e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const taskIndex = leftPanelTasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      startVerticalDrag(taskId, taskIndex, e.clientY);
    }
  }, [leftPanelTasks, startVerticalDrag]);

  const handleTitleMouseMove = useCallback((e: MouseEvent) => {
    if (verticalDragState.isDragging) {
      updateVerticalDragPosition(e.clientY, taskHeight, leftPanelTasks.length);
    }
  }, [verticalDragState.isDragging, updateVerticalDragPosition, taskHeight, leftPanelTasks.length]);

  const handleTitleMouseUp = useCallback(() => {
    if (verticalDragState.isDragging && 
        verticalDragState.targetIndex !== null && 
        verticalDragState.draggedTaskIndex !== null &&
        verticalDragState.targetIndex !== verticalDragState.draggedTaskIndex) {
      
      // 简化的重排序逻辑
      setProjectRows((prev: any) => {
        const newRows = [...prev];
        const draggedIndex = verticalDragState.draggedTaskIndex!;
        const targetIndex = verticalDragState.targetIndex!;
        
        // 重新排序
        const draggedRow = newRows.find(row => row.id === leftPanelTasks[draggedIndex].id);
        if (draggedRow) {
          // 简单的order调整
          const targetOrder = targetIndex < newRows.length ? newRows[targetIndex].order : newRows.length;
          const orderDelta = targetOrder - draggedRow.order;
          
          return newRows.map(row => {
            if (row.id === draggedRow.id) {
              return { ...row, order: row.order + orderDelta };
            }
            return row;
          }).sort((a, b) => a.order - b.order).map((row, index) => ({
            ...row,
            order: index
          }));
        }
        return prev;
      });
    }
    resetVerticalDrag();
  }, [verticalDragState, leftPanelTasks, setProjectRows, resetVerticalDrag]);

  const handleMouseMoveCore = useCallback((e: MouseEvent) => {
    if (isDragging) {
      updateHorizontalDragPosition(e.clientX, CHART_WIDTH, LAYOUT_CONSTANTS.MIN_TASK_WIDTH);
    }
  }, [isDragging, updateHorizontalDragPosition, CHART_WIDTH]);

  const handleMouseMove = useThrottledMouseMove(handleMouseMoveCore, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (tempDragPosition && draggedTask && draggedTaskData && dragType) {
      const newStartDate = pixelToDate(tempDragPosition.x);
      const newEndDate = dragType === 'move' 
        ? new Date(newStartDate.getTime() + (draggedTaskData.endDate.getTime() - draggedTaskData.startDate.getTime()))
        : dragType === 'resize-left' 
        ? draggedTaskData.endDate 
        : pixelToDate(tempDragPosition.x + tempDragPosition.width);
      
      ganttEvents.updateTaskDates(draggedTask, newStartDate, newEndDate);
    }
    resetHorizontalDrag();
  }, [tempDragPosition, draggedTask, draggedTaskData, dragType, pixelToDate, ganttEvents, resetHorizontalDrag]);

  // === 事件监听器管理 ===

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

  // 提供事件处理器给子组件
  const eventHandlers = {
    // 任务操作
    handleCreateTask,
    handleCreateMilestone,
    handleShowColorPicker,
    handleShowTagManager,
    handleTaskDelete,
    handleColorChange,
    handleTagAdd,
    handleTagRemove,
    
    // 拖拽事件
    handleEdgeHover,
    handleMouseDown,
    handleTitleMouseDown,
    
    // 边界检测
    detectEdgeHover
  };

  return (
    <div data-event-handler="gantt" style={{ display: 'contents' }}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { eventHandlers } as any);
        }
        return child;
      })}
    </div>
  );
};