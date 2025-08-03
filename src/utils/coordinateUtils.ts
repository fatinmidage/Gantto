/**
 * 坐标计算统一工具类
 * 解决任务条和里程碑节点的坐标计算和同步问题
 */

import { Task, MilestoneNode } from '../types/task';
import { layoutUtils, LAYOUT_CONSTANTS } from '../components/gantt/ganttStyles';

// 坐标计算接口
export interface CalculatedPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

// 里程碑坐标计算接口
export interface MilestonePosition extends CalculatedPosition {
  centerX: number;
  centerY: number;
}

// 任务条坐标计算接口
export interface TaskPosition extends CalculatedPosition {
  width: number;
  height: number;
}

/**
 * 统一坐标计算工具类
 */
export class CoordinateUtils {
  private dateToPixel: (date: Date) => number;
  private taskHeight: number;

  constructor(dateToPixel: (date: Date) => number, taskHeight: number) {
    this.dateToPixel = dateToPixel;
    this.taskHeight = taskHeight;
  }

  /**
   * 计算任务条的完整位置信息
   */
  calculateTaskPosition(task: Task, rowIndex: number): TaskPosition {
    console.log('🧮 [DEBUG] calculateTaskPosition 开始计算:', {
      taskId: task.id,
      taskTitle: task.title,
      startDate: task.startDate.toISOString().split('T')[0],
      endDate: task.endDate.toISOString().split('T')[0],
      rowIndex
    });

    const startX = this.dateToPixel(task.startDate);
    const endX = this.dateToPixel(task.endDate);
    const width = Math.max(endX - startX, LAYOUT_CONSTANTS.MIN_TASK_WIDTH); // 使用常量定义的最小宽度
    const x = startX;
    const y = layoutUtils.calculateTaskY(rowIndex, this.taskHeight);

    const result = {
      x,
      y,
      width,
      height: this.taskHeight
    };

    console.log('✅ [DEBUG] calculateTaskPosition 计算结果:', {
      taskId: task.id,
      startX,
      endX,
      calculatedX: x,
      calculatedWidth: width,
      calculatedY: y,
      result
    });

    return result;
  }

  /**
   * 计算里程碑节点的完整位置信息
   */
  calculateMilestonePosition(milestone: MilestoneNode, rowIndex: number, nodeSize: number = LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE): MilestonePosition {
    const centerX = this.dateToPixel(milestone.date);
    
    // 使用新的行中心计算函数，确保里程碑节点中心与任务条中心完全对齐
    const centerY = layoutUtils.calculateRowCenterY(rowIndex, this.taskHeight);
    
    // 计算节点左上角位置（用于渲染）
    const x = centerX - nodeSize / 2;
    const y = centerY - nodeSize / 2;


    return {
      x,
      y,
      width: nodeSize,
      height: nodeSize,
      centerX,
      centerY
    };
  }

  /**
   * 检查坐标是否有漂移（超过误差范围）
   */
  hasCoordinateDrift(current: CalculatedPosition, stored: CalculatedPosition, tolerance: number = 1): boolean {
    return Math.abs(current.x - stored.x) > tolerance ||
           Math.abs(current.y - stored.y) > tolerance;
  }

  /**
   * 同步任务条坐标
   */
  syncTaskCoordinates(task: Task, rowIndex: number): Partial<Task> {
    const calculated = this.calculateTaskPosition(task, rowIndex);
    
    // 只返回需要更新的字段
    const updates: Partial<Task> = {};
    if (task.x !== calculated.x) updates.x = calculated.x;
    if (task.width !== calculated.width) updates.width = calculated.width;
    
    return updates;
  }

  /**
   * 同步里程碑坐标
   */
  syncMilestoneCoordinates(milestone: MilestoneNode, rowIndex: number, nodeSize: number = LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE): Partial<MilestoneNode> {
    const calculated = this.calculateMilestonePosition(milestone, rowIndex, nodeSize);
    
    // 只返回需要更新的字段
    const updates: Partial<MilestoneNode> = {};
    if (milestone.x !== calculated.x) updates.x = calculated.x;
    if (milestone.y !== calculated.y) updates.y = calculated.y;
    
    return updates;
  }

  /**
   * 批量计算多个任务的坐标
   */
  batchCalculateTaskPositions(tasks: Task[], getRowIndex: (task: Task) => number): Map<string, TaskPosition> {
    const positions = new Map<string, TaskPosition>();
    
    for (const task of tasks) {
      const rowIndex = getRowIndex(task);
      positions.set(task.id, this.calculateTaskPosition(task, rowIndex));
    }
    
    return positions;
  }

  /**
   * 批量计算多个里程碑的坐标
   */
  batchCalculateMilestonePositions(
    milestones: MilestoneNode[], 
    getRowIndex: (milestone: MilestoneNode) => number,
    nodeSize: number = LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE
  ): Map<string, MilestonePosition> {
    const positions = new Map<string, MilestonePosition>();
    
    for (const milestone of milestones) {
      const rowIndex = getRowIndex(milestone);
      positions.set(milestone.id, this.calculateMilestonePosition(milestone, rowIndex, nodeSize));
    }
    
    return positions;
  }

  /**
   * 更新计算配置
   */
  updateConfig(dateToPixel: (date: Date) => number, taskHeight: number): void {
    this.dateToPixel = dateToPixel;
    this.taskHeight = taskHeight;
  }
}

/**
 * 坐标计算工厂函数
 */
export function createCoordinateUtils(dateToPixel: (date: Date) => number, taskHeight: number): CoordinateUtils {
  return new CoordinateUtils(dateToPixel, taskHeight);
}

/**
 * 便捷的坐标计算函数（无状态）
 */
export const coordinateHelpers = {
  /**
   * 快速计算任务条位置
   */
  calculateTaskPosition(
    task: Task, 
    rowIndex: number, 
    dateToPixel: (date: Date) => number, 
    taskHeight: number
  ): TaskPosition {
    const utils = new CoordinateUtils(dateToPixel, taskHeight);
    return utils.calculateTaskPosition(task, rowIndex);
  },

  /**
   * 快速计算里程碑位置
   */
  calculateMilestonePosition(
    milestone: MilestoneNode,
    rowIndex: number,
    dateToPixel: (date: Date) => number,
    taskHeight: number,
    nodeSize: number = LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE
  ): MilestonePosition {
    const utils = new CoordinateUtils(dateToPixel, taskHeight);
    return utils.calculateMilestonePosition(milestone, rowIndex, nodeSize);
  }
};