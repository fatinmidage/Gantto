import React, { useState, useCallback, useMemo } from 'react';
import { useLayeredTimeline } from './useLayeredTimeline';
import { TimelineLayerConfig, DateRange, TimeGranularity } from '../../utils/timelineLayerUtils';

// 重新导出类型以保持兼容性
export type { TimeGranularity };

// 默认分层配置
const DEFAULT_LAYER_CONFIG: TimelineLayerConfig = {
  layers: 3,
  bottom: 'week',
  middle: 'month',
  top: 'year'
};

// 时间轴管理Hook
export const useTimeline = (
  initialStartDate?: Date, 
  initialEndDate?: Date, 
  initialLayerConfig?: TimelineLayerConfig,
  containerWidth?: number
) => {
  // === 基础状态保持不变 ===
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentView, setCurrentView] = useState<'timeline' | 'list' | 'grid'>('timeline');
  
  // === 分层配置状态 ===
  const [layerConfig, setLayerConfig] = useState<TimelineLayerConfig>(
    initialLayerConfig || DEFAULT_LAYER_CONFIG
  );
  
  // === 响应外部配置更改 ===
  React.useEffect(() => {
    if (initialLayerConfig) {
      setLayerConfig(initialLayerConfig);
    }
  }, [initialLayerConfig]);
  
  // === 计算日期范围保持不变 ===
  const dateRange = useMemo((): DateRange => {
    // 动态计算默认日期范围：当天前1个月至后5个月（总共6个月跨度）
    const today = new Date();
    const startDate = initialStartDate || new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const endDate = initialEndDate || new Date(today.getFullYear(), today.getMonth() + 5, today.getDate());
    
    return {
      startDate,
      endDate
    };
  }, [initialStartDate, initialEndDate]);

  // === 日期像素转换 - 优化精度版本 ===
  const dateToPixel = useCallback((date: Date): number => {
    // 标准化时间到UTC午夜，避免时区和时间影响
    const normalizedDate = new Date(Date.UTC(
      date.getFullYear(), 
      date.getMonth(), 
      date.getDate()
    ));
    const normalizedStartDate = new Date(Date.UTC(
      dateRange.startDate.getFullYear(), 
      dateRange.startDate.getMonth(), 
      dateRange.startDate.getDate()
    ));
    const normalizedEndDate = new Date(Date.UTC(
      dateRange.endDate.getFullYear(), 
      dateRange.endDate.getMonth(), 
      dateRange.endDate.getDate()
    ));
    
    // 使用UTC时间计算天数差，避免时区造成的精度问题
    const daysDiff = (normalizedDate.getTime() - normalizedStartDate.getTime()) / (24 * 60 * 60 * 1000);
    const totalDays = Math.ceil((normalizedEndDate.getTime() - normalizedStartDate.getTime()) / (24 * 60 * 60 * 1000));
    
    // 基于容器宽度的自适应像素密度计算，如果没有容器宽度则使用默认值
    const pixelPerDay = containerWidth && totalDays > 0 
      ? containerWidth / totalDays 
      : Math.max(1, 80 * zoomLevel);
    
    const pixelPosition = daysDiff * pixelPerDay;
    
    return pixelPosition;
  }, [dateRange, containerWidth, zoomLevel]);

  const pixelToDate = useCallback((pixel: number): Date => {
    
    // 1. 输入参数验证
    if (typeof pixel !== 'number' || isNaN(pixel)) {
      return new Date(dateRange.startDate); // 返回起始日期作为降级方案
    }
    
    // 2. 日期范围验证
    if (isNaN(dateRange.startDate.getTime()) || isNaN(dateRange.endDate.getTime())) {
      return new Date(); // 返回当前时间作为降级方案
    }
    
    const totalDays = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (24 * 60 * 60 * 1000));
    
    // 3. 总天数验证
    if (totalDays <= 0) {
      return new Date(dateRange.startDate); // 返回起始日期
    }
    
    // 基于容器宽度的自适应像素密度计算，如果没有容器宽度则使用默认值
    const pixelPerDay = containerWidth && totalDays > 0 
      ? containerWidth / totalDays 
      : Math.max(1, 80 * zoomLevel);
    
    
    // 4. 像素密度验证
    if (pixelPerDay <= 0 || isNaN(pixelPerDay)) {
      return new Date(dateRange.startDate);
    }
    
    const days = pixel / pixelPerDay;
    const resultTimestamp = dateRange.startDate.getTime() + days * 24 * 60 * 60 * 1000;
    const resultDate = new Date(resultTimestamp);
    
    // 5. 结果验证
    if (isNaN(resultDate.getTime())) {
      return new Date(dateRange.startDate);
    }
    
    // 🔧 修复：对于任务日期，返回整天日期（去除时分秒）
    const normalizedDate = new Date(resultDate.getFullYear(), resultDate.getMonth(), resultDate.getDate());
    
    return normalizedDate;
  }, [dateRange, containerWidth, zoomLevel]);

  // === 使用分层时间轴 ===
  const layeredTimelineResult = useLayeredTimeline(layerConfig, dateRange, dateToPixel);
  
  // === 配置更新函数 ===
  const updateLayerConfig = useCallback((newConfig: Partial<TimelineLayerConfig>) => {
    setLayerConfig(prev => ({
      ...prev,
      ...newConfig
    }));
  }, []);

  // === 缩放控制 ===
  // 注意：当使用容器宽度自适应时，缩放功能将被禁用
  const handleZoomIn = useCallback(() => {
    if (!containerWidth) {
      setZoomLevel(prev => Math.min(prev * 1.2, 1));
    }
  }, [containerWidth]);

  const handleZoomOut = useCallback(() => {
    if (!containerWidth) {
      setZoomLevel(prev => Math.max(prev / 1.2, 0.01));
    }
  }, [containerWidth]);

  const setZoom = useCallback((zoom: number) => {
    if (!containerWidth) {
      setZoomLevel(Math.max(0.01, Math.min(zoom, 1)));
    }
  }, [containerWidth]);

  // === 视图控制 ===
  const handleViewChange = useCallback((view: 'timeline' | 'list' | 'grid') => {
    setCurrentView(view);
  }, []);


  // === 快速导航 ===
  const handleViewToday = useCallback(() => {
    // 这里可以实现滚动到今天的逻辑
    const today = new Date();
    const todayPixel = dateToPixel(today);
    return todayPixel;
  }, [dateToPixel]);

  // === 获取当前日期线位置 ===
  const getCurrentDateLinePosition = useCallback((): number => {
    const today = new Date();
    return dateToPixel(today);
  }, [dateToPixel]);

  // === 检查当前日期是否在范围内 ===
  const isCurrentDateInRange = useCallback((): boolean => {
    const today = new Date();
    return today >= dateRange.startDate && today <= dateRange.endDate;
  }, [dateRange]);

  // === 计算可视区域 ===
  const getVisibleDateRange = useCallback((scrollLeft: number, containerWidth: number) => {
    const startPixel = scrollLeft;
    const endPixel = scrollLeft + containerWidth;
    
    return {
      startDate: pixelToDate(startPixel),
      endDate: pixelToDate(endPixel),
      startPixel,
      endPixel
    };
  }, [pixelToDate]);

  // === 返回统一接口 ===
  return {
    // === 新的分层时间轴数据 ===
    layeredTimeScales: layeredTimelineResult.layeredTimeScales,
    layerConfig,
    updateLayerConfig,
    
    // === 保持现有的其他功能 ===
    zoomLevel,
    currentView,
    dateRange,
    dateToPixel,
    pixelToDate,
    handleZoomIn,
    handleZoomOut,
    setZoom,
    handleViewChange,
    handleViewToday,
    getCurrentDateLinePosition,
    getVisibleDateRange,
    isCurrentDateInRange,
    setZoomLevel,
    setCurrentView
  };
};