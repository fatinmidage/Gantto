import React from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Plus, 
  Trash2,
  Edit3,
  Target,
  ChevronRight
} from './icons';

interface ToolbarProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onAddTask?: () => void;
  onDeleteTask?: () => void;
  onEditTask?: () => void;
  onViewToday?: () => void;
  zoomLevel?: number;
  canZoomIn?: boolean;
  canZoomOut?: boolean;
  // 子任务相关
  onAddSubtask?: () => void;
  canAddSubtask?: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onAddTask,
  onDeleteTask,
  onEditTask,
  onViewToday,
  zoomLevel = 1,
  canZoomIn = true,
  canZoomOut = true,
  onAddSubtask,
  canAddSubtask = false
}) => {
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
          <button 
            className="toolbar-btn"
            onClick={onViewToday}
            title="定位到今天"
          >
            <Target size={16} />
            <span>今天</span>
          </button>
          <button 
            className="toolbar-btn"
            onClick={onZoomOut}
            disabled={!canZoomOut}
            title="缩小"
          >
            <ZoomOut size={16} />
          </button>
          <span className="zoom-level">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button 
            className="toolbar-btn"
            onClick={onZoomIn}
            disabled={!canZoomIn}
            title="放大"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar; 