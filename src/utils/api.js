/**
 * API Request Utilities
 */
const API_BASE = window.location.origin;

/**
 * Get Auth Header
 */
function getAuthHeader() {
  const token = localStorage.getItem('token');
  return {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  };
}

/**
 * Generic API Request
 */
async function apiRequest(endpoint, options = {}) {
  const url = API_BASE + endpoint;
  const headers = {
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get Work Logs
 */
async function getWorkLogs() {
  return apiRequest('/api/work-logs');
}

/**
 * Get User Config
 */
async function getUserConfig() {
  return apiRequest('/api/config');
}

/**
 * Save User Config
 */
async function saveUserConfig(config) {
  return apiRequest('/api/config', {
    method: 'POST',
    body: JSON.stringify(config)
  });
}

/**
 * Send Test Email
 */
async function sendTestEmail() {
  return apiRequest('/api/send-now', {
    method: 'POST'
  });
}

/**
 * Update Online Status
 */
async function updateOnlineStatus() {
  try {
    // 发送心跳
    await apiRequest('/api/heartbeat', {
      method: 'POST'
    });

    // 获取 AE 在线状态
    const response = await apiRequest('/api/ae-status', {
      method: 'GET'
    });

    // Update online status display
    if (window.updateOnlineStatusDisplay) {
      const isOnline = response.success && response.isOnline === true;
      window.updateOnlineStatusDisplay(isOnline, response);
    }

    return response;
  } catch (error) {
    console.error('Update online status failed:', error);

    // Update to offline status
    if (window.updateOnlineStatusDisplay) {
      window.updateOnlineStatusDisplay(false);
    }

    throw error;
  }
}

/**
 * Update AE Status (from AE extension)
 */
async function updateAEStatus(status) {
  return apiRequest('/api/ae-status', {
    method: 'POST',
    body: JSON.stringify(status)
  });
}