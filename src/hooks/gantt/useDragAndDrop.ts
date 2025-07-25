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
    console.log('🐛 useDragAndDrop startHorizontalDrag called:', {
      taskId,
      task: task ? { id: task.id, title: task.title, x: task.x, width: task.width } : null,
      clientX,
      clientY,
      newDragType,
      hasContainer: !!containerElement
    });
    
    updateContainerBounds(containerElement);
    
    const bounds = containerBounds.current;
    console.log('🐛 Container bounds:', bounds);
    
    if (bounds) {
      const taskX = task.x || 0;
      
      console.log('🐛 Offset calculation inputs:', {
        clientX,
        clientY,
        boundsLeft: bounds.left,
        boundsTop: bounds.top,
        taskX,
        clientXValid: !isNaN(clientX),
        clientYValid: !isNaN(clientY),
        boundsLeftValid: !isNaN(bounds.left),
        boundsTopValid: !isNaN(bounds.top),
        taskXValid: !isNaN(taskX)
      });
      
      const offset = {
        x: clientX - bounds.left - taskX,
        y: clientY - bounds.top
      };
      
      console.log('🐛 Starting drag with offset:', {
        offset,
        offsetXValid: !isNaN(offset.x),
        offsetYValid: !isNaN(offset.y)
      });
      
      dragState.startHorizontalDrag(taskId, task, newDragType, offset);
      
      console.log('🐛 Drag state after start:', {
        isDragging: dragState.isDragging,
        draggedTask: dragState.draggedTask,
        dragType: dragState.dragType
      });
      
      // 拖拽处理已在度量适配器中完成
    } else {
      console.log('🐛 Failed to get container bounds');
    }
  }, [dragState, updateContainerBounds]);

  const updateHorizontalDragPosition = useCallback((
    clientX: number,
    CHART_WIDTH: number = 800,
    minWidth: number = 20
  ) => {
    console.log('🐛 updateHorizontalDragPosition called:', {
      clientX,
      CHART_WIDTH,
      minWidth,
      isDragging: dragState.isDragging,
      draggedTask: dragState.draggedTask,
      hasDraggedTaskData: !!dragState.draggedTaskData,
      dragType: dragState.dragType
    });
    
    if (!dragState.isDragging || !dragState.draggedTask || !dragState.draggedTaskData || !dragState.dragType) {
      console.log('🐛 updateHorizontalDragPosition: Early return due to missing state');
      return;
    }

    const metrics = dragState.getDragMetrics();
    const bounds = containerBounds.current;
    
    console.log('🐛 updateHorizontalDragPosition dependencies:', {
      hasMetrics: !!metrics,
      hasBounds: !!bounds,
      metrics,
      bounds
    });
    
    if (!metrics || !bounds) {
      console.error('🐛 updateHorizontalDragPosition: Missing metrics or bounds');
      return;
    }

    const mouseX = clientX - bounds.left;
    
    // 只在 mouseX 是 NaN 时才记录调试信息
    if (isNaN(mouseX)) {
      console.error('🐛 mouseX is NaN:', {
        clientX,
        clientXValid: !isNaN(clientX),
        boundsLeft: bounds.left,
        boundsLeftValid: !isNaN(bounds.left),
        mouseX,
        mouseXValid: !isNaN(mouseX)
      });
    }
    const taskData = dragState.draggedTaskData;
    const isTypeMilestone = taskData.type === 'milestone';
    const isTimeEqual = taskData.startDate.getTime() === taskData.endDate.getTime();
    const isMilestone = isTypeMilestone || isTimeEqual;
    
    // 简化的调试日志，只在需要时显示
    // console.log(`[useDragAndDrop] 拖拽更新位置 - 任务ID: ${taskData.id}`);

    if (dragState.dragType === 'move') {
      const newX = mouseX - dragState.dragOffset.x;
      const maxX = isMilestone ? CHART_WIDTH : CHART_WIDTH - metrics.minWidth;
      const constrainedX = Math.max(0, Math.min(newX, maxX));
      
      // 只在计算出 NaN 时显示详细调试信息
      if (isNaN(constrainedX)) {
        console.error('🐛 constrainedX is NaN - Full diagnostic:', {
          // 输入值诊断
          mouseX,
          dragOffsetX: dragState.dragOffset.x,
          mouseXValid: !isNaN(mouseX),
          dragOffsetXValid: !isNaN(dragState.dragOffset.x),
          CHART_WIDTH,
          metricsMinWidth: metrics.minWidth,
          isMilestone,
          // 计算过程诊断
          newX,
          newXValid: !isNaN(newX),
          maxX,
          maxXValid: !isNaN(maxX),
          constrainedX,
          constrainedXValid: !isNaN(constrainedX),
          // 更深层的数据检查
          clientX: mouseX + bounds.left, // 反推 clientX
          boundsLeft: bounds.left,
          taskData: {
            id: taskData.id,
            title: taskData.title,
            x: taskData.x,
            width: taskData.width
          }
        });
        
        const fallbackX = 0;
        const dragUpdate = {
          id: dragState.draggedTask,
          x: fallbackX,
          width: isMilestone ? 16 : metrics.minWidth
        };
        console.log('🐛 Using fallback dragUpdate:', dragUpdate);
        dragState.updateHorizontalDrag(dragUpdate);
        return;
      }
      
      // 里程碑拖拽移动计算
      
      const dragUpdate = {
        id: dragState.draggedTask,
        x: constrainedX,
        width: isMilestone ? 16 : metrics.minWidth
      };
      
      console.log('🐛 Calling updateHorizontalDrag with:', dragUpdate);
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