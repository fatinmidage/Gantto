import { useCallback } from 'react';
import { Task, MilestoneNode, ProjectRow, VerticalDragState, DragState, DragType, ColorPickerState, TagManagerState } from '../../types';

// 导入样式常量
import { LAYOUT_CONSTANTS } from '../../components/gantt';

// 事件处理器返回类型
export interface GanttHandlersResult {
  // 任务操作处理器
  handleCreateTask: (task: Task) => void;
  handleCreateMilestone: (milestone: MilestoneNode) => void;
  handleShowColorPicker: (taskId: string) => void;
  handleShowTagManager: (taskId: string) => void;
  handleTaskDelete: (taskId: string) => void;
  handleColorChange: (taskId: string, color: string) => void;
  handleTagAdd: (taskId: string, tag: string) => void;
  handleTagRemove: (taskId: string, tag: string) => void;

  // 拖拽处理器
  detectEdgeHover: (e: React.MouseEvent, task: Task) => 'left' | 'right' | null;
  handleEdgeHover: (e: React.MouseEvent, task: Task) => void;
  handleMouseDown: (e: React.MouseEvent, taskId: string) => void;
  handleTitleMouseDown: (e: React.MouseEvent, taskId: string) => void;
  handleTitleMouseUp: () => void;
  handleMouseUp: () => void;
}

// Hook 参数接口
interface UseGanttHandlersParams {
  // 数据状态
  tasks: Task[];
  sortedChartTasks: Task[];
  leftPanelTasks: Task[];
  taskMapMemo: Map<string, Task>;
  setProjectRows: React.Dispatch<React.SetStateAction<ProjectRow[]>>;
  
  // 拖拽状态
  isDragging: boolean;
  draggedTask: string | null;
  draggedTaskData: Task | null;
  dragType: DragType | null;
  tempDragPosition: DragState['tempPosition'] | null;
  verticalDragState: VerticalDragState;
  isHoveringEdge: 'left' | 'right' | null;
  setIsHoveringEdge: (edge: 'left' | 'right' | null) => void;
  
  // 拖拽方法
  startHorizontalDrag: (
    taskId: string, 
    task: Task, 
    clientX: number, 
    clientY: number, 
    dragType: DragType, 
    container: HTMLElement
  ) => void;
  startVerticalDrag: (taskId: string, taskIndex: number, clientY: number) => void;
  updateDragMetrics: (task: Task, pixelPerDay: number) => void;
  resetHorizontalDrag: () => void;
  resetVerticalDrag: () => void;
  
  // 事件处理方法
  ganttEvents: {
    createTask: (task: Task) => void;
    createMilestone: (milestone: MilestoneNode) => void;
    deleteTaskCore: (taskId: string) => void;
    handleColorChange: (taskId: string, color: string) => void;
    handleTagAdd: (taskId: string, tag: string) => void;
    handleTagRemove: (taskId: string, tag: string) => void;
    updateTaskDates: (taskId: string, startDate: Date, endDate: Date) => void;
  };
  ganttInteractions: {
    taskContextMenu: {
      x: number;
      y: number;
    };
  };
  
  // 时间轴方法
  pixelToDate: (pixel: number) => Date;
  dateRange: { pixelPerDay: number };
  
  // 容器引用
  containerRef: React.RefObject<HTMLDivElement>;
  
  // 菜单状态设置 (阶段5中详细类型化)
  setColorPickerState: (state: Partial<ColorPickerState>) => void;
  setTagManagerState: (state: Partial<TagManagerState>) => void;
}

/**
 * 甘特图事件处理器 Hook
 * 集中管理所有事件处理函数的创建和配置
 */
export const useGanttHandlers = (params: UseGanttHandlersParams): GanttHandlersResult => {
  const {
    tasks,
    sortedChartTasks,
    leftPanelTasks,
    taskMapMemo,
    setProjectRows,
    isDragging,
    draggedTask,
    draggedTaskData,
    dragType,
    tempDragPosition,
    verticalDragState,
    isHoveringEdge,
    setIsHoveringEdge,
    startHorizontalDrag,
    startVerticalDrag,
    updateDragMetrics,
    resetHorizontalDrag,
    resetVerticalDrag,
    ganttEvents,
    ganttInteractions,
    pixelToDate,
    dateRange,
    containerRef,
    setColorPickerState,
    setTagManagerState
  } = params;

  // === 任务操作事件处理器 ===

  const handleCreateTask = useCallback((task: Task) => {
    ganttEvents.createTask(task);
  }, [ganttEvents]);

  const handleCreateMilestone = useCallback((milestone: MilestoneNode) => {
    ganttEvents.createMilestone(milestone);
  }, [ganttEvents]);

  const handleShowColorPicker = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setColorPickerState({
      visible: true,
      position: { x: ganttInteractions.taskContextMenu.x, y: ganttInteractions.taskContextMenu.y },
      taskId,
      currentColor: task?.color
    });
  }, [tasks, ganttInteractions.taskContextMenu, setColorPickerState]);

  const handleShowTagManager = useCallback((taskId: string) => {
    setTagManagerState({
      visible: true,
      position: { x: ganttInteractions.taskContextMenu.x, y: ganttInteractions.taskContextMenu.y },
      taskId
    });
  }, [ganttInteractions.taskContextMenu, setTagManagerState]);

  const handleTaskDelete = useCallback((taskId: string) => {
    ganttEvents.deleteTaskCore(taskId);
  }, [ganttEvents.deleteTaskCore]);

  const handleColorChange = useCallback((taskId: string, color: string) => {
    ganttEvents.handleColorChange(taskId, color);
    setColorPickerState({ visible: false });
  }, [ganttEvents, setColorPickerState]);

  const handleTagAdd = useCallback((taskId: string, tag: string) => {
    ganttEvents.handleTagAdd(taskId, tag);
  }, [ganttEvents]);

  const handleTagRemove = useCallback((taskId: string, tag: string) => {
    ganttEvents.handleTagRemove(taskId, tag);
  }, [ganttEvents]);

  // === 边界检测和拖拽事件处理器 ===

  const detectEdgeHover = useCallback((e: React.MouseEvent, _task: Task): 'left' | 'right' | null => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const edgeZone = LAYOUT_CONSTANTS.EDGE_DETECTION_ZONE;
    
    if (mouseX <= edgeZone) return 'left';
    if (mouseX >= rect.width - edgeZone) return 'right';
    return null;
  }, []);

  const handleEdgeHover = useCallback((e: React.MouseEvent, task: Task) => {
    if (!isDragging) {
      const edgeType = detectEdgeHover(e, task);
      if (isHoveringEdge !== edgeType) {
        setIsHoveringEdge(edgeType);
      }
    }
  }, [isDragging, isHoveringEdge, detectEdgeHover, setIsHoveringEdge]);

  const handleMouseDown = useCallback((e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    
    const task = sortedChartTasks.find(t => t.id === taskId) || taskMapMemo.get(taskId);
    if (!task || !containerRef.current) return;
    
    const currentDragType = (() => {
      const edgeType = detectEdgeHover(e, task);
      return edgeType ? `resize-${edgeType}` as 'resize-left' | 'resize-right' : 'move';
    })();
    
    updateDragMetrics(task, dateRange.pixelPerDay);
    startHorizontalDrag(taskId, task, e.clientX, e.clientY, currentDragType, containerRef.current);
  }, [sortedChartTasks, taskMapMemo, detectEdgeHover, updateDragMetrics, dateRange.pixelPerDay, startHorizontalDrag, containerRef]);

  const handleTitleMouseDown = useCallback((e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const taskIndex = leftPanelTasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      startVerticalDrag(taskId, taskIndex, e.clientY);
    }
  }, [leftPanelTasks, startVerticalDrag]);

  const handleTitleMouseUp = useCallback(() => {
    if (verticalDragState.isDragging && 
        verticalDragState.targetIndex !== null && 
        verticalDragState.draggedTaskIndex !== null &&
        verticalDragState.targetIndex !== verticalDragState.draggedTaskIndex) {
      
      // 简化的重排序逻辑
      setProjectRows((prev: ProjectRow[]) => {
        const newRows = [...prev];
        const draggedIndex = verticalDragState.draggedTaskIndex!;
        const targetIndex = verticalDragState.targetIndex!;
        
        // 重新排序
        const draggedRow = newRows.find(row => row.id === leftPanelTasks[draggedIndex].id);
        if (draggedRow) {
          // 简单的order调整
          const targetOrder = targetIndex < newRows.length ? newRows[targetIndex].order : newRows.length;
          const orderDelta = targetOrder - draggedRow.order;
          
          return newRows.map(row => {
            if (row.id === draggedRow.id) {
              return { ...row, order: row.order + orderDelta };
            }
            return row;
          }).sort((a, b) => a.order - b.order).map((row, index) => ({
            ...row,
            order: index
          }));
        }
        return prev;
      });
    }
    resetVerticalDrag();
  }, [verticalDragState, leftPanelTasks, setProjectRows, resetVerticalDrag]);

  const handleMouseUp = useCallback(() => {
    if (tempDragPosition && draggedTask && draggedTaskData && dragType) {
      const newStartDate = pixelToDate(tempDragPosition.x);
      
      // 检查是否为里程碑：开始时间等于结束时间
      const isTimeEqual = draggedTaskData.startDate.getTime() === draggedTaskData.endDate.getTime();
      const isMilestone = isTimeEqual;
      
      
      const newEndDate = dragType === 'move' 
        ? (isMilestone 
          ? newStartDate 
          : new Date(newStartDate.getTime() + (draggedTaskData.endDate.getTime() - draggedTaskData.startDate.getTime())))
        : dragType === 'resize-left' 
        ? draggedTaskData.endDate 
        : pixelToDate(tempDragPosition.x + tempDragPosition.width);
      
      
      ganttEvents.updateTaskDates(draggedTask, newStartDate, newEndDate);
    }
    resetHorizontalDrag();
  }, [tempDragPosition, draggedTask, draggedTaskData, dragType, pixelToDate, ganttEvents, resetHorizontalDrag]);

  return {
    // 任务操作
    handleCreateTask,
    handleCreateMilestone,
    handleShowColorPicker,
    handleShowTagManager,
    handleTaskDelete,
    handleColorChange,
    handleTagAdd,
    handleTagRemove,
    
    // 拖拽事件
    detectEdgeHover,
    handleEdgeHover,
    handleMouseDown,
    handleTitleMouseDown,
    handleTitleMouseUp,
    handleMouseUp
  };
};