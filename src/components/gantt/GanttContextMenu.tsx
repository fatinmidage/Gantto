import React from 'react';
import { createPortal } from 'react-dom';
import { Task } from '../../types';
import { formatDateForDisplay } from '../../utils/ganttUtils';

interface GanttContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onCreateTask: (task: Task) => void;
  onCreateMilestone: (milestone: Task) => void;
  defaultRowId: string;
  clickPosition?: {
    x: number;
    y: number;
  };
  pixelToDate?: (pixel: number) => Date;
  visibleRows?: Array<{ id: string; [key: string]: any }>;
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
  taskHeight = 30
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

  // 计算点击位置的时间信息用于显示
  const clickDate = clickPosition && pixelToDate ? pixelToDate(clickPosition.x) : new Date();

  // 根据点击位置的Y坐标计算目标行ID
  const calculateTargetRowId = () => {
    if (!clickPosition || !visibleRows.length) {
      return defaultRowId;
    }
    
    // 每行的高度包括任务高度 + 10px间距
    const rowHeight = taskHeight + 10;
    const clickedRowIndex = Math.floor(clickPosition.y / rowHeight);
    
    // 确保索引在有效范围内
    if (clickedRowIndex >= 0 && clickedRowIndex < visibleRows.length) {
      return visibleRows[clickedRowIndex].id;
    } else {
      return defaultRowId;
    }
  };

  const handleCreateTask = () => {
    // 计算点击位置的日期
    const clickDate = clickPosition && pixelToDate ? pixelToDate(clickPosition.x) : new Date();
    
    // 计算目标行ID
    const targetRowId = calculateTargetRowId();
    
    const newTask: Task = {
      id: `chart-${Date.now()}`,
      title: '新任务',
      startDate: clickDate,
      endDate: new Date(clickDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      color: '#9C27B0',
      x: clickPosition?.x || 0,
      width: 0,
      rowId: targetRowId,
      type: 'default',
      status: 'pending',
      progress: 0
    };
    
    onCreateTask(newTask);
    onClose();
  };

  const handleCreateMilestone = () => {
    // 计算点击位置的日期
    const clickDate = clickPosition && pixelToDate ? pixelToDate(clickPosition.x) : new Date();
    
    // 计算目标行ID（与新任务条逻辑相同）
    const targetRowId = calculateTargetRowId();
    
    const newMilestone: Task = {
      id: `milestone-${Date.now()}`,
      title: '新里程碑',
      startDate: clickDate,
      endDate: clickDate,
      color: '#FFD700',
      x: clickPosition?.x || 0,
      width: 20, // 里程碑默认宽度
      rowId: targetRowId,
      type: 'milestone',
      status: 'pending',
      progress: 0
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
        top: y,
        left: x,
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