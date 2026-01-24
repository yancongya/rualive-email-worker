/**
 * Logs Table Component
 */
class LogsTable {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.data = [];
    this.currentPage = 1;
    this.pageSize = 10;
    this.sortColumn = 'work_date';
    this.sortDirection = 'desc';
    // 添加详细数据缓存
    this.detailCache = new Map(); // key: date_type, value: data
    this.cacheExpiry = 5 * 60 * 1000; // 5分钟缓存过期时间
    this.cacheTimestamps = new Map(); // key: date_type, value: timestamp
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="card">
        <div class="table-container">
          <table id="logsTable">
            <thead>
              <tr>
                <th onclick="window.logsTable.sortBy('work_date')" class="sortable">日期 <span class="sort-icon" data-column="work_date"></span></th>
                <th onclick="window.logsTable.sortBy('work_hours')" class="sortable">时长 <span class="sort-icon" data-column="work_hours"></span></th>
                <th onclick="window.logsTable.sortBy('composition_count')" class="sortable">合成 <span class="sort-icon" data-column="composition_count"></span></th>
                <th onclick="window.logsTable.sortBy('keyframe_count')" class="sortable">关键帧 <span class="sort-icon" data-column="keyframe_count"></span></th>
                <th onclick="window.logsTable.sortBy('effect_count')" class="sortable">效果 <span class="sort-icon" data-column="effect_count"></span></th>
                <th onclick="window.logsTable.sortBy('project_count')" class="sortable">项目 <span class="sort-icon" data-column="project_count"></span></th>
              </tr>
            </thead>
            <tbody id="logsBody">
              <tr><td colspan="6" style="text-align: center;">加载中...</td></tr>
            </tbody>
          </table>
        </div>
        <div id="pagination" class="pagination"></div>
      </div>
      
      <!-- 详情弹窗 -->
      <div id="detailModal" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>📊 工作详情</h3>
            <button class="modal-close" onclick="window.logsTable.closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div id="detailContent"></div>
          </div>
        </div>
      </div>
    `;
  }

  update(data) {
    this.data = data || [];
    this.currentPage = 1;
    this.renderBody();
    this.renderPagination();
  }

  renderBody() {
    const tbody = document.getElementById('logsBody');
    if (!tbody) return;

    if (!this.data || this.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">暂无数据</td></tr>';
      return;
    }

    // 计算当前页的数据
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const pageData = this.data.slice(startIndex, endIndex);

    tbody.innerHTML = pageData.map((log, index) => `
      <tr ondblclick="window.logsTable.showDetail(${startIndex + index})" style="cursor: pointer;" title="双击查看详情">
        <td>${log.work_date || '-'}</td>
        <td>${(log.work_hours || 0).toFixed(1)}</td>
        <td>${log.composition_count || 0}</td>
        <td>${log.keyframe_count || 0}</td>
        <td>${log.effect_count || 0}</td>
        <td>${log.project_count || 0}</td>
      </tr>
    `).join('');

    this.updateSortIcons();
  }

  renderPagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    const totalPages = Math.ceil(this.data.length / this.pageSize);
    
    if (totalPages <= 1) {
      pagination.innerHTML = '';
      return;
    }

    let html = '<div class="pagination-info">';
    html += `共 ${this.data.length} 条记录，第 ${this.currentPage} / ${totalPages} 页`;
    html += '</div>';

    html += '<div class="pagination-controls">';
    
    // 上一页按钮
    html += `<button class="pagination-btn" onclick="window.logsTable.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>上一页</button>`;
    
    // 页码按钮
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
        html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" onclick="window.logsTable.goToPage(${i})">${i}</button>`;
      } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
        html += '<span class="pagination-ellipsis">...</span>';
      }
    }
    
    // 下一页按钮
    html += `<button class="pagination-btn" onclick="window.logsTable.goToPage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>下一页</button>`;
    
    html += '</div>';

    pagination.innerHTML = html;
  }

  goToPage(page) {
    const totalPages = Math.ceil(this.data.length / this.pageSize);
    if (page < 1 || page > totalPages) return;
    
    this.currentPage = page;
    this.renderBody();
    this.renderPagination();
  }

  sortBy(column) {
    if (!this.data || this.data.length === 0) return;

    // 切换排序方向
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'desc'; // 默认降序
    }

    // 排序数据
    this.data.sort((a, b) => {
      let aVal = a[column] || 0;
      let bVal = b[column] || 0;

      // 日期特殊处理
      if (column === 'work_date') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (this.sortDirection === 'asc') {
        return aVal - bVal;
      } else {
        return bVal - aVal;
      }
    });

    // 重新渲染
    this.currentPage = 1;
    this.renderBody();
    this.renderPagination();
  }

  updateSortIcons() {
    const icons = document.querySelectorAll('.sort-icon');
    icons.forEach(icon => {
      const column = icon.dataset.column;
      if (column === this.sortColumn) {
        icon.textContent = this.sortDirection === 'asc' ? '▲' : '▼';
      } else {
        icon.textContent = '';
      }
    });
  }

  showDetail(index) {
    const log = this.data[index];
    if (!log) return;

    const modal = document.getElementById('detailModal');
    const content = document.getElementById('detailContent');
    
    const date = log.work_date || '未知日期';
    const hours = (log.work_hours || 0).toFixed(1);
    const compositions = log.composition_count || 0;
    const keyframes = log.keyframe_count || 0;
    const effects = log.effect_count || 0;
    const projects = log.project_count || 0;
    const jsonSize = log.json_size || 0;

    content.innerHTML = `
      <div class="detail-header">
        <h4>📅 ${date}</h4>
      </div>
      
      <div class="detail-stats">
        <div class="detail-stat clickable" ondblclick="window.logsTable.showDetailList('${date}', 'compositions')" title="双击查看合成列表">
          <div class="detail-stat-icon">🎬</div>
          <div class="detail-stat-content">
            <div class="detail-stat-value">${compositions}</div>
            <div class="detail-stat-label">合成数量</div>
          </div>
        </div>
        
        <div class="detail-stat clickable" ondblclick="window.logsTable.showDetailList('${date}', 'keyframes')" title="双击查看关键帧列表">
          <div class="detail-stat-icon">🎞️</div>
          <div class="detail-stat-content">
            <div class="detail-stat-value">${keyframes}</div>
            <div class="detail-stat-label">关键帧数</div>
          </div>
        </div>
        
        <div class="detail-stat clickable" ondblclick="window.logsTable.showDetailList('${date}', 'effects')" title="双击查看效果列表">
          <div class="detail-stat-icon">✨</div>
          <div class="detail-stat-content">
            <div class="detail-stat-value">${effects}</div>
            <div class="detail-stat-label">效果数量</div>
          </div>
        </div>
        
        <div class="detail-stat clickable" ondblclick="window.logsTable.showDetailList('${date}', 'layers')" title="双击查看图层列表">
          <div class="detail-stat-icon">📚</div>
          <div class="detail-stat-content">
            <div class="detail-stat-value">${log.layer_count || 0}</div>
            <div class="detail-stat-label">图层数量</div>
          </div>
        </div>
        
        <div class="detail-stat clickable" ondblclick="window.logsTable.showDetailList('${date}', 'work-hours')" title="双击查看各项目工作时长">
          <div class="detail-stat-icon">⏱️</div>
          <div class="detail-stat-content">
            <div class="detail-stat-value">${hours} 小时</div>
            <div class="detail-stat-label">工作时长</div>
          </div>
        </div>

        <div class="detail-stat clickable" ondblclick="window.logsTable.showDetailList('${date}', 'projects')" title="双击查看项目列表">
          <div class="detail-stat-icon">📁</div>
          <div class="detail-stat-content">
            <div class="detail-stat-value">${projects}</div>
            <div class="detail-stat-label">项目数量</div>
          </div>
        </div>
        
        <div class="detail-stat">
          <div class="detail-stat-icon">📄</div>
          <div class="detail-stat-content">
            <div class="detail-stat-value">${jsonSize} KB</div>
            <div class="detail-stat-label">JSON 大小</div>
          </div>
        </div>
      </div>
      
      <div class="detail-summary">
        <h5>📝 工作总结</h5>
        <p>在 ${date} 这一天，您总共工作了 <strong>${hours} 小时</strong>，完成了 <strong>${compositions}</strong> 个合成项目，使用了 <strong>${keyframes}</strong> 个关键帧，应用了 <strong>${effects}</strong> 个效果。</p>
      </div>
    `;

    modal.style.display = 'flex';
  }

  async showDetailList(date, type) {
      try {
        const cacheKey = `${date}_${type}`;

        // 检查缓存
        const now = Date.now();
        const cachedTimestamp = this.cacheTimestamps.get(cacheKey);
        const cachedData = this.detailCache.get(cacheKey);

        if (cachedData && cachedTimestamp && (now - cachedTimestamp) < this.cacheExpiry) {
          console.log(`[LogsTable] 使用缓存数据: ${cacheKey}`);
          this.showListModal(cachedData.title, cachedData.jsonData, cachedData.columns);
          return;
        }

        console.log(`[LogsTable] 从服务器获取数据: ${cacheKey}`);

        const token = localStorage.getItem('token');
        const response = await fetch(`/api/work-logs?date=${date}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('获取数据失败');
        }

        const result = await response.json();

        if (!result.success || !result.data || result.data.length === 0) {
          alert('未找到详细数据');
          return;
        }

        const log = result.data[0];
        let jsonData = null;
        let title = '';
        let columns = [];

        switch(type) {
          case 'compositions':
            jsonData = log.compositions_json ? JSON.parse(log.compositions_json) : [];
            title = `🎬 ${date} 合成列表`;

  

                    columns = ['项目', '数量'];

  

                    break;

  

                  case 'effects':

  

                    jsonData = log.effects_json ? JSON.parse(log.effects_json) : [];

  

                    title = `✨ ${date} 效果列表`;

  

                    columns = ['项目', '效果名称'];

  

                    break;

  

                  case 'layers':

  

                    jsonData = log.layers_json ? JSON.parse(log.layers_json) : [];

  

                    title = `📚 ${date} 图层列表`;

  

                    columns = ['项目', '图层名称'];

  

                    break;

  

                  case 'keyframes':

  

                    jsonData = log.keyframes_json ? JSON.parse(log.keyframes_json) : [];

  

                    title = `🎞️ ${date} 关键帧列表`;

  

                    columns = ['项目', '图层', '数量'];

  

                    break;

  

                  case 'projects':

  

                    jsonData = log.projects_json ? JSON.parse(log.projects_json) : [];

  

                    title = `📁 ${date} 项目列表`;

  

                    columns = ['项目名称', '合成数', '图层数', '关键帧数', '效果数'];

  

                    break;

  

                  case 'work-hours':

  

                    jsonData = log.work_hours_json ? JSON.parse(log.work_hours_json) : [];

  

                    title = `⏱️ ${date} 各项目工作时长`;

  

                    columns = ['项目名称', '工作时长（小时）'];

  

                    break;

  

                }

  

        if (!jsonData || jsonData.length === 0) {

  

                  alert('暂无详细数据');

  

                  return;

  

                }

  

        

  

                // 保存到缓存

  

                this.detailCache.set(cacheKey, { title, jsonData, columns });

  

                this.cacheTimestamps.set(cacheKey, now);

  

        

  

                // 创建列表弹窗

  

                this.showListModal(title, jsonData, columns);

  

      } catch (error) {

        console.error('获取详细数据失败:', error);

        alert('获取详细数据失败: ' + error.message);

      }

    }

  showListModal(title, data, columns) {
    // 移除旧的列表弹窗
    const oldModal = document.getElementById('listModal');
    if (oldModal) {
      oldModal.remove();
    }

    // 创建新的列表弹窗
    const modal = document.createElement('div');
    modal.id = 'listModal';
    modal.className = 'modal';
    modal.style.display = 'flex';

    const header = columns.join('</th><th>');

    let rows = '';
    data.forEach((item, index) => {
      let values = [];

      // 根据数据类型选择正确的字段
      if (title.includes('项目列表')) {
        // 项目列表：name, compositions, layers, keyframes, effects
        values = [
          item.name || '-',
          item.compositions || 0,
          item.layers || 0,
          item.keyframes || 0,
          item.effects || 0
        ];
      } else if (title.includes('工作时长')) {
        // 工作时长列表：project, hours
        values = [
          item.project || '-',
          item.hours || '0'
        ];
      } else {
        // 其他列表：使用所有值
        values = Object.values(item).slice(0, columns.length);
      }

      const cells = values.map(v => `<td>${v || '-'}</td>`).join('');
      rows += `<tr>${cells}</tr>`;
    });

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="close-btn" onclick="document.getElementById('listModal').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="list-info">共 ${data.length} 条记录</div>
          <table class="list-table">
            <thead>
              <tr>
                <th>${header}</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  closeModal() {
    const modal = document.getElementById('detailModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
}