import React from 'react';
import { createPortal } from 'react-dom';
import { Task, MilestoneNode } from '../../types';
import { formatDateForDisplay, formatDateToMD } from '../../utils/ganttUtils';
import { calculateMenuPosition, getEstimatedMenuDimensions } from '../../utils/menuPositioning';
import { getIconConfig } from '../../config/icons';
import { layoutUtils } from './ganttStyles';

interface GanttContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onCreateTask: (task: Task) => void;
  onCreateMilestone: (milestone: MilestoneNode) => void;
  defaultRowId: string;
  clickPosition?: {
    x: number;
    y: number;
  };
  pixelToDate?: (pixel: number) => Date;
  visibleRows?: Array<{ id: string; title: string; level?: number; isExpanded?: boolean; [key: string]: unknown }>;
  taskHeight?: number;
}

const GanttContextMenu: React.FC<GanttContextMenuProps> = ({
  visible,
  x,
  y,
  onClose,
  onCreateTask,
  onCreateMilestone,
  defaultRowId,
  clickPosition,
  pixelToDate,
  visibleRows = [],
  taskHeight = 22
}) => {
  const menuRef = React.useRef<HTMLDivElement>(null);


  // 监听点击外部区域关闭菜单
  React.useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // 添加事件监听器
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    // 清理函数
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [visible, onClose]);


  if (!visible) return null;


  // 获取菜单尺寸估算
  const menuDimensions = getEstimatedMenuDimensions(2); // 2个菜单项：任务条和节点
  
  // 计算智能定位
  const adjustedPosition = calculateMenuPosition(
    { x, y },
    menuDimensions
  );

  // 计算点击位置的时间信息用于显示
  const clickDate = clickPosition && pixelToDate ? pixelToDate(clickPosition.x) : new Date();

  // 根据点击位置的Y坐标计算目标行ID和类型
  const calculateTargetRowData = () => {
    if (!clickPosition || !visibleRows.length) {
      return { id: defaultRowId, type: undefined };
    }
    
    // 每行的高度包括任务高度 + 间距
    const rowHeight = layoutUtils.calculateRowHeight(taskHeight);
    const clickedRowIndex = Math.floor(clickPosition.y / rowHeight);
    
    // 确保索引在有效范围内
    if (clickedRowIndex >= 0 && clickedRowIndex < visibleRows.length) {
      const targetRow = visibleRows[clickedRowIndex];
      
      // 优先使用 iconType，其次使用 type，提供默认值
      const iconType = (targetRow as any).iconType || (targetRow as any).type || 'circle';
      return { id: targetRow.id, type: iconType };
    } else {
      // 如果点击在空白区域，使用最后一个有效行或默认行
      const fallbackRow = visibleRows.length > 0 ? visibleRows[visibleRows.length - 1] : null;
      const iconType = (fallbackRow as any)?.iconType || (fallbackRow as any)?.type || 'circle';
      const result = fallbackRow 
        ? { id: fallbackRow.id, type: iconType }
        : { id: defaultRowId, type: 'circle' };
      return result;
    }
  };

  const handleCreateTask = () => {
    // 计算点击位置的日期
    const clickDate = clickPosition && pixelToDate ? pixelToDate(clickPosition.x) : new Date();
    
    // 计算目标行ID和类型
    const { id: targetRowId, type: targetRowType } = calculateTargetRowData();
    
    // 根据图标类型获取对应颜色（使用图标配置系统）
    const getIconColor = (iconType: string) => {
      const iconConfig = getIconConfig(iconType);
      return iconConfig.color;
    };
    
    const iconType = targetRowType || 'circle'; // 继承行的类型，默认使用 circle 图标
    const typeColor = getIconColor(iconType); // 使用图标配置的颜色
    
    const newTask: Task = {
      id: `chart-${Date.now()}`,
      title: '新任务',
      startDate: clickDate,
      endDate: new Date(clickDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      color: typeColor, // 使用图标配置的颜色
      x: clickPosition?.x || 0,
      width: undefined, // 🔧 修复：让宽度计算逻辑来处理，不要硬编码为0
      rowId: targetRowId,
      type: 'default', // 🔧 修复：任务类型固定为 'default'，不要使用图标类型
      iconType: iconType, // 设置图标类型（仅用于显示）
      status: 'pending',
      progress: 0
    };
    
    onCreateTask(newTask);
    onClose();
  };

  const handleCreateMilestone = () => {
    // 计算点击位置的日期
    const clickDate = clickPosition && pixelToDate ? pixelToDate(clickPosition.x) : new Date();
    
    // 计算目标行ID和类型
    const { id: targetRowId, type: targetRowType } = calculateTargetRowData();
    
    // 根据图标类型获取对应颜色（使用图标配置系统）
    const getIconColor = (iconType: string) => {
      const iconConfig = getIconConfig(iconType);
      return iconConfig.color;
    };
    
    const iconType = targetRowType || 'circle'; // 继承行的类型，默认使用 circle 图标
    const typeColor = getIconColor(iconType); // 使用图标配置的颜色
    
    const newMilestone: MilestoneNode = {
      id: `milestone-${Date.now()}`,
      title: '新里程碑',
      date: clickDate,
      iconType: iconType,
      label: formatDateToMD(clickDate), // 默认标签为M.D格式日期
      color: typeColor, // 使用图标配置的颜色
      x: clickPosition?.x || 0,
      y: 0, // Y坐标将在渲染时计算
      rowId: targetRowId,
      order: Date.now(),
      isCreatedFromContext: true
    };
    
    onCreateMilestone(newMilestone);
    onClose();
  };

  const menuItemStyle = {
    padding: '8px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #eee'
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = '#f5f5f5';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  const menuContent = (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: adjustedPosition.y,
        left: adjustedPosition.x,
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        minWidth: '150px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={menuItemStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleCreateTask}
      >
        <div>新建任务条</div>
        {clickPosition && pixelToDate && (
          <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
            开始时间: {formatDateForDisplay(clickDate)}
          </div>
        )}
      </div>
      <div
        style={menuItemStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleCreateMilestone}
      >
        <div>新建节点</div>
        {clickPosition && pixelToDate && (
          <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
            时间: {formatDateForDisplay(clickDate)}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
};

export default GanttContextMenu;