import { useState, useCallback } from 'react';
import { Task, TaskContextMenu, ColorPickerState, TagManagerState } from '../../types';
import { useGlobalTags } from './useGlobalTags';

// 统一的甘特图UI状态接口
export interface UnifiedGanttUIState {
  // === 选择状态 ===
  selectedTitleTaskId: string | null;
  selectedChartTaskId: string | null;
  
  // === 上下文菜单状态 ===
  contextMenu: {
    visible: boolean;
    x: number;
    y: number;
    clickPosition: { x: number; y: number };
  };
  taskContextMenu: TaskContextMenu;
  
  // === 模态框状态（统一位置信息） ===
  colorPickerState: ColorPickerState & {
    x?: number;
    y?: number;
    currentColor?: string;
  };
  tagManagerState: TagManagerState & {
    x?: number;
    y?: number;
    task?: Task;
  };
  
  // === 标签和颜色状态 ===
  availableTags: string[];
  availableColors: string[];
}

// 统一的管理操作接口
export interface UnifiedGanttUIActions {
  // === 选择管理 ===
  selectTitleTask: (taskId: string | null) => void;
  selectChartTask: (taskId: string | null) => void;
  clearAllSelections: () => void;
  
  // === 菜单管理 ===
  showContextMenu: (e: React.MouseEvent) => void;
  hideContextMenu: () => void;
  showTaskContextMenu: (e: React.MouseEvent, taskId: string) => void;
  hideTaskContextMenu: () => void;
  
  // === 模态框管理 ===
  showColorPicker: (taskId: string, position?: {x: number, y: number}, currentColor?: string) => void;
  hideColorPicker: () => void;
  showTagManager: (taskId: string, currentTags?: string[], position?: {x: number, y: number}, task?: Task) => void;
  hideTagManager: () => void;
  
  // === 标签操作 ===
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  updateSelectedTags: (tags: string[]) => void;
  
  // === 工具方法 ===
  isTaskSelected: (taskId: string) => boolean;
  hasActivePopup: () => boolean;
  handleKeyDown: (e: KeyboardEvent) => string | null;
  
  // === 直接状态设置（向后兼容） ===
  setSelectedTitleTaskId: (id: string | null) => void;
  setSelectedChartTaskId: (id: string | null) => void;
  setContextMenu: (menu: UnifiedGanttUIState['contextMenu']) => void;
  setTaskContextMenu: (menu: TaskContextMenu) => void;
  setColorPickerState: (state: UnifiedGanttUIState['colorPickerState']) => void;
  setTagManagerState: (state: UnifiedGanttUIState['tagManagerState']) => void;
}

/**
 * 统一的甘特图UI状态管理Hook
 * 合并了 useGanttState 和 useGanttUI 的功能，消除重复和接口不一致
 */
export const useGanttUIState = (): UnifiedGanttUIState & UnifiedGanttUIActions => {
  // === 选择状态 ===
  const [selectedTitleTaskId, setSelectedTitleTaskId] = useState<string | null>(null);
  const [selectedChartTaskId, setSelectedChartTaskId] = useState<string | null>(null);
  
  // === 上下文菜单状态 ===
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    clickPosition: { x: number; y: number };
  }>({
    visible: false,
    x: 0,
    y: 0,
    clickPosition: { x: 0, y: 0 }
  });

  const [taskContextMenu, setTaskContextMenu] = useState<TaskContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    taskId: null
  });

  // === 模态框状态（统一接口） ===
  const [colorPickerState, setColorPickerState] = useState<UnifiedGanttUIState['colorPickerState']>({
    visible: false,
    taskId: null,
    x: 0,
    y: 0,
    currentColor: undefined
  });

  const [tagManagerState, setTagManagerState] = useState<UnifiedGanttUIState['tagManagerState']>({
    visible: false,
    taskId: null,
    newTag: '',
    selectedTags: [],
    x: 0,
    y: 0,
    task: undefined
  });

  // === 全局标签和颜色管理 ===
  const { availableTags, addTag: globalAddTag, removeTag: globalRemoveTag } = useGlobalTags();
  
  // 预定义颜色选项
  const availableColors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b',
    '#eb4d4b', '#6c5ce7', '#a55eea', '#26de81', '#fd79a8',
    '#fdcb6e', '#fd79a8', '#e17055', '#00b894', '#0984e3',
    '#6c5ce7', '#a55eea', '#fd79a8', '#fdcb6e', '#6c5ce7'
  ];

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

  // === 菜单管理 ===
  const showContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      clickPosition: { x: e.clientX, y: e.clientY }
    });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
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

  // === 模态框管理 ===
  const showColorPicker = useCallback((
    taskId: string, 
    position?: {x: number, y: number}, 
    currentColor?: string
  ) => {
    setColorPickerState({
      visible: true,
      taskId,
      x: position?.x || 0,
      y: position?.y || 0,
      currentColor
    });
  }, []);

  const hideColorPicker = useCallback(() => {
    setColorPickerState({
      visible: false,
      taskId: null,
      x: 0,
      y: 0,
      currentColor: undefined
    });
  }, []);

  const showTagManager = useCallback((
    taskId: string, 
    currentTags: string[] = [], 
    position?: {x: number, y: number}, 
    task?: Task
  ) => {
    setTagManagerState({
      visible: true,
      taskId,
      newTag: '',
      selectedTags: currentTags,
      x: position?.x || 0,
      y: position?.y || 0,
      task
    });
  }, []);

  const hideTagManager = useCallback(() => {
    setTagManagerState({
      visible: false,
      taskId: null,
      newTag: '',
      selectedTags: [],
      x: 0,
      y: 0,
      task: undefined
    });
  }, []);

  // === 标签操作 ===
  const addTag = useCallback((tag: string) => {
    globalAddTag(tag);
  }, [globalAddTag]);

  const removeTag = useCallback((tag: string) => {
    globalRemoveTag(tag);
  }, [globalRemoveTag]);

  const updateSelectedTags = useCallback((tags: string[]) => {
    setTagManagerState(prev => ({
      ...prev,
      selectedTags: tags
    }));
  }, []);

  // === 键盘处理 ===
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
    // === 状态 ===
    selectedTitleTaskId,
    selectedChartTaskId,
    contextMenu,
    taskContextMenu,
    colorPickerState,
    tagManagerState,
    availableTags,
    availableColors,
    
    // === 选择管理 ===
    selectTitleTask,
    selectChartTask,
    clearAllSelections,
    
    // === 菜单管理 ===
    showContextMenu,
    hideContextMenu,
    showTaskContextMenu,
    hideTaskContextMenu,
    
    // === 模态框管理 ===
    showColorPicker,
    hideColorPicker,
    showTagManager,
    hideTagManager,
    
    // === 标签操作 ===
    addTag,
    removeTag,
    updateSelectedTags,
    
    // === 工具方法 ===
    isTaskSelected,
    hasActivePopup,
    handleKeyDown,
    
    // === 直接状态设置（向后兼容） ===
    setSelectedTitleTaskId,
    setSelectedChartTaskId,
    setContextMenu,
    setTaskContextMenu,
    setColorPickerState,
    setTagManagerState
  };
};