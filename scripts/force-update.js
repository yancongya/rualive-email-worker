const fs = require('fs');
const path = require('path');
console.log('Force updating file timestamps...');
const criticalFiles = [
  'public/user-v6.html',
  'public/admin.html',
  'public/auth.html',
  'public/locals/user/zh.json',
  'public/locals/user/en.json'
];
const rootDir = path.join(__dirname, '..');
let updatedCount = 0;
criticalFiles.forEach(relativePath => {
  const fullPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    console.log('WARNING: File not found:', relativePath);
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const newTimestamp = new Date().toISOString();
  let newContent;
  if (relativePath.endsWith('.html')) {
    const pattern = /<!-- Deploy Time: .*? -->/;
    if (pattern.test(content)) {
      newContent = content.replace(pattern, '<!-- Deploy Time: ' + newTimestamp + ' -->');
    } else {
      newContent = content.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n<!-- Deploy Time: ' + newTimestamp + ' -->');
    }
  } else {
    try {
      const json = JSON.parse(content);
      json._deployTime = newTimestamp;
      newContent = JSON.stringify(json, null, 2);
    } catch (e) {
      console.log('WARNING: Could not parse JSON:', relativePath);
      return;
    }
  }
  if (newContent !== content) {
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log('Updated:', relativePath);
    updatedCount++;
  } else {
    console.log('Skipped:', relativePath);
  }
});
console.log('Completed:', updatedCount, 'files updated');