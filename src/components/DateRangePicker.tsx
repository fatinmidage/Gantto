import React, { useState, useCallback } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Calendar, X } from 'lucide-react';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateRangeChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  // 格式化日期为 YYYY-MM-DD 格式
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // 解析日期字符串为 Date 对象
  const parseInputDate = (dateStr: string): Date => {
    return new Date(dateStr + 'T00:00:00');
  };

  // 验证日期范围
  const validateDateRange = (start: Date, end: Date): { start: Date; end: Date } => {
    let validStart = new Date(start);
    let validEnd = new Date(end);

    // 确保开始日期不大于结束日期
    if (validStart > validEnd) {
      [validStart, validEnd] = [validEnd, validStart];
    }

    // 检查最小范围（1个月）
    const oneMonth = 30 * 24 * 60 * 60 * 1000; // 30天
    if (validEnd.getTime() - validStart.getTime() < oneMonth) {
      validEnd = new Date(validStart.getTime() + oneMonth);
    }

    // 检查最大范围（10年）
    const tenYears = 10 * 365 * 24 * 60 * 60 * 1000;
    if (validEnd.getTime() - validStart.getTime() > tenYears) {
      validEnd = new Date(validStart.getTime() + tenYears);
    }

    return { start: validStart, end: validEnd };
  };

  // 处理开始日期变化
  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newStart = parseInputDate(e.target.value);
      setTempStartDate(newStart);
      
      // 立即应用变化
      const validated = validateDateRange(newStart, tempEndDate);
      setTempEndDate(validated.end);
      onDateRangeChange(validated.start, validated.end);
    }
  }, [tempEndDate, onDateRangeChange]);

  // 处理结束日期变化
  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newEnd = parseInputDate(e.target.value);
      setTempEndDate(newEnd);
      
      // 立即应用变化
      const validated = validateDateRange(tempStartDate, newEnd);
      setTempStartDate(validated.start);
      onDateRangeChange(validated.start, validated.end);
    }
  }, [tempStartDate, onDateRangeChange]);

  // 格式化显示的日期范围
  const formatDisplayRange = (): string => {
    const startStr = startDate.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    const endStr = endDate.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    return `${startStr} - ${endStr}`;
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger 
        className="date-range-trigger"
        aria-label="选择日期范围"
      >
        <Calendar size={16} />
        <span className="date-range-display">
          {formatDisplayRange()}
        </span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content 
          className="date-range-content"
          side="bottom"
          align="start"
          sideOffset={4}
        >
          <div className="date-range-header">
            <h3>选择日期范围</h3>
            <Popover.Close className="date-range-close">
              <X size={16} />
            </Popover.Close>
          </div>

          <div className="date-range-form">
            <div className="date-input-group">
              <label htmlFor="start-date">开始日期</label>
              <input
                id="start-date"
                type="date"
                value={formatDateForInput(tempStartDate)}
                onChange={handleStartDateChange}
                className="date-input"
              />
            </div>

            <div className="date-input-group">
              <label htmlFor="end-date">结束日期</label>
              <input
                id="end-date"
                type="date"
                value={formatDateForInput(tempEndDate)}
                onChange={handleEndDateChange}
                className="date-input"
              />
            </div>

            <div className="date-range-info">
              <p className="date-range-duration">
                范围：{Math.ceil((tempEndDate.getTime() - tempStartDate.getTime()) / (24 * 60 * 60 * 1000))} 天
              </p>
              <p className="date-range-limits">
                最小范围：1个月 • 最大范围：10年
              </p>
            </div>
          </div>

          <Popover.Arrow className="date-range-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default DateRangePicker;