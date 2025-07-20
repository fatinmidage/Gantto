/**
 * 里程碑拖拽 Hook
 * 专门处理里程碑节点的拖拽逻辑，包括独立拖拽和附着/脱离检测
 */

import { useCallback, useRef } from 'react';
import { MilestoneNode, Task } from '../../types/task';
import { useMilestoneAttachment } from './useMilestoneAttachment';

interface MilestoneDragState {
  isDragging: boolean;
  draggedMilestone: string | null;
  dragOffset: { x: number; y: number };
  originalPosition: { x: number; y: number } | null;
}

interface MilestoneDragCallbacks {
  onMilestoneUpdate: (milestoneId: string, updates: Partial<MilestoneNode>) => void;
  onAttachmentChange: (milestoneId: string, attachedToBar?: string, relativePosition?: number) => void;
  dateToPixel: (date: Date) => number;
  pixelToDate: (pixel: number) => Date;
  getTaskRowIndex: (taskId: string) => number;
}

export const useMilestoneDrag = (callbacks: MilestoneDragCallbacks) => {
  const {
    onMilestoneUpdate,
    onAttachmentChange,
    pixelToDate,
    getTaskRowIndex
  } = callbacks;

  // 拖拽状态
  const dragStateRef = useRef<MilestoneDragState>({
    isDragging: false,
    draggedMilestone: null,
    dragOffset: { x: 0, y: 0 },
    originalPosition: null
  });

  // 容器边界缓存
  const containerBoundsRef = useRef<DOMRect | null>(null);

  // 引入附着检测逻辑
  const attachment = useMilestoneAttachment();

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
    if (!bounds || !milestone.x || !milestone.y) return;

    // 计算拖拽偏移量
    const offset = {
      x: clientX - bounds.left - milestone.x,
      y: clientY - bounds.top - milestone.y
    };

    // 更新拖拽状态
    dragStateRef.current = {
      isDragging: true,
      draggedMilestone: milestone.id,
      dragOffset: offset,
      originalPosition: { x: milestone.x, y: milestone.y }
    };
  }, [updateContainerBounds]);

  // 更新拖拽位置
  const updateMilestoneDragPosition = useCallback((
    clientX: number,
    clientY: number,
    allTasks: Task[],
    taskHeight: number
  ) => {
    const dragState = dragStateRef.current;
    if (!dragState.isDragging || !dragState.draggedMilestone) return;

    const bounds = containerBoundsRef.current;
    if (!bounds) return;

    // 计算新位置
    const newX = clientX - bounds.left - dragState.dragOffset.x;
    const newY = clientY - bounds.top - dragState.dragOffset.y;

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
    getTaskRowIndex
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
      originalPosition: null
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
  const getDragState = useCallback((): MilestoneDragState => {
    return { ...dragStateRef.current };
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
    
    // 状态属性（便于组件使用）
    get isDragging() {
      return dragStateRef.current.isDragging;
    },
    
    get draggedMilestone() {
      return dragStateRef.current.draggedMilestone;
    }
  };
};