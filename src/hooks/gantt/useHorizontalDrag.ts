import { useCallback } from 'react';
import { Task, MilestoneNode } from '../../types';
import { boundaryHelpers } from '../../utils/boundaryUtils';
import { hasDateInLabel, replaceDateInLabel } from '../../utils/ganttUtils';
import { LAYOUT_CONSTANTS } from '../../components/gantt/ganttStyles';

interface UseHorizontalDragProps {
  // 拖拽状态
  isDragging: boolean;
  draggedTask: string | null;
  draggedTaskData: Task | null;
  dragType: 'move' | 'resize-left' | 'resize-right' | 'milestone-move' | null;
  tempDragPosition: { x: number; y?: number; width: number; height?: number } | null;
  isHoveringEdge: 'left' | 'right' | null;
  
  // 任务数据
  sortedChartTasks: Task[];
  taskMapMemo: Map<string, Task>;
  containerRef: React.RefObject<HTMLDivElement>;
  
  // 里程碑数据
  milestones: MilestoneNode[];
  onMilestoneUpdate: (milestoneId: string, updates: Partial<MilestoneNode>) => void;
  
  // 拖拽系统方法
  startHorizontalDrag: (taskId: string, task: Task, clientX: number, clientY: number, dragType: string, container: HTMLDivElement) => void;
  updateHorizontalDragPosition: (clientX: number, chartWidth: number, minWidth: number) => void;
  updateMilestoneDragPosition?: (clientX: number, clientY: number, chartWidth: number, chartHeight: number) => void;
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
  
  // 里程碑特有功能
  convertMilestoneToTask: (milestone: MilestoneNode) => Task;
  constrainMilestonePosition: (x: number, y: number, containerWidth: number, containerHeight: number) => { x: number; y: number; isWithinBounds: boolean };
  handleMilestoneOverlap: (milestones: MilestoneNode[], nodeSize?: number) => MilestoneNode[];
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
  milestones,
  onMilestoneUpdate,
  startHorizontalDrag,
  updateHorizontalDragPosition,
  updateMilestoneDragPosition,
  resetHorizontalDrag,
  pixelToDate,
  dateToPixel,
  updateDragMetrics,
  updateTaskDates,
  setIsHoveringEdge,
  useThrottledMouseMove
}: UseHorizontalDragProps): UseHorizontalDragResult => {

  // 将里程碑转换为任务对象以便复用拖拽逻辑
  const convertMilestoneToTask = useCallback((milestone: MilestoneNode): Task => {
    const currentRenderX = dateToPixel(milestone.date);
    return {
      id: milestone.id,
      title: milestone.title || milestone.label || '里程碑',
      type: 'milestone' as any,
      x: currentRenderX,
      width: LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE,
      startDate: milestone.date,
      endDate: milestone.date, // 里程碑的开始和结束日期相同
      status: 'active' as any,
      color: milestone.color || '#666666'
    };
  }, [dateToPixel]);

  // 里程碑边界约束处理
  const constrainMilestonePosition = useCallback((x: number, y: number, containerWidth: number, containerHeight: number): { x: number; y: number; isWithinBounds: boolean } => {
    const nodeSize = LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE;
    const constrainedPosition = boundaryHelpers.constrainMilestone(x, y, containerWidth, containerHeight, nodeSize);
    
    return {
      x: constrainedPosition.x,
      y: constrainedPosition.y,
      isWithinBounds: constrainedPosition.isWithinBounds
    };
  }, []);

  // 处理里程碑重叠错开
  const handleMilestoneOverlap = useCallback((milestones: MilestoneNode[], nodeSize: number = LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE): MilestoneNode[] => {
    // 按 x 坐标分组，找出重叠的节点
    const groups: Map<number, MilestoneNode[]> = new Map();
    
    milestones.forEach(milestone => {
      if (!milestone.x) return;
      
      // 找到相近的 x 坐标组（容差范围内）
      let groupKey = milestone.x;
      for (const [key] of groups) {
        if (Math.abs(key - milestone.x) <= nodeSize + 5) { // 5px 水平间距
          groupKey = key;
          break;
        }
      }
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(milestone);
    });

    // 对每组重叠的节点进行错开处理
    const result: MilestoneNode[] = [];
    
    groups.forEach((groupMilestones, baseX) => {
      groupMilestones.forEach((milestone, index) => {
        const verticalOffset = index * 20; // 20px 垂直间距
        
        result.push({
          ...milestone,
          x: baseX,
          y: (milestone.y || 0) + verticalOffset
        });
      });
    });

    return result;
  }, []);

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
    
    if (!containerRef.current) return;
    
    // 首先检查是否是里程碑
    const milestone = milestones.find(m => m.id === taskId);
    if (milestone) {
      // 里程碑专用处理
      const milestoneAsTask = convertMilestoneToTask(milestone);
      const currentDragType = 'milestone-move';
      
      // 更新拖拽度量缓存
      updateDragMetrics(milestoneAsTask, dateToPixel(new Date(Date.now() + 24 * 60 * 60 * 1000)) - dateToPixel(new Date()));
      
      // 开始里程碑拖拽
      startHorizontalDrag(
        taskId,
        milestoneAsTask,
        e.clientX,
        e.clientY,
        currentDragType,
        containerRef.current
      );
      return;
    }
    
    // 优先查找chartTask
    let task: any = sortedChartTasks.find(t => t.id === taskId);
    
    // 如果不是chartTask，查找兼容性task
    if (!task) {
      task = taskMapMemo.get(taskId);
    }
    
    if (!task) return;
    
    // 检测拖拽类型
    // 普通任务支持移动和调整大小
    const currentDragType = (() => {
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
    milestones,
    convertMilestoneToTask,
    detectEdgeHover,
    updateDragMetrics,
    dateToPixel,
    startHorizontalDrag
  ]);

  // 水平拖拽移动处理
  const handleMouseMoveCore = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const chartWidth = containerRef.current.clientWidth;
    const chartHeight = containerRef.current.clientHeight;
    
    if (dragType === 'milestone-move') {
      // 里程碑专用移动处理：支持 X 和 Y 轴
      if (updateMilestoneDragPosition) {
        updateMilestoneDragPosition(e.clientX, e.clientY, chartWidth, chartHeight);
      } else {
        // 如果没有专用的里程碑更新方法，回退到水平更新
        updateHorizontalDragPosition(e.clientX, chartWidth, LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE);
      }
      
      // 里程碑实时更新逻辑
      if (draggedTask && draggedTaskData && tempDragPosition) {
        const milestone = milestones.find(m => m.id === draggedTask);
        if (milestone) {
          const newDate = pixelToDate(tempDragPosition.x);
          const updates: Partial<MilestoneNode> = {
            x: tempDragPosition.x,
            date: newDate
          };
          
          // 如果有 Y 坐标，也更新
          if (tempDragPosition.y !== undefined) {
            updates.y = tempDragPosition.y;
          }
          
          // 智能标签更新
          if (milestone.label && hasDateInLabel(milestone.label)) {
            updates.label = replaceDateInLabel(milestone.label, newDate);
          }
          
          onMilestoneUpdate(draggedTask, updates);
        }
      }
    } else {
      // 任务条处理（现有逻辑）
      updateHorizontalDragPosition(e.clientX, chartWidth, 20);
    }
  }, [
    isDragging, 
    dragType, 
    containerRef, 
    updateHorizontalDragPosition, 
    updateMilestoneDragPosition,
    draggedTask,
    draggedTaskData,
    tempDragPosition,
    milestones,
    pixelToDate,
    onMilestoneUpdate
  ]);

  // 节流的鼠标移动处理
  const handleMouseMove = useThrottledMouseMove(handleMouseMoveCore, [isDragging]);

  // 水平拖拽结束处理
  const handleMouseUp = useCallback(() => {
    if (tempDragPosition && draggedTask && draggedTaskData && dragType) {
      
      if (dragType === 'milestone-move') {
        // 里程碑移动结束处理
        const milestone = milestones.find(m => m.id === draggedTask);
        if (milestone) {
          const newDate = pixelToDate(tempDragPosition.x);
          const finalUpdates: Partial<MilestoneNode> = {
            x: tempDragPosition.x,
            date: newDate
          };
          
          // 如果有 Y 坐标，也更新
          if (tempDragPosition.y !== undefined) {
            finalUpdates.y = tempDragPosition.y;
          }
          
          // 智能标签更新
          if (milestone.label && hasDateInLabel(milestone.label)) {
            finalUpdates.label = replaceDateInLabel(milestone.label, newDate);
          }
          
          onMilestoneUpdate(draggedTask, finalUpdates);
        }
      } else {
        // 任务条结束处理（现有逻辑）
        let newStartDate: Date;
        let newEndDate: Date;
        
        if (dragType === 'move') {
          // 移动任务条：保持时间段长度，改变开始和结束时间
          newStartDate = pixelToDate(tempDragPosition.x);
          
          // 所有任务都保持时间段长度
          const duration = draggedTaskData.endDate.getTime() - draggedTaskData.startDate.getTime();
          newEndDate = new Date(newStartDate.getTime() + duration);
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
    }
    
    // 重置拖拽状态
    resetHorizontalDrag();
  }, [
    tempDragPosition,
    draggedTask,
    draggedTaskData,
    dragType,
    milestones,
    pixelToDate,
    onMilestoneUpdate,
    resetHorizontalDrag,
    updateTaskDates
  ]);

  return {
    detectEdgeHover,
    handleEdgeHover,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    
    // 里程碑特有功能
    convertMilestoneToTask,
    constrainMilestonePosition,
    handleMilestoneOverlap
  };
};