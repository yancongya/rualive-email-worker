/**
 * User Dashboard Main Logic
 */

// Global Data
window.appData = [];

// Global Component Instances
window.timeSelector = null;
window.statsGrid = null;
window.chartView = null;
window.logsTable = null;

/**
 * Initialize App
 */
async function initApp() {
  try {
    // Initialize components
    window.timeSelector = new TimeSelector('timeSelector', handleTimeRangeChange);
    window.statsGrid = new StatsGrid('statsGrid');
    window.chartView = new ChartView('chartView');
    window.logsTable = new LogsTable('logsView');

    // Load data
    await loadData();

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
    }

    // Load user info
    await loadUserInfo();

    // Update online status
    await updateOnlineStatus();

    // Schedule online status updates
    setInterval(updateOnlineStatus, 30000);

    // Initialize time nav
    updateTimeNavLabel();
    
    // Initialize tab manager after all components are ready
    if (window.tabManager) {
      window.tabManager.init();
    }

  } catch (error) {
    console.error('Initialization failed:', error);
    showToast('初始化失败，请刷新页面', 'error');
  }
}

/**
 * Load Data
 */
async function loadData() {
  try {
    const response = await getWorkLogs();
    if (response.success) {
      window.appData = response.data || [];
      updateDashboard();
    }
  } catch (error) {
    console.error('Failed to load data:', error);
    showToast('加载数据失败', 'error');
  }
}

/**
 * Update Dashboard
 */
function updateDashboard() {
  const range = window.timeSelector.getCurrentRange();
  const date = window.timeSelector.getCurrentDate();

  // Filter data by time range
  let filteredData;
  if (range === 'day') {
    filteredData = filterByTimeRange(window.appData, 'day', date);
  } else if (range === 'month') {
    filteredData = filterByTimeRange(window.appData, 'month', date);
  } else if (range === 'year') {
    filteredData = filterByTimeRange(window.appData, 'year', date);
  }

  // Calculate summary data from filtered data
  const summary = calculateSummary(filteredData);

  // Update stats grid (显示当前维度数据)
  window.statsGrid.update(summary);

  // Update chart (根据维度显示)
  window.chartView.update(filteredData, range, date);

  // Update logs table (始终显示全部数据)
  window.logsTable.update(window.appData);
}

/**
 * Handle Time Range Change
 */
function handleTimeRangeChange(range, date) {
  updateDashboard();
  updateTimeNavLabel();
  updateTimeNavTabs();
}

/**
 * Update Time Navigation Label
 */
function updateTimeNavLabel() {
  const range = window.timeSelector.getCurrentRange();
  const date = window.timeSelector.getCurrentDate();
  const label = document.getElementById('timeNavLabel');

  if (!label) return;

  if (range === 'day') {
    if (date) {
      const d = new Date(date);
      label.textContent = `${d.getMonth() + 1}月${d.getDate()}日`;
    } else {
      const now = new Date();
      label.textContent = `${now.getMonth() + 1}月${now.getDate()}日`;
    }
  } else if (range === 'month') {
    if (date) {
      const [year, month] = date.split('-');
      label.textContent = `${year}年${month}月`;
    } else {
      const now = new Date();
      label.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月`;
    }
  } else if (range === 'year') {
    if (date) {
      label.textContent = `${date}年`;
    } else {
      const now = new Date();
      label.textContent = `${now.getFullYear()}年`;
    }
  }
}

/**
 * Update Time Navigation Tabs
 */
function updateTimeNavTabs() {
  const range = window.timeSelector.getCurrentRange();
  const tabs = document.querySelectorAll('.time-tab');

  tabs.forEach(tab => {
    const tabRange = tab.dataset.range;
    if (tabRange === range) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
}

/**
 * Load User Info
 */
async function loadUserInfo() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // 从 API 获取用户信息
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.user) {
        // 保存用户信息到 localStorage
        localStorage.setItem('userInfo', JSON.stringify(data.user));
        
        // 更新用户名显示
        document.getElementById('userInfo').textContent = data.user.username || data.user.email || 'User';
        
        // 如果有紧急联系人信息，更新全局变量供其他组件使用
        if (data.user.config) {
          window.emergencyContact = {
            name: data.user.config.emergency_name || '',
            email: data.user.config.emergency_email || ''
          };
          
          // 加载配置到表单
          loadConfigToForm(data.user.config);
        }
      }
    }
  } catch (error) {
    console.error('Failed to load user info:', error);
  }
}

/**
 * Load Config to Form
 */
function loadConfigToForm(config) {
  if (!config) return;
  
  const enabledSelect = document.getElementById('enabled');
  const userNotificationTimeInput = document.getElementById('userNotificationTime');
  const emergencyNotificationTimeInput = document.getElementById('emergencyNotificationTime');
  const enableEmergencyNotificationSelect = document.getElementById('enableEmergencyNotification');
  const emergencyEmailInput = document.getElementById('emergencyEmail');
  const emergencyNameInput = document.getElementById('emergencyName');
  const notificationScheduleSelect = document.getElementById('notificationSchedule');
  const minHoursInput = document.getElementById('minHours');
  
  if (enabledSelect) enabledSelect.value = config.enabled ? 'true' : 'false';
  if (userNotificationTimeInput) userNotificationTimeInput.value = config.user_notification_time || '22:00';
  if (emergencyNotificationTimeInput) emergencyNotificationTimeInput.value = config.emergency_notification_time || '22:00';
  if (enableEmergencyNotificationSelect) enableEmergencyNotificationSelect.value = config.enable_emergency_notification ? 'true' : 'false';
  if (emergencyEmailInput) emergencyEmailInput.value = config.emergency_email || '';
  if (emergencyNameInput) emergencyNameInput.value = config.emergency_name || '';
  if (notificationScheduleSelect) {
    notificationScheduleSelect.value = config.notification_schedule || 'all';
    // 显示/隐藏自定义日期选择
    toggleCustomDaysGroup();
    
    // 加载排除的日期
    if (config.notification_excluded_days) {
      try {
        const excludedDays = JSON.parse(config.notification_excluded_days);
        document.querySelectorAll('.day-checkbox').forEach(checkbox => {
          checkbox.checked = excludedDays.includes(checkbox.value);
        });
      } catch (e) {
        console.error('Failed to parse excluded days:', e);
      }
    }
  }
  if (minHoursInput) minHoursInput.value = config.min_work_hours || 2;
}

/**
 * Toggle Custom Days Group
 */
function toggleCustomDaysGroup() {
  const scheduleSelect = document.getElementById('notificationSchedule');
  const customDaysGroup = document.getElementById('customDaysGroup');
  
  if (scheduleSelect.value === 'custom') {
    customDaysGroup.style.display = 'block';
  } else {
    customDaysGroup.style.display = 'none';
  }
}

/**
 * Save Config
 */
async function saveConfig() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('请先登录', 'error');
      return;
    }

    const enabled = document.getElementById('enabled').value === 'true';
    const userNotificationTime = document.getElementById('userNotificationTime').value;
    const emergencyNotificationTime = document.getElementById('emergencyNotificationTime').value;
    const enableEmergencyNotification = document.getElementById('enableEmergencyNotification').value === 'true';
    const emergencyEmail = document.getElementById('emergencyEmail').value.trim();
    const emergencyName = document.getElementById('emergencyName').value.trim();
    const notificationSchedule = document.getElementById('notificationSchedule').value;
    const minHours = parseFloat(document.getElementById('minHours').value);
    
    // 获取排除的日期
    let excludedDays = [];
    if (notificationSchedule === 'custom') {
      document.querySelectorAll('.day-checkbox:checked').forEach(checkbox => {
        excludedDays.push(checkbox.value);
      });
    }
    
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        config: {
          enabled,
          sendTime: userNotificationTime,
          timezone: 'Asia/Shanghai',
          user_notification_time: userNotificationTime,
          emergency_notification_time: emergencyNotificationTime,
          enable_emergency_notification: enableEmergencyNotification,
          emergency_email: emergencyEmail,
          emergency_name: emergencyName,
          notification_schedule: notificationSchedule,
          notification_excluded_days: JSON.stringify(excludedDays),
          min_work_hours: minHours,
          min_keyframes: 0,
          min_json_size: 0
        }
      })
    });

    const data = await response.json();
    
    if (data.success) {
      showToast('配置保存成功', 'success');
      
      // 更新全局变量
      window.emergencyContact = {
        name: emergencyName,
        email: emergencyEmail
      };
    } else {
      showToast('保存失败: ' + (data.error || '未知错误'), 'error');
    }
  } catch (error) {
    console.error('Failed to save config:', error);
    showToast('保存失败: ' + error.message, 'error');
  }
}

/**
 * Send Test Email
 */
async function sendTestEmail() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('请先登录', 'error');
      return;
    }

    const recipient = document.getElementById('testEmailRecipient').value;
    
    if (recipient === 'emergency') {
      // 检查是否配置了紧急联系人
      const emergencyEmail = document.getElementById('emergencyEmail').value.trim();
      if (!emergencyEmail) {
        showToast('请先配置紧急联系人邮箱', 'error');
        return;
      }
    }

    showToast('正在发送测试邮件...', 'success');

    const response = await fetch('/api/send-now', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        recipient: recipient
      })
    });

    const data = await response.json();
    
    if (data.success) {
      showToast('测试邮件发送成功', 'success');
    } else {
      showToast('发送失败: ' + (data.error || '未知错误'), 'error');
    }
  } catch (error) {
    console.error('Failed to send test email:', error);
    showToast('发送失败: ' + error.message, 'error');
  }
}

/**
 * Update Online Status Display
 */
function updateOnlineStatusDisplay(isOnline, statusData = null) {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  if (!statusDot || !statusText) return;

  if (isOnline) {
    statusDot.className = 'status-dot online';
    let statusMessage = 'AE 在线';

    // 如果有项目信息，显示项目名称
    if (statusData && statusData.projectName) {
      statusMessage += ` - ${statusData.projectName}`;
    }
    // 如果有合成信息，显示合成名称
    if (statusData && statusData.compositionName) {
      statusMessage += ` / ${statusData.compositionName}`;
    }

    statusText.textContent = statusMessage;
  } else {
    statusDot.className = 'status-dot offline';
    statusText.textContent = 'AE 离线';

    // 如果有最后心跳时间，显示离线时长
    if (statusData && statusData.lastHeartbeat) {
      const lastHeartbeat = new Date(statusData.lastHeartbeat);
      const now = new Date();
      const diffMinutes = Math.floor((now - lastHeartbeat) / (1000 * 60));

      if (diffMinutes < 60) {
        statusText.textContent = `AE 离线 (${diffMinutes}分钟前)`;
      } else if (diffMinutes < 1440) {
        statusText.textContent = `AE 离线 (${Math.floor(diffMinutes / 60)}小时前)`;
      } else {
        statusText.textContent = `AE 离线 (${Math.floor(diffMinutes / 1440)}天前)`;
      }
    }
  }

  // 同时更新 AE 状态卡片
  updateAEStatusCard(isOnline, statusData);
}

/**
 * Update AE Status Card
 */
function updateAEStatusCard(isOnline, statusData = null) {
  const statusContent = document.getElementById('aeStatusContent');
  if (!statusContent) return;

  if (!statusData) {
    statusContent.innerHTML = '<div class="status-loading">Loading AE status...</div>';
    return;
  }

  let html = '';

  // 如果没有状态记录，显示提示信息
  if (!statusData.hasStatusRecord) {
    html += '<div class="ae-status-no-record">';
    html += '<div class="ae-status-icon">ℹ️</div>';
    html += '<div class="ae-status-message">No AE status data available</div>';
    html += '<div class="ae-status-hint">Status will be updated when AE extension is connected</div>';
    html += '</div>';
    statusContent.innerHTML = html;
    return;
  }

  if (isOnline) {
    html += '<div class="ae-status-online">';
    html += '<div class="ae-status-icon">✅</div>';
    html += '<div class="ae-status-message">After Effects is Online</div>';
    html += '</div>';

    if (statusData.projectName) {
      html += '<div class="ae-status-detail">';
      html += '<span class="ae-status-label">Project:</span>';
      html += `<span class="ae-status-value">${statusData.projectName}</span>`;
      html += '</div>';
    }

    if (statusData.compositionName) {
      html += '<div class="ae-status-detail">';
      html += '<span class="ae-status-label">Composition:</span>';
      html += `<span class="ae-status-value">${statusData.compositionName}</span>`;
      html += '</div>';
    }

    if (statusData.lastHeartbeat) {
      html += '<div class="ae-status-detail">';
      html += '<span class="ae-status-label">Last Heartbeat:</span>';
      html += `<span class="ae-status-value">${new Date(statusData.lastHeartbeat).toLocaleString('zh-CN')}</span>`;
      html += '</div>';
    }

    if (statusData.lastWorkData) {
      html += '<div class="ae-status-work-data">';
      html += '<h4>Current Work Data</h4>';
      html += '<div class="work-data-grid">';
      if (statusData.lastWorkData.work_hours !== undefined) {
        html += `<div class="work-data-item"><span class="work-data-label">Hours:</span><span class="work-data-value">${statusData.lastWorkData.work_hours}h</span></div>`;
      }
      if (statusData.lastWorkData.keyframe_count !== undefined) {
        html += `<div class="work-data-item"><span class="work-data-label">Keyframes:</span><span class="work-data-value">${statusData.lastWorkData.keyframe_count}</span></div>`;
      }
      if (statusData.lastWorkData.json_size !== undefined) {
        html += `<div class="work-data-item"><span class="work-data-label">JSON Size:</span><span class="work-data-value">${statusData.lastWorkData.json_size}KB</span></div>`;
      }
      html += '</div>';
      html += '</div>';
    }
  } else {
    html += '<div class="ae-status-offline">';
    html += '<div class="ae-status-icon">❌</div>';
    html += '<div class="ae-status-message">After Effects is Offline</div>';
    html += '</div>';

    if (statusData.lastHeartbeat) {
      html += '<div class="ae-status-detail">';
      html += '<span class="ae-status-label">Last Online:</span>';
      html += `<span class="ae-status-value">${new Date(statusData.lastHeartbeat).toLocaleString('zh-CN')}</span>`;
      html += '</div>';
    }

    // 如果有历史数据，显示最后的工作数据
    if (statusData.lastWorkData) {
      html += '<div class="ae-status-work-data">';
      html += '<h4>Last Work Data</h4>';
      html += '<div class="work-data-grid">';
      if (statusData.lastWorkData.work_hours !== undefined) {
        html += `<div class="work-data-item"><span class="work-data-label">Hours:</span><span class="work-data-value">${statusData.lastWorkData.work_hours}h</span></div>`;
      }
      if (statusData.lastWorkData.keyframe_count !== undefined) {
        html += `<div class="work-data-item"><span class="work-data-label">Keyframes:</span><span class="work-data-value">${statusData.lastWorkData.keyframe_count}</span></div>`;
      }
      if (statusData.lastWorkData.json_size !== undefined) {
        html += `<div class="work-data-item"><span class="work-data-label">JSON Size:</span><span class="work-data-value">${statusData.lastWorkData.json_size}KB</span></div>`;
      }
      html += '</div>';
      html += '</div>';
    }
  }

  statusContent.innerHTML = html;
}

/**
 * Show Toast Message
 */
function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initApp);

// Expose functions to global scope for HTML onclick handlers
window.saveConfig = saveConfig;
window.sendTestEmail = sendTestEmail;
window.toggleCustomDaysGroup = toggleCustomDaysGroup;

// Add event listener for notification schedule change
document.addEventListener('DOMContentLoaded', () => {
  const scheduleSelect = document.getElementById('notificationSchedule');
  if (scheduleSelect) {
    scheduleSelect.addEventListener('change', toggleCustomDaysGroup);
  }
});