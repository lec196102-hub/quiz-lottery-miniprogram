// utils/request.js —— 统一调用云函数 api
function call(action, payload = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'api',
      data: { action, payload }
    }).then((res) => {
      const r = res.result;
      if (r && r.code === 0) {
        resolve(r.data);
      } else {
        reject(new Error((r && r.message) || '请求失败'));
      }
    }).catch((err) => reject(err));
  });
}

module.exports = { call };
