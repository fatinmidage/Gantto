import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';

// 新增类型定义
interface DragCache {
  containerBounds: DOMRect | null;
  milestoneData: Milestone | null;
  dragMetrics: {
    duration: number;
    pixelPerDay: number;
    minWidth: number;
  } | null;
}

interface Milestone {
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
  milestoneHeight?: number;
}

// 新增节流Hook
const useThrottledMouseMove = (
  callback: (event: MouseEvent) => void,
  deps: React.DependencyList
) => {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  
  const throttledCallback = useCallback((event: MouseEvent) => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    
    requestRef.current = requestAnimationFrame(() => {
      callback(event);
    });
  }, deps);

  React.useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return throttledCallback;
};

// 新增缓存Hook
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

  const updateDragMetrics = useCallback((milestone: Milestone, pixelPerDay: number) => {
    if (milestone) {
      const duration = milestone.endDate.getTime() - milestone.startDate.getTime();
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

// 新增防抖Hook
const useDebouncedUpdate = <T,>(
  value: T,
  delay: number,
  immediate: boolean = false
): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    if (immediate) {
      setDebouncedValue(value);
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, immediate]);

  return debouncedValue;
};

// 新增批量更新Hook
const useBatchedUpdates = () => {
  const batchedUpdates = useCallback((fn: () => void) => {
    // 使用React的unstable_batchedUpdates或者简单的setTimeout
    if (typeof (React as any).unstable_batchedUpdates === 'function') {
      (React as any).unstable_batchedUpdates(fn);
    } else {
      fn();
    }
  }, []);

  return batchedUpdates;
};

// 新增性能监控Hook
const usePerformanceMonitor = () => {
  const frameTimeRef = useRef<number[]>([]);
  const [performanceMode, setPerformanceMode] = useState<'high' | 'medium' | 'low'>('high');
  
  const measureFrameTime = useCallback(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const frameTime = endTime - startTime;
      
      frameTimeRef.current.push(frameTime);
      
      // 保持最近20帧的数据
      if (frameTimeRef.current.length > 20) {
        frameTimeRef.current.shift();
      }
      
      // 计算平均帧时间
      const avgFrameTime = frameTimeRef.current.reduce((sum, time) => sum + time, 0) / frameTimeRef.current.length;
      
      // 自动调整性能模式
      if (avgFrameTime > 16.67) { // 低于60fps
        setPerformanceMode('low');
      } else if (avgFrameTime > 8.33) { // 低于120fps
        setPerformanceMode('medium');
      } else {
        setPerformanceMode('high');
      }
    };
  }, []);
  
  return { performanceMode, measureFrameTime };
};

// 新增错误边界Hook
const useErrorBoundary = () => {
  const [hasError, setHasError] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  
  const resetError = useCallback(() => {
    setHasError(false);
    setFallbackMode(false);
  }, []);
  
  const handleError = useCallback((error: Error) => {
    console.warn('甘特图拖拽优化出错，启用回退模式:', error);
    setHasError(true);
    setFallbackMode(true);
  }, []);
  
  return { hasError, fallbackMode, resetError, handleError };
};

const GanttChart: React.FC<GanttChartProps> = ({
  startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
  endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
  timelineHeight = 40,
  milestoneHeight = 30
}) => {
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: '1',
      title: '项目启动',
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      color: '#4CAF50',
      x: 0,
      width: 0
    },
    {
      id: '2',
      title: '开发阶段',
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      color: '#2196F3',
      x: 0,
      width: 0
    },
    {
      id: '3',
      title: '测试阶段',
      startDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      color: '#FF9800',
      x: 0,
      width: 0
    }
  ]);

  const [draggedMilestone, setDraggedMilestone] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  // 添加临时拖动状态，只在拖动时更新，减少重新渲染
  const [tempDragPosition, setTempDragPosition] = useState<{ id: string; x: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 新增优化状态管理
  const [milestoneMap, setMilestoneMap] = useState<Map<string, Milestone>>(new Map());
  const [draggedMilestoneData, setDraggedMilestoneData] = useState<Milestone | null>(null);
  const dragCache = useDragCache();
  
  // 使用防抖和批量更新
  const batchedUpdates = useBatchedUpdates();
  const debouncedIsDragging = useDebouncedUpdate(isDragging, 16, true); // 60fps优化
  
  // 使用性能监控和错误处理
  const { performanceMode, measureFrameTime } = usePerformanceMonitor();
  const { hasError, fallbackMode, resetError, handleError } = useErrorBoundary();

  const CONTAINER_WIDTH = 800;
  const CONTAINER_HEIGHT = 400;

  // 缓存日期范围计算，避免重复计算
  const dateRange = useMemo(() => {
    const totalDays = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
    const pixelPerDay = CONTAINER_WIDTH / totalDays;
    return { totalDays, pixelPerDay };
  }, [startDate, endDate]);

  // 优化的日期到像素转换
  const dateToPixel = useCallback((date: Date): number => {
    const daysPassed = (date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
    return daysPassed * dateRange.pixelPerDay;
  }, [startDate, dateRange.pixelPerDay]);

  // 优化的像素到日期转换
  const pixelToDate = useCallback((pixel: number): Date => {
    const daysPassed = pixel / dateRange.pixelPerDay;
    return new Date(startDate.getTime() + daysPassed * 24 * 60 * 60 * 1000);
  }, [startDate, dateRange.pixelPerDay]);

  // 更新里程碑位置
  const updateMilestonePositions = useCallback(() => {
    setMilestones(prev => prev.map(milestone => {
      const x = dateToPixel(milestone.startDate);
      const width = dateToPixel(milestone.endDate) - x;
      return { ...milestone, x, width: Math.max(width, 20) };
    }));
  }, [dateToPixel]);

  // 维护里程碑Map，优化查找性能
  React.useEffect(() => {
    const newMap = new Map<string, Milestone>();
    milestones.forEach(milestone => {
      newMap.set(milestone.id, milestone);
    });
    setMilestoneMap(newMap);
  }, [milestones]);

  // 初始化时更新位置
  React.useEffect(() => {
    updateMilestonePositions();
  }, [updateMilestonePositions]);

  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent, milestoneId: string) => {
    e.preventDefault();
    
    // 优化：使用Map快速查找里程碑
    const milestone = milestoneMap.get(milestoneId);
    if (!milestone || !containerRef.current) return;
    
    setDraggedMilestone(milestoneId);
    setDraggedMilestoneData(milestone);
    setIsDragging(true);
    
    // 初始化缓存
    dragCache.updateContainerBounds(containerRef.current);
    dragCache.updateDragMetrics(milestone, dateRange.pixelPerDay);
    
    // 计算拖动偏移
    const bounds = dragCache.containerBounds.current;
    if (bounds) {
      setDragOffset({
        x: e.clientX - bounds.left - milestone.x,
        y: e.clientY - bounds.top
      });
    }
  };

  // 优化的鼠标移动处理，使用节流和缓存
  const handleMouseMoveCore = useCallback((e: MouseEvent) => {
    if (!isDragging || !draggedMilestone || !draggedMilestoneData) return;

    const measureEnd = measureFrameTime();
    
    try {
      const bounds = dragCache.containerBounds.current;
      const metrics = dragCache.dragMetrics.current;
      
      if (!bounds || !metrics) return;

      const newX = e.clientX - bounds.left - dragOffset.x;
      const constrainedX = Math.max(0, Math.min(newX, CONTAINER_WIDTH - 20));
      
      // 根据性能模式调整更新频率
      if (performanceMode === 'low') {
        // 低性能模式：降低更新频率
        if (Math.abs(constrainedX - (tempDragPosition?.x || 0)) < 5) return;
      }
      
      // 使用缓存的计算结果
      batchedUpdates(() => {
        setTempDragPosition({
          id: draggedMilestone,
          x: constrainedX,
          width: metrics.minWidth
        });
      });
      
      measureEnd();
    } catch (error) {
      measureEnd();
      handleError(error as Error);
    }
  }, [isDragging, draggedMilestone, draggedMilestoneData, dragOffset, dragCache, performanceMode, tempDragPosition, batchedUpdates, measureFrameTime, handleError]);

  // 使用节流优化的鼠标移动处理
  const handleMouseMove = useThrottledMouseMove(
    handleMouseMoveCore,
    [isDragging, draggedMilestone, draggedMilestoneData, dragOffset, dragCache]
  );

  // 优化的鼠标松开处理
  const handleMouseUp = useCallback(() => {
    if (tempDragPosition && draggedMilestone && draggedMilestoneData) {
      // 只在拖动结束时更新实际的里程碑位置
      const newStartDate = pixelToDate(tempDragPosition.x);
      const duration = draggedMilestoneData.endDate.getTime() - draggedMilestoneData.startDate.getTime();
      const newEndDate = new Date(newStartDate.getTime() + duration);
      
      setMilestones(prev => prev.map(m => {
        if (m.id === draggedMilestone) {
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
    
    // 清理状态和缓存
    setIsDragging(false);
    setDraggedMilestone(null);
    setDraggedMilestoneData(null);
    setTempDragPosition(null);
    dragCache.clearCache();
  }, [tempDragPosition, draggedMilestone, draggedMilestoneData, pixelToDate, dragCache]);

  // 添加全局事件监听器
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 缓存时间刻度计算
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
    <div className="gantt-container">
      <div 
        ref={containerRef}
        className={`gantt-chart ${isDragging ? 'dragging' : ''}`}
        style={{
          width: CONTAINER_WIDTH,
          height: CONTAINER_HEIGHT,
          position: 'relative',
          border: '1px solid #ddd',
          backgroundColor: '#fff',
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        {/* 时间轴 */}
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

        {/* 网格线 */}
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

        {/* 里程碑 */}
        <div className="milestones" style={{
          position: 'absolute',
          top: timelineHeight + 10,
          left: 0,
          right: 0,
          bottom: 0
        }}>
          {milestones.map((milestone, index) => {
            // 如果正在拖动此里程碑，使用临时位置
            const isBeingDragged = draggedMilestone === milestone.id;
            const displayX = isBeingDragged && tempDragPosition ? tempDragPosition.x : milestone.x;
            const displayWidth = isBeingDragged && tempDragPosition ? tempDragPosition.width : milestone.width;
            
            // 优化的CSS类名
            const milestoneClasses = [
              'milestone',
              fallbackMode ? '' : 'milestone-optimized',
              isBeingDragged ? (fallbackMode ? '' : 'milestone-dragging') : 'milestone-hardware-accelerated'
            ].filter(Boolean).join(' ');
            
            return (
              <div
                key={milestone.id}
                className={milestoneClasses}
                style={{
                  position: 'absolute',
                  left: displayX,
                  top: index * (milestoneHeight + 10),
                  width: displayWidth,
                  height: milestoneHeight,
                  backgroundColor: milestone.color,
                  borderRadius: '4px',
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  boxShadow: isBeingDragged
                    ? '0 4px 8px rgba(0,0,0,0.3)' 
                    : '0 2px 4px rgba(0,0,0,0.1)',
                  transform: isBeingDragged 
                    ? `scale(1.02)`
                    : 'scale(1)',
                  transition: isBeingDragged ? 'none' : 'box-shadow 0.2s ease, transform 0.2s ease',
                  userSelect: 'none',
                  zIndex: isBeingDragged ? 100 : 1
                } as React.CSSProperties}
                onMouseDown={(e) => handleMouseDown(e, milestone.id)}
              >
                {milestone.title}
              </div>
            );
          })}
        </div>

        {/* 当前日期指示线 */}
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
        
        {/* 性能状态指示器 */}
        {(typeof window !== 'undefined' && window.location.hostname === 'localhost') && (
          <div 
            style={{
              position: 'absolute',
              top: 5,
              right: 5,
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '10px',
              zIndex: 1000,
              cursor: fallbackMode ? 'pointer' : 'default'
            }}
            onClick={fallbackMode ? resetError : undefined}
            title={fallbackMode ? '点击重置错误状态' : `性能模式: ${performanceMode}`}
          >
            {performanceMode.toUpperCase()} {fallbackMode ? '(FALLBACK)' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default GanttChart; 