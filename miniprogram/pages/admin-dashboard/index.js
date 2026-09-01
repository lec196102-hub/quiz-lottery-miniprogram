const { call } = require('../../utils/request');

Page({
  data: { admin: '', stats: null },

  onShow() {
    const admin = wx.getStorageSync('admin');
    if (!admin) { wx.reLaunch({ url: '/pages/admin-login/index' }); return; }
    this.setData({ admin });
    this.load();
  },

  async load() {
    try {
      const s = await call('getStats', {});
      this.setData({ stats: s });
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  go(e) { wx.navigateTo({ url: e.currentTarget.dataset.url }); },

  logout() {
    wx.removeStorageSync('admin');
    wx.reLaunch({ url: '/pages/admin-login/index' });
  }
});
