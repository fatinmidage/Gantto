import { useState, useMemo } from 'react';
import { Task } from '../../types';

// 状态接口定义
export interface GanttStateType {
  // 上下文菜单状态
  colorPickerState: {
    visible: boolean;
    x: number;
    y: number;
    taskId?: string;
    currentColor?: string;
  };
  setColorPickerState: (state: {
    visible: boolean;
    x: number;
    y: number;
    taskId?: string;
    currentColor?: string;
  }) => void;

  tagManagerState: {
    visible: boolean;
    x: number;
    y: number;
    taskId?: string;
    task?: Task;
    newTag?: string;
  };
  setTagManagerState: (state: {
    visible: boolean;
    x: number;
    y: number;
    taskId?: string;
    task?: Task;
    newTag?: string;
  }) => void;

  // 可用标签状态
  availableTags: string[];
  setAvailableTags: (tags: string[]) => void;

  // 预定义颜色选项
  availableColors: string[];
}

/**
 * 甘特图状态管理 Hook
 * 集中管理甘特图组件的所有状态逻辑
 */
export const useGanttState = (): GanttStateType => {
  // === 上下文菜单状态管理 ===
  const [colorPickerState, setColorPickerState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    taskId?: string;
    currentColor?: string;
  }>({ visible: false, x: 0, y: 0 });

  const [tagManagerState, setTagManagerState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    taskId?: string;
    task?: Task;
    newTag?: string;
  }>({ visible: false, x: 0, y: 0 });

  // 可用标签选项
  const [availableTags, setAvailableTags] = useState<string[]>([
    '重要', '紧急', '测试', '开发', '设计', '评审', '部署'
  ]);

  // 预定义颜色选项
  const availableColors = useMemo(() => [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b',
    '#eb4d4b', '#6c5ce7', '#a55eea', '#26de81', '#fd79a8',
    '#fdcb6e', '#fd79a8', '#e17055', '#00b894', '#0984e3',
    '#6c5ce7', '#a55eea', '#fd79a8', '#fdcb6e', '#6c5ce7'
  ], []);

  return {
    // 上下文菜单状态
    colorPickerState,
    setColorPickerState,
    tagManagerState,
    setTagManagerState,
    
    // 标签状态
    availableTags,
    setAvailableTags,
    
    // 颜色选项
    availableColors
  };
};