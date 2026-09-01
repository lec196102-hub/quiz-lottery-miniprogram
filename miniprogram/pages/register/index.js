const { call } = require('../../utils/request');

Page({
  data: { name: '', empNo: '', error: '', warning: '', submitting: false },

  inputName(e) { this.setData({ name: e.detail.value }); },
  inputEmp(e) { this.setData({ empNo: e.detail.value }); },

  async submit() {
    const name = this.data.name.trim();
    const empNo = this.data.empNo.trim();
    if (name.length < 2 || name.length > 10) {
      this.setData({ error: '姓名需 2–10 个字符' }); return;
    }
    if (!/^[A-Za-z0-9]{4,12}$/.test(empNo)) {
      this.setData({ error: '工号需 4–12 位字母或数字' }); return;
    }
    this.setData({ error: '', submitting: true });
    try {
      const r = await call('register', { name, empNo });
      if (r.warning) {
        wx.showModal({ title: '提示', content: r.warning, showCancel: false });
      }
      wx.showToast({ title: '登记成功', icon: 'success' });
      setTimeout(() => wx.navigateTo({ url: '/pages/quiz/index' }), 600);
    } catch (e) {
      this.setData({ error: e.message });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
