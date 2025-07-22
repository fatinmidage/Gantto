/**
 * 颗粒度选择器组件
 * 用于选择时间轴的颗粒度
 */

import React from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { TimeGranularity } from '../../../utils/timelineLayerUtils';

// 组件Props接口
interface GranularitySelectorProps {
  label: string;
  value?: TimeGranularity;
  onValueChange: (value: TimeGranularity) => void;
}

// 颗粒度选项
const granularityOptions: { value: TimeGranularity; label: string }[] = [
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
  { value: 'quarter', label: '季度' },
  { value: 'year', label: '年' }
];

const GranularitySelector: React.FC<GranularitySelectorProps> = ({
  label,
  value,
  onValueChange
}) => {
  return (
    <div>
      <label style={{ 
        display: 'block', 
        marginBottom: '8px', 
        fontSize: '14px', 
        fontWeight: 500 
      }}>
        {label}
      </label>
      <Select.Root
        value={value}
        onValueChange={onValueChange}
      >
        <Select.Trigger style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d0d0d0',
          borderRadius: '4px',
          backgroundColor: 'white',
          cursor: 'pointer'
        }}>
          <Select.Value />
          <Select.Icon>
            <ChevronDown size={16} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content style={{
            backgroundColor: 'white',
            border: '1px solid #d0d0d0',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}>
            <Select.Viewport>
              {granularityOptions.map((option) => (
                <Select.Item 
                  key={option.value}
                  value={option.value}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
};

export default GranularitySelector;