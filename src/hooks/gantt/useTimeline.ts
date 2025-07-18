import { useState, useCallback, useMemo, useEffect } from 'react';

// 时间轴状态接口（内部使用）
// interface TimelineState {
//   scale: number;
//   startDate: Date;
//   endDate: Date;
//   pixelsPerDay: number;
// }

// 日期范围接口
interface DateRange {
  startDate: Date;
  endDate: Date;
  totalDays: number;
  pixelPerDay: number;
}

// 时间刻度接口
interface TimeScale {
  type: 'day' | 'week' | 'month' | 'quarter' | 'year';
  label: string;
  x: number;
  width: number;
}

// 时间颗粒度类型
export type TimeGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year';

// 时间轴管理Hook
export const useTimeline = (initialStartDate?: Date, initialEndDate?: Date, initialTimeGranularity?: TimeGranularity, containerWidth?: number) => {
  // === 基础状态 ===
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentView, setCurrentView] = useState<'timeline' | 'list' | 'grid'>('timeline');
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>(initialTimeGranularity || 'month');
  
  // 同步外部传入的时间颗粒度
  useEffect(() => {
    if (initialTimeGranularity && initialTimeGranularity !== timeGranularity) {
      setTimeGranularity(initialTimeGranularity);
    }
  }, [initialTimeGranularity, timeGranularity]);
  
  // === 计算日期范围 ===
  const dateRange = useMemo((): DateRange => {
    // 直接使用传入的日期参数，如果没有传入则使用默认值
    const start = initialStartDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = initialEndDate || new Date(Date.now() + 150 * 24 * 60 * 60 * 1000);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    
    // 基于容器宽度的自适应像素密度计算，如果没有容器宽度则使用默认值
    const pixelPerDay = containerWidth && totalDays > 0 
      ? containerWidth / totalDays 
      : Math.max(1, 80 * zoomLevel);
    
    return {
      startDate: start,
      endDate: end,
      totalDays,
      pixelPerDay
    };
  }, [initialStartDate, initialEndDate, containerWidth, zoomLevel]);

  // === 日期像素转换 ===
  const dateToPixel = useCallback((date: Date): number => {
    const daysDiff = (date.getTime() - dateRange.startDate.getTime()) / (24 * 60 * 60 * 1000);
    return daysDiff * dateRange.pixelPerDay;
  }, [dateRange]);

  const pixelToDate = useCallback((pixel: number): Date => {
    const days = pixel / dateRange.pixelPerDay;
    return new Date(dateRange.startDate.getTime() + days * 24 * 60 * 60 * 1000);
  }, [dateRange]);

  // === 时间刻度生成 ===
  const timeScales = useMemo((): TimeScale[] => {
    const scales: TimeScale[] = [];
    const startDate = dateRange.startDate;
    const endDate = dateRange.endDate;
    const pixelPerDay = dateRange.pixelPerDay;

    // 使用手动选择的时间颗粒度
    const scaleType = timeGranularity;

    if (scaleType === 'day') {
      // 按天显示
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const x = dateToPixel(new Date(d));
        scales.push({
          type: 'day',
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          x,
          width: pixelPerDay
        });
      }
    } else if (scaleType === 'week') {
      // 按周显示
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // 调整到周一
      
      for (let d = new Date(weekStart); d <= endDate; d.setDate(d.getDate() + 7)) {
        const x = dateToPixel(new Date(d));
        const weekEnd = new Date(d);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        scales.push({
          type: 'week',
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          x,
          width: pixelPerDay * 7
        });
      }
    } else if (scaleType === 'month') {
      // 按月显示
      const monthStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      
      for (let d = new Date(monthStart); d <= endDate; d.setMonth(d.getMonth() + 1)) {
        const x = dateToPixel(new Date(d));
        const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const daysInMonth = (nextMonth.getTime() - d.getTime()) / (24 * 60 * 60 * 1000);
        
        scales.push({
          type: 'month',
          label: `${d.getFullYear()}/${d.getMonth() + 1}`,
          x,
          width: pixelPerDay * daysInMonth
        });
      }
    } else if (scaleType === 'quarter') {
      // 按季度显示
      const quarterStart = new Date(startDate.getFullYear(), Math.floor(startDate.getMonth() / 3) * 3, 1);
      
      for (let d = new Date(quarterStart); d <= endDate; d.setMonth(d.getMonth() + 3)) {
        const x = dateToPixel(new Date(d));
        const nextQuarter = new Date(d.getFullYear(), d.getMonth() + 3, 1);
        const daysInQuarter = (nextQuarter.getTime() - d.getTime()) / (24 * 60 * 60 * 1000);
        const quarter = Math.floor(d.getMonth() / 3) + 1;
        
        scales.push({
          type: 'quarter',
          label: `${d.getFullYear()}Q${quarter}`,
          x,
          width: pixelPerDay * daysInQuarter
        });
      }
    } else if (scaleType === 'year') {
      // 按年显示
      const yearStart = new Date(startDate.getFullYear(), 0, 1);
      
      for (let d = new Date(yearStart); d <= endDate; d.setFullYear(d.getFullYear() + 1)) {
        const x = dateToPixel(new Date(d));
        const nextYear = new Date(d.getFullYear() + 1, 0, 1);
        const daysInYear = (nextYear.getTime() - d.getTime()) / (24 * 60 * 60 * 1000);
        
        scales.push({
          type: 'year',
          label: `${d.getFullYear()}`,
          x,
          width: pixelPerDay * daysInYear
        });
      }
    }

    return scales;
  }, [dateRange, dateToPixel, timeGranularity]);

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

  // === 时间颗粒度控制 ===
  const handleTimeGranularityChange = useCallback((granularity: TimeGranularity) => {
    setTimeGranularity(granularity);
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

  return {
    // === 状态 ===
    zoomLevel,
    currentView,
    timeGranularity,
    dateRange,
    timeScales,
    
    // === 转换方法 ===
    dateToPixel,
    pixelToDate,
    
    // === 控制方法 ===
    handleZoomIn,
    handleZoomOut,
    setZoom,
    handleViewChange,
    handleViewToday,
    handleTimeGranularityChange,
    
    // === 工具方法 ===
    getCurrentDateLinePosition,
    getVisibleDateRange,
    isCurrentDateInRange,
    
    // === 状态设置器 ===
    setZoomLevel,
    setCurrentView,
    setTimeGranularity
  };
};