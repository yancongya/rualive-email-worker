/**
 * 构建用户仪表板内联版本
 * 将所有 CSS 和 JS 文件合并到单个 HTML 文件中
 */

const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('  构建用户仪表板内联版本');
console.log('========================================\n');

// 步骤 1: 读取主入口文件
console.log('步骤 1: 读取主入口文件...');
const mainIndexPath = path.join(__dirname, '../src/index.js');
const mainContent = fs.readFileSync(mainIndexPath, 'utf-8');
console.log('✓ 主入口文件已读取\n');

// 步骤 2: 创建主样式（CSS 变量定义）
console.log('步骤 2: 创建主样式...');
const mainStyle = `
* { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --bg-primary: #f3f4f6;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
  --accent-primary: #667eea;
  --accent-secondary: #764ba2;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --shadow: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-hover: 0 4px 6px rgba(0,0,0,0.1);
}

.dark {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-card: #1f2937;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --border-color: #374151;
  --shadow: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-hover: 0 4px 6px rgba(0,0,0,0.4);
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  transition: background 0.3s, color 0.3s;
}

.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar h1 {
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: rgba(255,255,255,0.3);
  transform: translateY(-1px);
}

.dark-mode-toggle {
  padding: 0.5rem;
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.3s;
}

.dark-mode-toggle:hover {
  background: rgba(255,255,255,0.3);
  transform: rotate(15deg);
}

.main-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 2rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  margin-bottom: 1.5rem;
}

.card h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--accent-primary);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-secondary);
}

.btn-success {
  background: var(--success);
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

/* Tab Navigation Styles */
.tab-nav {
  display: flex;
  gap: 0.5rem;
  padding: 0;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  position: relative;
}

.tab-btn:hover {
  background: var(--bg-primary);
  border-color: var(--accent-primary);
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--accent-primary);
  background: var(--bg-secondary);
  border-color: var(--accent-primary);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent-primary);
}

/* Tab Content */
.tab-content {
  position: relative;
}

.tab-pane {
  display: none;
}

.tab-pane.active {
  display: block;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Fixed Time Navigation */
.fixed-time-nav {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  box-shadow: var(--shadow);
  margin-bottom: 1.5rem;
  position: sticky;
  top: 80px;
  z-index: 99;
}

.time-nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.time-nav-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-btn-small {
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  color: #333;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn-small:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #d0d0d0;
}

.nav-btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.time-nav-label {
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--text-primary);
  min-width: 100px;
  text-align: center;
  padding: 0 0.5rem;
}

.time-nav-tabs {
  display: flex;
  gap: 0.25rem;
}

.time-tab {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  color: #666;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 400;
  transition: all 0.2s;
  position: relative;
}

.time-tab:hover {
  background: #f5f5f5;
  border-color: #d0d0d0;
  color: #333;
}

.time-tab.active {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

.time-tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent-primary);
}

/* Detail Stat Clickable */
.detail-stat.clickable {
  cursor: pointer;
  transition: all 0.2s;
}

.detail-stat.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* List Table */
.list-info {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--bg-primary);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.list-table {
  width: 100%;
  border-collapse: collapse;
}

.list-table th,
.list-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.list-table th {
  background: var(--bg-primary);
  font-weight: 600;
  color: var(--text-primary);
  position: sticky;
  top: 0;
}

.list-table tbody tr:hover {
  background: var(--bg-primary);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  margin-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.pagination-info {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.pagination-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.pagination-btn {
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  color: #333;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  min-width: 36px;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-btn.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.pagination-ellipsis {
  padding: 0 0.5rem;
  color: var(--text-secondary);
}

/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
  color: white;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.5rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  max-height: calc(90vh - 80px);
}

.detail-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.detail-header h4 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-primary);
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.detail-stat {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}

.detail-stat:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.detail-stat-icon {
  font-size: 2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
  border-radius: 12px;
}

.detail-stat-content {
  flex: 1;
}

.detail-stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.detail-stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.detail-summary {
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  border-left: 4px solid var(--accent-primary);
}

.detail-summary h5 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
  font-size: 1rem;
}

.detail-summary p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.detail-summary strong {
  color: var(--accent-primary);
  font-weight: 600;
}

@media (max-width: 768px) {
  .detail-stats {
    grid-template-columns: 1fr;
  }
}
`;
console.log('✓ 主样式已创建\n');

// 步骤 3: 读取用户页面 HTML
console.log('步骤 3: 读取用户页面 HTML...');
const htmlPath = path.join(__dirname, '../src/user-dashboard/index.html');
const html = fs.readFileSync(htmlPath, 'utf-8');
console.log('✓ HTML 已读取\n');

// 步骤 4: 读取用户页面样式
console.log('步骤 4: 读取用户页面样式...');
const userStylePath = path.join(__dirname, '../src/user-dashboard/style.css');
const userStyle = fs.readFileSync(userStylePath, 'utf-8');
console.log('✓ 用户页面样式已读取\n');

// 步骤 5: 读取 JavaScript 文件
console.log('步骤 5: 读取 JavaScript 文件...');
const jsFiles = [
  'utils/api.js',
  'utils/date-utils.js',
  'components/time-selector.js',
  'components/stats-grid.js',
  'components/chart-view.js',
  'components/logs-table.js',
  'components/tab-manager.js',
  'user-dashboard/app.js'
];

let inlineJS = '';
jsFiles.forEach(file => {
  const filePath = path.join(__dirname, '../src', file);
  const content = fs.readFileSync(filePath, 'utf-8');
  inlineJS += '\n// ===== ' + file + ' =====\n';
  inlineJS += content + '\n';
  console.log('  ✓ 已加载: ' + file);
});
console.log('✓ JavaScript 文件已读取\n');

// 步骤 6: 生成内联 HTML
console.log('步骤 6: 生成内联 HTML...');
const inlineHTML = html
  .replace('<link rel="stylesheet" href="/style.css">', '')
  .replace('<link rel="stylesheet" href="/user-dashboard/style.css">', '')
  .replace(/<script src="\/utils\/[^"]+"><\/script>/g, '')
  .replace(/<script src="\/components\/[^"]+"><\/script>/g, '')
  .replace(/<script src="\/user-dashboard\/[^"]+"><\/script>/g, '')
  .replace('</head>', '<style>' + mainStyle + '</style><style>' + userStyle + '</style></head>')
  .replace('</body>', '<script>' + inlineJS + '</script></body>');
console.log('✓ 内联 HTML 已生成\n');

// 步骤 7: 写入内联 HTML 文件
console.log('步骤 7: 写入内联 HTML 文件...');
const outputPath = path.join(__dirname, '../src/user-dashboard/index-inline.html');

// 先写入临时目录
const tempPath = path.join(require('os').tmpdir(), 'rualive-inline-' + Date.now() + '.html');
fs.writeFileSync(tempPath, inlineHTML, 'utf-8');

// 尝试复制到目标位置
try {
  // 删除旧文件（如果存在）
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }

  // 复制新文件
  fs.copyFileSync(tempPath, outputPath);
  const sizeKB = (fs.statSync(outputPath).size / 1024).toFixed(2);
  console.log('✓ 文件已写入，大小: ' + sizeKB + ' KB\n');

  // 删除临时文件
  fs.unlinkSync(tempPath);
} catch (error) {
  console.error('✓ 写入失败，临时文件保存在: ' + tempPath);
  console.error('  错误: ' + error.message);
  console.error('  请手动复制文件到: ' + outputPath);
  process.exit(1);
}

console.log('========================================');
console.log('  构建成功！');
console.log('========================================\n');
console.log('下一步：');
console.log('1. 上传到 KV');
console.log('   npx wrangler kv:key put --binding=KV "user-dashboard-inline" --path=./src/user-dashboard/index-inline.html --preview false');
console.log('2. 部署');
console.log('   npx wrangler deploy\n');