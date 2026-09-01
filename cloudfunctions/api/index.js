// cloudfunctions/api/index.js
// 统一后端：所有小程序/后台请求经此云函数分发。
// 抽奖引擎在此实现（服务端权威）：恒定 winRate 判定 → 剩余库存加权选级 → 事务原子扣减 → 防重复。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const ACTIVITY_ID = 'ACT_DEFAULT';
const PASS_SCORE = 3; // 答对 3 题通关

class BizError extends Error {
  constructor(message, code = 'BIZ_ERROR') {
    super(message);
    this.code = code;
  }
}

// ---------- 工具 ----------
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function weightedPick(pool, mode) {
  let weights;
  if (mode === 'fixed') weights = { 1: 1, 2: 8, 3: 16 };
  else if (mode === 'initial') weights = { 1: 5, 2: 50, 3: 100 };
  else weights = {}; // 'remain'：按剩余库存
  const items = pool.map((p) => ({ p, w: weights[p.level] != null ? weights[p.level] : Math.max(p.remain, 0.0001) }));
  const sum = items.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * sum;
  for (const x of items) {
    r -= x.w;
    if (r <= 0) return x.p;
  }
  return items[items.length - 1].p;
}

// ---------- 各 action 实现 ----------
const handlers = {
  // 活动配置
  async getActivity() {
    const res = await db.collection('activity').doc(ACTIVITY_ID).get();
    return res.data;
  },

  // 统计
  async getStats() {
    const [p, ex, dr, recs, prizes] = await Promise.all([
      db.collection('participants').where({ activityId: ACTIVITY_ID }).count(),
      db.collection('participants').where({ activityId: ACTIVITY_ID, passed: true }).count(),
      db.collection('participants').where({ activityId: ACTIVITY_ID, drawn: true }).count(),
      db.collection('lotteryRecords').where({ activityId: ACTIVITY_ID }).get(),
      db.collection('prizes').where({ activityId: ACTIVITY_ID }).get()
    ]);
    const list = recs.data;
    const won = list.filter((r) => r.level != null).length;
    const prizeTotal = prizes.data.reduce((s, p) => s + p.total, 0);
    const prizeRemain = prizes.data.reduce((s, p) => s + p.remain, 0);
    const prizeList = prizes.data
      .map((p) => ({ level: p.level, name: p.name, desc: p.desc, total: p.total, remain: p.remain }))
      .sort((a, b) => a.level - b.level);
    return {
      participants: p.total,
      examCount: p.total, // 答题人次（每次登记计一次，演示简化为参与人数）
      passed: ex.total,
      drawn: dr.total,
      won,
      prizeTotal,
      prizeRemain,
      prizes: prizeList,
      winRateActual: dr.total ? won / dr.total : 0
    };
  },

  // 登记身份
  async register({ name, empNo }, openid) {
    name = (name || '').trim();
    empNo = (empNo || '').trim();
    if (name.length < 2 || name.length > 10) throw new BizError('姓名长度应为 2–10 个字符');
    if (!/^[A-Za-z0-9]{4,12}$/.test(empNo)) throw new BizError('工号应为 4–12 位字母或数字');

    const exist = await db.collection('participants')
      .where({ activityId: ACTIVITY_ID, empNo }).get();
    let warning = '';
    if (exist.data.length && exist.data[0].name !== name) {
      warning = '该工号已以其他姓名登记过，本次将沿用既有抽奖资格';
    }

    const old = await db.collection('participants')
      .where({ openid, activityId: ACTIVITY_ID }).get();
    let participant;
    if (old.data.length) {
      participant = old.data[0];
      await db.collection('participants').doc(participant._id).update({
        data: { name, empNo, registered: true }
      });
      participant = { ...participant, name, empNo, registered: true };
    } else {
      const add = await db.collection('participants').add({
        data: {
          activityId: ACTIVITY_ID, openid, name, empNo,
          registered: true, passed: false, drawn: false,
          createdAt: db.serverDate()
        }
      });
      participant = { _id: add._id, activityId: ACTIVITY_ID, openid, name, empNo, registered: true, passed: false, drawn: false };
    }
    return { participant, warning, reused: !!old.data.length };
  },

  // 抽题（不返回正确答案，判分在服务端）
  async drawQuestions(_, openid) {
    const res = await db.collection('questions').where({ activityId: ACTIVITY_ID, enabled: true }).get();
    const picked = shuffle(res.data).slice(0, 5);
    return picked.map((q) => ({
      no: q.no, category: q.category, title: q.title,
      options: q.options, answer: undefined
    }));
  },

  // 判分（服务端对照正确答案）
  async submitExam({ questionNos, answers }, openid) {
    const p = await db.collection('participants').where({ openid, activityId: ACTIVITY_ID }).get();
    if (!p.data.length) throw new BizError('请先登记身份信息', 'NOT_REGISTERED');
    const participant = p.data[0];

    const qs = await db.collection('questions')
      .where({ activityId: ACTIVITY_ID, no: _.in(questionNos) }).get();
    const byNo = {};
    qs.data.forEach((q) => (byNo[q.no] = q));

    let correctCount = 0;
    const details = questionNos.map((no, i) => {
      const q = byNo[no];
      const your = answers[i];
      const correct = your === q.answer;
      if (correct) correctCount++;
      return {
        no, title: q.title, options: q.options,
        yourAnswer: your, correctAnswer: q.answer, correct, analysis: q.analysis
      };
    });
    const passed = correctCount >= PASS_SCORE;
    await db.collection('participants').doc(participant._id).update({
      data: { passed, correctCount, passedAt: passed ? db.serverDate() : null }
    });
    return { total: questionNos.length, correctCount, passScore: PASS_SCORE, passed, details };
  },

  // 抽奖资格
  async getEligibility(_, openid) {
    const p = await db.collection('participants').where({ openid, activityId: ACTIVITY_ID }).get();
    if (!p.data.length) return { registered: false, passed: false, drawn: false };
    const x = p.data[0];
    return { registered: true, passed: x.passed, drawn: x.drawn, passedAt: x.passedAt };
  },

  // 抽奖引擎（事务 + 原子扣减）
  async drawLottery(_, openid) {
    const t = await db.startTransaction();
    try {
      const actRes = await t.collection('activity').doc(ACTIVITY_ID).get();
      const act = actRes.data;

      const pRes = await t.collection('participants').where({ openid, activityId: ACTIVITY_ID }).get();
      if (!pRes.data.length) throw new BizError('请先登记身份信息', 'NOT_REGISTERED');
      const participant = pRes.data[0];
      if (!participant.passed) throw new BizError('答题未通关，暂无抽奖资格', 'NOT_PASSED');
      if (participant.drawn) throw new BizError('每人仅可参与一次抽奖', 'ALREADY_DRAWN');

      const prizeRes = await t.collection('prizes').where({ activityId: ACTIVITY_ID }).get();
      const prizes = prizeRes.data;
      const poolEmpty = prizes.every((x) => x.remain <= 0);
      if (poolEmpty && act.poolEmptyBehavior === 'close') {
        throw new BizError('奖品已全部送出，感谢参与！', 'POOL_EMPTY');
      }

      let level = null, prizeName = null, message = '谢谢参与';

      // 阶段一：中奖判定，恒定 winRate
      if (Math.random() < act.winRate) {
        // 阶段二 + 三：加权选级 + 原子扣减，失败剔除该等级后重试（最多 3 次）
        let pool = prizes.filter((x) => x.remain > 0);
        for (let attempt = 0; attempt < 3 && pool.length > 0; attempt++) {
          const picked = weightedPick(pool, act.weightMode);
          const upd = await t.collection('prizes')
            .where({ _id: picked._id, remain: _.gt(0) })
            .update({ data: { remain: _.inc(-1) } });
          if (upd.stats.updated === 1) {
            level = picked.level;
            prizeName = `${picked.name} · ${picked.desc}`;
            message = `恭喜获得${picked.name}`;
            break;
          }
          pool = pool.filter((x) => x.level !== picked.level); // 扣减失败，剔除该等级
        }
        if (level === null) message = '谢谢参与'; // 并发耗尽，降级
      }

      const wonAt = db.serverDate();
      await t.collection('lotteryRecords').add({
        data: {
          activityId: ACTIVITY_ID, participantId: participant._id,
          name: participant.name, empNo: participant.empNo,
          level, prizeName, wonAt, remark: level ? '' : '谢谢参与'
        }
      });
      await t.collection('participants').doc(participant._id).update({
        data: { drawn: true, drawnAt: wonAt }
      });

      await t.commit();
      const remainNow = prizes.map((x) => ({ level: x.level, remain: x.remain - (level === x.level ? 1 : 0) }));
      return {
        won: level !== null, level, prizeName, message,
        wonAt: new Date().toISOString(),
        poolEmpty: remainNow.every((x) => x.remain <= 0)
      };
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  // 我的结果
  async getMyResult(_, openid) {
    const p = await db.collection('participants').where({ openid, activityId: ACTIVITY_ID }).get();
    if (!p.data.length) return null;
    const x = p.data[0];
    const rec = await db.collection('lotteryRecords').where({ activityId: ACTIVITY_ID, empNo: x.empNo }).get();
    return {
      participant: { name: x.name, empNo: x.empNo, drawn: x.drawn, passed: x.passed },
      record: rec.data.length ? rec.data[0] : null
    };
  },

  // 题库列表（后台）
  async listQuestions({ keyword = '', page = 1, pageSize = 10 }) {
    const where = { activityId: ACTIVITY_ID };
    if (keyword) where._or = [
      { title: db.RegExp({ regexp: keyword, options: 'i' }) },
      { no: isNaN(Number(keyword)) ? -1 : Number(keyword) }
    ];
    const countRes = await db.collection('questions').where(where).count();
    const res = await db.collection('questions').where(where)
      .orderBy('no', 'asc').skip((page - 1) * pageSize).limit(pageSize).get();
    const statsRes = await db.collection('questions').where({ activityId: ACTIVITY_ID }).get();
    const all = statsRes.data;
    const catMap = {};
    all.forEach((q) => (catMap[q.category] = (catMap[q.category] || 0) + 1));
    return {
      list: res.data, total: countRes.total, page, pageSize,
      enabled: all.filter((q) => q.enabled).length,
      disabled: all.filter((q) => !q.enabled).length,
      categories: Object.keys(catMap).map((c) => ({ category: c, count: catMap[c] }))
    };
  },

  async toggleQuestion({ no, enabled }) {
    await db.collection('questions').where({ activityId: ACTIVITY_ID, no }).update({ data: { enabled } });
    return { ok: true };
  },

  async importQuestions({ rows, mode = 'append' }) {
    const errors = [];
    let success = 0, failed = 0;
    const valid = ['A', 'B', 'C', 'D'];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const lineNo = i + 1;
      if (!r.no || !r.title || !r.answer) { failed++; errors.push({ lineNo, reason: '缺少题号/题干/答案' }); continue; }
      if (!valid.includes(r.answer)) { failed++; errors.push({ lineNo, reason: `非法答案 ${r.answer}` }); continue; }
      const opts = r.options || {};
      if (valid.some((k) => !opts[k])) { failed++; errors.push({ lineNo, reason: '选项 A–D 不完整' }); continue; }
      const no = Number(r.no);
      const exist = await db.collection('questions').where({ activityId: ACTIVITY_ID, no }).get();
      if (exist.data.length) {
        if (mode === 'skip') { continue; }
        if (mode === 'overwrite') {
          await db.collection('questions').where({ activityId: ACTIVITY_ID, no }).update({
            data: { title: r.title, category: r.category || '未分类', options: opts, answer: r.answer, analysis: r.analysis || '', enabled: true }
          });
          success++; continue;
        }
        // append：跳过重复
        continue;
      }
      await db.collection('questions').add({
        data: { activityId: ACTIVITY_ID, no, category: r.category || '未分类', title: r.title, options: opts, answer: r.answer, analysis: r.analysis || '', enabled: true }
      });
      success++;
    }
    return { success, failed, errors };
  },

  // 奖品配置
  async updateActivity({ winRate, weightMode, poolEmptyBehavior }) {
    const data = {};
    if (winRate != null) data.winRate = winRate;
    if (weightMode) data.weightMode = weightMode;
    if (poolEmptyBehavior) data.poolEmptyBehavior = poolEmptyBehavior;
    await db.collection('activity').doc(ACTIVITY_ID).update({ data });
    return { ok: true };
  },

  async updatePrize({ level, total, remain }) {
    const data = {};
    if (total != null) data.total = total;
    if (remain != null) data.remain = remain;
    await db.collection('prizes').where({ activityId: ACTIVITY_ID, level }).update({ data });
    return { ok: true };
  },

  // 获奖名单（后台）
  async listWinners({ keyword = '', level = '', page = 1, pageSize = 10 }) {
    const where = { activityId: ACTIVITY_ID };
    if (level === 'won') where.level = _.neq(null);
    else if (level) where.level = Number(level);
    if (keyword) where._or = [
      { name: db.RegExp({ regexp: keyword, options: 'i' }) },
      { empNo: db.RegExp({ regexp: keyword, options: 'i' }) }
    ];
    const countRes = await db.collection('lotteryRecords').where(where).count();
    const res = await db.collection('lotteryRecords').where(where)
      .orderBy('wonAt', 'desc').skip((page - 1) * pageSize).limit(pageSize).get();
    return { list: res.data, total: countRes.total, page, pageSize };
  },

  async exportWinnersCsv() {
    const res = await db.collection('lotteryRecords').where({ activityId: ACTIVITY_ID }).orderBy('wonAt', 'desc').get();
    const header = '姓名,工号,奖项,奖品,中奖时间\n';
    const body = res.data.map((r) =>
      `${r.name},${r.empNo},${r.level ? r.level + '等奖' : '未中奖'},${r.prizeName || ''},${r.wonAt || ''}`
    ).join('\n');
    return '﻿' + header + body;
  },

  // 后台登录（演示级：明文比对 admins 集合）
  async adminLogin({ user, pass }) {
    const res = await db.collection('admins').where({ user, pass }).get();
    if (!res.data.length) throw new BizError('账号或密码错误', 'AUTH_FAIL');
    return { name: res.data[0].name || user };
  }
};

// ---------- 入口 ----------
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, payload = {} } = event;
  const fn = handlers[action];
  if (!fn) return { code: 404, message: `未知 action: ${action}` };
  try {
    const data = await fn(payload, OPENID);
    return { code: 0, data };
  } catch (e) {
    return { code: e.code || 1, message: e.message || '系统错误' };
  }
};
