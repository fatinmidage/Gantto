/**
 * 时间轴相关类型定义
 * 包含时间轴显示和计算相关的类型
 */

import { DateRange } from './common';

// 时间轴配置
export interface TimelineConfig {
  // 显示范围
  startDate: Date;
  endDate: Date;
  
  // 缩放设置
  zoomLevel: number; // 1-10，数字越大显示越详细
  pixelsPerDay: number; // 每天对应的像素数
  
  // 显示选项
  showWeekends: boolean;
  showCurrentDate: boolean;
  showHolidays: boolean;
  
  // 工作时间设置
  workingDays: number[]; // 0-6，周日为0
  workingHours: {
    start: number; // 小时数，如 9 表示 9:00
    end: number;   // 小时数，如 18 表示 18:00
  };
  
  // 时间格式
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
  timeFormat: '24h' | '12h';
  
  // 网格设置
  majorGridInterval: 'day' | 'week' | 'month';
  minorGridInterval: 'hour' | 'day' | 'week';
}

// 时间轴度量单位
export type TimeUnit = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

// 时间轴刻度
export interface TimelineScale {
  unit: TimeUnit;
  interval: number; // 间隔数量，如 2 表示每2个单位
  format: string;   // 显示格式
  majorTicks: TimelineTick[];
  minorTicks: TimelineTick[];
}

// 时间轴刻度点
export interface TimelineTick {
  date: Date;
  position: number; // x坐标位置
  label: string;
  isMajor: boolean;
  isWeekend?: boolean;
  isHoliday?: boolean;
}

// 时间轴度量工具
export interface TimelineMetrics {
  // 基础度量
  totalDays: number;
  totalWorkingDays: number;
  totalPixels: number;
  
  // 换算函数
  dateToPixel: (date: Date) => number;
  pixelToDate: (pixel: number) => Date;
  
  // 工期计算
  calculateDuration: (startDate: Date, endDate: Date) => number;
  calculateWorkingDays: (startDate: Date, endDate: Date) => number;
  
  // 日期调整
  addWorkingDays: (date: Date, days: number) => Date;
  getNextWorkingDay: (date: Date) => Date;
  getPreviousWorkingDay: (date: Date) => Date;
}

// 时间轴事件
export interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  description?: string;
  type: 'milestone' | 'holiday' | 'deadline' | 'meeting' | 'custom';
  color: string;
  position: number; // x坐标
}

// 时间轴视口
export interface TimelineViewport {
  startDate: Date;
  endDate: Date;
  startPixel: number;
  endPixel: number;
  visibleWidth: number;
  scrollLeft: number;
}

// 时间轴导航
export interface TimelineNavigation {
  // 缩放控制
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  zoomToSelection: (startDate: Date, endDate: Date) => void;
  
  // 滚动控制
  scrollToDate: (date: Date) => void;
  scrollToToday: () => void;
  scrollToTask: (taskId: string) => void;
  
  // 视图预设
  setViewRange: (range: DateRange) => void;
  setPresetView: (preset: 'today' | 'week' | 'month' | 'quarter' | 'year') => void;
}

// 时间轴渲染选项
export interface TimelineRenderOptions {
  // 画布设置
  canvasWidth: number;
  canvasHeight: number;
  
  // 样式设置
  backgroundColor: string;
  gridColor: string;
  textColor: string;
  highlightColor: string;
  
  // 字体设置
  fontSize: number;
  fontFamily: string;
  
  // 间距设置
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  
  // 渲染优化
  enableCaching: boolean;
  enableClipping: boolean;
  enableAntiAliasing: boolean;
}