/**
 * 时间轴分层设置组件
 * 提供分层时间轴配置的入口按钮和面板
 */

import React, { useRef } from 'react';
import { Layers } from '../icons';
import { useTimelineSettings } from '../../hooks/gantt/useTimelineSettings';
import { TimelineLayerConfig } from '../../utils/timelineLayerUtils';
import TimelineSettingsPanel from './TimelineSettingsPanel';

// 组件Props接口
interface TimelineLayerSettingsProps {
  config?: TimelineLayerConfig;
  onConfigChange?: (config: TimelineLayerConfig) => void;
  onModeToggle?: (enabled: boolean) => void;
  isLayeredModeEnabled?: boolean;
}

const TimelineLayerSettings: React.FC<TimelineLayerSettingsProps> = ({
  config: externalConfig,
  onConfigChange,
  onModeToggle,
  isLayeredModeEnabled = true
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const {
    config,
    updateConfig,
    isPanelOpen,
    setIsPanelOpen
  } = useTimelineSettings(externalConfig);

  const handleConfigChange = (newConfig: TimelineLayerConfig) => {
    updateConfig(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
    // 如果配置了层级，自动启用分层模式
    if (onModeToggle && !isLayeredModeEnabled) {
      onModeToggle(true);
    }
  };

  const handleToggleMode = () => {
    const newEnabled = !isLayeredModeEnabled;
    if (onModeToggle) {
      onModeToggle(newEnabled);
    }
    // 如果启用分层模式且面板未打开，则打开设置面板
    if (newEnabled && !isPanelOpen) {
      setIsPanelOpen(true);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        className={`toolbar-btn ${isLayeredModeEnabled ? 'active' : ''}`}
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        onDoubleClick={handleToggleMode}
        title={`时间轴分层设置 ${isLayeredModeEnabled ? '(已启用)' : '(已禁用)'}\n双击切换分层模式`}
      >
        <Layers size={16} />
        <span>分层设置</span>
      </button>

      {isPanelOpen && (
        <TimelineSettingsPanel
          config={config}
          onConfigChange={handleConfigChange}
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          triggerRef={buttonRef}
        />
      )}
    </div>
  );
};

export default TimelineLayerSettings;