import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs';

/**
 * Vite Configuration for RuAlive Frontend
 *
 * ==================== 构建流程说明 ====================
 *
 * 修改路由或页面后，必须按以下步骤操作：
 *
 * 1️⃣ 修改源文件（.html, .tsx, .css等）
 * 2️⃣ 更新本文件的 rollupOptions.input 配置（如果添加/删除页面）
 * 3️⃣ 执行构建: cd public && npm run build
 * 4️⃣ 部署 Worker: cd .. && npx wrangler deploy
 * 5️⃣ 验证功能是否正常
 *
 * ⚠️ 重要注意事项：
 * - 不要手动修改 dist 目录中的文件
 * - 每次修改后必须重新构建，不能跳过步骤3
 * - 构建前确保所有依赖已安装（npm install）
 * - 构建失败会阻止部署，请检查错误信息
 *
 * ==================== 入口点配置 ====================
 *
 * Entry Points:
 * - index.html: Main landing page with React app
 * - auth.html: Authentication page (login/register)
 * - user-v6.html: User dashboard page (full-featured dashboard with charts, stats, etc.)
 * - admin.html: Admin dashboard page (user management, invite codes, system settings)
 *
 * 路由映射 (src/index.js):
 * - / → index.html
 * - /login → auth.html
 * - /user → user-v6.html (新用户界面)
 * - /admin → admin.html (管理后台)
 *
 * 注意：user.html 已删除，不再构建
 * =========================================================
 *
 * Note: Uses localStorage key 'rualive_token' for authentication (not 'token')
 * Updated: Removed user.html, /user route now points to user-v6.html (2026-01-30)
 */

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      root: '.',
      publicDir: 'locals', // 复制 locals 目录中的文件
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html'),
            auth: path.resolve(__dirname, 'auth.html'),
            userV6: path.resolve(__dirname, 'user-v6.html'),
            adminV2: path.resolve(__dirname, 'admin.html')
          },
          output: {
            assetFileNames: 'assets/[name]-[hash][extname]',
            chunkFileNames: 'assets/[name]-[hash].js',
            entryFileNames: 'assets/[name]-[hash].js'
          }
        },
        assetsDir: 'assets',
        copyPublicDir: true
      },
      server: {
        port: 3737,
        host: '0.0.0.0',
        historyApiFallback: true, // 简化配置，让 Vite 自动处理
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
      name: 'copy-translations',
      generateBundle() {
        // 自动复制翻译文件到 dist/locals/
        const rootDir = path.resolve(__dirname, 'locals');
        const targetDir = path.resolve(__dirname, 'dist/locals');
        
        // 确保目标目录存在
        if (!existsSync(targetDir)) {
          mkdirSync(targetDir, { recursive: true });
        }
        
        // 复制各个页面的翻译文件
        if (existsSync(rootDir)) {
          const subdirs = readdirSync(rootDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
          
          subdirs.forEach(subdir => {
            const srcDir = path.join(rootDir, subdir);
            const destSubDir = path.join(targetDir, subdir);
            if (!existsSync(destSubDir)) {
              mkdirSync(destSubDir, { recursive: true });
            }
            ['zh.json', 'en.json'].forEach(file => {
              const srcFile = path.join(srcDir, file);
              const destFile = path.join(destSubDir, file);
              if (existsSync(srcFile)) {
                copyFileSync(srcFile, destFile);
                console.log(`[copy-translations] Copied ${subdir}/${file} to dist/locals/${subdir}/`);
              }
            });
          });
        }
      }
    }
  ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      assetsInclude: ['**/*.svg']
    };
});
