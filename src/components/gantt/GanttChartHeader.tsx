import React from 'react';
import { Toolbar } from '..';
import { TimeGranularity } from '../../hooks/gantt/useTimeline';
import { TimelineLayerConfig } from '../../utils/timelineLayerUtils';

interface GanttChartHeaderProps {
  // 工具栏相关属性
  onAddTask: () => void;
  onDeleteTask: () => void;
  onEditTask: () => void;
  onAddSubtask: () => void;
  canAddSubtask: boolean;
  // 日期范围和时间颗粒度相关
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  timeGranularity?: TimeGranularity;
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;
  onTimeGranularityChange?: (granularity: TimeGranularity) => void;
  
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
  timeGranularity,
  onDateRangeChange,
  onTimeGranularityChange,
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
      timeGranularity={timeGranularity}
      onDateRangeChange={onDateRangeChange}
      onTimeGranularityChange={onTimeGranularityChange}
      layerConfig={layerConfig}
      onLayerConfigChange={onLayerConfigChange}
      onLayerModeToggle={onLayerModeToggle}
      isLayeredModeEnabled={isLayeredModeEnabled}
    />
  );
};

export default GanttChartHeader;