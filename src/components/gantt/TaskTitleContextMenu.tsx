/**
 * 任务标题右键菜单组件
 * 专门用于任务标题列的右键菜单，包含名称编辑和图标选择功能
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Task } from '../../types';
import { TaskIcon } from '..';
import { IconType } from '../../types/common';
import { calculateMenuPosition, getEstimatedMenuDimensions, calculateSubmenuPosition } from '../../utils/menuPositioning';
import { AVAILABLE_ICONS } from '../../config/icons';

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
  const [showIconSubmenu, setShowIconSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const showSubmenuTimeoutRef = useRef<number | null>(null);
  const hideSubmenuTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInMenu = menuRef.current && menuRef.current.contains(target);
      const clickedInSubmenu = submenuRef.current && submenuRef.current.contains(target);
      
      if (!clickedInMenu && !clickedInSubmenu) {
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
      
      // 清理定时器
      if (showSubmenuTimeoutRef.current !== null) {
        clearTimeout(showSubmenuTimeoutRef.current);
      }
      if (hideSubmenuTimeoutRef.current !== null) {
        clearTimeout(hideSubmenuTimeoutRef.current);
      }
    };
  }, [visible, onClose]);


  if (!visible || !taskId || !task) return null;

  // 主菜单智能定位
  const mainMenuDimensions = getEstimatedMenuDimensions(2); // 2个菜单项：名称编辑和图标选择
  const mainMenuPosition = calculateMenuPosition(
    { x, y },
    mainMenuDimensions
  );
  
  // 子菜单智能定位
  const submenuDimensions = { width: 260, height: 150 }; // 预估子菜单尺寸（宽度260px适配4列图标，删除标题后减少高度）
  const iconItemOffset = 44; // "更改任务图标"菜单项的垂直偏移（第二个菜单项）
  const submenuPosition = calculateSubmenuPosition(
    mainMenuPosition,
    mainMenuDimensions,
    submenuDimensions,
    iconItemOffset
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

  // 处理图标子菜单悬停显示
  const handleIconMenuEnter = () => {
    // 清除隐藏定时器
    if (hideSubmenuTimeoutRef.current !== null) {
      clearTimeout(hideSubmenuTimeoutRef.current);
      hideSubmenuTimeoutRef.current = null;
    }
    
    // 设置显示定时器
    showSubmenuTimeoutRef.current = window.setTimeout(() => {
      setShowIconSubmenu(true);
    }, 300);
  };

  // 处理图标子菜单悬停离开
  const handleIconMenuLeave = () => {
    // 清除显示定时器
    if (showSubmenuTimeoutRef.current !== null) {
      clearTimeout(showSubmenuTimeoutRef.current);
      showSubmenuTimeoutRef.current = null;
    }
    
    // 设置隐藏定时器
    hideSubmenuTimeoutRef.current = window.setTimeout(() => {
      setShowIconSubmenu(false);
    }, 500);
  };

  // 处理子菜单区域悬停
  const handleSubmenuEnter = () => {
    // 清除隐藏定时器
    if (hideSubmenuTimeoutRef.current !== null) {
      clearTimeout(hideSubmenuTimeoutRef.current);
      hideSubmenuTimeoutRef.current = null;
    }
  };

  // 处理子菜单区域离开
  const handleSubmenuLeave = () => {
    // 设置隐藏定时器
    hideSubmenuTimeoutRef.current = window.setTimeout(() => {
      setShowIconSubmenu(false);
    }, 500);
  };

  // 处理图标选择
  const handleIconSelect = (iconType: IconType) => {
    onIconChange(taskId, iconType);
    setShowIconSubmenu(false);
    onClose();
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
            handleIconMenuEnter();
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            handleIconMenuLeave();
          }}
        >
          <TaskIcon iconType={task.iconType || task.type} size={16} />
          更改任务图标
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#999' }}>▶</span>
        </div>
      </div>

      {/* 图标子菜单 */}
      {showIconSubmenu && (
        <div
          ref={submenuRef}
          style={{
            position: 'fixed',
            top: submenuPosition.y,
            left: submenuPosition.x,
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 10000,
            width: '260px',
            padding: '12px',
            opacity: showIconSubmenu ? 1 : 0,
            transform: showIconSubmenu ? 'scale(1)' : 'scale(0.95)',
            transition: 'all 150ms ease-in-out'
          }}
          onMouseEnter={handleSubmenuEnter}
          onMouseLeave={handleSubmenuLeave}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 图标网格 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px'
          }}>
            {AVAILABLE_ICONS.map((icon) => (
              <div
                key={icon.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 4px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: (task.iconType || task.type) === icon.id ? '#eff6ff' : 'transparent',
                  border: (task.iconType || task.type) === icon.id ? '1px solid #3b82f6' : '1px solid transparent',
                  transition: 'all 150ms ease-in-out'
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleIconSelect(icon.id);
                }}
                title={icon.label}
                onMouseEnter={(e) => {
                  if ((task.iconType || task.type) !== icon.id) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if ((task.iconType || task.type) !== icon.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <TaskIcon iconType={icon.id} size={16} />
                <span style={{
                  fontSize: '10px',
                  color: '#6b7280',
                  textAlign: 'center',
                  lineHeight: '1.2',
                  marginTop: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%'
                }}>
                  {icon.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  // 使用Portal将菜单渲染到document.body
  return createPortal(menuContent, document.body);
};

export default TaskTitleContextMenu;