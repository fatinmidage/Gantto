/**
 * 上下文菜单管理 Hook
 * 处理所有菜单状态和交互逻辑
 */

import { useCallback, useState } from 'react';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  clickPosition?: {
    x: number;
    y: number;
  };
}

interface TaskContextMenuState extends ContextMenuState {
  taskId: string | null;
}

interface ColorPickerState {
  visible: boolean;
  taskId: string | null;
}

interface TagManagerState {
  visible: boolean;
  taskId: string | null;
  newTag: string;
}

interface UseContextMenusProps {
  containerRef: React.RefObject<HTMLDivElement>;
  timelineHeight: number;
}

export const useContextMenus = ({
  containerRef,
  timelineHeight
}: UseContextMenusProps) => {
  
  // 菜单状态
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    clickPosition: { x: 0, y: 0 }
  });

  const [taskContextMenu, setTaskContextMenu] = useState<TaskContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    taskId: null
  });

  const [colorPickerState, setColorPickerState] = useState<ColorPickerState>({
    visible: false,
    taskId: null
  });

  const [tagManagerState, setTagManagerState] = useState<TagManagerState>({
    visible: false,
    taskId: null,
    newTag: ''
  });

  // 隐藏所有菜单
  const hideAllMenus = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
    setTaskContextMenu(prev => ({ ...prev, visible: false }));
    setColorPickerState(prev => ({ ...prev, visible: false }));
    setTagManagerState(prev => ({ ...prev, visible: false }));
  }, []);

  // 右键菜单处理
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const rawChartAreaX = e.clientX - rect.left;
    const chartAreaY = e.clientY - rect.top;
    
    // 获取容器的滚动偏移量
    const scrollLeft = containerRef.current?.scrollLeft || 0;
    
    // 修正X坐标，加上滚动偏移量
    const chartAreaX = rawChartAreaX + scrollLeft;
    
    // 检查是否在时间轴区域内
    const isInTimelineArea = chartAreaY < timelineHeight;
    
    // 任务区域的Y坐标
    const taskAreaY = Math.max(0, chartAreaY - timelineHeight);
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      clickPosition: { 
        x: chartAreaX, 
        y: isInTimelineArea ? 0 : taskAreaY
      }
    });
    
    // 隐藏其他菜单
    setTaskContextMenu(prev => ({ ...prev, visible: false }));
    setColorPickerState(prev => ({ ...prev, visible: false }));
    setTagManagerState(prev => ({ ...prev, visible: false }));
  }, [containerRef, timelineHeight]);

  // 任务右键菜单
  const handleTaskContextMenu = useCallback((e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setTaskContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      taskId
    });
    
    // 隐藏其他菜单
    setContextMenu(prev => ({ ...prev, visible: false }));
    setColorPickerState(prev => ({ ...prev, visible: false }));
    setTagManagerState(prev => ({ ...prev, visible: false }));
  }, []);

  // 显示颜色选择器
  const showColorPicker = useCallback((taskId: string) => {
    setColorPickerState({
      visible: true,
      taskId
    });
    hideAllMenus();
  }, [hideAllMenus]);

  // 显示标签管理器
  const showTagManager = useCallback((taskId: string) => {
    setTagManagerState({
      visible: true,
      taskId,
      newTag: ''
    });
    hideAllMenus();
  }, [hideAllMenus]);

  return {
    // 状态
    contextMenu,
    taskContextMenu,
    colorPickerState,
    tagManagerState,
    
    // 状态设置函数
    setContextMenu,
    setTaskContextMenu,
    setColorPickerState,
    setTagManagerState,
    
    // 事件处理函数
    handleContextMenu,
    handleTaskContextMenu,
    showColorPicker,
    showTagManager,
    hideAllMenus
  };
};