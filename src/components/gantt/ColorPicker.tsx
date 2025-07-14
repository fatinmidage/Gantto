import React from 'react';

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
  if (!visible) return null;

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

  return (
    <div
      className="color-picker-panel"
      style={{
        position: 'fixed',
        top: y,
        left: x + 180,
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1001,
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
};

export default ColorPicker;