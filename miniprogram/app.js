// app.js —— 微信云开发初始化
App({
  globalData: {
    activityId: 'ACT_DEFAULT',
    env: 'REPLACE_WITH_YOUR_ENV_ID', // 在微信开发者工具「云开发」控制台获取环境 ID 后填入
    participant: null,
    admin: null
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('当前基础库不支持云开发，请使用 2.2.3 及以上的基础库');
      return;
    }
    wx.cloud.init({
      env: this.globalData.env,
      traceUser: true
    });
  }
});
