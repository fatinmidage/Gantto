/**
 * TimelineSettingsPanel 测试
 * 验证时间轴设置面板的外部点击检测逻辑
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import TimelineSettingsPanel from '../TimelineSettingsPanel';
import { TimelineLayerConfig } from '../../../utils/timelineLayerUtils';

describe('TimelineSettingsPanel', () => {
  const defaultConfig: TimelineLayerConfig = {
    layers: 2,
    bottom: 'day',
    middle: 'month'
  };

  const defaultProps = {
    config: defaultConfig,
    onConfigChange: vi.fn(),
    isOpen: true,
    onClose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该在点击面板外部时关闭', async () => {
    render(<TimelineSettingsPanel {...defaultProps} />);
    
    // 等待面板渲染
    await waitFor(() => {
      expect(screen.getByText('时间轴设置')).toBeInTheDocument();
    });

    // 等待外部点击监听器被添加（100ms延迟）
    await new Promise(resolve => setTimeout(resolve, 150));

    // 模拟点击面板外部
    fireEvent.mouseDown(document.body);
    
    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('应该在点击背景遮罩时关闭', async () => {
    render(<TimelineSettingsPanel {...defaultProps} />);
    
    // 等待面板渲染
    await waitFor(() => {
      expect(screen.getByText('时间轴设置')).toBeInTheDocument();
    });

    // 找到背景遮罩并点击
    const overlay = document.querySelector('[style*="position: fixed"][style*="rgba(0, 0, 0, 0.4)"]');
    expect(overlay).toBeInTheDocument();
    
    fireEvent.click(overlay as HTMLElement);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('不应该在点击面板内部时关闭', async () => {
    render(<TimelineSettingsPanel {...defaultProps} />);
    
    // 等待面板渲染
    await waitFor(() => {
      expect(screen.getByText('时间轴设置')).toBeInTheDocument();
    });

    // 点击面板内部
    const panel = screen.getByText('时间轴设置').closest('div');
    fireEvent.mouseDown(panel as HTMLElement);
    
    // 等待可能的异步操作
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('不应该在点击Radix UI Select内容时关闭面板', async () => {
    render(<TimelineSettingsPanel {...defaultProps} />);
    
    // 等待面板渲染
    await waitFor(() => {
      expect(screen.getByText('时间轴设置')).toBeInTheDocument();
    });

    // 模拟Radix UI Select内容的DOM结构
    const selectContent = document.createElement('div');
    selectContent.setAttribute('data-radix-select-content', '');
    document.body.appendChild(selectContent);

    // 模拟点击Select内容
    fireEvent.mouseDown(selectContent);
    
    // 等待可能的异步操作
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
    
    // 清理
    document.body.removeChild(selectContent);
  });

  it('应该正确处理配置更改', async () => {
    render(<TimelineSettingsPanel {...defaultProps} />);
    
    // 等待面板渲染
    await waitFor(() => {
      expect(screen.getByText('时间轴设置')).toBeInTheDocument();
    });

    // 点击应用按钮
    const applyButton = screen.getByText('应用');
    fireEvent.click(applyButton);
    
    expect(defaultProps.onConfigChange).toHaveBeenCalledWith(defaultConfig);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('应该在取消时重置配置', async () => {
    render(<TimelineSettingsPanel {...defaultProps} />);
    
    // 等待面板渲染
    await waitFor(() => {
      expect(screen.getByText('时间轴设置')).toBeInTheDocument();
    });

    // 点击取消按钮
    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
    // 取消时不应该调用onConfigChange
    expect(defaultProps.onConfigChange).not.toHaveBeenCalled();
  });
});