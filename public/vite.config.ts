import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite Configuration for RuAlive Frontend
 * 
 * Entry Points:
 * - index.html: Main landing page with React app
 * - auth.html: Authentication page (login/register)
 * - user-v6.html: User dashboard page (full-featured dashboard with charts, stats, etc.)
 * 
 * Note: Uses localStorage key 'rualive_token' for authentication (not 'token')
 * Updated: Removed user.html, /user route now points to user-v6.html
 */

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      root: '.',
      publicDir: false, // 禁用默认的 public 目录
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html'),
            auth: path.resolve(__dirname, 'auth.html'),
            userV6: path.resolve(__dirname, 'user-v6.html')
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
      plugins: [react()],
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
