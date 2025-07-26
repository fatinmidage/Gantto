/**
 * 图标配置文件
 * 定义所有可用的图标类型和显示配置
 */

import * as Icons from '../components/icons';

// 图标配置接口
export interface IconConfig {
  id: string;
  label: string;
  component: React.ComponentType<any>; // 使用any类型避免lucide-react的类型复杂性
  color: string;
  category: 'development' | 'business' | 'status' | 'tools' | 'default';
}

// 所有可用图标的配置
export const AVAILABLE_ICONS: IconConfig[] = [
  // 默认图标
  { id: 'default', label: '默认任务', component: Icons.Circle, color: '#666666', category: 'default' },
  
  // 开发相关图标
  { id: 'development', label: '开发', component: Icons.Code, color: '#2196f3', category: 'development' },
  { id: 'bug', label: '修复', component: Icons.Bug, color: '#f44336', category: 'development' },
  { id: 'database', label: '数据库', component: Icons.Database, color: '#4caf50', category: 'development' },
  { id: 'server', label: '服务器', component: Icons.Server, color: '#607d8b', category: 'development' },
  { id: 'globe', label: '网络', component: Icons.Globe, color: '#03a9f4', category: 'development' },
  { id: 'cpu', label: '性能', component: Icons.Cpu, color: '#ff9800', category: 'development' },
  { id: 'monitor', label: '桌面端', component: Icons.Monitor, color: '#795548', category: 'development' },
  { id: 'smartphone', label: '移动端', component: Icons.Smartphone, color: '#9c27b0', category: 'development' },
  { id: 'laptop', label: '客户端', component: Icons.Laptop, color: '#3f51b5', category: 'development' },
  
  // 业务相关图标
  { id: 'users', label: '团队协作', component: Icons.Users, color: '#2196f3', category: 'business' },
  { id: 'user', label: '个人任务', component: Icons.User, color: '#607d8b', category: 'business' },
  { id: 'calendar', label: '计划', component: Icons.Calendar, color: '#4caf50', category: 'business' },
  { id: 'clock', label: '时间管理', component: Icons.Clock, color: '#ff9800', category: 'business' },
  { id: 'flag', label: '里程碑', component: Icons.Flag, color: '#f44336', category: 'business' },
  { id: 'star', label: '重要任务', component: Icons.Star, color: '#ffc107', category: 'business' },
  { id: 'heart', label: '收藏', component: Icons.Heart, color: '#e91e63', category: 'business' },
  { id: 'book', label: '学习', component: Icons.BookOpen, color: '#673ab7', category: 'business' },
  
  // 状态相关图标
  { id: 'testing', label: '测试', component: Icons.CheckCircle, color: '#4caf50', category: 'status' },
  { id: 'delivery', label: '交付', component: Icons.Package, color: '#9c27b0', category: 'status' },
  { id: 'play', label: '进行中', component: Icons.Play, color: '#4caf50', category: 'status' },
  { id: 'pause', label: '暂停', component: Icons.Pause, color: '#ff9800', category: 'status' },
  { id: 'stop', label: '停止', component: Icons.Square, color: '#f44336', category: 'status' },
  { id: 'warning', label: '警告', component: Icons.AlertTriangle, color: '#ff9800', category: 'status' },
  { id: 'success', label: '成功', component: Icons.CheckCircle2, color: '#4caf50', category: 'status' },
  { id: 'error', label: '错误', component: Icons.XCircle, color: '#f44336', category: 'status' },
  { id: 'info', label: '信息', component: Icons.Info, color: '#2196f3', category: 'status' },
  { id: 'zap', label: '快速任务', component: Icons.Zap, color: '#ffc107', category: 'status' },
  
  // 工具相关图标
  { id: 'wrench', label: '配置', component: Icons.Wrench, color: '#795548', category: 'tools' },
  { id: 'hammer', label: '构建', component: Icons.Hammer, color: '#ff5722', category: 'tools' },
  { id: 'scissors', label: '编辑', component: Icons.Scissors, color: '#9c27b0', category: 'tools' },
  { id: 'paintbrush', label: '设计', component: Icons.Paintbrush, color: '#e91e63', category: 'tools' },
  { id: 'camera', label: '拍照', component: Icons.Camera, color: '#607d8b', category: 'tools' },
  { id: 'image', label: '图片', component: Icons.Image, color: '#4caf50', category: 'tools' },
  { id: 'video', label: '视频', component: Icons.Video, color: '#f44336', category: 'tools' }
];

// 根据ID获取图标配置
export const getIconConfig = (iconId: string): IconConfig => {
  const config = AVAILABLE_ICONS.find(icon => icon.id === iconId);
  return config || AVAILABLE_ICONS[0]; // 如果没找到就返回默认图标
};

// 根据分类获取图标列表
export const getIconsByCategory = (category: IconConfig['category']): IconConfig[] => {
  return AVAILABLE_ICONS.filter(icon => icon.category === category);
};

// 获取所有图标分类
export const ICON_CATEGORIES = [
  { id: 'default' as const, label: '默认' },
  { id: 'development' as const, label: '开发' },
  { id: 'business' as const, label: '业务' },
  { id: 'status' as const, label: '状态' },
  { id: 'tools' as const, label: '工具' }
];

// 向后兼容的类型映射
export const LEGACY_TYPE_MAPPING: Record<string, string> = {
  'development': 'development',
  'testing': 'testing',
  'delivery': 'delivery',
  'default': 'default'
};