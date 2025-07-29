/**
 * 里程碑拖拽 Hook
 * 专门处理里程碑节点的拖拽逻辑，包括独立拖拽和附着/脱离检测
 */

import { useCallback, useRef } from 'react';
import { MilestoneNode, Task } from '../../types/task';
import { 
  MilestoneDragCallbacks, 
  MilestoneDragOperations,
  MilestoneDragState as DragTypeMilestoneState
} from '../../types/drag';
import { hasDateInLabel, replaceDateInLabel } from '../../utils/ganttUtils';
import { LAYOUT_CONSTANTS } from '../../components/gantt/ganttStyles';
import { boundaryHelpers } from '../../utils/boundaryUtils';

interface LocalMilestoneDragState {
  isDragging: boolean;
  draggedMilestone: string | null;
  dragOffset: { x: number; y: number };
  originalPosition: { x: number; y: number } | null;
  previewPosition: { x: number; y: number } | null;
  isWithinBounds: boolean;
}

export const useMilestoneDrag = (callbacks: MilestoneDragCallbacks): MilestoneDragOperations => {
  const {
    onMilestoneUpdate,
    pixelToDate,
    getMilestone
  } = callbacks;

  // 拖拽状态
  const dragStateRef = useRef<LocalMilestoneDragState>({
    isDragging: false,
    draggedMilestone: null,
    dragOffset: { x: 0, y: 0 },
    originalPosition: null,
    previewPosition: null,
    isWithinBounds: true
  });

  // 容器边界缓存
  const containerBoundsRef = useRef<DOMRect | null>(null);


  // 边界检测函数（使用统一边界检测）
  const checkBounds = useCallback((x: number, y: number, containerWidth?: number, containerHeight?: number): boolean => {
    if (!containerWidth || !containerHeight) return true;
    
    const constrainedPosition = boundaryHelpers.constrainMilestone(
      x, 
      y, 
      containerWidth, 
      containerHeight, 
      LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE
    );
    
    return constrainedPosition.isWithinBounds;
  }, []);

  // 更新容器边界
  const updateContainerBounds = useCallback((element: HTMLElement | null) => {
    if (element) {
      containerBoundsRef.current = element.getBoundingClientRect();
    }
  }, []);

  // 开始拖拽里程碑
  const startMilestoneDrag = useCallback((
    milestone: MilestoneNode,
    clientX: number,
    clientY: number,
    containerElement: HTMLElement | null
  ) => {
    updateContainerBounds(containerElement);
    
    const bounds = containerBoundsRef.current;
    if (!bounds || !milestone.x || !milestone.y) {
      return;
    }

    // 基于中心点坐标的拖拽偏移计算
    const nodeSize = LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE;
    const renderLeft = milestone.x - nodeSize / 2;
    const renderTop = milestone.y - nodeSize / 2;
    
    const offset = {
      x: clientX - bounds.left - renderLeft,
      y: clientY - bounds.top - renderTop
    };


    // 更新拖拽状态
    dragStateRef.current = {
      isDragging: true,
      draggedMilestone: milestone.id,
      dragOffset: offset,
      originalPosition: { x: milestone.x, y: milestone.y },
      previewPosition: null,
      isWithinBounds: true
    };
  }, [updateContainerBounds]);

  // 智能标签更新辅助函数
  const updateMilestoneLabelIfNeeded = useCallback((
    milestone: MilestoneNode | null,
    newDate: Date
  ): string | undefined => {
    if (!milestone?.label || !hasDateInLabel(milestone.label)) {
      return undefined;
    }
    return replaceDateInLabel(milestone.label, newDate);
  }, []);

  // 更新拖拽位置
  const updateMilestoneDragPosition = useCallback((
    clientX: number,
    clientY: number,
    _allTasks: Task[],
    _taskHeight: number,
    containerWidth?: number,
    containerHeight?: number
  ) => {
    const dragState = dragStateRef.current;
    
    if (!dragState.isDragging || !dragState.draggedMilestone) return;

    const bounds = containerBoundsRef.current;
    if (!bounds) return;

    // 计算新的渲染位置，然后转换为中心点坐标
    const newRenderLeft = clientX - bounds.left - dragState.dragOffset.x;
    const newRenderTop = clientY - bounds.top - dragState.dragOffset.y;
    
    // 转换为中心点坐标
    const nodeSize = LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE;
    let newX = newRenderLeft + nodeSize / 2;
    let newY = newRenderTop + nodeSize / 2;

    // 使用统一边界检测和约束
    let isWithinBounds = true;
    if (containerWidth && containerHeight) {
      const constrainedPosition = boundaryHelpers.constrainMilestone(
        newX, 
        newY, 
        containerWidth, 
        containerHeight, 
        nodeSize
      );
      
      newX = constrainedPosition.x;
      newY = constrainedPosition.y;
      isWithinBounds = constrainedPosition.isWithinBounds;
    }

    // 更新拖拽状态（包含预览位置和边界状态）
    dragStateRef.current = {
      ...dragState,
      previewPosition: { x: newX, y: newY },
      isWithinBounds
    };

    // 获取当前里程碑数据并准备更新
    const currentMilestone = getMilestone(dragState.draggedMilestone);
    const newDate = pixelToDate(newX);
    
    // 合并所有更新：位置、日期和智能标签
    const updates: Partial<MilestoneNode> = {
      x: newX,
      y: newY,
      date: newDate
    };

    // 智能更新标签（如果需要）
    const newLabel = updateMilestoneLabelIfNeeded(currentMilestone || null, newDate);
    if (newLabel) {
      updates.label = newLabel;
    }
    // 一次性更新所有变更
    onMilestoneUpdate(dragState.draggedMilestone, updates);
  }, [
    onMilestoneUpdate,
    pixelToDate,
    getMilestone,
    checkBounds,
    updateMilestoneLabelIfNeeded
  ]);

  // 结束拖拽
  const endMilestoneDrag = useCallback(() => {
    const dragState = dragStateRef.current;
    if (!dragState.isDragging) return;

    // 重置拖拽状态
    dragStateRef.current = {
      isDragging: false,
      draggedMilestone: null,
      dragOffset: { x: 0, y: 0 },
      originalPosition: null,
      previewPosition: null,
      isWithinBounds: true
    };

    // 清除容器边界缓存
    containerBoundsRef.current = null;
  }, []);

  // 取消拖拽（恢复到原始位置）
  const cancelMilestoneDrag = useCallback(() => {
    const dragState = dragStateRef.current;
    if (!dragState.isDragging || !dragState.draggedMilestone || !dragState.originalPosition) {
      return;
    }

    // 恢复到原始位置
    const updates: Partial<MilestoneNode> = {
      x: dragState.originalPosition.x,
      y: dragState.originalPosition.y,
      date: pixelToDate(dragState.originalPosition.x)
    };

    onMilestoneUpdate(dragState.draggedMilestone, updates);

    // 结束拖拽
    endMilestoneDrag();
  }, [onMilestoneUpdate, pixelToDate, endMilestoneDrag]);

  // 处理里程碑重叠错开（简化版，不涉及任务条）
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

  // 获取当前拖拽状态  
  const getDragState = useCallback((): DragTypeMilestoneState => {
    const state = dragStateRef.current;
    return {
      isDragging: state.isDragging,
      draggedMilestoneId: state.draggedMilestone,
      draggedMilestoneData: null, // 需要从上下文获取
      tempDragPosition: state.previewPosition ? {
        id: state.draggedMilestone || '',
        x: state.previewPosition.x,
        y: state.previewPosition.y
      } : null,
      previewPosition: state.previewPosition,
      originalPosition: state.originalPosition,
      startOffset: state.dragOffset,
      isWithinBounds: state.isWithinBounds
    };
  }, []);

  // 获取拖拽预览位置
  const getPreviewPosition = useCallback(() => {
    return dragStateRef.current.previewPosition;
  }, []);

  // 检查是否在边界内
  const getIsWithinBounds = useCallback(() => {
    return dragStateRef.current.isWithinBounds;
  }, []);

  return {
    // 拖拽操作
    startMilestoneDrag,
    updateMilestoneDragPosition,
    endMilestoneDrag,
    cancelMilestoneDrag,
    
    // 工具方法
    handleMilestoneOverlap,
    
    // 状态查询
    getDragState,
    getPreviewPosition,
    getIsWithinBounds,
    
    // 边界检测
    checkBounds,
    
    // 状态属性（便于组件使用）
    isDragging: dragStateRef.current.isDragging,
    draggedMilestone: dragStateRef.current.draggedMilestone,
    previewPosition: dragStateRef.current.previewPosition,
    isWithinBounds: dragStateRef.current.isWithinBounds
  };
};