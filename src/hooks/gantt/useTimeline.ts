import { useState, useCallback, useMemo } from 'react';

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
  type: 'day' | 'week' | 'month';
  label: string;
  x: number;
  width: number;
}

// 时间轴管理Hook
export const useTimeline = (initialStartDate?: Date, initialEndDate?: Date) => {
  // === 基础状态 ===
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentView, setCurrentView] = useState<'timeline' | 'list' | 'grid'>('timeline');
  
  // === 计算日期范围 ===
  const dateRange = useMemo((): DateRange => {
    const start = initialStartDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = initialEndDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    const pixelPerDay = Math.max(1, 80 * zoomLevel);
    
    return {
      startDate: start,
      endDate: end,
      totalDays,
      pixelPerDay
    };
  }, [initialStartDate, initialEndDate, zoomLevel]);

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

    // 根据缩放级别决定时间刻度类型
    const scaleType = pixelPerDay > 35 ? 'day' : pixelPerDay > 3 ? 'week' : 'month';

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
    } else {
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
    }

    return scales;
  }, [dateRange, dateToPixel]);

  // === 缩放控制 ===
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.2, 1));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.01));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setZoomLevel(Math.max(0.01, Math.min(zoom, 1)));
  }, []);

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
    
    // === 工具方法 ===
    getCurrentDateLinePosition,
    getVisibleDateRange,
    
    // === 状态设置器 ===
    setZoomLevel,
    setCurrentView
  };
};