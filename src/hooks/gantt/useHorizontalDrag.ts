import { useCallback } from 'react';
import { Task } from '../../types';

interface UseHorizontalDragProps {
  // 拖拽状态
  isDragging: boolean;
  draggedTask: string | null;
  draggedTaskData: Task | null;
  dragType: 'move' | 'resize-left' | 'resize-right' | null;
  tempDragPosition: { x: number; width: number } | null;
  isHoveringEdge: 'left' | 'right' | null;
  
  // 任务数据
  sortedChartTasks: Task[];
  taskMapMemo: Map<string, Task>;
  containerRef: React.RefObject<HTMLDivElement>;
  
  // 拖拽系统方法
  startHorizontalDrag: (taskId: string, task: Task, clientX: number, clientY: number, dragType: string, container: HTMLDivElement) => void;
  updateHorizontalDragPosition: (clientX: number, chartWidth: number, minWidth: number) => void;
  resetHorizontalDrag: () => void;
  
  // 工具方法
  pixelToDate: (pixel: number) => Date;
  dateToPixel: (date: Date) => number;
  updateDragMetrics: (task: Task, pixelPerDay: number) => void;
  updateTaskDates: (taskId: string, startDate: Date, endDate: Date) => void;
  
  // 事件设置
  setIsHoveringEdge: (edge: 'left' | 'right' | null) => void;
  useThrottledMouseMove: (callback: (e: MouseEvent) => void, deps: any[]) => (e: MouseEvent) => void;
}

export interface UseHorizontalDragResult {
  detectEdgeHover: (e: React.MouseEvent, task: any) => 'left' | 'right' | null;
  handleEdgeHover: (e: React.MouseEvent, task: any) => void;
  handleMouseDown: (e: React.MouseEvent, taskId: string) => void;
  handleMouseMove: (e: MouseEvent) => void;
  handleMouseUp: () => void;
}

export const useHorizontalDrag = ({
  isDragging,
  draggedTask,
  draggedTaskData,
  dragType,
  tempDragPosition,
  isHoveringEdge,
  sortedChartTasks,
  taskMapMemo,
  containerRef,
  startHorizontalDrag,
  updateHorizontalDragPosition,
  resetHorizontalDrag,
  pixelToDate,
  dateToPixel,
  updateDragMetrics,
  updateTaskDates,
  setIsHoveringEdge,
  useThrottledMouseMove
}: UseHorizontalDragProps): UseHorizontalDragResult => {

  // 检测是否在任务条边界附近
  const detectEdgeHover = useCallback((e: React.MouseEvent, _task: any): 'left' | 'right' | null => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const edgeZone = 8; // 8px边界检测区域
    
    if (mouseX <= edgeZone) {
      return 'left';
    } else if (mouseX >= rect.width - edgeZone) {
      return 'right';
    }
    return null;
  }, []);

  // 简化的边界检测处理器
  const handleEdgeHover = useCallback((e: React.MouseEvent, task: any) => {
    if (!isDragging) {
      const edgeType = detectEdgeHover(e, task);
      if (isHoveringEdge !== edgeType) {
        setIsHoveringEdge(edgeType);
      }
    }
  }, [isDragging, isHoveringEdge, detectEdgeHover, setIsHoveringEdge]);

  // 水平拖拽处理
  const handleMouseDown = useCallback((e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    
    // 优先查找chartTask
    let task: any = sortedChartTasks.find(t => t.id === taskId);
    
    // 如果不是chartTask，查找兼容性task
    if (!task) {
      task = taskMapMemo.get(taskId);
    }
    
    if (!task || !containerRef.current) return;
    
    // 检测拖拽类型
    // 里程碑始终是移动操作，不支持resize（检查type或时间相等）
    const isMilestone = task.type === 'milestone' || task.startDate.getTime() === task.endDate.getTime();
    const currentDragType = isMilestone ? 'move' : (() => {
      const edgeType = detectEdgeHover(e, task);
      return edgeType ? `resize-${edgeType}` as 'resize-left' | 'resize-right' : 'move';
    })();
    
    // 更新拖拽度量缓存
    updateDragMetrics(task, dateToPixel(new Date(Date.now() + 24 * 60 * 60 * 1000)) - dateToPixel(new Date()));
    
    // 使用 Hook 方法开始水平拖拽
    startHorizontalDrag(
      taskId,
      task,
      e.clientX,
      e.clientY,
      currentDragType,
      containerRef.current
    );
  }, [
    sortedChartTasks,
    taskMapMemo,
    containerRef,
    detectEdgeHover,
    updateDragMetrics,
    dateToPixel,
    startHorizontalDrag
  ]);

  // 水平拖拽移动处理
  const handleMouseMoveCore = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    // 使用 Hook 方法更新水平拖拽位置
    updateHorizontalDragPosition(
      e.clientX,
      800,  // 图表宽度 - 可以作为参数传入
      20    // 最小宽度
    );
  }, [isDragging, updateHorizontalDragPosition]);

  // 节流的鼠标移动处理
  const handleMouseMove = useThrottledMouseMove(handleMouseMoveCore, [isDragging]);

  // 水平拖拽结束处理
  const handleMouseUp = useCallback(() => {
    if (tempDragPosition && draggedTask && draggedTaskData && dragType) {
      let newStartDate: Date;
      let newEndDate: Date;
      
      if (dragType === 'move') {
        // 移动任务条：保持时间段长度，改变开始和结束时间
        newStartDate = pixelToDate(tempDragPosition.x);
        
        // 调试日志：拖拽前任务信息
        console.log(`[HorizontalDrag Debug] 拖拽结束处理 - Task ${draggedTask}:`, {
          originalType: draggedTaskData.type,
          originalStartDate: draggedTaskData.startDate,
          originalEndDate: draggedTaskData.endDate,
          newStartDate: newStartDate,
          dragType: dragType
        });
        
        // 检查是否为里程碑：type为milestone 或者 开始时间等于结束时间
        const isMilestone = draggedTaskData.type === 'milestone' || 
                           draggedTaskData.startDate.getTime() === draggedTaskData.endDate.getTime();
                           
        if (isMilestone) {
          // 里程碑只更新开始时间，结束时间保持与开始时间相同
          newEndDate = newStartDate;
          console.log(`[HorizontalDrag Debug] 里程碑拖拽处理：newEndDate设置为 ${newEndDate}，判断依据：type=${draggedTaskData.type}, timesEqual=${draggedTaskData.startDate.getTime() === draggedTaskData.endDate.getTime()}`);
        } else {
          // 普通任务保持时间段长度
          const duration = draggedTaskData.endDate.getTime() - draggedTaskData.startDate.getTime();
          newEndDate = new Date(newStartDate.getTime() + duration);
          console.log(`[HorizontalDrag Debug] 普通任务拖拽处理：duration=${duration}, newEndDate=${newEndDate}`);
        }
      } else if (dragType === 'resize-left') {
        // 左边界拖拽：改变开始时间，保持结束时间
        newStartDate = pixelToDate(tempDragPosition.x);
        newEndDate = draggedTaskData.endDate;
      } else if (dragType === 'resize-right') {
        // 右边界拖拽：保持开始时间，改变结束时间
        newStartDate = draggedTaskData.startDate;
        newEndDate = pixelToDate(tempDragPosition.x + tempDragPosition.width);
      } else {
        resetHorizontalDrag();
        return;
      }
      
      // 更新任务时间
      updateTaskDates(draggedTask, newStartDate, newEndDate);
    }
    
    // 重置拖拽状态
    resetHorizontalDrag();
  }, [
    tempDragPosition,
    draggedTask,
    draggedTaskData,
    dragType,
    pixelToDate,
    resetHorizontalDrag,
    updateTaskDates
  ]);

  return {
    detectEdgeHover,
    handleEdgeHover,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
};