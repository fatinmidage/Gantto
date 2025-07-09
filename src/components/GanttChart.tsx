import React, { useState, useRef, useCallback, useMemo } from 'react';

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

  // 初始化时更新位置
  React.useEffect(() => {
    updateMilestonePositions();
  }, [updateMilestonePositions]);

  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent, milestoneId: string) => {
    e.preventDefault();
    setDraggedMilestone(milestoneId);
    setIsDragging(true);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const milestone = milestones.find(m => m.id === milestoneId);
      if (milestone) {
        setDragOffset({
          x: e.clientX - rect.left - milestone.x,
          y: e.clientY - rect.top
        });
      }
    }
  };

  // 优化的鼠标移动处理，使用临时状态
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !draggedMilestone || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const constrainedX = Math.max(0, Math.min(newX, CONTAINER_WIDTH - 20));

    // 找到被拖动的里程碑
    const milestone = milestones.find(m => m.id === draggedMilestone);
    if (milestone) {
      const duration = milestone.endDate.getTime() - milestone.startDate.getTime();
      const newWidth = Math.max(20, (duration / (24 * 60 * 60 * 1000)) * dateRange.pixelPerDay);
      
      // 只更新临时位置，避免频繁重新渲染
      setTempDragPosition({
        id: draggedMilestone,
        x: constrainedX,
        width: newWidth
      });
    }
  }, [isDragging, draggedMilestone, dragOffset, milestones, dateRange.pixelPerDay]);

  // 优化的鼠标松开处理
  const handleMouseUp = useCallback(() => {
    if (tempDragPosition && draggedMilestone) {
      // 只在拖动结束时更新实际的里程碑位置
      const newStartDate = pixelToDate(tempDragPosition.x);
      const milestone = milestones.find(m => m.id === draggedMilestone);
      
      if (milestone) {
        const duration = milestone.endDate.getTime() - milestone.startDate.getTime();
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
    }
    
    setIsDragging(false);
    setDraggedMilestone(null);
    setTempDragPosition(null);
  }, [tempDragPosition, draggedMilestone, milestones, pixelToDate]);

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
        className="gantt-chart"
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
            
            return (
              <div
                key={milestone.id}
                className="milestone"
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
                  transform: isBeingDragged ? 'scale(1.02)' : 'scale(1)',
                  transition: isBeingDragged ? 'none' : 'box-shadow 0.2s ease, transform 0.2s ease',
                  userSelect: 'none',
                  zIndex: isBeingDragged ? 100 : 1
                }}
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
      </div>
    </div>
  );
};

export default GanttChart; 