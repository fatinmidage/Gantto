import React from 'react';
import { Toolbar } from '..';
import { TimelineLayerConfig } from '../../utils/timelineLayerUtils';

interface GanttChartHeaderProps {
  // 工具栏相关属性
  onAddTask: () => void;
  onDeleteTask: () => void;
  onEditTask: () => void;
  onAddSubtask: () => void;
  canAddSubtask: boolean;
  // 日期范围相关
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;
  
  // 分层时间轴相关
  layerConfig?: TimelineLayerConfig;
  onLayerConfigChange?: (config: TimelineLayerConfig) => void;
  onLayerModeToggle?: (enabled: boolean) => void;
  isLayeredModeEnabled?: boolean;
}

const GanttChartHeader: React.FC<GanttChartHeaderProps> = ({
  onAddTask,
  onDeleteTask,
  onEditTask,
  onAddSubtask,
  canAddSubtask,
  dateRangeStart,
  dateRangeEnd,
  onDateRangeChange,
  layerConfig,
  onLayerConfigChange,
  onLayerModeToggle,
  isLayeredModeEnabled
}) => {
  return (
    <Toolbar
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
  );
};

export default GanttChartHeader;