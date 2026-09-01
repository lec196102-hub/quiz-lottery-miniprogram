// cloudfunctions/initData/index.js
// 数据初始化云函数：把活动配置 / 奖品 / 题库 / 管理员 写入云数据库。
// 幂等：各集合已存在数据则跳过（避免重复 seed）。
// 部署后请在「云开发控制台 → 云函数」右键本函数「上传并运行」（或触发一次调用）。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const { ACTIVITY, QUESTIONS, PRIZES, ADMINS } = require('./seed-data');

const ACTIVITY_ID = 'ACT_DEFAULT';

async function ensureDoc(collection, where, makeData) {
  const res = await db.collection(collection).where(where).get();
  if (res.data && res.data.length) return { created: 0, skipped: res.data.length };
  await db.collection(collection).add({ data: makeData() });
  return { created: 1, skipped: 0 };
}

exports.main = async () => {
  const report = {};

  // 1. 活动配置
  const actRes = await db.collection('activity').where({ _id: ACTIVITY_ID }).get();
  if (!actRes.data.length) {
    await db.collection('activity').add({
      data: {
        _id: ACTIVITY_ID,
        name: ACTIVITY.name,
        description: ACTIVITY.description,
        status: ACTIVITY.status || 'open',
        startAt: ACTIVITY.startAt,
        endAt: ACTIVITY.endAt,
        passScore: ACTIVITY.passScore,
        questionCount: ACTIVITY.questionCount,
        winRate: ACTIVITY.winRate,          // 0.25
        weightMode: ACTIVITY.weightMode,    // 'remain' 按剩余库存加权
        poolEmptyBehavior: ACTIVITY.poolEmptyBehavior // 'close' 奖池耗尽关闭入口
      }
    });
    report.activity = 'created';
  } else {
    report.activity = 'skipped';
  }

  // 2. 奖品（5 / 50 / 100）
  const prizeRes = await db.collection('prizes').where({ activityId: ACTIVITY_ID }).get();
  if (!prizeRes.data.length) {
    await db.collection('prizes').add({
      data: PRIZES.map((p) => ({
        activityId: ACTIVITY_ID,
        level: p.level,
        name: p.name,
        desc: p.desc,
        total: p.total,
        remain: p.total
      }))
    });
    report.prizes = `created ${PRIZES.length}`;
  } else {
    report.prizes = `skipped ${prizeRes.data.length}`;
  }

  // 3. 管理员（字段对齐 adminLogin：user / pass）
  const adminRes = await db.collection('admins').where({}).get();
  if (!adminRes.data.length) {
    await db.collection('admins').add({
      data: ADMINS.map((a) => ({ user: a.username, pass: a.password, name: a.name, role: a.role }))
    });
    report.admins = `created ${ADMINS.length}`;
  } else {
    report.admins = `skipped ${adminRes.data.length}`;
  }

  // 4. 题库（150 道，已存在相同 no 则跳过）
  const qRes = await db.collection('questions').where({ activityId: ACTIVITY_ID }).get();
  const existNos = new Set(qRes.data.map((q) => q.no));
  const toAdd = QUESTIONS.filter((q) => !existNos.has(q.no)).map((q) => ({
    activityId: ACTIVITY_ID,
    no: q.no,
    category: q.category,
    title: q.title,
    options: q.options,
    answer: q.answer,
    analysis: q.analysis || '',
    enabled: q.enabled !== false
  }));
  if (toAdd.length) {
    await db.collection('questions').add({ data: toAdd });
  }
  report.questions = `created ${toAdd.length}, existing ${existNos.size}`;

  return { code: 0, data: report };
};
