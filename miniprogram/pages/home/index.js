const { call } = require('../../utils/request');

Page({
  data: {
    activity: null,
    status: null,
    statusText: '加载中…',
    statusType: 'gray',
    primaryText: '开始',
    primaryPath: '',
    primaryIsTab: false
  },

  onShow() {
    this.load();
  },

  async load() {
    try {
      const [activity, status] = await Promise.all([
        call('getActivity'),
        call('getEligibility')
      ]);
      this.setData({ activity, status, ...this.derive(status) });
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  derive(s) {
    if (!s || !s.registered) {
      return { statusText: '尚未登记身份', statusType: 'gray', primaryText: '去登记', primaryPath: '/pages/register/index', primaryIsTab: false };
    }
    if (!s.passed) {
      return { statusText: '已登记 · 答题未通关', statusType: 'amber', primaryText: '去答题', primaryPath: '/pages/quiz/index', primaryIsTab: false };
    }
    if (!s.drawn) {
      return { statusText: '已通关 · 待抽奖', statusType: 'green', primaryText: '去抽奖', primaryPath: '/pages/lottery/index', primaryIsTab: false };
    }
    return { statusText: '已完成抽奖', statusType: 'blue', primaryText: '查看我的奖品', primaryPath: '/pages/my-prize/index', primaryIsTab: true };
  },

  goPrimary() {
    if (this.data.primaryIsTab) wx.switchTab({ url: this.data.primaryPath });
    else wx.navigateTo({ url: this.data.primaryPath });
  }
});
