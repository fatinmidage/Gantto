import React, { useState, useCallback } from 'react';
import GanttChartHeader from './GanttChartHeader';
import GanttChartBody from './GanttChartBody';
import GanttMenuManager from './GanttMenuManager';
import { LAYOUT_CONSTANTS } from './ganttStyles';

interface GanttContainerProps {
  // Header props
  onZoomIn: () => void;
  onZoomOut: () => void;
  onAddTask: () => void;
  onDeleteTask: () => void;
  onEditTask: () => void;
  onViewToday: () => void;
  onAddSubtask: () => void;
  zoomLevel: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  canAddSubtask: boolean;
  
  // Body props
  leftPanelTasks: any[];
  chartTaskRows: any[];
  selectedTitleTaskId: string | null;
  selectedChartTaskId: string | null;
  verticalDragState: any;
  draggedTask: string | null;
  tempDragPosition: any;
  isHoveringEdge: 'left' | 'right' | null;
  isDragging: boolean;
  timelineHeight: number;
  taskHeight: number;
  taskContentHeight: number;
  timeScales: any[];
  onTaskSelect: (taskId: string | null) => void;
  onChartTaskSelect: (taskId: string | null) => void;
  onTaskToggle: (taskId: string) => void;
  onTaskCreateSubtask: (taskId: string) => void;
  onTitleMouseDown: (e: React.MouseEvent, taskId: string) => void;
  onMouseDown: (e: React.MouseEvent, taskId: string) => void;
  onTaskContextMenu: (e: React.MouseEvent, taskId: string) => void;
  onEdgeHover: (e: React.MouseEvent, task: any) => void;
  onMouseLeave: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  dateToPixel: (date: Date) => number;
  onMouseMove: (e: MouseEvent) => void;
  onMouseUp: () => void;
  onTitleMouseMove: (e: MouseEvent) => void;
  onTitleMouseUp: () => void;
  
  // Menu props
  tasks: any[];
  contextMenuState: any;
  taskContextMenuState: any;
  defaultRowId: string;
  availableTags: string[];
  onContextMenuClose: () => void;
  onTaskContextMenuClose: () => void;
  onCreateTask: (task: any) => void;
  onCreateMilestone: (milestone: any) => void;
  onColorChange: (taskId: string, color: string) => void;
  onTagAdd: (taskId: string, tag: string) => void;
  onTagRemove: (taskId: string, tag: string) => void;
  onTaskDelete: (taskId: string) => void;
  pixelToDate: (pixel: number) => Date;
}

const GanttContainer: React.FC<GanttContainerProps> = ({
  // Header props
  onZoomIn,
  onZoomOut,
  onAddTask,
  onDeleteTask,
  onEditTask,
  onViewToday,
  onAddSubtask,
  zoomLevel,
  canZoomIn,
  canZoomOut,
  canAddSubtask,
  
  // Body props
  leftPanelTasks,
  chartTaskRows,
  selectedTitleTaskId,
  selectedChartTaskId,
  verticalDragState,
  draggedTask,
  tempDragPosition,
  isHoveringEdge,
  isDragging,
  timelineHeight,
  taskHeight,
  taskContentHeight,
  timeScales,
  onTaskSelect,
  onChartTaskSelect,
  onTaskToggle,
  onTaskCreateSubtask,
  onTitleMouseDown,
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
  
  // Menu props
  tasks,
  contextMenuState,
  taskContextMenuState,
  defaultRowId,
  availableTags,
  onContextMenuClose,
  onTaskContextMenuClose,
  onCreateTask,
  onCreateMilestone,
  onColorChange,
  onTagAdd,
  onTagRemove,
  onTaskDelete,
  pixelToDate
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
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onAddTask={onAddTask}
        onDeleteTask={onDeleteTask}
        onEditTask={onEditTask}
        onViewToday={onViewToday}
        zoomLevel={zoomLevel}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        onAddSubtask={onAddSubtask}
        canAddSubtask={canAddSubtask}
      />
      
      <GanttChartBody
        leftPanelTasks={leftPanelTasks}
        chartTaskRows={chartTaskRows}
        selectedTitleTaskId={selectedTitleTaskId}
        selectedChartTaskId={selectedChartTaskId}
        verticalDragState={verticalDragState}
        draggedTask={draggedTask}
        tempDragPosition={tempDragPosition}
        isHoveringEdge={isHoveringEdge}
        isDragging={isDragging}
        titleColumnWidth={titleColumnWidth}
        timelineHeight={timelineHeight}
        taskHeight={taskHeight}
        taskContentHeight={taskContentHeight}
        timeScales={timeScales}
        onTaskSelect={onTaskSelect}
        onChartTaskSelect={onChartTaskSelect}
        onTaskToggle={onTaskToggle}
        onTaskCreateSubtask={onTaskCreateSubtask}
        onTitleMouseDown={onTitleMouseDown}
        onWidthChange={handleTitleColumnWidthChange}
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
      />

      <GanttMenuManager
        tasks={tasks}
        contextMenuState={contextMenuState}
        taskContextMenuState={taskContextMenuState}
        defaultRowId={defaultRowId}
        availableTags={availableTags}
        onContextMenuClose={onContextMenuClose}
        onTaskContextMenuClose={onTaskContextMenuClose}
        onCreateTask={onCreateTask}
        onCreateMilestone={onCreateMilestone}
        onColorChange={onColorChange}
        onTagAdd={onTagAdd}
        onTagRemove={onTagRemove}
        onTaskDelete={onTaskDelete}
        pixelToDate={pixelToDate}
      />
    </div>
  );
};

export default GanttContainer;