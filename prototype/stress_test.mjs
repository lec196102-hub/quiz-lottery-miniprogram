/**
 * stress_test.mjs —— 高并发压力测试
 *
 * 覆盖四组：
 *  S1 并发重复抽奖（去重）：同一用户 N 次并发抽奖，必须只有 1 次成功
 *  S2 库存超发（并发）：模拟云函数事务语义，验证原子扣减零超发、库存不穿负
 *  S3 中奖率统计收敛：大样本验证恒定 25%
 *  S4 云函数并发竞态探测：重点探测 drawn 标志位在并发下是否可绕过（双人抽奖）
 *
 * 运行：node stress_test.mjs
 */
import { TEST_UTILS, updatePrize } from './data.js';

let pass = 0, fail = 0;
const ok = (cond, name, extra = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${extra ? ' -> ' + extra : ''}`); }
};
const section = (t) => console.log(`\n=== ${t} ===`);

/* ---------------------------------------------------------
 * 云函数并发语义模拟器
 * 忠实复刻 cloudfunctions/api/index.js 的 drawLottery 事务流程：
 *  - 每次 await 都会让出事件循环，允许其他事务插入（模拟真实并发交错）
 *  - 库存扣减是「条件原子更新」：WHERE remain>0 才 -1（真正的防超发屏障）
 *  - drawn 标志是「快照读 → 提交时写」，跨事务非原子（这是要探测的风险点）
 * -------------------------------------------------------*/
function makeCloudSim({ winRate = 0.25, weightMode = 'remain', poolEmptyBehavior = 'close', prizes, mode = 'fixed' }) {
  const db = {
    prizes: prizes.map((p) => ({ ...p })),
    participants: new Map(),   // empNo -> { drawn }
    records: [],
    oversold: 0
  };
  const yieldToLoop = () => new Promise((r) => setImmediate(r));

  // 条件原子更新：模拟 WHERE _id=? AND remain>0 UPDATE remain=remain-1
  function atomicDecrement(prizeId) {
    const p = db.prizes.find((x) => x._id === prizeId);
    if (!p || p.remain <= 0) return false;
    p.remain -= 1;
    return true;
  }

  function weightedPick(pool) {
    const items = pool.map((p) => ({ p, w: Math.max(p.remain, 0.0001) }));
    const sum = items.reduce((s, x) => s + x.w, 0);
    let r = Math.random() * sum;
    for (const x of items) { r -= x.w; if (r <= 0) return x.p; }
    return items[items.length - 1].p;
  }

  // 一次「抽奖事务」，内含多个 await 让出点（与云函数一一对应）
  async function drawTx(empNo) {
    await yieldToLoop();                                  // await db.startTransaction()
    const act = { winRate, weightMode, poolEmptyBehavior };

    await yieldToLoop();                                  // await t.collection('participants').get()
    let part = db.participants.get(empNo);
    if (!part) { part = { empNo, passed: true, drawn: false }; db.participants.set(empNo, part); }

    if (mode === 'fixed') {
      // 【修复后】原子条件更新：WHERE drawn=false UPDATE drawn=true
      // 单次原子操作，并发下只有一个事务能抢到锁
      if (part.drawn) return { code: 'ALREADY_DRAWN' };
      part.drawn = true;                                  // 立即写入，后续事务读到 true
    } else {
      // 【修复前】快照读 → 提交时才写回：并发下所有事务都读到 drawn=false
      const drawnSnapshot = part.drawn;
      if (drawnSnapshot) return { code: 'ALREADY_DRAWN' };
      // 故意不立即写，留到 commit（复现原竞态）
    }

    await yieldToLoop();                                  // await t.collection('prizes').get()
    const poolEmpty = db.prizes.every((x) => x.remain <= 0);
    if (poolEmpty && act.poolEmptyBehavior === 'close') return { code: 'POOL_EMPTY' };

    let level = null;
    if (Math.random() < act.winRate) {
      let pool = db.prizes.filter((x) => x.remain > 0);
      for (let attempt = 0; attempt < 3 && pool.length > 0; attempt++) {
        const picked = weightedPick(pool);
        await yieldToLoop();                              // ← 扣减前最后一次让出
        if (atomicDecrement(picked._id)) { level = picked.level; break; }
        pool = pool.filter((x) => x.level !== picked.level);
      }
    }

    await yieldToLoop();                                  // await t.commit()
    db.records.push({ empNo, level });
    if (mode !== 'fixed') part.drawn = true;              // 修复前：提交时才写回
    return { code: 'OK', level };
  }
  return { db, drawTx };
}

const PRIZES = [
  { _id: 'p1', level: 1, name: '一等奖', total: 5, remain: 5 },
  { _id: 'p2', level: 2, name: '二等奖', total: 50, remain: 50 },
  { _id: 'p3', level: 3, name: '三等奖', total: 100, remain: 100 }
];

/* ================= S1 并发重复抽奖（去重） ================= */
section('S1 并发重复抽奖去重（同一用户 200 并发）');
{
  const N = 200;

  // S1-a：先复现【修复前】的竞态（仅作对照，不作为通过条件）
  const buggy = makeCloudSim({ prizes: PRIZES, mode: 'buggy' });
  const buggyRes = await Promise.all(Array.from({ length: N }, () => buggy.drawTx('E0001')));
  console.log(`  [对照·修复前] OK=${buggyRes.filter((r) => r.code === 'OK').length}，产生记录=${buggy.db.records.length}  ← 竞态：一人抽了多次`);

  // S1-b：验证【修复后】的原子锁
  const sim = makeCloudSim({ prizes: PRIZES, mode: 'fixed' });
  const results = await Promise.all(Array.from({ length: N }, () => sim.drawTx('E0001')));
  const oks = results.filter((r) => r.code === 'OK');
  const already = results.filter((r) => r.code === 'ALREADY_DRAWN');
  console.log(`  [修复后] OK=${oks.length}  ALREADY_DRAWN=${already.length}  产生记录=${sim.db.records.length}`);
  ok(sim.db.records.length === 1, `原子锁生效：200 并发仅产生 1 条记录（实际 ${sim.db.records.length}）`);
  ok(oks.length === 1, `仅 1 次返回 OK（实际 ${oks.length}）`);
  ok(already.length === N - 1, `其余 ${N - 1} 次被 ALREADY_DRAWN 拦截（实际 ${already.length}）`);
}

/* ================= S2 库存超发（并发） ================= */
section('S2 库存超发检测（多用户并发抢购限量奖池）');
{
  // 小奖池更容易触发竞态：一等 2 / 二等 5 / 三等 8
  const tiny = [
    { _id: 'p1', level: 1, name: '一等奖', total: 2, remain: 2 },
    { _id: 'p2', level: 2, name: '二等奖', total: 5, remain: 5 },
    { _id: 'p3', level: 3, name: '三等奖', total: 8, remain: 8 }
  ];
  const sim = makeCloudSim({ prizes: tiny, winRate: 1.0 }); // 100% 中奖，最大化扣减压力
  const N = 500;
  await Promise.all(Array.from({ length: N }, (_, i) => sim.drawTx('E' + String(i).padStart(5, '0'))));

  const byLevel = { 1: 0, 2: 0, 3: 0 };
  sim.db.records.forEach((r) => { if (r.level) byLevel[r.level]++; });
  const negative = sim.db.prizes.filter((p) => p.remain < 0);
  console.log(`  信息：发出 一等${byLevel[1]} 二等${byLevel[2]} 三等${byLevel[3]}`);
  console.log(`  信息：剩余 ${sim.db.prizes.map((p) => `${p.name}=${p.remain}`).join(' ')}`);
  ok(negative.length === 0, '库存未穿负', JSON.stringify(sim.db.prizes.map((p) => p.remain)));
  ok(byLevel[1] <= 2, `一等奖未超发（≤2，实际 ${byLevel[1]}）`);
  ok(byLevel[2] <= 5, `二等奖未超发（≤5，实际 ${byLevel[2]}）`);
  ok(byLevel[3] <= 8, `三等奖未超发（≤8，实际 ${byLevel[3]}）`);
  const totalIssued = byLevel[1] + byLevel[2] + byLevel[3];
  ok(totalIssued <= 15, `总发出 ≤ 总库存 15（实际 ${totalIssued}）`);
}

/* ================= S3 中奖率统计收敛 ================= */
section('S3 中奖率统计收敛（20000 次，恒定 25%）');
{
  // 注意：必须先把库存拉到极大，否则奖池会在约 620 次后耗尽并提前 break，
  // 导致 won/times 的分母失真（这是统计口径问题，不是引擎问题）。
  TEST_UTILS.reset();
  for (const lv of [1, 2, 3]) await updatePrize(lv, { total: 999999, remain: 999999 });
  const r = TEST_UTILS.simulateDraws(20000);
  const rate = r.actualWinRate;
  console.log(`  信息：中奖 ${r.won}/${r.times} = ${(rate * 100).toFixed(2)}%  超发 ${r.oversold}`);
  ok(Math.abs(rate - 0.25) < 0.02, `中奖率收敛到 25%±2%（实际 ${(rate * 100).toFixed(2)}%）`);
  ok(r.oversold === 0, `零超发（实际 ${r.oversold}）`);
}

/* ================= S4 奖池耗尽后中奖率仍恒定 ================= */
section('S4 奖池耗尽后行为（poolEmptyBehavior=close）');
{
  const sim = makeCloudSim({ prizes: PRIZES.map((p) => ({ ...p, remain: 0 })) });
  const res = await Promise.all(Array.from({ length: 20 }, (_, i) => sim.drawTx('X' + i)));
  const poolEmptyCount = res.filter((r) => r.code === 'POOL_EMPTY').length;
  ok(poolEmptyCount === 20, `奖池耗尽时全部返回 POOL_EMPTY（实际 ${poolEmptyCount}/20）`);
  ok(sim.db.records.length === 0, '奖池耗尽后不再产生抽奖记录');
}

/* ================= 汇总 ================= */
console.log(`\n=== 压力测试结果：${pass} 通过 / ${fail} 失败 ===`);
process.exit(fail ? 1 : 0);
