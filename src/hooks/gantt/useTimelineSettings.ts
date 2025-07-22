/**
 * 时间轴设置状态管理Hook
 * 管理分层时间轴的配置状态
 */

import { useState, useCallback } from 'react';
import { TimelineLayerConfig } from '../../utils/timelineLayerUtils';

// Hook返回接口
interface UseTimelineSettingsResult {
  config: TimelineLayerConfig;
  updateConfig: (newConfig: Partial<TimelineLayerConfig>) => void;
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
  resetToDefault: () => void;
}

// 默认配置
const DEFAULT_CONFIG: TimelineLayerConfig = {
  layers: 2,
  bottom: 'day',
  middle: 'month'
};

/**
 * 时间轴设置状态管理Hook
 */
export const useTimelineSettings = (initialConfig?: TimelineLayerConfig): UseTimelineSettingsResult => {
  const [config, setConfig] = useState<TimelineLayerConfig>(
    initialConfig || DEFAULT_CONFIG
  );
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  /**
   * 验证配置合理性
   */
  const validateConfig = useCallback((newConfig: TimelineLayerConfig): TimelineLayerConfig => {
    // 基本验证：确保必要字段存在
    const validatedConfig = { ...newConfig };
    
    // 2层模式：需要bottom和middle
    if (validatedConfig.layers === 2) {
      if (!validatedConfig.middle) {
        validatedConfig.middle = 'month';
      }
      // 清除top字段
      delete validatedConfig.top;
    }
    
    // 3层模式：需要bottom、middle和top
    if (validatedConfig.layers === 3) {
      if (!validatedConfig.middle) {
        validatedConfig.middle = 'month';
      }
      if (!validatedConfig.top) {
        validatedConfig.top = 'year';
      }
    }
    
    return validatedConfig;
  }, []);

  /**
   * 更新配置
   */
  const updateConfig = useCallback((newConfig: Partial<TimelineLayerConfig>) => {
    setConfig(prev => {
      const mergedConfig = { ...prev, ...newConfig };
      return validateConfig(mergedConfig);
    });
  }, [validateConfig]);

  /**
   * 重置为默认配置
   */
  const resetToDefault = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  return {
    config,
    updateConfig,
    isPanelOpen,
    setIsPanelOpen,
    resetToDefault
  };
};