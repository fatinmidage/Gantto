import { ProjectRow, Task, MilestoneNode } from '../types';

// 初始项目行数据
export const initialProjectRows: ProjectRow[] = [
  {
    id: 'row-0',
    title: '项目里程碑',
    order: 0,
    type: 'default',
    level: 0,
    isExpanded: false
  },
  {
    id: 'row-1',
    title: '交付计划',
    order: 1,
    type: 'delivery' as const,
    level: 0,
    isExpanded: false
  },
  {
    id: 'row-2',
    title: '产品开发',
    order: 2,
    type: 'development' as const,
    level: 0,
    children: ['row-3', 'row-4', 'row-5'],
    isExpanded: true
  },
  {
    id: 'row-3',
    title: 'A样开发',
    order: 3,
    type: 'development' as const,
    level: 1,
    parentId: 'row-2',
    isExpanded: false
  },
  {
    id: 'row-4',
    title: 'B样开发',
    order: 4,
    type: 'development' as const,
    level: 1,
    parentId: 'row-2',
    isExpanded: false
  },
  {
    id: 'row-5',
    title: 'C样开发',
    order: 5,
    type: 'development' as const,
    level: 1,
    parentId: 'row-2',
    isExpanded: false
  },
  {
    id: 'row-6',
    title: '软件测试',
    order: 6,
    type: 'testing' as const,
    level: 0,
    children: ['row-7', 'row-8', 'row-9'],
    isExpanded: true
  },
  {
    id: 'row-7',
    title: '单元测试',
    order: 7,
    type: 'testing' as const,
    level: 1,
    parentId: 'row-6',
    isExpanded: false
  },
  {
    id: 'row-8',
    title: '集成测试',
    order: 8,
    type: 'testing' as const,
    level: 1,
    parentId: 'row-6',
    isExpanded: false
  },
  {
    id: 'row-9',
    title: '系统测试',
    order: 9,
    type: 'testing' as const,
    level: 1,
    parentId: 'row-6',
    isExpanded: false
  }
];

// 初始任务数据
export const initialChartTasks: Task[] = [];

// 初始里程碑节点数据
export const initialMilestones: MilestoneNode[] = [];