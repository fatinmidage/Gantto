import React from 'react';
import { 
  Plus, 
  Trash2,
  Edit3,
  ChevronRight
} from './icons';
import DateRangePicker from './DateRangePicker';
import TimelineLayerSettings from './gantt/TimelineLayerSettings';
import { TimelineLayerConfig } from '../utils/timelineLayerUtils';

interface ToolbarProps {
  onAddTask?: () => void;
  onDeleteTask?: () => void;
  onEditTask?: () => void;
  // 子任务相关
  onAddSubtask?: () => void;
  canAddSubtask?: boolean;
  // 日期范围相关
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;
  // 分层时间轴相关
  layerConfig?: TimelineLayerConfig;
  onLayerConfigChange?: (config: TimelineLayerConfig) => void;
  onLayerModeToggle?: (enabled: boolean) => void;
  isLayeredModeEnabled?: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onAddTask,
  onDeleteTask,
  onEditTask,
  onAddSubtask,
  canAddSubtask = false,
  dateRangeStart,
  dateRangeEnd,
  onDateRangeChange,
  layerConfig,
  onLayerConfigChange,
  onLayerModeToggle,
  isLayeredModeEnabled = true
}) => {
  // 默认日期范围：2025年7月20日至2025年8月20日
  const defaultStart = dateRangeStart || new Date(2025, 6, 20); // 月份从0开始，6表示7月
  const defaultEnd = dateRangeEnd || new Date(2025, 7, 20); // 7表示8月
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
          <TimelineLayerSettings
            config={layerConfig}
            onConfigChange={onLayerConfigChange}
            onModeToggle={onLayerModeToggle}
            isLayeredModeEnabled={isLayeredModeEnabled}
          />
        </div>
      </div>
    </div>
  );
};

export default Toolbar; 