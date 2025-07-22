# 🎯 TimelineHeader分层显示技术方案

## 📋 需求总结

### 核心需求
- **层次选择**: 用户手动选择2层或3层显示模式
- **颗粒度配置**: 先选择最底层颗粒度 → 再选择上层颗粒度
- **完全自定义**: 用户可任意组合有效的颗粒度层次，不限制无意义组合
- **UI设计**: 等高布局，简单细线分割，统一白色背景，居中对齐文本

### UI设计规格
- **设置面板**: 独立按钮弹出设置面板
- **分层显示**: 每层只显示一种时间颗粒度，不合并显示
- **边界处理**: 不完整单元格截断显示
- **无交互**: 纯展示组件，无悬停或点击反馈
- **周起始**: 周一作为一周开始

### 时间颗粒度显示格式
```typescript
日: "1", "2", "3", ..., "31"           // 纯数字
周: "WK1", "WK2", "WK3", ..., "WK52"   // WK + 周数
月: "1", "2", "3", ..., "12"           // 纯数字  
年: "2024", "2025", "2026"             // 完整年份
```

## 📊 1. 数据结构设计

### 核心接口定义
```typescript
// 时间轴层次配置
interface TimelineLayerConfig {
  layers: 2 | 3;
  bottom: TimeGranularity;
  middle?: TimeGranularity;  // 2层时为上层，3层时为中层
  top?: TimeGranularity;     // 仅3层时需要
}

// 分层时间刻度
interface LayeredTimeScale {
  layers: TimeScaleLayer[];
  totalHeight: number;
}

interface TimeScaleLayer {
  type: TimeGranularity;
  items: TimeScaleItem[];
  height: number;
  level: number; // 0=底层, 1=中层, 2=顶层
}

interface TimeScaleItem {
  type: TimeGranularity;
  label: string;
  x: number;
  width: number;
  startDate: Date;
  endDate: Date;
}
```

### 标签格式映射
```typescript
const GRANULARITY_LABEL_FORMATTERS = {
  day: (date: Date) => date.getDate().toString(),
  week: (date: Date) => {
    const weekNum = getWeekOfYear(date);
    return `WK${weekNum}`;
  },
  month: (date: Date) => (date.getMonth() + 1).toString(),
  quarter: (date: Date) => `Q${Math.floor(date.getMonth() / 3) + 1}`,
  year: (date: Date) => date.getFullYear().toString()
};
```

## 🏗️ 2. 组件架构设计

### 主要组件结构
```
TimelineHeader.tsx (重构后)
├── LayeredTimelineHeader.tsx (新增)
├── TimelineSettingsPanel.tsx (新增) 
├── hooks/
│   ├── useLayeredTimeline.ts (新增)
│   └── useTimelineSettings.ts (新增)
└── utils/
    └── timelineLayerUtils.ts (新增)
```

### 组件职责分配
```typescript
// TimelineHeader.tsx - 主入口组件 (兼容现有接口)
interface TimelineHeaderProps {
  timelineHeight: number;
  timeScales: TimeScale[];
  dateToPixel: (date: Date) => number;
  containerHeight: number;
  isCurrentDateInRange?: boolean;
  // 新增属性
  layerConfig?: TimelineLayerConfig;
  onLayerConfigChange?: (config: TimelineLayerConfig) => void;
}

// LayeredTimelineHeader.tsx - 分层渲染组件
interface LayeredTimelineHeaderProps {
  layeredTimeScales: LayeredTimeScale;
  dateToPixel: (date: Date) => number;
  containerHeight: number;
  isCurrentDateInRange?: boolean;
}

// TimelineSettingsPanel.tsx - 设置面板
interface TimelineSettingsPanelProps {
  config: TimelineLayerConfig;
  onConfigChange: (config: TimelineLayerConfig) => void;
  isOpen: boolean;
  onClose: () => void;
}
```

## ⚙️ 3. Hook设计

### useLayeredTimeline.ts
```typescript
export const useLayeredTimeline = (
  config: TimelineLayerConfig,
  dateRange: DateRange,
  dateToPixel: (date: Date) => number
) => {
  const layeredTimeScales = useMemo((): LayeredTimeScale => {
    const layers: TimeScaleLayer[] = [];
    const layerHeight = 55 / config.layers; // 等高分配

    // 生成各层时间刻度
    if (config.layers === 2) {
      layers.push(
        generateTimeScaleLayer(config.middle!, 1, layerHeight, dateRange, dateToPixel),
        generateTimeScaleLayer(config.bottom, 0, layerHeight, dateRange, dateToPixel)
      );
    } else if (config.layers === 3) {
      layers.push(
        generateTimeScaleLayer(config.top!, 2, layerHeight, dateRange, dateToPixel),
        generateTimeScaleLayer(config.middle!, 1, layerHeight, dateRange, dateToPixel),
        generateTimeScaleLayer(config.bottom, 0, layerHeight, dateRange, dateToPixel)
      );
    }

    return {
      layers,
      totalHeight: 55
    };
  }, [config, dateRange, dateToPixel]);

  return { layeredTimeScales };
};
```

### useTimelineSettings.ts
```typescript
export const useTimelineSettings = (initialConfig?: TimelineLayerConfig) => {
  const [config, setConfig] = useState<TimelineLayerConfig>(
    initialConfig || { layers: 2, bottom: 'day', middle: 'month' }
  );
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // 验证配置合理性（虽然不限制，但提供警告）
  const validateConfig = useCallback((newConfig: TimelineLayerConfig) => {
    // 这里可以添加逻辑验证和警告
    return newConfig;
  }, []);

  const updateConfig = useCallback((newConfig: Partial<TimelineLayerConfig>) => {
    setConfig(prev => validateConfig({ ...prev, ...newConfig }));
  }, [validateConfig]);

  return {
    config,
    updateConfig,
    isPanelOpen,
    setIsPanelOpen
  };
};
```

## 🛠️ 4. 核心工具函数

### timelineLayerUtils.ts
```typescript
// 生成单层时间刻度
export const generateTimeScaleLayer = (
  granularity: TimeGranularity,
  level: number,
  height: number,
  dateRange: DateRange,
  dateToPixel: (date: Date) => number
): TimeScaleLayer => {
  const items: TimeScaleItem[] = [];
  const formatter = GRANULARITY_LABEL_FORMATTERS[granularity];

  // 根据颗粒度类型生成时间项
  switch (granularity) {
    case 'day':
      generateDayItems(items, dateRange, dateToPixel, formatter);
      break;
    case 'week':
      generateWeekItems(items, dateRange, dateToPixel, formatter);
      break;
    case 'month':
      generateMonthItems(items, dateRange, dateToPixel, formatter);
      break;
    case 'quarter':
      generateQuarterItems(items, dateRange, dateToPixel, formatter);
      break;
    case 'year':
      generateYearItems(items, dateRange, dateToPixel, formatter);
      break;
  }

  return {
    type: granularity,
    items,
    height,
    level
  };
};

// 获取年内周数（周一开始）
export const getWeekOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const day = Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
  const startDay = start.getDay() || 7; // 周日=7
  return Math.ceil((day + startDay - 2) / 7);
};
```

## 🎨 5. UI组件实现

### LayeredTimelineHeader.tsx
```typescript
const LayeredTimelineHeader: React.FC<LayeredTimelineHeaderProps> = ({
  layeredTimeScales,
  containerHeight,
  isCurrentDateInRange,
  dateToPixel
}) => {
  return (
    <>
      {/* 分层时间轴头部 */}
      <div className="gantt-layered-timeline" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: layeredTimeScales.totalHeight,
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0',
        zIndex: 20,
        boxSizing: 'border-box'
      }}>
        {layeredTimeScales.layers.map((layer, layerIndex) => (
          <div key={layerIndex} className="timeline-layer" style={{
            position: 'absolute',
            top: layer.level * layer.height,
            left: 0,
            right: 0,
            height: layer.height,
            borderBottom: layerIndex < layeredTimeScales.layers.length - 1 
              ? '1px solid #e0e0e0' : 'none'
          }}>
            {layer.items.map((item, itemIndex) => (
              <div key={itemIndex} className="timeline-scale-item" style={{
                position: 'absolute',
                left: item.x,
                top: 0,
                width: item.width,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#333',
                fontWeight: 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'clip'
              }}>
                {item.label}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 继承原有的网格线和当前日期线 */}
      <div className="gantt-grid-lines" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: containerHeight,
        pointerEvents: 'none',
        zIndex: 15
      }}>
        {/* 使用底层的时间刻度生成网格线 */}
        {layeredTimeScales.layers[0]?.items.map((item, index) => (
          <div key={index} className="gantt-grid-line" style={{
            position: 'absolute',
            left: item.x,
            top: layeredTimeScales.totalHeight,
            width: '1px',
            height: containerHeight - layeredTimeScales.totalHeight,
            backgroundColor: '#e0e0e0',
            opacity: 0.8
          }} />
        ))}
      </div>

      {/* 当前日期指示线 */}
      {isCurrentDateInRange && (
        <div className="gantt-current-date-line" style={{
          position: 'absolute',
          left: dateToPixel(new Date()) - 1,
          top: 0,
          width: '2px',
          height: containerHeight,
          backgroundColor: '#ff4444',
          zIndex: 25,
          pointerEvents: 'none',
          boxShadow: '0 0 6px rgba(255, 68, 68, 0.4)'
        }} />
      )}
    </>
  );
};
```

### TimelineSettingsPanel.tsx
```typescript
const TimelineSettingsPanel: React.FC<TimelineSettingsPanelProps> = ({
  config,
  onConfigChange,
  isOpen,
  onClose
}) => {
  const [localConfig, setLocalConfig] = useState(config);

  const granularityOptions: { value: TimeGranularity; label: string }[] = [
    { value: 'day', label: '日' },
    { value: 'week', label: '周' },
    { value: 'month', label: '月' },
    { value: 'quarter', label: '季度' },
    { value: 'year', label: '年' }
  ];

  const handleApply = () => {
    onConfigChange(localConfig);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="timeline-settings-panel" style={{
      position: 'absolute',
      top: '100%',
      right: 0,
      zIndex: 100,
      backgroundColor: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      padding: '16px',
      minWidth: '280px'
    }}>
      <div className="settings-header">
        <h3>时间轴设置</h3>
        <button onClick={onClose}>×</button>
      </div>

      <div className="settings-content">
        {/* 层数选择 */}
        <div className="setting-group">
          <label>显示层数</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                checked={localConfig.layers === 2}
                onChange={() => setLocalConfig(prev => ({ ...prev, layers: 2 }))}
              />
              2层
            </label>
            <label>
              <input
                type="radio"
                checked={localConfig.layers === 3}
                onChange={() => setLocalConfig(prev => ({ ...prev, layers: 3 }))}
              />
              3层
            </label>
          </div>
        </div>

        {/* 底层颗粒度 */}
        <div className="setting-group">
          <label>底层颗粒度</label>
          <Select.Root
            value={localConfig.bottom}
            onValueChange={(value: TimeGranularity) => 
              setLocalConfig(prev => ({ ...prev, bottom: value }))
            }
          >
            {/* Select内容 */}
          </Select.Root>
        </div>

        {/* 中层/上层颗粒度 */}
        <div className="setting-group">
          <label>{localConfig.layers === 2 ? '上层' : '中层'}颗粒度</label>
          <Select.Root
            value={localConfig.middle}
            onValueChange={(value: TimeGranularity) => 
              setLocalConfig(prev => ({ ...prev, middle: value }))
            }
          >
            {/* Select内容 */}
          </Select.Root>
        </div>

        {/* 顶层颗粒度 (仅3层时显示) */}
        {localConfig.layers === 3 && (
          <div className="setting-group">
            <label>顶层颗粒度</label>
            <Select.Root
              value={localConfig.top}
              onValueChange={(value: TimeGranularity) => 
                setLocalConfig(prev => ({ ...prev, top: value }))
              }
            >
              {/* Select内容 */}
            </Select.Root>
          </div>
        )}
      </div>

      <div className="settings-actions">
        <button onClick={onClose}>取消</button>
        <button onClick={handleApply}>应用</button>
      </div>
    </div>
  );
};
```

## 📝 6. 实现步骤规划

### 阶段1: 基础工具函数 (1-2小时)
1. 创建 `timelineLayerUtils.ts` - 时间刻度生成算法
2. 创建 `useTimelineSettings.ts` - 设置状态管理
3. 创建 `useLayeredTimeline.ts` - 分层数据生成

### 阶段2: 核心组件开发 (2-3小时)
4. 创建 `LayeredTimelineHeader.tsx` - 分层渲染组件
5. 创建 `TimelineSettingsPanel.tsx` - 设置面板
6. 重构 `TimelineHeader.tsx` - 兼容新旧两种模式

### 阶段3: 集成和优化 (1-2小时)
7. 扩展 `useTimeline.ts` - 支持分层配置
8. 更新 `GanttChartHeader.tsx` - 集成设置按钮
9. 添加必要的CSS样式

### 阶段4: 测试和调优 (1小时)
10. 功能测试和边界情况处理
11. 性能优化和代码Review
12. 文档更新

## 🎯 7. 兼容性保证

### 向后兼容策略
```typescript
// TimelineHeader.tsx 主组件保持现有接口
// 通过可选参数支持新功能
interface TimelineHeaderProps {
  // 现有必需参数保持不变
  timelineHeight: number;
  timeScales: TimeScale[];
  dateToPixel: (date: Date) => number;
  containerHeight: number;
  isCurrentDateInRange?: boolean;
  
  // 新增可选参数
  layerConfig?: TimelineLayerConfig;
  onLayerConfigChange?: (config: TimelineLayerConfig) => void;
  enableLayeredMode?: boolean; // 是否启用分层模式
}
```

### 模式切换逻辑
```typescript
// 根据是否提供layerConfig自动切换模式
const isLayeredMode = Boolean(layerConfig && enableLayeredMode);

return isLayeredMode ? (
  <LayeredTimelineHeader {...layeredProps} />
) : (
  <ClassicTimelineHeader {...classicProps} />
);
```

## 📊 8. 性能考虑

### 优化策略
1. **记忆化计算**: `useMemo` 缓存分层时间刻度计算结果
2. **虚拟化渲染**: 大量时间项时考虑虚拟滚动
3. **防抖设置**: 设置面板变更使用防抖避免频繁重计算
4. **按需渲染**: 只渲染可视区域内的时间刻度项

### 内存管理
```typescript
// 清理策略
useEffect(() => {
  return () => {
    // 清理大量计算结果的缓存
    timeScaleCache.clear();
  };
}, []);
```

## ✅ 技术方案总结

**核心特点**:
- **完全向后兼容** - 现有功能无变化
- **模块化设计** - 符合CLAUDE.md规范，新增文件均<150行
- **用户友好** - 独立设置面板，分步配置
- **高性能** - 记忆化计算，按需渲染
- **类型安全** - 完整TypeScript支持

**预估工作量**: 6-8小时完成全部开发和测试

## 📊 显示效果示例

### 2层示例 (月→日)
```
┌─────────────────────────────────────────────────────────┐
│    1    │    2    │    3    │    4    │    5    │    6  │ ← 月份层
├─────────────────────────────────────────────────────────┤
│1│2│3...│1│2│3...│1│2│3...│1│2│3...│1│2│3...│1│2│3...│ ← 日期层
└─────────────────────────────────────────────────────────┘
```

### 3层示例 (年→月→日)  
```
┌─────────────────────────────────────────────────────────┐
│         2024         │         2025         │         │ ← 年份层
├─────────────────────────────────────────────────────────┤
│ 1│ 2│ 3│...│12│ 1│ 2│ 3│...│12│ 1│ 2│ 3│...│12│ 1│ 2│ ← 月份层
├─────────────────────────────────────────────────────────┤
│1..31│1..28│1..31│...│1│2│3...│1│2│3...│1│2│3...│1│2│3│ ← 日期层
└─────────────────────────────────────────────────────────┘
```

---

*本方案基于Gantto甘特图应用的现有架构设计，保证了完全的向后兼容性和模块化设计原则。*