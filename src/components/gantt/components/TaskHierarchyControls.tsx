/**
 * 任务层级控制组件
 * 负责渲染任务的展开/折叠按钮和创建子任务按钮
 */

import React from 'react';
import { Task } from '../../../types';

interface TaskHierarchyControlsProps {
  task: Task;
  level: number;
  onTaskToggle: (taskId: string) => void;
  onTaskCreateSubtask: (taskId: string) => void;
}

export const TaskHierarchyControls: React.FC<TaskHierarchyControlsProps> = ({
  task,
  level,
  onTaskToggle,
  onTaskCreateSubtask
}) => {
  const hasChildren = task.children && task.children.length > 0;

  return (
    <>
      {/* 展开/折叠按钮 */}
      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTaskToggle(task.id);
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            marginRight: '4px',
            fontSize: '12px',
            color: '#666'
          }}
        >
          {task.isExpanded ? '▼' : '▶'}
        </button>
      )}
      
      {/* 如果没有子任务，添加占位符保持对齐 */}
      {!hasChildren && (
        <div style={{ width: '16px', marginRight: '4px' }} />
      )}
      
      {/* 创建子任务按钮 - 只有顶级任务可以创建子任务，防止孙任务 */}
      {!task.isPlaceholder && level === 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTaskCreateSubtask(task.id);
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            marginLeft: 'auto',
            fontSize: '12px',
            color: '#666',
            opacity: 0.7,
            borderRadius: '2px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.opacity = '0.7';
          }}
          title="创建子任务"
        >
          +
        </button>
      )}
    </>
  );
};