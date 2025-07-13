import { ProjectRow, Task } from '../types';

// 初始项目行数据
export const initialProjectRows: ProjectRow[] = [
  {
    id: 'row-0',
    title: '项目里程碑',
    order: 0,
    type: 'milestone' as const,
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
export const initialChartTasks: Task[] = [
  {
    id: 'task-1',
    title: '需求分析',
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 0, 15),
    color: '#4CAF50',
    rowId: 'row-2',
    type: 'development',
    status: 'completed',
    progress: 100
  },
  {
    id: 'task-2',
    title: '架构设计',
    startDate: new Date(2024, 0, 10),
    endDate: new Date(2024, 0, 25),
    color: '#2196F3',
    rowId: 'row-2',
    type: 'development',
    status: 'completed',
    progress: 100
  },
  {
    id: 'task-3',
    title: '前端开发',
    startDate: new Date(2024, 0, 20),
    endDate: new Date(2024, 1, 20),
    color: '#FF9800',
    rowId: 'row-3',
    type: 'development',
    status: 'in-progress',
    progress: 65
  },
  {
    id: 'task-4',
    title: '后端开发',
    startDate: new Date(2024, 0, 25),
    endDate: new Date(2024, 1, 25),
    color: '#9C27B0',
    rowId: 'row-4',
    type: 'development',
    status: 'in-progress',
    progress: 45
  },
  {
    id: 'task-5',
    title: '数据库设计',
    startDate: new Date(2024, 1, 1),
    endDate: new Date(2024, 1, 10),
    color: '#607D8B',
    rowId: 'row-5',
    type: 'development',
    status: 'pending',
    progress: 0
  },
  {
    id: 'task-6',
    title: 'API测试',
    startDate: new Date(2024, 1, 15),
    endDate: new Date(2024, 2, 1),
    color: '#795548',
    rowId: 'row-7',
    type: 'testing',
    status: 'pending',
    progress: 0
  },
  {
    id: 'task-7',
    title: '界面测试',
    startDate: new Date(2024, 1, 20),
    endDate: new Date(2024, 2, 5),
    color: '#E91E63',
    rowId: 'row-8',
    type: 'testing',
    status: 'pending',
    progress: 0
  },
  {
    id: 'task-8',
    title: '性能测试',
    startDate: new Date(2024, 2, 1),
    endDate: new Date(2024, 2, 15),
    color: '#3F51B5',
    rowId: 'row-9',
    type: 'testing',
    status: 'pending',
    progress: 0
  },
  {
    id: 'task-9',
    title: '发布准备',
    startDate: new Date(2024, 2, 10),
    endDate: new Date(2024, 2, 20),
    color: '#F44336',
    rowId: 'row-1',
    type: 'delivery',
    status: 'pending',
    progress: 0
  },
  {
    id: 'task-10',
    title: '项目启动',
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 0, 1),
    color: '#FFD700',
    rowId: 'row-0',
    type: 'milestone',
    status: 'completed',
    progress: 100
  }
];