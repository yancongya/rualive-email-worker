import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 扁平化对象，将嵌套对象转换为点号分隔的键值对
 * @param {Object} obj - 要扁平化的对象
 * @param {string} prefix - 键前缀
 * @returns {Object} 扁平化后的对象
 */
function flattenObject(obj, prefix = '') {
  const result = {};

  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;

    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (Array.isArray(obj[key])) {
        // 处理数组（如 slogans、stats.items 等）
        obj[key].forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            // 数组中的对象（如 stats.items）
            Object.assign(result, flattenObject(item, `${newKey}.${index}`));
          } else {
            // 简单数组（如 slogans）
            result[`${newKey}.${index}`] = item;
          }
        });
      } else {
        // 递归处理嵌套对象
        Object.assign(result, flattenObject(obj[key], newKey));
      }
    } else {
      // 简单值
      result[newKey] = obj[key];
    }
  }

  return result;
}

/**
 * 从 index.tsx 文件中提取 TRANSLATIONS 对象
 * @param {string} filePath - index.tsx 文件路径
 * @returns {Object} TRANSLATIONS 对象
 */
function extractTranslations(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // 提取 TRANSLATIONS 对象的代码
  const match = content.match(/const TRANSLATIONS = \{([\s\S]*?)\n\};/);
  if (!match) {
    throw new Error('无法找到 TRANSLATIONS 对象');
  }

  // 提取对象内容
  let objectCode = match[1];

  // 移除尾随逗号（JSON 不支持）
  objectCode = objectCode.replace(/,(\s*[}\]])/g, '$1');

  // 使用 Function 构造函数来解析（比 eval 更安全）
  const translations = new Function(`return {${objectCode}}`)();

  return translations;
}

/**
 * 主函数
 */
function main() {
  try {
    console.log('开始提取翻译文件...');

    // 读取 index.tsx 文件
    const indexTsxPath = path.join(__dirname, 'index.tsx');
    console.log(`读取文件: ${indexTsxPath}`);

    const translations = extractTranslations(indexTsxPath);
    console.log(`找到 ${Object.keys(translations).length} 种语言: ${Object.keys(translations).join(', ')}`);

    // 生成语言文件
    const localDir = path.join(__dirname, 'local');

    for (const lang in translations) {
      const flattened = flattenObject(translations[lang]);
      const outputPath = path.join(localDir, `${lang}.json`);

      fs.writeFileSync(outputPath, JSON.stringify(flattened, null, 2), 'utf-8');
      console.log(`✓ 生成 ${lang}.json (${Object.keys(flattened).length} 个键)`);
    }

    console.log('\n✅ 翻译文件生成完成！');
    console.log(`📁 输出目录: ${localDir}`);

  } catch (error) {
    console.error('❌ 提取失败:', error.message);
    process.exit(1);
  }
}

// 运行主函数
main();