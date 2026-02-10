# 构建目录结构修复说明

## 问题描述

构建时目录结构混乱，导致部署时出现 404 错误：
- HTML 文件引用源文件（`./auth.tsx`）而不是编译后的 JS 文件
- HTML 文件位置不一致（`dist/public/` vs `dist/`）
- wrangler 部署时上传了错误的文件

## 根本原因

1. **Vite 配置混乱**：
   - `root: 'public'` 导致工作目录混乱
   - `outDir` 相对于 `root` 配置错误
   - Vite 自动将 HTML 文件放在 `dist/public/` 中

2. **wrangler.toml 配置不匹配**：
   - 配置 `directory = "dist"` 从 `dist/` 读取
   - 但 HTML 文件在 `dist/public/`，JS 文件在 `dist/assets/`

3. **构建命令混乱**：
   - `cd public && vite build` 导致工作目录不正确
   - 输出路径相对于 `public/` 而不是项目根目录

## 解决方案

### 1. 创建根目录 vite.config.ts

```typescript
// vite.config.ts (项目根目录)
export default defineConfig({
  // 不设置 root，使用默认当前目录
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'public/index.html'),
        auth: path.resolve(__dirname, 'public/auth.html'),
        userV6: path.resolve(__dirname, 'public/user-v6.html'),
        adminV2: path.resolve(__dirname, 'public/admin.html')
      },
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    },
    assetsDir: 'assets',
    copyPublicDir: false
  },
  // ...
  plugins: [
    // ... 其他插件
    {
      name: 'move-html-files',
      closeBundle() {
        // Vite 将 HTML 文件放在 dist/public/，复制到 dist/ 根目录
        const { copyFileSync, existsSync } = require('fs');
        const publicDir = path.resolve(__dirname, 'dist/public');
        const distDir = path.resolve(__dirname, 'dist');
        const htmlFiles = ['index.html', 'auth.html', 'user-v6.html', 'admin.html'];
        
        htmlFiles.forEach(file => {
          const srcPath = path.join(publicDir, file);
          const destPath = path.join(distDir, file);
          
          if (existsSync(srcPath)) {
            copyFileSync(srcPath, destPath);
            console.log(`[move-html-files] Copied ${file} from dist/public/ to dist/`);
          }
        });
      }
    }
  ]
});
```

### 2. 修改 package.json

```json
{
  "scripts": {
    "dev:frontend": "vite --config vite.config.ts",
    "build:frontend": "vite build --config vite.config.ts"
  }
}
```

### 3. 更新 wrangler.toml

```toml
[assets]
directory = "dist"  # wrangler 部署 dist/ 目录
binding = "ASSETS"
```

### 4. 更新 .gitignore

```
dist/
node_modules/
.wrangler/
```

## 最终目录结构

```
rualive-email-worker/
├── public/                    # 源文件
│   ├── index.html            # 落地页
│   ├── auth.html             # 登录页
│   ├── user-v6.html          # 用户页
│   ├── admin.html            # 管理页
│   ├── index.tsx             # 落地页逻辑
│   ├── auth.tsx              # 登录页逻辑
│   ├── user-v6.tsx           # 用户页逻辑
│   ├── admin.tsx             # 管理页逻辑
│   ├── vite.config.ts        # 前端构建配置（旧）
│   └── assets/               # 静态资源
│       └── showcase/         # 展示图片
├── dist/                      # 构建输出（不提交）
│   ├── index.html            # ✅ 正确的 HTML（引用编译后的 JS）
│   ├── auth.html             # ✅ 正确的 HTML
│   ├── user-v6.html          # ✅ 正确的 HTML
│   ├── admin.html            # ✅ 正确的 HTML
│   ├── assets/               # 编译后的 JS/CSS
│   │   ├── main-[hash].js
│   │   ├── auth-[hash].js
│   │   ├── userV6-[hash].js
│   │   ├── adminV2-[hash].js
│   │   └── showcase/         # 复制的展示图片
│   ├── locals/               # 复制的翻译文件
│   │   ├── landing/
│   │   ├── auth/
│   │   ├── user/
│   │   └── admin/
│   └── public/               # Vite 输出的原始位置（忽略）
│       ├── index.html
│       ├── auth.html
│       ├── user-v6.html
│       └── admin.html
├── vite.config.ts            # ✅ 新的根目录构建配置
├── wrangler.toml             # Worker 配置
└── package.json              # 依赖和脚本
```

## 构建和部署流程

```bash
# 1. 修改源文件
# 编辑 public/*.html, public/*.tsx 等

# 2. 构建（自动清理 dist 目录）
npm run build:frontend

# 3. 部署
npx wrangler deploy
```

## 关键约束

1. **不要手动修改 dist 目录**：所有文件都由构建工具生成
2. **dist/ 目录不提交**：已在 .gitignore 中
3. **每次修改后必须重新构建**：不能跳过构建步骤
4. **使用正确的构建命令**：`npm run build:frontend`（从根目录）
5. **HTML 文件自动复制**：由 `move-html-files` 插件处理

## 验证清单

- [ ] 构建后检查 `dist/*.html` 引用的是 `/assets/[name]-[hash].js` 而不是 `./[name].tsx`
- [ ] 确认 `dist/` 根目录有所有 HTML 文件
- [ ] 确认 `dist/assets/` 有所有编译后的 JS 文件
- [ ] 确认 `dist/locals/` 有翻译文件
- [ ] 确认 `dist/assets/showcase/` 有展示图片
- [ ] 部署后测试所有页面都能正常访问
- [ ] 确认没有 404 错误

## 常见问题

### Q: 为什么 HTML 文件在 dist/public/ 和 dist/ 都有？
A: Vite 自动将输出放在 dist/public/，我们通过插件复制到 dist/ 根目录供 wrangler 使用。

### Q: 可以删除 dist/public/ 目录吗？
A: 可以，但下次构建会重新生成。建议保留，因为不影响部署。

### Q: 如何添加新页面？
A: 1. 在 `public/` 创建 HTML 和 TSX 文件
   2. 在 `vite.config.ts` 的 `rollupOptions.input` 中添加入口
   3. 在 `move-html-files` 插件中添加 HTML 文件名
   4. 重新构建

### Q: 为什么修改 package.json 的构建命令？
A: 之前使用 `cd public && vite build` 导致工作目录混乱，现在使用 `vite --config vite.config.ts` 从根目录构建。

## 更新历史

- **2026-02-10**: 创建根目录 `vite.config.ts`，添加 `move-html-files` 插件，修复目录结构问题
- **2026-02-10**: 更新 `package.json` 构建命令，移除 `cd public`
- **2026-02-10**: 更新 `wrangler.toml`，确认 `directory = "dist"`