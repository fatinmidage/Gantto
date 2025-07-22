/**
 * 分层时间轴头部组件
 * 负责渲染多层时间轴、网格线和当前日期指示线
 */

import React from 'react';
import { LayeredTimeScale } from '../../utils/timelineLayerUtils';
import { COLOR_CONSTANTS } from './ganttStyles';

// 组件Props接口
interface LayeredTimelineHeaderProps {
  layeredTimeScales: LayeredTimeScale;
  dateToPixel: (date: Date) => number;
  containerHeight: number;
  isCurrentDateInRange?: boolean;
}

const LayeredTimelineHeader: React.FC<LayeredTimelineHeaderProps> = ({
  layeredTimeScales,
  containerHeight,
  isCurrentDateInRange = true,
  dateToPixel
}) => {
  return (
    <>
      {/* 分层时间轴头部 */}
      <div className="gantt-layered-timeline" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: layeredTimeScales.totalHeight,
        backgroundColor: '#ffffff',
        border: `1px solid ${COLOR_CONSTANTS.BORDER_COLOR}`,
        zIndex: 20,
        boxSizing: 'border-box'
      }}>
        {layeredTimeScales.layers.map((layer, layerIndex) => (
          <div key={layerIndex} className="timeline-layer" style={{
            position: 'absolute',
            top: layer.level * layer.height,
            left: 0,
            right: 0,
            height: layer.height,
            borderBottom: layerIndex < layeredTimeScales.layers.length - 1 
              ? `1px solid ${COLOR_CONSTANTS.BORDER_COLOR}` : 'none'
          }}>
            {layer.items.map((item, itemIndex) => (
              <div key={itemIndex} className="timeline-scale-item" style={{
                position: 'absolute',
                left: item.x,
                top: 0,
                width: item.width,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#333',
                fontWeight: 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'clip'
              }}>
                {item.label}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 垂直网格线 - 使用底层的时间刻度生成 */}
      <div className="gantt-grid-lines" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: containerHeight,
        pointerEvents: 'none',
        zIndex: 15
      }}>
        {layeredTimeScales.layers[0]?.items.map((item, index) => (
          <div key={index} className="gantt-grid-line" style={{
            position: 'absolute',
            left: item.x,
            top: layeredTimeScales.totalHeight,
            width: '1px',
            height: containerHeight - layeredTimeScales.totalHeight,
            backgroundColor: '#e0e0e0',
            opacity: 0.8
          }} />
        ))}
      </div>

      {/* 当前日期指示线 */}
      {isCurrentDateInRange && (
        <div className="gantt-current-date-line" style={{
          position: 'absolute',
          left: dateToPixel(new Date()) - 1,
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

export default LayeredTimelineHeader;