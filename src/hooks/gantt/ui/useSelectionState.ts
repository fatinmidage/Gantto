import { useState, useCallback } from 'react';

/**
 * 选择状态管理Hook
 * 负责任务选择状态的管理
 */
export const useSelectionState = () => {
  const [selectedTitleTaskId, setSelectedTitleTaskId] = useState<string | null>(null);
  const [selectedChartTaskId, setSelectedChartTaskId] = useState<string | null>(null);

  const selectTitleTask = useCallback((taskId: string | null) => {
    setSelectedTitleTaskId(taskId);
  }, []);

  const selectChartTask = useCallback((taskId: string | null) => {
    setSelectedChartTaskId(taskId);
  }, []);

  const clearAllSelections = useCallback(() => {
    setSelectedTitleTaskId(null);
    setSelectedChartTaskId(null);
  }, []);

  const isTaskSelected = useCallback((taskId: string): boolean => {
    return selectedTitleTaskId === taskId || selectedChartTaskId === taskId;
  }, [selectedTitleTaskId, selectedChartTaskId]);

  return {
    // 状态
    selectedTitleTaskId,
    selectedChartTaskId,
    
    // 操作方法
    selectTitleTask,
    selectChartTask,
    clearAllSelections,
    isTaskSelected,
    
    // 直接设置（向后兼容）
    setSelectedTitleTaskId,
    setSelectedChartTaskId
  };
};