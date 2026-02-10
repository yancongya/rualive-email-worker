import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite Configuration for RuAlive Frontend
 *
 * ==================== 目录结构说明 ====================
 *
 * 源代码结构：
 * - public/ - 前端源代�? *   - index.html - 落地�? *   - auth.html - 登录/注册�? *   - user-v6.html - 用户面板
 *   - admin.html - 管理后台
 *   - locals/ - 国际化文�? *   - assets/ - 静态资�? *   - *.tsx - React 组件
 *
 * 构建产物�? * - dist/ - 构建输出目录
 *   - index.html - 编译后的落地�? *   - auth.html - 编译后的登录�? *   - user-v6.html - 编译后的用户面板
 *   - admin.html - 编译后的管理后台
 *   - assets/ - 编译后的 JS/CSS 文件
 *   - locals/ - 国际化文件（复制�? *
 * ==================== 构建流程 ====================
 *
 * 1. 清空 dist/ 目录
 * 2. 编译 React 组件�?assets/
 * 3. 生成优化�?HTML 文件
 * 4. 复制静态资�? *
 * ==================== 部署配置 ====================
 *
 * wrangler.toml:
 * [assets]
 * directory = "dist"
 * binding = "ASSETS"
 *
 * 这会部署 dist/ 目录�?Cloudflare Assets
 *
 * ==================== 常见问题 ====================
 *
 * Q: 为什�?HTML 文件�?dist/ 而不�?dist/public/�? * A: 通过配置 root �?outDir 确保所有文件直接在 dist/ �? *
 * Q: 为什么构建后 HTML 引用的是编译后的 JS 而不�?.tsx�? * A: Vite 会自动替�?HTML 中的入口点引�? *
 * Q: 如何确保构建产物是正确的�? * A: 运行 npm run verify:build 检�? */

export default defineConfig({
  // 不设�?root，使用默认当前目�?  build: {
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
    copyPublicDir: false  // 不自动复�?public 目录
  },
  server: {
    port: 3737,
    host: '0.0.0.0',
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'https://rualive.itycon.cn',
        changeOrigin: true,
        secure: true,
      }
    }
  },
  plugins: [
    react(),
    {
      name: 'copy-favicon',
      generateBundle() {
        const { copyFileSync, existsSync } = require('fs');
        const faviconSrc = path.resolve(__dirname, 'public/favicon.svg');
        const faviconDest = path.resolve(__dirname, 'dist/favicon.svg');

        if (existsSync(faviconSrc)) {
          copyFileSync(faviconSrc, faviconDest);
          console.log('[copy-favicon] Copied favicon.svg to dist/');
        }
      }
    },
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
        // Vite �?HTML 文件放在 dist/public/，我们需要将它们复制�?dist/ 根目�?        // 这样 wrangler 可以正确找到这些文件
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
