import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDragReducer } from '../useDragReducer';
import { Task } from '../../../types';

describe('useDragReducer', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDragReducer());
    
    expect(result.current.draggedTask).toBeNull();
    expect(result.current.isDragging).toBe(false);
    expect(result.current.tempDragPosition).toBeNull();
    expect(result.current.draggedTaskData).toBeNull();
    expect(result.current.dragType).toBeNull();
    expect(result.current.isHoveringEdge).toBeNull();
    expect(result.current.verticalDragState.isDragging).toBe(false);
  });

  it('should handle horizontal drag start', () => {
    const { result } = renderHook(() => useDragReducer());
    const mockTask: Task = {
      id: 'task-1',
      title: '测试任务',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-07'),
      color: '#ff6b6b',
      x: 100,
      width: 200,
      order: 0,
      type: 'default',
      status: 'pending'
    };

    act(() => {
      result.current.startHorizontalDrag('task-1', mockTask, 'move', { x: 10, y: 20 });
    });

    expect(result.current.draggedTask).toBe('task-1');
    expect(result.current.isDragging).toBe(true);
    expect(result.current.draggedTaskData).toEqual(mockTask);
    expect(result.current.dragType).toBe('move');
  });

  it('should update horizontal drag position', () => {
    const { result } = renderHook(() => useDragReducer());
    
    act(() => {
      result.current.updateHorizontalDrag({ id: 'task-1', x: 150, width: 200 });
    });

    expect(result.current.tempDragPosition).toEqual({
      id: 'task-1',
      x: 150,
      width: 200
    });
  });

  it('should handle horizontal drag end', () => {
    const { result } = renderHook(() => useDragReducer());
    
    // 先开始拖拽
    act(() => {
      result.current.startHorizontalDrag('task-1', {} as Task, 'move', { x: 10, y: 20 });
    });
    
    // 然后结束拖拽
    act(() => {
      result.current.endHorizontalDrag();
    });

    expect(result.current.draggedTask).toBeNull();
    expect(result.current.isDragging).toBe(false);
    expect(result.current.tempDragPosition).toBeNull();
  });

  it('should handle vertical drag start', () => {
    const { result } = renderHook(() => useDragReducer());
    
    act(() => {
      result.current.startVerticalDrag('task-1', 0, 100);
    });

    expect(result.current.verticalDragState.isDragging).toBe(true);
    expect(result.current.verticalDragState.draggedTaskId).toBe('task-1');
    expect(result.current.verticalDragState.draggedTaskIndex).toBe(0);
    expect(result.current.verticalDragState.startY).toBe(100);
  });

  it('should update vertical drag position', () => {
    const { result } = renderHook(() => useDragReducer());
    
    act(() => {
      result.current.startVerticalDrag('task-1', 0, 100);
    });
    
    act(() => {
      result.current.updateVerticalDrag(150, 2, true);
    });

    expect(result.current.verticalDragState.currentY).toBe(150);
    expect(result.current.verticalDragState.targetIndex).toBe(2);
    expect(result.current.verticalDragState.shouldShowIndicator).toBe(true);
  });

  it('should handle vertical drag end', () => {
    const { result } = renderHook(() => useDragReducer());
    
    act(() => {
      result.current.startVerticalDrag('task-1', 0, 100);
      result.current.endVerticalDrag();
    });

    expect(result.current.verticalDragState.isDragging).toBe(false);
    expect(result.current.verticalDragState.draggedTaskId).toBeNull();
    expect(result.current.verticalDragState.draggedTaskIndex).toBeNull();
  });

  it('should set edge hover state', () => {
    const { result } = renderHook(() => useDragReducer());
    
    act(() => {
      result.current.setEdgeHover('left');
    });

    expect(result.current.isHoveringEdge).toBe('left');
  });

  it('should reset all drag state', () => {
    const { result } = renderHook(() => useDragReducer());
    
    // 设置一些状态
    act(() => {
      result.current.startHorizontalDrag('task-1', {} as Task, 'move', { x: 10, y: 20 });
      result.current.startVerticalDrag('task-2', 0, 100);
    });
    
    act(() => {
      result.current.resetDragState();
    });

    expect(result.current.draggedTask).toBeNull();
    expect(result.current.isDragging).toBe(false);
    expect(result.current.verticalDragState.isDragging).toBe(false);
  });

  it('should update drag metrics', () => {
    const { result } = renderHook(() => useDragReducer());
    
    act(() => {
      result.current.updateDragMetrics({ duration: 7, pixelPerDay: 20, minWidth: 100 });
    });
    
    const metrics = result.current.getDragMetrics();
    expect(metrics).toEqual({ duration: 7, pixelPerDay: 20, minWidth: 100 });
  });
});