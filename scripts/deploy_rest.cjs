#!/usr/bin/env node
/**
 * deploy_rest.cjs —— 通过 GitHub REST API 把仓库文件推送到远端（免 git 协议）。
 * 适用场景：sandbox 内 git 协议被屏蔽 / 无交互式凭证时，用 Personal Access Token 推送。
 *
 * 用法（token 不落盘，仅本次进程使用）：
 *   GITHUB_TOKEN=ghp_xxx node scripts/deploy_rest.cjs
 *   或把 token 作为第一个参数：node scripts/deploy_rest.cjs ghp_xxx
 *
 * 行为：对每个本地文件，先 GET 其 sha（已存在则更新，否则新建），再 PUT。
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.GITHUB_TOKEN || process.argv[2];
if (!TOKEN) {
  console.error('缺少 GitHub Token。用法：GITHUB_TOKEN=xxx node scripts/deploy_rest.cjs');
  process.exit(1);
}
const OWNER = 'lec196102-hub';
const REPO = 'quiz-lottery-miniprogram';
const BRANCH = 'main';
const ROOT = path.join(__dirname, '..');

function req(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path: apiPath,
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'User-Agent': 'quiz-lottery-deploy',
        'Accept': 'application/vnd.github+json'
      }
    };
    if (data) { options.headers['Content-Type'] = 'application/json'; }
    const r = https.request(options, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(buf); } catch (e) {}
        resolve({ status: res.statusCode, json });
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

// 需要排除的目录（不上传）
const EXCLUDE = new Set(['.git', '.workbuddy', 'node_modules', '.DS_Store']);

function walk(dir, base, out) {
  for (const name of fs.readdirSync(dir)) {
    if (EXCLUDE.has(name)) continue;
    const full = path.join(dir, name);
    const rel = path.join(base, name).split(path.sep).join('/');
    if (fs.statSync(full).isDirectory()) walk(full, rel, out);
    else out.push(rel);
  }
  return out;
}

async function main() {
  const files = [];
  // 全量遍历仓库（排除 .git/.workbuddy/node_modules），避免遗漏 prototype/ docs/ 等目录。
  // 注意：这里曾因硬编码目录清单而漏掉 prototype/，导致 GitHub Pages 上的原型没同步更新。
  walk(ROOT, '', files);

  let ok = 0, fail = 0;
  for (const rel of files) {
    const localPath = path.join(ROOT, rel);
    const content = fs.readFileSync(localPath);
    const b64 = content.toString('base64');
    // 逐段 encodeURIComponent：中文文件名需转义，但保留 / 作为路径分隔符
    const apiPath = `/repos/${OWNER}/${REPO}/contents/${rel.split('/').map(encodeURIComponent).join('/')}`;
    // 取已有 sha
    let sha = null;
    const get = await req('GET', `${apiPath}?ref=${BRANCH}`);
    if (get.status === 200 && get.json && get.json.sha) sha = get.json.sha;
    const body = { message: `deploy: ${rel}`, content: b64, branch: BRANCH };
    if (sha) body.sha = sha;
    const put = await req('PUT', apiPath, body);
    if (put.status === 200 || put.status === 201) {
      console.log(`✓ ${rel}${sha ? ' (updated)' : ' (created)'}`);
      ok++;
    } else {
      console.error(`✗ ${rel} -> HTTP ${put.status}`, put.json && put.json.message);
      fail++;
    }
  }
  console.log(`\n完成：成功 ${ok}，失败 ${fail}`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
