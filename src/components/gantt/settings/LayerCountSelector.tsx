/**
 * 层数选择器组件
 * 用于选择时间轴的层数（2层或3层）
 */

import React from 'react';

// 组件Props接口
interface LayerCountSelectorProps {
  value: 2 | 3;
  onChange: (layers: 2 | 3) => void;
}

const LayerCountSelector: React.FC<LayerCountSelectorProps> = ({
  value,
  onChange
}) => {
  return (
    <div>
      <label style={{ 
        display: 'block', 
        marginBottom: '8px', 
        fontSize: '14px', 
        fontWeight: 500 
      }}>
        显示层数
      </label>
      <div style={{ display: 'flex', gap: '12px' }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          cursor: 'pointer' 
        }}>
          <input
            type="radio"
            checked={value === 2}
            onChange={() => onChange(2)}
          />
          <span>2层</span>
        </label>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          cursor: 'pointer' 
        }}>
          <input
            type="radio"
            checked={value === 3}
            onChange={() => onChange(3)}
          />
          <span>3层</span>
        </label>
      </div>
    </div>
  );
};

export default LayerCountSelector;