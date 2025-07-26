/**
 * 任务标题右键菜单组件
 * 专门用于任务标题列的右键菜单，包含名称编辑和图标选择功能
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Task } from '../../types';
import { TaskIcon } from '..';
import { IconType } from '../../types/common';
import TaskIconSelector from './TaskIconSelector';
import { calculateMenuPosition, getEstimatedMenuDimensions } from '../../utils/menuPositioning';

interface TaskTitleContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  taskId?: string;
  task?: Task;
  onClose: () => void;
  onNameEdit: (taskId: string) => void;
  onIconChange: (taskId: string, iconType: IconType) => void;
}

const TaskTitleContextMenu: React.FC<TaskTitleContextMenuProps> = ({
  visible,
  x,
  y,
  taskId,
  task,
  onClose,
  onNameEdit,
  onIconChange
}) => {
  const [showIconSelector, setShowIconSelector] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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


  if (!visible || !taskId || !task) return null;

  // 主菜单智能定位
  const mainMenuDimensions = getEstimatedMenuDimensions(2); // 2个菜单项：名称编辑和图标选择
  const mainMenuPosition = calculateMenuPosition(
    { x, y },
    mainMenuDimensions
  );
  
  
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: mainMenuPosition.y,
    left: mainMenuPosition.x,
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 9999, // 提高z-index确保在最顶层
    minWidth: '160px',
    overflow: 'hidden'
  };

  const menuItemStyle: React.CSSProperties = {
    padding: '10px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid #eee',
    fontSize: '14px'
  };

  // 处理名称编辑
  const handleNameEdit = () => {
    onNameEdit(taskId);
    onClose();
  };

  // 处理图标选择器显示
  const handleShowIconSelector = () => {
    setShowIconSelector(true);
  };

  // 处理图标选择
  const handleIconSelect = (iconType: IconType) => {
    onIconChange(taskId, iconType);
    setShowIconSelector(false);
    onClose();
  };

  // 处理图标选择器关闭
  const handleIconSelectorClose = () => {
    setShowIconSelector(false);
  };

  // 使用Portal将菜单渲染到document.body，绕过CSS层叠上下文限制
  const menuContent = (
    <>
      {/* 主菜单 */}
      <div
        ref={menuRef}
        className="task-title-context-menu"
        style={menuStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 更改任务名称 */}
        <div
          className="menu-item"
          style={menuItemStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={handleNameEdit}
        >
          <span style={{ fontSize: '12px' }}>✏️</span>
          更改任务名称
        </div>
        
        {/* 更改任务图标 */}
        <div
          className="menu-item"
          style={{
            ...menuItemStyle,
            borderBottom: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={handleShowIconSelector}
        >
          <TaskIcon iconType={task.iconType || task.type} size={16} />
          更改任务图标
        </div>
      </div>

      {/* 图标选择器 */}
      {showIconSelector && (
        <TaskIconSelector
          currentIconType={task.iconType || task.type || 'default'}
          onIconTypeChange={handleIconSelect}
          onClose={handleIconSelectorClose}
          position={{ x: mainMenuPosition.x + 200, y: mainMenuPosition.y }}
        />
      )}
    </>
  );

  // 使用Portal将菜单渲染到document.body
  return createPortal(menuContent, document.body);
};

export default TaskTitleContextMenu;