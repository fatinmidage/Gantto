/**
 * 任务层级管理 Hook
 * 处理任务展开/折叠、子任务创建等层级操作
 */

import { useCallback } from 'react';
import { Task, ProjectRow } from '../../types';

interface UseTaskHierarchyProps {
  projectRows: ProjectRow[];
  setProjectRows: React.Dispatch<React.SetStateAction<ProjectRow[]>>;
  setChartTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export const useTaskHierarchy = ({
  projectRows,
  setProjectRows,
  setChartTasks
}: UseTaskHierarchyProps) => {

  // 切换展开/折叠
  const handleToggleExpand = useCallback((taskId: string) => {
    setProjectRows(prev => prev.map(row => 
      row.id === taskId 
        ? { ...row, isExpanded: !row.isExpanded }
        : row
    ));
  }, [setProjectRows]);

  // 创建子任务
  const handleCreateSubtask = useCallback((parentId: string) => {
    const subtaskId = `task-${Date.now()}`;
    const parentRow = projectRows.find(row => row.id === parentId);
    
    if (!parentRow) return;
    
    // 计算新子任务的位置 - 应该插入到父任务的最后一个子任务后面
    const sortedRows = [...projectRows].sort((a, b) => a.order - b.order);
    const parentIndex = sortedRows.findIndex(row => row.id === parentId);
    
    // 找到父任务的所有现有子任务
    const existingChildren = sortedRows.filter(row => row.parentId === parentId);
    
    let insertIndex: number;
    if (existingChildren.length > 0) {
      // 如果已有子任务，找到最后一个子任务的位置
      const lastChildOrder = Math.max(...existingChildren.map(child => child.order));
      const lastChildIndex = sortedRows.findIndex(row => row.order === lastChildOrder);
      insertIndex = lastChildIndex + 1;
    } else {
      // 如果没有子任务，插入到父任务后面
      insertIndex = parentIndex + 1;
    }
    
    // 计算新的order值，在insertIndex位置插入
    const newOrder = insertIndex < sortedRows.length ? 
      (sortedRows[insertIndex - 1].order + sortedRows[insertIndex].order) / 2 :
      sortedRows[insertIndex - 1].order + 1;
    
    // 创建新的子行
    const newSubRow: ProjectRow = {
      id: subtaskId,
      title: '新子任务',
      order: newOrder,
      type: parentRow.type || 'default',
      level: (parentRow.level || 0) + 1,
      parentId: parentId,
      isExpanded: false
    };
    
    // 更新项目行
    setProjectRows(prev => {
      const updated = prev.map(row => {
        if (row.id === parentId) {
          return {
            ...row,
            children: [...(row.children || []), subtaskId],
            isExpanded: true // 自动展开父行
          };
        }
        return row;
      });
      
      // 添加新子任务
      const withNewSubtask = [...updated, newSubRow];
      
      // 按order排序并重新规范化order值
      return withNewSubtask.sort((a, b) => a.order - b.order).map((row, index) => ({
        ...row,
        order: index
      }));
    });

    // 创建对应的图表任务
    const newChartTask: Task = {
      id: `chart-${subtaskId}`,
      title: '新子任务',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      color: parentRow.type === 'development' ? '#FF9800' :
             parentRow.type === 'testing' ? '#E91E63' :
             parentRow.type === 'delivery' ? '#F44336' : '#4CAF50',
      rowId: subtaskId,
      type: parentRow.type || 'default',
      status: 'pending',
      progress: 0
    };
    
    setChartTasks(prev => [...prev, newChartTask]);
  }, [projectRows, setProjectRows, setChartTasks]);

  return {
    handleToggleExpand,
    handleCreateSubtask
  };
};