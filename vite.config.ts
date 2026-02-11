import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    copyPublicDir: true,
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
    assetsDir: 'assets'
  },
  server: {
    port: 3737,
    host: '0.0.0.0',
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'https://rualive.itycon.cn',
        changeOrigin: true,
        secure: true
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
      name: 'move-html-files',
      closeBundle() {
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
      '@': path.resolve(__dirname, 'public')
    }
  },
  assetsInclude: ['**/*.svg']
});