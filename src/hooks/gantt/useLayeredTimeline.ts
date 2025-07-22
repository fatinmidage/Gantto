/**
 * 分层时间轴数据生成Hook
 * 根据配置生成分层的时间轴数据
 */

import { useMemo } from 'react';
import { 
  TimelineLayerConfig, 
  LayeredTimeScale, 
  generateLayeredTimeScales 
} from '../../utils/timelineLayerUtils';

// 日期范围接口（与现有保持一致）
interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Hook返回接口
interface UseLayeredTimelineResult {
  layeredTimeScales: LayeredTimeScale;
}

/**
 * 分层时间轴数据生成Hook
 * @param config 分层配置
 * @param dateRange 日期范围
 * @param dateToPixel 日期转像素函数
 * @returns 分层时间轴数据
 */
export const useLayeredTimeline = (
  config: TimelineLayerConfig,
  dateRange: DateRange,
  dateToPixel: (date: Date) => number
): UseLayeredTimelineResult => {

  /**
   * 生成分层时间刻度数据
   * 使用useMemo进行性能优化，只在依赖变化时重新计算
   */
  const layeredTimeScales = useMemo((): LayeredTimeScale => {
    return generateLayeredTimeScales(config, dateRange, dateToPixel);
  }, [config, dateRange, dateToPixel]);

  return { 
    layeredTimeScales 
  };
};