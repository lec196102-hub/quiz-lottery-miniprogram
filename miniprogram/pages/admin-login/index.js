const { call } = require('../../utils/request');

Page({
  data: { user: '', pass: '', error: '', submitting: false },

  inputUser(e) { this.setData({ user: e.detail.value }); },
  inputPass(e) { this.setData({ pass: e.detail.value }); },

  async submit() {
    if (!this.data.user || !this.data.pass) {
      this.setData({ error: '请输入账号和密码' }); return;
    }
    this.setData({ error: '', submitting: true });
    try {
      const r = await call('adminLogin', { user: this.data.user, pass: this.data.pass });
      wx.setStorageSync('admin', r.name);
      wx.reLaunch({ url: '/pages/admin-dashboard/index' });
    } catch (e) {
      this.setData({ error: e.message });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
