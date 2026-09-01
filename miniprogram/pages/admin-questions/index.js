const { call } = require('../../utils/request');

Page({
  data: {
    list: [], keyword: '', page: 1, pageSize: 10, total: 0,
    enabled: 0, disabled: 0, categories: [],
    loading: false,
    showImport: false, importText: '', importMsg: ''
  },

  onShow() { this.load(); },

  async load() {
    this.setData({ loading: true });
    try {
      const r = await call('listQuestions', {
        keyword: this.data.keyword, page: this.data.page, pageSize: this.data.pageSize
      });
      this.setData({
        list: r.list, total: r.total,
        enabled: r.enabled, disabled: r.disabled, categories: r.categories
      });
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onSearch(e) { this.setData({ keyword: e.detail.value }); },
  doSearch() { this.setData({ page: 1 }); this.load(); },

  async toggle(e) {
    const { no, enabled } = e.currentTarget.dataset;
    try {
      await call('toggleQuestion', { no, enabled: !enabled });
      this.load();
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' });
    }
  },

  prev() { if (this.data.page > 1) { this.setData({ page: this.data.page - 1 }); this.load(); } },
  next() {
    if (this.data.page * this.data.pageSize < this.data.total) {
      this.setData({ page: this.data.page + 1 }); this.load();
    }
  },

  openImport() { this.setData({ showImport: true, importMsg: '' }); },
  closeImport() { this.setData({ showImport: false }); },
  onImportText(e) { this.setData({ importText: e.detail.value }); },

  async doImport() {
    let rows;
    try { rows = JSON.parse(this.data.importText); }
    catch (_) { this.setData({ importMsg: 'JSON 解析失败，请检查格式' }); return; }
    if (!Array.isArray(rows)) { this.setData({ importMsg: '导入内容需为数组' }); return; }
    try {
      const r = await call('importQuestions', { rows, mode: 'overwrite' });
      let msg = `成功导入 ${r.success} 条，失败 ${r.failed} 条`;
      if (r.errors.length) {
        msg += '\n' + r.errors.slice(0, 3).map((x) => `第${x.lineNo}行：${x.reason}`).join('；');
      }
      this.setData({ importMsg: msg });
      this.load();
    } catch (e) {
      this.setData({ importMsg: e.message });
    }
  }
});
