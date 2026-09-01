const { call } = require('../../utils/request');

Page({
  data: { prizes: [], act: null },

  onShow() { this.load(); },

  async load() {
    try {
      const [s, act] = await Promise.all([call('getStats'), call('getActivity')]);
      this.setData({ prizes: s.prizes, act });
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  async editRate() {
    const r = await wx.showModal({
      title: '中奖概率', editable: true, placeholderText: '0–1 之间，如 0.25',
      content: String(this.data.act.winRate)
    });
    if (r.confirm) {
      const v = Number(r.content);
      if (isNaN(v) || v < 0 || v > 1) { wx.showToast({ title: '无效概率', icon: 'none' }); return; }
      await call('updateActivity', { winRate: v });
      this.load();
    }
  },

  async editMode() {
    const r = await wx.showActionSheet({ itemList: ['按剩余库存加权(remain)', '固定权重(fixed)', '初始库存(initial)'] });
    const map = ['remain', 'fixed', 'initial'];
    await call('updateActivity', { weightMode: map[r.tapIndex] });
    this.load();
  },

  async editEmpty() {
    const r = await wx.showActionSheet({ itemList: ['奖池耗尽即关闭入口(close)', '奖池耗尽仍可抽奖(still-draw)'] });
    const map = ['close', 'still-draw'];
    await call('updateActivity', { poolEmptyBehavior: map[r.tapIndex] });
    this.load();
  },

  async editPrize(e) {
    const level = Number(e.currentTarget.dataset.level);
    const p = this.data.prizes.find((x) => x.level === level);
    const r = await wx.showModal({
      title: `编辑 ${p.name} 总库存`, editable: true, placeholderText: '输入总库存',
      content: String(p.total)
    });
    if (r.confirm) {
      const total = Number(r.content);
      if (!total || total < 0) { wx.showToast({ title: '无效数量', icon: 'none' }); return; }
      await call('updatePrize', { level, total, remain: Math.min(p.remain, total) });
      this.load();
    }
  }
});
