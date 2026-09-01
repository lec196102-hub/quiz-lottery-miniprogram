Page({
  data: { won: false, level: 0, prizeName: '', message: '' },

  onLoad(q) {
    this.setData({
      won: q.won === '1',
      level: Number(q.level || 0),
      prizeName: decodeURIComponent(q.prizeName || ''),
      message: decodeURIComponent(q.message || '')
    });
  },

  goPrize() { wx.switchTab({ url: '/pages/my-prize/index' }); },
  goHome() { wx.switchTab({ url: '/pages/home/index' }); }
});
