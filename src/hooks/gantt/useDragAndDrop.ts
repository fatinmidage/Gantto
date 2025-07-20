import { useRef, useCallback } from 'react';
import { Task } from '../../types';
import { useDragReducer, DragType } from './useDragReducer';

// 重新导出类型定义
export type { DragType, EdgeHover } from './useDragReducer';

/**
 * 拖拽状态管理Hook - 重构版本
 * 使用 useReducer 模式统一管理复杂拖拽状态
 * 提供向后兼容的API接口
 */
export const useDragAndDrop = () => {
  // 使用新的 reducer 模式管理拖拽状态
  const dragState = useDragReducer();
  
  // === 拖拽缓存 ===
  const containerBounds = useRef<DOMRect | null>(null);

  // 更新容器边界缓存
  const updateContainerBounds = useCallback((element: HTMLElement | null) => {
    if (element) {
      containerBounds.current = element.getBoundingClientRect();
    }
  }, []);

  // 清除拖拽缓存
  const clearDragCache = useCallback(() => {
    containerBounds.current = null;
  }, []);

  // === 重置方法 ===
  const resetHorizontalDrag = useCallback(() => {
    dragState.endHorizontalDrag();
    clearDragCache();
  }, [dragState, clearDragCache]);

  const resetVerticalDrag = useCallback(() => {
    dragState.endVerticalDrag();
  }, [dragState]);

  const resetAllDragStates = useCallback(() => {
    dragState.resetDragState();
    clearDragCache();
  }, [dragState, clearDragCache]);

  // === 水平拖拽操作 ===
  const startHorizontalDrag = useCallback((
    taskId: string,
    task: Task,
    clientX: number,
    clientY: number,
    newDragType: DragType,
    containerElement: HTMLElement | null
  ) => {
    updateContainerBounds(containerElement);
    
    const bounds = containerBounds.current;
    if (bounds) {
      const taskX = task.x || 0;
      const offset = {
        x: clientX - bounds.left - taskX,
        y: clientY - bounds.top
      };
      
      dragState.startHorizontalDrag(taskId, task, newDragType, offset);
      
      // 拖拽处理已在度量适配器中完成
    }
  }, [dragState, updateContainerBounds]);

  const updateHorizontalDragPosition = useCallback((
    clientX: number,
    CHART_WIDTH: number = 800,
    minWidth: number = 20
  ) => {
    if (!dragState.isDragging || !dragState.draggedTask || !dragState.draggedTaskData || !dragState.dragType) return;

    const metrics = dragState.getDragMetrics();
    const bounds = containerBounds.current;
    if (!metrics || !bounds) return;

    const mouseX = clientX - bounds.left;
    const isMilestone = dragState.draggedTaskData.type === 'milestone';

    if (dragState.dragType === 'move') {
      const newX = mouseX - dragState.dragOffset.x;
      const maxX = isMilestone ? CHART_WIDTH : CHART_WIDTH - metrics.minWidth;
      const constrainedX = Math.max(0, Math.min(newX, maxX));
      
      // 里程碑拖拽移动计算
      
      dragState.updateHorizontalDrag({
        id: dragState.draggedTask,
        x: constrainedX,
        width: isMilestone ? 16 : metrics.minWidth
      });
    } else if (dragState.dragType === 'resize-left') {
      const originalRight = (dragState.draggedTaskData.x || 0) + (dragState.draggedTaskData.width || 0);
      const newLeft = Math.max(0, Math.min(mouseX, originalRight - minWidth));
      const newWidth = originalRight - newLeft;
      
      dragState.updateHorizontalDrag({
        id: dragState.draggedTask,
        x: newLeft,
        width: newWidth
      });
    } else if (dragState.dragType === 'resize-right') {
      const newWidth = Math.max(minWidth, Math.min(mouseX - (dragState.draggedTaskData.x || 0), CHART_WIDTH - (dragState.draggedTaskData.x || 0)));
      
      dragState.updateHorizontalDrag({
        id: dragState.draggedTask,
        x: dragState.draggedTaskData.x || 0,
        width: newWidth
      });
    }
  }, [dragState]);

  // === 垂直拖拽操作 ===
  const startVerticalDrag = useCallback((
    taskId: string,
    taskIndex: number,
    clientY: number
  ) => {
    dragState.startVerticalDrag(taskId, taskIndex, clientY);
  }, [dragState]);

  const updateVerticalDragPosition = useCallback((
    clientY: number,
    taskHeight: number = 40,
    totalTasks: number
  ) => {
    if (!dragState.verticalDragState.isDragging || dragState.verticalDragState.draggedTaskIndex === null) return;

    const deltaY = clientY - dragState.verticalDragState.startY;
    const targetIndex = Math.max(0, Math.min(
      Math.round(dragState.verticalDragState.draggedTaskIndex + deltaY / taskHeight),
      totalTasks - 1
    ));

    const shouldShowIndicator = Math.abs(deltaY) > taskHeight / 2;

    dragState.updateVerticalDrag(clientY, targetIndex, shouldShowIndicator);
  }, [dragState]);

  // === 边缘悬停检测 ===
  const checkEdgeHover = useCallback((mouseX: number, taskX: number, taskWidth: number, threshold: number = 8) => {
    const relativeX = mouseX - taskX;
    
    if (relativeX <= threshold) {
      dragState.setEdgeHover('left');
    } else if (relativeX >= taskWidth - threshold) {
      dragState.setEdgeHover('right');
    } else {
      dragState.setEdgeHover(null);
    }
  }, [dragState]);

  const clearEdgeHover = useCallback(() => {
    dragState.setEdgeHover(null);
  }, [dragState]);

  // === 获取边界信息 ===
  const getContainerBounds = useCallback(() => containerBounds.current, []);

  // === 向后兼容的API ===
  const legacyAPI = {
    // 状态访问器
    get draggedTask() { return dragState.draggedTask; },
    get dragOffset() { return dragState.dragOffset; },
    get isDragging() { return dragState.isDragging; },
    get tempDragPosition() { return dragState.tempDragPosition; },
    get draggedTaskData() { return dragState.draggedTaskData; },
    get dragType() { return dragState.dragType; },
    get isHoveringEdge() { return dragState.isHoveringEdge; },
    get verticalDragState() { return dragState.verticalDragState; },
    
    // 状态设置器
    setDraggedTask: dragState.setDraggedTask,
    setDragOffset: dragState.setDragOffset,
    setIsDragging: dragState.setIsDragging,
    setTempDragPosition: dragState.setTempDragPosition,
    setDraggedTaskData: dragState.setDraggedTaskData,
    setDragType: dragState.setDragType,
    setIsHoveringEdge: dragState.setIsHoveringEdge,
    setVerticalDragState: dragState.setVerticalDragState
  };

  return {
    // === 新的 reducer API（推荐使用） ===
    ...dragState,
    
    // === 增强的拖拽操作方法 ===
    startHorizontalDrag,
    updateHorizontalDragPosition,
    startVerticalDrag,
    updateVerticalDragPosition,
    resetHorizontalDrag,
    resetVerticalDrag,
    resetAllDragStates,
    
    // === 边缘悬停检测 ===
    checkEdgeHover,
    clearEdgeHover,
    
    // === 容器边界管理 ===
    updateContainerBounds,
    getContainerBounds,
    clearDragCache,
    
    // === 向后兼容的API（保持现有代码正常工作） ===
    ...legacyAPI
  };
};