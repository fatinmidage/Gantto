/**
 * 时间轴设置状态管理Hook
 * 管理分层时间轴的配置状态
 */

import { useState, useCallback } from 'react';
import { TimelineLayerConfig, validateTimelineConfig } from '../../utils/timelineLayerUtils';

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
   * 验证配置合理性 - 使用增强验证函数
   */
  const validateConfig = useCallback((newConfig: TimelineLayerConfig): TimelineLayerConfig => {
    const validation = validateTimelineConfig(newConfig);
    
    if (!validation.isValid) {
      console.warn('时间轴配置验证失败:', validation.errors);
      
      // 返回修正后的配置或默认配置
      return validation.correctedConfig || DEFAULT_CONFIG;
    }
    
    return newConfig;
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