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
import { useMilestoneAttachment } from './useMilestoneAttachment';

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
    onAttachmentChange,
    pixelToDate,
    getTaskRowIndex
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

  // 引入附着检测逻辑
  const attachment = useMilestoneAttachment();

  // 边界检测函数
  const checkBounds = useCallback((x: number, y: number, containerWidth?: number, containerHeight?: number): boolean => {
    const nodeSize = 16;
    const margin = 8; // 边界缓冲区
    
    // 检查X轴边界
    const minX = nodeSize / 2 + margin;
    const maxX = (containerWidth || 800) - nodeSize / 2 - margin;
    
    // 检查Y轴边界
    const minY = nodeSize / 2 + margin;
    const maxY = (containerHeight || 600) - nodeSize / 2 - margin;
    
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
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

    // 🔧 修复：计算正确的拖拽偏移量
    // 里程碑的渲染位置是 milestone.x - nodeSize/2，所以需要基于渲染位置计算偏移
    const nodeSize = 16;
    const renderedX = milestone.x - nodeSize / 2; // 这是里程碑实际的渲染left位置
    const renderedY = milestone.y - nodeSize / 2; // 这是里程碑实际的渲染top位置
    
    const offset = {
      x: clientX - bounds.left - renderedX,
      y: clientY - bounds.top - renderedY
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

  // 更新拖拽位置
  const updateMilestoneDragPosition = useCallback((
    clientX: number,
    clientY: number,
    allTasks: Task[],
    taskHeight: number,
    containerWidth?: number,
    containerHeight?: number
  ) => {
    const dragState = dragStateRef.current;
    if (!dragState.isDragging || !dragState.draggedMilestone) return;

    const bounds = containerBoundsRef.current;
    if (!bounds) return;

    // 🔧 修复：计算新位置时需要还原到中心点坐标
    // 因为offset是基于渲染位置计算的，所以需要还原到里程碑的中心点坐标
    const nodeSize = 16;
    const renderedX = clientX - bounds.left - dragState.dragOffset.x;
    const renderedY = clientY - bounds.top - dragState.dragOffset.y;
    
    // 将渲染位置转换回里程碑的中心点坐标
    let newX = renderedX + nodeSize / 2;
    let newY = renderedY + nodeSize / 2;

    // 边界检测和约束
    const isWithinBounds = checkBounds(newX, newY, containerWidth, containerHeight);
    
    // 如果超出边界，约束到边界内
    if (!isWithinBounds && containerWidth && containerHeight) {
      const margin = 8;
      const minX = nodeSize / 2 + margin;
      const maxX = containerWidth - nodeSize / 2 - margin;
      const minY = nodeSize / 2 + margin;
      const maxY = containerHeight - nodeSize / 2 - margin;
      
      newX = Math.max(minX, Math.min(newX, maxX));
      newY = Math.max(minY, Math.min(newY, maxY));
    }

    // 更新拖拽状态（包含预览位置和边界状态）
    dragStateRef.current = {
      ...dragState,
      previewPosition: { x: newX, y: newY },
      isWithinBounds
    };

    // 创建临时的里程碑对象用于检测附着
    const tempMilestone: MilestoneNode = {
      id: dragState.draggedMilestone,
      title: '',
      date: pixelToDate(newX), // 根据新X位置更新日期
      iconType: 'default',
      color: '#666666',
      x: newX,
      y: newY
    };

    // 检测附着关系
    const attachmentResult = attachment.detectAttachment(
      tempMilestone,
      allTasks,
      taskHeight,
      getTaskRowIndex
    );

    // 更新里程碑位置和附着信息
    const updates: Partial<MilestoneNode> = {
      x: newX,
      y: newY,
      date: tempMilestone.date,
      attachedToBar: attachmentResult.attachedToBar,
      relativePosition: attachmentResult.relativePosition
    };

    onMilestoneUpdate(dragState.draggedMilestone, updates);

    // 触发附着变化回调
    onAttachmentChange(
      dragState.draggedMilestone,
      attachmentResult.attachedToBar,
      attachmentResult.relativePosition
    );
  }, [
    attachment,
    onMilestoneUpdate,
    onAttachmentChange,
    pixelToDate,
    getTaskRowIndex,
    checkBounds
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
      date: pixelToDate(dragState.originalPosition.x),
      attachedToBar: undefined,
      relativePosition: undefined
    };

    onMilestoneUpdate(dragState.draggedMilestone, updates);

    // 结束拖拽
    endMilestoneDrag();
  }, [onMilestoneUpdate, pixelToDate, endMilestoneDrag]);

  // 同步移动附着的里程碑（当任务条移动时）
  const syncAttachedMilestones = useCallback((
    task: Task,
    milestones: MilestoneNode[],
    taskHeight: number
  ): MilestoneNode[] => {
    const rowIndex = getTaskRowIndex(task.id);
    if (rowIndex === -1) return milestones;

    return attachment.updateAttachedMilestones(
      task as any, // TaskBar 类型兼容性
      milestones,
      taskHeight,
      rowIndex
    );
  }, [attachment, getTaskRowIndex]);

  // 处理里程碑重叠错开
  const handleMilestoneOverlap = useCallback((
    milestones: MilestoneNode[],
    nodeSize: number = 16
  ): MilestoneNode[] => {
    return attachment.handleMilestoneOverlap(milestones, nodeSize);
  }, [attachment]);

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
      potentialAttachmentBar: null, // 需要从上下文获取
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
    
    // 同步操作
    syncAttachedMilestones,
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