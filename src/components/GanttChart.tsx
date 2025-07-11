import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';

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
      order: 0 // 添加排序字段
    },
    {
      id: '2',
      title: '交付计划',
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      color: '#2196F3',
      x: 0,
      width: 0,
      order: 1 // 添加排序字段
    },
    {
      id: '3',
      title: '产品开发',
      startDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      color: '#FF9800',
      x: 0,
      width: 0,
      order: 2 // 添加排序字段
    },
    {
      id: '4',
      title: '验证计划',
      startDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      color: '#f44336',
      x: 0,
      width: 0,
      order: 3 // 添加排序字段
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

  const TITLE_COLUMN_WIDTH = 180; // Increased width for better spacing
  const CHART_WIDTH = 800;
  const CONTAINER_HEIGHT = 400;

  const dateRange = useMemo(() => {
    const totalDays = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
    const pixelPerDay = CHART_WIDTH / totalDays;
    return { totalDays, pixelPerDay };
  }, [startDate, endDate]);

  // 添加任务排序辅助函数
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => a.order - b.order);
  }, [tasks]);

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
      sortedTasks.length - 1,
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
        
        // 更新所有任务的order
        const sortedTasksCopy = [...sortedTasks];
        const draggedIndex = verticalDragState.draggedTaskIndex!;
        const targetIndex = verticalDragState.targetIndex!;
        
        // 移除被拖拽的任务
        sortedTasksCopy.splice(draggedIndex, 1);
        // 插入到新位置
        sortedTasksCopy.splice(targetIndex, 0, draggedTask);
        
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
            {sortedTasks.map((task, index) => (
              <div key={task.id}>
                {/* 拖拽指示器 - 在目标位置上方显示 */}
                {verticalDragState.isDragging && 
                 verticalDragState.targetIndex === index && 
                 verticalDragState.draggedTaskIndex !== index && (
                  <div style={{
                    height: '2px',
                    backgroundColor: '#2196F3',
                    margin: '0 10px',
                    borderRadius: '1px',
                    boxShadow: '0 0 4px rgba(33, 150, 243, 0.6)',
                    animation: 'pulse 1s infinite' // 添加脉冲动画
                  }} />
                )}
                
                <div
                  className="task-title"
                  style={{
                    ...taskTitleStyle,
                    backgroundColor: verticalDragState.draggedTaskId === task.id ? '#e3f2fd' : 'transparent',
                    opacity: verticalDragState.draggedTaskId === task.id ? 0.7 : 1,
                    cursor: verticalDragState.isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    transform: verticalDragState.draggedTaskId === task.id ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: verticalDragState.draggedTaskId === task.id ? '0 4px 8px rgba(0,0,0,0.15)' : 'none',
                    zIndex: verticalDragState.draggedTaskId === task.id ? 10 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!verticalDragState.isDragging) {
                      e.currentTarget.style.backgroundColor = '#f0f0f0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!verticalDragState.isDragging && verticalDragState.draggedTaskId !== task.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  onMouseDown={(e) => handleTitleMouseDown(e, task.id)}
                >
                  {task.title}
                </div>
                
                {/* 拖拽指示器 - 在最后一个任务下方显示 */}
                {verticalDragState.isDragging && 
                 verticalDragState.targetIndex === sortedTasks.length - 1 && 
                 index === sortedTasks.length - 1 &&
                 verticalDragState.draggedTaskIndex !== sortedTasks.length - 1 && (
                  <div style={{
                    height: '2px',
                    backgroundColor: '#2196F3',
                    margin: '0 10px',
                    borderRadius: '1px',
                    boxShadow: '0 0 4px rgba(33, 150, 243, 0.6)',
                    animation: 'pulse 1s infinite' // 添加脉冲动画
                  }} />
                )}
              </div>
            ))}
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
          <div className="timeline" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: timelineHeight,
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #e0e0e0'
          }}>
            {timeScales.map((scale, index) => (
              <div key={index} style={{
                position: 'absolute',
                left: scale.x,
                top: 0,
                height: '100%',
                borderLeft: '1px solid #e0e0e0',
                paddingLeft: '5px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                color: '#777'
              }}>
                {scale.label}
              </div>
            ))}
          </div>

          {/* Grid Lines */}
          <div className="grid-lines">
            {timeScales.map((scale, index) => (
              <div key={index} style={{
                position: 'absolute',
                left: scale.x,
                top: timelineHeight,
                bottom: 0,
                width: '1px',
                backgroundColor: '#f0f0f0',
                pointerEvents: 'none'
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
            {sortedTasks.map((task, index) => {
              const isBeingDragged = draggedTask === task.id;
              const displayX = isBeingDragged && tempDragPosition ? tempDragPosition.x : task.x;
              const displayWidth = isBeingDragged && tempDragPosition ? tempDragPosition.width : task.width;
              
              return (
                <div
                  key={task.id}
                  className={'task'}
                  style={{
                    position: 'absolute',
                    left: displayX,
                    top: index * (taskHeight + 10),
                    width: displayWidth,
                    height: taskHeight,
                    backgroundColor: task.color,
                    borderRadius: '5px',
                    cursor: 'grab',
                    boxShadow: isBeingDragged
                      ? '0 6px 12px rgba(0,0,0,0.3)' 
                      : '0 2px 5px rgba(0,0,0,0.15)',
                    transform: isBeingDragged ? `scale(1.03)` : 'scale(1)',
                    transition: isBeingDragged ? 'none' : 'box-shadow 0.2s ease, transform 0.2s ease',
                    userSelect: 'none',
                    zIndex: isBeingDragged ? 100 : 1
                  } as React.CSSProperties}
                  onMouseDown={(e) => handleMouseDown(e, task.id)}
                >
                  {/* Title removed from here */}
                </div>
              );
            })}
          </div>

          {/* Current Date Line */}
          <div style={{
            position: 'absolute',
            left: dateToPixel(new Date()),
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: '#e91e63',
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 0 8px rgba(233, 30, 99, 0.7)'
          }} />
        </div>
      </div>
    </>
  );
};

export default GanttChart;