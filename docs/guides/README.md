# Worker 开发指南

## 开发环境设置

### 前置要求

- Node.js 18+
- Wrangler CLI
- Git
- Cloudflare 账号
- Resend 账号

### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/yancongya/RuAlive.git
cd RuAlive/rualive-email-worker
```

2. **安装依赖**
```bash
npm install
```

3. **登录 Cloudflare**
```bash
wrangler login
```

4. **配置环境变量**
```bash
# 设置 Resend API Key
wrangler secret put RESEND_API_KEY
```

## 本地开发

### 启动开发服务器

```bash
npm run dev
```

开发服务器会在 `http://localhost:8787` 启动。

### 查看日志

```bash
npm run tail
```

实时查看 Worker 日志。

### 测试 API

使用 PowerShell 测试脚本：

```powershell
cd tests
.\test-simple.ps1
```

## 数据库操作

### 创建数据库

```bash
npm run db:create
```

### 运行迁移

```bash
npm run db:migrate
```

### 执行 SQL 命令

```bash
# 查询数据
npx wrangler d1 execute rualive --remote --command="SELECT * FROM work_logs"

# 执行 SQL 文件
npx wrangler d1 execute rualive --remote --file=./migrations/schema.sql
```

### 备份数据

```bash
# 导出数据
npx wrangler d1 export rualive --remote --output=backup.sql
```

## KV 操作

### 创建 KV 命名空间

```bash
# 生产环境
npm run kv:create

# 预览环境
npm run kv:create-preview
```

### 上传 KV 数据

```bash
npm run kv:upload
```

### 查看 KV 数据

```bash
npx wrangler kv:key list --binding=KV
```

### 删除 KV 数据

```bash
npx wrangler kv:key delete "key-name" --binding=KV
```

## 前端开发

### 构建前端

```bash
node scripts/build-dashboard.js
```

### 本地测试前端

1. 修改 `src/user-dashboard/` 中的文件
2. 运行构建脚本
3. 上传到 KV
4. 部署 Worker

```bash
node scripts/build-dashboard.js
npx wrangler kv:key put --binding=KV "user-dashboard-inline" --path=./src/user-dashboard/index-inline.html
npm run deploy
```

### 前端组件开发

#### 创建新组件

在 `src/components/` 目录下创建新文件：

```javascript
// src/components/my-component.js
class MyComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="my-component">
        <!-- 组件内容 -->
      </div>
    `;
  }
}

export default MyComponent;
```

#### 使用组件

```javascript
import MyComponent from './components/my-component.js';

const myComponent = new MyComponent('container-id');
```

## API 开发

### 添加新端点

在 `src/index.js` 中添加新路由：

```javascript
// 添加 GET /api/my-endpoint
if (url.pathname === '/api/my-endpoint' && request.method === 'GET') {
  return handleMyEndpoint(request, env);
}

// 添加处理函数
async function handleMyEndpoint(request, env) {
  try {
    // 处理逻辑
    const data = { message: 'Hello World' };

    return new Response(JSON.stringify({
      success: true,
      data: data
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

### 添加认证中间件

```javascript
async function requireAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      success: false,
      error: '未授权'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.substring(7);
  // 验证 Token
  const user = await verifyToken(token, env);
  if (!user) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Token 无效'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return user;
}
```

## 数据库迁移

### 创建迁移文件

在 `migrations/` 目录下创建新的 SQL 文件：

```sql
-- migrations/migrate-add-new-field.sql
ALTER TABLE work_logs ADD COLUMN new_field TEXT;
```

### 执行迁移

```bash
npx wrangler d1 execute rualive --remote --file=./migrations/migrate-add-new-field.sql
```

### 回滚迁移

```sql
-- migrations/rollback-migrate-add-new-field.sql
ALTER TABLE work_logs DROP COLUMN new_field;
```

## 测试

### 编写测试脚本

在 `tests/` 目录下创建 PowerShell 测试脚本：

```powershell
# tests/test-my-endpoint.ps1
$baseUrl = "http://localhost:8787"

# 测试端点
$response = Invoke-RestMethod -Uri "$baseUrl/api/my-endpoint" -Method Get

Write-Host "响应: $($response | ConvertTo-Json)"
```

### 运行测试

```powershell
cd tests
.\test-my-endpoint.ps1
```

## 部署

### 部署到生产环境

```bash
npm run deploy
```

### 部署到预览环境

```bash
npm run deploy:preview
```

### 部署检查清单

- [ ] 所有测试通过
- [ ] 代码已提交
- [ ] 数据库迁移已执行
- [ ] 前端已构建
- [ ] KV 数据已上传
- [ ] 环境变量已设置
- [ ] 日志已检查

## 调试

### 本地调试

1. 启动开发服务器
2. 使用浏览器或 Postman 测试 API
3. 查看控制台输出

### 远程调试

```bash
# 查看远程日志
npm run tail

# 查看特定日志
wrangler tail --format=pretty
```

### 常见问题

#### Worker 启动失败

检查 `wrangler.toml` 配置是否正确。

#### 数据库连接失败

检查 D1 数据库 ID 是否正确。

#### KV 访问失败

检查 KV 命名空间 ID 是否正确。

## 性能优化

### 减少冷启动

- 保持 Worker 热度
- 使用 Cron 触发器
- 优化初始化代码

### 优化数据库查询

- 使用索引
- 减少查询次数
- 使用批量操作

### 优化网络传输

- 压缩数据
- 使用缓存
- 减少 Payload 大小

## 安全最佳实践

### 输入验证

```javascript
function validateInput(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('无效输入');
  }

  // 验证必填字段
  if (!data.email || !data.username) {
    throw new Error('缺少必填字段');
  }

  // 验证数据格式
  if (!isValidEmail(data.email)) {
    throw new Error('邮箱格式无效');
  }

  return data;
}
```

### 防止 SQL 注入

```javascript
// 使用参数化查询
await DB.prepare('SELECT * FROM users WHERE username = ?')
  .bind(username)
  .all();
```

### 防止 XSS

```javascript
function sanitizeHtml(input) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

## 代码规范

### 命名规范

- **变量**: camelCase
- **常量**: UPPER_SNAKE_CASE
- **函数**: camelCase
- **类**: PascalCase

### 注释规范

```javascript
/**
 * 函数描述
 * @param {string} param1 - 参数1描述
 * @param {number} param2 - 参数2描述
 * @returns {Object} 返回值描述
 */
function myFunction(param1, param2) {
  // 实现代码
}
```

### 文件组织

```
src/
├── index.js          # 主入口
├── auth.js           # 认证模块
├── components/       # 前端组件
├── utils/            # 工具函数
└── user-dashboard/   # 用户仪表板
```

## 版本控制

### Git 工作流

1. 创建功能分支
```bash
git checkout -b feature/my-feature
```

2. 提交更改
```bash
git add .
git commit -m "feat: 添加新功能"
```

3. 推送到远程
```bash
git push origin feature/my-feature
```

4. 创建 Pull Request

### Commit 规范

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

## 相关文档

- [API 文档](../api/README.md)
- [架构文档](../architecture/README.md)
- [快速开始](../QUICK_START.md)
- [部署指南](../README.md)