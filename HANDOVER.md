# 答题抽奖小程序 · 交接运维文档

> 面向接手本项目的 AI Agent / 工程师。**读完本文即可独立继续开发**，无需回溯历史会话。
> 最后更新：2026-09-01（对应 git commit `28863e2`）

---

## 1. 项目是什么

企业内部**「答题通关才能抽奖」**微信小程序。核心链路：

```
扫码/链接进入 → 登记姓名+工号 → 随机 5 题（答对 3 题通关）
→ 抽奖（恒定 25% 中奖率）→ 中奖显示等级 / 未中显示「谢谢参与」
→ 后台可查获奖名单与中奖时间
```

**8 条原始需求（验收基准，不可打折）**

| # | 需求 | 实现位置 | 状态 |
|---|------|----------|------|
| 1 | 扫码 / 链接参与 | `pages/home`（单活动场景） | ⚠️ 部分（见 §9） |
| 2 | 登记姓名 + 工号 | `pages/register` + 云函数 `register` | ✅ |
| 3 | 批量导入 150 道单选题 | `pages/admin-questions` + `importQuestions` | ✅ |
| 4 | 随机 5 题，答对 3 题通关 | `pages/quiz` + `drawQuestions`/`submitExam` | ✅ |
| 5 | 中奖提示等级 / 未中「谢谢参与」 | `pages/lottery-result` | ✅ |
| 6 | 三档奖池 155 份，恒定 25%，抽完剔除 | 云函数 `drawLottery` | ✅ |
| 7 | 答题可多次，抽奖仅一次 | 云函数 `drawLottery` 原子锁 | ✅ |
| 8 | 后台查获奖名单与时间 | `pages/admin-winners` | ✅ |

---

## 2. 当前状态快照

| 项 | 值 |
|---|---|
| 远程仓库 | `https://github.com/lec196102-hub/quiz-lottery-miniprogram`（分支 `main`） |
| 本地 git HEAD | `28863e2` |
| 在线预览（原型） | https://lec196102-hub.github.io/quiz-lottery-miniprogram/ |
| 单元测试 | `verify_lottery` **49/49** · `verify_data` **27/27** |
| 压力测试 | `stress_test` **12/12** |
| 语法检查 | 云函数 + 12 页面 + 单文件内嵌脚本 **全通过** |
| 生产环境 | **尚未在真实微信云环境联调过**（仅语义压测 + 文档验证） |

---

## 3. 技术选型与关键决策（已拍板，勿轻易推翻）

| 决策项（PRD §10） | 最终选择 |
|---|---|
| Q1 中奖后等级分配 | **按剩余库存加权**（`weightMode:'remain'`，一等奖自然稀缺） |
| Q2 奖池耗尽处理 | **关闭入口**（`poolEmptyBehavior:'close'`，抛 `POOL_EMPTY`） |
| Q3 预计参与人数 | 沿用 25%（⚠️ 需 620 人次才能送完 155 份，见 §9） |
| Q4 技术选型 | **微信云开发**（小程序原生 + 云函数 + 云数据库） |

**为什么不用开源方案**：调研 15+ 项目后无一个可直接用——答题类缺「奖品池+概率+库存扣减」，抽奖类（lucky-draw / lucky-canvas）纯前端无服务端概率，**不可用于真实发奖**。详见 `docs/开源项目对比分析报告.md`。

---

## 4. 目录结构

```
.
├── HANDOVER.md                 ← 你正在读：交接文档
├── README.md                   ← 部署与运行说明（面向使用者）
├── project.config.json         ← 小程序项目配置（appid 待填）
├── index.html                  ← 根重定向器 → prototype 单文件原型（供 GitHub Pages）
│
├── miniprogram/                ← 小程序前端（原生，无框架）
│   ├── app.js / app.json / app.wxss
│   ├── utils/request.js        ← 统一云函数调用封装 call(action, payload)
│   ├── utils/util.js           ← formatTime
│   └── pages/                  ← 12 个页面，每个 index.{js,json,wxml,wxss}
│       ├── home register quiz quiz-result lottery lottery-result my-prize   ← 参与者端
│       └── admin-login admin-dashboard admin-questions admin-prizes admin-winners ← 后台
│
├── cloudfunctions/
│   ├── api/index.js            ← ★ 统一后端，16 个 action，抽奖引擎在此
│   ├── api/package.json
│   ├── initData/index.js       ← 幂等 seed：活动/奖品/题库/管理员
│   ├── initData/seed-data.js   ← 由 prototype/test_data.js 转 CJS 生成
│   └── initData/package.json
│
├── prototype/                  ← 可交互低保真原型（独立运行，浏览器打开）
│   ├── index.html              ← 分离版（需 HTTP 打开，ES Module）
│   ├── index.single.html       ← 单文件内联版（116KB，GitHub Pages 用这个）
│   ├── data.js                 ← 数据访问层 + 原型版抽奖引擎
│   ├── test_data.js            ← 静态 mock：150 题 + 配置 + 奖品 + 管理员
│   ├── build_single.mjs        ← 把上面三个打包成 index.single.html
│   ├── server.cjs              ← 本地静态服务器 → http://127.0.0.1:8173
│   ├── verify_lottery.mjs      ← 抽奖引擎断言（49）
│   ├── verify_data.mjs         ← 数据层断言（27）
│   ├── stress_test.mjs         ← ★ 高并发压力测试（12，含事务语义模拟器）
│   ├── 线框图与交互原型说明.md
│   └── 测试功能方案.md
│
├── scripts/deploy_rest.cjs     ← ★ GitHub REST API 推送脚本（沙箱无 git 凭证时用）
│
└── docs/
    ├── PRD-答题抽奖小程序.md     ← 完整 PRD
    └── 开源项目对比分析报告.md
```

---

## 5. 架构与核心算法

### 5.1 数据流

```
小程序页面  →  utils/request.call(action, payload)
            →  wx.cloud.callFunction({ name:'api', data:{ action, payload } })
            →  cloudfunctions/api/index.js 的 handlers[action]
            →  云数据库（事务 + 条件原子更新）
            →  返回 { code:0, data } 或 { code:非0, message }
```

所有后端逻辑**只用** `cloudfunctions/api` 一个云函数，靠 `action` 分发。新增接口 = 往 `handlers` 里加一个方法。

### 5.2 抽奖引擎（风险最高，改动前务必读懂）

文件：`cloudfunctions/api/index.js` → `handlers.drawLottery`

```
阶段零 · 原子抢锁（防重复抽奖）★本轮新增
   UPDATE participants SET drawn=true WHERE _id=? AND drawn=false
   updated !== 1  →  立刻 rollback + 抛 ALREADY_DRAWN
   ⚠️ 必须放在扣减库存之前，否则失败方会白白消耗奖品

阶段一 · 中奖判定（恒定 25%，不随奖池变动）
   if (Math.random() < act.winRate) { 继续 } else { 谢谢参与 }

阶段二 · 加权选级
   在 remain>0 的奖项中按「剩余库存」加权（weightMode:'remain'，用 Math.max(remain, 0.0001) 避免除零）

阶段三 · 原子扣减（防超发）
   UPDATE prizes SET remain=remain-1 WHERE _id=? AND remain>0
   失败 → 剔除该等级重试，最多 3 次；仍失败 → 降级「谢谢参与」
```

**⚠️ 铁律：判重必须在「写路径」上做条件原子更新，不能「读 → 判 → 写」。**
快照隔离下，多个并发事务会同时读到旧值然后全部放行。库存扣减早就用对了模式，
但参与者去重漏了同款保护——压测实测**同一用户 200 并发产生 200 条记录**，已修复。

### 5.3 数据模型（云数据库集合）

| 集合 | 关键字段 |
|---|---|
| `activity` | `_id='ACT_DEFAULT'`, name, description, status, passScore=3, questionCount=5, **winRate=0.25**, **weightMode='remain'**, **poolEmptyBehavior='close'** |
| `prizes` | activityId, level(1/2/3), name, desc, total(5/50/100), remain |
| `questions` | activityId, no, category, title, options{A,B,C,D}, answer, analysis, enabled |
| `participants` | activityId, openid, name, empNo, registered, passed, passedAt, drawn, drawnAt, createdAt |
| `lotteryRecords` | activityId, participantId, name, empNo, level, prizeName, wonAt, remark |
| `admins` | user, pass, name, role |

### 5.4 API action 清单

`getActivity` `getStats` `register` `drawQuestions` `submitExam` `getEligibility`
`drawLottery` `getMyResult` `listQuestions` `toggleQuestion` `importQuestions`
`updateActivity` `updatePrize` `listWinners` `exportWinnersCsv` `adminLogin`

---

## 6. 如何运行

### 6.1 原型（最快，浏览器即可）
```bash
cd prototype
node server.cjs          # → http://127.0.0.1:8173
# 或直接双击 index.single.html
```

### 6.2 正式小程序（需微信开发者工具）
1. 填 `project.config.json` 的 `appid`
2. 填 `miniprogram/app.js` 的 `globalData.env`（云环境 ID）
3. 右键 `cloudfunctions/api`、`cloudfunctions/initData` →「上传并部署：云端安装依赖」
4. 右键 `cloudfunctions/initData` →「上传并运行」灌种子数据
5. **建集合**：activity / prizes / questions / participants / lotteryRecords / admins
6. **必建唯一索引**：`lotteryRecords` 的 `(activityId, empNo)` ← 最后一道物理防线
7. 后台登录：`admin / admin123`

### 6.3 测试
```bash
cd prototype
node verify_lottery.mjs   # 49 断言
node verify_data.mjs      # 27 断言
node stress_test.mjs      # 12 断言（高并发）
```

### 6.4 推送 GitHub
```bash
# 方式 A：有 git 凭证
git push origin main
# 方式 B：沙箱无凭证（GCM 需交互 / 无 gh）→ 用 REST API
GITHUB_TOKEN=<PAT> node scripts/deploy_rest.cjs
```

---

## 7. 本轮（最近一次）做了什么

| # | 改动 | 文件 |
|---|------|------|
| 1 | 修复原型白屏：`build_single.mjs` 用错变量导致 IIFE 返回值丢弃 | `prototype/build_single.mjs` + 重建 `index.single.html` |
| 2 | **修复并发重复抽奖竞态**（严重）：加原子抢锁 | `cloudfunctions/api/index.js` |
| 3 | 工号维度二次去重（拦「换微信号」绕过） | `cloudfunctions/api/index.js` |
| 4 | 工号统一大写（防 `a10086`/`A10086` 判成两人） | `cloudfunctions/api/index.js` |
| 5 | 新增高并发压力测试 + 事务语义模拟器 | `prototype/stress_test.mjs` |
| 6 | 文档：原子锁说明、唯一索引标为「必需」 | `README.md` |

---

## 8. 已踩过的坑（避免重复踩）

1. **单文件打包 IIFE 必须把返回值赋给外层变量。**
   `build_single.mjs` 曾写成 `(function(){...})()` 而没接收返回值，导致 `Data` 对外不可见 → 白屏。
   正确写法：`const __m = (function(){...})(); const Data = __m.Data;`

2. **判重不能「读 → 判 → 写」，必须条件原子更新。**（详见 §5.2）

3. **统计中奖率时先抬高库存。**
   155 份奖品 ÷ 25% ≈ 620 次就抽完，之后 `simulateDraws` 会提前 `break`，
   若仍除以 20000 会得到 0.77% 的假象。正确做法：先把各档 `remain` 拉到 999999。

4. **沙箱内 `git push` 大概率失败**（GCM helper-selector 需要交互式 TTY，无 token 也无 gh）。
   走 `scripts/deploy_rest.cjs` + `GITHUB_TOKEN`。
   注意区分：**DeepSeek 的 `sk-` 开头 Key 是大模型密钥，不是 GitHub PAT**，拿它打 GitHub 接口会 401 且泄露密钥。

5. **GitHub Pages 只能从 `/` 或 `/docs` 发布。** 原型在 `prototype/` 子目录，
   所以根 `index.html` 做了重定向，并需要 `.nojekyll`。

---

## 9. 待办与风险（按优先级）

| 优先级 | 项 | 说明 |
|---|---|---|
| 🔴 高 | **建唯一索引 `(activityId, empNo)`** | 云控制台手工操作。代码层已挡绝大多数场景，索引是物理兜底。**上线前必须做**。 |
| 🔴 高 | **真实云环境联调** | 目前事务/条件更新只在语义压测中验证，未在真实云环境跑过。建议上线前用小账号做一次真实并发验证。 |
| 🟡 中 | 管理员明文密码 | `adminLogin` 明文比对，演示级。生产应改哈希（bcrypt / 云函数环境变量加盐）。 |
| 🟡 中 | 需求 1 多活动不支持 | `onLaunch` 未解析二维码 `scene/query`，`activityId` 硬编码 `ACT_DEFAULT`。单活动够用；要支持多活动需把 activityId 贯穿前后端（约 16 处）。**故意未做**：刚修完并发 bug，不宜叠加高风险重构。 |
| 🟢 低 | 启用题目 < 5 道 | 后台若停用大量题目，抽题不足 5 道则无法达到通关阈值 3。可在 `drawQuestions` 加数量校验。 |
| 🟢 低 | 参与人数预估 | 25% × 155 份 → 需约 **620 人次**才送得完。人数不足会剩大量奖品，需与业务确认。 |

---

## 10. 约定的工作方式

- **密钥绝不入库**：任何 Token / API Key 只走环境变量或云函数环境变量，不写进代码或 git。
- **改抽奖引擎必跑全量测试**：`verify_lottery` + `verify_data` + `stress_test`，三者全绿才可提交。
- **改 `prototype/*.js` 后必须重建单文件**：`node build_single.mjs`，否则线上预览不同步。
- **提交前语法自检**：`node --check` 所有 `.js`。
- **破坏性操作先确认**：删库、重置数据、`git reset --hard` 等需明确授权。

---

## 11. 继续工作的建议入口

- **想改交互/视觉** → 先改 `prototype/index.html`（原型迭代快），确认后再同步到 `miniprogram/pages/*`。
- **想改抽奖规则** → `cloudfunctions/api/index.js` 的 `drawLottery` + `weightedPick`；改完必跑 `stress_test.mjs`。
- **想接大模型**（如 DeepSeek 自动解析/扩题/复盘）→ 新建 `cloudfunctions/llm`，Key 存云函数环境变量，绝不硬编码。
- **想上线** → 按 §6.2 走，重点完成 §9 的前两项（唯一索引 + 真实环境联调）。

---

## 12. 附：本地 git 与远程的关系

远程 `main` 曾通过 REST API 逐文件提交，因此**本地 git 历史与远程已分叉**。
若需在本机对齐（会丢弃本地提交，内容已与远程一致）：

```bash
git fetch origin && git reset --hard origin/main
```
