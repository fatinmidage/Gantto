import { useState, useCallback } from 'react';
import { TaskContextMenu, ColorPickerState, TagManagerState } from '../../types';

// UI交互状态管理Hook
export const useGanttUI = () => {
  // === 选择状态 ===
  const [selectedTitleTaskId, setSelectedTitleTaskId] = useState<string | null>(null);
  const [selectedChartTaskId, setSelectedChartTaskId] = useState<string | null>(null);
  
  // === 右键菜单状态 ===
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({
    visible: false,
    x: 0,
    y: 0
  });

  const [taskContextMenu, setTaskContextMenu] = useState<TaskContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    taskId: null
  });

  // === 颜色选择器状态 ===
  const [colorPickerState, setColorPickerState] = useState<ColorPickerState>({
    visible: false,
    taskId: null
  });

  // === 标签管理状态 ===
  const [tagManagerState, setTagManagerState] = useState<TagManagerState>({
    visible: false,
    taskId: null,
    newTag: '',
    selectedTags: []
  });

  // === 可用标签列表 ===
  const [availableTags, setAvailableTags] = useState<string[]>([
    '重要', '紧急', '开发', '测试', '设计', '文档'
  ]);

  // === 选择管理 ===
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

  // === 右键菜单管理 ===
  const showContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY
    });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0
    });
  }, []);

  const showTaskContextMenu = useCallback((e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setTaskContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      taskId
    });
  }, []);

  const hideTaskContextMenu = useCallback(() => {
    setTaskContextMenu({
      visible: false,
      x: 0,
      y: 0,
      taskId: null
    });
  }, []);

  // === 颜色选择器管理 ===
  const showColorPicker = useCallback((taskId: string) => {
    setColorPickerState({
      visible: true,
      taskId
    });
  }, []);

  const hideColorPicker = useCallback(() => {
    setColorPickerState({
      visible: false,
      taskId: null
    });
  }, []);

  // === 标签管理器管理 ===
  const showTagManager = useCallback((taskId: string, currentTags: string[] = []) => {
    setTagManagerState({
      visible: true,
      taskId,
      newTag: '',
      selectedTags: currentTags
    });
  }, []);

  const hideTagManager = useCallback(() => {
    setTagManagerState({
      visible: false,
      taskId: null,
      newTag: '',
      selectedTags: []
    });
  }, []);

  // === 标签操作 ===
  const addTag = useCallback((tag: string) => {
    if (!availableTags.includes(tag)) {
      setAvailableTags(prev => [...prev, tag]);
    }
  }, [availableTags]);

  const removeTag = useCallback((tag: string) => {
    setAvailableTags(prev => prev.filter(t => t !== tag));
  }, []);

  const updateSelectedTags = useCallback((tags: string[]) => {
    setTagManagerState(prev => ({
      ...prev,
      selectedTags: tags
    }));
  }, []);

  // === 键盘快捷键处理 ===
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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

  // === 工具方法 ===
  const isTaskSelected = useCallback((taskId: string): boolean => {
    return selectedTitleTaskId === taskId || selectedChartTaskId === taskId;
  }, [selectedTitleTaskId, selectedChartTaskId]);

  const hasActivePopup = useCallback((): boolean => {
    return contextMenu.visible || 
           taskContextMenu.visible || 
           colorPickerState.visible || 
           tagManagerState.visible;
  }, [contextMenu.visible, taskContextMenu.visible, colorPickerState.visible, tagManagerState.visible]);

  return {
    // === 选择状态 ===
    selectedTitleTaskId,
    selectedChartTaskId,
    
    // === 弹窗状态 ===
    contextMenu,
    taskContextMenu,
    colorPickerState,
    tagManagerState,
    
    // === 标签状态 ===
    availableTags,
    
    // === 选择管理 ===
    selectTitleTask,
    selectChartTask,
    clearAllSelections,
    
    // === 右键菜单管理 ===
    showContextMenu,
    hideContextMenu,
    showTaskContextMenu,
    hideTaskContextMenu,
    
    // === 颜色选择器管理 ===
    showColorPicker,
    hideColorPicker,
    
    // === 标签管理器管理 ===
    showTagManager,
    hideTagManager,
    updateSelectedTags,
    
    // === 标签操作 ===
    addTag,
    removeTag,
    
    // === 键盘处理 ===
    handleKeyDown,
    
    // === 工具方法 ===
    isTaskSelected,
    hasActivePopup,
    
    // === 状态设置器（用于外部直接控制） ===
    setSelectedTitleTaskId,
    setSelectedChartTaskId,
    setContextMenu,
    setTaskContextMenu,
    setColorPickerState,
    setTagManagerState,
    setAvailableTags
  };
};