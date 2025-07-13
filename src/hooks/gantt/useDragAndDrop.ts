import { useState, useRef, useCallback } from 'react';
import { Task, VerticalDragState } from '../../types';

// 拖拽类型定义
export type DragType = 'move' | 'resize-left' | 'resize-right' | null;
export type EdgeHover = 'left' | 'right' | null;

// 拖拽缓存接口
interface DragMetrics {
  duration: number;
  pixelPerDay: number;
  minWidth: number;
}

// 临时拖拽位置
interface TempDragPosition {
  id: string;
  x: number;
  width: number;
}

// 拖拽偏移量
interface DragOffset {
  x: number;
  y: number;
}

// 拖拽状态管理Hook
export const useDragAndDrop = () => {
  // === 水平拖拽状态 ===
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<DragOffset>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [tempDragPosition, setTempDragPosition] = useState<TempDragPosition | null>(null);
  const [draggedTaskData, setDraggedTaskData] = useState<Task | null>(null);
  const [dragType, setDragType] = useState<DragType>(null);
  const [isHoveringEdge, setIsHoveringEdge] = useState<EdgeHover>(null);

  // === 垂直拖拽状态 ===
  const [verticalDragState, setVerticalDragState] = useState<VerticalDragState>({
    isDragging: false,
    draggedTaskId: null,
    draggedTaskIndex: null,
    targetIndex: null,
    startY: 0,
    currentY: 0,
    shouldShowIndicator: false
  });

  // === 拖拽缓存 ===
  const containerBounds = useRef<DOMRect | null>(null);
  const dragMetrics = useRef<DragMetrics | null>(null);

  // 更新容器边界缓存
  const updateContainerBounds = useCallback((element: HTMLElement | null) => {
    if (element) {
      containerBounds.current = element.getBoundingClientRect();
    }
  }, []);

  // 更新拖拽度量缓存
  const updateDragMetrics = useCallback((task: Task, pixelPerDay: number) => {
    if (task) {
      const duration = task.endDate.getTime() - task.startDate.getTime();
      dragMetrics.current = {
        duration,
        pixelPerDay,
        minWidth: Math.max(20, (duration / (24 * 60 * 60 * 1000)) * pixelPerDay)
      };
    }
  }, []);

  // 清除拖拽缓存
  const clearDragCache = useCallback(() => {
    containerBounds.current = null;
    dragMetrics.current = null;
  }, []);

  // 重置水平拖拽状态
  const resetHorizontalDrag = useCallback(() => {
    setIsDragging(false);
    setDraggedTask(null);
    setDraggedTaskData(null);
    setTempDragPosition(null);
    setDragType(null);
    setIsHoveringEdge(null);
    clearDragCache();
  }, [clearDragCache]);

  // 重置垂直拖拽状态
  const resetVerticalDrag = useCallback(() => {
    setVerticalDragState({
      isDragging: false,
      draggedTaskId: null,
      draggedTaskIndex: null,
      targetIndex: null,
      startY: 0,
      currentY: 0,
      shouldShowIndicator: false
    });
  }, []);

  // 开始水平拖拽
  const startHorizontalDrag = useCallback((
    taskId: string,
    task: Task,
    clientX: number,
    clientY: number,
    newDragType: DragType,
    containerElement: HTMLElement | null
  ) => {
    setDraggedTask(taskId);
    setDraggedTaskData(task);
    setIsDragging(true);
    setDragType(newDragType);
    
    updateContainerBounds(containerElement);
    
    const bounds = containerBounds.current;
    if (bounds) {
      // 对里程碑使用正确的位置计算
      const taskX = task.type === 'milestone' ? task.x || 0 : task.x || 0;
      setDragOffset({
        x: clientX - bounds.left - taskX,
        y: clientY - bounds.top
      });
    }
  }, [updateContainerBounds]);

  // 开始垂直拖拽
  const startVerticalDrag = useCallback((
    taskId: string,
    taskIndex: number,
    clientY: number
  ) => {
    setVerticalDragState({
      isDragging: true,
      draggedTaskId: taskId,
      draggedTaskIndex: taskIndex,
      targetIndex: taskIndex,
      startY: clientY,
      currentY: clientY,
      shouldShowIndicator: false
    });
  }, []);

  // 更新水平拖拽位置
  const updateHorizontalDragPosition = useCallback((
    clientX: number,
    CHART_WIDTH: number = 800,
    minWidth: number = 20
  ) => {
    if (!isDragging || !draggedTask || !draggedTaskData || !dragType) return;

    const metrics = dragMetrics.current;
    const bounds = containerBounds.current;
    if (!metrics || !bounds) return;

    // 计算相对于容器的鼠标位置
    const mouseX = clientX - bounds.left;

    if (dragType === 'move') {
      // 移动整个任务条
      const newX = mouseX - dragOffset.x;
      const maxX = draggedTaskData.type === 'milestone' ? CHART_WIDTH : CHART_WIDTH - metrics.minWidth;
      const constrainedX = Math.max(0, Math.min(newX, maxX));
      
      setTempDragPosition({
        id: draggedTask,
        x: constrainedX,
        width: draggedTaskData.type === 'milestone' ? 16 : metrics.minWidth
      });
    } else if (dragType === 'resize-left') {
      // 拖拽左边界
      const originalRight = (draggedTaskData.x || 0) + (draggedTaskData.width || 0);
      const newLeft = Math.max(0, Math.min(mouseX, originalRight - minWidth));
      const newWidth = originalRight - newLeft;
      
      setTempDragPosition({
        id: draggedTask,
        x: newLeft,
        width: newWidth
      });
    } else if (dragType === 'resize-right') {
      // 拖拽右边界
      const newWidth = Math.max(minWidth, Math.min(mouseX - (draggedTaskData.x || 0), CHART_WIDTH - (draggedTaskData.x || 0)));
      
      setTempDragPosition({
        id: draggedTask,
        x: draggedTaskData.x || 0,
        width: newWidth
      });
    }
  }, [isDragging, draggedTask, draggedTaskData, dragType, dragOffset]);

  // 更新垂直拖拽位置
  const updateVerticalDragPosition = useCallback((
    clientY: number,
    taskHeight: number = 40,
    totalTasks: number
  ) => {
    if (!verticalDragState.isDragging || verticalDragState.draggedTaskIndex === null) return;
    
    const deltaY = clientY - verticalDragState.startY;
    const newTargetIndex = Math.max(0, Math.min(
      totalTasks,
      verticalDragState.draggedTaskIndex + Math.floor(deltaY / taskHeight + 0.5)
    ));
    
    // 计算拖拽距离是否超过0.8行
    const dragDistance = Math.abs(deltaY / taskHeight);
    const shouldShowIndicator = dragDistance >= 0.8 && newTargetIndex !== verticalDragState.draggedTaskIndex;
    
    setVerticalDragState(prev => ({
      ...prev,
      currentY: clientY,
      targetIndex: newTargetIndex,
      shouldShowIndicator
    }));
  }, [verticalDragState.isDragging, verticalDragState.startY, verticalDragState.draggedTaskIndex]);

  return {
    // === 水平拖拽状态 ===
    isDragging,
    draggedTask,
    draggedTaskData,
    dragType,
    isHoveringEdge,
    tempDragPosition,
    dragOffset,
    
    // === 垂直拖拽状态 ===
    verticalDragState,
    
    // === 缓存对象 ===
    containerBounds,
    dragMetrics,
    
    // === 状态设置方法 ===
    setIsHoveringEdge,
    setDragType,
    setTempDragPosition,
    
    // === 工具方法 ===
    updateContainerBounds,
    updateDragMetrics,
    clearDragCache,
    resetHorizontalDrag,
    resetVerticalDrag,
    
    // === 拖拽操作方法 ===
    startHorizontalDrag,
    startVerticalDrag,
    updateHorizontalDragPosition,
    updateVerticalDragPosition
  };
};