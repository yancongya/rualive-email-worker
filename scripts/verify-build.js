#!/usr/bin/env node

/**
 * 验证构建结果的脚本
 * 检查dist目录中是否包含所有必要的文件
 */

const fs = require('fs');
const path = require('path');

// 定义需要检查的文件
const REQUIRED_FILES = [
  // HTML文件
  'public/user-v6.html',
  'public/admin.html',
  'public/auth.html',
  'public/index.html',
  // JavaScript文件
  'assets/user-v6-*.js',
  'assets/admin-*.js',
  'assets/auth-*.js',
  'assets/client-*.js',
  // 翻译文件
  'public/locals/user/zh.json',
  'public/locals/user/en.json'
];

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath) {
  const fullPath = path.join(process.cwd(), 'dist', filePath);
  return fs.existsSync(fullPath);
}

function findFiles(pattern) {
  const dir = path.join(process.cwd(), 'dist', path.dirname(pattern));
  const filePattern = path.basename(pattern);
  
  if (!fs.existsSync(dir)) {
    return [];
  }
  
  try {
    const files = fs.readdirSync(dir);
    const regex = new RegExp('^' + filePattern.replace('*', '.*') + '$');
    return files.filter(file => regex.test(file));
  } catch (error) {
    return [];
  }
}

function main() {
  log('='.repeat(60), 'blue');
  log('验证构建结果', 'blue');
  log('='.repeat(60), 'blue');
  console.log();

  let allPassed = true;

  REQUIRED_FILES.forEach((file, index) => {
    const exists = file.includes('*') 
      ? findFiles(file).length > 0 
      : checkFile(file);
    
    const icon = exists ? '✓' : '✗';
    const color = exists ? 'green' : 'red';
    const status = exists ? '存在' : '缺失';
    
    log(`${icon} ${file}: ${status}`, color);
    
    if (!exists) {
      allPassed = false;
    }
  });

  console.log();
  log('='.repeat(60), 'blue');

  if (allPassed) {
    log('✓ 所有文件验证通过！', 'green');
    console.log();
    log('可以继续执行部署:', 'blue');
    log('  npm run deploy:full', 'yellow');
    process.exit(0);
  } else {
    log('✗ 验证失败！部分文件缺失。', 'red');
    console.log();
    log('请重新构建前端:', 'yellow');
    log('  npm run build:frontend', 'yellow');
    process.exit(1);
  }
}

main();