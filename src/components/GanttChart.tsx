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
}

interface GanttChartProps {
  startDate?: Date;
  endDate?: Date;
  timelineHeight?: number;
  taskHeight?: number;
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
      width: 0
    },
    {
      id: '2',
      title: '交付计划',
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      color: '#2196F3',
      x: 0,
      width: 0
    },
    {
      id: '3',
      title: '产品开发',
      startDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      color: '#FF9800',
      x: 0,
      width: 0
    },
    {
      id: '4',
      title: '验证计划',
      startDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      color: '#f44336',
      x: 0,
      width: 0
    }
  ]);

  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [tempDragPosition, setTempDragPosition] = useState<{ id: string; x: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [taskMap, setTaskMap] = useState<Map<string, Task>>(new Map());
  const [draggedTaskData, setDraggedTaskData] = useState<Task | null>(null);
  const dragCache = useDragCache();
  const batchedUpdates = useBatchedUpdates();

  const TITLE_COLUMN_WIDTH = 150;
  const CHART_WIDTH = 800;
  const CONTAINER_HEIGHT = 400;

  const dateRange = useMemo(() => {
    const totalDays = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
    const pixelPerDay = CHART_WIDTH / totalDays;
    return { totalDays, pixelPerDay };
  }, [startDate, endDate]);

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
    tasks.forEach(task => {
      newMap.set(task.id, task);
    });
    setTaskMap(newMap);
  }, [tasks]);

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

  return (
    <div className="gantt-container" style={{ display: 'flex', border: '1px solid #ddd', backgroundColor: '#fff' }}>
      {/* Title Column */}
      <div className="title-column" style={{ width: TITLE_COLUMN_WIDTH, borderRight: '1px solid #ddd' }}>
        <div className="title-header" style={{
          height: timelineHeight,
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '10px',
          boxSizing: 'border-box',
          backgroundColor: '#f5f5f5'
        }}>
          <strong>任务</strong>
        </div>
        <div className="task-titles" style={{ paddingTop: '10px' }}>
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className="task-title"
              style={{
                height: taskHeight,
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '10px',
                fontSize: '14px',
              }}
            >
              {task.title}
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
          borderBottom: '1px solid #ddd'
        }}>
          {timeScales.map((scale, index) => (
            <div key={index} style={{
              position: 'absolute',
              left: scale.x,
              top: 0,
              height: '100%',
              borderLeft: '1px solid #ccc',
              paddingLeft: '4px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              color: '#666'
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
              backgroundColor: '#eee',
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
          {tasks.map((task, index) => {
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
                  borderRadius: '4px',
                  cursor: 'grab',
                  boxShadow: isBeingDragged
                    ? '0 4px 8px rgba(0,0,0,0.3)' 
                    : '0 2px 4px rgba(0,0,0,0.1)',
                  transform: isBeingDragged ? `scale(1.02)` : 'scale(1)',
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
          backgroundColor: '#f44336',
          pointerEvents: 'none',
          zIndex: 10
        }} />
      </div>
    </div>
  );
};

export default GanttChart;
