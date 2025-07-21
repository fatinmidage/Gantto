import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const menuRef = useRef<HTMLDivElement>(null);

  // 处理点击外部关闭菜单
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  // 菜单尺寸配置
  const menuWidth = 160;
  const menuHeight = 120; // 估算菜单高度 (3个菜单项)
  
  // 边界检测 - 确保菜单不会超出视口
  const adjustedX = x + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : x;
  const adjustedY = y + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : y;

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

  // 菜单内容
  const menuContent = (
    <div
      ref={menuRef}
      className="task-context-menu"
      style={{
        position: 'fixed',
        top: adjustedY,
        left: adjustedX,
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 9999, // 提高z-index确保在最顶层
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

  // 使用Portal将菜单渲染到document.body，绕过CSS层叠上下文限制
  return createPortal(menuContent, document.body);
};

export default TaskContextMenu;