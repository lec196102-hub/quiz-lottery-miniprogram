import fs from 'fs';
const dir = 'C:/Users/LYGY/WorkBuddy/抽奖小程序/prototype';

let html = fs.readFileSync(dir + '/index.html', 'utf8');
let test = fs.readFileSync(dir + '/test_data.js', 'utf8');
let data = fs.readFileSync(dir + '/data.js', 'utf8');

function strip(code) {
  // 删除 import 语句（含跨行）
  code = code.replace(/^\s*import\s+[\s\S]*?from\s*['"][^'"]*['"]\s*;?\s*$/gm, '');
  // export const/let/var/function/class/async function -> 普通声明
  code = code.replace(/\bexport\s+(default\s+)?(const|let|var|function|class|async\s+function)\b/g, '$2 ');
  // 删除 export { ... }; 导出列表（声明已在前一步保留）
  code = code.replace(/\bexport\s*\{[^}]*\}\s*;?/g, '');
  code = code.replace(/\bexport\s+default\s+[^;]*;?/g, '');
  return code;
}

const body = '/* === test_data.js (inlined) === */\n' + strip(test) +
  '\n/* === data.js (inlined) === */\n' + strip(data);
// 用 IIFE 隔离 data.js / test_data.js 的顶层声明，避免与 index.html 顶层 const 冲突
const merged = '(function(){\n' + body + '\nreturn { Data, BizError, TEST_UTILS };\n})()';
const injection = 'const __m = ' + merged + ';\nconst Data = __m.Data, BizError = __m.BizError, TEST_UTILS = __m.TEST_UTILS;';

// 替换 index.html 中对 ./data.js 的 import 行（可能跨多行）
const before = html.length;
html = html.replace(/import\s+[\s\S]*?\s+from\s*['"]\.\/data\.js['"]\s*;?/g, injection);
const after = html.length;

if (after === before) {
  console.error('WARN: 未找到 data.js 的 import 行，可能格式不符');
  process.exit(2);
}

fs.writeFileSync(dir + '/index.single.html', html);
console.log('OK index.single.html bytes=', after);
