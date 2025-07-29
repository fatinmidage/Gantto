/**
 * 里程碑管理器 Hook
 * 整合里程碑的 CRUD 操作、拖拽、附着检测等所有功能
 */

import { useState, useCallback } from 'react';
import { MilestoneNode, MilestoneCreateInput, MilestoneUpdateInput } from '../../types/task';
import { useMilestoneDrag } from './useMilestoneDrag';
import { formatDateToMD, hasDateInLabel, replaceDateInLabel } from '../../utils/ganttUtils';

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
    setMilestones(prev => {
      const updated = prev.map(milestone => {
        if (milestone.id === milestoneId) {
          const updatedMilestone = { ...milestone, ...updates, updatedAt: new Date() };
          return updatedMilestone;
        }
        return milestone;
      });
      
      return updated;
    });
  }, []);


  // 获取里程碑数据的回调
  const getMilestone = useCallback((milestoneId: string) => {
    return milestones.find(m => m.id === milestoneId);
  }, [milestones]);

  // 初始化拖拽功能
  const milestoneDrag = useMilestoneDrag({
    onMilestoneUpdate: handleMilestoneUpdate,
    onAttachmentChange: () => {}, // 空回调，保持接口兼容
    getMilestone,
    ...callbacks
  });

  // === CRUD 操作 ===

  // 创建里程碑
  const createMilestone = useCallback((input: MilestoneCreateInput): MilestoneNode => {
    const newMilestone: MilestoneNode = {
      id: `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: input.title,
      date: input.date,
      iconType: input.iconType || 'default',
      label: input.label || formatDateToMD(input.date), // 如果没有提供标签，自动生成M.D格式标签
      color: input.color || '#ff9800',
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
          
          // 如果标签包含日期，智能替换为新日期
          if (milestone.label && hasDateInLabel(milestone.label)) {
            updated.label = replaceDateInLabel(milestone.label, updates.date);
          }
        }
        
        return updated;
      }
      return milestone;
    }));
  }, [callbacks]);

  // 通过日历选择器更新里程碑日期
  const updateMilestoneDate = useCallback((milestoneId: string, newDate: Date) => {
    setMilestones(prev => prev.map(milestone => {
      if (milestone.id === milestoneId) {
        const updated = { 
          ...milestone, 
          date: newDate,
          x: callbacks.dateToPixel(newDate),
          updatedAt: new Date()
        };
        
        // 如果标签包含日期，智能替换为新日期
        if (milestone.label && hasDateInLabel(milestone.label)) {
          updated.label = replaceDateInLabel(milestone.label, newDate);
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


  // === 查询和过滤 ===

  // 获取所有里程碑（现在都是独立的）
  const getAllMilestones = useCallback((): MilestoneNode[] => {
    return milestones;
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
    updateMilestoneDate,
    deleteMilestone,
    deleteMilestones,
    
    // 查询操作
    getAllMilestones,
    getMilestonesByDateRange,
    
    // 选择管理
    selectMilestone,
    
    // 拖拽功能
    startMilestoneDrag: milestoneDrag.startMilestoneDrag,
    updateMilestoneDragPosition: milestoneDrag.updateMilestoneDragPosition,
    endMilestoneDrag: milestoneDrag.endMilestoneDrag,
    cancelMilestoneDrag: milestoneDrag.cancelMilestoneDrag,
    isDraggingMilestone: milestoneDrag.getDragState().isDragging,
    draggedMilestone: milestoneDrag.getDragState().draggedMilestoneId,
    
    // 重叠处理
    handleMilestoneOverlap: milestoneDrag.handleMilestoneOverlap,
    
    // 工具方法
    setMilestones
  };
};