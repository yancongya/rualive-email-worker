// 本地测试用户仪表板
const fs = require('fs');

// 读取 index.js 文件内容
const indexJsContent = fs.readFileSync('./src/index.js', 'utf-8');

// 提取 generateUserDashboard 函数
const match = indexJsContent.match(/function generateUserDashboard\(\) \{([\s\S]*?)\n\}\n\n/);

if (!match) {
  console.error('❌ 无法找到 generateUserDashboard 函数');
  process.exit(1);
}

const functionBody = match[1];
const fullFunction = `return ${functionBody}`;

// 执行函数生成 HTML
const generateUserDashboard = new Function(fullFunction);
const html = generateUserDashboard();

// 保存到文件
fs.writeFileSync('./test-user-dashboard.html', html, 'utf-8');

console.log('✓ 用户仪表板 HTML 已生成: test-user-dashboard.html');
console.log('请在浏览器中打开: file://' + __dirname + '/test-user-dashboard.html');