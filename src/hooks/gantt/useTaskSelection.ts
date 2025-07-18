/**
 * 任务选择管理 Hook
 * 处理任务选中状态和选择逻辑
 */

import { useCallback, useState } from 'react';

interface UseTaskSelectionProps {
  // 可选的配置参数
  multiSelect?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export const useTaskSelection = ({
  multiSelect = false,
  onSelectionChange
}: UseTaskSelectionProps = {}) => {

  // 选中状态
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedTitleTaskId, setSelectedTitleTaskId] = useState<string | null>(null);

  // 选择任务
  const handleTaskSelect = useCallback((taskId: string) => {
    if (multiSelect) {
      setSelectedTaskIds(prev => {
        const newSelection = prev.includes(taskId)
          ? prev.filter(id => id !== taskId)
          : [...prev, taskId];
        onSelectionChange?.(newSelection);
        return newSelection;
      });
    } else {
      setSelectedTaskIds([taskId]);
      onSelectionChange?.([taskId]);
    }
  }, [multiSelect, onSelectionChange]);

  // 设置标题任务选中
  const handleTitleTaskSelect = useCallback((taskId: string) => {
    setSelectedTitleTaskId(taskId);
  }, []);

  // 清空选择
  const clearSelection = useCallback(() => {
    setSelectedTaskIds([]);
    setSelectedTitleTaskId(null);
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  // 全选
  const selectAll = useCallback((taskIds: string[]) => {
    if (multiSelect) {
      setSelectedTaskIds(taskIds);
      onSelectionChange?.(taskIds);
    }
  }, [multiSelect, onSelectionChange]);

  // 检查是否选中
  const isTaskSelected = useCallback((taskId: string) => {
    return selectedTaskIds.includes(taskId);
  }, [selectedTaskIds]);

  return {
    // 状态
    selectedTaskIds,
    selectedTitleTaskId,
    
    // 设置函数
    setSelectedTaskIds,
    setSelectedTitleTaskId,
    
    // 操作函数
    handleTaskSelect,
    handleTitleTaskSelect,
    clearSelection,
    selectAll,
    isTaskSelected
  };
};