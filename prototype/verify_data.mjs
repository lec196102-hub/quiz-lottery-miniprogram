/**
 * verify_data.mjs —— 数据层自检脚本
 * 运行：node prototype/verify_data.mjs
 * 用途：校验 test_data.js 的结构完整性，是《测试方案》中"数据层校验"用例的可执行版本。
 */
import { ACTIVITY, QUESTIONS, PRIZES, PARTICIPANTS, LOTTERY_RECORDS, EXAM_RECORDS, ADMINS } from './test_data.js';

let pass = 0;
let fail = 0;

function check(name, condition, detail = '') {
  if (condition) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

console.log('\n=== 1. 题库校验 ===');
check('题目总数 = 150', QUESTIONS.length === 150, `实际 ${QUESTIONS.length}`);

const nos = QUESTIONS.map((q) => q.no);
check('题号唯一', new Set(nos).size === nos.length);
check('题号连续 1-150', nos.every((n, i) => n === i + 1));

const badOption = QUESTIONS.filter((q) => !q.options || !['A', 'B', 'C', 'D'].every((k) => typeof q.options[k] === 'string' && q.options[k].length));
check('每题均有非空 A/B/C/D 四个选项', badOption.length === 0, `异常题号 ${badOption.map((q) => q.no)}`);

const badAnswer = QUESTIONS.filter((q) => !['A', 'B', 'C', 'D'].includes(q.answer));
check('正确答案均在 A-D 内', badAnswer.length === 0, `异常题号 ${badAnswer.map((q) => q.no)}`);

const dupOption = QUESTIONS.filter((q) => new Set(Object.values(q.options)).size !== 4);
check('同题四个选项不重复', dupOption.length === 0, `异常题号 ${dupOption.map((q) => q.no)}`);

const dupTitle = QUESTIONS.map((q) => q.title).filter((t, i, a) => a.indexOf(t) !== i);
check('题干无重复', dupTitle.length === 0, `重复 ${dupTitle.length} 条`);

const noAnalysis = QUESTIONS.filter((q) => !q.analysis);
check('每题均有解析', noAnalysis.length === 0, `缺失题号 ${noAnalysis.map((q) => q.no)}`);

const cats = [...new Set(QUESTIONS.map((q) => q.category))];
console.log(`  分类：${cats.join(' / ')}（共 ${cats.length} 类）`);
const dist = QUESTIONS.reduce((m, q) => ((m[q.answer] = (m[q.answer] || 0) + 1), m), {});
console.log(`  答案分布：${JSON.stringify(dist)}`);

console.log('\n=== 2. 奖品池校验 ===');
check('奖项数量 = 3', PRIZES.length === 3);
check('各奖项 total 与 remain 一致（初始态）', PRIZES.every((p) => p.total === p.remain));
check('一等奖 5 份', PRIZES.find((p) => p.level === 1)?.total === 5);
check('二等奖 50 份', PRIZES.find((p) => p.level === 2)?.total === 50);
check('三等奖 100 份', PRIZES.find((p) => p.level === 3)?.total === 100);
check('奖品总数 = 155', PRIZES.reduce((s, p) => s + p.total, 0) === 155);

console.log('\n=== 3. 活动配置校验 ===');
check('中奖概率 = 0.25', ACTIVITY.winRate === 0.25);
check('通关阈值 = 3', ACTIVITY.passScore === 3);
check('每次抽题 = 5', ACTIVITY.questionCount === 5);
check('活动状态为 open', ACTIVITY.status === 'open');

console.log('\n=== 4. 业务数据校验 ===');
check('参与者表非空', PARTICIPANTS.length > 0);
check('参与者工号唯一', new Set(PARTICIPANTS.map((p) => p.empNo)).size === PARTICIPANTS.length);
check('中奖记录工号唯一（一人一次）', new Set(LOTTERY_RECORDS.map((r) => r.empNo)).size === LOTTERY_RECORDS.length);
check('已抽奖参与者 drawn=true', PARTICIPANTS.filter((p) => p.drawn).every((p) => p.passed));
check('中奖记录均能在参与者表中找到', LOTTERY_RECORDS.every((r) => PARTICIPANTS.some((p) => p.empNo === r.empNo)));
const drawnCount = PARTICIPANTS.filter((p) => p.drawn).length;
check('抽奖人数 = 中奖记录条数', drawnCount === LOTTERY_RECORDS.length, `参与者 ${drawnCount} / 记录 ${LOTTERY_RECORDS.length}`);
check('答题记录工号均存在于参与者表', EXAM_RECORDS.every((r) => PARTICIPANTS.some((p) => p.empNo === r.empNo)));
check('答题记录 passed 与 correctCount 一致', EXAM_RECORDS.every((r) => r.passed === r.correctCount >= ACTIVITY.passScore));
check('管理员账号存在', ADMINS.length > 0);

console.log(`\n=== 结果：${pass} 通过 / ${fail} 失败 ===\n`);
process.exit(fail > 0 ? 1 : 0);
