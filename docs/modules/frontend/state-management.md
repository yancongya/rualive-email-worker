# 前端状态管理文档

## 概述

本文档详细说明了 RuAlive Email Worker 前端的状态管理架构，包括状态定义、状态更新、状态持久化和状态共享。

---

## 状态管理架构

### 技术栈

- **状态管理**: React Hooks（useState, useMemo, useCallback）
- **数据持久化**: localStorage
- **缓存策略**: Time-based expiration（基于时间的过期）
- **状态同步**: API 响应 → 状态更新 → UI 重新渲染

---

## 全局状态

### 1. 用户认证状态

```typescript
// 用户信息
const [user, setUser] = useState<User | null>(null);

// 认证状态
const [isAuthenticated, setIsAuthenticated] = useState(false);

// 加载状态
const [isLoading, setIsLoading] = useState(false);

// 错误状态
const [error, setError] = useState<string | null>(null);
```

#### 状态更新

```typescript
// 登录成功
const handleLogin = async (credentials: LoginCredentials) => {
  setIsLoading(true);
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();

    if (data.success) {
      setUser(data.data.user);
      setIsAuthenticated(true);
      // 保存 token 到 localStorage
      localStorage.setItem('auth_token', data.data.token);
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

// 登出
const handleLogout = () => {
  setUser(null);
  setIsAuthenticated(false);
  localStorage.removeItem('auth_token');
};
```

#### 状态持久化

```typescript
// 从 localStorage 恢复状态
useEffect(() => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    // 验证 token 并获取用户信息
    verifyToken(token).then(user => {
      setUser(user);
      setIsAuthenticated(true);
    });
  }
}, []);
```

---

### 2. 语言状态

```typescript
const [language, setLanguage] = useState<'zh' | 'en'>('zh');

// 翻译函数
const t = (key: string) => {
  return translations[language][key] || key;
};

// 翻译文本对象
const trans = translations[language];
```

#### 状态更新

```typescript
const handleLanguageChange = (lang: 'zh' | 'en') => {
  setLanguage(lang);
  localStorage.setItem('language', lang);
};

// 从 localStorage 恢复语言设置
useEffect(() => {
  const savedLanguage = localStorage.getItem('language') as 'zh' | 'en';
  if (savedLanguage) {
    setLanguage(savedLanguage);
  }
}, []);
```

---

### 3. UI 状态

```typescript
// 当前标签页
const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'logs' | 'settings'>('dashboard');

// 加载状态
const [isLoading, setIsLoading] = useState(false);

// 数据警告
const [dataWarning, setDataWarning] = useState<string | null>(null);
```

#### 标签页切换

```typescript
const handleTabChange = (tab: string) => {
  setActiveTab(tab);
  // 清理旧数据
  if (tab !== 'dashboard') {
    setWorkLogs([]);
  }
};
```

---

## 分析视图状态

### 1. 视图模式状态

```typescript
const [viewMode, setViewMode] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('week');

// 当前日期（用于周/月/季/年视图）
const [cursorDate, setCursorDate] = useState(new Date());

// 显示每日数据开关
const [showDaily, setShowDaily] = useState(false);
```

#### 状态更新

```typescript
// 切换视图模式
const handleViewModeChange = (mode: string) => {
  setViewMode(mode as any);
  // 重置 cursorDate 为当前日期
  setCursorDate(new Date());
};

// 上一个时间周期
const handlePreviousPeriod = () => {
  const newDate = new Date(cursorDate);
  switch (viewMode) {
    case 'week':
      newDate.setDate(newDate.getDate() - 7);
      break;
    case 'month':
      newDate.setMonth(newDate.getMonth() - 1);
      break;
    case 'quarter':
      newDate.setMonth(newDate.getMonth() - 3);
      break;
    case 'year':
      newDate.setFullYear(newDate.getFullYear() - 1);
      break;
  }
  setCursorDate(newDate);
};

// 下一个时间周期
const handleNextPeriod = () => {
  const newDate = new Date(cursorDate);
  switch (viewMode) {
    case 'week':
      newDate.setDate(newDate.getDate() + 7);
      break;
    case 'month':
      newDate.setMonth(newDate.getMonth() + 1);
      break;
    case 'quarter':
      newDate.setMonth(newDate.getMonth() + 3);
      break;
    case 'year':
      newDate.setFullYear(newDate.getFullYear() + 1);
      break;
  }
  setCursorDate(newDate);
};
```

---

### 2. 数据显示状态

```typescript
// 归一化数据开关
const [normalizeData, setNormalizeData] = useState(true);

// 显示模式（图表/表格）
const [displayMode, setDisplayMode] = useState<'chart' | 'table'>('chart');

// 可见指标
const [visibleMetrics, setVisibleMetrics] = useState({
  compositions: true,
  layers: true,
  keyframes: true,
  effects: true,
  runtime: true,
  projectCount: true
});
```

#### 状态更新

```typescript
// 切换归一化
const toggleNormalize = () => {
  setNormalizeData(!normalizeData);
};

// 切换显示模式
const toggleDisplayMode = () => {
  setDisplayMode(displayMode === 'chart' ? 'table' : 'chart');
};

// 切换指标显示
const toggleMetric = (metric: string) => {
  setVisibleMetrics(prev => ({
    ...prev,
    [metric]: !prev[metric]
  }));
};

// 独占显示单个指标
const soloMetric = (metric: string) => {
  const isSolo = Object.values(visibleMetrics).filter(v => v).length === 1 &&
                   visibleMetrics[metric];

  setVisibleMetrics({
    compositions: metric === 'compositions' ? !isSolo : false,
    layers: metric === 'layers' ? !isSolo : false,
    keyframes: metric === 'keyframes' ? !isSolo : false,
    effects: metric === 'effects' ? !isSolo : false,
    runtime: metric === 'runtime' ? !isSolo : false,
    projectCount: metric === 'projectCount' ? !isSolo : false
  });
};
```

---

### 3. 数据状态

```typescript
// 工作日志
const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);

// 发送日志
const [sendLogs, setSendLogs] = useState<SendLog[]>([]);

// 用户配置
const [config, setConfig] = useState<UserConfig | null>(null);

// AE 状态
const [aeStatus, setAeStatus] = useState<AeStatus | null>(null);
```

#### 数据加载

```typescript
// 加载工作日志
const loadWorkLogs = async (startDate?: string, endDate?: string) => {
  setIsLoading(true);
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`/api/work-logs?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      setWorkLogs(data.data);
      // 缓存到 localStorage
      cacheWorkLogs(data.data);
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};
```

---

## 计算状态 (Derived State)

### 1. 过滤后的工作日志

```typescript
const filteredWorkLogs = useMemo(() => {
  const { startDate, endDate } = getDateRange(viewMode, cursorDate);

  const filtered = workLogs.filter(log => {
    const date = log.work_date;
    const isInRange = date >= startDate && date <= endDate;
    return isInRange;
  });

  return filtered;
}, [workLogs, viewMode, cursorDate]);
```

### 2. 聚合数据

```typescript
const aggregatedDetails = useMemo(() => {
  const acc = {
    keyframes: {} as Record<string, number>,
    compositions: [] as string[],
    layers: {} as Record<string, number>,
    effectCounts: {} as Record<string, number>
  };

  const dailyDataMap = aggregateWorkLogsByDate(filteredWorkLogs);

  dailyDataMap.forEach((dailyData) => {
    dailyData.projects.forEach((p: any) => {
      if (!p.details) return;

      // 聚合关键帧
      if (p.details.keyframes) {
        Object.entries(p.details.keyframes).forEach(([layerName, count]) => {
          acc.keyframes[layerName] = (acc.keyframes[layerName] || 0) + (count as number);
        });
      }

      // 聚合合成
      if (p.details.compositions) {
        p.details.compositions.forEach((comp: string) => {
          if (!acc.compositions.includes(comp)) {
            acc.compositions.push(comp);
          }
        });
      }

      // 聚合图层
      if (p.details.layers) {
        Object.entries(p.details.layers).forEach(([type, count]) => {
          acc.layers[type] = (acc.layers[type] || 0) + (count as number);
        });
      }

      // 聚合效果
      if (p.details.effectCounts) {
        Object.entries(p.details.effectCounts).forEach(([effectName, count]) => {
          acc.effectCounts[effectName] = (acc.effectCounts[effectName] || 0) + (count as number);
        });
      }
    });
  });

  return acc;
}, [filteredWorkLogs]);
```

### 3. 总计数据

```typescript
const totals = useMemo(() => {
  const dailyDataMap = aggregateWorkLogsByDate(filteredWorkLogs);

  const result = Array.from(dailyDataMap.values()).reduce((acc: any, dailyData) => ({
    compositions: acc.compositions + dailyData.projects.reduce((sum: number, p: any) => sum + p.statistics.compositions, 0),
    layers: acc.layers + dailyData.projects.reduce((sum: number, p: any) => sum + p.statistics.layers, 0),
    keyframes: acc.keyframes + dailyData.projects.reduce((sum: number, p: any) => sum + p.statistics.keyframes, 0),
    effects: acc.effects + dailyData.projects.reduce((sum: number, p: any) => {
      if (!p.details.effectCounts) return sum;
      return sum + Object.values(p.details.effectCounts).reduce((total: number, count: number) => total + count, 0);
    }, 0),
    runtime: acc.runtime + dailyData.projects.reduce((sum: number, p: any) => sum + p.accumulatedRuntime, 0),
    projectCount: acc.projectCount + dailyData.projects.length,
  }), { compositions: 0, layers: 0, keyframes: 0, effects: 0, runtime: 0, projectCount: 0 });

  return result;
}, [filteredWorkLogs]);
```

### 4. 处理后的图表数据

```typescript
const processedData = useMemo(() => {
  // 添加 projectCount
  const withCounts = filteredRawData.map((d: any) => ({
    ...d,
    projectCount: d.projects ? d.projects.length : 0
  }));

  if (!normalizeData) {
    return withCounts;
  }

  // 归一化数据
  const maxVals = {
    compositions: Math.max(...withCounts.map((d: any) => d.compositions), 1),
    layers: Math.max(...withCounts.map((d: any) => d.layers), 1),
    keyframes: Math.max(...withCounts.map((d: any) => d.keyframes), 1),
    effects: Math.max(...withCounts.map((d: any) => d.effects), 1),
    runtime: Math.max(...withCounts.map((d: any) => d.runtime), 1),
    projectCount: Math.max(...withCounts.map((d: any) => d.projectCount), 1),
  };

  return withCounts.map((d: any) => ({
    ...d,
    _raw: { ...d },
    compositions: (d.compositions / maxVals.compositions) * 100,
    layers: (d.layers / maxVals.layers) * 100,
    keyframes: (d.keyframes / maxVals.keyframes) * 100,
    effects: (d.effects / maxVals.effects) * 100,
    runtime: (d.runtime / maxVals.runtime) * 100,
    projectCount: (d.projectCount / maxVals.projectCount) * 100,
  }));
}, [filteredRawData, normalizeData]);
```

---

## 数据持久化

### 1. localStorage 缓存

```typescript
// 缓存键
const CACHE_KEYS = {
  WORK_LOGS: 'analytics_view_work_logs',
  CACHE_TIME: 'analytics_view_cache_time',
  ALL_DATA: 'analytics_view_all_data',
  ALL_DATA_TIME: 'analytics_view_all_data_time',
  USER_CONFIG: 'user_config',
  LANGUAGE: 'language',
  AUTH_TOKEN: 'auth_token'
};

// 缓存策略
const CACHE_DURATION = 5 * 60 * 1000; // 5 分钟

// 保存缓存
const saveCache = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
  localStorage.setItem(`${key}_time`, Date.now().toString());
};

// 读取缓存
const loadCache = (key: string) => {
  const cachedData = localStorage.getItem(key);
  const cachedTime = localStorage.getItem(`${key}_time`);

  if (cachedData && cachedTime) {
    const isExpired = Date.now() - parseInt(cachedTime) > CACHE_DURATION;
    if (!isExpired) {
      return JSON.parse(cachedData);
    }
  }

  return null;
};
```

### 2. 工作日志缓存

```typescript
// 保存工作日志
const cacheWorkLogs = (logs: WorkLog[]) => {
  saveCache(CACHE_KEYS.WORK_LOGS, logs);
};

// 加载工作日志
const loadCachedWorkLogs = (): WorkLog[] | null => {
  return loadCache(CACHE_KEYS.WORK_LOGS);
};

// 检查缓存是否有效
const isCacheValid = (): boolean => {
  const cachedTime = localStorage.getItem(CACHE_KEYS.CACHE_TIME);
  if (!cachedTime) return false;

  const isExpired = Date.now() - parseInt(cachedTime) > CACHE_DURATION;
  return !isExpired;
};
```

### 3. 后台静默更新

```typescript
useEffect(() => {
  const ALL_DATA_RANGE = {
    startDate: '2020-01-01',
    endDate: '2030-12-31'
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      // 页面隐藏时，后台更新缓存
      getWorkLogsByRange(ALL_DATA_RANGE.startDate, ALL_DATA_RANGE.endDate, false)
        .then(response => {
          if (response.success && response.data) {
            localStorage.setItem(CACHE_KEYS.ALL_DATA, JSON.stringify(response.data));
            localStorage.setItem(CACHE_KEYS.ALL_DATA_TIME, Date.now().toString());
          }
        })
        .catch(error => {
          console.error('[AnalyticsView] Failed to update cache:', error);
        });
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

---

## 状态同步

### 1. API 响应 → 状态更新

```typescript
// 示例：加载工作日志
const loadWorkLogs = async () => {
  setIsLoading(true);

  try {
    const response = await fetch('/api/work-logs', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      // 更新状态
      setWorkLogs(data.data);

      // 触发计算状态更新
      // filteredWorkLogs 会自动重新计算
      // aggregatedDetails 会自动重新计算
      // totals 会自动重新计算
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};
```

### 2. 用户交互 → 状态更新

```typescript
// 示例：切换视图模式
const handleViewModeChange = (mode: string) => {
  setViewMode(mode as any);

  // filteredWorkLogs 会自动重新计算（依赖 viewMode 和 cursorDate）
  // aggregatedDetails 会自动重新计算（依赖 filteredWorkLogs）
  // totals 会自动重新计算（依赖 filteredWorkLogs）
};
```

### 3. 状态更新 → UI 重新渲染

```typescript
// React 自动处理状态更新后的重新渲染
// 状态变化 → 虚拟 DOM diff → 真实 DOM 更新

// 使用 useMemo 优化性能
const filteredWorkLogs = useMemo(() => {
  // 计算逻辑
  return result;
}, [workLogs, viewMode, cursorDate]);

// 使用 useCallback 优化回调
const handleTabChange = useCallback((tab: string) => {
  setActiveTab(tab);
}, []);
```

---

## 状态管理最佳实践

### 1. 避免不必要的重新渲染

```typescript
// ✅ 好的做法：使用 useMemo
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// ❌ 不好的做法：每次渲染都计算
const expensiveValue = computeExpensiveValue(a, b);
```

### 2. 避免不必要的函数创建

```typescript
// ✅ 好的做法：使用 useCallback
const handleClick = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// ❌ 不好的做法：每次渲染都创建新函数
const handleClick = () => {
  doSomething(a, b);
};
```

### 3. 合理拆分状态

```typescript
// ✅ 好的做法：相关状态放在一起
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// ❌ 不好的做法：所有状态混在一起
const [state, setState] = useState({
  isLoading: false,
  error: null,
  user: null,
  config: null,
  // ...
});
```

### 4. 使用 TypeScript 类型

```typescript
// ✅ 好的做法：定义类型接口
interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
}

const [user, setUser] = useState<User | null>(null);

// ❌ 不好的做法：使用 any
const [user, setUser] = useState<any>(null);
```

---

## 状态调试

### 1. 使用 React DevTools

```typescript
// 安装 React DevTools 浏览器扩展
// 可以查看组件树、props、state、hooks
```

### 2. 添加调试日志

```typescript
// 开发环境添加调试日志
if (process.env.NODE_ENV === 'development') {
  console.log('[State] workLogs updated:', workLogs.length);
  console.log('[State] filteredWorkLogs:', filteredWorkLogs.length);
  console.log('[State] totals:', totals);
}
```

### 3. 状态快照

```typescript
// 保存状态快照用于调试
const saveStateSnapshot = () => {
  const snapshot = {
    workLogs: workLogs.length,
    viewMode,
    cursorDate: cursorDate.toISOString(),
    visibleMetrics,
    totals
  };

  console.log('[State Snapshot]', snapshot);
};
```

---

## 未来改进

### 1. 使用 Context API

对于更复杂的状态管理，可以考虑使用 Context API：

```typescript
// 创建 Context
const AppContext = createContext<AppContextType | null>(null);

// 提供者
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState('zh');

  return (
    <AppContext.Provider value={{ user, setUser, language, setLanguage }}>
      {children}
    </AppContext.Provider>
  );
}

// 消费者
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
```

### 2. 使用 Zustand

对于更复杂的状态管理，可以考虑使用 Zustand：

```typescript
import create from 'zustand';

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  language: string;
  setLanguage: (lang: string) => void;
}

const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  language: 'zh',
  setLanguage: (lang) => set({ language: lang }),
}));

// 使用
const user = useStore(state => state.user);
const setUser = useStore(state => state.setUser);
```

---

**文档版本**: 1.0
**最后更新**: 2026-02-08
**作者**: iFlow CLI