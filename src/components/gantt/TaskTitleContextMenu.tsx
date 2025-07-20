/**
 * 任务标题右键菜单组件
 * 专门用于任务标题列的右键菜单，包含名称编辑和图标选择功能
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Task } from '../../types';
import { TaskIcon } from '..';

interface TaskTitleContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  taskId?: string;
  task?: Task;
  onClose: () => void;
  onNameEdit: (taskId: string) => void;
  onIconChange: (taskId: string, iconType: 'milestone' | 'development' | 'testing' | 'delivery' | 'default') => void;
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
  const iconSubmenuRef = useRef<HTMLDivElement>(null);

  // 图标类型选项
  const iconTypes = [
    { type: 'default' as const, label: '默认任务' },
    { type: 'milestone' as const, label: '里程碑' },
    { type: 'development' as const, label: '开发' },
    { type: 'testing' as const, label: '测试' },
    { type: 'delivery' as const, label: '交付' }
  ];

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        (!iconSubmenuRef.current || !iconSubmenuRef.current.contains(event.target as Node))
      ) {
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

  // 菜单样式 - 添加边界检测以确保菜单不会超出视口
  const menuWidth = 160;
  const menuHeight = 80; // 估算菜单高度
  const adjustedX = x + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : x;
  const adjustedY = y + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : y;
  
  
  const menuStyle: React.CSSProperties = {
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

  // 处理图标选择
  const handleIconSelect = (iconType: 'milestone' | 'development' | 'testing' | 'delivery' | 'default') => {
    onIconChange(taskId, iconType);
    onClose();
  };

  // 计算子菜单位置 - 同样添加边界检测
  const submenuWidth = 140;
  const submenuHeight = 200; // 估算子菜单高度
  const submenuX = adjustedX + menuWidth + 5; // 在主菜单右侧显示
  const submenuY = adjustedY;
  
  // 如果右侧空间不够，则显示在左侧
  const finalSubmenuX = submenuX + submenuWidth > window.innerWidth 
    ? adjustedX - submenuWidth - 5 
    : submenuX;
  const finalSubmenuY = submenuY + submenuHeight > window.innerHeight 
    ? window.innerHeight - submenuHeight - 10 
    : submenuY;
    
  const submenuStyle: React.CSSProperties = {
    position: 'fixed',
    top: finalSubmenuY,
    left: finalSubmenuX,
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 10000, // 子菜单层级更高
    minWidth: '140px',
    overflow: 'hidden'
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
            setShowIconSubmenu(true);
          }}
          onMouseLeave={() => {
            // 延迟隐藏，允许鼠标移动到子菜单
            setTimeout(() => {
              if (!iconSubmenuRef.current?.matches(':hover')) {
                setShowIconSubmenu(false);
              }
            }, 100);
          }}
        >
          <TaskIcon type={task.type} size={16} />
          更改任务图标
          <span style={{ marginLeft: 'auto', fontSize: '12px' }}>▶</span>
        </div>
      </div>

      {/* 图标选择子菜单 */}
      {showIconSubmenu && (
        <div
          ref={iconSubmenuRef}
          className="icon-submenu"
          style={submenuStyle}
          onMouseEnter={() => setShowIconSubmenu(true)}
          onMouseLeave={() => setShowIconSubmenu(false)}
          onClick={(e) => e.stopPropagation()}
        >
          {iconTypes.map((iconType) => (
            <div
              key={iconType.type}
              className="submenu-item"
              style={{
                ...menuItemStyle,
                borderBottom: iconType.type === 'delivery' ? 'none' : '1px solid #eee',
                backgroundColor: task.type === iconType.type ? '#e3f2fd' : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (task.type !== iconType.type) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (task.type !== iconType.type) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                } else {
                  e.currentTarget.style.backgroundColor = '#e3f2fd';
                }
              }}
              onClick={() => handleIconSelect(iconType.type)}
            >
              <TaskIcon type={iconType.type} size={16} />
              <span>{iconType.label}</span>
              {task.type === iconType.type && (
                <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" style={{
                  marginLeft: 'auto',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#2196F3',
                  borderRadius: '50%'
                }}></div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );

  // 使用Portal将菜单渲染到document.body
  return createPortal(menuContent, document.body);
};

export default TaskTitleContextMenu;