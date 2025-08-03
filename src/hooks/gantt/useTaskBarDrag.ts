import { useRef, useCallback } from 'react';
import { Task } from '../../types';
import { useDragReducer, DragType } from './useDragReducer';
import { LAYOUT_CONSTANTS } from '../../components/gantt/ganttStyles';
import { boundaryHelpers } from '../../utils/boundaryUtils';
import { logDragStart } from '../../utils/debugUtils';

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
    // 🐛 调试：记录拖拽开始时的任务状态
    logDragStart(taskId, task, newDragType);
    
    updateContainerBounds(containerElement);
    
    const bounds = containerBounds.current;
    
    if (bounds) {
      // 🔧 优化：基于中心点坐标的拖拽偏移计算
      const taskCenterX = task.x || 0;
      const taskWidth = task.width || LAYOUT_CONSTANTS.DEFAULT_TASK_WIDTH;
      
      // 中心点坐标转换为渲染位置（左边缘）
      const renderLeft = taskCenterX - taskWidth / 2;
      
      const offset = {
        x: clientX - bounds.left - renderLeft,
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
    
    if (dragState.dragType === 'move' || dragState.dragType === 'milestone-move') {
      // 计算新的渲染左边缘位置
      const newRenderLeft = mouseX - dragState.dragOffset.x;
      const taskWidth = metrics.minWidth;
      
      // 转换为中心点坐标
      const newCenterX = newRenderLeft + taskWidth / 2;
      
      // 使用统一边界检测进行约束
      const constrainedPosition = boundaryHelpers.constrainTaskBar(
        newCenterX, 
        taskWidth, 
        CHART_WIDTH
      );
      
      // NaN值检查
      if (isNaN(constrainedPosition.x)) {
        return;
      }
      
      const dragUpdate = {
        id: dragState.draggedTask,
        x: constrainedPosition.x,
        width: taskWidth
      };
      dragState.updateHorizontalDrag(dragUpdate);
    } else if (dragState.dragType === 'resize-left') {
      // 左边缘调整：保持右边缘不变，调整左边缘和宽度
      const originalCenterX = dragState.draggedTaskData.x || 0;
      const originalWidth = dragState.draggedTaskData.width || 0;
      const fixedRightEdge = originalCenterX + originalWidth / 2;
      
      const newLeftEdge = Math.max(0, Math.min(mouseX, fixedRightEdge - minWidth));
      const newWidth = fixedRightEdge - newLeftEdge;
      const newCenterX = newLeftEdge + newWidth / 2;
      
      // 使用统一边界检测进行约束
      const constrainedResize = boundaryHelpers.constrainTaskBar(
        newCenterX, 
        newWidth, 
        CHART_WIDTH
      );
      
      // 🔍 调试：记录左边缘调整的计算过程
      console.group('🔍 [左边缘调整计算过程]');
      console.log(`鼠标位置 mouseX: ${mouseX}px`);
      console.log(`原始中心点: ${originalCenterX}px, 原始宽度: ${originalWidth}px`);
      console.log(`固定右边缘: ${fixedRightEdge}px`);
      console.log(`新左边缘: ${newLeftEdge}px`);
      console.log(`新宽度: ${newWidth}px`);
      console.log(`新中心点: ${newCenterX}px`);
      console.log(`约束后中心点: ${constrainedResize.x}px`);
      console.log(`约束差异: ${Math.abs(newCenterX - constrainedResize.x)}px`);
      console.groupEnd();
      
      dragState.updateHorizontalDrag({
        id: dragState.draggedTask,
        x: constrainedResize.x,
        width: newWidth
      });
    } else if (dragState.dragType === 'resize-right') {
      // 右边缘调整：保持左边缘不变，调整右边缘和宽度
      const originalCenterX = dragState.draggedTaskData.x || 0;
      const originalWidth = dragState.draggedTaskData.width || 0;
      const fixedLeftEdge = originalCenterX - originalWidth / 2;
      
      const newRightEdge = Math.max(fixedLeftEdge + minWidth, Math.min(mouseX, CHART_WIDTH));
      const newWidth = newRightEdge - fixedLeftEdge;
      const newCenterX = fixedLeftEdge + newWidth / 2;
      
      // 使用统一边界检测进行约束
      const constrainedResize = boundaryHelpers.constrainTaskBar(
        newCenterX, 
        newWidth, 
        CHART_WIDTH
      );
      
      dragState.updateHorizontalDrag({
        id: dragState.draggedTask,
        x: constrainedResize.x,
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
  const checkEdgeHover = useCallback((mouseX: number, taskCenterX: number, taskWidth: number, threshold: number = 8) => {
    // 基于中心点坐标的边缘检测
    const taskLeftEdge = taskCenterX - taskWidth / 2;
    const taskRightEdge = taskCenterX + taskWidth / 2;
    
    if (mouseX >= taskLeftEdge && mouseX <= taskLeftEdge + threshold) {
      dragState.setEdgeHover('left');
    } else if (mouseX >= taskRightEdge - threshold && mouseX <= taskRightEdge) {
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