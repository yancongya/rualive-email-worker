# 统计 API 文档

> 提供系统统计数据接口，包括用户统计、项目统计等

---

## 概述

统计 API 提供各种系统统计数据，用于前端展示和数据分析。所有统计接口都是只读的，不需要身份认证。

---

## API 端点

### 1. 获取用户统计数量

获取系统中注册用户的总数。

**端点**: `GET /api/stats/users`

**认证**: 不需要

**请求参数**: 无

**响应示例**:

```json
{
  "success": true,
  "count": 42
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 请求是否成功 |
| count | number | 用户总数 |

**使用场景**:

- 落地页显示用户数量
- 展示社区规模
- 统计活跃用户

**实现位置**: `src/index.js` 中的 `handleGetUserStats` 函数

**数据库查询**:

```javascript
SELECT COUNT(*) as count FROM users
```

---

## 使用示例

### JavaScript/TypeScript

```typescript
// 获取用户统计数量
async function getUserCount() {
  try {
    const response = await fetch('/api/stats/users');
    const data = await response.json();
    
    if (data.success) {
      console.log(`当前用户数量: ${data.count}`);
      return data.count;
    }
  } catch (error) {
    console.error('获取用户统计失败:', error);
    return 0;
  }
}

// 在落地页中使用
const userCount = await getUserCount();
displayUserCount(userCount);
```

### React Hook

```typescript
import { useEffect, useState } from 'react';

function useUserCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const response = await fetch('/api/stats/users');
        const data = await response.json();
        if (data.success) {
          setCount(data.count);
        }
      } catch (error) {
        console.error('[useUserCount] Failed to fetch user count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserCount();
  }, []);

  return { count, loading };
}

// 在组件中使用
function UserCountDisplay() {
  const { count, loading } = useUserCount();

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      已有 <span className="text-primary">{count}</span> 位小伙伴加入打卡
    </div>
  );
}
```

---

## 前端集成

### 落地页集成

在落地页 Hero 组件下方显示用户数量：

```tsx
{/* User Count Display */}
<div className="mt-8 group relative inline-block">
  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all cursor-help">
    <span className="text-white/60 text-sm font-bold">{t('userCount.title')}</span>
    <span className="text-primary text-lg font-black">{userCount}</span>
    <span className="text-white/60 text-sm font-bold">{t('userCount.unit')}</span>
    <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-wider">
      {t('userCount.openSource')}
    </span>
  </div>
  {/* Tooltip */}
  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-white/80 text-[10px] sm:text-xs font-bold leading-tight whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50">
    {t('userCount.openSourceTooltip')}
  </div>
</div>
```

### 翻译配置

**中文翻译** (`public/locals/landing/zh.json`):

```json
{
  "userCount": {
    "title": "已有",
    "count": "0",
    "unit": "位小伙伴加入打卡",
    "openSource": "当用户稳定30人后即开源",
    "openSourceTooltip": "个人维护时间精力不够，开源后可用户自行部署管理"
  }
}
```

**英文翻译** (`public/locals/landing/en.json`):

```json
{
  "userCount": {
    "title": "Already",
    "count": "0",
    "unit": "buddies joined",
    "openSource": "Open source after 30 stable users",
    "openSourceTooltip": "Personal maintenance is time-consuming, users can deploy and manage themselves after open source"
  }
}
```

---

## 性能优化

### 缓存策略

当前实现使用数据库实时查询，未来可以考虑添加缓存：

```javascript
// 使用 KV 缓存（伪代码）
async function handleGetUserStatsWithCache(request, env) {
  const cacheKey = 'stats:users:count';
  
  // 尝试从缓存获取
  const cached = await env.KV.get(cacheKey);
  if (cached) {
    return Response.json({ success: true, count: parseInt(cached) });
  }
  
  // 从数据库查询
  const result = await DB.prepare('SELECT COUNT(*) as count FROM users').first();
  
  // 缓存结果（5分钟过期）
  await env.KV.put(cacheKey, result.count.toString(), { expirationTtl: 300 });
  
  return Response.json({ success: true, count: result.count });
}
```

### 数据库索引

确保 `users` 表有适当的索引以优化查询：

```sql
-- 如果需要按角色统计
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 如果需要按注册时间统计
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
```

---

## 扩展统计

未来可以添加更多统计端点：

### 活跃用户统计

```javascript
// 统计最近 30 天活跃用户
GET /api/stats/users/active
```

### 项目统计

```javascript
// 统计项目数量
GET /api/stats/projects

// 统计项目运行时长
GET /api/stats/projects/runtime
```

### 工作数据统计

```javascript
// 统计总工作时长
GET /api/stats/work/hours

// 统计总关键帧数
GET /api/stats/work/keyframes
```

---

## 错误处理

### 常见错误

| 错误 | HTTP 状态码 | 说明 |
|------|------------|------|
| 数据库不可用 | 500 | 数据库连接失败 |
| 查询错误 | 500 | SQL 查询执行失败 |

### 错误响应示例

```json
{
  "success": false,
  "error": "Database not available"
}
```

---

## 测试

### 测试用例

```javascript
// 测试获取用户统计
async function testGetUserStats() {
  const response = await fetch('/api/stats/users');
  const data = await response.json();
  
  console.assert(data.success === true, 'API 应该返回成功');
  console.assert(typeof data.count === 'number', 'count 应该是数字');
  console.assert(data.count >= 0, 'count 应该是非负数');
}

// 运行测试
testGetUserStats();
```

---

## 相关文档

- [路由管理](../api/17_route_management.md) - 完整的路由配置
- [API 处理器](../backend/api-handlers.md) - API 处理器实现
- [数据库架构](../database/schema.md) - 数据库表结构

---

**API 版本**: 1.0
**最后更新**: 2026-02-10
**作者**: iFlow CLI