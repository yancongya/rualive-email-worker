/**
 * Tab Manager Component
 */
class TabManager {
  constructor() {
    this.currentTab = 'trend';
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    // 初始化时默认显示趋势标签
    this.switchTab('trend');
    this.initialized = true;
  }

  switchTab(tabId) {
    // 更新当前标签
    this.currentTab = tabId;

    // 更新按钮状态
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 更新内容显示
    const panes = document.querySelectorAll('.tab-pane');
    panes.forEach(pane => {
      if (pane.id === `tab-${tabId}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // 如果切换到趋势标签，强制更新图表和表格
    if (tabId === 'trend') {
      if (window.chartView && window.timeSelector) {
        const range = window.timeSelector.getCurrentRange();
        const date = window.timeSelector.getCurrentDate();
        window.chartView.update(window.appData, range, date);
      }
      if (window.logsTable && window.timeSelector) {
        const range = window.timeSelector.getCurrentRange();
        const date = window.timeSelector.getCurrentDate();
        const filteredData = window.appData.filter(log => {
          if (range === 'day') {
            const logDate = new Date(log.work_date);
            const now = new Date();
            const diffTime = now - logDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return diffDays < 7;
          } else if (range === 'month') {
            const year = date ? new Date(date).getFullYear() : new Date().getFullYear();
            const month = date ? new Date(date).getMonth() + 1 : new Date().getMonth() + 1;
            const logDate = new Date(log.work_date);
            return logDate.getFullYear() === year && (logDate.getMonth() + 1) === month;
          } else if (range === 'year') {
            const year = date ? parseInt(date) : new Date().getFullYear();
            const logDate = new Date(log.work_date);
            return logDate.getFullYear() === year;
          }
          return false;
        });
        window.logsTable.update(filteredData);
      }
    }
  }

  getCurrentTab() {
    return this.currentTab;
  }
}

// 创建全局实例
window.tabManager = new TabManager();