import { useCallback } from 'react';

/**
 * UI键盘处理Hook
 * 负责UI相关的键盘事件处理
 */
export const useUIKeyboard = ({
  selectedTitleTaskId,
  selectedChartTaskId,
  hideContextMenu,
  hideTaskContextMenu,
  hideColorPicker,
  hideTagManager,
  clearAllSelections
}: {
  selectedTitleTaskId: string | null;
  selectedChartTaskId: string | null;
  hideContextMenu: () => void;
  hideTaskContextMenu: () => void;
  hideColorPicker: () => void;
  hideTagManager: () => void;
  clearAllSelections: () => void;
}) => {
  const handleKeyDown = useCallback((e: KeyboardEvent): string | null => {
    // Escape键关闭所有弹窗
    if (e.key === 'Escape') {
      hideContextMenu();
      hideTaskContextMenu();
      hideColorPicker();
      hideTagManager();
      clearAllSelections();
    }
    
    // Delete键删除选中的任务
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedTitleTaskId || selectedChartTaskId) {
        return selectedTitleTaskId || selectedChartTaskId;
      }
    }
    
    // Ctrl+A全选
    if (e.ctrlKey && e.key === 'a') {
      e.preventDefault();
      // 这里可以实现全选逻辑
    }
    
    return null;
  }, [
    selectedTitleTaskId,
    selectedChartTaskId,
    hideContextMenu,
    hideTaskContextMenu,
    hideColorPicker,
    hideTagManager,
    clearAllSelections
  ]);

  const hasActivePopup = useCallback((): boolean => {
    // 这里需要从调用方传入popup状态，或者重新设计架构
    // 暂时返回false，实际使用时需要传入相关状态
    return false;
  }, []);

  return {
    handleKeyDown,
    hasActivePopup
  };
};