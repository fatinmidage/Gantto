import { useCallback } from 'react';
import { Task, ProjectRow } from '../../types';
import { useContextMenus } from './useContextMenus';
import { useTaskHierarchy } from './useTaskHierarchy';
import { useTaskEditor } from './useTaskEditor';
import { useTaskSelection } from './useTaskSelection';

// 这些接口已经移到各自的 hook 中，保留此处仅为兼容性

interface UseGanttInteractionsProps {
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setChartTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setProjectRows: React.Dispatch<React.SetStateAction<ProjectRow[]>>;
  deleteTaskCore: (taskId: string) => void;
  projectRows: ProjectRow[];
  containerRef: React.RefObject<HTMLDivElement>;
  pixelToDate: (pixel: number) => Date;
  taskHeight: number;
  timelineHeight: number;
}

export const useGanttInteractions = ({
  setTasks,
  setChartTasks,
  setProjectRows,
  deleteTaskCore,
  projectRows,
  containerRef,
  pixelToDate: _pixelToDate,
  taskHeight: _taskHeight,
  timelineHeight
}: UseGanttInteractionsProps) => {
  
  // 使用各个专门的 hooks
  const contextMenus = useContextMenus({
    containerRef,
    timelineHeight
  });

  const taskHierarchy = useTaskHierarchy({
    projectRows,
    setProjectRows,
    setChartTasks
  });

  const taskEditor = useTaskEditor({
    setTasks,
    setChartTasks,
    deleteTaskCore,
    onTaskContextMenuClose: () => {
      contextMenus.setTaskContextMenu(prev => ({ ...prev, visible: false }));
    }
  });

  const taskSelection = useTaskSelection({
    multiSelect: false
  });

  // 包装颜色修改以关闭选择器
  const handleColorChange = useCallback((taskId: string, color: string) => {
    taskEditor.handleColorChange(taskId, color);
    contextMenus.setColorPickerState({ visible: false, taskId: null });
  }, [taskEditor, contextMenus]);

  return {
    // 状态
    contextMenu: contextMenus.contextMenu,
    taskContextMenu: contextMenus.taskContextMenu,
    colorPickerState: contextMenus.colorPickerState,
    tagManagerState: contextMenus.tagManagerState,
    selectedTitleTaskId: taskSelection.selectedTitleTaskId,
    
    // 状态设置函数
    setContextMenu: contextMenus.setContextMenu,
    setTaskContextMenu: contextMenus.setTaskContextMenu,
    setColorPickerState: contextMenus.setColorPickerState,
    setTagManagerState: contextMenus.setTagManagerState,
    setSelectedTitleTaskId: taskSelection.setSelectedTitleTaskId,
    
    // 事件处理函数
    handleToggleExpand: taskHierarchy.handleToggleExpand,
    handleCreateSubtask: taskHierarchy.handleCreateSubtask,
    handleContextMenu: contextMenus.handleContextMenu,
    handleTaskContextMenu: contextMenus.handleTaskContextMenu,
    handleColorChange,
    handleTagAdd: taskEditor.handleTagAdd,
    handleTagRemove: taskEditor.handleTagRemove,
    handleTaskDelete: taskEditor.handleTaskDelete
  };
};