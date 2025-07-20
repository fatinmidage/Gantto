/**
 * 里程碑管理器 Hook
 * 整合里程碑的 CRUD 操作、拖拽、附着检测等所有功能
 */

import { useState, useCallback } from 'react';
import { MilestoneNode, MilestoneCreateInput, MilestoneUpdateInput, Task } from '../../types/task';
import { useMilestoneDrag } from './useMilestoneDrag';
import { useMilestoneAttachment } from './useMilestoneAttachment';

interface MilestoneManagerCallbacks {
  dateToPixel: (date: Date) => number;
  pixelToDate: (pixel: number) => Date;
  getTaskRowIndex: (taskId: string) => number;
  taskHeight: number;
}

export const useMilestoneManager = (callbacks: MilestoneManagerCallbacks) => {
  const [milestones, setMilestones] = useState<MilestoneNode[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);

  // 里程碑更新回调
  const handleMilestoneUpdate = useCallback((milestoneId: string, updates: Partial<MilestoneNode>) => {
    setMilestones(prev => prev.map(milestone => 
      milestone.id === milestoneId 
        ? { ...milestone, ...updates, updatedAt: new Date() }
        : milestone
    ));
  }, []);

  // 附着关系变化回调
  const handleAttachmentChange = useCallback((
    milestoneId: string, 
    attachedToBar?: string, 
    relativePosition?: number
  ) => {
    console.log(`[MilestoneManager] 里程碑 ${milestoneId} 附着状态变化:`, {
      attachedToBar,
      relativePosition
    });
  }, []);

  // 初始化拖拽功能
  const milestoneDrag = useMilestoneDrag({
    onMilestoneUpdate: handleMilestoneUpdate,
    onAttachmentChange: handleAttachmentChange,
    ...callbacks
  });

  // 初始化附着检测功能
  const attachment = useMilestoneAttachment();

  // === CRUD 操作 ===

  // 创建里程碑
  const createMilestone = useCallback((input: MilestoneCreateInput): MilestoneNode => {
    const newMilestone: MilestoneNode = {
      id: `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: input.title,
      date: input.date,
      iconType: input.iconType || 'milestone',
      label: input.label,
      color: input.color || '#ff9800',
      attachedToBar: input.attachedToBar,
      relativePosition: input.relativePosition,
      x: callbacks.dateToPixel(input.date),
      y: 0, // 将在渲染时计算正确的 Y 位置
      createdAt: new Date(),
      updatedAt: new Date(),
      isCreatedFromContext: true
    };

    setMilestones(prev => [...prev, newMilestone]);
    return newMilestone;
  }, [callbacks]);

  // 更新里程碑
  const updateMilestone = useCallback((updates: MilestoneUpdateInput) => {
    setMilestones(prev => prev.map(milestone => {
      if (milestone.id === updates.id) {
        const updated = { ...milestone, ...updates, updatedAt: new Date() };
        
        // 如果日期发生变化，重新计算 X 位置
        if (updates.date && updates.date !== milestone.date) {
          updated.x = callbacks.dateToPixel(updates.date);
        }
        
        return updated;
      }
      return milestone;
    }));
  }, [callbacks]);

  // 删除里程碑
  const deleteMilestone = useCallback((milestoneId: string) => {
    setMilestones(prev => prev.filter(milestone => milestone.id !== milestoneId));
    if (selectedMilestone === milestoneId) {
      setSelectedMilestone(null);
    }
  }, [selectedMilestone]);

  // 批量删除里程碑
  const deleteMilestones = useCallback((milestoneIds: string[]) => {
    setMilestones(prev => prev.filter(milestone => !milestoneIds.includes(milestone.id)));
    if (selectedMilestone && milestoneIds.includes(selectedMilestone)) {
      setSelectedMilestone(null);
    }
  }, [selectedMilestone]);

  // === 附着管理 ===

  // 将里程碑附着到任务条
  const attachMilestoneToTask = useCallback((milestoneId: string, taskId: string, task: Task) => {
    const milestone = milestones.find(m => m.id === milestoneId);
    if (!milestone || !milestone.x) return;

    const relativePosition = attachment.calculateRelativePosition(milestone, task as any);
    updateMilestone({
      id: milestoneId,
      attachedToBar: taskId,
      relativePosition
    });
  }, [milestones, attachment, updateMilestone]);

  // 脱离里程碑与任务条的附着
  const detachMilestoneFromTask = useCallback((milestoneId: string) => {
    updateMilestone({
      id: milestoneId,
      attachedToBar: undefined,
      relativePosition: undefined
    });
  }, [updateMilestone]);

  // 同步更新附着的里程碑位置（当任务条移动时）
  const syncAttachedMilestones = useCallback((task: Task) => {
    const attachedMilestones = milestones.filter(
      milestone => milestone.attachedToBar === task.id
    );

    if (attachedMilestones.length === 0) return;

    const rowIndex = callbacks.getTaskRowIndex(task.id);
    if (rowIndex === -1) return;

    const updatedMilestones = attachment.updateAttachedMilestones(
      task as any,
      attachedMilestones,
      callbacks.taskHeight,
      rowIndex
    );

    // 批量更新里程碑位置
    setMilestones(prev => prev.map(milestone => {
      const updated = updatedMilestones.find(u => u.id === milestone.id);
      return updated || milestone;
    }));
  }, [milestones, callbacks, attachment]);

  // === 级联操作 ===

  // 任务删除时的级联删除
  const handleTaskDeleted = useCallback((taskId: string) => {
    const attachedMilestones = milestones.filter(
      milestone => milestone.attachedToBar === taskId
    );
    
    if (attachedMilestones.length > 0) {
      deleteMilestones(attachedMilestones.map(m => m.id));
    }
  }, [milestones, deleteMilestones]);

  // === 查询和过滤 ===

  // 获取特定任务的附着里程碑
  const getMilestonesForTask = useCallback((taskId: string): MilestoneNode[] => {
    return milestones.filter(milestone => milestone.attachedToBar === taskId);
  }, [milestones]);

  // 获取独立的里程碑（未附着到任何任务）
  const getIndependentMilestones = useCallback((): MilestoneNode[] => {
    return milestones.filter(milestone => !milestone.attachedToBar);
  }, [milestones]);

  // 根据日期范围过滤里程碑
  const getMilestonesByDateRange = useCallback((startDate: Date, endDate: Date): MilestoneNode[] => {
    return milestones.filter(milestone => 
      milestone.date >= startDate && milestone.date <= endDate
    );
  }, [milestones]);

  // === 选择管理 ===

  const selectMilestone = useCallback((milestoneId: string | null) => {
    setSelectedMilestone(milestoneId);
  }, []);

  return {
    // 状态
    milestones,
    selectedMilestone,
    
    // CRUD 操作
    createMilestone,
    updateMilestone,
    deleteMilestone,
    deleteMilestones,
    
    // 附着管理
    attachMilestoneToTask,
    detachMilestoneFromTask,
    syncAttachedMilestones,
    
    // 级联操作
    handleTaskDeleted,
    
    // 查询操作
    getMilestonesForTask,
    getIndependentMilestones,
    getMilestonesByDateRange,
    
    // 选择管理
    selectMilestone,
    
    // 拖拽功能
    startMilestoneDrag: milestoneDrag.startMilestoneDrag,
    updateMilestoneDragPosition: milestoneDrag.updateMilestoneDragPosition,
    endMilestoneDrag: milestoneDrag.endMilestoneDrag,
    cancelMilestoneDrag: milestoneDrag.cancelMilestoneDrag,
    isDraggingMilestone: milestoneDrag.isDragging,
    draggedMilestone: milestoneDrag.draggedMilestone,
    
    // 重叠处理
    handleMilestoneOverlap: milestoneDrag.handleMilestoneOverlap,
    
    // 工具方法
    setMilestones
  };
};