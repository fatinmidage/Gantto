import { useState, useCallback } from 'react';
import { TaskContextMenu } from '../../../types';

/**
 * 菜单状态管理Hook
 * 负责上下文菜单和任务菜单的状态管理
 */
export const useMenuState = () => {
  // 通用上下文菜单状态
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

  // 任务上下文菜单状态
  const [taskContextMenu, setTaskContextMenu] = useState<TaskContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    taskId: null
  });

  // 通用菜单操作
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

  // 任务菜单操作
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

  return {
    // 状态
    contextMenu,
    taskContextMenu,
    
    // 操作方法
    showContextMenu,
    hideContextMenu,
    showTaskContextMenu,
    hideTaskContextMenu,
    
    // 直接设置（向后兼容）
    setContextMenu,
    setTaskContextMenu
  };
};