const { call } = require('../../utils/request');
const { formatTime } = require('../../utils/util');

Page({
  data: { loaded: false, drawn: false, participant: null, record: null, wonAtText: '' },

  onShow() { this.load(); },

  async load() {
    try {
      const r = await call('getMyResult', {});
      if (!r) { this.setData({ loaded: true, drawn: false }); return; }
      const rec = r.record;
      let wonAtText = '';
      if (rec && rec.wonAt) {
        try { wonAtText = formatTime(new Date(rec.wonAt)); } catch (e) { wonAtText = String(rec.wonAt); }
      }
      this.setData({
        loaded: true,
        drawn: !!r.participant.drawn,
        participant: r.participant,
        record: rec,
        wonAtText
      });
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  goDraw() { wx.navigateTo({ url: '/pages/lottery/index' }); },
  goHome() { wx.switchTab({ url: '/pages/home/index' }); }
});
