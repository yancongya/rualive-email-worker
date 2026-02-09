# 前端组件文档

## 概述

本文档详细说明了 RuAlive Email Worker 前端的所有组件，包括组件的功能、props、状态管理和使用示例。

---

## 组件列表

### 1. 用户仪表板组件 (User Dashboard)

**文件位置**: `public/src/user-v6.tsx`

**功能**: 用户主界面，包含所有用户功能的面板和交互。

#### 主要子组件

#### 1.1 LogoAnimation 组件

**功能**: 品牌标识动画

**Props**:
```typescript
interface LogoAnimationProps {
  className?: string;
}
```

**使用示例**:
```tsx
<LogoAnimation className="w-16 h-16" />
```

**特点**:
- GSAP 动画
- 响应式设计
- 支持 Tailwind CSS 类名

---

#### 1.2 NavigationBar 组件

**功能**: 顶部导航栏，包含用户信息、语言切换、登出等

**Props**:
```typescript
interface NavigationBarProps {
  t: any;           // 翻译函数
  trans: any;       // 翻译文本对象
  language: string; // 当前语言
  onLanguageChange: (lang: string) => void;
  onLogout: () => void;
  user: any;        // 当前用户信息
  isChinese: boolean;
}
```

**主要功能**:
- 显示用户头像和用户名
- 语言切换（中文/英文）
- 登出按钮
- 响应式布局

**使用示例**:
```tsx
<NavigationBar
  t={t}
  trans={trans}
  language="zh"
  onLanguageChange={(lang) => setLanguage(lang)}
  onLogout={handleLogout}
  user={currentUser}
  isChinese={true}
/>
```

---

#### 1.3 MetricToggle 组件

**功能**: 数据维度切换按钮，用于显示/隐藏不同的数据指标

**Props**:
```typescript
interface MetricToggleProps {
  active: boolean;         // 是否激活
  onClick: () => void;     // 点击事件
  onContextMenu: (e: React.MouseEvent) => void; // 右键菜单（独占模式）
  label: string;           // 标签文本
  value: number;           // 数值
  formatValue?: (v: number) => string; // 格式化函数
  color: string;           // 颜色（十六进制）
  icon: React.ComponentType; // 图标组件
  hint: string;            // 提示文本
}
```

**支持的指标**:
- 合成数量 (Compositions)
- 图层总数 (Layers)
- 关键帧数量 (Keyframes)
- 效果数量 (Effects)
- 运行时长 (Runtime)
- 项目数量 (Project Count)

**使用示例**:
```tsx
<MetricToggle
  active={visibleMetrics.compositions}
  onClick={() => toggleMetric('compositions')}
  onContextMenu={(e) => { e.preventDefault(); soloMetric('compositions'); }}
  label={trans.compositions}
  value={totals.compositions}
  color="#3b82f6"
  icon={LayoutGrid}
  hint={trans.toggleSoloHint}
/>
```

**交互说明**:
- **左键点击**: 切换显示/隐藏该指标
- **右键点击**: 独占显示该指标（隐藏其他所有指标）

---

#### 1.4 OptionSwitch 组件

**功能**: 通用开关组件，用于切换各种选项

**Props**:
```typescript
interface OptionSwitchProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ComponentType;
  hideLabelOnMobile?: boolean;
}
```

**使用场景**:
- 归一化曲线开关（图表视图）
- 显示每日数据开关

**使用示例**:
```tsx
<OptionSwitch
  active={normalizeData}
  onClick={() => setNormalizeData(!normalizeData)}
  label={trans.normalizeCurves}
  icon={AlignLeft}
  hideLabelOnMobile={true}
/>
```

---

#### 1.5 AnalyticsTable 组件

**功能**: 数据表格，显示按时间聚合的工作数据

**Props**:
```typescript
interface AnalyticsTableProps {
  data: any[];                      // 表格数据（已聚合）
  trans: any;                       // 翻译文本
  formatRuntime: (s: number) => string; // 运行时长格式化函数
  onNavigate: (date: string, projectName?: string) => void; // 导航回调
}
```

**表格列**:
- 时间 (Period)
- 项目数 (Projects)
- 合成数 (Compositions)
- 图层总数 (Layers)
- 关键帧数 (Keyframes)
- 特效应用 (Effects)
- 运行时长 (Runtime)

**功能特性**:
- 排序（点击表头）
- 分页（每页 10 条）
- 双击导航到 Dashboard
- 响应式布局

**使用示例**:
```tsx
<AnalyticsTable
  data={tableData}
  trans={trans}
  formatRuntime={formatRuntime}
  onNavigate={(date, projectName) => {
    navigateToDashboard(date, projectName);
  }}
/>
```

---

#### 1.6 StatsGrid 组件

**功能**: 统计网格，显示详细的数据分布

**Props**:
```typescript
interface StatsGridProps {
  title: string;
  data: Record<string, number>;
  type: 'count' | 'duration';
  trans: any;
  maxItems?: number;
}
```

**支持的类型**:
- `count`: 数量统计（如关键帧分布）
- `duration`: 时长统计（如项目运行时长）

**使用示例**:
```tsx
<StatsGrid
  title={trans.keyframeDensity}
  data={aggregatedDetails.keyframes}
  type="count"
  trans={trans}
  maxItems={10}
/>
```

---

#### 1.7 LogsTable 组件

**功能**: 邮件发送日志表格

**Props**:
```typescript
interface LogsTableProps {
  logs: any[];
  trans: any;
  formatTime: (s: string) => string;
}
```

**表格列**:
- 日期 (Date)
- 邮箱 (Email)
- 主题 (Subject)
- 状态 (Status)
- 发送时间 (Sent At)
- 错误信息 (Error)

**使用示例**:
```tsx
<LogsTable
  logs={sendLogs}
  trans={trans}
  formatTime={formatTime}
/>
```

---

#### 1.8 ChartView 组件

**功能**: 图表视图，使用 Recharts 显示数据趋势

**Props**:
```typescript
interface ChartViewProps {
  data: any[];
  visibleMetrics: Record<string, boolean>;
  trans: any;
  formatRuntime: (s: number) => string;
  normalizeData: boolean;
  viewMode: 'week' | 'month' | 'quarter' | 'year' | 'all';
}
```

**支持的图表类型**:
- Area Chart（面积图）
- Bar Chart（柱状图）

**数据维度**:
- 合成数量
- 图层总数
- 关键帧数量
- 效果数量
- 运行时长
- 项目数量

**使用示例**:
```tsx
<ChartView
  data={finalDisplayData}
  visibleMetrics={visibleMetrics}
  trans={trans}
  formatRuntime={formatRuntime}
  normalizeData={normalizeData}
  viewMode="week"
/>
```

---

#### 1.9 TimeSelector 组件

**功能**: 时间范围选择器，用于切换视图模式

**Props**:
```typescript
interface TimeSelectorProps {
  viewMode: 'week' | 'month' | 'quarter' | 'year' | 'all';
  onViewModeChange: (mode: string) => void;
  cursorDate: Date;
  onCursorDateChange: (date: Date) => void;
  trans: any;
}
```

**视图模式**:
- `week`: 周视图
- `month`: 月视图
- `quarter`: 季度视图
- `year`: 年视图
- `all`: 全部数据

**功能特性**:
- 上一个/下一个按钮
- 自定义日期选择
- 快捷选择（本周、本月等）

**使用示例**:
```tsx
<TimeSelector
  viewMode={viewMode}
  onViewModeChange={(mode) => setViewMode(mode)}
  cursorDate={cursorDate}
  onCursorDateChange={(date) => setCursorDate(date)}
  trans={trans}
/>
```

---

#### 1.10 TabManager 组件

**功能**: 标签页管理器，用于切换不同的功能面板

**Props**:
```typescript
interface TabManagerProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{
    id: string;
    label: string;
    icon: React.ComponentType;
  }>;
}
```

**支持的面板**:
- Dashboard（仪表板）
- Analytics（数据分析）
- Logs（日志）
- Settings（设置）

**使用示例**:
```tsx
<TabManager
  activeTab={activeTab}
  onTabChange={(tab) => setActiveTab(tab)}
  tabs={[
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]}
/>
```

---

#### 1.11 DataList 组件

**功能**: 数据列表，显示键值对数据

**Props**:
```typescript
interface DataListProps {
  data: Record<string, number>;
  type: 'count' | 'duration';
  trans: any;
}
```

**使用示例**:
```tsx
<DataList
  data={aggregatedDetails.keyframes}
  type="count"
  trans={trans}
/>
```

---

#### 1.12 DashboardPanel 组件

**功能**: 仪表板面板容器，包含标题和计数

**Props**:
```typescript
interface DashboardPanelProps {
  title: string;
  count: number;
  countLabel?: string;
  children: React.ReactNode;
  className?: string;
}
```

**使用示例**:
```tsx
<DashboardPanel
  title={trans.keyframeDensity}
  count={Object.values(aggregatedDetails.keyframes).reduce((a, b) => a + b, 0)}
  countLabel={trans.total}
  className="h-[220px]"
>
  <DataList data={aggregatedDetails.keyframes} type="count" trans={trans} />
</DashboardPanel>
```

---

## 组件状态管理

### 全局状态

```typescript
// 用户状态
const [user, setUser] = useState<User | null>(null);

// 认证状态
const [isAuthenticated, setIsAuthenticated] = useState(false);

// 语言状态
const [language, setLanguage] = useState('zh');

// 当前标签页
const [activeTab, setActiveTab] = useState('dashboard');

// 加载状态
const [isLoading, setIsLoading] = useState(false);
```

### 分析视图状态

```typescript
// 视图模式
const [viewMode, setViewMode] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('week');

// 当前日期
const [cursorDate, setCursorDate] = useState(new Date());

// 显示每日数据
const [showDaily, setShowDaily] = useState(false);

// 归一化数据
const [normalizeData, setNormalizeData] = useState(true);

// 可见指标
const [visibleMetrics, setVisibleMetrics] = useState({
  compositions: true,
  layers: true,
  keyframes: true,
  effects: true,
  runtime: true,
  projectCount: true
});

// 显示模式
const [displayMode, setDisplayMode] = useState<'chart' | 'table'>('chart');
```

### 数据状态

```typescript
// 工作日志
const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);

// 发送日志
const [sendLogs, setSendLogs] = useState<SendLog[]>([]);

// 聚合详情
const [aggregatedDetails, setAggregatedDetails] = useState<AggregatedDetails>({
  keyframes: {},
  compositions: [],
  layers: {},
  effectCounts: {}
});

// 总计数据
const [totals, setTotals] = useState<Totals>({
  compositions: 0,
  layers: 0,
  keyframes: 0,
  effects: 0,
  runtime: 0,
  projectCount: 0
});
```

### 配置状态

```typescript
// 用户配置
const [config, setConfig] = useState<UserConfig | null>(null);

// AE 状态
const [aeStatus, setAeStatus] = useState<AeStatus | null>(null);
```

---

## 组件交互流程

### 1. 数据加载流程

```
组件挂载
  ↓
检查本地缓存
  ↓
如果缓存有效，使用缓存数据
  ↓
如果缓存无效，从 API 加载
  ↓
解析并更新状态
  ↓
重新渲染组件
```

### 2. 视图切换流程

```
用户点击标签页
  ↓
更新 activeTab 状态
  ↓
触发 TabManager onChange
  ↓
切换显示内容
  ↓
重新渲染组件
```

### 3. 数据筛选流程

```
用户选择视图模式（周/月/季/年）
  ↓
更新 viewMode 状态
  ↓
更新 cursorDate 状态
  ↓
过滤 workLogs
  ↓
聚合数据
  ↓
更新图表/表格
```

### 4. 指标切换流程

```
用户点击 MetricToggle
  ↓
更新 visibleMetrics 状态
  ↓
触发图表重新渲染
  ↓
更新图例
  ↓
显示/隐藏对应的数据系列
```

---

## 组件样式系统

### Tailwind CSS 使用

所有组件使用 Tailwind CSS 进行样式管理：

```tsx
// 示例：MetricToggle 组件样式
<button
  className={`
    relative flex items-center justify-center gap-2 px-2 py-3 rounded-sm border transition-all duration-300 group
    flex-1 min-w-0
    ${active
      ? `bg-[${color}]/10 border-[${color}] text-white shadow-[0_0_15px_-5px_${color}]`
      : 'bg-white/5 border-white/10 text-ru-textDim hover:bg-white/10 hover:border-white/20'
    }
  `}
  style={{
    borderColor: active ? color : undefined,
  }}
>
  {/* 组件内容 */}
</button>
```

### 自定义颜色变量

```css
:root {
  --ru-primary: #FF6B35;
  --ru-secondary: #4ECDC4;
  --ru-text: #ffffff;
  --ru-textDim: #ffffff60;
  --ru-glass: rgba(255, 255, 255, 0.05);
  --ru-glassBorder: rgba(255, 255, 255, 0.1);
}
```

---

## 组件性能优化

### 1. 使用 useMemo

```typescript
// 缓存聚合数据
const aggregatedDetails = useMemo(() => {
  // 聚合逻辑
  return result;
}, [filteredWorkLogs]);

// 缓存表格数据
const tableData = useMemo(() => {
  return filteredRawData.map((d: any) => ({
    ...d,
    projectCount: d.projects ? d.projects.length : 0
  }));
}, [filteredRawData]);
```

### 2. 使用 useCallback

```typescript
// 缓存回调函数
const handleTabChange = useCallback((tab: string) => {
  setActiveTab(tab);
}, []);

const handleSort = useCallback((key: string) => {
  // 排序逻辑
}, [sortConfig]);
```

### 3. 虚拟滚动

对于大量数据的表格，考虑使用虚拟滚动：

```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={data.length}
  itemSize={50}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      {/* 列表项 */}
    </div>
  )}
</FixedSizeList>
```

---

## 组件测试

### 单元测试示例

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MetricToggle } from './MetricToggle';

describe('MetricToggle', () => {
  it('should render with correct label and value', () => {
    render(
      <MetricToggle
        active={true}
        onClick={() => {}}
        onContextMenu={() => {}}
        label="Compositions"
        value={100}
        color="#3b82f6"
        icon={LayoutGrid}
        hint="Toggle compositions"
      />
    );

    expect(screen.getByText('Compositions')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(
      <MetricToggle
        active={false}
        onClick={handleClick}
        onContextMenu={() => {}}
        label="Compositions"
        value={100}
        color="#3b82f6"
        icon={LayoutGrid}
        hint="Toggle compositions"
      />
    );

    fireEvent.click(screen.getByText('Compositions'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## 组件文档更新

当添加新组件或修改现有组件时，请更新本文档：

1. 添加组件说明
2. 列出 Props 接口
3. 提供使用示例
4. 说明交互行为
5. 记录状态管理

---

**文档版本**: 1.0
**最后更新**: 2026-02-08
**作者**: iFlow CLI