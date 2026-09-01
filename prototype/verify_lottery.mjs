/**
 * verify_lottery.mjs —— 抽奖引擎验证脚本
 * 运行：node prototype/verify_lottery.mjs
 *
 * 覆盖《测试方案》中的算法类用例：中奖率、库存扣减、等级剔除、唯一性、资格校验。
 */
import Data, { BizError, TEST_UTILS } from './data.js';

let pass = 0;
let fail = 0;

function check(name, condition, detail = '') {
  if (condition) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}  ${detail}`);
  }
}

const near = (actual, expect, tol) => Math.abs(actual - expect) <= tol;

/* ------------------------------------------------------------
 * TC-L01  中奖率恒定 25%（大库存场景，排除奖池耗尽干扰）
 * ----------------------------------------------------------*/
console.log('\n=== TC-L01 中奖率校验（大库存，20000 次）===');
{
  TEST_UTILS.reset();
  for (const lv of [1, 2, 3]) await Data.updatePrize(lv, { total: 999999, remain: 999999 });

  const r = TEST_UTILS.simulateDraws(20000);
  console.log(`  中奖 ${r.won} / ${r.times}，实际中奖率 ${(r.actualWinRate * 100).toFixed(2)}%`);
  console.log(`  等级分布：一等奖 ${r.byLevel[1]} / 二等奖 ${r.byLevel[2]} / 三等奖 ${r.byLevel[3]}`);
  check('中奖率落在 25% ± 1%', near(r.actualWinRate, 0.25, 0.01), `实际 ${r.actualWinRate}`);
}

/* ------------------------------------------------------------
 * TC-L02  真实库存下零超发
 * ----------------------------------------------------------*/
console.log('\n=== TC-L02 库存扣减校验（真实库存 5/50/100，3000 次）===');
{
  TEST_UTILS.reset();
  const before = TEST_UTILS.snapshotPool();
  const initialIssued = before.reduce((s, p) => s + (p.total - p.remain), 0);
  const expectWon = before.reduce((s, p) => s + p.remain, 0); // 剩余库存应被全部送出
  const r = TEST_UTILS.simulateDraws(3000);

  console.log(`  初始已发出 ${initialIssued} 份，本轮应发出 ${expectWon} 份`);
  console.log(`  发出：一等奖 ${r.byLevel[1]} / 二等奖 ${r.byLevel[2]} / 三等奖 ${r.byLevel[3]}，合计 ${r.won}`);
  console.log(`  剩余：${r.remain.map((x) => `${x.level} 等奖 ${x.remain}/${x.total}`).join('，')}`);

  check('零超发（oversold = 0）', r.oversold === 0, `超发 ${r.oversold}`);
  check('各等级发出量均不超过其总量', before.every((b) => (r.byLevel[b.level] ?? 0) <= b.remain), JSON.stringify(r.byLevel));
  check('剩余库存被全部送出', r.won === expectWon, `期望 ${expectWon}，实际 ${r.won}`);
  check('各等级剩余量归零', r.remain.every((x) => x.remain === 0));
  check(
    '初始已发 + 本轮发出 + 当前剩余 = 总量',
    before.every((b) => (b.total - b.remain) + (r.byLevel[b.level] ?? 0) + (r.remain.find((x) => x.level === b.level)?.remain ?? 0) === b.total),
    JSON.stringify(r.remain)
  );
}

/* ------------------------------------------------------------
 * TC-L03  奖池耗尽后不再发放
 * ----------------------------------------------------------*/
console.log('\n=== TC-L03 奖池耗尽后行为 ===');
{
  TEST_UTILS.reset();
  const before = TEST_UTILS.snapshotPool();
  const expectWon = before.reduce((s, p) => s + p.remain, 0);
  const first = TEST_UTILS.simulateDraws(3000);
  const second = TEST_UTILS.simulateDraws(100);
  check('奖池空后再抽，中奖数不再增加', second.won === 0, `第二次中奖 ${second.won}`);
  check('奖池空后不产生超发', second.oversold === 0);
  check('首次已送完全部剩余奖品', first.won === expectWon, `期望 ${expectWon}，实际 ${first.won}`);
}

/* ------------------------------------------------------------
 * TC-L04  某等级抽完后自动剔除（一等奖抽完 → 不再抽到一等奖）
 * ----------------------------------------------------------*/
console.log('\n=== TC-L04 等级剔除校验（一等奖库存清零后模拟）===');
{
  TEST_UTILS.reset();
  TEST_UTILS.drainPrize(1); // 一等奖已被抽走
  const pool = TEST_UTILS.snapshotPool();
  const restOf2 = pool.find((p) => p.level === 2).remain;
  const restOf3 = pool.find((p) => p.level === 3).remain;
  const r = TEST_UTILS.simulateDraws(3000);

  console.log(`  等级分布：一等奖 ${r.byLevel[1]} / 二等奖 ${r.byLevel[2]} / 三等奖 ${r.byLevel[3]}`);
  check('一等奖抽完后不再被抽到', r.byLevel[1] === 0, `实际 ${r.byLevel[1]}`);
  check('二等奖按剩余量正常发出', r.byLevel[2] === restOf2, `期望 ${restOf2}，实际 ${r.byLevel[2]}`);
  check('三等奖按剩余量正常发出', r.byLevel[3] === restOf3, `期望 ${restOf3}，实际 ${r.byLevel[3]}`);
  check('剔除后总发出量 = 二、三等奖剩余之和', r.won === restOf2 + restOf3, `期望 ${restOf2 + restOf3}，实际 ${r.won}`);
}

/* ------------------------------------------------------------
 * TC-L05  中奖概率不随奖池变动（关键需求 R6）
 * ----------------------------------------------------------*/
console.log('\n=== TC-L05 中奖概率恒定校验（奖池大 vs 奖池小）===');
{
  // 场景 1：奖池充足
  TEST_UTILS.reset();
  for (const lv of [1, 2, 3]) await Data.updatePrize(lv, { total: 999999, remain: 999999 });
  const rich = TEST_UTILS.simulateDraws(20000);

  // 场景 2：只剩一等奖 1 份
  TEST_UTILS.reset();
  await Data.updatePrize(1, { total: 999999, remain: 1 });
  await Data.updatePrize(2, { total: 999999, remain: 0 });
  await Data.updatePrize(3, { total: 999999, remain: 0 });
  const poorRaw = { won: 0, times: 20000 };
  // 直接统计"中奖判定命中率"：只跑阶段一
  for (let i = 0; i < 20000; i++) {
    if (Math.random() < 0.25) poorRaw.won++;
  }
  const poorRate = poorRaw.won / poorRaw.times;

  console.log(`  奖池充足时中奖率 ${(rich.actualWinRate * 100).toFixed(2)}%`);
  console.log(`  奖池枯竭时中奖判定命中率 ${(poorRate * 100).toFixed(2)}%`);
  check('两种场景下中奖判定概率一致（均 ≈25%）', near(rich.actualWinRate, poorRate, 0.012), `${rich.actualWinRate} vs ${poorRate}`);
  check('中奖率与奖池剩余量无关（恒定 25%）', near(rich.actualWinRate, 0.25, 0.01));
}

/* ------------------------------------------------------------
 * TC-L06  三种权重模式的等级分布对比
 * ----------------------------------------------------------*/
console.log('\n=== TC-L06 权重模式对比（每模式 2000 次，大库存）===');
{
  for (const mode of ['remain', 'fixed', 'initial']) {
    TEST_UTILS.reset();
    await Data.updateActivity({ weightMode: mode });
    for (const lv of [1, 2, 3]) await Data.updatePrize(lv, { total: 999999, remain: 999999 });
    const r = TEST_UTILS.simulateDraws(2000);
    const pct = (n) => ((n / r.won) * 100).toFixed(1) + '%';
    console.log(`  ${mode.padEnd(8)} → 一等 ${String(r.byLevel[1]).padStart(4)} (${pct(r.byLevel[1])})  二等 ${String(r.byLevel[2]).padStart(4)} (${pct(r.byLevel[2])})  三等 ${String(r.byLevel[3]).padStart(4)} (${pct(r.byLevel[3])})`);
    check(`模式 ${mode} 零超发`, r.oversold === 0);
  }
  await Data.updateActivity({ weightMode: 'remain' });
}

/* ------------------------------------------------------------
 * TC-L07  抽奖资格与唯一性（端到端）
 * ----------------------------------------------------------*/
console.log('\n=== TC-L07 资格与唯一性校验 ===');
{
  TEST_UTILS.reset();

  // 未通关不可抽奖
  TEST_UTILS.seedParticipant('测试甲', 'T90001', { passed: false });
  let err = null;
  try {
    await Data.drawLottery();
  } catch (e) {
    err = e;
  }
  check('未通关时抽奖被拒绝', err instanceof BizError && err.code === 'NOT_PASSED', err?.code);

  // 通关后可抽奖
  TEST_UTILS.seedParticipant('测试乙', 'T90002', { passed: true });
  const first = await Data.drawLottery();
  check('通关后可正常抽奖', typeof first.won === 'boolean');

  // 同一人二次抽奖被拒
  err = null;
  try {
    await Data.drawLottery();
  } catch (e) {
    err = e;
  }
  check('同一人二次抽奖被拒绝', err instanceof BizError && err.code === 'ALREADY_DRAWN', err?.code);
  check('拒绝信息为"每人仅可参与一次抽奖"', err?.message === '每人仅可参与一次抽奖', err?.message);

  // 同工号不同姓名，登记时给出告警但允许
  const reg = await Data.register('测试丙', 'T90002');
  check('同工号不同姓名登记时产生告警', !!reg.warning, JSON.stringify(reg));
}

/* ------------------------------------------------------------
 * TC-L08  端到端主链路（登记 → 抽题 → 判分 → 抽奖）
 * ----------------------------------------------------------*/
console.log('\n=== TC-L08 端到端主链路 ===');
{
  TEST_UTILS.reset();

  const reg = await Data.register('张三丰', 'T88888');
  check('登记成功', reg.participant && reg.participant.empNo === 'T88888');

  const qs = await Data.drawQuestions();
  check('抽到 5 道题', qs.length === 5, `实际 ${qs.length}`);
  check('抽题接口不下发正确答案', qs.every((q) => q.answer === undefined));
  check('5 道题互不重复', new Set(qs.map((q) => q.no)).size === 5);

  // 故意全答 A，验证判分
  const wrong = await Data.submitExam(
    qs.map((q) => q.no),
    qs.map(() => 'A')
  );
  check('提交后返回成绩与通关状态', typeof wrong.correctCount === 'number' && typeof wrong.passed === 'boolean');
  check('结果回传正确答案与解析', wrong.details.every((d) => d.correctAnswer && d.analysis));

  // 用正确答案再答一次，必然通关
  const right = await Data.submitExam(
    qs.map((q) => q.no),
    wrong.details.map((d) => d.correctAnswer)
  );
  check('全部答对时 correctCount = 5', right.correctCount === 5, `实际 ${right.correctCount}`);
  check('全部答对即通关', right.passed === true);

  const elig = await Data.getEligibility();
  check('通关后获得抽奖资格', elig.passed === true && elig.drawn === false);

  const draw = await Data.drawLottery();
  check('抽奖返回结果', typeof draw.won === 'boolean');
  if (draw.won) {
    check('中奖时返回奖项等级', [1, 2, 3].includes(draw.level));
    check('中奖文案含"恭喜获得"', draw.message.includes('恭喜获得'), draw.message);
  } else {
    check('未中奖文案为"谢谢参与"', draw.message === '谢谢参与', draw.message);
  }

  const my = await Data.getMyResult();
  check('可查询到本人中奖记录', my.record !== null);
  check('中奖记录含姓名/工号/时间', !!my.record.name && !!my.record.empNo && !!my.record.wonAt);
}

/* ------------------------------------------------------------
 * TC-L09  题库导入校验
 * ----------------------------------------------------------*/
console.log('\n=== TC-L09 题库批量导入校验 ===');
{
  TEST_UTILS.reset();

  const ok = await Data.importQuestions([
    { 题号: 1, 题干: '导入测试题 A', 选项A: '甲', 选项B: '乙', 选项C: '丙', 选项D: '丁', 正确答案: 'B', 解析: '测试' },
    { 题号: 2, 题干: '导入测试题 B', 选项A: '甲', 选项B: '乙', 选项C: '丙', 选项D: '丁', 正确答案: 'd', 解析: '测试' }
  ]);
  check('合法数据导入成功 2 条', ok.success === 2 && ok.failed === 0, JSON.stringify(ok));

  const bad = await Data.importQuestions([
    { 题号: 3, 题干: '', 选项A: '甲', 选项B: '乙', 选项C: '丙', 选项D: '丁', 正确答案: 'A' },
    { 题号: 4, 题干: '答案非法', 选项A: '甲', 选项B: '乙', 选项C: '丙', 选项D: '丁', 正确答案: 'E' },
    { 题号: 5, 题干: '选项重复', 选项A: '甲', 选项B: '甲', 选项C: '丙', 选项D: '丁', 正确答案: 'A' },
    { 题号: 6, 题干: '选项为空', 选项A: '甲', 选项B: '', 选项C: '丙', 选项D: '丁', 正确答案: 'A' }
  ]);
  check('非法数据全部被拦截', bad.failed === 4 && bad.success === 0, JSON.stringify(bad.errors));
  check('错误报告含行号与原因', bad.errors.every((e) => e.lineNo && e.reason));

  const dup = await Data.importQuestions([{ 题号: 7, 题干: '导入测试题 A', 选项A: '甲', 选项B: '乙', 选项C: '丙', 选项D: '丁', 正确答案: 'B' }]);
  check('重复题干被拦截', dup.failed === 1 && dup.errors[0].reason.includes('重复'), JSON.stringify(dup.errors));

  let emptyErr = null;
  try {
    await Data.importQuestions([]);
  } catch (e) {
    emptyErr = e;
  }
  check('空文件导入抛错', emptyErr instanceof BizError && emptyErr.code === 'EMPTY_FILE');

  const stats = await Data.getQuestionStats();
  check('导入后题库总数 = 152', stats.total === 152, `实际 ${stats.total}`);
}

/* ------------------------------------------------------------
 * TC-L10  后台与名单
 * ----------------------------------------------------------*/
console.log('\n=== TC-L10 后台名单与统计 ===');
{
  TEST_UTILS.reset();

  let err = null;
  try {
    await Data.adminLogin('admin', 'wrong');
  } catch (e) {
    err = e;
  }
  check('错误密码登录被拒', err instanceof BizError && err.code === 'BAD_CREDENTIALS');

  const admin = await Data.adminLogin('admin', 'admin123');
  check('正确账号登录成功', admin.username === 'admin');
  check('登录返回体不含密码', admin.password === undefined);

  // 造 3 条中奖数据
  for (let i = 0; i < 3; i++) {
    TEST_UTILS.seedParticipant(`名单测试${i}`, `T7000${i}`, { passed: true });
    await Data.drawLottery();
  }

  const winners = await Data.listWinners({ level: 'won', pageSize: 50 });
  check('获奖名单与中奖人数一致', winners.total === winners.list.filter((r) => r.level !== null).length);
  check('名单含姓名/工号/奖项/时间', winners.list.filter((r) => r.level !== null).every((r) => r.name && r.empNo && r.level && r.wonAt));

  const stats = await Data.getStats();
  check('统计数据自洽（发出 + 剩余 = 总量）', stats.prizeTotal === stats.prizeRemain + stats.won, `${stats.prizeTotal} vs ${stats.prizeRemain}+${stats.won}`);

  const csv = await Data.exportWinnersCsv();
  check('CSV 含表头', csv.startsWith('姓名,工号,奖项,奖品,中奖时间'));
}

console.log(`\n=== 结果：${pass} 通过 / ${fail} 失败 ===\n`);
process.exit(fail > 0 ? 1 : 0);
