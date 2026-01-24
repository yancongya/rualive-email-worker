/**
 * Time Selector Component
 */
class TimeSelector {
  constructor(containerId, onChange) {
    this.container = document.getElementById(containerId);
    this.onChange = onChange;
    this.currentRange = 'day';
    this.currentDate = null;
    this.render();
  }

  render() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    let yearOptions = '';
    for (let y = 2020; y <= currentYear; y++) {
      yearOptions += `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`;
    }

    let monthOptions = '';
    for (let m = 1; m <= 12; m++) {
      monthOptions += `<option value="${m}" ${m === currentMonth ? 'selected' : ''}>${m}月</option>`;
    }

    this.container.innerHTML = `
      <div class="time-selector">
        <div class="range-buttons">
          <button class="btn ${this.currentRange === 'day' ? 'btn-primary' : ''}" onclick="window.timeSelector.setRange('day')">日</button>
          <button class="btn ${this.currentRange === 'month' ? 'btn-primary' : ''}" onclick="window.timeSelector.setRange('month')">月</button>
          <button class="btn ${this.currentRange === 'year' ? 'btn-primary' : ''}" onclick="window.timeSelector.setRange('year')">年</button>
        </div>
        <div class="date-picker">
          ${this.currentRange === 'day' ? '' : `
            <select id="yearSelect" onchange="window.timeSelector.handleDateChange()">
              ${yearOptions}
            </select>
          `}
          ${this.currentRange === 'month' ? `
            <select id="monthSelect" onchange="window.timeSelector.handleDateChange()">
              ${monthOptions}
            </select>
          ` : ''}
          ${this.renderNavButtons()}
        </div>
      </div>
    `;
  }

  renderNavButtons() {
    const now = new Date();
    let prevDisabled = false;
    let nextDisabled = false;

    if (this.currentRange === 'day') {
      const today = new Date();
      const targetDate = this.currentDate ? new Date(this.currentDate) : today;
      prevDisabled = false;
      nextDisabled = targetDate >= today;
    } else if (this.currentRange === 'month') {
      const currentYear = this.currentDate ? new Date(this.currentDate).getFullYear() : now.getFullYear();
      const currentMonth = this.currentDate ? new Date(this.currentDate).getMonth() + 1 : now.getMonth() + 1;
      const firstMonth = new Date(2020, 0, 1);
      const currentMonthDate = new Date(currentYear, currentMonth - 1, 1);
      prevDisabled = currentMonthDate <= firstMonth;
      nextDisabled = false;
    } else if (this.currentRange === 'year') {
      const currentYear = this.currentDate ? parseInt(this.currentDate) : now.getFullYear();
      prevDisabled = currentYear <= 2020;
      nextDisabled = currentYear >= now.getFullYear();
    }

    return `
      <button class="nav-btn" onclick="window.timeSelector.navigate(-1)" ${prevDisabled ? 'disabled' : ''}>
        ◀
      </button>
      <button class="nav-btn" onclick="window.timeSelector.navigate(1)" ${nextDisabled ? 'disabled' : ''}>
        ▶
      </button>
    `;
  }

  setRange(range) {
    this.currentRange = range;
    
    // 切换到日模式时，初始化为今天
    if (range === 'day') {
      const now = new Date();
      this.currentDate = now.toISOString().split('T')[0];
    } else {
      this.currentDate = null;
    }
    
    this.render();
    this.onChange(this.currentRange, this.currentDate);
  }

  handleDateChange() {
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');

    if (yearSelect) {
      const year = yearSelect.value;
      if (monthSelect) {
        const month = monthSelect.value;
        this.currentDate = `${year}-${String(month).padStart(2, '0')}`;
      } else {
        this.currentDate = year;
      }
    }

    this.render();
    this.onChange(this.currentRange, this.currentDate);
  }

  navigate(direction) {
    const now = new Date();
    
    if (this.currentRange === 'day') {
      // 日模式下，切换日期
      let currentDate = this.currentDate ? new Date(this.currentDate) : new Date();
      currentDate.setDate(currentDate.getDate() + direction);
      this.currentDate = currentDate.toISOString().split('T')[0];
    } else if (this.currentRange === 'month') {
      // 月模式下，切换月份
      let currentYear = this.currentDate ? new Date(this.currentDate).getFullYear() : now.getFullYear();
      let currentMonth = this.currentDate ? new Date(this.currentDate).getMonth() + 1 : now.getMonth() + 1;
      
      currentMonth += direction;

      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      } else if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
      }

      this.currentDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    } else if (this.currentRange === 'year') {
      // 年模式下，切换年份
      let currentYear = this.currentDate ? parseInt(this.currentDate) : now.getFullYear();
      currentYear += direction;
      this.currentDate = `${currentYear}`;
    }

    this.render();
    this.onChange(this.currentRange, this.currentDate);
  }

  getCurrentRange() {
    return this.currentRange;
  }

  getCurrentDate() {
    return this.currentDate;
  }
}