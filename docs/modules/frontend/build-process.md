# 前端构建流程

## 文档信息
- **构建工具**: Vite 5.0.0
- **最后更新**: 2026-02-07

---

## 1. 构建概述

### 1.1 构建目标
- 将 TypeScript/JSX 编译为 JavaScript
- 代码分割和优化
- 生成生产环境代码
- 压缩和哈希化文件

### 1.2 构建环境
- **开发环境**: `npm run dev`
- **预览环境**: `npm run preview`
- **生产环境**: `npm run build`

---

## 2. 构建配置

### 2.1 Vite 配置
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

### 2.2 构建选项说明
| 选项 | 值 | 说明 |
|------|-----|------|
| `outDir` | `'dist'` | 输出目录 |
| `emptyOutDir` | `true` | 清空输出目录 |
| `entryFileNames` | `'assets/[name]-[hash].js'` | 入口文件名格式 |
| `chunkFileNames` | `'assets/[name]-[hash].js'` | 代码块文件名格式 |
| `assetFileNames` | `'assets/[name]-[hash].[ext]'` | 资源文件名格式 |
| `manualChunks` | `undefined` | 手动代码分割 |

---

## 3. 构建流程

### 3.1 开发构建
```bash
npm run dev
```

**流程**:
```
启动开发服务器
  ↓
监听文件变化
  ↓
热模块替换（HMR）
  ↓
浏览器实时更新
```

**特点**:
- 快速启动
- 实时预览
- 热更新
- Source Maps

### 3.2 生产构建
```bash
npm run build
```

**流程**:
```
读取配置
  ↓
解析入口文件
  ↓
编译 TypeScript
  ↓
转换 JSX
  ↓
依赖分析
  ↓
代码分割
  ↓
Tree Shaking
  ↓
代码压缩
  ↓
生成哈希文件名
  ↓
输出到 dist/
```

**步骤详解**:

#### 步骤1: 解析入口文件
```typescript
// vite.config.ts
input: {
  'user-v6': 'public/user-v6.html',
  'admin': 'public/admin.html',
  'auth': 'public/auth.html',
  'index': 'public/index.html',
}
```

#### 步骤2: 编译 TypeScript
```typescript
// 输入: user-v6.tsx
interface User {
  id: string;
  name: string;
}

const user: User = { id: '1', name: 'Test' };

// 输出: user-v6.js
const user = { id: '1', name: 'Test' };
```

#### 步骤3: 转换 JSX
```typescript
// 输入
function App() {
  return <div>Hello World</div>;
}

// 输出
function App() {
  return React.createElement('div', null, 'Hello World');
}
```

#### 步骤4: 依赖分析
```
user-v6.html
  └─ user-v6.tsx
      ├─ components/ChartView.tsx
      ├─ components/LogsTable.tsx
      ├─ components/StatsGrid.tsx
      └─ utils/api.ts
```

#### 步骤5: 代码分割
```
dist/
├── user-v6-abc123.js        # 主入口
├── ChartView-def456.js      # 懒加载组件
├── LogsTable-ghi789.js      # 懒加载组件
└── vendor-jkl012.js         # 第三方库
```

#### 步骤6: Tree Shaking
```typescript
// 输入
import { useState, useEffect } from 'react';
import { chart } from 'recharts';

// 使用
const [data, setData] = useState(null);
// useEffect 未使用
// chart 未使用

// 输出（只包含实际使用的代码）
import { useState } from 'react';
```

#### 步骤7: 代码压缩
```javascript
// 输入
function hello(name) {
  console.log('Hello, ' + name + '!');
}

// 输出
function hello(n){console.log("Hello, "+n+"!")}
```

#### 步骤8: 生成哈希文件名
```
user-v6.js → user-v6-abc123def456.js
```

**哈希作用**:
- 缓存破坏
- 版本控制
- 部署验证

---

## 4. 构建输出

### 4.1 输出目录结构
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
    ├── ChartView-mno345.js
    ├── LogsTable-pqr678.js
    ├── StatsGrid-stu901.js
    └── ... (其他资源)
```

### 4.2 文件大小
| 文件 | 大小 | 说明 |
|------|------|------|
| `index.html` | ~2KB | 首页入口 |
| `auth.html` | ~2KB | 登录页入口 |
| `user-v6.html` | ~2KB | 用户仪表板入口 |
| `admin.html` | ~2KB | 管理后台入口 |
| `user-v6-*.js` | ~200KB | 用户仪表板主文件 |
| `admin-*.js` | ~180KB | 管理后台主文件 |
| `vendor-*.js` | ~500KB | 第三方库 |

---

## 5. 构建脚本

### 5.1 package.json 脚本
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && cd .. && npx wrangler deploy"
  }
}
```

### 5.2 脚本说明

#### `npm run dev`
启动开发服务器

```bash
npm run dev
```

**输出**:
```
  VITE v5.0.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

#### `npm run build`
生产构建

```bash
npm run build
```

**输出**:
```
vite v5.0.0 building for production...
✓ 17 modules transformed.
dist/index.html                    0.45 kB │ gzip:  0.30 kB
dist/assets/index-abc123.js      45.23 kB │ gzip: 15.67 kB
dist/assets/auth-def456.js       38.12 kB │ gzip: 13.45 kB
dist/assets/user-v6-ghi789.js   123.45 kB │ gzip: 42.34 kB
dist/assets/admin-jkl012.js     110.23 kB │ gzip: 38.12 kB
```

#### `npm run preview`
预览构建结果

```bash
npm run preview
```

**输出**:
```
  VITE v5.0.0  ready in 56 ms

  ➜  Local:   http://localhost:4173/
```

#### `npm run deploy`
构建并部署

```bash
npm run deploy
```

**流程**:
1. 执行 `npm run build`
2. 切换到上级目录
3. 执行 `npx wrangler deploy`

---

## 6. 构建优化

### 6.1 代码分割优化
```typescript
// 手动代码分割
import { lazy } from 'react';

const ChartView = lazy(() => import('./components/ChartView'));
const LogsTable = lazy(() => import('./components/LogsTable'));

function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChartView />
      <LogsTable />
    </Suspense>
  );
}
```

### 6.2 依赖预构建
```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'recharts', 'lucide-react'],
  },
});
```

### 6.3 压缩配置
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // 生产环境移除 console
      },
    },
  },
});
```

### 6.4 资源优化
```typescript
// 图片优化
import logo from './assets/logo.png?url&webp';

// 字体优化
import './assets/fonts.css';

// CSS 优化
import './assets/main.css';
```

---

## 7. 环境变量

### 7.1 定义环境变量
```
# .env
VITE_API_BASE_URL=https://rualive-email-worker.cubetan57.workers.dev
VITE_APP_NAME=RuAlive

# .env.production
VITE_API_BASE_URL=https://rualive-email-worker.cubetan57.workers.dev

# .env.development
VITE_API_BASE_URL=http://localhost:8787
```

### 7.2 使用环境变量
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const APP_NAME = import.meta.env.VITE_APP_NAME;
```

### 7.3 环境变量验证
```typescript
if (!import.meta.env.VITE_API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined');
}
```

---

## 8. 构建问题排查

### 8.1 常见问题

#### 问题1: 构建失败
**症状**: `npm run build` 报错

**解决方案**:
```bash
# 清理缓存
rm -rf node_modules dist
npm install
npm run build
```

#### 问题2: TypeScript 错误
**症状**: 编译时出现类型错误

**解决方案**:
```typescript
// 添加类型声明
declare module '*.svg' {
  const content: string;
  export default content;
}

// 或使用 any 类型（不推荐）
const data: any = response.data;
```

#### 问题3: 依赖冲突
**症状**: 运行时出现模块错误

**解决方案**:
```bash
# 更新依赖
npm update

# 或重新安装
rm -rf node_modules package-lock.json
npm install
```

### 8.2 构建日志
```bash
# 启用详细日志
npm run build -- --debug

# 查看构建统计
npm run build -- --report
```

---

## 9. CI/CD 集成

### 9.1 GitHub Actions
```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Build
      run: npm run build
    
    - name: Deploy
      run: npx wrangler deploy --env production
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### 9.2 自动化部署
```bash
# deploy.sh
#!/bin/bash

npm run build
if [ $? -eq 0 ]; then
  npx wrangler deploy
else
  echo "Build failed"
  exit 1
fi
```

---

## 10. 最佳实践

### 10.1 构建前检查
```bash
# 检查代码风格
npm run lint

# 检查类型
npm run type-check

# 运行测试
npm run test

# 然后构建
npm run build
```

### 10.2 版本管理
```bash
# 使用语义化版本
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0
```

### 10.3 构建缓存
```bash
# 利用 Docker 缓存
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
```

---

**文档版本**: 1.0
**最后更新**: 2026-02-07
**作者**: iFlow CLI
**状态**: ✅ 完成