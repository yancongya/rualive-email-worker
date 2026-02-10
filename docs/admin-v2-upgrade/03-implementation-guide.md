# 实施指南：具体的操作命令和代码示�?
## 概述

本文档提供了�?rualive-admin-v2.0 迁移�?admin-v2 路由的具体操作命令和代码示例�?
---

## 一、环境准�?
### 1.1 检查环�?
```bash
# 检�?Node.js 版本
node --version
# 要求�?= 18.0.0

# 检�?npm 版本
npm --version
# 要求�?= 9.0.0

# 检�?Git 版本
git --version
# 要求�?= 2.0.0
```

### 1.2 创建备份

```bash
# 进入项目目录
cd C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\rualive-email-worker

# 创建备份分支
git checkout -b backup-before-admin-v2-20260130

# 提交备份
git add .
git commit -m "backup: snapshot before admin-v2 migration - 2026-01-30"

# 推送备份分�?git push -u origin backup-before-admin-v2-20260130

# 创建迁移分支
git checkout -b feature/admin-v2-migration
```

### 1.3 查看源代码结�?
```bash
# 查看源代码目�?cd C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\rualive-email-worker\reference\rualive-admin-v2.0

# 列出所有文�?dir

# 查看依赖
type package.json

# 查看构建配置
type vite.config.ts

# 查看TypeScript配置
type tsconfig.json
```

---

## 二、文件迁�?
### 2.1 创建目标文件�?
```bash
# 进入 public 目录
cd C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\rualive-email-worker\public

# 创建 admin-v2 文件�?mkdir admin-v2

# 创建 locals 子文件夹
mkdir admin-v2\locals

# 验证文件夹创�?dir admin-v2
```

### 2.2 复制源代码文�?
```bash
# 设置源代码路�?set SOURCE=C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\rualive-email-worker\reference\rualive-admin-v2.0
set TARGET=C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\rualive-email-worker\public\admin-v2

# 复制 HTML 文件并重命名
copy %SOURCE%\index.html %TARGET%\admin-v2.html

# 复制 TypeScript 文件
copy %SOURCE%\index.tsx %TARGET%\admin-v2.tsx
copy %SOURCE%\LogoAnimation.tsx %TARGET%\
copy %SOURCE%\BrickLoader.tsx %TARGET%\

# 复制配置文件
copy %SOURCE%\tsconfig.json %TARGET%\
copy %SOURCE%\vite.config.ts %TARGET%\

# 复制资源文件
copy %SOURCE%\logo.svg %TARGET%\

# 验证文件复制
dir %TARGET%
```

### 2.3 创建翻译文件

#### 中文翻译 (zh.json)

```bash
# 创建中文翻译文件
cd C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\rualive-email-worker\public\admin-v2\locals

# 创建 zh.json 文件
(
echo {
echo   "app": {
echo     "title": "RuAlive 管理后台",
echo     "subtitle": "ADMIN CONSOLE",
echo     "loading": "加载�?..",
echo     "language": "语言",
echo     "logout": "退出登�?
echo   },
echo   "nav": {
echo     "invites": "邀请码管理",
echo     "users": "用户管理",
echo     "api": "API密钥",
echo     "logs": "邮件日志"
echo   },
echo   "invites": {
echo     "headers": {
echo       "invites": "邀请码管理",
echo       "create": "创建邀请码"
echo     },
echo     "subheaders": {
echo       "invites": "管理用户注册邀请码"
echo     },
echo     "actions": {
echo       "create": "创建",
echo       "delete": "删除"
echo     },
echo     "labels": {
echo       "code": "邀请码",
echo       "usage": "使用情况",
echo       "expires": "过期时间"
echo     },
echo     "messages": {
echo       "noKeys": "暂无邀请码",
echo       "confirmTitle": "确认删除",
echo       "confirmDesc": "确定要删除这个邀请码吗？",
echo       "deleted": "邀请码已删�?,
echo       "ticketPrinted": "邀请码已创�?
echo     }
echo   },
echo   "users": {
echo     "headers": {
echo       "users": "用户管理"
echo     },
echo     "subheaders": {
echo       "users": "管理注册用户和权�?
echo     },
echo     "actions": {
echo       "edit": "编辑",
echo       "reset": "重置密码",
echo       "delete": "删除"
echo     },
echo     "table": {
echo       "userIdentity": "用户信息",
echo       "role": "角色"
echo     },
echo     "messages": {
echo       "resetConfirm": "确定要重�?{username} 的密码吗�?,
echo       "passwordReset": "密码已重�?,
echo       "deleteUserConfirm": "确定要删�?{username} 吗？"
echo     }
echo   },
echo   "api": {
echo     "headers": {
echo       "api": "API密钥管理"
echo     },
echo     "subheaders": {
echo       "api": "管理邮件发送API密钥"
echo     },
echo     "actions": {
echo       "set": "设置密钥",
echo       "test": "测试密钥",
echo       "delete": "删除密钥"
echo     },
echo     "messages": {
echo       "keySet": "API密钥已设�?,
echo       "keyDeleted": "API密钥已删�?,
echo       "keyTested": "API密钥测试成功"
echo     }
echo   },
echo   "logs": {
echo     "headers": {
echo       "logs": "邮件日志"
echo     },
echo     "subheaders": {
echo       "logs": "查看邮件发送记�?
echo     }
echo   }
echo }
) > zh.json
```

#### 英文翻译 (en.json)

```bash
# 创建英文翻译文件
(
echo {
echo   "app": {
echo     "title": "RuAlive Admin",
echo     "subtitle": "ADMIN CONSOLE",
echo     "loading": "Loading...",
echo     "language": "Language",
echo     "logout": "Logout"
echo   },
echo   "nav": {
echo     "invites": "Invites",
echo     "users": "Users",
echo     "api": "API Key",
echo     "logs": "Logs"
echo   },
echo   "invites": {
echo     "headers": {
echo       "invites": "Invite Codes",
echo       "create": "Create"
echo     },
echo     "subheaders": {
echo       "invites": "Manage user registration invite codes"
echo     },
echo     "actions": {
echo       "create": "Create",
echo       "delete": "Delete"
echo     },
echo     "labels": {
echo       "code": "Code",
echo       "usage": "Usage",
echo       "expires": "Expires"
echo     },
echo     "messages": {
echo       "noKeys": "No invite codes",
echo       "confirmTitle": "Confirm Delete",
echo       "confirmDesc": "Are you sure you want to delete this invite code?",
echo       "deleted": "Invite code deleted",
echo       "ticketPrinted": "Invite code created"
echo     }
echo   },
echo   "users": {
echo     "headers": {
echo       "users": "User Management"
echo     },
echo     "subheaders": {
echo       "users": "Manage registered users and permissions"
echo     },
echo     "actions": {
echo       "edit": "Edit",
echo       "reset": "Reset Password",
echo       "delete": "Delete"
echo     },
echo     "table": {
echo       "userIdentity": "User Info",
echo       "role": "Role"
echo     },
echo     "messages": {
echo       "resetConfirm": "Are you sure you want to reset {username}'s password?",
echo       "passwordReset": "Password has been reset",
echo       "deleteUserConfirm": "Are you sure you want to delete {username}?"
echo     }
echo   },
echo   "api": {
echo     "headers": {
echo       "api": "API Key Management"
echo     },
echo     "subheaders": {
echo       "api": "Manage email sending API key"
echo     },
echo     "actions": {
echo       "set": "Set Key",
echo       "test": "Test Key",
echo       "delete": "Delete Key"
echo     },
echo     "messages": {
echo       "keySet": "API key has been set",
echo       "keyDeleted": "API key has been deleted",
echo       "keyTested": "API key test successful"
echo     }
echo   },
echo   "logs": {
echo     "headers": {
echo       "logs": "Email Logs"
echo     },
echo     "subheaders": {
echo       "logs": "View email sending records"
echo     }
echo   }
echo }
) > en.json

# 验证文件创建
dir
```

---

## 三、代码调�?
### 3.1 修改 admin-v2.tsx - 禁用Mock数据

找到 `apiClient` 函数，在文件顶部添加环境变量�?
```typescript
// 在文件顶部添加（约第200行之前）
const USE_MOCK = false; // 生产环境禁用Mock数据

// 找到 apiClient 函数�?catch 块（约第260行）
} catch (error: any) {
  console.error(`[API FAIL] ${endpoint}:`, error.message);
  
  // 仅在开发环境使用Mock数据
  if (USE_MOCK) {
    return getMockData(endpoint, options);
  }
  
  // 生产环境抛出错误
  throw error;
}
```

### 3.2 修改 vite.config.ts - 调整构建配置

完整的配置文件：

```typescript
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    base: '/', // 部署到根路径
    build: {
      outDir: 'dist', // 输出�?dist 目录
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'admin-v2.html')
        }
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
```

### 3.3 修改 src/index.js - 添加 admin-v2 路由

在现有的 `/admin` 路由之前添加 `/admin-v2` 路由（约�?13行）�?
```javascript
// 新增 /admin-v2 路由
if (path === '/admin-v2' || path === '/admin-v2.html') {
  if (ASSETS) {
    const adminV2Url = new URL('/admin-v2.html', request.url);
    const assetResponse = await ASSETS.fetch(new Request(adminV2Url, { method: 'GET' }));
    if (assetResponse && assetResponse.status !== 404) {
      const newHeaders = new Headers(assetResponse.headers);
      newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      return new Response(assetResponse.body, {
        status: assetResponse.status,
        headers: newHeaders
      });
    }
  }
  return new Response('管理后台V2页面未找�?, { status: 404 });
}

// 保留原有 /admin 路由（保持不变）
if (path === '/admin' || path === '/admin.html' || path === '/admin/') {
  // ... 现有逻辑保持不变
}
```

---

## 四、本地测�?
### 4.1 安装依赖

```bash
# 进入 admin-v2 目录
cd C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\rualive-email-worker\public\admin-v2

# 初始�?package.json（如果不存在�?if not exist package.json (
  echo {> package.json
  echo   "name": "admin-v2",>> package.json
  echo   "version": "1.0.0",>> package.json
  echo   "type": "module",>> package.json
  echo   "scripts": {>> package.json
  echo     "dev": "vite",>> package.json
  echo     "build": "vite build",>> package.json
  echo     "preview": "vite preview">> package.json
  echo   },>> package.json
  echo   "dependencies": {>> package.json
  echo     "react": "^19.2.4",>> package.json
  echo     "react-dom": "^19.2.4",>> package.json
  echo     "react-router-dom": "^7.13.0",>> package.json
  echo     "recharts": "^3.7.0",>> package.json
  echo     "lucide-react": "^0.563.0",>> package.json
  echo     "gsap": "^3.14.2">> package.json
  echo   },>> package.json
  echo   "devDependencies": {>> package.json
  echo     "@vitejs/plugin-react": "^4.2.0",>> package.json
  echo     "vite": "^5.0.0",>> package.json
  echo     "typescript": "^5.3.0">> package.json
  echo   }>> package.json
  echo }>> package.json
)

# 安装依赖
npm install
```

### 4.2 启动开发服务器

```bash
# 启动开发服务器
npm run dev

# 服务器将�?http://localhost:3000 启动
```

### 4.3 测试功能清单

#### 登录功能测试

```bash
# 1. 访问登录�?# 浏览器打开：http://localhost:3000/login

# 2. 测试登录
# 输入管理员账号：admin@rualive.com
# 输入密码：admin123
# 点击登录

# 3. 验证跳转
# 应该跳转�?http://localhost:3000/admin-v2
```

#### 邀请码管理测试

```bash
# 1. 点击"邀请码管理"标签
# 2. 创建邀请码
#    - 设置最大使用次数：10
#    - 设置过期天数�?0
#    - 点击"创建"按钮
# 3. 验证邀请码显示在列表中
# 4. 删除邀请码
#    - 点击删除按钮
#    - 确认删除
# 5. 验证邀请码已删�?```

#### 用户管理测试

```bash
# 1. 点击"用户管理"标签
# 2. 查看用户列表
# 3. 测试重置密码
#    - 点击重置密码按钮
#    - 选择自动生成
#    - 确认重置
# 4. 验证密码已重�?```

#### API密钥管理测试

```bash
# 1. 点击"API密钥"标签
# 2. 查看当前API密钥（脱敏）
# 3. 测试设置新密�?#    - 输入新密�?#    - 点击"设置密钥"
# 4. 测试密钥
#    - 点击"测试密钥"
# 5. 验证测试成功
```

#### 邮件日志测试

```bash
# 1. 点击"邮件日志"标签
# 2. 查看邮件发送记�?# 3. 验证数据显示正确
```

#### 旧版本测�?
```bash
# 1. 访问旧版�?# 浏览器打开：http://localhost:3000/admin

# 2. 测试所有功�?#    - 邀请码管理
#    - 用户管理
#    - API密钥管理
#    - 邮件日志

# 3. 验证功能正常
```

### 4.4 构建测试

```bash
# 1. 构建生产版本
npm run build

# 2. 验证输出
dir dist

# 3. 预览构建结果
npm run preview

# 4. 测试构建版本
# 浏览器打开预览URL
# 重复功能测试
```

---

## 五、部署到 Cloudflare

### 5.1 提交代码

```bash
# 进入项目根目�?cd C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\RUAlive\rualive-email-worker

# 查看修改
git status

# 添加所有修�?git add .

# 提交代码
git commit -m "feat: add admin-v2 route with React dashboard

- Add /admin-v2 route for new admin dashboard
- Migrate rualive-admin-v2.0 to public/admin-v2/
- Add Chinese and English translations
- Disable Mock data in production
- Update vite.config.ts for production build
- Preserve existing /admin route for backward compatibility

Closes: #admin-v2-upgrade"

# 推送到远程
git push -u origin feature/admin-v2-migration
```

### 5.2 创建 Pull Request

```bash
# 1. �?GitHub 创建 Pull Request
#    - 源分支：feature/admin-v2-migration
#    - 目标分支：main
#    - 标题：feat: add admin-v2 route with React dashboard
#    - 描述：参�?commit message

# 2. 请求代码审查
# 3. 等待审查通过
# 4. 合并�?main 分支
```

### 5.3 部署到测试环�?
```bash
# 1. 合并�?main 后，拉取最新代�?git checkout main
git pull origin main

# 2. 部署�?Cloudflare
npm run deploy

# 3. 验证部署成功
# 访问测试环境URL
# 测试所有功�?```

### 5.4 部署到生产环�?
```bash
# 1. 确认测试环境无问�?# 2. 部署到生产环�?npm run deploy

# 3. 验证生产环境
# 访问生产环境URL
# https://rualive.itycon.cn/admin-v2

# 4. 测试所有功�?#    - 登录功能
#    - 邀请码管理
#    - 用户管理
#    - API密钥管理
#    - 邮件日志

# 5. 验证旧版本仍然可�?# 访问 https://rualive.itycon.cn/admin
# 测试所有功�?```

---

## 六、故障排�?
### 6.1 常见问题

#### 问题1：页面无法加�?
```bash
# 检查路由配�?# 查看 src/index.js 中是否正确配置了 /admin-v2 路由

# 检查文件路�?# 确认 admin-v2.html 在正确的位置
# 确认文件没有�?gitignore

# 检查构建输�?# 确认 dist 目录包含所有必要文�?```

#### 问题2：登录后跳转失败

```bash
# 检�?ProtectedRoute 组件
# 确认 token 检查逻辑正确

# 检�?localStorage
# 在浏览器控制台执行：
# localStorage.getItem('rualive_token')

# 检�?API 认证
# 查看网络请求，确�?Authorization header 正确
```

#### 问题3：API请求失败

```bash
# 检�?API_BASE 配置
# 确认指向正确的后端地址

# 检�?Mock 数据
# 确认 USE_MOCK 设置�?false

# 检查网络请�?# 在浏览器控制台查�?Network 面板
# 确认请求URL和参数正�?```

#### 问题4：翻译文件加载失�?
```bash
# 检查文件路�?# 确认 locals/zh.json �?locals/en.json 存在

# 检查文件格�?# 确认 JSON 格式正确，无语法错误

# 检查加载逻辑
# 查看控制台是否有加载错误
```

### 6.2 调试技�?
#### 启用详细日志

```typescript
// �?admin-v2.tsx 中添加日�?console.log('[DEBUG] Current path:', window.location.pathname);
console.log('[DEBUG] Token:', localStorage.getItem('rualive_token'));
console.log('[DEBUG] API_BASE:', API_BASE);
```

#### 使用浏览器开发者工�?
```bash
# 1. 打开浏览器开发者工�?#    F12 �?Ctrl+Shift+I

# 2. 查看控制�?#    - 查看错误信息
#    - 查看日志输出

# 3. 查看网络请求
#    - Network 面板
#    - 查看 API 请求和响�?
# 4. 查看本地存储
#    - Application 面板
#    - Local Storage
#    - 查看 rualive_token
```

---

## 七、性能优化

### 7.1 代码分割

```typescript
// �?vite.config.ts 中添加代码分�?build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        'charts': ['recharts'],
        'animations': ['gsap']
      }
    }
  }
}
```

### 7.2 懒加载组�?
```typescript
// 懒加载大型组�?const ChartView = React.lazy(() => import('./components/ChartView'));

// 使用 Suspense
<Suspense fallback={<div>Loading...</div>}>
  <ChartView />
</Suspense>
```

### 7.3 缓存策略

```javascript
// �?src/index.js 中添加缓存头
const newHeaders = new Headers(assetResponse.headers);
newHeaders.set('Cache-Control', 'public, max-age=3600'); // 1小时缓存
```

---

## 八、监控和日志

### 8.1 添加错误监控

```typescript
// �?admin-v2.tsx 中添加全局错误处理
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error);
  // 发送到监控服务
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Rejection]', event.reason);
  // 发送到监控服务
});
```

### 8.2 添加性能监控

```typescript
// 添加性能监控
const startTime = performance.now();

// 页面加载完成�?window.addEventListener('load', () => {
  const loadTime = performance.now() - startTime;
  console.log(`[Performance] Page loaded in ${loadTime}ms`);
  // 发送到监控服务
});
```

---

## 九、总结

### 关键命令速查

```bash
# 备份
git checkout -b backup-before-admin-v2
git add . && git commit -m "backup"
git push -u origin backup-before-admin-v2

# 创建迁移分支
git checkout -b feature/admin-v2-migration

# 创建文件�?cd public
mkdir admin-v2\locals

# 复制文件
copy ..\reference\rualive-admin-v2.0\index.html admin-v2\admin-v2.html
copy ..\reference\rualive-admin-v2.0\index.tsx admin-v2\admin-v2.tsx
copy ..\reference\rualive-admin-v2.0\LogoAnimation.tsx admin-v2\
copy ..\reference\rualive-admin-v2.0\BrickLoader.tsx admin-v2\

# 安装依赖
cd admin-v2
npm install

# 开�?npm run dev

# 构建
npm run build

# 部署
cd ..
npm run deploy

# 提交
git add .
git commit -m "feat: add admin-v2 route"
git push -u origin feature/admin-v2-migration
```

### 重要文件位置

```
rualive-email-worker/
├── public/
�?  ├── admin-v2/
�?  �?  ├── admin-v2.html      # 主页�?�?  �?  ├── admin-v2.tsx       # 主应�?�?  �?  ├── LogoAnimation.tsx  # Logo组件
�?  �?  ├── BrickLoader.tsx    # 加载器组�?�?  �?  ├── locals/
�?  �?  �?  ├── zh.json        # 中文翻译
�?  �?  �?  └── en.json        # 英文翻译
�?  �?  ├── vite.config.ts     # 构建配置
�?  �?  └── tsconfig.json      # TS配置
�?  └── admin.html             # 旧版本（保持不变�?└── src/
    └── index.js               # 后端路由（添�?/admin-v2 路由�?```

---

**文档版本**: 1.0  
**创建日期**: 2026-01-30  
**最后更�?*: 2026-01-30  
**维护�?*: iFlow CLI
