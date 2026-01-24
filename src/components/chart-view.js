/**
 * Chart View Component
 */
class ChartView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.chart = null;
    this.currentRange = 'day';
    this.currentDate = null;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="card">
        <div class="chart-container">
          <canvas id="workChart"></canvas>
        </div>
      </div>
    `;
  }

  update(data, range, date) {
    this.currentRange = range;
    this.currentDate = date;
    this.renderChart(data);
  }

  renderChart(data) {
    const ctx = document.getElementById('workChart');
    if (!ctx) return;

    let labels = [];
    let workHoursData = [];
    let compositionsData = [];
    let keyframesData = [];
    let effectsData = [];

    if (this.currentRange === 'day') {
      // Last 7 days
      const dailyData = {};
      data.forEach(log => {
        if (log.work_date) {
          if (!dailyData[log.work_date]) {
            dailyData[log.work_date] = { hours: 0, comps: 0, keys: 0, effects: 0 };
          }
          dailyData[log.work_date].hours += log.work_hours || 0;
          dailyData[log.work_date].comps += log.composition_count || 0;
          dailyData[log.work_date].keys += log.keyframe_count || 0;
          dailyData[log.work_date].effects += log.effect_count || 0;
        }
      });

      const sortedDates = Object.keys(dailyData).sort().slice(-7);
      labels = sortedDates.map(date => {
        const d = new Date(date);
        return (d.getMonth() + 1) + '/' + d.getDate();
      });
      workHoursData = sortedDates.map(date => dailyData[date].hours.toFixed(1));
      compositionsData = sortedDates.map(date => dailyData[date].comps);
      keyframesData = sortedDates.map(date => dailyData[date].keys);
      effectsData = sortedDates.map(date => dailyData[date].effects);
    } else if (this.currentRange === 'month') {
      // All days in current month
      const year = this.currentDate ? new Date(this.currentDate).getFullYear() : new Date().getFullYear();
      const month = this.currentDate ? new Date(this.currentDate).getMonth() + 1 : new Date().getMonth() + 1;

      const monthData = {};
      data.forEach(log => {
        if (log.work_date) {
          const logDate = new Date(log.work_date);
          if (logDate.getFullYear() === year && (logDate.getMonth() + 1) === month) {
            const day = logDate.getDate();
            if (!monthData[day]) {
              monthData[day] = { hours: 0, comps: 0, keys: 0, effects: 0 };
            }
            monthData[day].hours += log.work_hours || 0;
            monthData[day].comps += log.composition_count || 0;
            monthData[day].keys += log.keyframe_count || 0;
            monthData[day].effects += log.effect_count || 0;
          }
        }
      });

      const days = Object.keys(monthData).map(Number).sort((a, b) => a - b);
      labels = days.map(day => day + '日');
      workHoursData = days.map(day => monthData[day].hours.toFixed(1));
      compositionsData = days.map(day => monthData[day].comps);
      keyframesData = days.map(day => monthData[day].keys);
      effectsData = days.map(day => monthData[day].effects);
    } else if (this.currentRange === 'year') {
      // All months in current year
      const year = this.currentDate ? parseInt(this.currentDate) : new Date().getFullYear();

      const yearData = {};
      data.forEach(log => {
        if (log.work_date) {
          const logDate = new Date(log.work_date);
          if (logDate.getFullYear() === year) {
            const month = logDate.getMonth() + 1;
            if (!yearData[month]) {
              yearData[month] = { hours: 0, comps: 0, keys: 0, effects: 0 };
            }
            yearData[month].hours += log.work_hours || 0;
            yearData[month].comps += log.composition_count || 0;
            yearData[month].keys += log.keyframe_count || 0;
            yearData[month].effects += log.effect_count || 0;
          }
        }
      });

      const months = Object.keys(yearData).map(Number).sort((a, b) => a - b);
      labels = months.map(month => month + '月');
      workHoursData = months.map(month => yearData[month].hours.toFixed(1));
      compositionsData = months.map(month => yearData[month].comps);
      keyframesData = months.map(month => yearData[month].keys);
      effectsData = months.map(month => yearData[month].effects);
    }

    const isDark = document.body.classList.contains('dark');
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    const gridColor = isDark ? '#374151' : '#e5e7eb';

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: '工作时长',
            data: workHoursData,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#667eea',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: '合成数量',
            data: compositionsData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: '关键帧数',
            data: keyframesData,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: '效果数量',
            data: effectsData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: textColor,
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: gridColor,
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: {
              color: gridColor,
              display: false
            },
            ticks: {
              color: textColor
            }
          },
          y: {
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor
            },
            beginAtZero: true
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });
  }

  updateTheme(isDark) {
    if (this.chart) {
      const textColor = isDark ? '#9ca3af' : '#6b7280';
      const gridColor = isDark ? '#374151' : '#e5e7eb';

      this.chart.options.plugins.legend.labels.color = textColor;
      this.chart.options.scales.x.ticks.color = textColor;
      this.chart.options.scales.y.ticks.color = textColor;
      this.chart.options.scales.y.grid.color = gridColor;
      this.chart.update();
    }
  }
}