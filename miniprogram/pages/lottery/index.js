const { call } = require('../../utils/request');

Page({
  data: {
    spinning: false,
    canDraw: false,
    reason: '',
    pool: []
  },

  async onShow() {
    try {
      const [elig, stats] = await Promise.all([
        call('getEligibility'),
        call('getStats')
      ]);
      let canDraw = true, reason = '';
      if (!elig.registered) { canDraw = false; reason = '请先登记身份'; }
      else if (!elig.passed) { canDraw = false; reason = '请先答题通关'; }
      else if (elig.drawn) { canDraw = false; reason = '你已抽过奖啦'; }
      this.setData({ canDraw, reason, pool: stats.prizes || [] });
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  async draw() {
    if (!this.data.canDraw || this.data.spinning) return;
    this.setData({ spinning: true });
    try {
      const r = await call('drawLottery', {});
      setTimeout(() => {
        const params = `won=${r.won ? 1 : 0}&level=${r.level || 0}&prizeName=${encodeURIComponent(r.prizeName || '')}&message=${encodeURIComponent(r.message)}`;
        wx.redirectTo({ url: `/pages/lottery-result/index?${params}` });
      }, 1600);
    } catch (e) {
      this.setData({ spinning: false });
      wx.showToast({ title: e.message || '抽奖失败', icon: 'none' });
    }
  },

  goHome() { wx.switchTab({ url: '/pages/home/index' }); }
});
