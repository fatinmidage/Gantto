// GanttChart 样式常量文件
// 集中管理所有内联样式，提高代码可维护性

// === 布局常量 ===
export const LAYOUT_CONSTANTS = {
  TITLE_COLUMN_WIDTH: 220,
  MIN_TITLE_COLUMN_WIDTH: 220,
  MIN_CONTAINER_HEIGHT: 200,
  TASK_HEIGHT: 30,
  TIMELINE_HEIGHT: 40,
  EDGE_DETECTION_ZONE: 8,
  MIN_TASK_WIDTH: 20,
  ROW_SPACING: 28, // 行间距常量 - 仅用于任务行之间的间距
  TASK_ROW_HEIGHT: 40, // taskHeight + margin (deprecated, use calculateRowHeight instead)
} as const;

// === 颜色常量 ===
export const COLOR_CONSTANTS = {
  // 预定义任务颜色
  AVAILABLE_COLORS: [
    '#4CAF50', '#2196F3', '#FF9800', '#f44336', '#9C27B0',
    '#607D8B', '#795548', '#E91E63', '#00BCD4', '#8BC34A',
    '#FFC107', '#FF5722', '#673AB7', '#3F51B5', '#009688'
  ],
  
  // 系统颜色
  BORDER_COLOR: '#ddd',
  BACKGROUND_COLOR: '#fff',
  PLACEHOLDER_COLOR: '#ccc',
  GRID_LINE_COLOR: '#e0e0e0',
  TODAY_LINE_COLOR: '#ff4444',
  HOVER_COLOR: '#f5f5f5',
  SELECTED_COLOR: '#e3f2fd',
  DRAG_OVERLAY_COLOR: 'rgba(0, 0, 0, 0.1)',
} as const;

// === 组件样式 ===
export const COMPONENT_STYLES = {
  // 甘特图容器
  ganttContainer: {
    display: 'flex',
    border: `1px solid ${COLOR_CONSTANTS.BORDER_COLOR}`,
    backgroundColor: COLOR_CONSTANTS.BACKGROUND_COLOR,
    borderRadius: '8px',
    overflow: 'hidden'
  },
  
  // 甘特图区域
  ganttChartArea: {
    position: 'relative' as const,
    cursor: 'default' as const,
    backgroundColor: 'transparent',
    overflow: 'hidden'
  },
  
  // 拖拽状态样式
  draggingContainer: {
    cursor: 'grabbing' as const
  },
  
  // 任务条基础样式
  taskBar: {
    position: 'absolute' as const,
    borderRadius: '4px',
    cursor: 'pointer' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white',
    overflow: 'hidden',
    whiteSpace: 'nowrap' as const,
    textOverflow: 'ellipsis',
    userSelect: 'none' as const,
    transition: 'all 0.2s ease'
  },
  
  // 任务条悬停样式
  taskBarHover: {
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    transform: 'translateY(-1px)'
  },
  
  // 任务条选中样式
  taskBarSelected: {
    boxShadow: '0 0 0 2px #2196F3',
    zIndex: 10
  },
  
  // 里程碑样式
  milestone: {
    transform: 'rotate(45deg)',
    borderRadius: '2px'
  },
  
  // 时间轴样式
  timelineHeader: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLOR_CONSTANTS.BACKGROUND_COLOR,
    borderBottom: `1px solid ${COLOR_CONSTANTS.BORDER_COLOR}`,
    zIndex: 20
  },
  
  // 网格线样式
  gridLine: {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    width: '1px',
    backgroundColor: COLOR_CONSTANTS.GRID_LINE_COLOR,
    pointerEvents: 'none' as const
  },
  
  // 今日线样式
  todayLine: {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    width: '2px',
    backgroundColor: COLOR_CONSTANTS.TODAY_LINE_COLOR,
    pointerEvents: 'none' as const,
    zIndex: 15
  },
  
  // 拖拽预览样式
  dragPreview: {
    position: 'absolute' as const,
    border: '2px dashed #2196F3',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: '4px',
    pointerEvents: 'none' as const,
    zIndex: 30
  },
  
  // 垂直拖拽指示器
  verticalDragIndicator: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    height: '2px',
    backgroundColor: '#2196F3',
    zIndex: 25
  }
} as const;

// === 任务类型样式 ===
export const TASK_TYPE_STYLES = {
  default: {
    backgroundColor: COLOR_CONSTANTS.AVAILABLE_COLORS[0],
    border: 'none'
  },
  
  milestone: {
    backgroundColor: '#f44336',
    border: 'none',
    transform: 'rotate(45deg)',
    borderRadius: '2px'
  },
  
  development: {
    backgroundColor: '#2196F3',
    border: 'none'
  },
  
  testing: {
    backgroundColor: '#FF9800',
    border: 'none'
  },
  
  delivery: {
    backgroundColor: '#4CAF50',
    border: 'none'
  }
} as const;

// === 任务状态样式 ===
export const TASK_STATUS_STYLES = {
  pending: {
    opacity: 0.7,
    filter: 'grayscale(20%)'
  },
  
  'in-progress': {
    opacity: 1,
    filter: 'none'
  },
  
  completed: {
    opacity: 0.8,
    filter: 'grayscale(50%)',
    textDecoration: 'line-through'
  },
  
  overdue: {
    opacity: 1,
    filter: 'none',
    boxShadow: '0 0 0 2px #f44336'
  }
} as const;

// === 上下文菜单样式 ===
export const CONTEXT_MENU_STYLES = {
  menu: {
    position: 'fixed' as const,
    backgroundColor: COLOR_CONSTANTS.BACKGROUND_COLOR,
    border: `1px solid ${COLOR_CONSTANTS.BORDER_COLOR}`,
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 1000,
    minWidth: '150px',
    padding: '4px 0'
  },
  
  menuItem: {
    padding: '8px 12px',
    cursor: 'pointer' as const,
    fontSize: '14px',
    borderBottom: `1px solid ${COLOR_CONSTANTS.BORDER_COLOR}`,
    '&:hover': {
      backgroundColor: COLOR_CONSTANTS.HOVER_COLOR
    },
    '&:last-child': {
      borderBottom: 'none'
    }
  },
  
  menuItemDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed' as const
  }
} as const;

// === 响应式断点 ===
export const BREAKPOINTS = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1200px'
} as const;

// === 动画常量 ===
export const ANIMATION_CONSTANTS = {
  TRANSITION_DURATION: '0.2s',
  EASING: 'ease',
  HOVER_SCALE: 1.02,
  DRAG_SCALE: 1.05
} as const;

// === 布局计算函数 ===
export const layoutUtils = {
  // 计算行高度 (任务高度 + 间距)
  calculateRowHeight: (taskHeight: number): number => {
    return taskHeight + LAYOUT_CONSTANTS.ROW_SPACING;
  },
  
  // 计算任务在容器中的Y位置 - 确保垂直居中对齐
  calculateTaskY: (rowIndex: number, taskHeight: number): number => {
    return rowIndex * layoutUtils.calculateRowHeight(taskHeight);
  },
  
  // 计算里程碑在容器中的Y位置 (行中心) - 精确居中
  calculateMilestoneY: (rowIndex: number, taskHeight: number): number => {
    const taskY = layoutUtils.calculateTaskY(rowIndex, taskHeight);
    return taskY + taskHeight / 2; // 任务条中心位置
  },
  
  // 计算元素在行内的垂直居中位置
  calculateCenterY: (rowIndex: number, taskHeight: number, elementHeight: number = 0): number => {
    const taskY = layoutUtils.calculateTaskY(rowIndex, taskHeight);
    return taskY + (taskHeight - elementHeight) / 2;
  }
} as const;

// === 工具函数 ===
export const styleUtils = {
  // 获取任务类型样式
  getTaskTypeStyle: (type: string) => {
    return TASK_TYPE_STYLES[type as keyof typeof TASK_TYPE_STYLES] || TASK_TYPE_STYLES.default;
  },
  
  // 获取任务状态样式
  getTaskStatusStyle: (status: string) => {
    return TASK_STATUS_STYLES[status as keyof typeof TASK_STATUS_STYLES] || {};
  },
  
  // 合并样式
  mergeStyles: (...styles: Record<string, unknown>[]) => {
    return Object.assign({}, ...styles);
  },
  
  // 获取响应式样式
  getResponsiveStyle: (breakpoint: keyof typeof BREAKPOINTS) => {
    return `@media (max-width: ${BREAKPOINTS[breakpoint]})`;
  }
} as const;

// === 导出默认样式集合 ===
export default {
  LAYOUT_CONSTANTS,
  COLOR_CONSTANTS,
  COMPONENT_STYLES,
  TASK_TYPE_STYLES,
  TASK_STATUS_STYLES,
  CONTEXT_MENU_STYLES,
  BREAKPOINTS,
  ANIMATION_CONSTANTS,
  layoutUtils,
  styleUtils
} as const;