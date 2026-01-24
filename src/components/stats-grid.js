/**
 * Stats Grid Component
 */
class StatsGrid {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h3 id="stat-hours">0</h3>
          <p>工作时长</p>
        </div>
        <div class="stat-card">
          <h3 id="stat-comps">0</h3>
          <p>合成数量</p>
        </div>
        <div class="stat-card">
          <h3 id="stat-keys">0</h3>
          <p>关键帧数</p>
        </div>
        <div class="stat-card">
          <h3 id="stat-effects">0</h3>
          <p>效果数量</p>
        </div>
      </div>
    `;
  }

  update(summary) {
    document.getElementById('stat-hours').textContent = summary.totalHours.toFixed(1);
    document.getElementById('stat-comps').textContent = summary.totalComps;
    document.getElementById('stat-keys').textContent = summary.totalKeys;
    document.getElementById('stat-effects').textContent = summary.totalEffects;
  }
}