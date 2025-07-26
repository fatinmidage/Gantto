import React, { useState, useCallback } from 'react';
import GanttContextMenu from './GanttContextMenu';
import TaskContextMenu from './TaskContextMenu';
import ColorPicker from './ColorPicker';
import TagManager from './TagManager';
import { Task, MilestoneNode } from '../../types';
import { COLOR_CONSTANTS } from './ganttStyles';

interface GanttMenuManagerProps {
  // 任务数据
  tasks: Task[];
  
  // 上下文菜单状态
  contextMenuState: {
    visible: boolean;
    x: number;
    y: number;
    clickPosition?: { x: number; y: number };
  };
  
  taskContextMenuState: {
    visible: boolean;
    x: number;
    y: number;
    taskId: string | null;
  };
  
  // 默认行ID
  defaultRowId: string;
  
  // 可用标签
  availableTags: string[];
  
  // 可见行数据
  visibleRows?: Array<{ id: string; [key: string]: any }>;
  taskHeight?: number;
  
  // 事件处理
  onContextMenuClose: () => void;
  onTaskContextMenuClose: () => void;
  onCreateTask: (task: Task) => void;
  onCreateMilestone: (milestone: MilestoneNode) => void;
  onColorChange: (taskId: string, color: string) => void;
  onTagAdd: (taskId: string, tag: string) => void;
  onTagRemove: (taskId: string, tag: string) => void;
  onTaskDelete: (taskId: string) => void;
  onLabelEdit?: (taskId: string, label: string) => void; // 里程碑标签编辑
  
  // 工具函数
  pixelToDate: (pixel: number) => Date;
}

const GanttMenuManager: React.FC<GanttMenuManagerProps> = ({
  tasks,
  contextMenuState,
  taskContextMenuState,
  defaultRowId,
  availableTags,
  visibleRows,
  taskHeight,
  onContextMenuClose,
  onTaskContextMenuClose,
  onCreateTask,
  onCreateMilestone,
  onColorChange,
  onTagAdd,
  onTagRemove,
  onTaskDelete,
  onLabelEdit,
  pixelToDate
}) => {
  // 颜色选择器状态
  const [colorPickerState, setColorPickerState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    taskId?: string;
    currentColor?: string;
  }>({ visible: false, x: 0, y: 0 });

  // 标签管理器状态
  const [tagManagerState, setTagManagerState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    taskId?: string;
    task?: Task;
  }>({ visible: false, x: 0, y: 0 });

  // 预定义颜色选项
  const availableColors = [...COLOR_CONSTANTS.AVAILABLE_COLORS];

  // 显示颜色选择器
  const handleShowColorPicker = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setColorPickerState({
      visible: true,
      x: taskContextMenuState.x,
      y: taskContextMenuState.y,
      taskId,
      currentColor: task?.color
    });
  }, [tasks, taskContextMenuState]);

  // 直接添加标签
  const handleShowTagManager = useCallback((taskId: string) => {
    // 直接为任务添加默认标签"新建标签"
    onTagAdd(taskId, '新建标签');
  }, [onTagAdd]);

  // 颜色选择处理
  const handleColorSelect = useCallback((taskId: string, color: string) => {
    onColorChange(taskId, color);
    setColorPickerState({ visible: false, x: 0, y: 0 });
  }, [onColorChange]);

  // 关闭颜色选择器
  const handleColorPickerClose = useCallback(() => {
    setColorPickerState({ visible: false, x: 0, y: 0 });
  }, []);

  // 关闭标签管理器
  const handleTagManagerClose = useCallback(() => {
    setTagManagerState({ visible: false, x: 0, y: 0 });
  }, []);

  return (
    <>
      {/* 甘特图右键菜单 */}
      <GanttContextMenu
        visible={contextMenuState.visible}
        x={contextMenuState.x}
        y={contextMenuState.y}
        onClose={onContextMenuClose}
        onCreateTask={onCreateTask}
        onCreateMilestone={onCreateMilestone}
        defaultRowId={defaultRowId}
        clickPosition={contextMenuState.clickPosition}
        pixelToDate={pixelToDate}
        visibleRows={visibleRows}
        taskHeight={taskHeight}
      />

      {/* 任务条右键菜单 */}
      <TaskContextMenu
        visible={taskContextMenuState.visible}
        x={taskContextMenuState.x}
        y={taskContextMenuState.y}
        taskId={taskContextMenuState.taskId || undefined}
        task={taskContextMenuState.taskId ? tasks.find(t => t.id === taskContextMenuState.taskId) : undefined}
        onClose={onTaskContextMenuClose}
        onColorChange={handleShowColorPicker}
        onTagManage={handleShowTagManager}
        onDelete={onTaskDelete}
        onLabelEdit={onLabelEdit}
      />

      {/* 颜色选择器 */}
      <ColorPicker
        visible={colorPickerState.visible}
        x={colorPickerState.x}
        y={colorPickerState.y}
        taskId={colorPickerState.taskId}
        currentColor={colorPickerState.currentColor}
        availableColors={availableColors}
        onColorSelect={handleColorSelect}
        onClose={handleColorPickerClose}
      />

      {/* 标签管理器 */}
      <TagManager
        visible={tagManagerState.visible}
        x={tagManagerState.x}
        y={tagManagerState.y}
        taskId={tagManagerState.taskId}
        task={tagManagerState.task}
        availableTags={availableTags}
        onTagAdd={onTagAdd}
        onTagRemove={onTagRemove}
        onClose={handleTagManagerClose}
      />
    </>
  );
};

export default GanttMenuManager;