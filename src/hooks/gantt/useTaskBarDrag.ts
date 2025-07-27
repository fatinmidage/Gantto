import { useRef, useCallback } from 'react';
import { Task } from '../../types';
import { useDragReducer, DragType } from './useDragReducer';

// 重新导出类型定义
export type { DragType, EdgeHover } from './useDragReducer';

/**
 * 任务条拖拽状态管理Hook
 * 专门处理任务条（TaskBar）的拖拽逻辑，包括移动、调整大小、垂直拖拽等
 * 使用 useReducer 模式统一管理复杂拖拽状态
 */
export const useTaskBarDrag = () => {
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
      // 🔧 修复：区分里程碑和任务条的偏移量计算
      const isMilestone = task.startDate.getTime() === task.endDate.getTime();
      let taskX = task.x || 0;
      
      if (isMilestone) {
        // 里程碑：task.x 是中心点，需要转换为左边缘位置
        const nodeSize = 16;
        taskX = taskX - nodeSize / 2;
      }
      
      const offset = {
        x: clientX - bounds.left - taskX,
        y: clientY - bounds.top
      };
      
      dragState.startHorizontalDrag(taskId, task, newDragType, offset);
      
    } else {
    }
  }, [dragState, updateContainerBounds]);

  const updateHorizontalDragPosition = useCallback((
    clientX: number,
    CHART_WIDTH: number = 800,
    minWidth: number = 20
  ) => {
    
    if (!dragState.isDragging || !dragState.draggedTask || !dragState.draggedTaskData || !dragState.dragType) {
      return;
    }

    const metrics = dragState.getDragMetrics();
    const bounds = containerBounds.current;
    
    
    if (!metrics || !bounds) {
      return;
    }

    const mouseX = clientX - bounds.left;
    
    if (isNaN(mouseX)) {
    }
    const taskData = dragState.draggedTaskData;
    // 移除了milestone类型判断，所有任务都作为普通任务处理
    

    if (dragState.dragType === 'move') {
      const newX = mouseX - dragState.dragOffset.x;
      const maxX = CHART_WIDTH - metrics.minWidth;
      const constrainedX = Math.max(0, Math.min(newX, maxX));
      
      if (isNaN(constrainedX)) {
        const fallbackX = 0;
        const dragUpdate = {
          id: dragState.draggedTask,
          x: fallbackX,
          width: metrics.minWidth
        };
        dragState.updateHorizontalDrag(dragUpdate);
        return;
      }
      
      // 🔧 修复：里程碑拖拽移动计算
      const isMilestone = taskData.startDate.getTime() === taskData.endDate.getTime();
      
      let finalX = constrainedX;
      if (isMilestone) {
        // 里程碑：constrainedX 是左边缘位置，需要转换回中心点位置
        const nodeSize = 16;
        finalX = constrainedX + nodeSize / 2;
      }
      
      const dragUpdate = {
        id: dragState.draggedTask,
        x: finalX,
        width: isMilestone ? 16 : metrics.minWidth
      };
      
      dragState.updateHorizontalDrag(dragUpdate);
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
    taskHeight: number = 32,
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