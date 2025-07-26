import React, { useCallback, useEffect } from 'react';
import { getAllDescendantRows, getVisibleProjectRows } from './GanttHelpers';
import { LAYOUT_CONSTANTS } from './ganttStyles';
import { useThrottledMouseMove } from '../../hooks';
import { Task, MilestoneNode } from '../../types';

interface GanttEventCoordinatorProps {
  // 状态数据
  sortedChartTasks: any[];
  leftPanelTasks: any[];
  milestones?: MilestoneNode[];
  
  // 拖拽状态
  isDragging: boolean;
  verticalDragState: any;
  tempDragPosition: any;
  draggedTask: string | null;
  draggedTaskData: any;
  dragType: any;
  isHoveringEdge: 'left' | 'right' | null;
  setIsHoveringEdge: (edge: 'left' | 'right' | null) => void;
  
  // 拖拽方法
  startHorizontalDrag: (taskId: string, task: any, clientX: number, clientY: number, dragType: any, container: HTMLElement) => void;
  startVerticalDrag: (taskId: string, taskIndex: number, clientY: number) => void;
  updateHorizontalDragPosition: (clientX: number, chartWidth: number, minWidth: number) => void;
  updateVerticalDragPosition: (clientY: number, rowHeight: number, totalRows: number) => void;
  updateDragMetrics: (task: any, pixelPerDay: number) => void;
  resetHorizontalDrag: () => void;
  resetVerticalDrag: () => void;
  
  // 其他方法
  pixelToDate: (pixel: number) => Date;
  dateToPixel: (date: Date) => number;
  dateRange: any;
  setProjectRows: React.Dispatch<React.SetStateAction<any[]>>;
  ganttEvents: any;
  handleTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  
  // 容器引用 - 从状态管理器传入
  containerRef: React.RefObject<HTMLDivElement>;
  
  // 子组件
  children: (handlers: EventHandlers) => React.ReactElement;
}

interface EventHandlers {
  handleCreateTask: (task: Task) => void;
  handleCreateMilestone: (milestone: MilestoneNode) => void;
  handleEdgeHover: (e: React.MouseEvent, task: any) => void;
  handleMouseDown: (e: React.MouseEvent, taskId: string) => void;
  handleTitleMouseDown: (e: React.MouseEvent, taskId: string) => void;
  handleMouseMove: (e: MouseEvent) => void;
  handleMouseUp: () => void;
  handleTitleMouseMove: (e: MouseEvent) => void;
  handleTitleMouseUp: () => void;
  handleTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const GanttEventCoordinator: React.FC<GanttEventCoordinatorProps> = ({
  sortedChartTasks,
  leftPanelTasks,
  milestones = [],
  isDragging,
  verticalDragState,
  tempDragPosition,
  draggedTask,
  draggedTaskData,
  dragType,
  isHoveringEdge,
  setIsHoveringEdge,
  startHorizontalDrag,
  startVerticalDrag,
  updateHorizontalDragPosition,
  updateVerticalDragPosition,
  updateDragMetrics,
  resetHorizontalDrag,
  resetVerticalDrag,
  pixelToDate,
  dateToPixel,
  dateRange,
  setProjectRows,
  ganttEvents,
  handleTaskUpdate,
  containerRef,
  children
}) => {

  // 边界检测处理器
  const detectEdgeHover = useCallback((e: React.MouseEvent, _task: any): 'left' | 'right' | null => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const edgeZone = LAYOUT_CONSTANTS.EDGE_DETECTION_ZONE;
    
    if (mouseX <= edgeZone) return 'left';
    if (mouseX >= rect.width - edgeZone) return 'right';
    return null;
  }, []);

  const handleEdgeHover = useCallback((e: React.MouseEvent, task: any) => {
    if (!isDragging) {
      const edgeType = detectEdgeHover(e, task);
      if (isHoveringEdge !== edgeType) {
        setIsHoveringEdge(edgeType);
      }
    }
  }, [isDragging, isHoveringEdge, detectEdgeHover, setIsHoveringEdge]);

  const handleMouseDown = useCallback((e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    
    // 首先在任务列表中查找
    let task = sortedChartTasks.find(t => t.id === taskId);
    
    // 如果在任务列表中找不到，检查是否是里程碑
    if (!task) {
      const milestone = milestones.find(m => m.id === taskId);
      if (milestone) {
        // 🔧 修复：里程碑坐标不一致问题
        // 问题：milestone.x 是存储的旧坐标，而渲染时使用 dateToPixel(milestone.date) 计算新坐标
        // 解决：使用基于日期重新计算的坐标，确保拖拽起始位置与渲染位置一致
        const currentRenderX = dateToPixel(milestone.date);
        
        console.log('=== 里程碑坐标修复调试信息 ===');
        console.log('里程碑ID:', milestone.id);
        console.log('存储的旧坐标:', milestone.x);
        console.log('基于日期计算的当前渲染坐标:', currentRenderX);
        console.log('使用坐标:', currentRenderX);
        
        // 将里程碑转换为任务对象以便拖拽处理
        task = {
          id: milestone.id,
          title: milestone.title || milestone.label || '里程碑',
          type: 'milestone',
          x: currentRenderX, // 🔧 使用当前渲染坐标而不是存储坐标
          width: 16, // 里程碑的固定宽度
          startDate: milestone.date,
          endDate: milestone.date, // 里程碑的开始和结束日期相同
          status: 'active',
          color: milestone.color || '#666666'
        };
        
        console.log('修复后任务对象X坐标:', task.x);
        console.log('============================');
      }
    }
    
    if (!task || !containerRef.current) {
      return;
    }
    
    const currentDragType = task.type === 'milestone' ? 'move' : (() => {
      const edgeType = detectEdgeHover(e, task);
      return edgeType ? `resize-${edgeType}` as 'resize-left' | 'resize-right' : 'move';
    })();
    
    // 计算正确的 pixelPerDay
    const totalDays = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (24 * 60 * 60 * 1000));
    const startPixel = 0;
    const endPixel = dateToPixel(dateRange.endDate);
    const calculatedPixelPerDay = totalDays > 0 ? endPixel / totalDays : 1;
    
    // 验证 pixelPerDay 的有效性
    const safePixelPerDay = typeof calculatedPixelPerDay === 'number' && !isNaN(calculatedPixelPerDay) && calculatedPixelPerDay > 0 
      ? calculatedPixelPerDay 
      : 1; // 默认值
    
    updateDragMetrics(task, safePixelPerDay);
    startHorizontalDrag(taskId, task, e.clientX, e.clientY, currentDragType, containerRef.current);
  }, [sortedChartTasks, milestones, detectEdgeHover, updateDragMetrics, dateRange, dateToPixel, startHorizontalDrag, containerRef]);

  const handleTitleMouseDown = useCallback((e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const taskIndex = leftPanelTasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      startVerticalDrag(taskId, taskIndex, e.clientY);
    }
  }, [leftPanelTasks, startVerticalDrag]);

  const handleTitleMouseMove = useCallback((e: MouseEvent) => {
    if (verticalDragState.isDragging) {
      updateVerticalDragPosition(e.clientY, LAYOUT_CONSTANTS.TASK_ROW_HEIGHT, leftPanelTasks.length);
    }
  }, [verticalDragState.isDragging, updateVerticalDragPosition, leftPanelTasks.length]);

  const handleTitleMouseUp = useCallback(() => {
    if (verticalDragState.isDragging && 
        verticalDragState.targetIndex !== null && 
        verticalDragState.draggedTaskIndex !== null &&
        verticalDragState.targetIndex !== verticalDragState.draggedTaskIndex) {
      
      // 修复后的重排序逻辑
      setProjectRows((prev: any[]) => {
        const newRows = [...prev];
        const draggedTaskId = verticalDragState.draggedTaskId;
        const draggedIndex = verticalDragState.draggedTaskIndex!;
        const targetIndex = verticalDragState.targetIndex!;
        
        // 直接使用draggedTaskId查找被拖拽的项目行
        const draggedRow = newRows.find(row => row.id === draggedTaskId);
        if (!draggedRow) return prev;
        
        // 基于visibleProjectRows计算正确的目标位置
        const currentVisibleRows = getVisibleProjectRows(newRows.sort((a, b) => a.order - b.order), new Map(newRows.map(row => [row.id, row])));
        
        // 计算目标位置的正确order值
        let targetOrder: number;
        if (targetIndex >= currentVisibleRows.length) {
          // 拖拽到最后位置
          targetOrder = Math.max(...newRows.map(row => row.order)) + 1;
        } else if (targetIndex === 0) {
          // 拖拽到第一位置
          targetOrder = Math.min(...newRows.map(row => row.order)) - 1;
        } else {
          // 拖拽到中间位置
          const targetRow = currentVisibleRows[targetIndex];
          const targetRowInAll = newRows.find(row => row.id === targetRow.id);
          if (targetRowInAll) {
            if (draggedIndex < targetIndex) {
              // 向下拖拽：插入到目标位置后面
              targetOrder = targetRowInAll.order + 0.5;
            } else {
              // 向上拖拽：插入到目标位置前面
              targetOrder = targetRowInAll.order - 0.5;
            }
          } else {
            return prev;
          }
        }
        
        // 获取所有子代任务
        const descendants = getAllDescendantRows(draggedRow.id, newRows);
        
        // 更新被拖拽行和所有子代任务的order
        const updatedRows = newRows.map(row => {
          if (row.id === draggedRow.id) {
            return { ...row, order: targetOrder };
          }
          // 同步更新所有子代任务，确保它们紧跟在父任务后面
          if (descendants.some(desc => desc.id === row.id)) {
            // 找到这个子任务在descendants中的索引
            const descendantIndex = descendants.findIndex(desc => desc.id === row.id);
            // 子任务的order应该是父任务order + 0.1 + 0.01 * index，确保紧跟在父任务后面
            const newOrder = targetOrder + 0.1 + 0.01 * descendantIndex;
            return { ...row, order: newOrder };
          }
          return row;
        });
        
        // 重新排序并规范化order值
        return updatedRows.sort((a, b) => a.order - b.order).map((row, index) => ({
          ...row,
          order: index
        }));
      });
    }
    resetVerticalDrag();
  }, [verticalDragState, setProjectRows, resetVerticalDrag]);

  const handleMouseMoveCore = useCallback((e: MouseEvent) => {
    if (isDragging && containerRef.current) {
      const chartWidth = containerRef.current.clientWidth;
      updateHorizontalDragPosition(e.clientX, chartWidth, LAYOUT_CONSTANTS.MIN_TASK_WIDTH);
    }
  }, [isDragging, updateHorizontalDragPosition]);

  const handleMouseMove = useThrottledMouseMove(handleMouseMoveCore, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (tempDragPosition && draggedTask && draggedTaskData && dragType) {
      const newStartDate = pixelToDate(tempDragPosition.x);
      
      // 验证日期有效性
      if (isNaN(newStartDate.getTime())) {
        console.error('Invalid start date calculated:', newStartDate);
        resetHorizontalDrag();
        return;
      }
      
      const newEndDate = dragType === 'move' 
        ? (draggedTaskData.type === 'milestone' 
          ? newStartDate 
          : new Date(newStartDate.getTime() + (draggedTaskData.endDate.getTime() - draggedTaskData.startDate.getTime())))
        : dragType === 'resize-left' 
        ? draggedTaskData.endDate 
        : pixelToDate(tempDragPosition.x + tempDragPosition.width);
      
      // 验证结束日期有效性
      if (isNaN(newEndDate.getTime())) {
        console.error('Invalid end date calculated:', newEndDate);
        resetHorizontalDrag();
        return;
      }
      
      ganttEvents.updateTaskDates(draggedTask, newStartDate, newEndDate);
    }
    resetHorizontalDrag();
  }, [tempDragPosition, draggedTask, draggedTaskData, dragType, pixelToDate, ganttEvents, resetHorizontalDrag]);

  // 添加水平拖拽事件监听器
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

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

  // 任务创建处理器
  const handleCreateTask = useCallback((task: Task) => {
    // 这个逻辑需要从父组件传入 ganttInteractions.contextMenu
    // 暂时简化处理
    ganttEvents.createTask(task);
  }, [ganttEvents]);

  const handleCreateMilestone = useCallback((milestone: MilestoneNode) => {
    // 这个逻辑需要从父组件传入 ganttInteractions.contextMenu  
    // 暂时简化处理
    ganttEvents.createMilestone(milestone);
  }, [ganttEvents]);

  const handlers: EventHandlers = {
    handleCreateTask,
    handleCreateMilestone,
    handleEdgeHover,
    handleMouseDown,
    handleTitleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTitleMouseMove,
    handleTitleMouseUp,
    handleTaskUpdate,
    containerRef
  };

  return children(handlers);
};

export default GanttEventCoordinator;