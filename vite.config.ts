import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite Configuration for RuAlive Frontend
 *
 * ==================== 目录结构说明 ====================
 *
 * 源代码结构：
 * - public/ - 前端源代码
 *   - index.html - 落地页
 *   - auth.html - 登录/注册页
 *   - user-v6.html - 用户面板
 *   - admin.html - 管理后台
 *   - locals/ - 国际化文件
 *   - assets/ - 静态资源
 *   - *.tsx - React 组件
 *
 * 构建产物：
 * - dist/ - 构建输出目录
 *   - index.html - 编译后的落地页
 *   - auth.html - 编译后的登录页
 *   - user-v6.html - 编译后的用户面板
 *   - admin.html - 编译后的管理后台
 *   - assets/ - 编译后的 JS/CSS 文件
 *   - locals/ - 国际化文件（复制）
 *
 * ==================== 构建流程 ====================
 *
 * 1. 清空 dist/ 目录
 * 2. 编译 React 组件到 assets/
 * 3. 生成优化的 HTML 文件
 * 4. 复制静态资源
 *
 * ==================== 部署配置 ====================
 *
 * wrangler.toml:
 * [assets]
 * directory = "dist"
 * binding = "ASSETS"
 *
 * 这会部署 dist/ 目录到 Cloudflare Assets
 *
 * ==================== 常见问题 ====================
 *
 * Q: 为什么 HTML 文件在 dist/ 而不是 dist/public/？
 * A: 通过配置 root 和 outDir 确保所有文件直接在 dist/ 中
 *
 * Q: 为什么构建后 HTML 引用的是编译后的 JS 而不是 .tsx？
 * A: Vite 会自动替换 HTML 中的入口点引用
 *
 * Q: 如何确保构建产物是正确的？
 * A: 运行 npm run verify:build 检查
 */

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
    copyPublicDir: false  // 不自动复制 public 目录
  },
  server: {
    port: 3737,
    host: '0.0.0.0',
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'https://rualive-email-worker.cubetan57.workers.dev',
        changeOrigin: true,
        secure: true,
      }
    }
  },
  plugins: [
    react(),
    {
      name: 'copy-locals',
      generateBundle() {
        const { copyFileSync, existsSync, mkdirSync, readdirSync } = require('fs');
        const localsSrc = path.resolve(__dirname, 'public/locals');
        const localsDest = path.resolve(__dirname, 'dist/locals');

        if (existsSync(localsSrc)) {
          const subdirs = readdirSync(localsSrc, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

          subdirs.forEach(subdir => {
            const srcDir = path.join(localsSrc, subdir);
            const destSubDir = path.join(localsDest, subdir);
            if (!existsSync(destSubDir)) {
              mkdirSync(destSubDir, { recursive: true });
            }
            ['zh.json', 'en.json'].forEach(file => {
              const srcFile = path.join(srcDir, file);
              const destFile = path.join(destSubDir, file);
              if (existsSync(srcFile)) {
                copyFileSync(srcFile, destFile);
                console.log(`[copy-locals] Copied ${subdir}/${file} to dist/locals/${subdir}/`);
              }
            });
          });
        }
      }
    },
    {
      name: 'copy-showcase',
      closeBundle() {
        const { copyFileSync, existsSync, mkdirSync, readdirSync } = require('fs');
        const showcaseSrc = path.resolve(__dirname, 'public/assets/showcase');
        const showcaseDest = path.resolve(__dirname, 'dist/assets/showcase');

        if (existsSync(showcaseSrc)) {
          mkdirSync(showcaseDest, { recursive: true });
          const files = readdirSync(showcaseSrc);
          files.forEach(file => {
            const srcPath = path.join(showcaseSrc, file);
            const destPath = path.join(showcaseDest, file);
            copyFileSync(srcPath, destPath);
          });
          console.log(`[copy-showcase] Copied ${files.length} showcase images to dist/assets/showcase/`);
        }
      }
    },
    {
      name: 'move-html-files',
      closeBundle() {
        // Vite 将 HTML 文件放在 dist/public/，我们需要将它们复制到 dist/ 根目录
        // 这样 wrangler 可以正确找到这些文件
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
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'public'),
    }
  },
  assetsInclude: ['**/*.svg']
});