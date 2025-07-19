import React, { useRef, useEffect } from 'react';
import TaskTitleColumn from './TaskTitleColumn';
import TaskBars from './TaskBars';
import TimelineHeader from './TimelineHeader';
import { Task } from '../../types';
import { COMPONENT_STYLES } from './ganttStyles';

interface DragPosition {
  x: number;
  width: number;
}

interface VerticalDragState {
  isDragging: boolean;
  draggedTaskId: string | null;
  draggedTaskIndex: number | null;
  targetIndex: number | null;
  startY: number;
  currentY: number;
  shouldShowIndicator: boolean;
}

interface TimeScale {
  type: 'day' | 'week' | 'month';
  label: string;
  x: number;
  width: number;
}

interface GanttChartBodyProps {
  // 任务数据
  leftPanelTasks: Task[];
  chartTaskRows: Array<{ rowId: string; tasks: Task[] }>;
  
  // 选中状态
  selectedTitleTaskId: string | null;
  selectedChartTaskId: string | null;
  
  // 拖拽状态
  verticalDragState: VerticalDragState;
  draggedTask: string | null;
  tempDragPosition: DragPosition | null;
  isHoveringEdge: 'left' | 'right' | null;
  isDragging: boolean;
  
  // 布局配置
  titleColumnWidth: number;
  timelineHeight: number;
  taskHeight: number;
  taskContentHeight: number;
  
  // 容器引用
  containerRef?: React.RefObject<HTMLDivElement>;
  
  // 当前日期范围检查
  isCurrentDateInRange?: boolean;
  
  // 时间轴数据
  timeScales: TimeScale[];
  
  // 事件处理
  onTaskSelect: (taskId: string | null) => void;
  onChartTaskSelect: (taskId: string | null) => void;
  onTaskToggle: (taskId: string) => void;
  onTaskCreateSubtask: (taskId: string) => void;
  onTitleMouseDown: (e: React.MouseEvent, taskId: string) => void;
  onWidthChange: (width: number) => void;
  onMouseDown: (e: React.MouseEvent, taskId: string) => void;
  onTaskContextMenu: (e: React.MouseEvent, taskId: string) => void;
  onEdgeHover: (e: React.MouseEvent, task: any) => void;
  onMouseLeave: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  
  // 工具函数
  dateToPixel: (date: Date) => number;
  
  // 事件监听器
  onMouseMove: (e: MouseEvent) => void;
  onMouseUp: () => void;
  onTitleMouseMove: (e: MouseEvent) => void;
  onTitleMouseUp: () => void;
}

const GanttChartBody: React.FC<GanttChartBodyProps> = ({
  leftPanelTasks,
  chartTaskRows,
  selectedTitleTaskId,
  selectedChartTaskId,
  verticalDragState,
  draggedTask,
  tempDragPosition,
  isHoveringEdge,
  isDragging,
  titleColumnWidth,
  timelineHeight,
  taskHeight,
  taskContentHeight,
  timeScales,
  onTaskSelect,
  onChartTaskSelect,
  onTaskToggle,
  onTaskCreateSubtask,
  onTitleMouseDown,
  onWidthChange,
  onMouseDown,
  onTaskContextMenu,
  onEdgeHover,
  onMouseLeave,
  onContextMenu,
  dateToPixel,
  onMouseMove,
  onMouseUp,
  onTitleMouseMove,
  onTitleMouseUp,
  containerRef: externalContainerRef,
  isCurrentDateInRange = true
}) => {
  const localContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = externalContainerRef || localContainerRef;

  // 添加水平拖拽事件监听器
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      return () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [isDragging, onMouseMove, onMouseUp]);

  // 添加垂直拖拽事件监听器
  useEffect(() => {
    if (verticalDragState.isDragging) {
      document.addEventListener('mousemove', onTitleMouseMove);
      document.addEventListener('mouseup', onTitleMouseUp);
      return () => {
        document.removeEventListener('mousemove', onTitleMouseMove);
        document.removeEventListener('mouseup', onTitleMouseUp);
      };
    }
  }, [verticalDragState.isDragging, onTitleMouseMove, onTitleMouseUp]);

  return (
    <div 
      className="gantt-container" 
      style={{ 
        ...COMPONENT_STYLES.ganttContainer,
        ...(verticalDragState.isDragging ? COMPONENT_STYLES.draggingContainer : {})
      }}
    >
      {/* 任务标题列 */}
      <TaskTitleColumn
        tasks={leftPanelTasks}
        selectedTitleTaskId={selectedTitleTaskId}
        verticalDragState={verticalDragState}
        titleColumnWidth={titleColumnWidth}
        timelineHeight={timelineHeight}
        taskHeight={taskHeight}
        taskContentHeight={taskContentHeight}
        onTaskSelect={onTaskSelect}
        onTaskToggle={onTaskToggle}
        onTaskCreateSubtask={onTaskCreateSubtask}
        onTitleMouseDown={onTitleMouseDown}
        onWidthChange={onWidthChange}
      />

      {/* 甘特图表区域 */}
      <div 
        ref={containerRef}
        className={`gantt-chart-container ${isDragging ? 'dragging' : ''}`}
        style={{
          ...COMPONENT_STYLES.ganttChartArea,
          flex: 1,
          height: timelineHeight + taskContentHeight,
          ...(isDragging ? COMPONENT_STYLES.draggingContainer : {})
        }}
        onContextMenu={onContextMenu}
      >
        {/* 时间轴头部 */}
        <TimelineHeader
          timelineHeight={timelineHeight}
          timeScales={timeScales}
          dateToPixel={dateToPixel}
          containerHeight={timelineHeight + taskContentHeight}
          isCurrentDateInRange={isCurrentDateInRange}
        />

        {/* 任务条 */}
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
          onMouseDown={onMouseDown}
          onTaskSelect={onChartTaskSelect}
          onTaskContextMenu={onTaskContextMenu}
          onEdgeHover={onEdgeHover}
          onMouseLeave={onMouseLeave}
        />
      </div>
    </div>
  );
};

export default GanttChartBody;