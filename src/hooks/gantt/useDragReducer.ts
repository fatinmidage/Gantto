import { useReducer, useRef, useCallback } from 'react';
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

// 统一拖拽状态接口
interface DragState {
  // 水平拖拽状态
  draggedTask: string | null;
  dragOffset: DragOffset;
  isDragging: boolean;
  tempDragPosition: TempDragPosition | null;
  draggedTaskData: Task | null;
  dragType: DragType;
  isHoveringEdge: EdgeHover;
  
  // 垂直拖拽状态
  verticalDragState: VerticalDragState;
}

// 拖拽动作类型
type DragAction =
  | { type: 'START_HORIZONTAL_DRAG'; payload: { taskId: string; taskData: Task; dragType: DragType; offset: DragOffset } }
  | { type: 'UPDATE_HORIZONTAL_DRAG'; payload: { tempPosition: TempDragPosition } }
  | { type: 'END_HORIZONTAL_DRAG' }
  | { type: 'START_VERTICAL_DRAG'; payload: { taskId: string; taskIndex: number; startY: number } }
  | { type: 'UPDATE_VERTICAL_DRAG'; payload: { currentY: number; targetIndex: number | null; shouldShowIndicator: boolean } }
  | { type: 'END_VERTICAL_DRAG' }
  | { type: 'SET_EDGE_HOVER'; payload: EdgeHover }
  | { type: 'RESET_ALL' };

// 初始状态
const initialDragState: DragState = {
  // 水平拖拽初始状态
  draggedTask: null,
  dragOffset: { x: 0, y: 0 },
  isDragging: false,
  tempDragPosition: null,
  draggedTaskData: null,
  dragType: null,
  isHoveringEdge: null,
  
  // 垂直拖拽初始状态
  verticalDragState: {
    isDragging: false,
    draggedTaskId: null,
    draggedTaskIndex: null,
    targetIndex: null,
    startY: 0,
    currentY: 0,
    shouldShowIndicator: false
  }
};

// 拖拽状态reducer
const dragReducer = (state: DragState, action: DragAction): DragState => {
  switch (action.type) {
    case 'START_HORIZONTAL_DRAG':
      console.log('🐛 dragReducer START_HORIZONTAL_DRAG:', action.payload);
      const newState = {
        ...state,
        draggedTask: action.payload.taskId,
        draggedTaskData: action.payload.taskData,
        dragType: action.payload.dragType,
        dragOffset: action.payload.offset,
        isDragging: true,
        isHoveringEdge: null
      };
      console.log('🐛 New drag state:', {
        isDragging: newState.isDragging,
        draggedTask: newState.draggedTask,
        dragType: newState.dragType
      });
      return newState;

    case 'UPDATE_HORIZONTAL_DRAG':
      console.log('🐛 dragReducer UPDATE_HORIZONTAL_DRAG:', {
        payload: action.payload,
        tempPosition: action.payload.tempPosition,
        xValue: action.payload.tempPosition.x,
        xIsNaN: isNaN(action.payload.tempPosition.x),
        widthValue: action.payload.tempPosition.width,
        widthIsNaN: isNaN(action.payload.tempPosition.width)
      });
      return {
        ...state,
        tempDragPosition: action.payload.tempPosition
      };

    case 'END_HORIZONTAL_DRAG':
      return {
        ...state,
        draggedTask: null,
        draggedTaskData: null,
        dragType: null,
        isDragging: false,
        tempDragPosition: null,
        dragOffset: { x: 0, y: 0 },
        isHoveringEdge: null
      };

    case 'START_VERTICAL_DRAG':
      return {
        ...state,
        verticalDragState: {
          isDragging: true,
          draggedTaskId: action.payload.taskId,
          draggedTaskIndex: action.payload.taskIndex,
          targetIndex: null,
          startY: action.payload.startY,
          currentY: action.payload.startY,
          shouldShowIndicator: false
        }
      };

    case 'UPDATE_VERTICAL_DRAG':
      return {
        ...state,
        verticalDragState: {
          ...state.verticalDragState,
          currentY: action.payload.currentY,
          targetIndex: action.payload.targetIndex,
          shouldShowIndicator: action.payload.shouldShowIndicator
        }
      };

    case 'END_VERTICAL_DRAG':
      return {
        ...state,
        verticalDragState: {
          isDragging: false,
          draggedTaskId: null,
          draggedTaskIndex: null,
          targetIndex: null,
          startY: 0,
          currentY: 0,
          shouldShowIndicator: false
        }
      };

    case 'SET_EDGE_HOVER':
      return {
        ...state,
        isHoveringEdge: action.payload
      };

    case 'RESET_ALL':
      return initialDragState;

    default:
      return state;
  }
};

/**
 * 统一拖拽状态管理 Hook
 * 使用 useReducer 管理复杂的拖拽状态，确保状态更新的原子性
 */
export const useDragReducer = () => {
  const [dragState, dispatch] = useReducer(dragReducer, initialDragState);
  
  // === 拖拽缓存 ===
  const dragMetricsRef = useRef<DragMetrics>({ duration: 0, pixelPerDay: 0, minWidth: 0 });

  // === 水平拖拽操作 ===
  const startHorizontalDrag = useCallback((taskId: string, taskData: Task, dragType: DragType, offset: DragOffset) => {
    console.log('🐛 useDragReducer startHorizontalDrag dispatching:', {
      taskId,
      taskData: taskData ? { id: taskData.id, title: taskData.title } : null,
      dragType,
      offset
    });
    dispatch({
      type: 'START_HORIZONTAL_DRAG',
      payload: { taskId, taskData, dragType, offset }
    });
    console.log('🐛 After dispatch, current state will be updated');
  }, []);

  const updateHorizontalDrag = useCallback((tempPosition: TempDragPosition) => {
    dispatch({
      type: 'UPDATE_HORIZONTAL_DRAG',
      payload: { tempPosition }
    });
  }, []);

  const endHorizontalDrag = useCallback(() => {
    dispatch({ type: 'END_HORIZONTAL_DRAG' });
  }, []);

  // === 垂直拖拽操作 ===
  const startVerticalDrag = useCallback((taskId: string, taskIndex: number, startY: number) => {
    dispatch({
      type: 'START_VERTICAL_DRAG',
      payload: { taskId, taskIndex, startY }
    });
  }, []);

  const updateVerticalDrag = useCallback((currentY: number, targetIndex: number | null, shouldShowIndicator: boolean) => {
    dispatch({
      type: 'UPDATE_VERTICAL_DRAG',
      payload: { currentY, targetIndex, shouldShowIndicator }
    });
  }, []);

  const endVerticalDrag = useCallback(() => {
    dispatch({ type: 'END_VERTICAL_DRAG' });
  }, []);

  // === 边缘悬停操作 ===
  const setEdgeHover = useCallback((edge: EdgeHover) => {
    dispatch({ type: 'SET_EDGE_HOVER', payload: edge });
  }, []);

  // === 重置操作 ===
  const resetDragState = useCallback(() => {
    dispatch({ type: 'RESET_ALL' });
  }, []);

  // === 拖拽缓存操作 ===
  const updateDragMetrics = useCallback((metrics: DragMetrics) => {
    dragMetricsRef.current = metrics;
  }, []);

  const getDragMetrics = useCallback(() => dragMetricsRef.current, []);

  return {
    // 状态
    ...dragState,
    
    // 水平拖拽操作
    startHorizontalDrag,
    updateHorizontalDrag,
    endHorizontalDrag,
    
    // 垂直拖拽操作
    startVerticalDrag,
    updateVerticalDrag,
    endVerticalDrag,
    
    // 边缘悬停操作
    setEdgeHover,
    
    // 重置操作
    resetDragState,
    
    // 拖拽缓存操作
    updateDragMetrics,
    getDragMetrics,
    
    // 兼容性别名（保持向后兼容）
    setDraggedTask: (taskId: string | null) => taskId ? null : endHorizontalDrag(),
    setDragOffset: (offset: DragOffset) => updateHorizontalDrag({ id: dragState.draggedTask || '', x: offset.x, width: 0 }),
    setIsDragging: (isDragging: boolean) => isDragging ? null : endHorizontalDrag(),
    setTempDragPosition: updateHorizontalDrag,
    setDraggedTaskData: (_taskData: Task | null) => null, // 在新API中通过startHorizontalDrag设置
    setDragType: (_dragType: DragType) => null, // 在新API中通过startHorizontalDrag设置
    setIsHoveringEdge: setEdgeHover,
    setVerticalDragState: (state: VerticalDragState) => {
      if (state.isDragging && !dragState.verticalDragState.isDragging) {
        startVerticalDrag(state.draggedTaskId || '', state.draggedTaskIndex || 0, state.startY);
      } else if (!state.isDragging) {
        endVerticalDrag();
      }
    }
  };
};