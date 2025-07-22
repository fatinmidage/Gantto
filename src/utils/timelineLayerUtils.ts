/**
 * 时间轴分层工具函数
 * 支持2层/3层时间轴的生成和管理
 */

// 时间颗粒度类型
export type TimeGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year';

// 日期范围接口
interface DateRange {
  startDate: Date;
  endDate: Date;
}

// 时间刻度项接口
export interface TimeScaleItem {
  type: TimeGranularity;
  label: string;
  x: number;
  width: number;
  startDate: Date;
  endDate: Date;
}

// 时间刻度层接口
export interface TimeScaleLayer {
  type: TimeGranularity;
  items: TimeScaleItem[];
  height: number;
  level: number; // 0=底层, 1=中层, 2=顶层
}

// 分层时间刻度接口
export interface LayeredTimeScale {
  layers: TimeScaleLayer[];
  totalHeight: number;
}

// 时间轴层次配置接口
export interface TimelineLayerConfig {
  layers: 2 | 3;
  bottom: TimeGranularity;
  middle?: TimeGranularity;  // 2层时为上层，3层时为中层
  top?: TimeGranularity;     // 仅3层时需要
}

// 标签格式映射
const GRANULARITY_LABEL_FORMATTERS = {
  day: (date: Date) => date.getDate().toString(),
  week: (date: Date) => {
    const weekNum = getWeekOfYear(date);
    return `WK${weekNum}`;
  },
  month: (date: Date) => (date.getMonth() + 1).toString(),
  quarter: (date: Date) => `Q${Math.floor(date.getMonth() / 3) + 1}`,
  year: (date: Date) => date.getFullYear().toString()
};

/**
 * 获取年内周数（周一开始）
 */
export const getWeekOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const day = Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
  const startDay = start.getDay() || 7; // 周日=7
  return Math.ceil((day + startDay - 2) / 7);
};

/**
 * 生成日期项
 */
const generateDayItems = (
  items: TimeScaleItem[], 
  dateRange: DateRange, 
  dateToPixel: (date: Date) => number, 
  formatter: (date: Date) => string
) => {
  for (let d = new Date(dateRange.startDate); d <= dateRange.endDate; d.setDate(d.getDate() + 1)) {
    const currentDate = new Date(d);
    const nextDate = new Date(d.getTime() + 24 * 60 * 60 * 1000);
    const x = dateToPixel(currentDate);
    const nextX = dateToPixel(nextDate);
    
    items.push({
      type: 'day',
      label: formatter(currentDate),
      x,
      width: nextX - x,
      startDate: currentDate,
      endDate: nextDate
    });
  }
};

/**
 * 生成周项
 */
const generateWeekItems = (
  items: TimeScaleItem[], 
  dateRange: DateRange, 
  dateToPixel: (date: Date) => number, 
  formatter: (date: Date) => string
) => {
  const weekStart = new Date(dateRange.startDate);
  // 调整到周一开始
  const dayOfWeek = weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1;
  weekStart.setDate(weekStart.getDate() - dayOfWeek);
  
  for (let d = new Date(weekStart); d <= dateRange.endDate; d.setDate(d.getDate() + 7)) {
    const currentWeek = new Date(d);
    const nextWeek = new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000);
    const x = dateToPixel(currentWeek);
    const nextX = dateToPixel(nextWeek);
    
    items.push({
      type: 'week',
      label: formatter(currentWeek),
      x,
      width: nextX - x,
      startDate: currentWeek,
      endDate: nextWeek
    });
  }
};

/**
 * 生成月项
 */
const generateMonthItems = (
  items: TimeScaleItem[], 
  dateRange: DateRange, 
  dateToPixel: (date: Date) => number, 
  formatter: (date: Date) => string
) => {
  const monthStart = new Date(dateRange.startDate.getFullYear(), dateRange.startDate.getMonth(), 1);
  
  for (let d = new Date(monthStart); d <= dateRange.endDate; d.setMonth(d.getMonth() + 1)) {
    const currentMonth = new Date(d);
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const x = dateToPixel(currentMonth);
    const nextX = dateToPixel(nextMonth);
    
    items.push({
      type: 'month',
      label: formatter(currentMonth),
      x,
      width: nextX - x,
      startDate: currentMonth,
      endDate: nextMonth
    });
  }
};

/**
 * 生成季度项
 */
const generateQuarterItems = (
  items: TimeScaleItem[], 
  dateRange: DateRange, 
  dateToPixel: (date: Date) => number, 
  formatter: (date: Date) => string
) => {
  const quarterStart = new Date(dateRange.startDate.getFullYear(), Math.floor(dateRange.startDate.getMonth() / 3) * 3, 1);
  
  for (let d = new Date(quarterStart); d <= dateRange.endDate; d.setMonth(d.getMonth() + 3)) {
    const currentQuarter = new Date(d);
    const nextQuarter = new Date(d.getFullYear(), d.getMonth() + 3, 1);
    const x = dateToPixel(currentQuarter);
    const nextX = dateToPixel(nextQuarter);
    
    items.push({
      type: 'quarter',
      label: formatter(currentQuarter),
      x,
      width: nextX - x,
      startDate: currentQuarter,
      endDate: nextQuarter
    });
  }
};

/**
 * 生成年项
 */
const generateYearItems = (
  items: TimeScaleItem[], 
  dateRange: DateRange, 
  dateToPixel: (date: Date) => number, 
  formatter: (date: Date) => string
) => {
  const yearStart = new Date(dateRange.startDate.getFullYear(), 0, 1);
  
  for (let d = new Date(yearStart); d <= dateRange.endDate; d.setFullYear(d.getFullYear() + 1)) {
    const currentYear = new Date(d);
    const nextYear = new Date(d.getFullYear() + 1, 0, 1);
    const x = dateToPixel(currentYear);
    const nextX = dateToPixel(nextYear);
    
    items.push({
      type: 'year',
      label: formatter(currentYear),
      x,
      width: nextX - x,
      startDate: currentYear,
      endDate: nextYear
    });
  }
};

/**
 * 生成单层时间刻度
 */
export const generateTimeScaleLayer = (
  granularity: TimeGranularity,
  level: number,
  height: number,
  dateRange: DateRange,
  dateToPixel: (date: Date) => number
): TimeScaleLayer => {
  const items: TimeScaleItem[] = [];
  const formatter = GRANULARITY_LABEL_FORMATTERS[granularity];

  // 根据颗粒度类型生成时间项
  switch (granularity) {
    case 'day':
      generateDayItems(items, dateRange, dateToPixel, formatter);
      break;
    case 'week':
      generateWeekItems(items, dateRange, dateToPixel, formatter);
      break;
    case 'month':
      generateMonthItems(items, dateRange, dateToPixel, formatter);
      break;
    case 'quarter':
      generateQuarterItems(items, dateRange, dateToPixel, formatter);
      break;
    case 'year':
      generateYearItems(items, dateRange, dateToPixel, formatter);
      break;
  }

  return {
    type: granularity,
    items,
    height,
    level
  };
};

/**
 * 生成分层时间刻度
 */
export const generateLayeredTimeScales = (
  config: TimelineLayerConfig,
  dateRange: DateRange,
  dateToPixel: (date: Date) => number
): LayeredTimeScale => {
  const layers: TimeScaleLayer[] = [];
  const layerHeight = 55 / config.layers; // 等高分配

  // 生成各层时间刻度
  if (config.layers === 2) {
    layers.push(
      generateTimeScaleLayer(config.middle!, 0, layerHeight, dateRange, dateToPixel),
      generateTimeScaleLayer(config.bottom, 1, layerHeight, dateRange, dateToPixel)
    );
  } else if (config.layers === 3) {
    layers.push(
      generateTimeScaleLayer(config.top!, 0, layerHeight, dateRange, dateToPixel),
      generateTimeScaleLayer(config.middle!, 1, layerHeight, dateRange, dateToPixel),
      generateTimeScaleLayer(config.bottom, 2, layerHeight, dateRange, dateToPixel)
    );
  }

  return {
    layers,
    totalHeight: 55
  };
};