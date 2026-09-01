/**
 * data.js —— 数据访问层（模拟后端 API）
 *
 * 职责边界：
 *   1. 从 test_data.js 导入静态数据（本文件不定义任何静态数据）
 *   2. 归一化补全派生字段（_id / activityId / contentHash / createdAt）
 *   3. 向外暴露与后端接口一一对应的引用方法
 *
 * 接入真实后端时：只需把本文件内部的方法体换成 HTTP 请求，
 * 方法名、入参、返回结构均保持不变，上层原型代码无需改动。
 */
import {
  ACTIVITY,
  QUESTIONS,
  PRIZES,
  PARTICIPANTS,
  LOTTERY_RECORDS,
  EXAM_RECORDS,
  ADMINS,
  IMPORT_TEMPLATE
} from './test_data.js';

/* ============================================================
 * 0. 基础工具
 * ==========================================================*/

const ACTIVITY_ID = '2026-safety-quiz';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const now = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

/** 可审计的公平随机：优先使用 crypto，不可用时退回 Math.random */
function secureRandom() {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === 'function') {
    const buf = new Uint32Array(1);
    c.getRandomValues(buf);
    return buf[0] / 4294967296;
  }
  return Math.random();
}

/** 题干归一化哈希，用于导入去重（与后端 content_hash 对齐） */
function contentHash(text) {
  const s = String(text).replace(/\s+/g, '').trim();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return `h${(h >>> 0).toString(36)}`;
}

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

/** 业务异常：携带错误码，供上层按类型渲染不同报错态 */
export class BizError extends Error {
  constructor(message, code = 'BIZ_ERROR', detail = null) {
    super(message);
    this.name = 'BizError';
    this.code = code;
    this.detail = detail;
  }
}

/* ============================================================
 * 1. 运行时状态（静态数据的可变副本，静态数据本身永不被修改）
 * ==========================================================*/

function buildInitialState() {
  // 依据已有的中奖记录反推奖品池剩余量，保证「发出 + 剩余 = 总量」在初始态即成立
  const issued = LOTTERY_RECORDS.reduce((m, r) => {
    if (r.level) m[r.level] = (m[r.level] || 0) + 1;
    return m;
  }, {});

  return {
    activity: { ...ACTIVITY, _id: ACTIVITY_ID },
    questions: QUESTIONS.map((q, i) => ({
      _id: `q_${q.no}`,
      activityId: ACTIVITY_ID,
      contentHash: contentHash(q.title),
      createdAt: now(),
      ...q
    })),
    prizes: PRIZES.map((p) => ({
      _id: `p_${p.level}`,
      activityId: ACTIVITY_ID,
      updatedAt: now(),
      ...p,
      remain: Math.max(0, p.total - (issued[p.level] || 0))
    })),
    participants: PARTICIPANTS.map((p, i) => ({
      _id: `u_${i + 1}`,
      activityId: ACTIVITY_ID,
      createdAt: now(),
      ...p
    })),
    lotteryRecords: LOTTERY_RECORDS.map((r, i) => ({
      _id: `l_${i + 1}`,
      activityId: ACTIVITY_ID,
      ...r
    })),
    examRecords: EXAM_RECORDS.map((r, i) => ({ _id: `e_${i + 1}`, activityId: ACTIVITY_ID, ...r })),
    admins: ADMINS.map((a, i) => ({ _id: `a_${i + 1}`, ...a })),
    session: null, // 当前登录的参与者
    adminSession: null, // 当前登录的管理员
    seq: 1000
  };
}

let state = buildInitialState();
const nextId = (prefix) => `${prefix}_${++state.seq}`;

/* ============================================================
 * 2. 活动与配置
 * ==========================================================*/

export async function getActivity() {
  await delay(60);
  return clone(state.activity);
}

export async function updateActivity(patch) {
  await delay(120);
  Object.assign(state.activity, patch);
  return clone(state.activity);
}

/* ============================================================
 * 3. 题库
 * ==========================================================*/

export async function listQuestions({ keyword = '', category = '', page = 1, pageSize = 10 } = {}) {
  await delay(160);
  let list = state.questions;
  if (keyword) list = list.filter((q) => q.title.includes(keyword) || String(q.no) === keyword);
  if (category) list = list.filter((q) => q.category === category);
  const total = list.length;
  const start = (page - 1) * pageSize;
  return { total, page, pageSize, list: clone(list.slice(start, start + pageSize)) };
}

export async function getQuestionStats() {
  await delay(80);
  const total = state.questions.length;
  const enabled = state.questions.filter((q) => q.enabled).length;
  const categories = [...new Set(state.questions.map((q) => q.category))].map((c) => ({
    category: c,
    count: state.questions.filter((q) => q.category === c).length
  }));
  return { total, enabled, disabled: total - enabled, categories };
}

export async function toggleQuestion(no, enabled) {
  await delay(120);
  const q = state.questions.find((x) => x.no === Number(no));
  if (!q) throw new BizError('题目不存在', 'NOT_FOUND');
  q.enabled = enabled;
  return clone(q);
}

export async function updateQuestion(no, patch) {
  await delay(140);
  const q = state.questions.find((x) => x.no === Number(no));
  if (!q) throw new BizError('题目不存在', 'NOT_FOUND');
  Object.assign(q, patch, { contentHash: contentHash(q.title) });
  return clone(q);
}

export async function deleteQuestion(no) {
  await delay(140);
  const i = state.questions.findIndex((x) => x.no === Number(no));
  if (i < 0) throw new BizError('题目不存在', 'NOT_FOUND');
  const [removed] = state.questions.splice(i, 1);
  return clone(removed);
}

/**
 * 批量导入题库
 * @param {Array} rows  形如 [{题号,题干,选项A,选项B,选项C,选项D,正确答案,解析}]
 * @param {string} mode append | overwrite | skip
 * @returns {{total:number, success:number, failed:number, errors:Array}}
 */
export async function importQuestions(rows, mode = 'append') {
  await delay(900); // 模拟服务端解析 + 校验耗时，用于展示加载态

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new BizError('导入内容为空，请检查文件', 'EMPTY_FILE');
  }

  if (mode === 'overwrite') state.questions = [];

  const existingHash = new Set(state.questions.map((q) => q.contentHash));
  const errors = [];
  let success = 0;
  let maxNo = state.questions.reduce((m, q) => Math.max(m, q.no), 0);

  rows.forEach((row, i) => {
    const lineNo = i + 2; // 表头占第 1 行
    const title = String(row.题干 ?? '').trim();
    const answer = String(row.正确答案 ?? '').trim().toUpperCase();

    if (!title) return errors.push({ lineNo, reason: '题干为空' });
    if (!['A', 'B', 'C', 'D'].includes(answer)) return errors.push({ lineNo, reason: `正确答案非法：${answer || '空'}` });

    const options = {
      A: String(row.选项A ?? '').trim(),
      B: String(row.选项B ?? '').trim(),
      C: String(row.选项C ?? '').trim(),
      D: String(row.选项D ?? '').trim()
    };
    const emptyOpt = Object.entries(options).find(([, v]) => !v);
    if (emptyOpt) return errors.push({ lineNo, reason: `选项 ${emptyOpt[0]} 为空` });
    if (new Set(Object.values(options)).size !== 4) return errors.push({ lineNo, reason: '存在重复选项' });

    const hash = contentHash(title);
    if (existingHash.has(hash)) {
      if (mode === 'skip') return errors.push({ lineNo, reason: '题干重复，已跳过' });
      return errors.push({ lineNo, reason: `题干与第 ${state.questions.find((q) => q.contentHash === hash).no} 题重复` });
    }

    existingHash.add(hash);
    maxNo += 1;
    state.questions.push({
      _id: `q_${maxNo}`,
      activityId: ACTIVITY_ID,
      no: maxNo,
      category: String(row.分类 ?? '未分类').trim() || '未分类',
      title,
      options,
      answer,
      analysis: String(row.解析 ?? '').trim(),
      enabled: true,
      contentHash: hash,
      createdAt: now()
    });
    success += 1;
  });

  return { total: rows.length, success, failed: errors.length, errors };
}

export async function getImportTemplate() {
  await delay(60);
  return clone(IMPORT_TEMPLATE);
}

/* ============================================================
 * 4. 身份登记
 * ==========================================================*/

export async function register(name, empNo) {
  await delay(420);

  const n = String(name ?? '').trim();
  const e = String(empNo ?? '').trim();

  if (n.length < 2 || n.length > 10) throw new BizError('姓名长度应为 2–10 个字符', 'INVALID_NAME');
  if (!/^[A-Za-z0-9]{4,12}$/.test(e)) throw new BizError('工号应为 4–12 位字母或数字', 'INVALID_EMPNO');

  const exist = state.participants.find((p) => p.empNo === e && p.name === n);
  if (exist) {
    state.session = exist._id;
    return { reused: true, participant: clone(exist) };
  }

  const sameEmpNo = state.participants.find((p) => p.empNo === e && p.name !== n);
  const participant = {
    _id: nextId('u'),
    activityId: ACTIVITY_ID,
    name: n,
    empNo: e,
    openid: `o-${e.toLowerCase()}`,
    passed: false,
    passedAt: null,
    drawn: false,
    drawnAt: null,
    createdAt: now()
  };
  state.participants.push(participant);
  state.session = participant._id;

  return {
    reused: false,
    warning: sameEmpNo ? `该工号已由「${sameEmpNo.name}」登记，如非本人请联系活动管理员` : '',
    participant: clone(participant)
  };
}

export async function currentParticipant() {
  if (!state.session) return null;
  const p = state.participants.find((x) => x._id === state.session);
  return p ? clone(p) : null;
}

export function logoutParticipant() {
  state.session = null;
}

/* ============================================================
 * 5. 答题引擎
 * ==========================================================*/

/** 随机抽题：不下发正确答案 */
export async function drawQuestions() {
  await delay(520);

  const cfg = state.activity;
  if (cfg.status !== 'open') throw new BizError('活动未开始或已结束', 'ACTIVITY_CLOSED');

  const pool = state.questions.filter((q) => q.enabled);
  if (pool.length < cfg.questionCount) {
    throw new BizError(`可用题目不足，当前仅 ${pool.length} 题`, 'POOL_SHORTAGE');
  }

  // Fisher-Yates 部分洗牌，取前 N 题
  const arr = [...pool];
  for (let i = 0; i < cfg.questionCount; i++) {
    const j = i + Math.floor(secureRandom() * (arr.length - i));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const picked = arr.slice(0, cfg.questionCount);

  return picked.map((q) => ({
    _id: q._id,
    no: q.no,
    title: q.title,
    category: q.category,
    options: clone(q.options)
  }));
}

/** 交卷判分：服务端比对，不信任前端 */
export async function submitExam(questionNos, answers) {
  await delay(680);

  const p = state.participants.find((x) => x._id === state.session);
  if (!p) throw new BizError('请先登记身份信息', 'NOT_REGISTERED');

  if (!Array.isArray(questionNos) || !Array.isArray(answers) || questionNos.length !== answers.length) {
    throw new BizError('作答数据不完整', 'INVALID_PAYLOAD');
  }

  const details = questionNos.map((no, i) => {
    const q = state.questions.find((x) => x.no === Number(no));
    return { no: Number(no), yourAnswer: answers[i], correctAnswer: q ? q.answer : '', correct: !!q && q.answer === answers[i] };
  });

  const correctCount = details.filter((d) => d.correct).length;
  const passed = correctCount >= state.activity.passScore;

  if (passed && !p.passed) {
    p.passed = true;
    p.passedAt = now();
  }

  state.examRecords.push({
    _id: nextId('e'),
    activityId: ACTIVITY_ID,
    empNo: p.empNo,
    questionNos: questionNos.map(Number),
    answers,
    correctCount,
    passed,
    submittedAt: now()
  });

  return {
    correctCount,
    total: questionNos.length,
    passed,
    passScore: state.activity.passScore,
    details: details.map((d) => {
      const q = state.questions.find((x) => x.no === d.no);
      return { ...d, title: q?.title ?? '', analysis: q?.analysis ?? '', options: clone(q?.options ?? {}) };
    }),
    participant: clone(p)
  };
}

/* ============================================================
 * 6. 抽奖引擎（核心，与 PRD 附录 A 一一对应）
 * ==========================================================*/

/** 固定权重模式下的一/二/三等奖权重（weightMode = 'fixed' 时使用） */
const FIXED_WEIGHT = { 1: 1, 2: 8, 3: 16 };

function prizeWeight(prize, mode) {
  if (mode === 'fixed') return prize.weight > 0 ? prize.weight : FIXED_WEIGHT[prize.level] ?? 1;
  if (mode === 'initial') return prize.total;
  return prize.remain; // remain（默认）：按剩余库存加权
}

function weightedPick(pool, mode) {
  const weights = pool.map((p) => prizeWeight(p, mode));
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return pool[Math.floor(secureRandom() * pool.length)];
  let r = secureRandom() * sum;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r < 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/** 条件原子扣减：生产环境为 UPDATE ... WHERE remain > 0，此处以同步单线程等价模拟 */
function atomicDecrement(level) {
  const prize = state.prizes.find((p) => p.level === level);
  if (!prize || prize.remain <= 0) return false;
  prize.remain -= 1;
  prize.updatedAt = now();
  return true;
}

export async function getEligibility() {
  const p = state.participants.find((x) => x._id === state.session);
  if (!p) return { registered: false, passed: false, drawn: false };
  return { registered: true, passed: p.passed, drawn: p.drawn, passedAt: p.passedAt };
}

/**
 * 执行抽奖
 * @returns {{won:boolean, level:number|null, prizeName:string|null, message:string, poolEmpty:boolean}}
 */
export async function drawLottery() {
  await delay(1400); // 留出抽奖动画时间

  const p = state.participants.find((x) => x._id === state.session);
  if (!p) throw new BizError('请先登记身份信息', 'NOT_REGISTERED');
  if (!p.passed) throw new BizError('答题未通关，暂无抽奖资格', 'NOT_PASSED');
  if (p.drawn) {
    const old = state.lotteryRecords.find((r) => r.empNo === p.empNo);
    throw new BizError('每人仅可参与一次抽奖', 'ALREADY_DRAWN', old);
  }

  const cfg = state.activity;

  // 奖池是否整体抽空
  const poolEmpty = state.prizes.every((x) => x.remain <= 0);
  if (poolEmpty && cfg.poolEmptyBehavior === 'close') {
    throw new BizError('奖品已全部送出，感谢参与！', 'POOL_EMPTY');
  }

  // 阶段一：中奖判定，恒定 winRate
  const r1 = secureRandom();
  let level = null;
  let prizeName = null;
  let message = '谢谢参与';

  if (r1 < cfg.winRate) {
    // 阶段二 + 三：加权选等级 + 原子扣减，失败则剔除该等级后重试，最多 3 次
    let pool = state.prizes.filter((x) => x.remain > 0);
    for (let attempt = 0; attempt < 3 && pool.length > 0; attempt++) {
      const picked = weightedPick(pool, cfg.weightMode);
      if (atomicDecrement(picked.level)) {
        level = picked.level;
        prizeName = `${picked.name} · ${picked.desc}`;
        message = `恭喜获得${picked.name}`;
        break;
      }
      pool = pool.filter((x) => x.level !== picked.level);
    }
    if (level === null) message = '谢谢参与'; // 并发耗尽，降级
  }

  // 写入中奖记录（唯一性由 (activityId, empNo) 保证）
  p.drawn = true;
  p.drawnAt = now();
  const wonAt = now();
  state.lotteryRecords.push({
    _id: nextId('l'),
    activityId: ACTIVITY_ID,
    participantId: p._id,
    name: p.name,
    empNo: p.empNo,
    level,
    prizeName,
    wonAt,
    remark: level ? '' : '谢谢参与'
  });

  return { won: level !== null, level, prizeName, message, wonAt, poolEmpty: state.prizes.every((x) => x.remain <= 0) };
}

export async function getMyResult() {
  const p = state.participants.find((x) => x._id === state.session);
  if (!p) return null;
  const record = state.lotteryRecords.find((r) => r.empNo === p.empNo);
  return { participant: clone(p), record: record ? clone(record) : null };
}

/* ============================================================
 * 7. 管理后台
 * ==========================================================*/

export async function adminLogin(username, password) {
  await delay(500);
  const admin = state.admins.find((a) => a.username === username && a.password === password);
  if (!admin) throw new BizError('账号或密码错误', 'BAD_CREDENTIALS');
  state.adminSession = admin._id;
  const { password: _pw, ...safe } = admin;
  return safe;
}

export function adminLogout() {
  state.adminSession = null;
}

export function currentAdmin() {
  if (!state.adminSession) return null;
  const a = state.admins.find((x) => x._id === state.adminSession);
  if (!a) return null;
  const { password: _pw, ...safe } = a;
  return safe;
}

export async function getStats() {
  await delay(220);
  const participants = state.participants.length;
  const examCount = state.examRecords.length;
  const passed = state.participants.filter((p) => p.passed).length;
  const drawn = state.participants.filter((p) => p.drawn).length;
  const won = state.lotteryRecords.filter((r) => r.level !== null).length;
  return {
    participants,
    examCount,
    passed,
    drawn,
    won,
    winRateActual: drawn ? +(won / drawn).toFixed(4) : 0,
    prizes: clone(state.prizes),
    prizeTotal: state.prizes.reduce((s, p) => s + p.total, 0),
    prizeRemain: state.prizes.reduce((s, p) => s + p.remain, 0)
  };
}

export async function listWinners({ keyword = '', level = '', page = 1, pageSize = 10 } = {}) {
  await delay(240);
  let list = state.lotteryRecords.slice().sort((a, b) => String(b.wonAt).localeCompare(String(a.wonAt)));
  if (keyword) list = list.filter((r) => r.name.includes(keyword) || r.empNo.includes(keyword));
  if (level === 'won') list = list.filter((r) => r.level !== null);
  else if (level) list = list.filter((r) => String(r.level) === String(level));
  const total = list.length;
  const start = (page - 1) * pageSize;
  return { total, page, pageSize, list: clone(list.slice(start, start + pageSize)) };
}

export async function listParticipants({ keyword = '' } = {}) {
  await delay(200);
  let list = state.participants;
  if (keyword) list = list.filter((p) => p.name.includes(keyword) || p.empNo.includes(keyword));
  return clone(list);
}

export async function updatePrize(level, patch) {
  await delay(200);
  const prize = state.prizes.find((p) => p.level === Number(level));
  if (!prize) throw new BizError('奖项不存在', 'NOT_FOUND');
  Object.assign(prize, patch, { updatedAt: now() });
  return clone(prize);
}

export async function exportWinnersCsv() {
  await delay(300);
  const rows = state.lotteryRecords.filter((r) => r.level !== null);
  const header = '姓名,工号,奖项,奖品,中奖时间\n';
  const body = rows.map((r) => `${r.name},${r.empNo},${r.level}等奖,${r.prizeName},${r.wonAt}\n`).join('');
  return header + body;
}

/* ============================================================
 * 8. 测试工具（仅供《测试方案》验证使用，生产环境移除）
 * ==========================================================*/

export const TEST_UTILS = {
  /** 重置全部运行时状态到初始态 */
  reset() {
    state = buildInitialState();
  },

  /** 快照当前奖品池 */
  snapshotPool() {
    return clone(state.prizes);
  },

  /**
   * 批量模拟抽奖，用于验证中奖率与库存扣减。
   * 注意：为绕过"一人一次"限制，直接操作状态，不走资格校验。
   * @param {number} times 模拟次数
   * @param {number} seed 随机种子（可选，用于复现）
   */
  simulateDraws(times, seed = null) {
    let s = seed;
    const rand = () => {
      if (s === null) return secureRandom();
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };

    // 传入 seed 时使用可复现的线性同余随机，否则使用安全随机
    const __rand = rand;

    const result = { times, won: 0, byLevel: { 1: 0, 2: 0, 3: 0 }, oversold: 0, fallback: 0 };

    for (let i = 0; i < times; i++) {
      const cfg = state.activity;
      const poolEmpty = state.prizes.every((x) => x.remain <= 0);
      if (poolEmpty) break;

      const r1 = __rand();
      if (r1 >= cfg.winRate) continue;

      let pool = state.prizes.filter((x) => x.remain > 0);
      let got = null;
      for (let attempt = 0; attempt < 3 && pool.length > 0; attempt++) {
        const weights = pool.map((p) => prizeWeight(p, cfg.weightMode));
        const sum = weights.reduce((a, b) => a + b, 0);
        let r = __rand() * sum;
        let picked = pool[pool.length - 1];
        for (let k = 0; k < pool.length; k++) {
          r -= weights[k];
          if (r < 0) {
            picked = pool[k];
            break;
          }
        }
        if (atomicDecrement(picked.level)) {
          got = picked.level;
          break;
        }
        pool = pool.filter((x) => x.level !== picked.level);
      }

      if (got) {
        result.won += 1;
        result.byLevel[got] += 1;
      } else {
        result.fallback += 1;
      }
    }

    // 校验超发
    state.prizes.forEach((p) => {
      if (p.remain < 0) result.oversold += Math.abs(p.remain);
      const issued = result.byLevel[p.level] ?? 0;
      if (issued > p.total) result.oversold += issued - p.total;
    });

    result.remain = state.prizes.map((p) => ({ level: p.level, total: p.total, remain: p.remain }));
    result.actualWinRate = result.times ? +(result.won / result.times).toFixed(4) : 0;
    return result;
  },

  /** 直接构造一个已通关、未抽奖的测试身份，供原型快速走通流程 */
  seedParticipant(name, empNo, { passed = true } = {}) {
    let p = state.participants.find((x) => x.empNo === empNo && x.name === name);
    if (!p) {
      p = {
        _id: nextId('u'),
        activityId: ACTIVITY_ID,
        name,
        empNo,
        openid: `o-${empNo.toLowerCase()}`,
        passed: false,
        passedAt: null,
        drawn: false,
        drawnAt: null,
        createdAt: now()
      };
      state.participants.push(p);
    }
    if (passed && !p.passed) {
      p.passed = true;
      p.passedAt = now();
    }
    state.session = p._id;
    return clone(p);
  },

  /** 强制消耗某奖项库存（用于验证"一等奖抽完后再抽不到"） */
  drainPrize(level) {
    const p = state.prizes.find((x) => x.level === Number(level));
    if (p) p.remain = 0;
    return clone(state.prizes);
  }
};

/* ============================================================
 * 9. 默认聚合导出（便于按命名空间整体引用）
 * ==========================================================*/
const Data = {
  getActivity,
  updateActivity,
  listQuestions,
  getQuestionStats,
  toggleQuestion,
  updateQuestion,
  deleteQuestion,
  importQuestions,
  getImportTemplate,
  register,
  currentParticipant,
  logoutParticipant,
  drawQuestions,
  submitExam,
  getEligibility,
  drawLottery,
  getMyResult,
  adminLogin,
  adminLogout,
  currentAdmin,
  getStats,
  listWinners,
  listParticipants,
  updatePrize,
  exportWinnersCsv,
  TEST_UTILS
};

export default Data;
