import React, { useCallback, useEffect, useMemo } from 'react';
import { getAllDescendantRows, getVisibleProjectRows } from './GanttHelpers';
import { LAYOUT_CONSTANTS } from './ganttStyles';
import { useThrottledMouseMove } from '../../hooks';
import { useHorizontalDrag } from '../../hooks/gantt/useHorizontalDrag';
import { Task, MilestoneNode } from '../../types';

interface GanttEventCoordinatorProps {
  // 状态数据
  sortedChartTasks: any[];
  leftPanelTasks: any[];
  milestones?: MilestoneNode[];
  taskHeight: number;
  
  // 拖拽状态
  isDragging: boolean;
  verticalDragState: any;
  tempDragPosition: any;
  draggedTask: string | null;
  draggedTaskData: any;
  dragType: any;
  isHoveringEdge: 'left' | 'right' | null;
  setIsHoveringEdge: (edge: 'left' | 'right' | null) => void;
  
  // 拖拽方法
  startHorizontalDrag: (taskId: string, task: any, clientX: number, clientY: number, dragType: any, container: HTMLElement) => void;
  startVerticalDrag: (taskId: string, taskIndex: number, clientY: number) => void;
  updateHorizontalDragPosition: (clientX: number, chartWidth: number, minWidth: number) => void;
  updateVerticalDragPosition: (clientY: number, rowHeight: number, totalRows: number) => void;
  updateDragMetrics: (task: any, pixelPerDay: number) => void;
  resetHorizontalDrag: () => void;
  resetVerticalDrag: () => void;
  
  // 里程碑更新回调
  onMilestoneUpdate: (milestoneId: string, updates: Partial<MilestoneNode>) => void;
  
  // 其他方法
  pixelToDate: (pixel: number) => Date;
  dateToPixel: (date: Date) => number;
  dateRange: any;
  setProjectRows: React.Dispatch<React.SetStateAction<any[]>>;
  ganttEvents: any;
  handleTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  
  // 容器引用 - 从状态管理器传入
  containerRef: React.RefObject<HTMLDivElement>;
  
  // 子组件
  children: (handlers: EventHandlers) => React.ReactElement;
}

interface EventHandlers {
  handleCreateTask: (task: Task) => void;
  handleCreateMilestone: (milestone: MilestoneNode) => void;
  handleEdgeHover: (e: React.MouseEvent, task: any) => void;
  handleMouseDown: (e: React.MouseEvent, taskId: string) => void;
  handleMilestoneDragStart: (e: React.MouseEvent, milestone: MilestoneNode) => void;
  handleTitleMouseDown: (e: React.MouseEvent, taskId: string) => void;
  handleMouseMove: (e: MouseEvent) => void;
  handleMouseUp: () => void;
  handleTitleMouseMove: (e: MouseEvent) => void;
  handleTitleMouseUp: () => void;
  handleTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const GanttEventCoordinator: React.FC<GanttEventCoordinatorProps> = ({
  sortedChartTasks,
  leftPanelTasks,
  milestones = [],
  taskHeight,
  isDragging,
  verticalDragState,
  tempDragPosition,
  draggedTask,
  draggedTaskData,
  dragType,
  isHoveringEdge,
  setIsHoveringEdge,
  startHorizontalDrag,
  startVerticalDrag,
  updateHorizontalDragPosition,
  updateVerticalDragPosition,
  updateDragMetrics,
  resetHorizontalDrag,
  resetVerticalDrag,
  onMilestoneUpdate,
  pixelToDate,
  dateToPixel,
  dateRange,
  setProjectRows,
  ganttEvents,
  handleTaskUpdate,
  containerRef,
  children
}) => {

  // 创建任务映射以便快速查找
  const taskMapMemo = useMemo(() => {
    const map = new Map<string, Task>();
    sortedChartTasks.forEach(task => {
      map.set(task.id, task);
    });
    return map;
  }, [sortedChartTasks]);

  // 使用统一拖拽系统
  const unifiedDragHandlers = useHorizontalDrag({
    isDragging,
    draggedTask,
    draggedTaskData,
    dragType,
    tempDragPosition,
    isHoveringEdge,
    sortedChartTasks,
    taskMapMemo,
    containerRef,
    milestones: milestones || [],
    onMilestoneUpdate,
    startHorizontalDrag,
    updateHorizontalDragPosition,
    resetHorizontalDrag,
    pixelToDate,
    dateToPixel,
    updateDragMetrics,
    updateTaskDates: (taskId: string, startDate: Date, endDate: Date) => {
      ganttEvents.updateTaskDates(taskId, startDate, endDate);
    },
    setIsHoveringEdge,
    useThrottledMouseMove
  });

  // 使用统一系统的处理器函数
  const { 
    detectEdgeHover, 
    handleEdgeHover, 
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  } = unifiedDragHandlers;

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
      
      // 修复后的重排序逻辑
      setProjectRows((prev: any[]) => {
        const newRows = [...prev];
        const draggedTaskId = verticalDragState.draggedTaskId;
        const draggedIndex = verticalDragState.draggedTaskIndex!;
        const targetIndex = verticalDragState.targetIndex!;
        
        // 直接使用draggedTaskId查找被拖拽的项目行
        const draggedRow = newRows.find(row => row.id === draggedTaskId);
        if (!draggedRow) return prev;
        
        // 基于visibleProjectRows计算正确的目标位置
        const currentVisibleRows = getVisibleProjectRows(newRows.sort((a, b) => a.order - b.order), new Map(newRows.map(row => [row.id, row])));
        
        // 计算目标位置的正确order值
        let targetOrder: number;
        if (targetIndex >= currentVisibleRows.length) {
          // 拖拽到最后位置
          targetOrder = Math.max(...newRows.map(row => row.order)) + 1;
        } else if (targetIndex === 0) {
          // 拖拽到第一位置
          targetOrder = Math.min(...newRows.map(row => row.order)) - 1;
        } else {
          // 拖拽到中间位置
          const targetRow = currentVisibleRows[targetIndex];
          const targetRowInAll = newRows.find(row => row.id === targetRow.id);
          if (targetRowInAll) {
            if (draggedIndex < targetIndex) {
              // 向下拖拽：插入到目标位置后面
              targetOrder = targetRowInAll.order + 0.5;
            } else {
              // 向上拖拽：插入到目标位置前面
              targetOrder = targetRowInAll.order - 0.5;
            }
          } else {
            return prev;
          }
        }
        
        // 获取所有子代任务
        const descendants = getAllDescendantRows(draggedRow.id, newRows);
        
        // 更新被拖拽行和所有子代任务的order
        const updatedRows = newRows.map(row => {
          if (row.id === draggedRow.id) {
            return { ...row, order: targetOrder };
          }
          // 同步更新所有子代任务，确保它们紧跟在父任务后面
          if (descendants.some(desc => desc.id === row.id)) {
            // 找到这个子任务在descendants中的索引
            const descendantIndex = descendants.findIndex(desc => desc.id === row.id);
            // 子任务的order应该是父任务order + 0.1 + 0.01 * index，确保紧跟在父任务后面
            const newOrder = targetOrder + 0.1 + 0.01 * descendantIndex;
            return { ...row, order: newOrder };
          }
          return row;
        });
        
        // 重新排序并规范化order值
        return updatedRows.sort((a, b) => a.order - b.order).map((row, index) => ({
          ...row,
          order: index
        }));
      });
    }
    resetVerticalDrag();
  }, [verticalDragState, setProjectRows, resetVerticalDrag]);

  // 鼠标移动处理现在由统一拖拽系统处理

  // 鼠标释放处理现在由统一拖拽系统处理

  // 添加水平拖拽事件监听器
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

  // 任务创建处理器
  const handleCreateTask = useCallback((task: Task) => {
    // 这个逻辑需要从父组件传入 ganttInteractions.contextMenu
    // 暂时简化处理
    ganttEvents.createTask(task);
  }, [ganttEvents]);

  const handleCreateMilestone = useCallback((milestone: MilestoneNode) => {
    // 这个逻辑需要从父组件传入 ganttInteractions.contextMenu  
    // 暂时简化处理
    ganttEvents.createMilestone(milestone);
  }, [ganttEvents]);

  // 里程碑拖拽现在由统一系统的 handleMouseDown 处理
  const handleMilestoneDragStart = useCallback((e: React.MouseEvent, milestone: MilestoneNode) => {
    // 直接调用统一系统的 handleMouseDown，它会自动检测里程碑类型
    handleMouseDown(e, milestone.id);
  }, [handleMouseDown]);

  const handlers: EventHandlers = {
    handleCreateTask,
    handleCreateMilestone,
    handleEdgeHover,
    handleMouseDown,
    handleMilestoneDragStart,
    handleTitleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTitleMouseMove,
    handleTitleMouseUp,
    handleTaskUpdate,
    containerRef
  };

  return children(handlers);
};

export default GanttEventCoordinator;