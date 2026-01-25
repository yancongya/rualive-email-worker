import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      root: '.',
      publicDir: false, // 禁用默认的 public 目录
      build: {
        outDir: './',
        emptyOutDir: false,
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html'),
            auth: path.resolve(__dirname, 'auth.html')
          },
          output: {
            assetFileNames: 'assets/[name]-[hash][extname]'
          }
        },
        assetsDir: 'assets',
        copyPublicDir: false
      },
      server: {
        port: 3737,
        host: '0.0.0.0',
        historyApiFallback: {
          index: '/index.html', // 所有路由都返回 index.html
        },
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
