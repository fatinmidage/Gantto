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

// 精简的图标配置 - 仅保留8个指定图标
export const AVAILABLE_ICONS: IconConfig[] = [
  { id: 'circle', label: '基础任务', component: Icons.Circle, color: '#666666', category: 'default' },
  { id: 'circle-check', label: '已完成', component: Icons.CircleCheck, color: '#4caf50', category: 'default' },
  { id: 'circle-dashed', label: '进行中', component: Icons.CircleDashed, color: '#2196f3', category: 'default' },
  { id: 'milestone', label: '关键节点', component: Icons.Milestone, color: '#673ab7', category: 'default' },
  { id: 'flag', label: '里程碑', component: Icons.Flag, color: '#f44336', category: 'default' },
  { id: 'star', label: '重要任务', component: Icons.Star, color: '#ffc107', category: 'default' },
  { id: 'battery-full', label: '高优先级', component: Icons.BatteryFull, color: '#ff5722', category: 'default' },
  { id: 'package', label: '交付包', component: Icons.Package, color: '#9c27b0', category: 'default' }
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

// 简化的图标分类 - 由于只有8个图标，仅保留默认分类
export const ICON_CATEGORIES = [
  { id: 'default' as const, label: '任务图标' }
];

// 向后兼容的类型映射 - 简化为新的图标ID
export const LEGACY_TYPE_MAPPING: Record<string, string> = {
  'development': 'circle',
  'testing': 'circle-check',
  'delivery': 'package',
  'default': 'circle'
};