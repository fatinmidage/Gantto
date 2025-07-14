import React from 'react';
import { Task } from '../../types';

interface TaskContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  taskId?: string;
  task?: Task;
  onClose: () => void;
  onColorChange: (taskId: string) => void;
  onTagManage: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

const TaskContextMenu: React.FC<TaskContextMenuProps> = ({
  visible,
  x,
  y,
  taskId,
  task,
  onClose,
  onColorChange,
  onTagManage,
  onDelete
}) => {
  if (!visible) return null;

  const menuItemStyle = {
    padding: '10px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid #eee',
    fontSize: '14px'
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = '#f5f5f5';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  const handleDeleteMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = '#ffebee';
  };

  const handleDeleteMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  const handleColorChange = () => {
    if (taskId) {
      onColorChange(taskId);
      onClose();
    }
  };

  const handleTagManage = () => {
    if (taskId) {
      onTagManage(taskId);
      onClose();
    }
  };

  const handleDelete = () => {
    if (taskId) {
      onDelete(taskId);
      onClose();
    }
  };

  return (
    <div
      className="task-context-menu"
      style={{
        position: 'fixed',
        top: y,
        left: x,
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        minWidth: '160px',
        overflow: 'hidden'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="menu-item"
        style={menuItemStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleColorChange}
      >
        <div style={{ width: '16px', height: '16px', backgroundColor: task?.color || '#4CAF50', borderRadius: '50%' }} />
        更改颜色
      </div>
      
      <div
        className="menu-item"
        style={menuItemStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleTagManage}
      >
        <span style={{ fontSize: '12px' }}>🏷️</span>
        管理标签
      </div>
      
      <div
        className="menu-item"
        style={{
          ...menuItemStyle,
          color: '#f44336',
          borderBottom: 'none'
        }}
        onMouseEnter={handleDeleteMouseEnter}
        onMouseLeave={handleDeleteMouseLeave}
        onClick={handleDelete}
      >
        <span style={{ fontSize: '12px' }}>🗑️</span>
        删除任务
      </div>
    </div>
  );
};

export default TaskContextMenu;