/**
 * 里程碑附着逻辑 Hook
 * 负责里程碑节点与任务条的附着检测、相对位置计算和脱离处理
 */

import { useCallback } from 'react';
import { MilestoneNode, TaskBar, Task } from '../../types/task';
import { Rectangle } from '../../types/common';
import { layoutUtils, LAYOUT_CONSTANTS } from '../../components/gantt/ganttStyles';

interface AttachmentResult {
  isAttached: boolean;
  relativePosition?: number;
  attachedToBar?: string;
}

export const useMilestoneAttachment = () => {
  // 获取矩形区域（考虑任务条和里程碑节点的边界）
  const getTaskBarRect = useCallback((task: TaskBar, taskHeight: number, rowIndex: number): Rectangle => {
    // 🔧 修复：基于中心点坐标计算任务条矩形
    const centerX = task.x || 0;
    const width = task.width || 0;
    return {
      x: centerX - width / 2, // 转换为左边缘位置
      y: layoutUtils.calculateTaskY(rowIndex, taskHeight),
      width: width,
      height: taskHeight
    };
  }, []);

  const getMilestoneRect = useCallback((milestone: MilestoneNode, nodeSize: number = LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE): Rectangle => {
    return {
      x: (milestone.x || 0) - nodeSize / 2,
      y: (milestone.y || 0) - nodeSize / 2,
      width: nodeSize,
      height: nodeSize
    };
  }, []);

  // 重叠检测算法 - 检查两个矩形是否重叠
  const isOverlapping = useCallback((rect1: Rectangle, rect2: Rectangle): boolean => {
    return !(rect1.x + rect1.width < rect2.x || 
             rect2.x + rect2.width < rect1.x ||
             rect1.y + rect1.height < rect2.y || 
             rect2.y + rect2.height < rect1.y);
  }, []);

  // 检测里程碑是否与任务条重叠
  const checkMilestoneTaskOverlap = useCallback((
    milestone: MilestoneNode,
    task: TaskBar,
    taskHeight: number,
    rowIndex: number,
    nodeSize: number = LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE
  ): boolean => {
    if (!milestone.x || !milestone.y || !task.x || !task.width) {
      return false;
    }

    const milestoneRect = getMilestoneRect(milestone, nodeSize);
    const taskRect = getTaskBarRect(task, taskHeight, rowIndex);
    
    return isOverlapping(milestoneRect, taskRect);
  }, [getMilestoneRect, getTaskBarRect, isOverlapping]);

  // 计算里程碑在任务条上的相对位置（0-1）
  const calculateRelativePosition = useCallback((
    milestone: MilestoneNode,
    task: TaskBar
  ): number => {
    if (!milestone.x || !task.x || !task.width) {
      return 0;
    }

    // 🔧 修复：基于中心点坐标计算相对位置
    const milestoneX = milestone.x;
    const taskCenterX = task.x;
    const taskWidth = task.width;
    const taskLeftEdge = taskCenterX - taskWidth / 2;
    
    // 计算相对位置，确保在 0-1 范围内
    const relativePosition = (milestoneX - taskLeftEdge) / taskWidth;
    return Math.max(0, Math.min(1, relativePosition));
  }, []);

  // 根据相对位置计算里程碑的绝对位置
  const calculateAbsolutePosition = useCallback((
    relativePosition: number,
    task: TaskBar,
    taskHeight: number,
    rowIndex: number
  ): { x: number; y: number } => {
    if (!task.x || !task.width) {
      return { x: 0, y: 0 };
    }

    // 🔧 修复：基于中心点坐标计算绝对位置
    const taskCenterX = task.x;
    const taskWidth = task.width;
    const taskLeftEdge = taskCenterX - taskWidth / 2;
    const x = taskLeftEdge + relativePosition * taskWidth;
    // calculateMilestoneY 现在返回顶部Y坐标，需要转换为中心点坐标
    const topY = layoutUtils.calculateMilestoneY(rowIndex, taskHeight);
    const y = topY + taskHeight / 2; // 转换为任务条中心Y坐标
    
    return { x, y };
  }, []);

  // 检测里程碑与任务条的附着关系
  const detectAttachment = useCallback((
    milestone: MilestoneNode,
    allTasks: Task[],
    taskHeight: number,
    getTaskRowIndex: (taskId: string) => number,
    nodeSize: number = LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE
  ): AttachmentResult => {
    // 如果里程碑没有位置信息，无法检测附着
    if (!milestone.x || !milestone.y) {
      return { isAttached: false };
    }

    // 检查与所有任务条的重叠
    for (const task of allTasks) {
      // 跳过同一天开始和结束的任务（视为单点任务）
      if (task.startDate.getTime() === task.endDate.getTime()) {
        continue;
      }

      const rowIndex = getTaskRowIndex(task.id);
      if (rowIndex === -1) continue;

      const isOverlapping = checkMilestoneTaskOverlap(
        milestone,
        task as TaskBar,
        taskHeight,
        rowIndex,
        nodeSize
      );

      if (isOverlapping) {
        const relativePosition = calculateRelativePosition(milestone, task as TaskBar);
        return {
          isAttached: true,
          relativePosition,
          attachedToBar: task.id
        };
      }
    }

    return { isAttached: false };
  }, [checkMilestoneTaskOverlap, calculateRelativePosition]);

  // 更新附着的里程碑位置（当任务条移动时调用）
  const updateAttachedMilestones = useCallback((
    task: TaskBar,
    milestones: MilestoneNode[],
    taskHeight: number,
    rowIndex: number
  ): MilestoneNode[] => {
    return milestones.map(milestone => {
      if (milestone.attachedToBar === task.id && milestone.relativePosition !== undefined) {
        const newPosition = calculateAbsolutePosition(
          milestone.relativePosition,
          task,
          taskHeight,
          rowIndex
        );
        
        return {
          ...milestone,
          x: newPosition.x,
          y: newPosition.y
        };
      }
      return milestone;
    });
  }, [calculateAbsolutePosition]);

  // 处理重叠的里程碑节点错开显示
  const handleMilestoneOverlap = useCallback((
    milestones: MilestoneNode[],
    nodeSize: number = LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE,
    horizontalSpacing: number = 0,
    verticalSpacing: number = 20,
    maxHorizontalCount: number = 5
  ): MilestoneNode[] => {
    // 按 x 坐标分组，找出重叠的节点
    const groups: Map<number, MilestoneNode[]> = new Map();
    
    milestones.forEach(milestone => {
      if (!milestone.x) return;
      
      // 找到相近的 x 坐标组（容差范围内）
      let groupKey = milestone.x;
      for (const [key] of groups) {
        if (Math.abs(key - milestone.x) <= nodeSize + horizontalSpacing) {
          groupKey = key;
          break;
        }
      }
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(milestone);
    });

    // 对每组重叠的节点进行错开处理
    const result: MilestoneNode[] = [];
    
    groups.forEach((groupMilestones, baseX) => {
      groupMilestones.forEach((milestone, index) => {
        const horizontalIndex = index % maxHorizontalCount;
        const verticalIndex = Math.floor(index / maxHorizontalCount);
        
        const offsetX = horizontalIndex * (nodeSize + horizontalSpacing);
        const offsetY = verticalIndex * verticalSpacing;
        
        result.push({
          ...milestone,
          x: baseX + offsetX,
          y: (milestone.y || 0) + offsetY
        });
      });
    });

    return result;
  }, []);

  return {
    checkMilestoneTaskOverlap,
    calculateRelativePosition,
    calculateAbsolutePosition,
    detectAttachment,
    updateAttachedMilestones,
    handleMilestoneOverlap,
    isOverlapping,
    getTaskBarRect,
    getMilestoneRect
  };
};