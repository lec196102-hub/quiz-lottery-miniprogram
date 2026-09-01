const { call } = require('../../utils/request');

Page({
  data: {
    questions: [],
    answers: {},
    current: 0,
    loaded: false,
    submitting: false
  },

  onLoad() { this.load(); },

  async load() {
    try {
      const qs = await call('drawQuestions', {});
      this.setData({ questions: qs, answers: {}, current: 0, loaded: true });
    } catch (e) {
      wx.showToast({ title: e.message || '题目加载失败', icon: 'none' });
    }
  },

  select(e) {
    const { no, opt } = e.currentTarget.dataset;
    this.setData({ ['answers.' + no]: opt });
  },

  prev() {
    if (this.data.current > 0) this.setData({ current: this.data.current - 1 });
  },

  next() {
    const { current, questions, answers } = this.data;
    const q = questions[current];
    if (!answers[q.no]) { wx.showToast({ title: '请先选择答案', icon: 'none' }); return; }
    if (current < questions.length - 1) this.setData({ current: current + 1 });
  },

  async submit() {
    const { questions, answers } = this.data;
    if (Object.keys(answers).length < questions.length) {
      wx.showToast({ title: '还有题目未作答', icon: 'none' }); return;
    }
    this.setData({ submitting: true });
    try {
      const questionNos = questions.map((q) => q.no);
      const ans = questions.map((q) => answers[q.no]);
      const r = await call('submitExam', { questionNos, answers: ans });
      wx.redirectTo({
        url: `/pages/quiz-result/index?correct=${r.correctCount}&total=${r.total}&pass=${r.passed ? 1 : 0}&passScore=${r.passScore}`
      });
    } catch (e) {
      wx.showToast({ title: e.message || '提交失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
