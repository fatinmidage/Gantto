import { useState, useCallback } from 'react';
import { Task, ColorPickerState, TagManagerState } from '../../../types';
import { useGlobalTags } from '../useGlobalTags';

// 扩展的模态框状态类型
type ExtendedColorPickerState = ColorPickerState & {
  x?: number;
  y?: number;
  currentColor?: string;
};

type ExtendedTagManagerState = TagManagerState & {
  x?: number;
  y?: number;
  task?: Task;
};

/**
 * 模态框状态管理Hook
 * 负责颜色选择器和标签管理器的状态
 */
export const useModalState = () => {
  // 颜色选择器状态
  const [colorPickerState, setColorPickerState] = useState<ExtendedColorPickerState>({
    visible: false,
    taskId: null,
    x: 0,
    y: 0,
    currentColor: undefined
  });

  // 标签管理器状态
  const [tagManagerState, setTagManagerState] = useState<ExtendedTagManagerState>({
    visible: false,
    taskId: null,
    newTag: '',
    selectedTags: [],
    x: 0,
    y: 0,
    task: undefined
  });

  // 全局标签管理
  const { availableTags, addTag: globalAddTag, removeTag: globalRemoveTag } = useGlobalTags();

  // 预定义颜色选项
  const availableColors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b',
    '#eb4d4b', '#6c5ce7', '#a55eea', '#26de81', '#fd79a8',
    '#fdcb6e', '#fd79a8', '#e17055', '#00b894', '#0984e3',
    '#6c5ce7', '#a55eea', '#fd79a8', '#fdcb6e', '#6c5ce7'
  ];

  // 颜色选择器操作
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

  // 标签管理器操作
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

  // 标签操作
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

  return {
    // 状态
    colorPickerState,
    tagManagerState,
    availableTags,
    availableColors,
    
    // 颜色选择器操作
    showColorPicker,
    hideColorPicker,
    
    // 标签管理器操作
    showTagManager,
    hideTagManager,
    
    // 标签操作
    addTag,
    removeTag,
    updateSelectedTags,
    
    // 直接设置（向后兼容）
    setColorPickerState,
    setTagManagerState
  };
};