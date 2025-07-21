import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ColorPickerProps {
  visible: boolean;
  x: number;
  y: number;
  taskId?: string;
  currentColor?: string;
  availableColors: string[];
  onColorSelect: (taskId: string, color: string) => void;
  onClose: () => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  visible,
  x,
  y,
  taskId,
  currentColor,
  availableColors,
  onColorSelect,
  onClose
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  // 处理点击外部关闭菜单
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
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

  // 颜色选择器尺寸配置
  const pickerWidth = 200;
  const pickerHeight = 120; // 估算高度（标题+颜色网格）
  
  // 边界检测 - 确保颜色选择器不会超出视口
  const adjustedX = x + pickerWidth > window.innerWidth ? window.innerWidth - pickerWidth - 10 : x;
  const adjustedY = y + pickerHeight > window.innerHeight ? window.innerHeight - pickerHeight - 10 : y;

  const handleColorSelect = (color: string) => {
    if (taskId) {
      onColorSelect(taskId, color);
      onClose();
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.border = '2px solid #333';
    e.currentTarget.style.transform = 'scale(1.1)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.border = '2px solid transparent';
    e.currentTarget.style.transform = 'scale(1)';
  };

  // 颜色选择器内容
  const pickerContent = (
    <div
      ref={pickerRef}
      className="color-picker-panel"
      style={{
        position: 'fixed',
        top: adjustedY,
        left: adjustedX,
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 9999, // 提高z-index确保在最顶层
        padding: '16px',
        minWidth: '200px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '500' }}>
        选择颜色
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
        {availableColors.map(color => (
          <div
            key={color}
            className="color-option"
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: color,
              borderRadius: '6px',
              cursor: 'pointer',
              border: color === currentColor ? '2px solid #333' : '2px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleColorSelect(color)}
          />
        ))}
      </div>
    </div>
  );

  // 使用Portal将颜色选择器渲染到document.body
  return createPortal(pickerContent, document.body);
};

export default ColorPicker;