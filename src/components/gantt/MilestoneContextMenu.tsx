/**
 * 里程碑右键菜单组件
 * 提供图标选择、标签编辑、删除等功能
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Target, Code, CheckCircle, Package, Circle, Edit, Trash2 } from 'lucide-react';
import { MilestoneNode } from '../../types/task';
import { TaskType } from '../../types/common';

interface MilestoneContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  milestone?: MilestoneNode;
  onClose: () => void;
  onIconChange: (milestoneId: string, iconType: TaskType) => void;
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
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(milestone?.label || '');
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

  if (!visible || !milestone) return null;

  // 菜单尺寸配置
  const menuWidth = 200;
  const menuHeight = isEditingLabel ? 380 : 320; // 根据编辑状态调整高度
  
  // 边界检测 - 确保菜单不会超出视口
  const adjustedX = x + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : x;
  const adjustedY = y + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : y;

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: adjustedX,
    top: adjustedY,
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 9999, // 提高z-index确保在最顶层
    minWidth: '200px',
    fontSize: '14px',
    userSelect: 'none',
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

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = '#f5f5f5';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  const handleDeleteMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = '#ffebee';
  };

  const handleIconSelect = (iconType: TaskType) => {
    onIconChange(milestone.id, iconType);
    onClose();
  };

  const handleLabelEdit = () => {
    setIsEditingLabel(true);
    setLabelValue(milestone.label || '');
  };

  const handleLabelSave = () => {
    onLabelEdit(milestone.id, labelValue.trim());
    setIsEditingLabel(false);
    onClose();
  };

  const handleLabelCancel = () => {
    setIsEditingLabel(false);
    setLabelValue(milestone.label || '');
  };

  const handleDelete = () => {
    onDelete(milestone.id);
    onClose();
  };

  const iconOptions = [
    { type: 'milestone' as TaskType, icon: Target, color: '#ff9800', name: '里程碑' },
    { type: 'development' as TaskType, icon: Code, color: '#2196f3', name: '开发' },
    { type: 'testing' as TaskType, icon: CheckCircle, color: '#4caf50', name: '测试' },
    { type: 'delivery' as TaskType, icon: Package, color: '#9c27b0', name: '交付' },
    { type: 'default' as TaskType, icon: Circle, color: '#666666', name: '默认' },
  ];

  // 菜单内容
  const menuContent = (
    <div 
      ref={menuRef} 
      style={menuStyle} 
      onClick={(e) => e.stopPropagation()}
    >
      {/* 图标选择区域 */}
      <div style={{ ...menuItemStyle, borderBottom: 'none', fontWeight: 'bold', color: '#666' }}>
        更改图标
      </div>
      
      {iconOptions.map((option) => {
        const IconComponent = option.icon;
        const isSelected = milestone.iconType === option.type;
        
        return (
          <div
            key={option.type}
            style={{
              ...menuItemStyle,
              backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
              paddingLeft: '24px'
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleIconSelect(option.type)}
          >
            <IconComponent size={16} style={{ color: option.color }} />
            <span>{option.name}</span>
            {isSelected && <span style={{ marginLeft: 'auto', color: '#1976d2', fontSize: '12px' }}>✓</span>}
          </div>
        );
      })}

      {/* 分隔线 */}
      <div style={{ height: '1px', backgroundColor: '#ddd', margin: '4px 0' }} />

      {/* 标签编辑 */}
      {isEditingLabel ? (
        <div style={{ ...menuItemStyle, flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
          <input
            type="text"
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            placeholder="输入标签文本"
            style={{
              padding: '6px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              outline: 'none',
              width: '100%'
            }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleLabelSave();
              } else if (e.key === 'Escape') {
                handleLabelCancel();
              }
            }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleLabelCancel}
              style={{
                padding: '4px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              取消
            </button>
            <button
              onClick={handleLabelSave}
              style={{
                padding: '4px 8px',
                border: '1px solid #1976d2',
                borderRadius: '4px',
                backgroundColor: '#1976d2',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              保存
            </button>
          </div>
        </div>
      ) : (
        <div
          style={menuItemStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleLabelEdit}
        >
          <Edit size={16} />
          <span>编辑标签</span>
          {milestone.label && (
            <span style={{ marginLeft: 'auto', color: '#666', fontSize: '12px' }}>
              "{milestone.label}"
            </span>
          )}
        </div>
      )}

      {/* 分隔线 */}
      <div style={{ height: '1px', backgroundColor: '#ddd', margin: '4px 0' }} />

      {/* 删除选项 */}
      <div
        style={{ ...menuItemStyle, borderBottom: 'none', color: '#d32f2f' }}
        onMouseEnter={handleDeleteMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleDelete}
      >
        <Trash2 size={16} />
        <span>删除里程碑</span>
      </div>
    </div>
  );

  // 使用Portal将菜单渲染到document.body，绕过CSS层叠上下文限制
  return createPortal(menuContent, document.body);
};

export default MilestoneContextMenu;