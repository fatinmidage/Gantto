import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGanttUIState } from '../useGanttUIState';

describe('useGanttUIState', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useGanttUIState());
    
    expect(result.current.selectedTitleTaskId).toBeNull();
    expect(result.current.selectedChartTaskId).toBeNull();
    expect(result.current.contextMenu.visible).toBe(false);
    expect(result.current.taskContextMenu.visible).toBe(false);
    expect(result.current.colorPickerState.visible).toBe(false);
    expect(result.current.tagManagerState.visible).toBe(false);
  });

  it('should handle title task selection', () => {
    const { result } = renderHook(() => useGanttUIState());
    
    act(() => {
      result.current.selectTitleTask('task-1');
    });
    
    expect(result.current.selectedTitleTaskId).toBe('task-1');
  });

  it('should handle chart task selection', () => {
    const { result } = renderHook(() => useGanttUIState());
    
    act(() => {
      result.current.selectChartTask('task-2');
    });
    
    expect(result.current.selectedChartTaskId).toBe('task-2');
  });

  it('should clear all selections', () => {
    const { result } = renderHook(() => useGanttUIState());
    
    act(() => {
      result.current.selectTitleTask('task-1');
      result.current.selectChartTask('task-2');
      result.current.clearAllSelections();
    });
    
    expect(result.current.selectedTitleTaskId).toBeNull();
    expect(result.current.selectedChartTaskId).toBeNull();
  });

  it('should handle context menu display', () => {
    const { result } = renderHook(() => useGanttUIState());
    
    act(() => {
      result.current.showContextMenu({
        clientX: 100,
        clientY: 200,
        preventDefault: () => {}
      } as React.MouseEvent);
    });
    
    expect(result.current.contextMenu.visible).toBe(true);
    expect(result.current.contextMenu.x).toBe(100);
    expect(result.current.contextMenu.y).toBe(200);
  });

  it('should handle task context menu display', () => {
    const { result } = renderHook(() => useGanttUIState());
    
    act(() => {
      result.current.showTaskContextMenu({
        clientX: 150,
        clientY: 250,
        preventDefault: () => {},
        stopPropagation: () => {}
      } as React.MouseEvent, 'task-1');
    });
    
    expect(result.current.taskContextMenu.visible).toBe(true);
    expect(result.current.taskContextMenu.x).toBe(150);
    expect(result.current.taskContextMenu.y).toBe(250);
    expect(result.current.taskContextMenu.taskId).toBe('task-1');
  });

  it('should handle color picker display', () => {
    const { result } = renderHook(() => useGanttUIState());
    
    act(() => {
      result.current.showColorPicker('task-1', { x: 200, y: 300 }, '#ff6b6b');
    });
    
    expect(result.current.colorPickerState.visible).toBe(true);
    expect(result.current.colorPickerState.taskId).toBe('task-1');
    expect(result.current.colorPickerState.x).toBe(200);
    expect(result.current.colorPickerState.y).toBe(300);
    expect(result.current.colorPickerState.currentColor).toBe('#ff6b6b');
  });

  it('should handle tag manager display', () => {
    const { result } = renderHook(() => useGanttUIState());
    
    act(() => {
      result.current.showTagManager('task-1', ['重要', '开发'], { x: 300, y: 400 });
    });
    
    expect(result.current.tagManagerState.visible).toBe(true);
    expect(result.current.tagManagerState.taskId).toBe('task-1');
    expect(result.current.tagManagerState.selectedTags).toEqual(['重要', '开发']);
    expect(result.current.tagManagerState.x).toBe(300);
    expect(result.current.tagManagerState.y).toBe(400);
  });

  it('should check if task is selected', () => {
    const { result } = renderHook(() => useGanttUIState());
    
    act(() => {
      result.current.selectTitleTask('task-1');
    });
    
    expect(result.current.isTaskSelected('task-1')).toBe(true);
    expect(result.current.isTaskSelected('task-2')).toBe(false);
  });

  it('should check for active popups', () => {
    const { result } = renderHook(() => useGanttUIState());
    
    expect(result.current.hasActivePopup()).toBe(false);
    
    act(() => {
      result.current.showContextMenu({
        clientX: 100,
        clientY: 200,
        preventDefault: () => {}
      } as React.MouseEvent);
    });
    
    expect(result.current.hasActivePopup()).toBe(true);
  });
});