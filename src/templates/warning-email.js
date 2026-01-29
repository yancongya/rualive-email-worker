/**
 * 工作警告邮件模板（全新设计）
 * 用途：发送给紧急联系人（工作时长不足时）
 * 设计理念：紧急通知 + 数据对比 + 行动建议
 */

export function generateWarningEmail(user, workData, config) {
  const date = new Date().toLocaleDateString('zh-CN');
  const hasWork = workData !== null;
  const thresholds = config.thresholds || {};
  
  // 计算差距
  const hours = workData?.work_hours || 0;
  const minHours = thresholds.minWorkHours || 8;
  const shortfall = Math.max(0, minHours - hours);
  const completionRate = hasWork ? Math.round((hours / minHours) * 100) : 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>工作提醒 - RuAlive</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      margin: 0;
      padding: 20px;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      overflow: hidden;
    }
    
    /* 紧急横幅 */
    .emergency-banner {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: #ffffff;
      padding: 40px 32px 30px;
      position: relative;
      overflow: hidden;
    }
    
    .emergency-banner::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: rotate 15s linear infinite;
    }
    
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .banner-content {
      position: relative;
      z-index: 1;
    }
    
    .alert-icon {
      font-size: 48px;
      margin-bottom: 12px;
      animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    .banner-title {
      font-size: 32px;
      font-weight: 800;
      margin: 0 0 8px 0;
      letter-spacing: -1px;
    }
    
    .banner-subtitle {
      font-size: 16px;
      opacity: 0.95;
      margin: 0;
      font-weight: 500;
    }
    
    .date-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(10px);
      padding: 8px 20px;
      border-radius: 30px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 16px;
    }
    
    /* 内容区域 */
    .content {
      padding: 32px;
    }
    
    /* 用户信息卡片 */
    .user-card {
      background: #fef2f2;
      border: 2px solid #fecaca;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 32px;
    }
    
    .user-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .user-icon {
      width: 48px;
      height: 48px;
      background: #dc2626;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    
    .user-info h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #dc2626;
    }
    
    .user-info p {
      margin: 4px 0 0 0;
      font-size: 14px;
      color: #6b7280;
    }
    
    .user-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 16px;
    }
    
    .user-stat {
      background: #ffffff;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid #fecaca;
    }
    
    .user-stat-label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    
    .user-stat-value {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
    }
    
    /* 进度对比 */
    .progress-comparison {
      margin-bottom: 32px;
    }
    
    .comparison-title {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 16px;
    }
    
    .comparison-bar-container {
      margin-bottom: 16px;
    }
    
    .comparison-label {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      margin-bottom: 6px;
    }
    
    .comparison-bar {
      height: 24px;
      background: #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .comparison-fill {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 8px;
      font-size: 12px;
      font-weight: 700;
      color: #ffffff;
      transition: width 0.5s ease;
    }
    
    .comparison-fill.current {
      background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
    }
    
    .comparison-fill.target {
      background: linear-gradient(90deg, #10b981 0%, #059669 100%);
    }
    
    .gap-indicator {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    
    .gap-indicator p {
      margin: 0;
      font-size: 14px;
      color: #92400e;
    }
    
    .gap-value {
      font-size: 24px;
      font-weight: 700;
      color: #dc2626;
    }
    
    /* 行动建议 */
    .action-steps {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 32px;
    }
    
    .action-title {
      font-size: 16px;
      font-weight: 700;
      color: #059669;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .step-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .step-number {
      width: 28px;
      height: 28px;
      background: #10b981;
      color: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      flex-shrink: 0;
    }
    
    .step-content p {
      margin: 0;
      font-size: 14px;
      color: #4b5563;
    }
    
    .step-content strong {
      color: #059669;
    }
    
    /* 底部信息 */
    .footer {
      background: #fef2f2;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #fecaca;
    }
    
    .footer p {
      margin: 4px 0;
      color: #9ca3af;
      font-size: 12px;
    }
    
    /* 响应式 */
    @media only screen and (max-width: 600px) {
      .user-stats {
        grid-template-columns: 1fr;
      }
      
      .banner-title {
        font-size: 24px;
      }
      
      .content {
        padding: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 紧急横幅 -->
    <div class="emergency-banner">
      <div class="banner-content">
        <div class="alert-icon">🚨</div>
        <h1 class="banner-title">工作提醒</h1>
        <p class="banner-subtitle">${user.username} 的每日报告</p>
        <div class="date-badge">${date}</div>
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div class="content">
      <!-- 用户信息卡片 -->
      <div class="user-card">
        <div class="user-card-header">
          <div class="user-icon">👤</div>
          <div class="user-info">
            <h3>${user.username}</h3>
            <p>${hasWork ? '⚠️ 工作量不足' : '❌ 今日未工作'}</p>
          </div>
        </div>
        ${hasWork ? `
        <div class="user-stats">
          <div class="user-stat">
            <div class="user-stat-label">工作时长</div>
            <div class="user-stat-value">${Math.floor(hours)}h${Math.round((hours % 1) * 60)}m</div>
          </div>
          <div class="user-stat">
            <div class="user-stat-label">合成数量</div>
            <div class="user-stat-value">${workData?.composition_count || 0}</div>
          </div>
          <div class="user-stat">
            <div class="user-stat-label">关键帧数</div>
            <div class="user-stat-value">${workData?.keyframe_count || 0}</div>
          </div>
        </div>
        ` : `
        <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #fecaca; margin-top: 12px;">
          <p style="margin: 0; color: #dc2626; font-weight: 600; font-size: 14px;">❌ 今天未打开 After Effects</p>
          <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 13px;">最后工作日：${workData?.last_work_date || '未知'}</p>
        </div>
        `}
      </div>
      
      ${hasWork ? `
      <!-- 进度对比 -->
      <div class="progress-comparison">
        <div class="comparison-title">📊 工作进度对比</div>
        
        <div class="comparison-bar-container">
          <div class="comparison-label">
            <span>实际完成</span>
            <span>${Math.floor(hours)}h${Math.round((hours % 1) * 60)}m (${completionRate}%)</span>
          </div>
          <div class="comparison-bar">
            <div class="comparison-fill current" style="width: ${completionRate}%">${completionRate}%</div>
          </div>
        </div>
        
        <div class="comparison-bar-container">
          <div class="comparison-label">
            <span>目标要求</span>
            <span>${minHours}h (100%)</span>
          </div>
          <div class="comparison-bar">
            <div class="comparison-fill target" style="width: 100%">${minHours}h</div>
          </div>
        </div>
        
        <div class="gap-indicator">
          <p>距离目标还差</p>
          <div class="gap-value">${Math.floor(shortfall)}h${Math.round((shortfall % 1) * 60)}m</div>
        </div>
      </div>
      ` : `
      <!-- 未工作提示 -->
      <div class="gap-indicator" style="margin-bottom: 32px;">
        <p>今日工作状态</p>
        <div class="gap-value">0% 完成</div>
        <p style="margin-top: 8px;">距离目标：${minHours}h</p>
      </div>
      `}
      
      <!-- 行动建议 -->
      <div class="action-steps">
        <div class="action-title">
          <span>💡</span>
          <span>建议行动</span>
        </div>
        <div class="step-item">
          <div class="step-number">1</div>
          <div class="step-content">
            <p><strong>联系用户</strong> - 了解工作进度和遇到的困难</p>
          </div>
        </div>
        <div class="step-item">
          <div class="step-number">2</div>
          <div class="step-content">
            <p><strong>提供支持</strong> - 协助解决技术问题或资源需求</p>
          </div>
        </div>
        <div class="step-item">
          <div class="step-number">3</div>
          <div class="step-content">
            <p><strong>跟进进度</strong> - 确认后续工作计划和时间安排</p>
          </div>
        </div>
      </div>
      
      <!-- 页脚 -->
      <div class="footer">
        <p>📧 此邮件由 RuAlive 自动生成</p>
        <p>紧急联系人监督系统</p>
        <p>© ${new Date().getFullYear()} RuAlive. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}