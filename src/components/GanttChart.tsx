import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import Toolbar from './Toolbar';
import TaskTitleColumn from './gantt/TaskTitleColumn';
import TimelineHeader from './gantt/TimelineHeader';
import TaskBars from './gantt/TaskBars';

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
  useGanttInteractions
} from '../hooks';

// 导入层级帮助函数
import {
  getVisibleProjectRows,
  getVisibleTasks,
  getAllDescendantRows
} from './gantt/GanttHelpers';


interface GanttChartProps {
  startDate?: Date;
  endDate?: Date;
  timelineHeight?: number;
  taskHeight?: number;
}




// --- GanttChart Component ---

const GanttChart: React.FC<GanttChartProps> = ({
  startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
    setProjectRows
  });

  const ganttInteractions = useGanttInteractions({
    setTasks,
    setChartTasks,
    setProjectRows,
    deleteTaskCore: ganttEvents.deleteTaskCore,
    projectRows
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

  // 其他状态和配置
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 预定义颜色选项
  const availableColors = [
    '#4CAF50', '#2196F3', '#FF9800', '#f44336', '#9C27B0',
    '#607D8B', '#795548', '#E91E63', '#00BCD4', '#8BC34A',
    '#FFC107', '#FF5722', '#673AB7', '#3F51B5', '#009688'
  ];

  // 可用标签选项
  const [availableTags, setAvailableTags] = useState<string[]>([
    '重要', '紧急', '测试', '开发', '设计', '评审', '部署'
  ]);

  const TITLE_COLUMN_WIDTH = 230;
  const CHART_WIDTH = 800;
  const MIN_CONTAINER_HEIGHT = 200;


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


  // 计算内容高度
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    // 如果任务条右键菜单正在显示，不处理容器右键菜单
    if (taskContextMenu.visible) {
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const chartAreaX = e.clientX - rect.left; // 容器内的相对X坐标
    const chartAreaY = e.clientY - rect.top; // 容器内的相对Y坐标
    
    // 检查是否在时间轴区域内
    const isInTimelineArea = chartAreaY < timelineHeight;
    
    // 在整个甘特图容器区域都可以右键，但点击位置用于创建任务的坐标需要调整
    const taskAreaY = Math.max(0, chartAreaY - timelineHeight);
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      clickPosition: { 
        x: chartAreaX, 
        y: isInTimelineArea ? 0 : taskAreaY // 如果在时间轴区域，任务创建位置设为第一行
      }
    });
  }, [timelineHeight, taskContextMenu.visible]);

  // 隐藏右键菜单
  const hideContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // 创建新任务条 - 现在只影响chartTasks
  const handleCreateTask = useCallback(() => {
    const clickDate = pixelToDate(contextMenu.clickPosition.x);
    
    // 计算点击位置对应的行索引
    const taskRowHeight = taskHeight + 10; // 任务高度 + 间距
    const clickedRowIndex = Math.floor(contextMenu.clickPosition.y / taskRowHeight);
    
    // 获取目标行ID
    let targetRowId: string;
    
    if (clickedRowIndex < leftPanelTasks.length) {
      // 在现有项目行创建图表任务
      const targetRow = leftPanelTasks[clickedRowIndex];
      targetRowId = targetRow.id; // 直接使用项目行ID
    } else {
      // 如果点击在空白区域，使用最后一个项目行
      const lastRow = leftPanelTasks[leftPanelTasks.length - 1];
      targetRowId = lastRow ? lastRow.id : 'row-0';
    }
    
    const newTask: Task = {
      id: `chart-${Date.now()}`,
      title: '新任务',
      startDate: clickDate,
      endDate: new Date(clickDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      color: '#9C27B0',
      x: 0,
      width: 0,
      rowId: targetRowId,
      type: 'default',
      status: 'pending',
      progress: 0,
      children: [],
      level: 0,
      order: Date.now(),
      tags: []
    };
    
    setChartTasks(prev => [...prev, newTask]);
    hideContextMenu();
  }, [contextMenu.clickPosition.x, contextMenu.clickPosition.y, pixelToDate, taskHeight, leftPanelTasks, hideContextMenu]);

  // 创建新节点（里程碑） - 现在只影响chartTasks
  const handleCreateMilestone = useCallback(() => {
    const clickDate = pixelToDate(contextMenu.clickPosition.x);
    
    // 计算点击位置对应的行索引
    const taskRowHeight = taskHeight + 10; // 任务高度 + 间距
    const clickedRowIndex = Math.floor(contextMenu.clickPosition.y / taskRowHeight);
    
    // 获取目标行ID
    let targetRowId: string;
    
    if (clickedRowIndex < leftPanelTasks.length) {
      // 在现有项目行创建里程碑
      const targetRow = leftPanelTasks[clickedRowIndex];
      targetRowId = targetRow.id; // 直接使用项目行ID
    } else {
      // 如果点击在空白区域，使用最后一个项目行
      const lastRow = leftPanelTasks[leftPanelTasks.length - 1];
      targetRowId = lastRow ? lastRow.id : 'row-0';
    }
    
    const newMilestone: Task = {
      id: `milestone-${Date.now()}`,
      title: '新节点',
      startDate: clickDate,
      endDate: clickDate, // 里程碑开始和结束时间相同
      color: '#FF5722',
      x: 0,
      width: 0,
      rowId: targetRowId,
      type: 'milestone',
      status: 'pending',
      progress: 0,
      children: [],
      level: 0,
      order: Date.now(),
      tags: []
    };
    
    setChartTasks(prev => [...prev, newMilestone]);
    hideContextMenu();
  }, [contextMenu.clickPosition.x, contextMenu.clickPosition.y, pixelToDate, taskHeight, leftPanelTasks, hideContextMenu]);

  // 任务条右键菜单事件处理
  const handleTaskContextMenu = useCallback((e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 隐藏容器右键菜单
    hideContextMenu();
    
    setTaskContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      taskId: taskId
    });
  }, [hideContextMenu]);

  // 隐藏任务条右键菜单
  const hideTaskContextMenu = useCallback(() => {
    setTaskContextMenu(prev => ({ ...prev, visible: false, taskId: null }));
  }, []);

  // 更改任务颜色
  const handleColorChange = useCallback((taskId: string, color: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return { ...task, color: color };
      }
      return task;
    }));
    setColorPickerState({ visible: false, taskId: null });
  }, []);

  // 添加标签
  const handleTagAdd = useCallback((taskId: string, tag: string) => {
    if (!tag.trim()) return;
    
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const currentTags = task.tags || [];
        if (!currentTags.includes(tag)) {
          return { ...task, tags: [...currentTags, tag] };
        }
      }
      return task;
    }));
    
    // 将新标签添加到可用标签列表
    if (!availableTags.includes(tag)) {
      setAvailableTags(prev => [...prev, tag]);
    }
  }, [availableTags]);

  // 移除标签
  const handleTagRemove = useCallback((taskId: string, tag: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const currentTags = task.tags || [];
        return { ...task, tags: currentTags.filter(t => t !== tag) };
      }
      return task;
    }));
  }, []);

  // 任务条右键菜单删除任务
  const handleTaskDelete = useCallback((taskId: string) => {
    deleteTaskCore(taskId);
    hideTaskContextMenu();
  }, [deleteTaskCore, hideTaskContextMenu]);

  // 移除自动更新任务位置的useEffect，改为在渲染时计算
  // 避免无限循环：updateTaskPositions -> setTasks -> sortedTasks -> updateTaskPositions

  // 检测是否在任务条边界附近
  const detectEdgeHover = (e: React.MouseEvent, _task: any): 'left' | 'right' | null => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const edgeZone = 8; // 8px边界检测区域
    
    if (mouseX <= edgeZone) {
      return 'left';
    } else if (mouseX >= rect.width - edgeZone) {
      return 'right';
    }
    return null;
  };

  // 简化的边界检测处理器
  const handleEdgeHover = useCallback((e: React.MouseEvent, task: any) => {
    if (!isDragging) {
      const edgeType = detectEdgeHover(e, task);
      if (isHoveringEdge !== edgeType) {
        setIsHoveringEdge(edgeType);
      }
    }
  }, [isDragging, isHoveringEdge]);

  const handleMouseDown = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    
    // 优先查找chartTask
    let task: any = sortedChartTasks.find(t => t.id === taskId);
    
    // 如果不是chartTask，查找兼容性task
    if (!task) {
      task = taskMapMemo.get(taskId);
    }
    
    if (!task || !containerRef.current) return;
    
    // 检测拖拽类型
    // 里程碑始终是移动操作，不支持resize
    const currentDragType = task.type === 'milestone' ? 'move' : (() => {
      const edgeType = detectEdgeHover(e, task);
      return edgeType ? `resize-${edgeType}` as 'resize-left' | 'resize-right' : 'move';
    })();
    
    
    // 更新拖拽度量缓存
    updateDragMetrics(task, dateRange.pixelPerDay);
    
    // 使用 Hook 方法开始水平拖拽
    startHorizontalDrag(
      taskId,
      task,
      e.clientX,
      e.clientY,
      currentDragType,
      containerRef.current
    );
  };

  // 添加垂直拖拽事件处理器
  const handleTitleMouseDown = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const taskIndex = leftPanelTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    
    // 使用 Hook 方法开始垂直拖拽
    startVerticalDrag(taskId, taskIndex, e.clientY);
  };

  const handleTitleMouseMove = useCallback((e: MouseEvent) => {
    if (!verticalDragState.isDragging) return;
    
    // 使用 Hook 方法更新垂直拖拽位置
    updateVerticalDragPosition(
      e.clientY,
      40,                       // 任务行高度 (taskHeight + margin)
      leftPanelTasks.length     // 总任务数
    );
  }, [verticalDragState.isDragging, verticalDragState.startY, verticalDragState.draggedTaskIndex, leftPanelTasks.length]);

  const handleTitleMouseUp = useCallback(() => {
    if (!verticalDragState.isDragging) return;
    
    if (verticalDragState.targetIndex !== null && 
        verticalDragState.draggedTaskIndex !== null &&
        verticalDragState.targetIndex !== verticalDragState.draggedTaskIndex) {
      
      // 重新排序项目行
      setProjectRows(prev => {
        const newRows = [...prev];
        const draggedRowData = leftPanelTasks[verticalDragState.draggedTaskIndex!];
        const targetRowData = verticalDragState.targetIndex! < leftPanelTasks.length 
          ? leftPanelTasks[verticalDragState.targetIndex!]
          : null;
        
        if (!draggedRowData) return prev;
        
        // 找到对应的ProjectRow
        const draggedRow = newRows.find(row => row.id === draggedRowData.id);
        if (!draggedRow) return prev;
        
        // 获取被拖拽行的所有子行
        const draggedDescendants = getAllDescendantRows(draggedRow.id, newRows);
        const allDraggedRows = [draggedRow, ...draggedDescendants];
        
        // 检查子行拖拽限制：子行不能拖拽到父行层级外
        if (draggedRow.parentId) {
          const parentRow = newRows.find(r => r.id === draggedRow.parentId);
          if (parentRow) {
            // 获取父行的所有子行（在左侧面板中的位置）
            const parentDescendants = getAllDescendantRows(parentRow.id, newRows);
            const parentRowIndex = leftPanelTasks.findIndex(t => t.id === parentRow.id);
            const validRange = {
              start: parentRowIndex + 1,
              end: parentRowIndex + parentDescendants.length
            };
            
            // 检查目标位置是否在有效范围内
            if (verticalDragState.targetIndex! < validRange.start || 
                verticalDragState.targetIndex! > validRange.end) {
              // 子行不能拖拽到父行层级外，取消拖拽
              resetVerticalDrag();
              return prev;
            }
          }
        }
        
        // 计算新的order值
        let newOrder: number;
        if (!targetRowData) {
          // 拖拽到最后位置
          const maxOrder = Math.max(...newRows.map(r => r.order));
          newOrder = maxOrder + 1;
        } else {
          const targetRow = newRows.find(row => row.id === targetRowData.id);
          if (!targetRow) return prev;
          
          const targetOrder = targetRow.order;
          if (verticalDragState.targetIndex! > verticalDragState.draggedTaskIndex!) {
            // 向下拖拽，插入到目标行之后
            newOrder = targetOrder + 0.5;
          } else {
            // 向上拖拽，插入到目标行之前
            newOrder = targetOrder - 0.5;
          }
        }
        
        // 计算移动距离
        const orderDelta = newOrder - draggedRow.order;
        
        // 更新被拖拽行及其所有子行的order
        const updatedRows = newRows.map(row => {
          // 检查是否是被拖拽的行或其子行
          const isDraggedOrDescendant = allDraggedRows.some(draggedRow => draggedRow.id === row.id);
          if (isDraggedOrDescendant) {
            return { ...row, order: row.order + orderDelta };
          }
          return row;
        });
        
        // 重新标准化order值（确保是连续的整数）
        const sortedByOrder = [...updatedRows].sort((a, b) => a.order - b.order);
        return sortedByOrder.map((row, index) => ({
          ...row,
          order: index
        }));
      });
    }
    
    // 使用 Hook 方法重置垂直拖拽状态
    resetVerticalDrag();
  }, [verticalDragState, leftPanelTasks]);

  const handleMouseMoveCore = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    // 使用 Hook 方法更新水平拖拽位置
    updateHorizontalDragPosition(
      e.clientX,
      CHART_WIDTH,  // 图表宽度
      20            // 最小宽度
    );
  }, [isDragging, updateHorizontalDragPosition]);

  const handleMouseMove = useThrottledMouseMove(handleMouseMoveCore, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (tempDragPosition && draggedTask && draggedTaskData && dragType) {
      let newStartDate: Date;
      let newEndDate: Date;
      
      if (dragType === 'move') {
        // 移动任务条：保持时间段长度，改变开始和结束时间
        newStartDate = pixelToDate(tempDragPosition.x);
        if (draggedTaskData.type === 'milestone') {
          // 里程碑只更新开始时间，结束时间保持与开始时间相同
          newEndDate = newStartDate;
        } else {
          // 普通任务保持时间段长度
          const duration = draggedTaskData.endDate.getTime() - draggedTaskData.startDate.getTime();
          newEndDate = new Date(newStartDate.getTime() + duration);
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
        return; // 未知的拖拽类型
      }
      
      // 优先更新chartTasks
      const isChartTask = sortedChartTasks.find(t => t.id === draggedTask);
      
      if (isChartTask) {
        setChartTasks(prev => prev.map(task => {
          if (task.id === draggedTask) {
            return {
              ...task,
              startDate: newStartDate,
              endDate: newEndDate
            };
          }
          return task;
        }));
      } else {
        // 兼容性：更新旧的tasks数据
        setTasks(prev => prev.map(m => {
          if (m.id === draggedTask) {
            return {
              ...m,
              startDate: newStartDate,
              endDate: newEndDate,
              x: tempDragPosition.x,
              width: tempDragPosition.width
            };
          }
          return m;
        }));
      }
    }
    
    // 使用 Hook 方法重置拖拽状态
    resetHorizontalDrag();
  }, [tempDragPosition, draggedTask, draggedTaskData, dragType, pixelToDate, resetHorizontalDrag, sortedChartTasks]);

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

  // 监听全局点击事件，隐藏右键菜单
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        hideContextMenu();
      }
      if (taskContextMenu.visible) {
        hideTaskContextMenu();
      }
      if (colorPickerState.visible) {
        setColorPickerState({ visible: false, taskId: null });
      }
      if (tagManagerState.visible) {
        setTagManagerState({ visible: false, taskId: null, newTag: '' });
      }
    };

    if (contextMenu.visible || taskContextMenu.visible || colorPickerState.visible || tagManagerState.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.visible, taskContextMenu.visible, colorPickerState.visible, tagManagerState.visible, hideContextMenu, hideTaskContextMenu]);


  // --- Chart Area Styles ---

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
          onViewChange={ganttInteractions.handleViewChange}
          currentView={ganttInteractions.currentView}
          zoomLevel={zoomLevel}
          canZoomIn={zoomLevel < 3}
          canZoomOut={zoomLevel > 0.25}
          onAddSubtask={() => ganttInteractions.selectedTitleTaskId && ganttInteractions.handleCreateSubtask(ganttInteractions.selectedTitleTaskId)}
          canAddSubtask={!!ganttInteractions.selectedTitleTaskId}
        />
        
        <div className="gantt-container" style={{ 
          display: 'flex', 
          border: '1px solid #ddd', 
          backgroundColor: '#fff', 
          borderRadius: '8px', 
          overflow: 'hidden',
          cursor: verticalDragState.isDragging ? 'grabbing' : 'default' // 添加全局拖拽光标
        }}>
        {/* Title Column */}
        <TaskTitleColumn
          tasks={leftPanelTasks}
          selectedTitleTaskId={ganttInteractions.selectedTitleTaskId}
          verticalDragState={verticalDragState}
          titleColumnWidth={TITLE_COLUMN_WIDTH}
          timelineHeight={timelineHeight}
          taskHeight={taskHeight}
          taskContentHeight={taskContentHeight}
          onTaskSelect={ganttInteractions.setSelectedTitleTaskId}
          onTaskToggle={ganttInteractions.handleToggleExpand}
          onTaskCreateSubtask={ganttInteractions.handleCreateSubtask}
          onTitleMouseDown={handleTitleMouseDown}
        />

        {/* Gantt Chart Area */}
        <div 
          ref={containerRef}
          className={`gantt-chart-container ${isDragging ? 'dragging' : ''}`}
          style={{
            width: CHART_WIDTH,
            height: timelineHeight + taskContentHeight,
            position: 'relative',
            cursor: isDragging ? 'grabbing' : 'default',
            backgroundColor: 'transparent',
            overflow: 'hidden'
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

    {/* 右键菜单 */}
    {ganttInteractions.contextMenu.visible && (
      <div
        style={{
          position: 'fixed',
          top: ganttInteractions.contextMenu.y,
          left: ganttInteractions.contextMenu.x,
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          minWidth: '150px'
        }}
      >
        <div
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            borderBottom: '1px solid #eee'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={() => {
            // 简化版创建任务逻辑
            const newTask: Task = {
              id: `chart-${Date.now()}`,
              title: '新任务',
              startDate: new Date(),
              endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              color: '#9C27B0',
              x: 0,
              width: 0,
              rowId: leftPanelTasks[0]?.id || 'row-0',
              type: 'default',
              status: 'pending',
              progress: 0
            };
            setChartTasks(prev => [...prev, newTask]);
            ganttInteractions.setContextMenu({ visible: false, x: 0, y: 0 });
          }}
        >
          新建任务条
        </div>
        <div
          style={{
            padding: '8px 16px',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={() => {
            // 简化版创建里程碑逻辑
            const newMilestone: Task = {
              id: `milestone-${Date.now()}`,
              title: '新里程碑',
              startDate: new Date(),
              endDate: new Date(),
              color: '#FFD700',
              x: 0,
              width: 0,
              rowId: leftPanelTasks[0]?.id || 'row-0',
              type: 'milestone',
              status: 'pending',
              progress: 0
            };
            setChartTasks(prev => [...prev, newMilestone]);
            ganttInteractions.setContextMenu({ visible: false, x: 0, y: 0 });
          }}
        >
          新建节点
        </div>
      </div>
    )}

    {/* 任务条右键菜单 */}
    {taskContextMenu.visible && (
      <div
        className="task-context-menu"
        style={{
          position: 'fixed',
          top: taskContextMenu.y,
          left: taskContextMenu.x,
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          minWidth: '160px',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="menu-item"
          style={{
            padding: '10px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid #eee',
            fontSize: '14px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={() => {
            setColorPickerState({ visible: true, taskId: taskContextMenu.taskId });
            hideTaskContextMenu();
          }}
        >
          <div style={{ width: '16px', height: '16px', backgroundColor: '#4CAF50', borderRadius: '50%' }} />
          更改颜色
        </div>
        <div
          className="menu-item"
          style={{
            padding: '10px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid #eee',
            fontSize: '14px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={() => {
            setTagManagerState({ visible: true, taskId: taskContextMenu.taskId, newTag: '' });
            hideTaskContextMenu();
          }}
        >
          <span style={{ fontSize: '12px' }}>🏷️</span>
          管理标签
        </div>
        <div
          className="menu-item"
          style={{
            padding: '10px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: '#f44336'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ffebee';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={() => {
            if (taskContextMenu.taskId) {
              handleTaskDelete(taskContextMenu.taskId);
            }
          }}
        >
          <span style={{ fontSize: '12px' }}>🗑️</span>
          删除任务
        </div>
      </div>
    )}

    {/* 颜色选择器 */}
    {colorPickerState.visible && (
      <div
        className="color-picker-panel"
        style={{
          position: 'fixed',
          top: taskContextMenu.y,
          left: taskContextMenu.x + 180,
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1001,
          padding: '16px',
          minWidth: '200px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '500' }}>选择颜色</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          {availableColors.map(color => (
            <div
              key={color}
              className="color-option"
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: color,
                borderRadius: '6px',
                cursor: 'pointer',
                border: '2px solid transparent',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = '2px solid #333';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = '2px solid transparent';
                e.currentTarget.style.transform = 'scale(1)';
              }}
                             onClick={() => {
                 if (colorPickerState.taskId) {
                   handleColorChange(colorPickerState.taskId, color);
                 }
               }}
            />
          ))}
        </div>
      </div>
    )}

    {/* 标签管理器 */}
    {tagManagerState.visible && (
      <div
        className="tag-manager-panel"
        style={{
          position: 'fixed',
          top: taskContextMenu.y,
          left: taskContextMenu.x + 180,
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1001,
          padding: '16px',
          minWidth: '250px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '500' }}>管理标签</div>
        
        {/* 当前任务的标签 */}
        {tagManagerState.taskId && (() => {
          const currentTask = tasks.find(task => task.id === tagManagerState.taskId);
          const currentTags = currentTask?.tags || [];
          
          return (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>当前标签：</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {currentTags.length > 0 ? (
                  currentTags.map(tag => (
                    <span
                      key={tag}
                      className="tag-item"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 8px',
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        borderRadius: '12px',
                        fontSize: '12px',
                        gap: '4px'
                      }}
                    >
                      {tag}
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#1976d2',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '0'
                        }}
                        onClick={() => {
                          if (tagManagerState.taskId) {
                            handleTagRemove(tagManagerState.taskId, tag);
                          }
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span style={{ color: '#999', fontSize: '12px' }}>无标签</span>
                )}
              </div>
            </div>
          );
        })()}
        
        {/* 添加新标签 */}
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="输入新标签..."
            value={tagManagerState.newTag}
            onChange={(e) => setTagManagerState(prev => ({ ...prev, newTag: e.target.value }))}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && tagManagerState.taskId) {
                handleTagAdd(tagManagerState.taskId, tagManagerState.newTag);
                setTagManagerState(prev => ({ ...prev, newTag: '' }));
              }
            }}
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          />
          <button
            style={{
              marginTop: '6px',
              padding: '6px 12px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
            onClick={() => {
              if (tagManagerState.taskId && tagManagerState.newTag) {
                handleTagAdd(tagManagerState.taskId, tagManagerState.newTag);
                setTagManagerState(prev => ({ ...prev, newTag: '' }));
              }
            }}
          >
            添加标签
          </button>
        </div>
        
        {/* 可用标签 */}
        <div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>快速添加：</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {availableTags.map(tag => (
              <span
                key={tag}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#f5f5f5',
                  color: '#333',
                  borderRadius: '12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  border: '1px solid #ddd'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e0e0e0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onClick={() => {
                  if (tagManagerState.taskId) {
                    handleTagAdd(tagManagerState.taskId, tag);
                  }
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default GanttChart;