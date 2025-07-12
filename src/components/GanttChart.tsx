import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Target } from 'lucide-react';
import Toolbar from './Toolbar';
import TaskIcon, { DragHandle } from './TaskIcon';

// Type definitions
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
  shouldShowIndicator: boolean; // 是否应该显示提示线
}

// --- Task Hierarchy Helpers ---

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
      endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
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
    currentY: 0,
    shouldShowIndicator: false
  });

  const [draggedTaskData, setDraggedTaskData] = useState<Task | null>(null);
  
  // 边界拖拽状态
  const [dragType, setDragType] = useState<'move' | 'resize-left' | 'resize-right' | null>(null);
  const [isHoveringEdge, setIsHoveringEdge] = useState<'left' | 'right' | null>(null);
  
  const dragCache = useDragCache();
  const batchedUpdates = useBatchedUpdates();
  
  // 工具栏状态
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentView, setCurrentView] = useState<'timeline' | 'list' | 'grid'>('timeline');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // 右键菜单状态
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

  const TITLE_COLUMN_WIDTH = 230; // Increased width for better spacing
  const CHART_WIDTH = 800;
  const MIN_CONTAINER_HEIGHT = 200; // 最小高度

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

  const dateToPixel = useCallback((date: Date): number => {
    const daysPassed = (date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
    return daysPassed * dateRange.pixelPerDay;
  }, [startDate, dateRange.pixelPerDay]);

  // 添加任务排序辅助函数，同时计算位置信息
  const sortedTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => a.order - b.order)
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

  // 获取可见任务列表（考虑层级展开状态）
  const visibleTasks = useMemo(() => {
    return getVisibleTasks(sortedTasks, taskMapMemo);
  }, [sortedTasks, taskMapMemo]);

  // 计算容器高度：根据可见任务数量动态调整
  const containerHeight = useMemo(() => {
    const taskRowHeight = taskHeight + 10; // 任务高度 + 间距
    const calculatedHeight = visibleTasks.length * taskRowHeight + 20; // 额外20px留白
    return Math.max(MIN_CONTAINER_HEIGHT, calculatedHeight);
  }, [visibleTasks.length, taskHeight]);

  // 计算任务内容区域高度（不包含时间轴）
  const taskContentHeight = useMemo(() => {
    return containerHeight; // 左侧任务列表区域的内容高度
  }, [containerHeight]);

  const pixelToDate = useCallback((pixel: number): Date => {
    const daysPassed = pixel / dateRange.pixelPerDay;
    return new Date(startDate.getTime() + daysPassed * 24 * 60 * 60 * 1000);
  }, [startDate, dateRange.pixelPerDay]);

  // 右键菜单事件处理
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
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
  }, [timelineHeight]);

  // 隐藏右键菜单
  const hideContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // 创建新任务条
  const handleCreateTask = useCallback(() => {
    const clickDate = pixelToDate(contextMenu.clickPosition.x);
    const newTask: Task = {
      id: Date.now().toString(),
      title: '新任务',
      startDate: clickDate,
      endDate: new Date(clickDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 默认7天
      color: '#9C27B0',
      x: 0,
      width: 0,
      order: tasks.length,
      type: 'default',
      status: 'pending'
    };
    setTasks(prev => [...prev, newTask]);
    hideContextMenu();
  }, [contextMenu.clickPosition.x, pixelToDate, tasks.length, hideContextMenu]);

  // 创建新节点（里程碑）
  const handleCreateMilestone = useCallback(() => {
    const clickDate = pixelToDate(contextMenu.clickPosition.x);
    const newMilestone: Task = {
      id: Date.now().toString(),
      title: '新节点',
      startDate: clickDate,
      endDate: clickDate, // 里程碑开始和结束时间相同
      color: '#FF5722',
      x: 0,
      width: 0,
      order: tasks.length,
      type: 'milestone',
      status: 'pending'
    };
    setTasks(prev => [...prev, newMilestone]);
    hideContextMenu();
  }, [contextMenu.clickPosition.x, pixelToDate, tasks.length, hideContextMenu]);

  // 移除自动更新任务位置的useEffect，改为在渲染时计算
  // 避免无限循环：updateTaskPositions -> setTasks -> sortedTasks -> updateTaskPositions

  // 检测是否在任务条边界附近
  const detectEdgeHover = (e: React.MouseEvent, _task: Task): 'left' | 'right' | null => {
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
  const handleEdgeHover = useCallback((e: React.MouseEvent, task: Task) => {
    if (!isDragging) {
      const edgeType = detectEdgeHover(e, task);
      if (isHoveringEdge !== edgeType) {
        setIsHoveringEdge(edgeType);
      }
    }
  }, [isDragging, isHoveringEdge]);

  const handleMouseDown = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    const task = taskMapMemo.get(taskId);
    if (!task || !containerRef.current) return;
    
    // 检测拖拽类型
    // 里程碑始终是移动操作，不支持resize
    const currentDragType = task.type === 'milestone' ? 'move' : (() => {
      const edgeType = detectEdgeHover(e, task);
      return edgeType ? `resize-${edgeType}` as 'resize-left' | 'resize-right' : 'move';
    })();
    
    setDraggedTask(taskId);
    setDraggedTaskData(task);
    setIsDragging(true);
    setDragType(currentDragType);
    
    dragCache.updateContainerBounds(containerRef.current);
    dragCache.updateDragMetrics(task, dateRange.pixelPerDay);
    
    const bounds = dragCache.containerBounds.current;
    if (bounds) {
      // 对里程碑使用正确的位置计算
      const taskX = task.type === 'milestone' ? dateToPixel(task.startDate) : task.x;
      setDragOffset({
        x: e.clientX - bounds.left - taskX,
        y: e.clientY - bounds.top
      });
    }
  };

  // 添加垂直拖拽事件处理器
  const handleTitleMouseDown = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const taskIndex = visibleTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    
    setVerticalDragState({
      isDragging: true,
      draggedTaskId: taskId,
      draggedTaskIndex: taskIndex,
      targetIndex: taskIndex,
      startY: e.clientY,
      currentY: e.clientY,
      shouldShowIndicator: false
    });
  };

  const handleTitleMouseMove = useCallback((e: MouseEvent) => {
    if (!verticalDragState.isDragging) return;
    
    const deltaY = e.clientY - verticalDragState.startY;
    const taskHeight = 30 + 10; // taskHeight + margin
    const newTargetIndex = Math.max(0, Math.min(
      visibleTasks.length, // 允许拖拽到最后位置
      verticalDragState.draggedTaskIndex! + Math.floor(deltaY / taskHeight + 0.5)
    ));
    
    // 计算拖拽距离是否超过0.8行
    const dragDistance = Math.abs(deltaY / taskHeight);
    const shouldShowIndicator = dragDistance >= 0.8 && newTargetIndex !== verticalDragState.draggedTaskIndex;
    
    setVerticalDragState(prev => ({
      ...prev,
      currentY: e.clientY,
      targetIndex: newTargetIndex,
      shouldShowIndicator
    }));
  }, [verticalDragState.isDragging, verticalDragState.startY, verticalDragState.draggedTaskIndex, visibleTasks.length]);

  const handleTitleMouseUp = useCallback(() => {
    if (!verticalDragState.isDragging) return;
    
    if (verticalDragState.targetIndex !== null && 
        verticalDragState.draggedTaskIndex !== null &&
        verticalDragState.targetIndex !== verticalDragState.draggedTaskIndex) {
      
      // 重新排序任务
      setTasks(prev => {
        const newTasks = [...prev];
        const draggedTask = visibleTasks[verticalDragState.draggedTaskIndex!];
        const targetTask = verticalDragState.targetIndex! < visibleTasks.length 
          ? visibleTasks[verticalDragState.targetIndex!]
          : null;
        
        if (!draggedTask) return prev;
        
        // 计算新的order值
        let newOrder: number;
        if (!targetTask) {
          // 拖拽到最后位置
          const maxOrder = Math.max(...newTasks.map(t => t.order));
          newOrder = maxOrder + 1;
        } else {
          const targetOrder = targetTask.order;
          if (verticalDragState.targetIndex! > verticalDragState.draggedTaskIndex!) {
            // 向下拖拽，插入到目标任务之后
            newOrder = targetOrder + 0.5;
          } else {
            // 向上拖拽，插入到目标任务之前
            newOrder = targetOrder - 0.5;
          }
        }
        
        // 更新被拖拽任务的order
        const updatedTasks = newTasks.map(task => {
          if (task.id === draggedTask.id) {
            return { ...task, order: newOrder };
          }
          return task;
        });
        
        // 重新标准化order值（确保是连续的整数）
        const sortedByOrder = [...updatedTasks].sort((a, b) => a.order - b.order);
        return sortedByOrder.map((task, index) => ({
          ...task,
          order: index
        }));
      });
    }
    
    setVerticalDragState({
      isDragging: false,
      draggedTaskId: null,
      draggedTaskIndex: null,
      targetIndex: null,
      startY: 0,
      currentY: 0,
      shouldShowIndicator: false
    });
  }, [verticalDragState, visibleTasks]);

  const handleMouseMoveCore = useCallback((e: MouseEvent) => {
    if (!isDragging || !draggedTask || !draggedTaskData || !dragType) return;

    const bounds = dragCache.containerBounds.current;
    const metrics = dragCache.dragMetrics.current;
    if (!bounds || !metrics) return;

    const mouseX = e.clientX - bounds.left;
    const minWidth = 20; // 最小任务条宽度
    
    batchedUpdates(() => {
      if (dragType === 'move') {
        // 移动整个任务条
        const newX = mouseX - dragOffset.x;
        // 里程碑可以拖拽到整个时间线范围，普通任务需要保留最小宽度空间
        const maxX = draggedTaskData.type === 'milestone' ? CHART_WIDTH : CHART_WIDTH - metrics.minWidth;
        const constrainedX = Math.max(0, Math.min(newX, maxX));
        
        setTempDragPosition({
          id: draggedTask,
          x: constrainedX,
          width: metrics.minWidth
        });
      } else if (dragType === 'resize-left') {
        // 拖拽左边界
        const originalRight = draggedTaskData.x + draggedTaskData.width;
        const newLeft = Math.max(0, Math.min(mouseX, originalRight - minWidth));
        const newWidth = originalRight - newLeft;
        
        setTempDragPosition({
          id: draggedTask,
          x: newLeft,
          width: newWidth
        });
      } else if (dragType === 'resize-right') {
        // 拖拽右边界
        const newWidth = Math.max(minWidth, Math.min(mouseX - draggedTaskData.x, CHART_WIDTH - draggedTaskData.x));
        
        setTempDragPosition({
          id: draggedTask,
          x: draggedTaskData.x,
          width: newWidth
        });
      }
    });
  }, [isDragging, draggedTask, draggedTaskData, dragType, dragOffset, dragCache, batchedUpdates]);

  const handleMouseMove = useThrottledMouseMove(handleMouseMoveCore, [isDragging, draggedTask, draggedTaskData, dragOffset, dragCache]);

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
    setDragType(null);
    dragCache.clearCache();
  }, [tempDragPosition, draggedTask, draggedTaskData, dragType, pixelToDate, dragCache]);

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
    };

    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.visible, hideContextMenu]);

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
    height: taskContentHeight,
    overflow: 'auto' // 添加滚动条以防内容超出
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
              const isTargetPosition = verticalDragState.isDragging && verticalDragState.targetIndex === index && verticalDragState.shouldShowIndicator;
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
                    }} />
                  )}
                </div>
              );
            })}
            
            {/* 拖拽指示器 - 拖拽到最后位置时显示 */}
            {verticalDragState.isDragging && 
             verticalDragState.targetIndex === visibleTasks.length && 
             verticalDragState.shouldShowIndicator && (
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
            height: timelineHeight + taskContentHeight,
            position: 'relative',
            cursor: isDragging ? 'grabbing' : 'default'
          }}
          onContextMenu={handleContextMenu}
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
              
              // 里程碑节点渲染
              if (task.type === 'milestone') {
                // 里程碑节点基于开始时间定位，不使用任务条宽度
                const milestoneX = isBeingDragged && tempDragPosition ? tempDragPosition.x : dateToPixel(task.startDate);
                return (
                  <div
                    key={task.id}
                    className={`gantt-milestone-node ${isBeingDragged ? 'dragging' : ''} ${isSelected ? 'selected' : ''} status-${task.status}`}
                    style={{
                      left: milestoneX - 8, // 减去图标宽度的一半，让它居中对齐
                      top: index * (taskHeight + 10) + (taskHeight - 16) / 2, // 居中对齐
                    }}
                    onMouseDown={(e) => handleMouseDown(e, task.id)}
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <div className="milestone-icon">
                      <Target size={16} />
                    </div>
                  </div>
                );
              }
              
              // 普通任务条渲染
              return (
                <div
                  key={task.id}
                  className={`gantt-task-bar ${isBeingDragged ? 'dragging' : ''} ${isSelected ? 'selected' : ''} status-${task.status} type-${task.type} ${isHoveringEdge ? `edge-hover-${isHoveringEdge}` : ''}`}
                  style={{
                    left: displayX,
                    top: index * (taskHeight + 10),
                    width: displayWidth,
                    height: taskHeight,
                    cursor: isHoveringEdge === 'left' ? 'w-resize' : isHoveringEdge === 'right' ? 'e-resize' : 'grab'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, task.id)}
                  onMouseMove={(e) => handleEdgeHover(e, task)}
                  onMouseLeave={() => {
                    if (!isDragging) {
                      setIsHoveringEdge(null);
                    }
                  }}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  {/* 任务内容 */}
                  <div className="gantt-task-content">
                    {/* 移除里程碑的 ◆ 符号，因为现在使用独立节点 */}
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

    {/* 右键菜单 */}
    {contextMenu.visible && (
      <div
        style={{
          position: 'fixed',
          top: contextMenu.y,
          left: contextMenu.x,
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
          onClick={handleCreateTask}
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
          onClick={handleCreateMilestone}
        >
          新建节点
        </div>
      </div>
    )}
    </>
  );
};

export default GanttChart;