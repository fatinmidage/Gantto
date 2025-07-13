/**
 * 项目相关类型定义
 * 项目行和项目配置
 */

import { Task } from './task';

// 项目行接口 - 专门用于左侧任务列表的显示
export interface ProjectRow {
  // 行标识
  id: string;
  
  // 关联任务（可选，有些行可能只是分组标题）
  taskId?: string;
  
  // 显示属性
  title: string;
  order: number; // 显示顺序
  level?: number; // 缩进层级，0为根级，改为可选兼容现有代码
  type?: 'milestone' | 'development' | 'testing' | 'delivery' | 'default'; // 添加type字段兼容现有代码
  
  // 状态
  isExpanded?: boolean; // 是否展开子行，改为可选
  isVisible?: boolean; // 是否可见，改为可选
  
  // 层级关系（与Task的层级关系分离，兼容现有字段名）
  parentId?: string; // 兼容现有的parentId字段名
  parentRowId?: string;
  children?: string[]; // 兼容现有的children字段名
  childRowIds?: string[];
  
  // UI特定属性（改为可选）
  height?: number;
  isSelected?: boolean;
  isHovered?: boolean;
  
  // 分组特性
  isGroup?: boolean; // 是否为分组行（无关联任务）
  groupType?: 'phase' | 'milestone' | 'custom'; // 分组类型
}

// 项目配置接口
export interface ProjectConfig {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  
  // 显示设置
  workingDays: number[]; // 工作日 0-6 (周日-周六)
  workingHours: {
    start: string; // HH:mm 格式
    end: string;
  };
  
  // 默认设置
  defaultTaskColor: string;
  defaultTaskType: string;
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  version: number;
}

// 项目数据集合
export interface ProjectData {
  config: ProjectConfig;
  tasks: Task[];
  rows: ProjectRow[];
  
  // 项目统计信息
  stats?: ProjectStats;
}

// 项目统计信息
export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  
  totalDuration: number; // 总工期（天）
  completedDuration: number; // 已完成工期
  
  milestonesCount: number;
  completedMilestonesCount: number;
  
  lastUpdated: Date;
}

// 项目导入导出格式
export interface ProjectExportData {
  version: string;
  exportedAt: Date;
  project: ProjectData;
  metadata: {
    exportedBy?: string;
    format: 'json' | 'csv' | 'xlsx';
    includeStats: boolean;
  };
}

// 项目模板
export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  
  // 模板数据
  tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[];
  rows: Omit<ProjectRow, 'id'>[];
  config: Partial<ProjectConfig>;
  
  // 模板元数据
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  tags: string[];
}