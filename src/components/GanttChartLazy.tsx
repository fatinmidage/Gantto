/**
 * GanttChart 的 Lazy Loading 版本
 * 支持动态加载，优化首屏加载性能
 */

import { createLazyComponent, preloadLazyComponent } from './LazyWrapper';

// 动态导入 GanttChart 组件
const importGanttChart = () => import('./GanttChart');

// 创建 Lazy GanttChart 组件
export const LazyGanttChart = createLazyComponent(
  importGanttChart,
  {
    displayName: 'GanttChart',
    fallback: (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '400px',
        fontSize: '16px',
        color: '#6b7280'
      }}>
        <div>
          <div style={{ marginBottom: '16px', textAlign: 'center' }}>📊</div>
          <div>加载甘特图组件...</div>
        </div>
      </div>
    ),
    errorFallback: (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '400px',
        fontSize: '16px',
        color: '#ef4444',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: '16px' }}>⚠️</div>
        <div style={{ marginBottom: '16px' }}>甘特图组件加载失败</div>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          重新加载
        </button>
      </div>
    )
  }
);

// 导出预加载函数，可以在应用启动时调用
export const preloadGanttChart = () => {
  preloadLazyComponent(importGanttChart);
};

// 设置组件的 displayName
LazyGanttChart.displayName = 'LazyGanttChart';

export default LazyGanttChart;