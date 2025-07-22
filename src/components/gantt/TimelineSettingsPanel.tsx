/**
 * 时间轴设置面板组件
 * 提供分层时间轴的配置界面
 * 
 * 屏幕居中显示，使用Portal渲染
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { TimelineLayerConfig } from '../../utils/timelineLayerUtils';
import GranularitySelector from './settings/GranularitySelector';
import LayerCountSelector from './settings/LayerCountSelector';

// 组件Props接口
interface TimelineSettingsPanelProps {
  config: TimelineLayerConfig;
  onConfigChange: (config: TimelineLayerConfig) => void;
  isOpen: boolean;
  onClose: () => void;
  // triggerRef不再需要，因为我们使用屏幕居中
  triggerRef?: React.RefObject<HTMLElement>;
}

const TimelineSettingsPanel: React.FC<TimelineSettingsPanelProps> = ({
  config,
  onConfigChange,
  isOpen,
  onClose
}) => {
  const [localConfig, setLocalConfig] = useState(config);
  const panelRef = useRef<HTMLDivElement>(null);

  // 屏幕居中定位计算
  const [positioning, setPositioning] = useState<{
    top: number;
    left: number;
    maxWidth: number;
  }>({
    top: 0,
    left: 0,
    maxWidth: 320
  });

  // 计算居中位置
  useEffect(() => {
    if (!isOpen) return;

    const calculateCenterPosition = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // 面板尺寸
      const panelWidth = 320;
      const panelHeight = 450;
      
      // 计算屏幕居中位置
      const left = (viewportWidth - panelWidth) / 2;
      const top = (viewportHeight - panelHeight) / 2;
      
      setPositioning({
        top: Math.max(20, top),
        left: Math.max(20, left),
        maxWidth: Math.min(panelWidth, viewportWidth - 40)
      });
    };

    calculateCenterPosition();
    
    // 监听窗口大小变化
    window.addEventListener('resize', calculateCenterPosition);
    return () => {
      window.removeEventListener('resize', calculateCenterPosition);
    };
  }, [isOpen]);

  // 点击外部关闭面板
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const panel = panelRef.current;
      if (panel && !panel.contains(event.target as Node)) {
        onClose();
      }
    };

    // 延迟添加监听器，避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleApply = () => {
    onConfigChange(localConfig);
    onClose();
  };

  const handleCancel = () => {
    setLocalConfig(config);
    onClose();
  };

  if (!isOpen) return null;

  // 使用Portal渲染到body
  const panelContent = (
    <>
      {/* 半透明背景遮罩 - 点击关闭 */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 999,
          backdropFilter: 'blur(3px)'
        }} 
      />
      
      {/* 设置面板 */}
      <div 
        ref={panelRef}
        className="timeline-settings-panel" 
        style={{
          position: 'fixed',
          top: positioning.top,
          left: positioning.left,
          zIndex: 1000,
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
          padding: '24px',
          minWidth: '320px',
          maxWidth: positioning.maxWidth,
          transformOrigin: 'center center',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out, box-shadow 0.3s ease-out'
        }}
      >
        {/* 头部 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px' 
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: 600,
            color: '#333'
          }}>
            时间轴设置
          </h3>
          <button 
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
              e.currentTarget.style.color = '#333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#666';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 层数选择 */}
          <LayerCountSelector
            value={localConfig.layers}
            onChange={(layers) => setLocalConfig(prev => ({ ...prev, layers }))}
          />

          {/* 底层颗粒度 */}
          <GranularitySelector
            label="底层颗粒度"
            value={localConfig.bottom}
            onValueChange={(value) => setLocalConfig(prev => ({ ...prev, bottom: value }))}
          />

          {/* 中层/上层颗粒度 */}
          <GranularitySelector
            label={`${localConfig.layers === 2 ? '上层' : '中层'}颗粒度`}
            value={localConfig.middle}
            onValueChange={(value) => setLocalConfig(prev => ({ ...prev, middle: value }))}
          />

          {/* 顶层颗粒度 (仅3层时显示) */}
          {localConfig.layers === 3 && (
            <GranularitySelector
              label="顶层颗粒度"
              value={localConfig.top}
              onValueChange={(value) => setLocalConfig(prev => ({ ...prev, top: value }))}
            />
          )}
        </div>

        {/* 操作按钮 */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'flex-end', 
          marginTop: '24px' 
        }}>
          <button 
            onClick={handleCancel}
            style={{
              padding: '10px 20px',
              border: '1px solid #d0d0d0',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#666',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#999';
              e.currentTarget.style.color = '#333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d0d0d0';
              e.currentTarget.style.color = '#666';
            }}
          >
            取消
          </button>
          <button 
            onClick={handleApply}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#007acc',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0066b3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#007acc';
            }}
          >
            应用
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(panelContent, document.body);
};

export default TimelineSettingsPanel;