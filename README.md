# 答题抽奖小程序（微信云开发 · 生产版 + 可交互原型 + PRD）

答题通关才能抽奖的微信小程序：参与者扫码登记姓名 + 工号，从 150 道单选题库随机抽 5 题，答对 3 题通关获得 1 次抽奖机会；奖品分 3 个等级（一/二/三等奖共 155 份），**恒定 25% 中奖率**，抽中的奖品从奖池实时扣减，某等级抽完自动剔除（后续不再抽到该等级但中奖率不变），每人仅可抽奖一次。

> 状态：已落地为**微信云开发（微信小程序原生 + 云函数 + 云数据库）**生产代码，并保留可交互低保真原型与完整 PRD。抽奖核心算法服务端权威实现，已用脚本验证。

## 对应 PRD 的 8 条需求

| # | 需求 | 实现位置 |
|---|------|----------|
| 1 | 扫码 / 链接参与 | 小程序首页扫码进入；`pages/home` |
| 2 | 登记姓名 + 工号 | `pages/register` 行内校验 + 同工号不同姓名告警（云函数 `register`） |
| 3 | 批量导入 150 道单选题 | 后台 `pages/admin-questions` 批量导入（JSON 粘贴，含校验与错误行反馈） |
| 4 | 每次随机 5 题，答对 3 题通关 | `pages/quiz` + 云函数 `drawQuestions` / `submitExam`（服务端判分） |
| 5 | 中奖提示等级 / 未中提示谢谢参与 | `pages/lottery-result` 四态（一/二/三/谢谢参与） |
| 6 | 三等级奖池 155 份，恒定 25%，抽完剔除 | 云函数 `drawLottery`：两阶段判定 + 剩余库存加权选级 + 事务原子扣减 |
| 7 | 通关可多次答题，抽奖仅一次 | 云函数事务 + `drawn` 标记防重复 |
| 8 | 后台查看获奖名单与时间 | `pages/admin-winners`（筛选 / 导出 CSV 至剪贴板） |

## 目录结构

```
.
├── project.config.json             小程序项目配置（填入你自己的 appid / env）
├── index.html                       根目录重定向（指向 prototype 单文件原型，供 GitHub Pages 预览）
├── docs/                            需求与调研文档
│   ├── PRD-答题抽奖小程序.md        产品需求文档（8 条需求逐条落地）
│   └── 开源项目对比分析报告.md       GitHub 同类项目功能/架构/技术栈/优缺点对比
├── miniprogram/                     小程序前端（原生）
│   ├── app.js / app.json / app.wxss 全局配置与样式
│   ├── utils/                        request.js（云函数调用封装）/ util.js
│   └── pages/                        12 个页面
│       ├── home / register / quiz / quiz-result / lottery / lottery-result / my-prize   ← 参与者端
│       └── admin-login / admin-dashboard / admin-questions / admin-prizes / admin-winners ← 管理后台
├── cloudfunctions/
│   ├── api/                         统一后端云函数（所有请求经此分发，含抽奖引擎）
│   └── initData/                    数据初始化云函数（seed 活动/奖品/题库/管理员，幂等）
└── prototype/                       可交互低保真原型（独立可运行，详见其目录说明）
```

## 部署运行（微信云开发）

1. **前置**：微信开发者工具 + 一个微信小程序 AppID + 开通云开发环境（记下环境 ID）。
2. **填配置**：
   - `project.config.json`：`appid` 改为你的 AppID；`miniprogramRoot` / `cloudfunctionRoot` 已配好。
   - `miniprogram/app.js`：`globalData.env` 改为你的云开发环境 ID。
3. **上传云函数**：在开发者工具中，分别右键 `cloudfunctions/api` 与 `cloudfunctions/initData` →「上传并部署：云端安装依赖」。
4. **初始化数据**：上传后右键 `cloudfunctions/initData` →「上传并运行」（触发一次），把活动配置、奖品（5/50/100）、150 道题库、管理员账号写入云数据库。
   - 管理员演示账号：`admin / admin123`（登录后台 `pages/admin-login`）。
5. **开通云数据库集合**：需创建集合 `activity`、`prizes`、`questions`、`participants`、`lotteryRecords`、`admins`（字段见 `cloudfunctions/initData/index.js`）。
   - **必须为 `lotteryRecords` 建立唯一索引 `(activityId, empNo)`**：这是数据库层的最后一道防线。
     代码层的原子锁已能挡住绝大多数并发重复，但唯一索引能在任何代码 bug 或极端异常下兜底，确保物理上不可能一人两条记录。
6. **预览/发布**：编译并预览小程序；正式发布走微信审核流程。

## 抽奖算法要点（风险最高、必须做对的部分，服务端权威）

0. **阶段零 · 原子抢锁（防重复抽奖）**：`UPDATE participants SET drawn=true WHERE _id=? AND drawn=false`。
   仅靠「先读 `drawn` 再判断」**在并发下是无效的**——快照隔离会让多个事务同时读到 `drawn:false` 并全部放行
   （压测实测：同一用户 200 并发 → 产生 200 条抽奖记录）。必须用条件原子更新抢锁，
   抢不到（updated≠1）立即回滚。且必须放在扣减库存**之前**，避免失败方白白消耗奖品。
1. **阶段一 · 中奖判定**：以恒定 `winRate=0.25` 判定「中不中」，不随奖池变动（抽完仍保持 25%）。
2. **阶段二 · 加权选级**：在 `remain>0` 的奖项中按**剩余库存**加权选等级（一等奖自然稀缺）。
3. **阶段三 · 原子扣减**：事务内 `UPDATE ... SET remain=remain-1 WHERE _id=? AND remain>0`，扣减失败则剔除该等级重试（最多 3 次）后降级为「谢谢参与」。
4. **防超发 / 防重复**：库存条件更新 + 参与者原子锁 + 工号维度二次校验 + 唯一索引（见部署第 5 步，**必需**）。

> 工号在 `register` 时统一转大写，避免 `a10086` / `A10086` 被判成两人而绕过「一人一次」。
> 抽奖前还会按 `empNo` 复查 `lotteryRecords`，拦截「同一工号换微信号」的情况。

> ⚠️ 关键测算：25% × 155 份 ≈ **需 620 人次抽奖**才能送完全部奖品。若参与人数不足，活动结束会剩大量奖品——上线前需与业务确认预期人数与中奖率。

## 原型 / 验证（保留）

```bash
cd prototype
node server.cjs          # 启动本地静态服务，访问 http://127.0.0.1:8173 查看交互原型
node verify_lottery.mjs  # 抽奖引擎断言（49）：并发零超发 / 奖池耗尽中奖率仍 25% / 等级剔除 / 防重复
node verify_data.mjs     # 数据层断言（27）：字段一致性 / 题库导入 / 名单导出
node stress_test.mjs     # 高并发压力测试（12）：并发去重 / 零超发 / 中奖率收敛 / 奖池耗尽
```

`stress_test.mjs` 内置一个**云函数事务语义模拟器**（在每次 `await` 处让出事件循环以模拟真实并发交错），
并用 `mode: 'buggy' | 'fixed'` 对照，直观复现并验证并发竞态修复是否生效。

## License

内部演示项目，保留所有权利。
