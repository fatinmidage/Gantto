import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { calculateTargetRowId, calculateSmartTaskDuration } from '../utils/ganttUtils';
import GanttChartHeader from './gantt/GanttChartHeader';
import GanttChartBody from './gantt/GanttChartBody';
import GanttMenuManager from './gantt/GanttMenuManager';

// 导入类型定义
import { Task } from '../types';

// 导入初始数据
import { initialProjectRows, initialChartTasks } from '../data/initialData';

// 导入自定义 Hooks
import {
  useDragAndDrop,
  useTaskManager,
  useTimeline,
  useGanttUI,
  useGanttEvents,
  useGanttInteractions,
  useGanttKeyboard,
  useThrottledMouseMove
} from '../hooks';

// 导入层级帮助函数
import {
  getVisibleProjectRows,
  getAllDescendantRows
} from './gantt/GanttHelpers';

// 导入样式常量
import {
  LAYOUT_CONSTANTS
} from './gantt/ganttStyles';


interface GanttChartProps {
  startDate?: Date;
  endDate?: Date;
  timelineHeight?: number;
  taskHeight?: number;
}




// --- GanttChart Component ---

const GanttChart: React.FC<GanttChartProps> = ({
  startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  endDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
  timelineHeight = 40,
  taskHeight = 30
}) => {

  // === 使用自定义 Hooks ===
  
  // 任务管理
  const taskManager = useTaskManager({
    projectRows: initialProjectRows,
    chartTasks: initialChartTasks
  });
  
  // 拖拽功能
  const dragAndDrop = useDragAndDrop();
  
  // 时间轴管理
  const timeline = useTimeline(startDate, endDate);
  
  // UI 状态管理
  const ganttUI = useGanttUI();

  // === 可用标签状态管理 ===
  const [availableTags, setAvailableTags] = useState<string[]>([
    '重要', '紧急', '测试', '开发', '设计', '评审', '部署'
  ]);

  // === 从 Hooks 解构状态和方法 ===
  
  // 数据状态
  const { 
    projectRows, 
    chartTasks, 
    tasks, 
    setProjectRows, 
    setChartTasks, 
    setTasks 
  } = taskManager;


  // 事件处理 Hooks
  const ganttEvents = useGanttEvents({
    tasks,
    chartTasks,
    projectRows,
    setTasks,
    setChartTasks,
    setProjectRows,
    availableTags,
    setAvailableTags
  });
  
  // 拖拽状态和方法
  const {
    draggedTask,
    isDragging,
    tempDragPosition,
    verticalDragState,
    isHoveringEdge,
    setIsHoveringEdge,
    draggedTaskData,
    dragType,
    startHorizontalDrag,
    startVerticalDrag,
    updateHorizontalDragPosition,
    updateVerticalDragPosition,
    updateDragMetrics,
    resetHorizontalDrag,
    resetVerticalDrag
  } = dragAndDrop;
  
  // 时间轴状态和方法
  const {
    zoomLevel,
    dateRange,
    dateToPixel,
    pixelToDate,
    handleZoomIn,
    handleZoomOut,
    handleViewToday,
    timeScales
  } = timeline;
  
  // UI状态和方法
  const {
    selectedChartTaskId,
    setSelectedChartTaskId
  } = ganttUI;

  // 标题列宽度状态
  const [titleColumnWidth, setTitleColumnWidth] = useState<number>(LAYOUT_CONSTANTS.TITLE_COLUMN_WIDTH);
  
  // 处理标题列宽度变化
  const handleTitleColumnWidthChange = useCallback((width: number) => {
    setTitleColumnWidth(width);
  }, []);
  
  // 甘特图交互功能
  const ganttInteractions = useGanttInteractions({
    setTasks,
    setChartTasks,
    setProjectRows,
    deleteTaskCore: ganttEvents.deleteTaskCore,
    projectRows,
    containerRef: { current: null },
    pixelToDate,
    taskHeight,
    timelineHeight
  });
  
  // 键盘事件处理
  useGanttKeyboard({
    selectedTaskId: selectedChartTaskId || undefined,
    selectedTitleTaskId: ganttInteractions.selectedTitleTaskId || undefined,
    onTaskDelete: ganttEvents.deleteTaskCore,
    onTaskCreate: ganttEvents.addNewTask,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    enabled: true
  });
  
  const MIN_CONTAINER_HEIGHT = LAYOUT_CONSTANTS.MIN_CONTAINER_HEIGHT;
  const sortedProjectRows = useMemo(() => [...projectRows].sort((a, b) => a.order - b.order), [projectRows]);
  const projectRowMapMemo = useMemo(() => new Map(sortedProjectRows.map(row => [row.id, row])), [sortedProjectRows]);
  const visibleProjectRows = useMemo(() => getVisibleProjectRows(sortedProjectRows, projectRowMapMemo), [sortedProjectRows, projectRowMapMemo]);
  
  const sortedChartTasks = useMemo(() => chartTasks.map(task => {
    const x = dateToPixel(task.startDate);
    const width = dateToPixel(task.endDate) - x;
    return { ...task, x, width: Math.max(width, 20) };
  }), [chartTasks, dateToPixel]);

  const leftPanelTasks = useMemo(() => visibleProjectRows.map(row => ({
    ...row,
    startDate: new Date(),
    endDate: new Date(),
    color: '#ccc',
    x: 0,
    width: 0,
    status: 'pending' as const,
    rowId: row.id,
    isCreatedFromContext: false,
    isPlaceholder: false,
    type: (row.type || 'default') as 'milestone' | 'development' | 'testing' | 'delivery' | 'default'
  })), [visibleProjectRows]);

  const chartTaskRows = useMemo(() => {
    const rowMap = new Map<string, Task[]>();
    visibleProjectRows.forEach(row => rowMap.set(row.id, []));
    sortedChartTasks.forEach(task => task.rowId && rowMap.has(task.rowId) && rowMap.get(task.rowId)!.push(task));
    return visibleProjectRows.map(row => ({
      rowId: row.id,
      tasks: rowMap.get(row.id)!.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    }));
  }, [visibleProjectRows, sortedChartTasks]);

  const containerHeight = useMemo(() => 
    Math.max(MIN_CONTAINER_HEIGHT, leftPanelTasks.length * (taskHeight + 10) + 20), 
    [leftPanelTasks.length, taskHeight]);

  const taskContentHeight = useMemo(() => containerHeight, [containerHeight]);
  const handleCreateTask = useCallback((task: Task) => {
    const { clickPosition } = ganttInteractions.contextMenu;
    if (clickPosition) {
      const clickDate = pixelToDate(clickPosition.x);
      const defaultDays = calculateSmartTaskDuration(zoomLevel);
      const targetRowId = calculateTargetRowId(clickPosition.y, taskHeight, projectRows);
      ganttEvents.createTask({
        ...task,
        startDate: clickDate,
        endDate: new Date(clickDate.getTime() + defaultDays * 24 * 60 * 60 * 1000),
        rowId: targetRowId
      });
    } else {
      ganttEvents.createTask(task);
    }
  }, [ganttEvents, ganttInteractions.contextMenu.clickPosition, pixelToDate, zoomLevel, taskHeight, projectRows]);

  const handleCreateMilestone = useCallback((milestone: Task) => {
    const { clickPosition } = ganttInteractions.contextMenu;
    if (clickPosition) {
      const clickDate = pixelToDate(clickPosition.x);
      const targetRowId = calculateTargetRowId(clickPosition.y, taskHeight, projectRows);
      ganttEvents.createMilestone({
        ...milestone,
        startDate: clickDate,
        endDate: clickDate,
        rowId: targetRowId
      });
    } else {
      ganttEvents.createMilestone(milestone);
    }
  }, [ganttEvents, ganttInteractions.contextMenu.clickPosition, pixelToDate, taskHeight, projectRows]);

  // 拖拽事件处理
  const containerRef = useRef<HTMLDivElement>(null);

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
    
    const task = sortedChartTasks.find(t => t.id === taskId);
    if (!task || !containerRef.current) return;
    
    const currentDragType = task.type === 'milestone' ? 'move' : (() => {
      const edgeType = detectEdgeHover(e, task);
      return edgeType ? `resize-${edgeType}` as 'resize-left' | 'resize-right' : 'move';
    })();
    
    updateDragMetrics(task, dateRange.pixelPerDay);
    startHorizontalDrag(taskId, task, e.clientX, e.clientY, currentDragType, containerRef.current);
  }, [sortedChartTasks, detectEdgeHover, updateDragMetrics, dateRange.pixelPerDay, startHorizontalDrag]);

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
      setProjectRows(prev => {
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
      const newEndDate = dragType === 'move' 
        ? (draggedTaskData.type === 'milestone' 
          ? newStartDate 
          : new Date(newStartDate.getTime() + (draggedTaskData.endDate.getTime() - draggedTaskData.startDate.getTime())))
        : dragType === 'resize-left' 
        ? draggedTaskData.endDate 
        : pixelToDate(tempDragPosition.x + tempDragPosition.width);
      
      ganttEvents.updateTaskDates(draggedTask, newStartDate, newEndDate);
    }
    resetHorizontalDrag();
  }, [tempDragPosition, draggedTask, draggedTaskData, dragType, pixelToDate, ganttEvents, resetHorizontalDrag]);

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

  return (
    <div className="gantt-container-wrapper">
      <GanttChartHeader
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onAddTask={ganttEvents.addNewTask}
        onDeleteTask={() => ganttInteractions.selectedTitleTaskId && ganttEvents.deleteTaskCore(ganttInteractions.selectedTitleTaskId)}
        onEditTask={() => {/* TODO: 实现编辑功能 */}}
        onViewToday={handleViewToday}
        zoomLevel={zoomLevel}
        canZoomIn={zoomLevel < 1}
        canZoomOut={zoomLevel > 0.01}
        onAddSubtask={() => ganttInteractions.selectedTitleTaskId && ganttInteractions.handleCreateSubtask(ganttInteractions.selectedTitleTaskId)}
        canAddSubtask={!!ganttInteractions.selectedTitleTaskId}
      />
      
      <GanttChartBody
        leftPanelTasks={leftPanelTasks}
        chartTaskRows={chartTaskRows}
        selectedTitleTaskId={ganttInteractions.selectedTitleTaskId}
        selectedChartTaskId={selectedChartTaskId}
        verticalDragState={verticalDragState}
        draggedTask={draggedTask}
        tempDragPosition={tempDragPosition}
        isHoveringEdge={isHoveringEdge}
        isDragging={isDragging}
        titleColumnWidth={titleColumnWidth}
        timelineHeight={timelineHeight}
        taskHeight={taskHeight}
        taskContentHeight={taskContentHeight}
        timeScales={timeScales}
        onTaskSelect={ganttInteractions.setSelectedTitleTaskId}
        onChartTaskSelect={setSelectedChartTaskId}
        onTaskToggle={ganttInteractions.handleToggleExpand}
        onTaskCreateSubtask={ganttInteractions.handleCreateSubtask}
        onTitleMouseDown={handleTitleMouseDown}
        onWidthChange={handleTitleColumnWidthChange}
        onMouseDown={handleMouseDown}
        onTaskContextMenu={ganttInteractions.handleTaskContextMenu}
        onEdgeHover={handleEdgeHover}
        onMouseLeave={() => setIsHoveringEdge(null)}
        onContextMenu={ganttInteractions.handleContextMenu}
        dateToPixel={dateToPixel}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTitleMouseMove={handleTitleMouseMove}
        onTitleMouseUp={handleTitleMouseUp}
      />

      <GanttMenuManager
        tasks={tasks}
        contextMenuState={ganttInteractions.contextMenu}
        taskContextMenuState={ganttInteractions.taskContextMenu}
        defaultRowId={leftPanelTasks[0]?.id || 'row-0'}
        availableTags={availableTags}
        onContextMenuClose={() => ganttInteractions.setContextMenu({ visible: false, x: 0, y: 0, clickPosition: { x: 0, y: 0 } })}
        onTaskContextMenuClose={() => ganttInteractions.setTaskContextMenu({ visible: false, x: 0, y: 0, taskId: null })}
        onCreateTask={handleCreateTask}
        onCreateMilestone={handleCreateMilestone}
        onColorChange={ganttEvents.handleColorChange}
        onTagAdd={ganttEvents.handleTagAdd}
        onTagRemove={ganttEvents.handleTagRemove}
        onTaskDelete={ganttEvents.deleteTaskCore}
        pixelToDate={pixelToDate}
      />
    </div>
  );
}

export default GanttChart;