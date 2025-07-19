import React from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { TimeGranularity } from '../hooks/gantt/useTimeline';

interface TimeGranularitySelectorProps {
  value: TimeGranularity;
  onValueChange: (value: TimeGranularity) => void;
}

const timeGranularityOptions = [
  { value: 'day' as const, label: '日' },
  { value: 'week' as const, label: '周' },
  { value: 'month' as const, label: '月' },
  { value: 'quarter' as const, label: '季度' },
  { value: 'year' as const, label: '年' }
];

const TimeGranularitySelector: React.FC<TimeGranularitySelectorProps> = ({
  value,
  onValueChange
}) => {
  const selectedOption = timeGranularityOptions.find(option => option.value === value);

  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger 
        className="time-granularity-trigger"
        aria-label="选择时间颗粒度"
      >
        <Select.Value>
          {selectedOption?.label || '月'}
        </Select.Value>
        <Select.Icon>
          <ChevronDown size={16} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content 
          className="time-granularity-content"
          position="popper"
          sideOffset={4}
        >
          <Select.ScrollUpButton className="time-granularity-scroll-button">
            <ChevronUp size={16} />
          </Select.ScrollUpButton>
          
          <Select.Viewport className="time-granularity-viewport">
            {timeGranularityOptions.map((option) => (
              <Select.Item 
                key={option.value}
                value={option.value}
                className="time-granularity-item"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="time-granularity-indicator">
                  <Check size={16} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          
          <Select.ScrollDownButton className="time-granularity-scroll-button">
            <ChevronDown size={16} />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};

export default TimeGranularitySelector;