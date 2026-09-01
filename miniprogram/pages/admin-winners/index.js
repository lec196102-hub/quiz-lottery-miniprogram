const { call } = require('../../utils/request');
const { formatTime } = require('../../utils/util');

function fmt(t) {
  if (!t) return '';
  try {
    const d = (t instanceof Date) ? t : new Date(t);
    return formatTime(d);
  } catch (e) { return String(t); }
}

Page({
  data: {
    list: [], keyword: '', filter: 'all',
    page: 1, pageSize: 10, total: 0, loading: false
  },

  onShow() { this.load(); },

  async load() {
    this.setData({ loading: true });
    try {
      const level = this.data.filter === 'all' ? '' : this.data.filter;
      const r = await call('listWinners', {
        keyword: this.data.keyword, level, page: this.data.page, pageSize: this.data.pageSize
      });
      const list = r.list.map((x) => ({
        ...x,
        wonAtText: fmt(x.wonAt),
        levelText: x.level ? x.level + '等奖' : '未中奖'
      }));
      this.setData({ list, total: r.total });
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onSearch(e) { this.setData({ keyword: e.detail.value }); },
  doSearch() { this.setData({ page: 1 }); this.load(); },

  setFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.f, page: 1 });
    this.load();
  },

  prev() { if (this.data.page > 1) { this.setData({ page: this.data.page - 1 }); this.load(); } },
  next() {
    if (this.data.page * this.data.pageSize < this.data.total) {
      this.setData({ page: this.data.page + 1 }); this.load();
    }
  },

  async exportCsv() {
    try {
      const csv = await call('exportWinnersCsv', {});
      wx.setClipboardData({ data: csv });
      wx.showToast({ title: 'CSV 已复制到剪贴板', icon: 'none' });
    } catch (e) {
      wx.showToast({ title: e.message || '导出失败', icon: 'none' });
    }
  }
});
