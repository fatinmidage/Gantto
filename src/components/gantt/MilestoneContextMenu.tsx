/**
 * 里程碑右键菜单组件
 * 提供图标选择、标签编辑、删除等功能
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Edit, Trash2 } from 'lucide-react';
import { MilestoneNode } from '../../types/task';
import { IconType } from '../../types/common';
import { TaskIcon } from '..';
import { calculateMenuPosition, getEstimatedMenuDimensions, calculateSubmenuPosition } from '../../utils/menuPositioning';
import { AVAILABLE_ICONS } from '../../config/icons';

interface MilestoneContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  milestone?: MilestoneNode;
  onClose: () => void;
  onIconChange: (milestoneId: string, iconType: IconType) => void;
  onLabelEdit: (milestoneId: string, label: string) => void;
  onDelete: (milestoneId: string) => void;
}

const MilestoneContextMenu: React.FC<MilestoneContextMenuProps> = ({
  visible,
  x,
  y,
  milestone,
  onClose,
  onIconChange,
  onLabelEdit,
  onDelete
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

  if (!visible || !milestone) return null;

  // 主菜单智能定位
  const mainMenuDimensions = getEstimatedMenuDimensions(3); // 3个菜单项：更改图标、添加标签、删除
  const mainMenuPosition = calculateMenuPosition(
    { x, y },
    mainMenuDimensions
  );
  
  // 子菜单智能定位
  const submenuDimensions = { width: 260, height: 120 }; // 预估子菜单尺寸（宽度260px适配4列图标，2行布局）
  const iconItemOffset = 0; // "更改图标"菜单项的垂直偏移（第一个菜单项）
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


  const handleDeleteMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = '#ffebee';
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
    onIconChange(milestone.id, iconType);
    setShowIconSubmenu(false);
    onClose();
  };

  const handleLabelEdit = () => {
    // 直接为里程碑添加当前日期作为标签
    const dateLabel = milestone.date.toLocaleDateString('zh-CN');
    onLabelEdit(milestone.id, dateLabel);
    onClose();
  };

  const handleDelete = () => {
    onDelete(milestone.id);
    onClose();
  };

  // 使用Portal将菜单渲染到document.body，绕过CSS层叠上下文限制
  const menuContent = (
    <>
      {/* 主菜单 */}
      <div
        ref={menuRef}
        className="milestone-context-menu"
        style={menuStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 更改图标 */}
        <div
          className="menu-item"
          style={menuItemStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
            handleIconMenuEnter();
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            handleIconMenuLeave();
          }}
        >
          <TaskIcon iconType={milestone.iconType || 'circle'} size={16} />
          更改图标
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#999' }}>▶</span>
        </div>
        
        {/* 添加标签 */}
        <div
          className="menu-item"
          style={menuItemStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={handleLabelEdit}
        >
          <Edit size={16} />
          添加标签
          {milestone.label && (
            <span style={{ marginLeft: 'auto', color: '#666', fontSize: '12px' }}>
              "{milestone.label}"
            </span>
          )}
        </div>
        
        {/* 删除里程碑 */}
        <div
          className="menu-item"
          style={{
            ...menuItemStyle,
            color: '#f44336',
            borderBottom: 'none'
          }}
          onMouseEnter={handleDeleteMouseEnter}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={handleDelete}
        >
          <Trash2 size={16} />
          删除里程碑
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
          {/* 图标网格 - 4×2布局 */}
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
                  backgroundColor: milestone.iconType === icon.id ? '#eff6ff' : 'transparent',
                  border: milestone.iconType === icon.id ? '1px solid #3b82f6' : '1px solid transparent',
                  transition: 'all 150ms ease-in-out'
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleIconSelect(icon.id);
                }}
                title={icon.label}
                onMouseEnter={(e) => {
                  if (milestone.iconType !== icon.id) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (milestone.iconType !== icon.id) {
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

  return createPortal(menuContent, document.body);
};

export default MilestoneContextMenu;