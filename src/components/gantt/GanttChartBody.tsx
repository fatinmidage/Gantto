import React, { useRef } from 'react';
import TaskTitleColumn from './TaskTitleColumn';
import TaskBarsContainer from './TaskBarsContainer';
import TimelineHeader from './TimelineHeader';
import { Task, MilestoneNode } from '../../types';
import { COMPONENT_STYLES } from './ganttStyles';
import { TimelineLayerConfig, LayeredTimeScale, DateRange } from '../../utils/timelineLayerUtils';

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


interface GanttChartBodyProps {
  // 任务数据
  leftPanelTasks: Task[];
  chartTaskRows: Array<{ rowId: string; tasks: Task[] }>;
  
  // 选中状态
  selectedTitleTaskId: string | null;
  
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
  
  // 里程碑数据
  milestones?: MilestoneNode[];
  selectedMilestone?: string | null;
  
  // 分层时间轴数据 - 移除传统timeScales参数
  layeredTimeScales: LayeredTimeScale;
  layerConfig: TimelineLayerConfig;
  dateRange: DateRange;
  dateToPixel: (date: Date) => number;
  pixelToDate: (pixel: number) => Date;
  
  // 事件处理
  onTaskSelect: (taskId: string | null) => void;
  onChartTaskSelect: (taskId: string | null) => void;
  onTaskToggle: (taskId: string) => void;
  onTaskCreateSubtask: (taskId: string) => void;
  onTitleMouseDown: (e: React.MouseEvent, taskId: string) => void;
  onWidthChange: (width: number) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onMouseDown: (e: React.MouseEvent, taskId: string) => void;
  onTaskContextMenu: (e: React.MouseEvent, taskId: string) => void;
  onEdgeHover: (e: React.MouseEvent, task: any) => void;
  onMouseLeave: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onMilestoneSelect?: (milestoneId: string) => void;
  onMilestoneContextMenu?: (e: React.MouseEvent, milestoneId: string) => void;
  onMilestoneDragStart?: (e: React.MouseEvent, milestone: any) => void;
  onMilestoneLabelEdit?: (milestoneId: string, label: string) => void;
  onMilestoneDateChange?: (milestoneId: string, newDate: Date) => void;
  
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
  verticalDragState,
  draggedTask,
  tempDragPosition,
  isHoveringEdge,
  isDragging,
  titleColumnWidth,
  timelineHeight,
  taskHeight,
  taskContentHeight,
  layerConfig,
  dateRange,
  onTaskSelect,
  onChartTaskSelect,
  onTaskToggle,
  onTaskCreateSubtask,
  onTitleMouseDown,
  onWidthChange,
  onTaskUpdate,
  onMouseDown,
  onTaskContextMenu,
  onEdgeHover,
  onMouseLeave,
  onContextMenu,
  onMilestoneSelect,
  onMilestoneContextMenu,
  onMilestoneDragStart,
  onMilestoneLabelEdit,
  onMilestoneDateChange,
  dateToPixel,
  pixelToDate,
  onMouseMove: _onMouseMove,
  onMouseUp: _onMouseUp,
  onTitleMouseMove: _onTitleMouseMove,
  onTitleMouseUp: _onTitleMouseUp,
  containerRef: externalContainerRef,
  isCurrentDateInRange = true,
  milestones = [],
  selectedMilestone,
}) => {
  const localContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = externalContainerRef || localContainerRef;

  // 事件监听器已统一移动到 GanttEventCoordinator 中管理

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
        onTaskUpdate={onTaskUpdate}
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
          layerConfig={layerConfig}
          dateRange={dateRange}
          dateToPixel={dateToPixel}
          containerHeight={timelineHeight + taskContentHeight}
          isCurrentDateInRange={isCurrentDateInRange}
        />

        {/* 任务条 */}
        <TaskBarsContainer
          chartTaskRows={chartTaskRows}
          taskHeight={taskHeight}
          timelineHeight={timelineHeight}
          draggedTask={draggedTask}
          tempDragPosition={tempDragPosition}
          isHoveringEdge={isHoveringEdge}
          dateToPixel={dateToPixel}
          pixelToDate={pixelToDate}
          isDragging={isDragging}
          milestones={milestones}
          selectedMilestone={selectedMilestone}
          onMouseDown={onMouseDown}
          onTaskSelect={onChartTaskSelect}
          onTaskContextMenu={onTaskContextMenu}
          onEdgeHover={onEdgeHover}
          onMouseLeave={onMouseLeave}
          onMilestoneSelect={onMilestoneSelect}
          onMilestoneContextMenu={onMilestoneContextMenu}
          onMilestoneDragStart={onMilestoneDragStart}
          onMilestoneLabelEdit={onMilestoneLabelEdit}
          onMilestoneDateChange={onMilestoneDateChange}
        />
      </div>
    </div>
  );
};

export default GanttChartBody;