import { useRef, useCallback } from 'react';
import { Task } from '../../types';
import { useDragReducer, DragType } from './useDragReducer';
import { LAYOUT_CONSTANTS } from '../../components/gantt/ganttStyles';

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
      // 🔧 修复：统一坐标系统 - 所有 x 都是中心点，需要转换为渲染位置
      const isMilestone = task.startDate.getTime() === task.endDate.getTime();
      const taskCenterX = task.x || 0;
      
      // 计算渲染位置（左边缘）
      let taskX: number;
      if (isMilestone) {
        taskX = taskCenterX - LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE / 2;
      } else {
        taskX = taskCenterX - (task.width || 0) / 2;
      }
      
      const offset = {
        x: clientX - bounds.left - taskX,
        y: clientY - bounds.top
      };
      
      dragState.startHorizontalDrag(taskId, task, newDragType, offset);
      
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
      return;
    }
    
    const taskData = dragState.draggedTaskData;
    const isMilestone = taskData.startDate.getTime() === taskData.endDate.getTime();

    if (dragState.dragType === 'move') {
      const newLeftEdge = mouseX - dragState.dragOffset.x;
      
      // 🔧 修复：统一坐标系统 - 计算新的中心点位置
      let newCenterX: number;
      let newWidth: number;
      if (isMilestone) {
        newCenterX = newLeftEdge + LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE / 2;
        newWidth = LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE;
      } else {
        newCenterX = newLeftEdge + metrics.minWidth / 2;
        newWidth = metrics.minWidth;
      }
      
      // 边界约束（基于中心点位置）
      const halfWidth = newWidth / 2;
      const minCenterX = halfWidth;
      const maxCenterX = CHART_WIDTH - halfWidth;
      const constrainedCenterX = Math.max(minCenterX, Math.min(newCenterX, maxCenterX));
      
      if (isNaN(constrainedCenterX)) {
        const fallbackCenterX = halfWidth;
        const dragUpdate = {
          id: dragState.draggedTask,
          x: fallbackCenterX,
          width: newWidth
        };
        dragState.updateHorizontalDrag(dragUpdate);
        return;
      }
      
      const dragUpdate = {
        id: dragState.draggedTask,
        x: constrainedCenterX,
        width: newWidth
      };
      dragState.updateHorizontalDrag(dragUpdate);
    } else if (dragState.dragType === 'resize-left') {
      // 🔧 修复：基于中心点坐标的 resize-left 逻辑
      const originalCenterX = dragState.draggedTaskData.x || 0;
      const originalWidth = dragState.draggedTaskData.width || 0;
      const originalRightEdge = originalCenterX + originalWidth / 2;
      
      const newLeftEdge = Math.max(0, Math.min(mouseX, originalRightEdge - minWidth));
      const newWidth = originalRightEdge - newLeftEdge;
      const newCenterX = newLeftEdge + newWidth / 2;
      
      const dragUpdate = {
        id: dragState.draggedTask,
        x: newCenterX,
        width: newWidth
      };
      
      dragState.updateHorizontalDrag(dragUpdate);
    } else if (dragState.dragType === 'resize-right') {
      // 🔧 修复：基于中心点坐标的 resize-right 逻辑
      const originalCenterX = dragState.draggedTaskData.x || 0;
      const originalWidth = dragState.draggedTaskData.width || 0;
      const originalLeftEdge = originalCenterX - originalWidth / 2;
      
      const newRightEdge = Math.max(originalLeftEdge + minWidth, Math.min(mouseX, CHART_WIDTH));
      const newWidth = newRightEdge - originalLeftEdge;
      const newCenterX = originalLeftEdge + newWidth / 2;
      
      const dragUpdate = {
        id: dragState.draggedTask,
        x: newCenterX,
        width: newWidth
      };
      
      dragState.updateHorizontalDrag(dragUpdate);
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
  const checkEdgeHover = useCallback((mouseX: number, taskCenterX: number, taskWidth: number, threshold: number = 8) => {
    // 🔧 修复：基于中心点坐标的边缘检测
    const taskLeftEdge = taskCenterX - taskWidth / 2;
    const relativeX = mouseX - taskLeftEdge;
    
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