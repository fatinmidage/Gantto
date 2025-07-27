import React, { useState, useCallback } from 'react';
import GanttChartHeader from './GanttChartHeader';
import GanttChartBody from './GanttChartBody';
import GanttMenuManager from './GanttMenuManager';
import { LAYOUT_CONSTANTS } from './ganttStyles';
import { Task, MilestoneNode } from '../../types';
import { TimelineLayerConfig, LayeredTimeScale, DateRange } from '../../utils/timelineLayerUtils';

interface GanttContainerProps {
  // Header props
  onAddTask: () => void;
  onDeleteTask: () => void;
  onEditTask: () => void;
  onAddSubtask: () => void;
  canAddSubtask: boolean;
  // 日期范围相关
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;
  
  // 分层时间轴回调函数（保留兼容性）
  onLayerConfigChange?: (config: TimelineLayerConfig) => void;
  onLayerModeToggle?: (enabled: boolean) => void;
  isLayeredModeEnabled?: boolean;
  
  // Body props
  leftPanelTasks: Task[];
  chartTaskRows: any[];
  selectedTitleTaskId: string | null;
  verticalDragState: any;
  draggedTask: string | null;
  tempDragPosition: any;
  isHoveringEdge: 'left' | 'right' | null;
  isDragging: boolean;
  timelineHeight: number;
  taskHeight: number;
  taskContentHeight: number;
  layeredTimeScales: LayeredTimeScale;
  layerConfig: TimelineLayerConfig;
  dateRange: DateRange;
  dateToPixel: (date: Date) => number;
  onTaskSelect: (taskId: string | null) => void;
  onChartTaskSelect: (taskId: string | null) => void;
  onTaskToggle: (taskId: string) => void;
  onTaskCreateSubtask: (taskId: string) => void;
  onTitleMouseDown: (e: React.MouseEvent, taskId: string) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onMouseDown: (e: React.MouseEvent, taskId: string) => void;
  onTaskContextMenu: (e: React.MouseEvent, taskId: string) => void;
  onEdgeHover: (e: React.MouseEvent, task: Task) => void;
  onMouseLeave: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onMouseMove: (e: MouseEvent) => void;
  onMouseUp: () => void;
  onTitleMouseMove: (e: MouseEvent) => void;
  onTitleMouseUp: () => void;
  
  // Menu props
  tasks: Task[];
  contextMenuState: any;
  taskContextMenuState: any;
  milestoneContextMenuState?: any;
  defaultRowId: string;
  availableTags: string[];
  onContextMenuClose: () => void;
  onTaskContextMenuClose: () => void;
  onMilestoneContextMenuClose?: () => void;
  onCreateTask: (task: any) => void;
  onCreateMilestone: (milestone: any) => void;
  onColorChange: (taskId: string, color: string) => void;
  onTagAdd: (taskId: string, tag: string) => void;
  onTagRemove: (taskId: string, tag: string) => void;
  onTaskDelete: (taskId: string) => void;
  onLabelEdit?: (taskId: string, label: string) => void; // 里程碑标签编辑
  onMilestoneIconChange?: (milestoneId: string, iconType: any, color?: string) => void;
  onMilestoneLabelEdit?: (milestoneId: string, label: string) => void;
  onMilestoneDelete?: (milestoneId: string) => void;
  pixelToDate: (pixel: number) => Date;
  
  // 容器引用
  containerRef?: React.RefObject<HTMLDivElement>;
  
  // 当前日期范围检查
  isCurrentDateInRange?: boolean;
  
  // 里程碑数据
  milestones?: MilestoneNode[];
  selectedMilestone?: string | null;
  onMilestoneSelect?: (milestoneId: string) => void;
  onMilestoneContextMenu?: (e: React.MouseEvent, milestoneId: string) => void;
  onMilestoneDragStart?: (e: React.MouseEvent, milestone: MilestoneNode) => void;
}

const GanttContainer: React.FC<GanttContainerProps> = ({
  // Header props
  onAddTask,
  onDeleteTask,
  onEditTask,
  onAddSubtask,
  canAddSubtask,
  // 日期范围相关
  dateRangeStart,
  dateRangeEnd,
  onDateRangeChange,
  
  // 分层时间轴相关
  onLayerConfigChange,
  onLayerModeToggle,
  isLayeredModeEnabled,
  
  // Body props
  leftPanelTasks,
  chartTaskRows,
  selectedTitleTaskId,
  verticalDragState,
  draggedTask,
  tempDragPosition,
  isHoveringEdge,
  isDragging,
  timelineHeight,
  taskHeight,
  taskContentHeight,
  layeredTimeScales,
  layerConfig,
  dateRange,
  dateToPixel,
  onTaskSelect,
  onChartTaskSelect,
  onTaskToggle,
  onTaskCreateSubtask,
  onTitleMouseDown,
  onTaskUpdate,
  onMouseDown,
  onTaskContextMenu,
  onEdgeHover,
  onMouseLeave,
  onContextMenu,
  onMouseMove,
  onMouseUp,
  onTitleMouseMove,
  onTitleMouseUp,
  
  // Menu props
  tasks,
  contextMenuState,
  taskContextMenuState,
  milestoneContextMenuState,
  defaultRowId,
  availableTags,
  onContextMenuClose,
  onTaskContextMenuClose,
  onMilestoneContextMenuClose,
  onCreateTask,
  onCreateMilestone,
  onColorChange,
  onTagAdd,
  onTagRemove,
  onTaskDelete,
  onLabelEdit,
  onMilestoneIconChange,
  onMilestoneLabelEdit,
  onMilestoneDelete,
  pixelToDate,
  containerRef,
  isCurrentDateInRange = true,
  milestones = [],
  selectedMilestone,
  onMilestoneSelect,
  onMilestoneContextMenu,
  onMilestoneDragStart
}) => {
  // 标题列宽度状态
  const [titleColumnWidth, setTitleColumnWidth] = useState<number>(LAYOUT_CONSTANTS.TITLE_COLUMN_WIDTH);
  
  // 处理标题列宽度变化
  const handleTitleColumnWidthChange = useCallback((width: number) => {
    setTitleColumnWidth(width);
  }, []);

  return (
    <div className="gantt-container-wrapper">
      <GanttChartHeader
        onAddTask={onAddTask}
        onDeleteTask={onDeleteTask}
        onEditTask={onEditTask}
        onAddSubtask={onAddSubtask}
        canAddSubtask={canAddSubtask}
        dateRangeStart={dateRangeStart}
        dateRangeEnd={dateRangeEnd}
        onDateRangeChange={onDateRangeChange}
        layerConfig={layerConfig}
        onLayerConfigChange={onLayerConfigChange}
        onLayerModeToggle={onLayerModeToggle}
        isLayeredModeEnabled={isLayeredModeEnabled}
      />
      
      <GanttChartBody
        leftPanelTasks={leftPanelTasks}
        chartTaskRows={chartTaskRows}
        selectedTitleTaskId={selectedTitleTaskId}
        verticalDragState={verticalDragState}
        draggedTask={draggedTask}
        tempDragPosition={tempDragPosition}
        isHoveringEdge={isHoveringEdge}
        isDragging={isDragging}
        titleColumnWidth={titleColumnWidth}
        timelineHeight={timelineHeight}
        taskHeight={taskHeight}
        taskContentHeight={taskContentHeight}
        layeredTimeScales={layeredTimeScales}
        layerConfig={layerConfig}
        dateRange={dateRange}
        onTaskSelect={onTaskSelect}
        onChartTaskSelect={onChartTaskSelect}
        onTaskToggle={onTaskToggle}
        onTaskCreateSubtask={onTaskCreateSubtask}
        onTitleMouseDown={onTitleMouseDown}
        onWidthChange={handleTitleColumnWidthChange}
        onTaskUpdate={onTaskUpdate}
        onMouseDown={onMouseDown}
        onTaskContextMenu={onTaskContextMenu}
        onEdgeHover={onEdgeHover}
        onMouseLeave={onMouseLeave}
        onContextMenu={onContextMenu}
        dateToPixel={dateToPixel}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTitleMouseMove={onTitleMouseMove}
        onTitleMouseUp={onTitleMouseUp}
        containerRef={containerRef}
        isCurrentDateInRange={isCurrentDateInRange}
        milestones={milestones}
        selectedMilestone={selectedMilestone}
        onMilestoneSelect={onMilestoneSelect}
        onMilestoneContextMenu={onMilestoneContextMenu}
        onMilestoneDragStart={onMilestoneDragStart}
        onMilestoneLabelEdit={onMilestoneLabelEdit}
      />

      <GanttMenuManager
        tasks={tasks}
        milestones={milestones}
        contextMenuState={contextMenuState}
        taskContextMenuState={taskContextMenuState}
        milestoneContextMenuState={milestoneContextMenuState || { visible: false, x: 0, y: 0, milestoneId: null }}
        defaultRowId={defaultRowId}
        availableTags={availableTags}
        visibleRows={leftPanelTasks}
        taskHeight={taskHeight}
        onContextMenuClose={onContextMenuClose}
        onTaskContextMenuClose={onTaskContextMenuClose}
        onMilestoneContextMenuClose={onMilestoneContextMenuClose || (() => {})}
        onCreateTask={onCreateTask}
        onCreateMilestone={onCreateMilestone}
        onColorChange={onColorChange}
        onTagAdd={onTagAdd}
        onTagRemove={onTagRemove}
        onTaskDelete={onTaskDelete}
        onLabelEdit={onLabelEdit}
        onMilestoneIconChange={onMilestoneIconChange}
        onMilestoneLabelEdit={onMilestoneLabelEdit}
        onMilestoneDelete={onMilestoneDelete}
        pixelToDate={pixelToDate}
      />
    </div>
  );
};

export default GanttContainer;