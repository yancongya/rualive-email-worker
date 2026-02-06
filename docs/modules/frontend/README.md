# 前端模块总览

## 模块概述

前端模块负责 Web 界面的用户交互、数据展示和状态管理。使用 React 19 + TypeScript + Vite 技术栈构建。

## 模块列表

### 1. 用户仪表板
**文件**: `public/user-v6.html` + `public/src/user-v6.tsx`

**职责**:
- 用户工作数据展示
- 项目统计和趋势分析
- 用户配置管理
- 邮件日志查看

**主要功能**:
- 每日工作时长统计
- 项目累积数据展示
- 关键帧、效果、图层数量统计
- AE 版本和系统信息显示
- 工作时长趋势图表
- 效果使用分析

**文档**: [user-dashboard.md](user-dashboard.md)

### 2. 管理后台
**文件**: `public/admin.html`

**职责**:
- 用户管理
- 邀请码管理
- 系统配置
- API 密钥管理
- 系统日志查看

**主要功能**:
- 用户列表查看和管理
- 创建和删除邀请码
- 重置用户密码
- 设置用户邮件限制
- 查看用户邮件统计
- API 密钥管理
- 系统邮件发送统计

**文档**: [admin-dashboard.md](admin-dashboard.md)

### 3. 前端组件
**目录**: `public/src/components/`

**职责**:
- 可复用的 UI 组件
- 数据可视化组件
- 交互组件

**组件列表**:
- `StatsGrid` - 统计网格
- `LogsTable` - 日志表格
- `ChartView` - 图表视图
- `TabManager` - Tab 管理器
- `TimeSelector` - 时间选择器

**文档**: [components.md](components.md)

---

## 技术栈

### 核心技术
- **React 19**: UI 框架
- **TypeScript 5.3**: 类型安全的 JavaScript
- **Vite 5**: 构建工具
- **HTML5 + CSS3**: 页面结构和样式

### 构建工具
- **Vite**: 前端构建工具
- **@vitejs/plugin-react**: React 插件
- **Rollup**: 打包工具（Vite 内置）

### 数据可视化
- **Chart.js**: 图表库（通过 chart-view.js）

---

## 构建配置

### Vite 配置
**文件**: `vite.config.ts`

```typescript
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
    }
  }
});
```

### 构建产物
```
dist/
├── index.html
├── auth.html
├── user-v6.html
├── admin.html
└── assets/
    ├── index-[hash].js
    ├── auth-[hash].js
    ├── user-v6-[hash].js
    ├── admin-[hash].js
    └── *.css
```

---

## 路由配置

### 前端路由
| 路由 | 页面 | 文件 |
|------|------|------|
| `/` | 首页 | `public/index.html` |
| `/login` | 登录页 | `public/auth.html` |
| `/user` | 用户仪表板 | `public/user-v6.html` |
| `/admin` | 管理后台 | `public/admin.html` |

### 路由变更历史
- **2026-01-30**: `/user` 路由改为返回 `user-v6.html`，删除 `/user-v6` 路由

---

## 数据流

### 数据获取流程
```
React 组件
  ↓
fetch() 请求 API
  ↓
Worker 后端 API
  ↓
D1 数据库
  ↓
返回 JSON 数据
  ↓
React 组件状态更新
  ↓
UI 渲染
```

### 状态管理
```typescript
// 用户仪表板状态
interface UserDashboardState {
  userId: string;
  userData: UserData | null;
  workLogs: WorkLog[];
  projectSummary: ProjectSummary[];
  aeStatus: AEStatus | null;
  selectedTimeRange: TimeRange;
  isLoading: boolean;
  error: string | null;
}
```

---

## API 集成

### 通用请求函数
```typescript
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
}
```

### 常用 API 调用
```typescript
// 获取用户数据
const userData = await apiRequest<UserData>('/auth/me');

// 获取工作日志
const workLogs = await apiRequest<WorkLog[]>('/logs');

// 获取项目汇总
const projectSummary = await apiRequest<ProjectSummary[]>('/projects/summary');
```

---

## UI 组件

### 组件结构
```
UserDashboard (用户仪表板)
├── Header (顶部导航)
├── StatsGrid (统计网格)
│   ├── AE Status Badge (AE 状态)
│   ├── Total Projects (项目总数)
│   ├── Total Work Hours (总工作时长)
│   └── Total Work Days (工作天数)
├── ChartView (图表视图)
│   ├── Work Hours Chart (工作时长图表)
│   └── Effect Usage Chart (效果使用图表)
├── LogsTable (日志表格)
│   ├── Log List (日志列表)
│   └── Pagination (分页)
└── TimeSelector (时间选择器)
    ├── Date Range Picker (日期范围选择)
    └── Quick Select (快速选择)

AdminDashboard (管理后台)
├── Header (顶部导航)
├── User Management (用户管理)
│   ├── User List (用户列表)
│   ├── Invite Codes (邀请码管理)
│   └── User Details (用户详情)
├── Email Management (邮件管理)
│   ├── Email Stats (邮件统计)
│   └── Email Logs (邮件日志)
└── API Management (API 管理)
    ├── API Keys (API 密钥)
    └── API Logs (API 日志)
```

---

## 样式系统

### CSS 类命名规范
- 使用 BEM 命名法
- 前缀：`ru-`（RuAlive）
- 示例：`ru-dashboard`, `ru-stats-grid`, `ru-button`

### 主题配置
```css
:root {
  --ru-primary: #3b82f6;
  --ru-secondary: #10b981;
  --ru-accent: #f59e0b;
  --ru-bg: #0f172a;
  --ru-text: #e2e8f0;
  --ru-border: #334155;
}
```

---

## 开发流程

### 本地开发
```bash
# 启动前端开发服务器
cd public
npm run dev

# 访问地址
http://localhost:5173
```

### 构建生产版本
```bash
# 构建前端
npm run build:frontend

# 构建产物位置
dist/
```

### 修改后的部署
```bash
# 1. 修改代码
# 2. 构建前端
npm run build:frontend

# 3. 复制构建文件
Copy-Item public\dist -Destination dist -Recurse -Force

# 4. 部署 Worker
npm run deploy

# 5. 清理临时文件
Remove-Item public\dist -Recurse -Force
```

---

**文档版本**: 1.0
**最后更新**: 2026-02-07
**作者**: iFlow CLI