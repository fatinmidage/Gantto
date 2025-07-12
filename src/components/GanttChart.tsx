import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import Toolbar from './Toolbar';
import TaskIcon, { DragHandle } from './TaskIcon';

// Type definitions
interface DragCache {
  containerBounds: DOMRect | null;
  taskData: Task | null;
  dragMetrics: {
    duration: number;
    pixelPerDay: number;
    minWidth: number;
  } | null;
}

interface Task {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  color: string;
  x: number;
  width: number;
  order: number; // 添加排序字段
  type?: 'milestone' | 'development' | 'testing' | 'delivery' | 'default';
  status?: 'pending' | 'in-progress' | 'completed' | 'overdue';
  progress?: number; // 进度百分比 0-100
  // 子任务支持
  parentId?: string; // 父任务ID
  children?: string[]; // 子任务ID数组
  level?: number; // 层级深度，0为根任务
  isExpanded?: boolean; // 是否展开显示子任务
}

interface GanttChartProps {
  startDate?: Date;
  endDate?: Date;
  timelineHeight?: number;
  taskHeight?: number;
}

// 添加垂直拖拽类型
interface VerticalDragState {
  isDragging: boolean;
  draggedTaskId: string | null;
  draggedTaskIndex: number | null;
  targetIndex: number | null;
  startY: number;
  currentY: number;
}

// --- Task Hierarchy Helpers ---

/**
 * 获取任务的所有子任务ID（递归）
 */
const getAllChildrenIds = (task: Task, taskMap: Map<string, Task>): string[] => {
  const allChildren: string[] = [];
  const queue = [...(task.children || [])];
  
  while (queue.length > 0) {
    const childId = queue.shift()!;
    allChildren.push(childId);
    const childTask = taskMap.get(childId);
    if (childTask && childTask.children) {
      queue.push(...childTask.children);
    }
  }
  
  return allChildren;
};

/**
 * 获取可见任务列表（考虑展开/折叠状态）
 */
const getVisibleTasks = (tasks: Task[], taskMap: Map<string, Task>): Task[] => {
  const visibleTasks: Task[] = [];
  
  // 检查任务是否可见（递归检查所有父任务的展开状态）
  const isTaskVisible = (task: Task): boolean => {
    if (!task.parentId) {
      return true; // 根任务总是可见
    }
    
    const parentTask = taskMap.get(task.parentId);
    if (!parentTask) {
      return false; // 找不到父任务
    }
    
    // 父任务必须展开，并且父任务本身也必须可见
    return (parentTask.isExpanded || false) && isTaskVisible(parentTask);
  };
  
  for (const task of tasks) {
    if (isTaskVisible(task)) {
      visibleTasks.push(task);
    }
  }
  
  return visibleTasks;
};

/**
 * 计算父任务的进度（基于子任务）
 */
const calculateParentProgress = (task: Task, taskMap: Map<string, Task>): number => {
  if (!task.children || task.children.length === 0) {
    return task.progress || 0;
  }
  
  let totalProgress = 0;
  let validChildren = 0;
  
  for (const childId of task.children) {
    const childTask = taskMap.get(childId);
    if (childTask) {
      totalProgress += childTask.progress || 0;
      validChildren++;
    }
  }
  
  return validChildren > 0 ? Math.round(totalProgress / validChildren) : 0;
};

// --- Custom Hooks ---

const useThrottledMouseMove = (
  callback: (event: MouseEvent) => void,
  deps: React.DependencyList
) => {
  const requestRef = useRef<number>();
  const throttledCallback = useCallback((event: MouseEvent) => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    requestRef.current = requestAnimationFrame(() => {
      callback(event);
    });
  }, deps);

  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return throttledCallback;
};

const useDragCache = () => {
  const containerBounds = useRef<DOMRect | null>(null);
  const dragMetrics = useRef<{
    duration: number;
    pixelPerDay: number;
    minWidth: number;
  } | null>(null);
  
  const updateContainerBounds = useCallback((element: HTMLElement | null) => {
    if (element) {
      containerBounds.current = element.getBoundingClientRect();
    }
  }, []);

  const updateDragMetrics = useCallback((task: Task, pixelPerDay: number) => {
    if (task) {
      const duration = task.endDate.getTime() - task.startDate.getTime();
      dragMetrics.current = {
        duration,
        pixelPerDay,
        minWidth: Math.max(20, (duration / (24 * 60 * 60 * 1000)) * pixelPerDay)
      };
    }
  }, []);

  const clearCache = useCallback(() => {
    containerBounds.current = null;
    dragMetrics.current = null;
  }, []);

  return {
    containerBounds,
    dragMetrics,
    updateContainerBounds,
    updateDragMetrics,
    clearCache
  };
};

const useBatchedUpdates = () => {
  return useCallback((fn: () => void) => {
    if (typeof (React as any).unstable_batchedUpdates === 'function') {
      (React as any).unstable_batchedUpdates(fn);
    } else {
      fn();
    }
  }, []);
};

// --- GanttChart Component ---

const GanttChart: React.FC<GanttChartProps> = ({
  startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  timelineHeight = 40,
  taskHeight = 30
}) => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: '项目里程碑',
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      color: '#4CAF50',
      x: 0,
      width: 0,
      order: 0,
      type: 'milestone',
      status: 'completed',
      progress: 100,
      level: 0,
      isExpanded: false
    },
    {
      id: '2',
      title: '交付计划',
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      color: '#2196F3',
      x: 0,
      width: 0,
      order: 1,
      type: 'delivery',
      status: 'in-progress',
      progress: 65,
      level: 0,
      isExpanded: false
    },
    {
      id: '3',
      title: '产品开发',
      startDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      color: '#FF9800',
      x: 0,
      width: 0,
      order: 2,
      type: 'development',
      status: 'in-progress',
      progress: 13, // 将根据子任务自动计算：(40 + 0 + 0) / 3 = 13
      level: 0,
      children: ['3-1', '3-2', '3-3'],
      isExpanded: true
    },
    {
      id: '3-1',
      title: 'A样开发',
      startDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      color: '#FFB74D',
      x: 0,
      width: 0,
      order: 3,
      type: 'development',
      status: 'in-progress',
      progress: 40,
      level: 1,
      parentId: '3',
      isExpanded: false
    },
    {
      id: '3-2',
      title: 'B样开发',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
      color: '#FFB74D',
      x: 0,
      width: 0,
      order: 4,
      type: 'development',
      status: 'pending',
      progress: 0,
      level: 1,
      parentId: '3',
      isExpanded: false
    },
    {
      id: '3-3',
      title: 'C样开发',
      startDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000),
      color: '#FFB74D',
      x: 0,
      width: 0,
      order: 5,
      type: 'development',
      status: 'pending',
      progress: 0,
      level: 1,
      parentId: '3',
      isExpanded: false
    },
    {
      id: '4',
      title: '验证计划',
      startDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      color: '#f44336',
      x: 0,
      width: 0,
      order: 6,
      type: 'testing',
      status: 'pending',
      progress: 0,
      level: 0,
      isExpanded: false
    }
  ]);

  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [tempDragPosition, setTempDragPosition] = useState<{ id: string; x: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 添加垂直拖拽状态
  const [verticalDragState, setVerticalDragState] = useState<VerticalDragState>({
    isDragging: false,
    draggedTaskId: null,
    draggedTaskIndex: null,
    targetIndex: null,
    startY: 0,
    currentY: 0
  });

  const [taskMap, setTaskMap] = useState<Map<string, Task>>(new Map());
  const [draggedTaskData, setDraggedTaskData] = useState<Task | null>(null);
  const dragCache = useDragCache();
  const batchedUpdates = useBatchedUpdates();
  
  // 工具栏状态
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentView, setCurrentView] = useState<'timeline' | 'list' | 'grid'>('timeline');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const TITLE_COLUMN_WIDTH = 180; // Increased width for better spacing
  const CHART_WIDTH = 800;
  const CONTAINER_HEIGHT = 400;

  const dateRange = useMemo(() => {
    const totalDays = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
    const pixelPerDay = CHART_WIDTH / totalDays;
    return { totalDays, pixelPerDay };
  }, [startDate, endDate]);

  // 工具栏事件处理函数
  const handleAddTask = useCallback(() => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: '新任务',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      color: '#9C27B0',
      x: 0,
      width: 0,
      order: tasks.length,
      type: 'default',
      status: 'pending'
    };
    setTasks(prev => [...prev, newTask]);
  }, [tasks.length]);

  const handleDeleteTask = useCallback(() => {
    if (selectedTaskId) {
      setTasks(prev => prev.filter(task => task.id !== selectedTaskId));
      setSelectedTaskId(null);
    }
  }, [selectedTaskId]);

  const handleEditTask = useCallback(() => {
    if (selectedTaskId) {
      console.log('编辑任务:', selectedTaskId);
      // TODO: 实现编辑任务功能
    }
  }, [selectedTaskId]);

  const handleViewToday = useCallback(() => {
    console.log('定位到今天');
    // TODO: 实现定位到今天的功能
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.25));
  }, []);

  const handleViewChange = useCallback((view: 'timeline' | 'list' | 'grid') => {
    setCurrentView(view);
  }, []);

  // 处理展开/折叠
  const handleToggleExpand = useCallback((taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, isExpanded: !task.isExpanded }
        : task
    ));
  }, []);

  // 创建子任务
  const handleCreateSubtask = useCallback((parentId: string) => {
    const parentTask = tasks.find(task => task.id === parentId);
    if (!parentTask) return;

    const newSubtask: Task = {
      id: `${parentId}-${Date.now()}`,
      title: '新子任务',
      startDate: new Date(parentTask.startDate),
      endDate: new Date(parentTask.startDate.getTime() + 3 * 24 * 60 * 60 * 1000), // 默认3天
      color: parentTask.color,
      x: 0,
      width: 0,
      order: tasks.length,
      type: parentTask.type,
      status: 'pending',
      progress: 0,
      level: (parentTask.level || 0) + 1,
      parentId: parentId,
      isExpanded: false
    };

    setTasks(prev => {
      const newTasks = [...prev, newSubtask];
      // 更新父任务的children数组
      return newTasks.map(task => {
        if (task.id === parentId) {
          return {
            ...task,
            children: [...(task.children || []), newSubtask.id],
            isExpanded: true // 自动展开父任务
          };
        }
        return task;
      });
    });
  }, [tasks]);

  // 添加任务排序辅助函数
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => a.order - b.order);
  }, [tasks]);

  // 获取可见任务列表（考虑层级展开状态）
  const visibleTasks = useMemo(() => {
    return getVisibleTasks(sortedTasks, taskMap);
  }, [sortedTasks, taskMap]);

  // 自动计算父任务进度
  useEffect(() => {
    const updateParentProgress = () => {
      setTasks(prevTasks => {
        const newTasks = [...prevTasks];
        const taskMap = new Map(newTasks.map(task => [task.id, task]));
        
        // 更新所有有子任务的父任务的进度
        for (const task of newTasks) {
          if (task.children && task.children.length > 0) {
            const calculatedProgress = calculateParentProgress(task, taskMap);
            task.progress = calculatedProgress;
          }
        }
        
        return newTasks;
      });
    };

    updateParentProgress();
  }, [tasks.map(t => t.progress).join(',')]); // 当任何任务的进度发生变化时重新计算

  const dateToPixel = useCallback((date: Date): number => {
    const daysPassed = (date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
    return daysPassed * dateRange.pixelPerDay;
  }, [startDate, dateRange.pixelPerDay]);

  const pixelToDate = useCallback((pixel: number): Date => {
    const daysPassed = pixel / dateRange.pixelPerDay;
    return new Date(startDate.getTime() + daysPassed * 24 * 60 * 60 * 1000);
  }, [startDate, dateRange.pixelPerDay]);

  const updateTaskPositions = useCallback(() => {
    setTasks(prev => prev.map(task => {
      const x = dateToPixel(task.startDate);
      const width = dateToPixel(task.endDate) - x;
      return { ...task, x, width: Math.max(width, 20) };
    }));
  }, [dateToPixel]);

  useEffect(() => {
    const newMap = new Map<string, Task>();
    sortedTasks.forEach(task => {
      newMap.set(task.id, task);
    });
    setTaskMap(newMap);
  }, [sortedTasks]);

  useEffect(() => {
    updateTaskPositions();
  }, [updateTaskPositions]);

  const handleMouseDown = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    const task = taskMap.get(taskId);
    if (!task || !containerRef.current) return;
    
    setDraggedTask(taskId);
    setDraggedTaskData(task);
    setIsDragging(true);
    
    dragCache.updateContainerBounds(containerRef.current);
    dragCache.updateDragMetrics(task, dateRange.pixelPerDay);
    
    const bounds = dragCache.containerBounds.current;
    if (bounds) {
      setDragOffset({
        x: e.clientX - bounds.left - task.x,
        y: e.clientY - bounds.top
      });
    }
  };

  // 添加垂直拖拽事件处理器
  const handleTitleMouseDown = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const taskIndex = sortedTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    
    setVerticalDragState({
      isDragging: true,
      draggedTaskId: taskId,
      draggedTaskIndex: taskIndex,
      targetIndex: taskIndex,
      startY: e.clientY,
      currentY: e.clientY
    });
  };

  const handleTitleMouseMove = useCallback((e: MouseEvent) => {
    if (!verticalDragState.isDragging) return;
    
    const deltaY = e.clientY - verticalDragState.startY;
    const taskHeight = 30 + 10; // taskHeight + margin
    const newTargetIndex = Math.max(0, Math.min(
      sortedTasks.length, // 允许拖拽到最后位置
      verticalDragState.draggedTaskIndex! + Math.round(deltaY / taskHeight)
    ));
    
    setVerticalDragState(prev => ({
      ...prev,
      currentY: e.clientY,
      targetIndex: newTargetIndex
    }));
  }, [verticalDragState.isDragging, verticalDragState.startY, verticalDragState.draggedTaskIndex, sortedTasks.length]);

  const handleTitleMouseUp = useCallback(() => {
    if (!verticalDragState.isDragging) return;
    
    if (verticalDragState.targetIndex !== null && 
        verticalDragState.draggedTaskIndex !== null &&
        verticalDragState.targetIndex !== verticalDragState.draggedTaskIndex) {
      
      // 重新排序任务
      setTasks(prev => {
        const newTasks = [...prev];
        const draggedTask = newTasks.find(t => t.id === verticalDragState.draggedTaskId);
        if (!draggedTask) return prev;
        
        // 获取被拖拽任务的所有子任务（递归）
        const taskMap = new Map<string, Task>();
        newTasks.forEach(task => {
          taskMap.set(task.id, task);
        });
        
        const getAllChildrenIds = (task: Task): string[] => {
          const allChildren: string[] = [];
          const queue = [...(task.children || [])];
          
          while (queue.length > 0) {
            const childId = queue.shift()!;
            allChildren.push(childId);
            const childTask = taskMap.get(childId);
            if (childTask && childTask.children) {
              queue.push(...childTask.children);
            }
          }
          
          return allChildren;
        };
        
        // 获取需要一起移动的所有任务（父任务 + 所有子任务）
        const tasksToMove = [draggedTask.id, ...getAllChildrenIds(draggedTask)];
        
        // 从排序列表中获取所有要移动的任务
        const sortedTasksCopy = [...sortedTasks];
        const tasksToMoveObjects = tasksToMove.map(id => sortedTasksCopy.find(t => t.id === id)).filter(Boolean) as Task[];
        
        // 从原位置移除所有要移动的任务
        for (let i = sortedTasksCopy.length - 1; i >= 0; i--) {
          if (tasksToMove.includes(sortedTasksCopy[i].id)) {
            sortedTasksCopy.splice(i, 1);
          }
        }
        
        const draggedIndex = verticalDragState.draggedTaskIndex!;
        let targetIndex = verticalDragState.targetIndex!;
        
        // 如果目标位置在原位置之后，需要调整目标位置（因为已经移除了一些任务）
        if (targetIndex > draggedIndex) {
          targetIndex = targetIndex - tasksToMoveObjects.length;
        }
        
        // 在新位置插入所有要移动的任务
        if (targetIndex >= sortedTasksCopy.length) {
          // 插入到最后位置
          sortedTasksCopy.push(...tasksToMoveObjects);
        } else {
          // 插入到指定位置
          sortedTasksCopy.splice(targetIndex, 0, ...tasksToMoveObjects);
        }
        
        // 更新order字段
        return newTasks.map(task => {
          const newIndex = sortedTasksCopy.findIndex(t => t.id === task.id);
          return { ...task, order: newIndex };
        });
      });
    }
    
    setVerticalDragState({
      isDragging: false,
      draggedTaskId: null,
      draggedTaskIndex: null,
      targetIndex: null,
      startY: 0,
      currentY: 0
    });
  }, [verticalDragState, sortedTasks]);

  const handleMouseMoveCore = useCallback((e: MouseEvent) => {
    if (!isDragging || !draggedTask || !draggedTaskData) return;

    const bounds = dragCache.containerBounds.current;
    const metrics = dragCache.dragMetrics.current;
    if (!bounds || !metrics) return;

    const newX = e.clientX - bounds.left - dragOffset.x;
    const constrainedX = Math.max(0, Math.min(newX, CHART_WIDTH - 20));
    
    batchedUpdates(() => {
      setTempDragPosition({
        id: draggedTask,
        x: constrainedX,
        width: metrics.minWidth
      });
    });
  }, [isDragging, draggedTask, draggedTaskData, dragOffset, dragCache, batchedUpdates]);

  const handleMouseMove = useThrottledMouseMove(handleMouseMoveCore, [isDragging, draggedTask, draggedTaskData, dragOffset, dragCache]);

  const handleMouseUp = useCallback(() => {
    if (tempDragPosition && draggedTask && draggedTaskData) {
      const newStartDate = pixelToDate(tempDragPosition.x);
      const duration = draggedTaskData.endDate.getTime() - draggedTaskData.startDate.getTime();
      const newEndDate = new Date(newStartDate.getTime() + duration);
      
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
    
    setIsDragging(false);
    setDraggedTask(null);
    setDraggedTaskData(null);
    setTempDragPosition(null);
    dragCache.clearCache();
  }, [tempDragPosition, draggedTask, draggedTaskData, pixelToDate, dragCache]);

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

  const timeScales = useMemo(() => {
    const scales = [];
    const interval = Math.max(1, Math.floor(dateRange.totalDays / 10));
    
    for (let i = 0; i <= dateRange.totalDays; i += interval) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const x = dateToPixel(date);
      scales.push({
        x,
        date,
        label: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      });
    }
    return scales;
  }, [dateRange.totalDays, startDate, dateToPixel]);

  // --- Styles ---
  const titleColumnStyle: React.CSSProperties = {
    width: TITLE_COLUMN_WIDTH,
    borderRight: '1px solid #e0e0e0', // Lighter border
    backgroundColor: '#fafafa', // Light background color
    display: 'flex',
    flexDirection: 'column'
  };

  const titleHeaderStyle: React.CSSProperties = {
    height: timelineHeight,
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px', // Increased padding
    boxSizing: 'border-box',
    backgroundColor: '#f5f5f5',
    color: '#333',
    fontWeight: 600, // Bolder font
    fontSize: '16px'
  };

  const taskTitlesContainerStyle: React.CSSProperties = {
    paddingTop: '10px',
    flex: 1
  };

  const taskTitleStyle: React.CSSProperties = {
    height: taskHeight,
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    fontSize: '14px',
    color: '#555',
    borderBottom: '1px solid #f0f0f0', // Subtle bottom border
    transition: 'all 0.2s ease', // 添加过渡动画
    position: 'relative'
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
            100% {
              opacity: 1;
            }
          }
        `}
      </style>
      
      <div className="gantt-container-wrapper">
        <Toolbar
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
          onViewToday={handleViewToday}
          onViewChange={handleViewChange}
          currentView={currentView}
          zoomLevel={zoomLevel}
          canZoomIn={zoomLevel < 3}
          canZoomOut={zoomLevel > 0.25}
          onAddSubtask={() => selectedTaskId && handleCreateSubtask(selectedTaskId)}
          selectedTaskId={selectedTaskId}
          canAddSubtask={!!selectedTaskId}
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
        <div className="title-column" style={titleColumnStyle}>
          <div className="title-header" style={titleHeaderStyle}>
            <span>任务列表</span>
          </div>
          <div className="task-titles" style={taskTitlesContainerStyle}>
            {visibleTasks.map((task, index) => {
              const isDraggedTask = verticalDragState.draggedTaskId === task.id;
              const isTargetPosition = verticalDragState.isDragging && verticalDragState.targetIndex === index;
              const isDraggingDown = verticalDragState.isDragging && 
                verticalDragState.draggedTaskIndex !== null && 
                verticalDragState.targetIndex !== null &&
                verticalDragState.targetIndex > verticalDragState.draggedTaskIndex;
              
              const hasChildren = task.children && task.children.length > 0;
              const level = task.level || 0;
              const indentWidth = level * 20; // 每级缩进20px
              
              return (
                <div key={task.id}>
                  {/* 拖拽指示器 - 向上拖拽时在目标位置上方显示 */}
                  {isTargetPosition && 
                   !isDraggingDown &&
                   verticalDragState.draggedTaskIndex !== index && (
                    <div style={{
                      height: '2px',
                      backgroundColor: '#2196F3',
                      margin: '0 10px',
                      borderRadius: '1px',
                      boxShadow: '0 0 4px rgba(33, 150, 243, 0.6)',
                      animation: 'pulse 1s infinite'
                    }} />
                  )}
                  
                  <div
                    className="task-title"
                    style={{
                      ...taskTitleStyle,
                      backgroundColor: isDraggedTask ? '#e3f2fd' : 'transparent',
                      opacity: isDraggedTask ? 0.7 : 1,
                      cursor: verticalDragState.isDragging ? 'grabbing' : 'grab',
                      userSelect: 'none',
                      transform: isDraggedTask ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: isDraggedTask ? '0 4px 8px rgba(0,0,0,0.15)' : 'none',
                      zIndex: isDraggedTask ? 10 : 1,
                      paddingLeft: `${20 + indentWidth}px` // 添加层级缩进
                    }}
                    onMouseEnter={(e) => {
                      if (!verticalDragState.isDragging) {
                        e.currentTarget.style.backgroundColor = '#f0f0f0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!verticalDragState.isDragging && !isDraggedTask) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                    onMouseDown={(e) => handleTitleMouseDown(e, task.id)}
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <DragHandle size={14} />
                    
                    {/* 展开/折叠按钮 */}
                    {hasChildren && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleExpand(task.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          marginRight: '4px',
                          fontSize: '12px',
                          color: '#666'
                        }}
                      >
                        {task.isExpanded ? '▼' : '▶'}
                      </button>
                    )}
                    
                    {/* 如果没有子任务，添加占位符保持对齐 */}
                    {!hasChildren && (
                      <div style={{ width: '16px', marginRight: '4px' }} />
                    )}
                    
                    <TaskIcon 
                      type={task.type} 
                      status={task.status} 
                      size={16} 
                      className={`task-icon-${task.type}`}
                      level={task.level}
                    />
                    <span className="task-title-text">{task.title}</span>
                    
                    {/* 创建子任务按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateSubtask(task.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        marginLeft: 'auto',
                        fontSize: '12px',
                        color: '#666',
                        opacity: 0.7,
                        borderRadius: '2px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f0f0';
                        e.currentTarget.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.opacity = '0.7';
                      }}
                      title="创建子任务"
                    >
                      +
                    </button>
                    
                    {selectedTaskId === task.id && (
                      <div className="task-selected-indicator" />
                    )}
                  </div>
                  
                  {/* 拖拽指示器 - 向下拖拽时在目标位置下方显示 */}
                  {isTargetPosition && 
                   isDraggingDown &&
                   verticalDragState.draggedTaskIndex !== index && (
                    <div style={{
                      height: '2px',
                      backgroundColor: '#2196F3',
                      margin: '0 10px',
                      borderRadius: '1px',
                      boxShadow: '0 0 4px rgba(33, 150, 243, 0.6)',
                      animation: 'pulse 1s infinite'
                    }} />
                  )}
                </div>
              );
            })}
            
            {/* 拖拽指示器 - 拖拽到最后位置时显示 */}
            {verticalDragState.isDragging && 
             verticalDragState.targetIndex === visibleTasks.length && (
              <div style={{
                height: '2px',
                backgroundColor: '#2196F3',
                margin: '0 10px',
                borderRadius: '1px',
                boxShadow: '0 0 4px rgba(33, 150, 243, 0.6)',
                animation: 'pulse 1s infinite'
              }} />
            )}
          </div>
        </div>

        {/* Gantt Chart Area */}
        <div 
          ref={containerRef}
          className={`gantt-chart ${isDragging ? 'dragging' : ''}`}
          style={{
            width: CHART_WIDTH,
            height: CONTAINER_HEIGHT,
            position: 'relative',
            cursor: isDragging ? 'grabbing' : 'default'
          }}
        >
          {/* Timeline */}
          <div className="gantt-timeline" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: timelineHeight
          }}>
            {timeScales.map((scale, index) => (
              <div key={index} className="timeline-scale" style={{
                left: scale.x
              }}>
                {scale.label}
              </div>
            ))}
          </div>

          {/* Grid Lines */}
          <div className="gantt-grid-lines">
            {timeScales.map((scale, index) => (
              <div key={index} className="gantt-grid-line" style={{
                left: scale.x,
                top: timelineHeight
              }} />
            ))}
          </div>

          {/* Task Bars */}
          <div className="tasks" style={{
            position: 'absolute',
            top: timelineHeight + 10,
            left: 0,
            right: 0,
            bottom: 0
          }}>
            {visibleTasks.map((task, index) => {
              const isBeingDragged = draggedTask === task.id;
              const displayX = isBeingDragged && tempDragPosition ? tempDragPosition.x : task.x;
              const displayWidth = isBeingDragged && tempDragPosition ? tempDragPosition.width : task.width;
              const isSelected = selectedTaskId === task.id;
              
              return (
                <div
                  key={task.id}
                  className={`gantt-task-bar ${isBeingDragged ? 'dragging' : ''} ${isSelected ? 'selected' : ''} status-${task.status} type-${task.type}`}
                  style={{
                    left: displayX,
                    top: index * (taskHeight + 10),
                    width: displayWidth,
                    height: taskHeight
                  }}
                  onMouseDown={(e) => handleMouseDown(e, task.id)}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  {/* 进度条 */}
                  {task.progress && task.progress > 0 && (
                    <div 
                      className="gantt-task-progress"
                      style={{
                        width: `${task.progress}%`
                      }}
                    />
                  )}
                  
                  {/* 任务内容 */}
                  <div className="gantt-task-content">
                    {task.type === 'milestone' ? '◆' : ''}
                    {task.progress && task.progress > 0 ? `${task.progress}%` : ''}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current Date Line */}
          <div className="gantt-current-date-line" style={{
            left: dateToPixel(new Date())
          }} />
        </div>
      </div>
    </div>
    </>
  );
};

export default GanttChart;