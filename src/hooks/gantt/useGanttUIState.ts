import { useCallback } from 'react';
import { Task, TaskContextMenu, ColorPickerState, TagManagerState } from '../../types';
import { useSelectionState } from './ui/useSelectionState';
import { useMenuState } from './ui/useMenuState';
import { useModalState } from './ui/useModalState';
import { useUIKeyboard } from './ui/useUIKeyboard';

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
 * 重构后的统一甘特图UI状态管理Hook
 * 组合各个子状态Hook，提供统一接口
 */
export const useGanttUIState = (): UnifiedGanttUIState & UnifiedGanttUIActions => {
  // 组合各个子状态
  const selectionState = useSelectionState();
  const menuState = useMenuState();
  const modalState = useModalState();

  // UI键盘处理
  const uiKeyboard = useUIKeyboard({
    selectedTitleTaskId: selectionState.selectedTitleTaskId,
    selectedChartTaskId: selectionState.selectedChartTaskId,
    hideContextMenu: menuState.hideContextMenu,
    hideTaskContextMenu: menuState.hideTaskContextMenu,
    hideColorPicker: modalState.hideColorPicker,
    hideTagManager: modalState.hideTagManager,
    clearAllSelections: selectionState.clearAllSelections
  });

  // 增强的hasActivePopup方法
  const hasActivePopup = useCallback((): boolean => {
    return menuState.contextMenu.visible || 
           menuState.taskContextMenu.visible || 
           modalState.colorPickerState.visible || 
           modalState.tagManagerState.visible;
  }, [
    menuState.contextMenu.visible, 
    menuState.taskContextMenu.visible, 
    modalState.colorPickerState.visible, 
    modalState.tagManagerState.visible
  ]);

  // 组合所有状态和方法
  return {
    // === 状态 ===
    ...selectionState,
    ...menuState,
    ...modalState,
    
    // === 工具方法 ===
    ...uiKeyboard,
    hasActivePopup, // 覆盖默认实现
  };
};