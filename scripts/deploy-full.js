#!/usr/bin/env node

/**
 * 完整的自动化部署脚本
 * 1. 验证构建结果
 * 2. 清理旧的部署文件
 * 3. 复制构建文件到部署目录
 * 4. 执行部署
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log();
  log(`[步骤 ${step}] ${message}`, 'cyan');
  log('-'.repeat(60), 'cyan');
}

function execCommand(command, description) {
  try {
    log(`执行: ${description}`, 'yellow');
    const output = execSync(command, { 
      encoding: 'utf-8',
      stdio: 'inherit'
    });
    log(`✓ ${description} 完成`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${description} 失败`, 'red');
    log(error.message, 'red');
    return false;
  }
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`✓ 创建目录: ${dirPath}`, 'green');
  }
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    log(`✗ 源目录不存在: ${src}`, 'red');
    return false;
  }

  ensureDir(dest);

  const entries = fs.readdirSync(src, { withFileTypes: true });

  let copied = 0;
  let skipped = 0;

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      const result = copyDirRecursive(srcPath, destPath);
      if (result) copied++;
    } else {
      fs.copyFileSync(srcPath, destPath);
      copied++;
    }
  }

  log(`✓ 复制 ${copied} 个文件到 ${dest}`, 'green');
  return true;
}

function cleanDeployDir() {
  const deployDir = path.join(process.cwd(), 'rualive-email-worker-dist');
  
  if (fs.existsSync(deployDir)) {
    log(`清理部署目录: ${deployDir}`, 'yellow');
    try {
      fs.rmSync(deployDir, { recursive: true, force: true });
      log(`✓ 部署目录已清理`, 'green');
    } catch (error) {
      log(`✗ 清理部署目录失败: ${error.message}`, 'red');
      return false;
    }
  }
  
  return true;
}

function copyToDeployDir() {
  const distDir = path.join(process.cwd(), 'dist');
  const deployDir = path.join(process.cwd(), 'rualive-email-worker-dist');
  
  log(`复制构建文件到部署目录`, 'yellow');
  log(`  源: ${distDir}`, 'blue');
  log(`  目标: ${deployDir}`, 'blue');

  const success = copyDirRecursive(distDir, deployDir);
  
  if (!success) {
    return false;
  }

  // 验证关键文件是否复制成功
  const keyFiles = [
    'public/user-v6.html',
    'public/locals/user/zh.json',
    'public/locals/user/en.json',
    'assets/user-v6-*.js'
  ];

  let allVerified = true;
  keyFiles.forEach(file => {
    const filePath = path.join(deployDir, file);
    const exists = file.includes('*')
      ? fs.readdirSync(path.dirname(filePath)).some(f => /^user-v6-.*\.js$/.test(f))
      : fs.existsSync(filePath);

    if (!exists) {
      log(`✗ 验证失败: ${file}`, 'red');
      allVerified = false;
    }
  });

  if (allVerified) {
    log('✓ 所有关键文件验证通过', 'green');
  }

  return allVerified;
}

function showSummary() {
  console.log();
  log('='.repeat(60), 'blue');
  log('部署总结', 'blue');
  log('='.repeat(60), 'blue');
  console.log();
  log('部署流程:', 'cyan');
  log('  1. ✓ 验证构建结果', 'green');
  log('  2. ✓ 清理旧部署文件', 'green');
  log('  3. ✓ 复制构建文件', 'green');
  log('  4. ✓ 执行Cloudflare部署', 'green');
  console.log();
  log('常用命令:', 'cyan');
  log('  npm run verify:build - 验证构建结果', 'yellow');
  log('  npm run deploy:full   - 完整部署流程', 'yellow');
  log('  npm run build:frontend - 仅构建前端', 'yellow');
  console.log();
  log('='.repeat(60), 'blue');
}

function main() {
  log('RuAlive Email Worker - 完整部署流程', 'blue');
  log('='.repeat(60), 'blue');

  try {
    // 步骤1: 强制更新关键文件时间戳
    logStep(1, '强制更新关键文件时间戳');
    execSync('node scripts/force-update.js', { stdio: 'inherit' });
    log('✓ 强制更新 完成', 'green');

    // 步骤2: 构建前端
    logStep(2, '构建前端');
    try {
      execSync('npm run build:frontend', { stdio: 'inherit' });
      log('✓ 前端构建 完成', 'green');
    } catch (error) {
      log('✗ 前端构建 失败', 'red');
      process.exit(1);
    }

    // 步骤3: 验证构建结果
    logStep(3, '验证构建结果');
    const verifyResult = execCommand('node scripts/verify-build.js', '验证构建');
    if (!verifyResult) {
      log('构建验证失败，请先构建前端:', 'yellow');
      log('  npm run build:frontend', 'yellow');
      process.exit(1);
    }

    // 步骤2: 清理旧部署文件
    logStep(2, '清理旧部署文件');
    const cleanResult = cleanDeployDir();
    if (!cleanResult) {
      log('清理部署目录失败', 'red');
      process.exit(1);
    }

    // 步骤3: 复制构建文件到部署目录
    logStep(3, '复制构建文件到部署目录');
    const copyResult = copyToDeployDir();
    if (!copyResult) {
      log('复制构建文件失败', 'red');
      process.exit(1);
    }

    // 步骤4: 执行部署
    logStep(4, '执行Cloudflare部署');
    const deployResult = execCommand('npx wrangler deploy', '部署到Cloudflare');
    if (!deployResult) {
      log('部署失败', 'red');
      process.exit(1);
    }

    // 显示总结
    showSummary();
    log('✓ 部署成功完成！', 'green');

  } catch (error) {
    log('部署过程中发生错误:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

main();