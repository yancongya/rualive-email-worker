# 前端架构

## 文档信息
- **框架**: React 19.2.4
- **构建工具**: Vite 5.0.0
- **语言**: TypeScript 5.3.0
- **最后更新**: 2026-02-07

---

## 1. 前端技术栈

### 1.1 核心框架
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2.4 | UI 框架 |
| React DOM | 19.2.4 | DOM 渲染 |
| TypeScript | 5.3.0 | 类型安全 |
| Vite | 5.0.0 | 构建工具 |

### 1.2 路由和状态
| 技术 | 版本 | 用途 |
|------|------|------|
| React Router DOM | 7.13.0 | 路由管理 |

### 1.3 UI 和动画
| 技术 | 版本 | 用途 |
|------|------|------|
| Lucide React | 0.563.0 | 图标库 |
| Recharts | 3.7.0 | 图表库 |
| GSAP | 3.14.2 | 动画库 |

---

## 2. 项目结构

### 2.1 目录结构
```
public/
├── index.html          # 首页入口
├── auth.html           # 登录页入口
├── user-v6.html        # 用户仪表板入口
├── admin.html          # 管理后台入口
├── src/                # 源代码目录
│   ├── index.tsx       # 首页组件
│   ├── auth.tsx        # 登录页组件
│   ├── user-v6.tsx     # 用户仪表板组件
│   ├── admin.tsx       # 管理后台组件
│   └── components/     # 共享组件
│       ├── ChartView.tsx      # 图表视图
│       ├── LogsTable.tsx      # 日志表格
│       ├── StatsGrid.tsx      # 统计网格
│       ├── TabManager.tsx     # 标签管理器
│       └── TimeSelector.tsx   # 时间选择器
├── package.json        # 依赖配置
└── vite.config.ts      # Vite 配置
```

### 2.2 入口文件
| 入口文件 | 路由 | 组件 | 说明 |
|---------|------|------|------|
| `index.html` | `/` | `index.tsx` | 产品介绍页 |
| `auth.html` | `/login` | `auth.tsx` | 用户登录页 |
| `user-v6.html` | `/user` | `user-v6.tsx` | 用户仪表板 |
| `admin.html` | `/admin` | `admin.tsx` | 管理后台 |

---

## 3. 构建配置

### 3.1 Vite 配置
**文件**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'user-v6': 'public/user-v6.html',
        'admin': 'public/admin.html',
        'auth': 'public/auth.html',
        'index': 'public/index.html',
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: undefined,
      }
    }
  }
});
```

### 3.2 构建输出
```
dist/
├── index.html
├── auth.html
├── user-v6.html
├── admin.html
└── assets/
    ├── index-abc123.js
    ├── auth-def456.js
    ├── user-v6-ghi789.js
    ├── admin-jkl012.js
    └── ... (其他资源文件)
```

### 3.3 构建流程
```
源代码修改
  ↓
npm run build
  ↓
Vite 解析配置
  ↓
编译 TypeScript
  ↓
转换 JSX
  ↓
模块打包
  ↓
代码分割
  ↓
生成哈希文件名
  ↓
输出到 dist/
  ↓
部署到 Cloudflare Workers
```

---

## 4. 路由架构

### 4.1 路由配置
**使用的库**: React Router DOM 7.13.0

**路由结构**:
```
/                           → 首页 (index.tsx)
/login                      → 登录页 (auth.tsx)
/user                       → 用户仪表板 (user-v6.tsx)
/admin                      → 管理后台 (admin.tsx)
```

### 4.2 路由实现
```typescript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}
```

### 4.3 路由守卫
```typescript
// 认证守卫
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

// 管理员守卫
function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (user.role !== 'admin') {
    return <Navigate to="/user" />;
  }
  
  return children;
}

// 使用
<Route path="/admin" element={
  <ProtectedRoute>
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  </ProtectedRoute>
} />
```

---

## 5. 组件架构

### 5.1 组件层次
```
App
├── IndexPage (首页)
├── AuthPage (登录页)
├── UserDashboard (用户仪表板)
│   ├── Header (头部)
│   ├── StatsGrid (统计网格)
│   ├── ChartView (图表视图)
│   ├── LogsTable (日志表格)
│   └── TabManager (标签管理器)
└── AdminDashboard (管理后台)
    ├── Header (头部)
    ├── StatsGrid (统计网格)
    ├── ChartView (图表视图)
    ├── LogsTable (日志表格)
    └── TabManager (标签管理器)
```

### 5.2 共享组件

#### ChartView - 图表视图
**文件**: `components/ChartView.tsx`

**功能**:
- 显示工作数据图表
- 支持多种图表类型
- 响应式布局

**使用的库**: Recharts 3.7.0

```typescript
import { LineChart, BarChart, PieChart } from 'recharts';

interface ChartViewProps {
  data: ChartData[];
  type: 'line' | 'bar' | 'pie';
}

export function ChartView({ data, type }: ChartViewProps) {
  // 图表渲染逻辑
}
```

#### LogsTable - 日志表格
**文件**: `components/LogsTable.tsx`

**功能**:
- 显示日志列表
- 支持排序和过滤
- 分页功能

```typescript
interface LogsTableProps {
  logs: LogEntry[];
  onSort: (key: string) => void;
  onFilter: (query: string) => void;
}

export function LogsTable({ logs, onSort, onFilter }: LogsTableProps) {
  // 表格渲染逻辑
}
```

#### StatsGrid - 统计网格
**文件**: `components/StatsGrid.tsx`

**功能**:
- 显示统计数据
- 网格布局
- 动画效果

```typescript
interface StatsGridProps {
  stats: StatsData[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  // 统计网格渲染逻辑
}
```

#### TabManager - 标签管理器
**文件**: `components/TabManager.tsx`

**功能**:
- 标签切换
- 标签状态管理
- 动画过渡

```typescript
interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabManagerProps {
  tabs: Tab[];
}

export function TabManager({ tabs }: TabManagerProps) {
  // 标签管理逻辑
}
```

#### TimeSelector - 时间选择器
**文件**: `components/TimeSelector.tsx`

**功能**:
- 时间范围选择
- 快捷选项
- 自定义范围

```typescript
interface TimeSelectorProps {
  onRangeChange: (range: TimeRange) => void;
}

export function TimeSelector({ onRangeChange }: TimeSelectorProps) {
  // 时间选择逻辑
}
```

---

## 6. 状态管理

### 6.1 本地状态
```typescript
import { useState, useEffect } from 'react';

function Component() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  return <div>{/* 渲染逻辑 */}</div>;
}
```

### 6.2 上下文状态
```typescript
import { createContext, useContext } from 'react';

interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // 登录逻辑
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
```

### 6.3 持久化状态
```typescript
// localStorage
localStorage.setItem('token', token);
const token = localStorage.getItem('token');

// sessionStorage
sessionStorage.setItem('tempData', data);
const data = sessionStorage.getItem('tempData');
```

---

## 7. API 集成

### 7.1 API 基础配置
```typescript
const API_BASE_URL = 'https://rualive-email-worker.cubetan57.workers.dev';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });

  const data = await response.json();
  return data;
}
```

### 7.2 API 函数示例

#### 用户认证
```typescript
// 登录
export async function login(email: string, password: string) {
  return apiRequest<{ token: string; user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// 注册
export async function register(email: string, username: string, password: string) {
  return apiRequest<{ userId: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, username, password }),
  });
}

// 登出
export async function logout() {
  return apiRequest('/api/auth/logout', {
    method: 'POST',
  });
}
```

#### 数据获取
```typescript
// 获取用户配置
export async function getUserConfig(userId: string) {
  return apiRequest<Config>(`/api/config?userId=${userId}`);
}

// 获取工作日志
export async function getWorkLogs(userId: string, limit = 10) {
  return apiRequest<WorkLog[]>(`/api/work-logs?userId=${userId}&limit=${limit}`);
}

// 获取项目汇总
export async function getProjectSummary(userId: string) {
  return apiRequest<ProjectSummary[]>(`/api/projects/summary?userId=${userId}`);
}
```

#### 数据提交
```typescript
// 更新用户配置
export async function updateUserConfig(userId: string, config: Config) {
  return apiRequest('/api/config', {
    method: 'POST',
    body: JSON.stringify({ userId, config }),
  });
}

// 上传工作数据
export async function uploadWorkData(data: WorkData) {
  return apiRequest('/api/work-data', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

---

## 8. 样式系统

### 8.1 CSS 模块
```css
/* UserDashboard.module.css */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}
```

### 8.2 使用方式
```typescript
import styles from './UserDashboard.module.css';

function UserDashboard() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        {/* 头部内容 */}
      </header>
      <div className={styles.stats}>
        {/* 统计内容 */}
      </div>
    </div>
  );
}
```

### 8.3 响应式设计
```css
@media (max-width: 768px) {
  .stats {
    grid-template-columns: 1fr;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

---

## 9. 动画系统

### 9.1 GSAP 动画
```typescript
import { gsap } from 'gsap';

function animateStats() {
  gsap.from('.stat-card', {
    y: 20,
    opacity: 0,
    duration: 0.5,
    stagger: 0.1,
  });
}

function animateCharts() {
  gsap.from('.chart-container', {
    scale: 0.9,
    opacity: 0,
    duration: 0.6,
    ease: 'power2.out',
  });
}
```

### 9.2 过渡动画
```typescript
import { Transition } from 'react-transition-group';

function AnimatedComponent({ in: inProp }) {
  return (
    <Transition
      in={inProp}
      timeout={300}
      onEnter={(node) => gsap.from(node, { opacity: 0, y: 20 })}
      onExit={(node) => gsap.to(node, { opacity: 0, y: -20 })}
    >
      <div>动画内容</div>
    </Transition>
  );
}
```

---

## 10. 性能优化

### 10.1 代码分割
```typescript
// 懒加载组件
const LazyChartView = lazy(() => import('./components/ChartView'));

function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyChartView />
    </Suspense>
  );
}
```

### 10.2 记忆化
```typescript
import { useMemo, useCallback } from 'react';

function Component({ data }) {
  // 记忆化计算结果
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      value: item.value * 2,
    }));
  }, [data]);

  // 记忆化回调函数
  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []);

  return <div onClick={handleClick}>{/* 渲染 */}</div>;
}
```

### 10.3 虚拟滚动
```typescript
import { FixedSizeList } from 'react-window';

function VirtualizedList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>{items[index].name}</div>
      )}
    </FixedSizeList>
  );
}
```

---

## 11. 错误处理

### 11.1 错误边界
```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong: {this.state.error?.message}</div>;
    }

    return this.props.children;
  }
}

// 使用
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 11.2 API 错误处理
```typescript
async function fetchData() {
  try {
    const response = await apiRequest('/api/data');
    
    if (!response.success) {
      throw new Error(response.error || 'Request failed');
    }
    
    return response.data;
  } catch (error) {
    console.error('Fetch error:', error);
    // 显示错误提示
    setError(error.message);
  }
}
```

---

## 12. 测试

### 12.1 单元测试
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

test('button click calls onClick', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  fireEvent.click(screen.getByText('Click me'));
  
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### 12.2 集成测试
```typescript
test('user can login', async () => {
  render(<AuthPage />);
  
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'user@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'password123' },
  });
  
  fireEvent.click(screen.getByText('Login'));
  
  await waitFor(() => {
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });
});
```

---

**文档版本**: 1.0
**最后更新**: 2026-02-07
**作者**: iFlow CLI
**状态**: ✅ 完成