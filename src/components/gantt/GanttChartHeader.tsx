import React from 'react';
import { Toolbar } from '..';

interface GanttChartHeaderProps {
  // 工具栏相关属性
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
}

const GanttChartHeader: React.FC<GanttChartHeaderProps> = ({
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
  canAddSubtask
}) => {
  return (
    <Toolbar
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
  );
};

export default GanttChartHeader;