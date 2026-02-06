# 前端面板功能

## 文档信息
- **最后更新**: 2026-02-07

---

## 1. 面板概述

### 1.1 面板列表
| 面板 | 路由 | 入口文件 | 说明 |
|------|------|----------|------|
| 首页 | `/` | `index.tsx` | 产品介绍页 |
| 登录页 | `/login` | `auth.tsx` | 用户登录和注册 |
| 用户仪表板 | `/user` | `user-v6.tsx` | 用户数据查看和管理 |
| 管理后台 | `/admin` | `admin.tsx` | 系统管理和用户管理 |

---

## 2. 首页

### 2.1 功能说明
产品介绍和功能展示页面

### 2.2 主要模块
- **产品介绍**: RuAlive@烟囱鸭 功能说明
- **特性展示**: 工作统计、邮件通知、项目管理
- **使用场景**: AE 工作流程集成
- **开始使用**: 引导用户登录和注册

### 2.3 UI 组件
```typescript
function IndexPage() {
  return (
    <div className="container">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <UseCasesSection />
      <CTASection />
      <Footer />
    </div>
  );
}
```

### 2.4 数据获取
无需数据获取，静态展示

---

## 3. 登录页

### 3.1 功能说明
用户登录和注册页面

### 3.2 主要模块
- **登录表单**: 邮箱和密码登录
- **注册表单**: 用户注册（需邀请码）
- **表单验证**: 邮箱格式、密码强度
- **错误提示**: 登录失败、注册失败
- **记住我**: 本地存储用户信息

### 3.3 UI 组件
```typescript
function AuthPage() {
  const [mode, setMode] = useState('login'); // login | register
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    inviteCode: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await login(formData.email, formData.password);
      
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/user');
      } else {
        setErrors({ general: response.error });
      }
    } catch (error) {
      setErrors({ general: '登录失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await register(
        formData.email,
        formData.username,
        formData.password,
        formData.inviteCode
      );
      
      if (response.success) {
        setMode('login');
        setFormData({ ...formData, password: '' });
      } else {
        setErrors({ general: response.error });
      }
    } catch (error) {
      setErrors({ general: '注册失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{mode === 'login' ? '登录' : '注册'}</h1>
          <p>{mode === 'login' ? '欢迎回来' : '创建您的账户'}</p>
        </div>
        
        {errors.general && (
          <div className="error-message">{errors.general}</div>
        )}
        
        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
          {mode === 'register' && (
            <Input
              label="用户名"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              error={errors.username}
            />
          )}
          
          <Input
            label="邮箱"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
          />
          
          <Input
            label="密码"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
          />
          
          {mode === 'register' && (
            <Input
              label="邀请码"
              value={formData.inviteCode}
              onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
              error={errors.inviteCode}
            />
          )}
          
          <Button type="submit" loading={loading}>
            {mode === 'login' ? '登录' : '注册'}
          </Button>
        </form>
        
        <div className="auth-footer">
          {mode === 'login' ? (
            <>
              <span>还没有账户？</span>
              <button onClick={() => setMode('register')}>注册</button>
            </>
          ) : (
            <>
              <span>已有账户？</span>
              <button onClick={() => setMode('login')}>登录</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 3.4 数据获取
```typescript
// 登录 API
async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

// 注册 API
async function register(email: string, username: string, password: string, inviteCode?: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password, inviteCode }),
  });
  return response.json();
}
```

---

## 4. 用户仪表板

### 4.1 功能说明
用户查看和管理个人数据的仪表板

### 4.2 主要模块
- **统计卡片**: 显示今日工作数据
- **图表视图**: 可视化工作趋势
- **日志表格**: 详细的工作日志
- **项目汇总**: 项目统计和趋势
- **设置**: 用户配置管理

### 4.3 UI 组件
```typescript
function UserDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // 并行加载数据
      const [statsData, logsData, projectsData] = await Promise.all([
        getUserStats(user.id, timeRange),
        getWorkLogs(user.id, timeRange),
        getProjectSummary(user.id),
      ]);
      
      setStats(statsData);
      setLogs(logsData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <Header />
      
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>我的工作数据</h1>
          <TimeSelector 
            value={timeRange} 
            onChange={setTimeRange}
          />
        </div>
        
        {loading ? (
          <Spinner />
        ) : (
          <>
            <StatsGrid data={stats} />
            
            <TabManager 
              tabs={[
                { id: 'overview', label: '概览', content: <OverviewView /> },
                { id: 'projects', label: '项目', content: <ProjectsView projects={projects} /> },
                { id: 'logs', label: '日志', content: <LogsTable logs={logs} /> },
                { id: 'settings', label: '设置', content: <SettingsView /> },
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </>
        )}
      </div>
    </div>
  );
}
```

### 4.4 数据获取
```typescript
// 获取用户统计
async function getUserStats(userId: string, timeRange: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/work-logs?userId=${userId}&timeRange=${timeRange}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );
  return response.json();
}

// 获取工作日志
async function getWorkLogs(userId: string, timeRange: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/work-logs?userId=${userId}&limit=30`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );
  return response.json();
}

// 获取项目汇总
async function getProjectSummary(userId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/summary?userId=${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );
  return response.json();
}
```

---

## 5. 管理后台

### 5.1 功能说明
系统管理员使用的后台管理界面

### 5.2 主要模块
- **系统统计**: 总用户数、总项目数、邮件发送数
- **用户管理**: 查看用户、删除用户、重置密码
- **邮件管理**: 邮件日志、测试邮件
- **配置管理**: 用户配置管理

### 5.3 UI 组件
```typescript
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    
    try {
      // 并行加载数据
      const [statsData, usersData, logsData] = await Promise.all([
        getAdminStats(),
        getAllUsers(),
        getEmailLogs(),
      ]);
      
      setStats(statsData);
      setUsers(usersData);
      setEmailLogs(logsData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除该用户吗？')) return;
    
    try {
      await deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      await resetUserPassword(userId);
      alert('密码重置成功，新密码已发送到用户邮箱');
    } catch (error) {
      alert('密码重置失败');
    }
  };

  return (
    <div className="admin-dashboard">
      <Header />
      
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>管理后台</h1>
        </div>
        
        {loading ? (
          <Spinner />
        ) : (
          <>
            <StatsGrid data={stats} />
            
            <TabManager 
              tabs={[
                { id: 'overview', label: '概览', content: <OverviewView /> },
                { id: 'users', label: '用户', content: <UsersTable users={users} onDelete={handleDeleteUser} onResetPassword={handleResetPassword} /> },
                { id: 'emails', label: '邮件', content: <EmailLogsTable logs={emailLogs} /> },
                { id: 'settings', label: '设置', content: <AdminSettingsView /> },
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </>
        )}
      </div>
    </div>
  );
}
```

### 5.4 数据获取
```typescript
// 获取管理员统计
async function getAdminStats() {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/dashboard`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );
  return response.json();
}

// 获取所有用户
async function getAllUsers() {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/users`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );
  return response.json();
}

// 获取邮件日志
async function getEmailLogs() {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/email-logs`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );
  return response.json();
}

// 删除用户
async function deleteUser(userId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/users/${userId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );
  return response.json();
}

// 重置用户密码
async function resetUserPassword(userId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/users/${userId}/reset-password`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.json();
}
```

---

## 6. 共享组件

### 6.1 StatsGrid - 统计网格
```typescript
interface StatsGridProps {
  data: {
    totalUsers?: number;
    totalProjects?: number;
    totalWorkHours?: number;
    emailsSentToday?: number;
    activeUsers?: number;
    workHours?: number;
    compositions?: number;
    layers?: number;
    keyframes?: number;
    effects?: number;
  };
}

export function StatsGrid({ data }: StatsGridProps) {
  const stats = [
    { label: '工作时长', value: data.workHours || 0, unit: 'h', icon: 'clock' },
    { label: '合成数量', value: data.compositions || 0, unit: '', icon: 'layers' },
    { label: '图层数量', value: data.layers || 0, unit: '', icon: 'layers' },
    { label: '关键帧', value: data.keyframes || 0, unit: '', icon: 'key' },
    { label: '效果', value: data.effects || 0, unit: '', icon: 'wand' },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <Icon name={stat.icon} />
          <div className="stat-value">{stat.value}{stat.unit}</div>
          <div className="stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
```

### 6.2 ChartView - 图表视图
```typescript
interface ChartViewProps {
  data: ChartData[];
  type: 'line' | 'bar' | 'pie';
}

export function ChartView({ data, type }: ChartViewProps) {
  return (
    <div className="chart-container">
      {type === 'line' && (
        <LineChart width={800} height={400} data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="workHours" stroke="#8884d8" />
        </LineChart>
      )}
      
      {type === 'bar' && (
        <BarChart width={800} height={400} data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Legend />
          <Bar dataKey="compositions" fill="#8884d8" />
          <Bar dataKey="layers" fill="#82ca9d" />
        </BarChart>
      )}
      
      {type === 'pie' && (
        <PieChart width={800} height={400}>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label />
          <Tooltip />
        </PieChart>
      )}
    </div>
  );
}
```

### 6.3 LogsTable - 日志表格
```typescript
interface LogsTableProps {
  logs: LogEntry[];
  onSort?: (key: string) => void;
  onFilter?: (query: string) => void;
}

export function LogsTable({ logs, onSort, onFilter }: LogsTableProps) {
  const [sortKey, setSortKey] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterQuery, setFilterQuery] = useState('');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
    onSort?.(key);
  };

  const handleFilter = (query: string) => {
    setFilterQuery(query);
    onFilter?.(query);
  };

  const filteredLogs = logs.filter(log => 
    log.projectName.toLowerCase().includes(filterQuery.toLowerCase()) ||
    log.date.includes(filterQuery)
  );

  return (
    <div className="logs-table-container">
      <input
        type="text"
        placeholder="搜索日志..."
        value={filterQuery}
        onChange={(e) => handleFilter(e.target.value)}
      />
      
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('date')}>日期 {sortKey === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
            <th onClick={() => handleSort('projectName')}>项目 {sortKey === 'projectName' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
            <th>合成</th>
            <th>图层</th>
            <th>关键帧</th>
            <th>效果</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map((log, index) => (
            <tr key={index}>
              <td>{log.date}</td>
              <td>{log.projectName}</td>
              <td>{log.compositions}</td>
              <td>{log.layers}</td>
              <td>{log.keyframes}</td>
              <td>{log.effects}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 7. 数据流

### 7.1 用户登录数据流
```
用户输入邮箱和密码
  ↓
验证输入格式
  ↓
调用 POST /api/auth/login
  ↓
服务器验证用户信息
  ├─ 失败 → 显示错误提示
  └─ 成功 → 继续下一步
  ↓
保存 Token 到 localStorage
  ↓
保存用户信息到 localStorage
  ↓
跳转到用户仪表板
```

### 7.2 用户仪表板数据流
```
用户访问仪表板
  ↓
检查 Token 是否存在
  ├─ 不存在 → 跳转到登录页
  └─ 存在 → 继续下一步
  ↓
并行请求数据：
  ├─ GET /api/work-logs
  ├─ GET /api/projects/summary
  └─ GET /api/config
  ↓
显示加载状态
  ↓
数据返回后更新状态
  ↓
渲染统计数据
  ↓
渲染图表和表格
```

### 7.3 管理后台数据流
```
管理员访问后台
  ↓
检查 Token 和用户角色
  ├─ 非管理员 → 跳转到用户仪表板
  └─ 管理员 → 继续下一步
  ↓
并行请求数据：
  ├─ GET /api/admin/dashboard
  ├─ GET /api/admin/users
  └─ GET /api/admin/email-logs
  ↓
显示加载状态
  ↓
数据返回后更新状态
  ↓
渲染管理界面
```

---

## 8. 错误处理

### 8.1 API 错误处理
```typescript
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '请求失败');
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    
    // 401 Unauthorized - Token 过期
    if (error.message.includes('401')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    throw error;
  }
}
```

### 8.2 表单验证
```typescript
function validateLoginForm(formData: LoginForm): FormErrors {
  const errors: FormErrors = {};
  
  if (!formData.email) {
    errors.email = '邮箱不能为空';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = '邮箱格式不正确';
  }
  
  if (!formData.password) {
    errors.password = '密码不能为空';
  } else if (formData.password.length < 6) {
    errors.password = '密码至少6位';
  }
  
  return errors;
}
```

---

**文档版本**: 1.0
**最后更新**: 2026-02-07
**作者**: iFlow CLI
**状态**: ✅ 完成