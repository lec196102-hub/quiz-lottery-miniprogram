Page({
  data: { correct: 0, total: 0, pass: false, passScore: 3 },

  onLoad(q) {
    const pass = q.pass === '1';
    this.setData({
      correct: Number(q.correct || 0),
      total: Number(q.total || 0),
      pass,
      passScore: Number(q.passScore || 3)
    });
  },

  goLottery() { wx.redirectTo({ url: '/pages/lottery/index' }); },
  retry() { wx.redirectTo({ url: '/pages/quiz/index' }); },
  goHome() { wx.switchTab({ url: '/pages/home/index' }); }
});
