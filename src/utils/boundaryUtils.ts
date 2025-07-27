/**
 * 统一边界检测工具
 * 提供任务条和里程碑节点的统一边界约束逻辑
 */

import { LAYOUT_CONSTANTS } from '../components/gantt/ganttStyles';

// 边界约束配置接口
export interface BoundaryConfig {
  containerWidth: number;
  containerHeight: number;
  margin?: number; // 边界缓冲区大小
}

// 元素尺寸接口
export interface ElementSize {
  width: number;
  height: number;
}

// 位置接口
export interface Position {
  x: number;
  y: number;
}

// 约束结果接口
export interface ConstrainedPosition extends Position {
  isWithinBounds: boolean;
  wasConstrained: boolean;
}

/**
 * 统一边界检测工具类
 */
export class BoundaryUtils {
  private config: BoundaryConfig;

  constructor(config: BoundaryConfig) {
    this.config = {
      margin: 8, // 默认8px边界缓冲区
      ...config
    };
  }

  /**
   * 更新边界配置
   */
  updateConfig(config: Partial<BoundaryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 检查位置是否在边界内
   */
  isWithinBounds(position: Position, elementSize: ElementSize): boolean {
    const { containerWidth, containerHeight, margin = 0 } = this.config;
    const { width, height } = elementSize;

    // 计算有效边界
    const minX = margin;
    const maxX = containerWidth - width - margin;
    const minY = margin;
    const maxY = containerHeight - height - margin;

    return position.x >= minX && 
           position.x <= maxX && 
           position.y >= minY && 
           position.y <= maxY;
  }

  /**
   * 约束位置到边界内（基于元素左上角坐标）
   */
  constrainPosition(position: Position, elementSize: ElementSize): ConstrainedPosition {
    const { containerWidth, containerHeight, margin = 0 } = this.config;
    const { width, height } = elementSize;

    // 计算有效边界
    const minX = margin;
    const maxX = containerWidth - width - margin;
    const minY = margin;
    const maxY = containerHeight - height - margin;

    // 约束到边界内
    const constrainedX = Math.max(minX, Math.min(position.x, maxX));
    const constrainedY = Math.max(minY, Math.min(position.y, maxY));

    const wasConstrained = constrainedX !== position.x || constrainedY !== position.y;
    const isWithinBounds = this.isWithinBounds({ x: constrainedX, y: constrainedY }, elementSize);

    return {
      x: constrainedX,
      y: constrainedY,
      isWithinBounds,
      wasConstrained
    };
  }

  /**
   * 约束任务条位置（基于中心点坐标）
   */
  constrainTaskBarPosition(centerX: number, taskWidth: number): ConstrainedPosition {
    const { containerWidth, margin = 0 } = this.config;

    // 基于中心点的边界计算
    const halfWidth = taskWidth / 2;
    const minCenterX = halfWidth + margin;
    const maxCenterX = containerWidth - halfWidth - margin;

    const constrainedCenterX = Math.max(minCenterX, Math.min(centerX, maxCenterX));
    const wasConstrained = constrainedCenterX !== centerX;

    return {
      x: constrainedCenterX,
      y: 0, // Y坐标由行索引确定，不需要约束
      isWithinBounds: constrainedCenterX >= minCenterX && constrainedCenterX <= maxCenterX,
      wasConstrained
    };
  }

  /**
   * 约束里程碑位置（基于中心点坐标）
   */
  constrainMilestonePosition(centerX: number, centerY: number, nodeSize: number = LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE): ConstrainedPosition {
    const { containerWidth, containerHeight, margin = 0 } = this.config;

    // 基于中心点的边界计算
    const halfSize = nodeSize / 2;
    const minCenterX = halfSize + margin;
    const maxCenterX = containerWidth - halfSize - margin;
    const minCenterY = halfSize + margin;
    const maxCenterY = containerHeight - halfSize - margin;

    const constrainedCenterX = Math.max(minCenterX, Math.min(centerX, maxCenterX));
    const constrainedCenterY = Math.max(minCenterY, Math.min(centerY, maxCenterY));

    const wasConstrained = constrainedCenterX !== centerX || constrainedCenterY !== centerY;
    const isWithinBounds = constrainedCenterX >= minCenterX && 
                          constrainedCenterX <= maxCenterX && 
                          constrainedCenterY >= minCenterY && 
                          constrainedCenterY <= maxCenterY;

    return {
      x: constrainedCenterX,
      y: constrainedCenterY,
      isWithinBounds,
      wasConstrained
    };
  }

  /**
   * 检查任务条调整大小的边界约束
   */
  constrainTaskBarResize(
    centerX: number, 
    width: number, 
    minWidth: number = LAYOUT_CONSTANTS.MIN_TASK_WIDTH
  ): { centerX: number; width: number; isValid: boolean } {
    const { containerWidth, margin = 0 } = this.config;

    // 确保最小宽度
    const constrainedWidth = Math.max(width, minWidth);
    const halfWidth = constrainedWidth / 2;

    // 边界约束
    const minCenterX = halfWidth + margin;
    const maxCenterX = containerWidth - halfWidth - margin;
    const constrainedCenterX = Math.max(minCenterX, Math.min(centerX, maxCenterX));

    const isValid = constrainedCenterX >= minCenterX && 
                   constrainedCenterX <= maxCenterX && 
                   constrainedWidth >= minWidth;

    return {
      centerX: constrainedCenterX,
      width: constrainedWidth,
      isValid
    };
  }

  /**
   * 获取当前边界配置
   */
  getConfig(): BoundaryConfig {
    return { ...this.config };
  }

  /**
   * 获取有效绘制区域
   */
  getDrawableArea(): { x: number; y: number; width: number; height: number } {
    const { containerWidth, containerHeight, margin = 0 } = this.config;
    
    return {
      x: margin,
      y: margin,
      width: containerWidth - 2 * margin,
      height: containerHeight - 2 * margin
    };
  }
}

/**
 * 创建边界检测工具实例
 */
export function createBoundaryUtils(config: BoundaryConfig): BoundaryUtils {
  return new BoundaryUtils(config);
}

/**
 * 便捷的边界检测函数（无状态）
 */
export const boundaryHelpers = {
  /**
   * 快速检查位置是否在边界内
   */
  isWithinBounds(
    position: Position, 
    elementSize: ElementSize, 
    containerWidth: number, 
    containerHeight: number, 
    margin: number = 8
  ): boolean {
    const utils = new BoundaryUtils({ containerWidth, containerHeight, margin });
    return utils.isWithinBounds(position, elementSize);
  },

  /**
   * 快速约束位置
   */
  constrainPosition(
    position: Position, 
    elementSize: ElementSize, 
    containerWidth: number, 
    containerHeight: number, 
    margin: number = 8
  ): ConstrainedPosition {
    const utils = new BoundaryUtils({ containerWidth, containerHeight, margin });
    return utils.constrainPosition(position, elementSize);
  },

  /**
   * 快速约束任务条位置
   */
  constrainTaskBar(
    centerX: number, 
    taskWidth: number, 
    containerWidth: number, 
    margin: number = 8
  ): ConstrainedPosition {
    const utils = new BoundaryUtils({ containerWidth, containerHeight: 0, margin });
    return utils.constrainTaskBarPosition(centerX, taskWidth);
  },

  /**
   * 快速约束里程碑位置
   */
  constrainMilestone(
    centerX: number, 
    centerY: number, 
    containerWidth: number, 
    containerHeight: number, 
    nodeSize: number = LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE, 
    margin: number = 8
  ): ConstrainedPosition {
    const utils = new BoundaryUtils({ containerWidth, containerHeight, margin });
    return utils.constrainMilestonePosition(centerX, centerY, nodeSize);
  }
};