import React from 'react';
import { 
  Plus, 
  Trash2,
  Edit3,
  ChevronRight
} from './icons';
import DateRangePicker from './DateRangePicker';
import TimeGranularitySelector from './TimeGranularitySelector';
import { TimeGranularity } from '../hooks/gantt/useTimeline';

interface ToolbarProps {
  onAddTask?: () => void;
  onDeleteTask?: () => void;
  onEditTask?: () => void;
  // 子任务相关
  onAddSubtask?: () => void;
  canAddSubtask?: boolean;
  // 日期范围和时间颗粒度相关
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  timeGranularity?: TimeGranularity;
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;
  onTimeGranularityChange?: (granularity: TimeGranularity) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onAddTask,
  onDeleteTask,
  onEditTask,
  onAddSubtask,
  canAddSubtask = false,
  dateRangeStart,
  dateRangeEnd,
  timeGranularity = 'month',
  onDateRangeChange,
  onTimeGranularityChange
}) => {
  // 默认日期范围：今日前1个月到今日后5个月
  const defaultStart = dateRangeStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const defaultEnd = dateRangeEnd || new Date(Date.now() + 150 * 24 * 60 * 60 * 1000);
  return (
    <div className="gantt-toolbar">
      <div className="toolbar-section">
        <div className="toolbar-group">
          <button 
            className="toolbar-btn primary"
            onClick={onAddTask}
            title="添加任务"
          >
            <Plus size={16} />
            <span>添加任务</span>
          </button>
          <button 
            className="toolbar-btn"
            onClick={onAddSubtask}
            disabled={!canAddSubtask}
            title={canAddSubtask ? "添加子任务" : "请先选择一个任务"}
          >
            <ChevronRight size={16} />
            <span>添加子任务</span>
          </button>
          <button 
            className="toolbar-btn"
            onClick={onEditTask}
            title="编辑任务"
          >
            <Edit3 size={16} />
            <span>编辑</span>
          </button>
          <button 
            className="toolbar-btn danger"
            onClick={onDeleteTask}
            title="删除任务"
          >
            <Trash2 size={16} />
            <span>删除</span>
          </button>
        </div>
        
        <div className="toolbar-separator" />
        
        <div className="toolbar-group">
          {onDateRangeChange && (
            <DateRangePicker
              startDate={defaultStart}
              endDate={defaultEnd}
              onDateRangeChange={onDateRangeChange}
            />
          )}
          {onTimeGranularityChange && (
            <TimeGranularitySelector
              value={timeGranularity}
              onValueChange={onTimeGranularityChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Toolbar; 