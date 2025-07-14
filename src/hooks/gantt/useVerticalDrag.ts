import { useCallback, useEffect } from 'react';
import { Task } from '../../types';

interface UseVerticalDragProps {
  // 垂直拖拽状态
  verticalDragState: {
    isDragging: boolean;
    draggedTaskIndex: number | null;
    startY: number;
    targetIndex: number | null;
  };
  
  // 任务数据
  leftPanelTasks: Task[];
  
  // 拖拽系统方法
  startVerticalDrag: (taskId: string, taskIndex: number, clientY: number) => void;
  updateVerticalDragPosition: (clientY: number, taskHeight: number, totalTasks: number) => void;
  resetVerticalDrag: () => void;
  
  // 数据更新方法
  updateProjectRowsOrder: (draggedIndex: number, targetIndex: number) => void;
}

export interface UseVerticalDragResult {
  handleTitleMouseDown: (e: React.MouseEvent, taskId: string) => void;
  handleTitleMouseMove: (e: MouseEvent) => void;
  handleTitleMouseUp: () => void;
}

export const useVerticalDrag = ({
  verticalDragState,
  leftPanelTasks,
  startVerticalDrag,
  updateVerticalDragPosition,
  resetVerticalDrag,
  updateProjectRowsOrder
}: UseVerticalDragProps): UseVerticalDragResult => {

  // 垂直拖拽处理
  const handleTitleMouseDown = useCallback((e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const taskIndex = leftPanelTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    
    // 使用 Hook 方法开始垂直拖拽
    startVerticalDrag(taskId, taskIndex, e.clientY);
  }, [leftPanelTasks, startVerticalDrag]);

  // 垂直拖拽移动处理
  const handleTitleMouseMove = useCallback((e: MouseEvent) => {
    if (!verticalDragState.isDragging) return;
    
    // 使用 Hook 方法更新垂直拖拽位置
    updateVerticalDragPosition(
      e.clientY,
      40,                       // 任务行高度 (taskHeight + margin)
      leftPanelTasks.length     // 总任务数
    );
  }, [verticalDragState.isDragging, updateVerticalDragPosition, leftPanelTasks.length]);

  // 垂直拖拽结束处理
  const handleTitleMouseUp = useCallback(() => {
    if (!verticalDragState.isDragging) return;
    
    if (verticalDragState.targetIndex !== null && 
        verticalDragState.draggedTaskIndex !== null &&
        verticalDragState.targetIndex !== verticalDragState.draggedTaskIndex) {
      
      // 重新排序项目行
      updateProjectRowsOrder(
        verticalDragState.draggedTaskIndex,
        verticalDragState.targetIndex
      );
    }
    
    // 重置垂直拖拽状态
    resetVerticalDrag();
  }, [
    verticalDragState.isDragging,
    verticalDragState.targetIndex,
    verticalDragState.draggedTaskIndex,
    updateProjectRowsOrder,
    resetVerticalDrag
  ]);

  // 添加垂直拖拽事件监听器
  useEffect(() => {
    if (verticalDragState.isDragging) {
      document.addEventListener('mousemove', handleTitleMouseMove);
      document.addEventListener('mouseup', handleTitleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleTitleMouseMove);
        document.removeEventListener('mouseup', handleTitleMouseUp);
      };
    }
  }, [verticalDragState.isDragging, handleTitleMouseMove, handleTitleMouseUp]);

  return {
    handleTitleMouseDown,
    handleTitleMouseMove,
    handleTitleMouseUp
  };
};