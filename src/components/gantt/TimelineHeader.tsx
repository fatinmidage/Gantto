/**
 * 时间轴头部组件
 * 负责渲染顶部时间轴、日期网格线和当前日期指示线
 */

import React from 'react';
import { COLOR_CONSTANTS } from './ganttStyles';

// 时间刻度接口
interface TimeScale {
  x: number;
  label: string;
}

// 组件 Props 接口
interface TimelineHeaderProps {
  timelineHeight: number;
  timeScales: TimeScale[];
  dateToPixel: (date: Date) => number;
  containerHeight: number;
  isCurrentDateInRange?: boolean;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  timelineHeight,
  timeScales,
  dateToPixel,
  containerHeight,
  isCurrentDateInRange = true
}) => {
  return (
    <>
      {/* 时间轴头部 */}
      <div className="gantt-timeline" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: timelineHeight,
        backgroundColor: '#ffffff',
        border: `1px solid ${COLOR_CONSTANTS.BORDER_COLOR}`,
        borderTop: `1px solid ${COLOR_CONSTANTS.BORDER_COLOR}`,
        borderLeft: `1px solid ${COLOR_CONSTANTS.BORDER_COLOR}`,
        borderRight: `1px solid ${COLOR_CONSTANTS.BORDER_COLOR}`,
        borderBottom: `1px solid ${COLOR_CONSTANTS.BORDER_COLOR}`,
        zIndex: 20,
        boxSizing: 'border-box'
      }}>
        {timeScales.map((scale, index) => (
          <div key={index} className="timeline-scale" style={{
            position: 'absolute',
            left: scale.x,
            top: 0,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            minWidth: 'auto',
            paddingLeft: '8px',
            fontSize: '12px',
            color: '#333',
            fontWeight: 400,
            whiteSpace: 'nowrap',
            border: 'none !important',
            borderRight: 'none !important',
            borderLeft: 'none !important',
            backgroundColor: 'transparent !important',
            backdropFilter: 'none !important',
            transform: 'none !important'
          }}>
            {scale.label}
          </div>
        ))}
      </div>

      {/* 垂直网格线 */}
      <div className="gantt-grid-lines" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: containerHeight,
        pointerEvents: 'none',
        zIndex: 15
      }}>
        {timeScales.map((scale, index) => (
          <div key={index} className="gantt-grid-line" style={{
            position: 'absolute',
            left: scale.x,
            top: timelineHeight, // 从时间轴下方开始
            width: '1px',
            height: containerHeight - timelineHeight,
            backgroundColor: '#e0e0e0',
            opacity: 0.8
          }} />
        ))}
      </div>

      {/* 当前日期指示线 - 只在日期范围内时显示 */}
      {isCurrentDateInRange && (
        <div className="gantt-current-date-line" style={{
          position: 'absolute',
          left: dateToPixel(new Date()) - 1, // 居中对齐
          top: 0,
          width: '2px',
          height: containerHeight,
          backgroundColor: '#ff4444',
          zIndex: 25,
          pointerEvents: 'none',
          boxShadow: '0 0 6px rgba(255, 68, 68, 0.4)'
        }} />
      )}
    </>
  );
};

export default TimelineHeader;