import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { calculateTargetRowId, calculateSmartTaskDuration } from '../utils/ganttUtils';
import Toolbar from './Toolbar';
import TaskTitleColumn from './gantt/TaskTitleColumn';
import TimelineHeader from './gantt/TimelineHeader';
import TaskBars from './gantt/TaskBars';
import GanttContextMenu from './gantt/GanttContextMenu';
import TaskContextMenu from './gantt/TaskContextMenu';
import ColorPicker from './gantt/ColorPicker';
import TagManager from './gantt/TagManager';

// 导入类型定义
import { Task, ProjectRow } from '../types';

// 导入初始数据
import { initialProjectRows, initialChartTasks } from '../data/initialData';

// 导入自定义 Hooks
import {
  useDragAndDrop,
  useTaskManager,
  useTimeline,
  useGanttUI,
  useThrottledMouseMove,
  useGanttEvents,
  useGanttInteractions,
  useGanttKeyboard
} from '../hooks';

// 导入层级帮助函数
import {
  getVisibleProjectRows,
  getVisibleTasks,
  getAllDescendantRows
} from './gantt/GanttHelpers';

// 导入样式常量
import {
  LAYOUT_CONSTANTS,
  COLOR_CONSTANTS,
  COMPONENT_STYLES
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

  // 可用标签选项
  const [availableTags, setAvailableTags] = useState<string[]>([
    '重要', '紧急', '测试', '开发', '设计', '评审', '部署'
  ]);

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

  // 键盘事件处理将在 ganttInteractions 之后定义

  // 其他状态和配置
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 甘特图交互功能
  const ganttInteractions = useGanttInteractions({
    setTasks,
    setChartTasks,
    setProjectRows,
    deleteTaskCore: ganttEvents.deleteTaskCore,
    projectRows,
    containerRef,
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
  
  // 预定义颜色选项
  const availableColors = [...COLOR_CONSTANTS.AVAILABLE_COLORS];

  // 移除固定宽度，使用状态管理
  // const TITLE_COLUMN_WIDTH = LAYOUT_CONSTANTS.TITLE_COLUMN_WIDTH;
  const CHART_WIDTH = LAYOUT_CONSTANTS.CHART_WIDTH;
  const MIN_CONTAINER_HEIGHT = LAYOUT_CONSTANTS.MIN_CONTAINER_HEIGHT;


  // 添加任务排序辅助函数，同时计算位置信息
  const sortedTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(task => {
        const x = dateToPixel(task.startDate);
        const width = dateToPixel(task.endDate) - x;
        return { ...task, x, width: Math.max(width, 20) };
      });
  }, [tasks, dateToPixel]);

  // 优化taskMap的创建，避免不必要的状态更新
  const taskMapMemo = useMemo(() => {
    const newMap = new Map<string, Task>();
    sortedTasks.forEach(task => {
      newMap.set(task.id, task);
    });
    return newMap;
  }, [sortedTasks]);

  // 新的项目行处理逻辑
  // 1. 获取排序后的项目行
  const sortedProjectRows = useMemo(() => {
    return [...projectRows].sort((a, b) => a.order - b.order);
  }, [projectRows]);

  // 2. 创建项目行映射
  const projectRowMapMemo = useMemo(() => {
    const newMap = new Map<string, ProjectRow>();
    sortedProjectRows.forEach(row => {
      newMap.set(row.id, row);
    });
    return newMap;
  }, [sortedProjectRows]);

  // 3. 获取可见项目行列表（固定的左侧任务列表）
  const visibleProjectRows = useMemo(() => {
    return getVisibleProjectRows(sortedProjectRows, projectRowMapMemo);
  }, [sortedProjectRows, projectRowMapMemo]);

  // 4. 获取排序后的图表任务，添加位置信息
  const sortedChartTasks = useMemo(() => {
    return chartTasks.map(task => {
      const x = dateToPixel(task.startDate);
      const width = dateToPixel(task.endDate) - x;
      return { ...task, x, width: Math.max(width, 20) };
    });
  }, [chartTasks, dateToPixel]);

  // 兼容性数据处理（保持现有代码正常工作）
  // 获取可见任务列表（考虑层级展开状态）
  const visibleTasks = useMemo(() => {
    return getVisibleTasks(sortedTasks, taskMapMemo);
  }, [sortedTasks, taskMapMemo]);

  // 左侧面板任务现在直接使用visibleProjectRows，无需复杂的占位符逻辑
  const leftPanelTasks = useMemo(() => {
    // 将ProjectRow转换为Task格式以保持兼容性
    return visibleProjectRows.map(row => ({
      id: row.id,
      title: row.title,
      startDate: new Date(), // 占位符日期
      endDate: new Date(),   // 占位符日期
      color: '#ccc',
      x: 0,
      width: 0,
      order: row.order,
      type: row.type || 'default',
      status: 'pending' as const,
      level: row.level,
      parentId: row.parentId,
      children: row.children,
      isExpanded: row.isExpanded,
      rowId: row.id,
      isCreatedFromContext: false,
      isPlaceholder: false
    }));
  }, [visibleProjectRows]);

  // 基于新的数据结构：按rowId分组图表任务
  const chartTaskRows = useMemo(() => {
    
    const rowMap = new Map<string, Task[]>();
    
    // 为每个可见项目行创建一个空的任务数组
    visibleProjectRows.forEach(row => {
      rowMap.set(row.id, []);
    });
    
    // 将图表任务分组到对应的行
    sortedChartTasks.forEach(task => {
      if (task.rowId && rowMap.has(task.rowId)) {
        rowMap.get(task.rowId)!.push(task);
      }
    });
    
    // 按项目行顺序排序，同一行内按startDate排序任务
    const result = visibleProjectRows.map(row => ({
      rowId: row.id,
      tasks: rowMap.get(row.id)!.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    }));
    
    return result;
  }, [visibleProjectRows, sortedChartTasks]);

  // 兼容性：按rowId分组任务，支持同一行显示多个任务
  // @ts-ignore - 保留以备兼容性使用
  const taskRows = useMemo(() => {
    const rowMap = new Map<string, Task[]>();
    
    visibleTasks.forEach(task => {
      const rowId = task.rowId || `row-${Math.floor(task.order || 0)}`;
      if (!rowMap.has(rowId)) {
        rowMap.set(rowId, []);
      }
      rowMap.get(rowId)!.push(task);
    });
    
    // 按order排序行，同一行内按startDate排序任务
    return Array.from(rowMap.entries())
      .sort(([, tasksA], [, tasksB]) => {
        const orderA = Math.min(...tasksA.map(t => t.order || 0));
        const orderB = Math.min(...tasksB.map(t => t.order || 0));
        return orderA - orderB;
      })
      .map(([rowId, tasks]) => ({
        rowId,
        tasks: tasks.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      }));
  }, [visibleTasks]);

  // 计算容器高度：根据左侧任务列表的行数动态调整
  const containerHeight = useMemo(() => {
    const taskRowHeight = taskHeight + 10; // 任务高度 + 间距
    const calculatedHeight = leftPanelTasks.length * taskRowHeight + 20; // 额外20px留白
    return Math.max(MIN_CONTAINER_HEIGHT, calculatedHeight);
  }, [leftPanelTasks.length, taskHeight]);

  // 计算任务内容区域高度（不包含时间轴）
  const taskContentHeight = useMemo(() => {
    return containerHeight; // 左侧任务列表区域的内容高度
  }, [containerHeight]);



  // 右键菜单事件处理
  const handleCreateTask = useCallback((task: Task) => {
    // 如果有点击位置信息，使用点击位置的时间作为任务开始时间
    if (ganttInteractions.contextMenu.clickPosition) {
      const clickDate = pixelToDate(ganttInteractions.contextMenu.clickPosition.x);
      
      // 根据缩放级别智能调整默认任务宽度
      const defaultDays = calculateSmartTaskDuration(zoomLevel);
      
      // 计算点击位置对应的行
      const targetRowId = calculateTargetRowId(
        ganttInteractions.contextMenu.clickPosition.y,
        taskHeight,
        projectRows
      );
      
      const updatedTask = {
        ...task,
        startDate: clickDate,
        endDate: new Date(clickDate.getTime() + defaultDays * 24 * 60 * 60 * 1000),
        rowId: targetRowId
      };
      ganttEvents.createTask(updatedTask);
    } else {
      ganttEvents.createTask(task);
    }
  }, [ganttEvents, ganttInteractions.contextMenu.clickPosition, pixelToDate, zoomLevel, taskHeight, projectRows]);

  const handleCreateMilestone = useCallback((milestone: Task) => {
    // 如果有点击位置信息，使用点击位置的时间作为里程碑时间
    if (ganttInteractions.contextMenu.clickPosition) {
      const clickDate = pixelToDate(ganttInteractions.contextMenu.clickPosition.x);
      
      // 计算点击位置对应的行
      const targetRowId = calculateTargetRowId(
        ganttInteractions.contextMenu.clickPosition.y,
        taskHeight,
        projectRows
      );
      
      const updatedMilestone = {
        ...milestone,
        startDate: clickDate,
        endDate: clickDate, // 里程碑开始和结束时间相同
        rowId: targetRowId
      };
      ganttEvents.createMilestone(updatedMilestone);
    } else {
      ganttEvents.createMilestone(milestone);
    }
  }, [ganttEvents, ganttInteractions.contextMenu.clickPosition, pixelToDate, taskHeight, projectRows]);

  const handleShowColorPicker = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setColorPickerState({
      visible: true,
      x: ganttInteractions.taskContextMenu.x,
      y: ganttInteractions.taskContextMenu.y,
      taskId,
      currentColor: task?.color
    });
  }, [tasks, ganttInteractions.taskContextMenu]);

  const handleShowTagManager = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setTagManagerState({
      visible: true,
      x: ganttInteractions.taskContextMenu.x,
      y: ganttInteractions.taskContextMenu.y,
      taskId,
      task
    });
  }, [tasks, ganttInteractions.taskContextMenu]);

  const handleTaskDelete = useCallback((taskId: string) => {
    ganttEvents.deleteTaskCore(taskId);
  }, [ganttEvents.deleteTaskCore]);

  // 更改任务颜色
  const handleColorChange = useCallback((taskId: string, color: string) => {
    ganttEvents.handleColorChange(taskId, color);
    setColorPickerState({ visible: false, x: 0, y: 0 });
  }, [ganttEvents]);

  // 添加标签
  const handleTagAdd = useCallback((taskId: string, tag: string) => {
    ganttEvents.handleTagAdd(taskId, tag);
  }, [ganttEvents]);

  // 移除标签
  const handleTagRemove = useCallback((taskId: string, tag: string) => {
    ganttEvents.handleTagRemove(taskId, tag);
  }, [ganttEvents]);


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
  }, [isDragging, isHoveringEdge, detectEdgeHover]);

  const handleMouseDown = useCallback((e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    
    const task = sortedChartTasks.find(t => t.id === taskId) || taskMapMemo.get(taskId);
    if (!task || !containerRef.current) return;
    
    const currentDragType = task.type === 'milestone' ? 'move' : (() => {
      const edgeType = detectEdgeHover(e, task);
      return edgeType ? `resize-${edgeType}` as 'resize-left' | 'resize-right' : 'move';
    })();
    
    updateDragMetrics(task, dateRange.pixelPerDay);
    startHorizontalDrag(taskId, task, e.clientX, e.clientY, currentDragType, containerRef.current);
  }, [sortedChartTasks, taskMapMemo, detectEdgeHover, updateDragMetrics, dateRange.pixelPerDay, startHorizontalDrag]);

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
    if (isDragging) {
      updateHorizontalDragPosition(e.clientX, CHART_WIDTH, LAYOUT_CONSTANTS.MIN_TASK_WIDTH);
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
    <>
      <div className="gantt-container-wrapper">
        <Toolbar
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
        
        <div className="gantt-container" style={{ 
          ...COMPONENT_STYLES.ganttContainer,
          ...(verticalDragState.isDragging ? COMPONENT_STYLES.draggingContainer : {})
        }}>
        {/* Title Column */}
        <TaskTitleColumn
          tasks={leftPanelTasks}
          selectedTitleTaskId={ganttInteractions.selectedTitleTaskId}
          verticalDragState={verticalDragState}
          titleColumnWidth={titleColumnWidth}
          timelineHeight={timelineHeight}
          taskHeight={taskHeight}
          taskContentHeight={taskContentHeight}
          onTaskSelect={ganttInteractions.setSelectedTitleTaskId}
          onTaskToggle={ganttInteractions.handleToggleExpand}
          onTaskCreateSubtask={ganttInteractions.handleCreateSubtask}
          onTitleMouseDown={handleTitleMouseDown}
          onWidthChange={handleTitleColumnWidthChange}
        />

        {/* Gantt Chart Area */}
        <div 
          ref={containerRef}
          className={`gantt-chart-container ${isDragging ? 'dragging' : ''}`}
          style={{
            ...COMPONENT_STYLES.ganttChartArea,
            width: CHART_WIDTH,
            height: timelineHeight + taskContentHeight,
            ...(isDragging ? COMPONENT_STYLES.draggingContainer : {})
          }}
          onContextMenu={ganttInteractions.handleContextMenu}
        >
          {/* Timeline Header */}
          <TimelineHeader
            timelineHeight={timelineHeight}
            timeScales={timeScales}
            dateToPixel={dateToPixel}
            containerHeight={timelineHeight + taskContentHeight}
          />

          {/* Task Bars */}
          <TaskBars
            chartTaskRows={chartTaskRows}
            taskHeight={taskHeight}
            timelineHeight={timelineHeight}
            draggedTask={draggedTask}
            tempDragPosition={tempDragPosition}
            selectedChartTaskId={selectedChartTaskId}
            isHoveringEdge={isHoveringEdge}
            dateToPixel={dateToPixel}
            isDragging={isDragging}
            onMouseDown={handleMouseDown}
            onTaskSelect={setSelectedChartTaskId}
            onTaskContextMenu={ganttInteractions.handleTaskContextMenu}
            onEdgeHover={handleEdgeHover}
            onMouseLeave={() => setIsHoveringEdge(null)}
          />

        </div>
      </div>
    </div>

    {/* 右键菜单组件 */}
    <GanttContextMenu
      visible={ganttInteractions.contextMenu.visible}
      x={ganttInteractions.contextMenu.x}
      y={ganttInteractions.contextMenu.y}
      onClose={() => ganttInteractions.setContextMenu({ visible: false, x: 0, y: 0, clickPosition: { x: 0, y: 0 } })}
      onCreateTask={handleCreateTask}
      onCreateMilestone={handleCreateMilestone}
      defaultRowId={leftPanelTasks[0]?.id || 'row-0'}
      clickPosition={ganttInteractions.contextMenu.clickPosition}
      pixelToDate={pixelToDate}
    />

    {/* 任务条右键菜单组件 */}
    <TaskContextMenu
      visible={ganttInteractions.taskContextMenu.visible}
      x={ganttInteractions.taskContextMenu.x}
      y={ganttInteractions.taskContextMenu.y}
      taskId={ganttInteractions.taskContextMenu.taskId || undefined}
      task={ganttInteractions.taskContextMenu.taskId ? tasks.find(t => t.id === ganttInteractions.taskContextMenu.taskId) : undefined}
      onClose={() => ganttInteractions.setTaskContextMenu({ visible: false, x: 0, y: 0, taskId: null })}
      onColorChange={handleShowColorPicker}
      onTagManage={handleShowTagManager}
      onDelete={handleTaskDelete}
    />

    {/* 颜色选择器组件 */}
    <ColorPicker
      visible={colorPickerState.visible}
      x={colorPickerState.x}
      y={colorPickerState.y}
      taskId={colorPickerState.taskId}
      currentColor={colorPickerState.currentColor}
      availableColors={availableColors}
      onColorSelect={handleColorChange}
      onClose={() => setColorPickerState({ visible: false, x: 0, y: 0 })}
    />

    {/* 标签管理器组件 */}
    <TagManager
      visible={tagManagerState.visible}
      x={tagManagerState.x}
      y={tagManagerState.y}
      taskId={tagManagerState.taskId}
      task={tagManagerState.task}
      availableTags={availableTags}
      onTagAdd={handleTagAdd}
      onTagRemove={handleTagRemove}
      onClose={() => setTagManagerState({ visible: false, x: 0, y: 0 })}
    />
    </>
  );
}

export default GanttChart;