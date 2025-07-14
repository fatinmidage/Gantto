import React from 'react';
import { Task } from '../../types';

interface GanttContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onCreateTask: (task: Task) => void;
  onCreateMilestone: (milestone: Task) => void;
  defaultRowId: string;
}

const GanttContextMenu: React.FC<GanttContextMenuProps> = ({
  visible,
  x,
  y,
  onClose,
  onCreateTask,
  onCreateMilestone,
  defaultRowId
}) => {
  if (!visible) return null;

  const handleCreateTask = () => {
    const newTask: Task = {
      id: `chart-${Date.now()}`,
      title: '新任务',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      color: '#9C27B0',
      x: 0,
      width: 0,
      rowId: defaultRowId,
      type: 'default',
      status: 'pending',
      progress: 0
    };
    onCreateTask(newTask);
    onClose();
  };

  const handleCreateMilestone = () => {
    const newMilestone: Task = {
      id: `milestone-${Date.now()}`,
      title: '新里程碑',
      startDate: new Date(),
      endDate: new Date(),
      color: '#FFD700',
      x: 0,
      width: 0,
      rowId: defaultRowId,
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

  return (
    <div
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
        新建任务条
      </div>
      <div
        style={menuItemStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleCreateMilestone}
      >
        新建节点
      </div>
    </div>
  );
};

export default GanttContextMenu;