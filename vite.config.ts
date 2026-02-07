import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-locals',
      writeBundle() {
        // 确保翻译文件被复制到 dist 目录
        const localsSrc = join(__dirname, 'public/locals');
        const localsDest = join(__dirname, 'dist/public/locals');

        if (existsSync(localsSrc)) {
          // 创建目标目录
          mkdirSync(localsDest, { recursive: true });
          mkdirSync(join(localsDest, 'user'), { recursive: true });

          // 复制翻译文件
          const files = ['zh.json', 'en.json'];
          files.forEach(file => {
            const srcPath = join(localsSrc, 'user', file);
            const destPath = join(localsDest, 'user', file);
            if (existsSync(srcPath)) {
              copyFileSync(srcPath, destPath);
            }
          });
        }
      }
    }
  ],
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