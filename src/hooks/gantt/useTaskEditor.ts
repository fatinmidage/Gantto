/**
 * 任务编辑管理 Hook
 * 处理任务的颜色修改、标签管理、删除等编辑操作
 */

import { useCallback } from 'react';
import { Task } from '../../types';

interface UseTaskEditorProps {
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setChartTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  deleteTaskCore: (taskId: string) => void;
  onTaskContextMenuClose?: () => void;
}

export const useTaskEditor = ({
  setTasks,
  setChartTasks,
  deleteTaskCore,
  onTaskContextMenuClose
}: UseTaskEditorProps) => {

  // 颜色修改
  const handleColorChange = useCallback((taskId: string, color: string) => {
    setChartTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, color } : task
    ));
  }, [setChartTasks]);

  // 标签添加
  const handleTagAdd = useCallback((taskId: string, tag: string) => {
    if (!tag.trim()) return;
    
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const currentTags = task.tags || [];
        if (!currentTags.includes(tag.trim())) {
          return { ...task, tags: [...currentTags, tag.trim()] };
        }
      }
      return task;
    }));
  }, [setTasks]);

  // 标签移除
  const handleTagRemove = useCallback((taskId: string, tag: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId && task.tags) {
        return { ...task, tags: task.tags.filter(t => t !== tag) };
      }
      return task;
    }));
  }, [setTasks]);

  // 任务删除
  const handleTaskDelete = useCallback((taskId: string) => {
    deleteTaskCore(taskId);
    onTaskContextMenuClose?.();
  }, [deleteTaskCore, onTaskContextMenuClose]);

  // 任务复制
  const handleTaskCopy = useCallback((_taskId: string) => {
    // 复制任务逻辑
  }, []);

  // 任务移动
  const handleTaskMove = useCallback((_taskId: string, _newParentId?: string) => {
    // 移动任务逻辑
  }, []);

  return {
    handleColorChange,
    handleTagAdd,
    handleTagRemove,
    handleTaskDelete,
    handleTaskCopy,
    handleTaskMove
  };
};