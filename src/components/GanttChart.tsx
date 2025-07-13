import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Target } from 'lucide-react';
import Toolbar from './Toolbar';
import TaskIcon, { DragHandle } from './TaskIcon';

// 导入新的统一类型定义
import {
  Task,
  ProjectRow,
  VerticalDragState,
  TaskContextMenu,
  ColorPickerState,
  TagManagerState
} from '../types';


interface GanttChartProps {
  startDate?: Date;
  endDate?: Date;
  timelineHeight?: number;
  taskHeight?: number;
}


// --- Project Row Hierarchy Helpers ---

/**
 * 获取可见项目行列表（考虑展开/折叠状态）
 */
const getVisibleProjectRows = (rows: ProjectRow[], rowMap: Map<string, ProjectRow>): ProjectRow[] => {
  const visibleRows: ProjectRow[] = [];
  
  // 检查行是否可见（递归检查所有父行的展开状态）
  const isRowVisible = (row: ProjectRow): boolean => {
    if (!row.parentId) {
      return true; // 根行总是可见
    }
    
    const parentRow = rowMap.get(row.parentId);
    if (!parentRow) {
      return false; // 找不到父行
    }
    
    // 父行必须展开，并且父行本身也必须可见
    return (parentRow.isExpanded || false) && isRowVisible(parentRow);
  };
  
  for (const row of rows) {
    if (isRowVisible(row)) {
      visibleRows.push(row);
    }
  }
  
  return visibleRows;
};

// --- Task Hierarchy Helpers (兼容性) ---

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
 * 递归获取项目行的所有子行（包括子行的子行）
 */
const getAllDescendantRows = (rowId: string, rows: ProjectRow[]): ProjectRow[] => {
  const descendants: ProjectRow[] = [];
  
  const collectDescendants = (parentId: string) => {
    for (const row of rows) {
      if (row.parentId === parentId) {
        descendants.push(row);
        collectDescendants(row.id); // 递归收集子行的子行
      }
    }
  };
  
  collectDescendants(rowId);
  return descendants;
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
  // 新的分离数据结构
  // 1. 项目行结构 - 固定不变的左侧任务列表
  const [projectRows, setProjectRows] = useState<ProjectRow[]>([
    {
      id: 'row-0',
      title: '项目里程碑',
      order: 0,
      type: 'milestone',
      level: 0,
      isExpanded: false
    },
    {
      id: 'row-1',
      title: '交付计划',
      order: 1,
      type: 'delivery',
      level: 0,
      isExpanded: false
    },
    {
      id: 'row-2',
      title: '产品开发',
      order: 2,
      type: 'development',
      level: 0,
      children: ['row-3', 'row-4', 'row-5'],
      isExpanded: true
    },
    {
      id: 'row-3',
      title: 'A样开发',
      order: 3,
      type: 'development',
      level: 1,
      parentId: 'row-2',
      isExpanded: false
    },
    {
      id: 'row-4',
      title: 'B样开发',
      order: 4,
      type: 'development',
      level: 1,
      parentId: 'row-2',
      isExpanded: false
    },
    {
      id: 'row-5',
      title: 'C样开发',
      order: 5,
      type: 'development',
      level: 1,
      parentId: 'row-2',
      isExpanded: false
    },
    {
      id: 'row-6',
      title: '验证计划',
      order: 6,
      type: 'testing',
      level: 0,
      isExpanded: false
    }
  ]);

  // 2. 图表任务 - 右侧绘图区的任务条/节点 (使用统一的Task类型)
  const [chartTasks, setChartTasks] = useState<Task[]>([
    {
      id: 'chart-1',
      title: '项目里程碑',
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      color: '#4CAF50',
      x: 0,
      width: 0,
      rowId: 'row-0',
      type: 'milestone',
      status: 'completed',
      progress: 100
    },
    {
      id: 'chart-2',
      title: '交付计划',
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      color: '#2196F3',
      x: 0,
      width: 0,
      rowId: 'row-1',
      type: 'delivery',
      status: 'in-progress',
      progress: 65
    },
    {
      id: 'chart-3-1',
      title: 'A样开发',
      startDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      color: '#FFB74D',
      x: 0,
      width: 0,
      rowId: 'row-3',
      type: 'development',
      status: 'in-progress',
      progress: 40
    },
    {
      id: 'chart-3-2',
      title: 'B样开发',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
      color: '#FFB74D',
      x: 0,
      width: 0,
      rowId: 'row-4',
      type: 'development',
      status: 'pending',
      progress: 0
    },
    {
      id: 'chart-3-3',
      title: 'C样开发',
      startDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000),
      color: '#FFB74D',
      x: 0,
      width: 0,
      rowId: 'row-5',
      type: 'development',
      status: 'pending',
      progress: 0
    },
    {
      id: 'chart-4',
      title: '验证计划',
      startDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      color: '#f44336',
      x: 0,
      width: 0,
      rowId: 'row-6',
      type: 'testing',
      status: 'pending',
      progress: 0
    }
  ]);

  // 兼容性数据 - 临时保持现有代码工作
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
      isExpanded: false,
      rowId: 'row-0'
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
  const [selectedTitleTaskId, setSelectedTitleTaskId] = useState<string | null>(null); // 左侧任务标题选中状态
  const [selectedChartTaskId, setSelectedChartTaskId] = useState<string | null>(null); // 右侧图表任务选中状态

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

  // 任务条右键菜单状态
  const [taskContextMenu, setTaskContextMenu] = useState<TaskContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    taskId: null
  });

  // 颜色选择器状态
  const [colorPickerState, setColorPickerState] = useState<ColorPickerState>({
    visible: false,
    taskId: null
  });

  // 标签管理器状态
  const [tagManagerState, setTagManagerState] = useState<TagManagerState>({
    visible: false,
    taskId: null,
    newTag: ''
  });

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

  // 新的删除逻辑：分别处理图表任务删除和项目行删除
  const deleteChartTask = useCallback((taskId: string) => {
    setChartTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  // @ts-ignore - 保留以备将来使用
  const deleteProjectRow = useCallback((rowId: string) => {
    setProjectRows(prev => {
      const rowToDelete = prev.find(row => row.id === rowId);
      if (!rowToDelete) return prev;
      
      // 获取所有需要删除的行ID（包括子行）
      const rowsToDelete = new Set<string>();
      
      const collectChildRows = (parentId: string) => {
        rowsToDelete.add(parentId);
        const childRows = prev.filter(row => row.parentId === parentId);
        childRows.forEach(child => collectChildRows(child.id));
      };
      
      collectChildRows(rowId);
      
      // 更新父行的children数组，清理对被删除行的引用
      const updatedRows = prev.map(row => {
        if (row.children && row.children.includes(rowId)) {
          return {
            ...row,
            children: row.children.filter(childId => childId !== rowId)
          };
        }
        return row;
      });
      
      // 删除选中的行和其子行
      return updatedRows.filter(row => !rowsToDelete.has(row.id));
    });

    // 同时删除该行的所有图表任务
    setChartTasks(prev => prev.filter(task => task.rowId !== rowId));
  }, []);

  // 兼容性删除函数：根据任务类型决定删除逻辑
  const deleteTaskCore = useCallback((taskId: string) => {
    // 首先检查是否为图表任务
    const chartTask = chartTasks.find(task => task.id === taskId);
    if (chartTask) {
      deleteChartTask(taskId);
      return;
    }

    // 然后检查是否为项目行
    const projectRow = projectRows.find(row => row.id === taskId);
    if (projectRow) {
      // 注意：根据新需求，删除项目行的任务不应该删除行本身
      // 只删除该行对应的图表任务，保持左侧行结构不变
      setChartTasks(prev => prev.filter(task => task.rowId !== taskId));
      return;
    }

    // 兼容性：处理旧的tasks数据
    setTasks(prev => {
      const taskToDelete = prev.find(task => task.id === taskId);
      if (!taskToDelete) return prev;
      
      // 获取所有需要删除的任务ID（包括子任务）
      const tasksToDelete = new Set<string>();
      
      const collectChildTasks = (parentId: string) => {
        tasksToDelete.add(parentId);
        const childTasks = prev.filter(task => task.parentId === parentId);
        childTasks.forEach(child => collectChildTasks(child.id));
      };
      
      collectChildTasks(taskId);
      
      // 更新父任务的children数组，清理对被删除任务的引用
      const updatedTasks = prev.map(task => {
        if (task.children && task.children.includes(taskId)) {
          return {
            ...task,
            children: task.children.filter(childId => childId !== taskId)
          };
        }
        return task;
      });
      
      // 删除选中的任务和其子任务
      return updatedTasks.filter(task => !tasksToDelete.has(task.id));
    });
  }, [chartTasks, projectRows, deleteChartTask]);

  const handleDeleteTask = useCallback(() => {
    if (selectedTitleTaskId) {
      deleteTaskCore(selectedTitleTaskId);
      setSelectedTitleTaskId(null);
    }
  }, [selectedTitleTaskId, deleteTaskCore]);

  const handleEditTask = useCallback(() => {
    if (selectedTitleTaskId) {
      console.log('编辑任务:', selectedTitleTaskId);
      // TODO: 实现编辑任务功能
    }
  }, [selectedTitleTaskId]);

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
      type: row.type,
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
    return visibleProjectRows.map(row => ({
      rowId: row.id,
      tasks: rowMap.get(row.id)!.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    }));
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

  const pixelToDate = useCallback((pixel: number): Date => {
    const daysPassed = pixel / dateRange.pixelPerDay;
    return new Date(startDate.getTime() + daysPassed * 24 * 60 * 60 * 1000);
  }, [startDate, dateRange.pixelPerDay]);

  // 右键菜单事件处理
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
    console.log('Changing color for task:', taskId, 'to color:', color); // 调试信息
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        console.log('Updated task:', { ...task, color: color }); // 调试信息
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
    let isChartTask = true;
    
    // 如果不是chartTask，查找兼容性task
    if (!task) {
      task = taskMapMemo.get(taskId);
      isChartTask = false;
    }
    
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
    
    // 为chartTask创建适当的metrics
    if (isChartTask) {
      const duration = task.endDate.getTime() - task.startDate.getTime();
      const metrics = {
        duration,
        pixelPerDay: dateRange.pixelPerDay,
        minWidth: Math.max(20, (duration / (24 * 60 * 60 * 1000)) * dateRange.pixelPerDay)
      };
      dragCache.dragMetrics.current = metrics;
    } else {
      dragCache.updateDragMetrics(task, dateRange.pixelPerDay);
    }
    
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
    
    const taskIndex = leftPanelTasks.findIndex(task => task.id === taskId);
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
      leftPanelTasks.length, // 允许拖拽到最后位置
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
              setVerticalDragState({
                isDragging: false,
                draggedTaskId: null,
                draggedTaskIndex: null,
                targetIndex: null,
                startY: 0,
                currentY: 0,
                shouldShowIndicator: false
              });
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
    
    setVerticalDragState({
      isDragging: false,
      draggedTaskId: null,
      draggedTaskIndex: null,
      targetIndex: null,
      startY: 0,
      currentY: 0,
      shouldShowIndicator: false
    });
  }, [verticalDragState, leftPanelTasks]);

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
        const originalRight = (draggedTaskData.x || 0) + (draggedTaskData.width || 0);
        const newLeft = Math.max(0, Math.min(mouseX, originalRight - minWidth));
        const newWidth = originalRight - newLeft;
        
        setTempDragPosition({
          id: draggedTask,
          x: newLeft,
          width: newWidth
        });
      } else if (dragType === 'resize-right') {
        // 拖拽右边界
        const newWidth = Math.max(minWidth, Math.min(mouseX - (draggedTaskData.x || 0), CHART_WIDTH - (draggedTaskData.x || 0)));
        
        setTempDragPosition({
          id: draggedTask,
          x: draggedTaskData.x || 0,
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
    
    setIsDragging(false);
    setDraggedTask(null);
    setDraggedTaskData(null);
    setTempDragPosition(null);
    setDragType(null);
    dragCache.clearCache();
  }, [tempDragPosition, draggedTask, draggedTaskData, dragType, pixelToDate, dragCache, sortedChartTasks]);

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
          onAddSubtask={() => selectedTitleTaskId && handleCreateSubtask(selectedTitleTaskId)}
          canAddSubtask={!!selectedTitleTaskId}
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
            {leftPanelTasks.map((task, index) => {
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
                      cursor: task.isPlaceholder ? 'default' : (verticalDragState.isDragging ? 'grabbing' : 'grab'),
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
                    onMouseDown={(e) => !task.isPlaceholder && handleTitleMouseDown(e, task.id)}
                    onClick={() => !task.isPlaceholder && setSelectedTitleTaskId(task.id)}
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
                    <span 
                      className="task-title-text"
                      style={{ 
                        color: task.isPlaceholder ? '#999' : 'inherit',
                        fontStyle: task.isPlaceholder ? 'italic' : 'normal'
                      }}
                    >
                      {task.title}
                    </span>
                    
                    {/* 创建子任务按钮 - 占位符任务不显示 */}
                    {!task.isPlaceholder && (
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
                    )}
                    
                    {selectedTitleTaskId === task.id && (
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
             verticalDragState.targetIndex === leftPanelTasks.length && 
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
            {chartTaskRows.map((row, rowIndex) => 
              row.tasks.map((chartTask) => {
                // 直接使用rowIndex，因为chartTaskRows已经按照visibleProjectRows的顺序排列
                const index = rowIndex;
                
              const isBeingDragged = draggedTask === chartTask.id;
              const displayX = isBeingDragged && tempDragPosition ? tempDragPosition.x : chartTask.x;
              const displayWidth = isBeingDragged && tempDragPosition ? tempDragPosition.width : chartTask.width;
              const isSelected = selectedChartTaskId === chartTask.id;
              
              // 里程碑节点渲染
              if (chartTask.type === 'milestone') {
                // 里程碑节点基于开始时间定位，不使用任务条宽度
                const milestoneX = isBeingDragged && tempDragPosition ? tempDragPosition.x : dateToPixel(chartTask.startDate);
                return (
                  <div
                    key={chartTask.id}
                    className={`gantt-milestone-node ${isBeingDragged ? 'dragging' : ''} ${isSelected ? 'selected' : ''} status-${chartTask.status}`}
                    style={{
                      left: milestoneX - 8, // 减去图标宽度的一半，让它居中对齐
                      top: index * (taskHeight + 10) + (taskHeight - 16) / 2, // 居中对齐
                    }}
                    onMouseDown={(e) => {
                      if (e.button === 0) { // 只处理左键
                        handleMouseDown(e, chartTask.id);
                      }
                    }}
                    onClick={(e) => {
                      if (e.button === 0) { // 只处理左键点击
                        setSelectedChartTaskId(chartTask.id);
                      }
                    }}
                    onContextMenu={(e) => handleTaskContextMenu(e, chartTask.id)}
                  >
                    <div className="milestone-icon custom-color" style={{ '--custom-milestone-color': chartTask.color } as React.CSSProperties}>
                      <Target size={16} />
                    </div>
                    {/* 显示里程碑标签 */}
                    {chartTask.tags && chartTask.tags.length > 0 && (
                      <div className="milestone-tags">
                        {chartTask.tags.map(tag => (
                          <span key={tag} className="milestone-tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              
              // 普通任务条渲染
              return (
                <div
                  key={chartTask.id}
                  className={`gantt-task-bar custom-color ${isBeingDragged ? 'dragging' : ''} ${isSelected ? 'selected' : ''} status-${chartTask.status} type-${chartTask.type} ${isHoveringEdge ? `edge-hover-${isHoveringEdge}` : ''}`}
                  style={{
                    left: displayX,
                    top: index * (taskHeight + 10),
                    width: displayWidth,
                    height: taskHeight,
                    '--custom-task-color': chartTask.color,
                    cursor: isHoveringEdge === 'left' ? 'w-resize' : isHoveringEdge === 'right' ? 'e-resize' : 'grab'
                  } as React.CSSProperties}
                  onMouseDown={(e) => {
                    if (e.button === 0) { // 只处理左键
                      handleMouseDown(e, chartTask.id);
                    }
                  }}
                  onMouseMove={(e) => handleEdgeHover(e, chartTask)}
                  onMouseLeave={() => {
                    if (!isDragging) {
                      setIsHoveringEdge(null);
                    }
                  }}
                  onClick={(e) => {
                    if (e.button === 0) { // 只处理左键点击
                      setSelectedChartTaskId(chartTask.id);
                    }
                  }}
                  onContextMenu={(e) => handleTaskContextMenu(e, chartTask.id)}
                >
                  {/* 任务内容 */}
                  <div className="gantt-task-content">
                    {/* 显示任务标签 */}
                    {chartTask.tags && chartTask.tags.length > 0 && (
                      <div className="task-tags">
                        {chartTask.tags.map(tag => (
                          <span key={tag} className="task-tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
            )}
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
                 console.log('Color clicked:', color, 'for task:', colorPickerState.taskId); // 调试信息
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
};

export default GanttChart;