
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync, existsSync, readdirSync, copyFileSync as fsCopyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 获取 __dirname 的兼容方式（ES模块）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
          mkdirSync(localsDest, { recursive: true });
          mkdirSync(join(localsDest, 'user'), { recursive: true });

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
    },
    {
      name: 'copy-showcase',
      closeBundle() {
        // 复制 showcase 图片到 dist 目录
        // 注意：vite.config.ts 在项目根目录，所以需要正确处理路径
        const projectRoot = join(__dirname);
        const showcaseSrc = join(projectRoot, 'public/assets/showcase');
        const showcaseDest = join(projectRoot, 'dist/assets/showcase');

        if (existsSync(showcaseSrc)) {
          mkdirSync(showcaseDest, { recursive: true });
          const files = readdirSync(showcaseSrc);
          files.forEach(file => {
            const srcPath = join(showcaseSrc, file);
            const destPath = join(showcaseDest, file);
            copyFileSync(srcPath, destPath);
          });
        }

        // 复制 index.html 到 dist 根目录
        const indexSrc = join(projectRoot, 'dist/public/index.html');
        const indexDest = join(projectRoot, 'dist/index.html');
        if (existsSync(indexSrc)) {
          copyFileSync(indexSrc, indexDest);
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
