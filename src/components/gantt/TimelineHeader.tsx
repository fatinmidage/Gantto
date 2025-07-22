/**
 * 时间轴头部组件 - 统一分层时间轴显示
 * 完全移除传统时间轴，仅使用分层时间轴系统
 */

import React from 'react';
import LayeredTimelineHeader from './LayeredTimelineHeader';
import { TimelineLayerConfig, DateRange } from '../../utils/timelineLayerUtils';
import { useLayeredTimeline } from '../../hooks/gantt/useLayeredTimeline';

// 简化后的接口 - 完全移除传统相关参数
interface TimelineHeaderProps {
  layerConfig: TimelineLayerConfig;     // 必需参数，不再可选
  dateRange: DateRange;                 // 必需参数
  dateToPixel: (date: Date) => number;  // 必需参数
  containerHeight: number;              // 必需参数
  isCurrentDateInRange?: boolean;       // 可选参数
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  layerConfig,
  dateRange,
  dateToPixel,
  containerHeight,
  isCurrentDateInRange = true
}) => {
  // 使用分层时间轴Hook
  const { layeredTimeScales } = useLayeredTimeline(layerConfig, dateRange, dateToPixel);

  // 直接渲染分层时间轴，移除所有条件分支
  return (
    <LayeredTimelineHeader
      layeredTimeScales={layeredTimeScales}
      dateToPixel={dateToPixel}
      containerHeight={containerHeight}
      isCurrentDateInRange={isCurrentDateInRange}
    />
  );
};

export default TimelineHeader;