/**
 * 组件统一导出文件
 * 建立 barrel exports 减少相对导入，优化开发体验
 */

// === 主要组件导出 ===
export { default as GanttChart } from './GanttChart';
export { default as LazyGanttChart } from './GanttChartLazy';
export { default as Header } from './Header';
export { default as Toolbar } from './Toolbar';
export { default as TaskIcon, DragHandle } from './TaskIcon';
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as LazyWrapper, createLazyComponent, preloadLazyComponent } from './LazyWrapper';
export { default as DateRangePicker } from './DateRangePicker';
export { default as TimeGranularitySelector } from './TimeGranularitySelector';

// === 甘特图相关组件导出 ===
export * from './gantt';

// === 图标统一导出 ===
export * from './icons';