/**
 * 工作总结邮件模板（全新设计）
 * 用途：发送给用户的每日工作总结
 * 设计理念：成就系统 + 可视化数据 + 时间轴
 */

export function generateDailySummaryEmail(user, workData, config) {
  const date = new Date().toLocaleDateString('zh-CN');
  const hours = workData?.work_hours || 0;
  const hoursText = `${Math.floor(hours)}小时${Math.round((hours % 1) * 60)}分钟`;
  
  // 计算工作进度（假设8小时为100%）
  const progress = Math.min((hours / 8) * 100, 100);
  const progressColor = progress >= 100 ? '#10b981' : progress >= 75 ? '#3b82f6' : progress >= 50 ? '#f59e0b' : '#ef4444';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>今日成就 - RuAlive</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 20px;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }
    
    /* 顶部横幅 */
    .top-banner {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 40px 32px 30px;
      position: relative;
      overflow: hidden;
    }
    
    .top-banner::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: rotate 20s linear infinite;
    }
    
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .banner-content {
      position: relative;
      z-index: 1;
    }
    
    .banner-title {
      font-size: 36px;
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
    
    /* 用户问候 */
    .greeting {
      background: #f9fafb;
      border-left: 4px solid #667eea;
      padding: 16px 20px;
      margin-bottom: 32px;
      border-radius: 8px;
    }
    
    .greeting-text {
      font-size: 16px;
      color: #4b5563;
      margin: 0;
    }
    
    .greeting-text strong {
      color: #667eea;
      font-weight: 700;
    }
    
    /* 工作进度条 */
    .progress-section {
      margin-bottom: 40px;
    }
    
    .progress-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .progress-title {
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .progress-value {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
    }
    
    .progress-bar-container {
      height: 12px;
      background: #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
      position: relative;
    }
    
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      border-radius: 6px;
      transition: width 0.8s ease-out;
      position: relative;
    }
    
    .progress-bar::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      animation: shimmer 2s infinite;
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    /* 数据网格 */
    .data-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    
    .data-card {
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border-radius: 12px;
      padding: 20px 16px;
      text-align: center;
      border: 1px solid #e5e7eb;
      transition: all 0.3s ease;
    }
    
    .data-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
      border-color: #667eea;
    }
    
    .data-icon {
      font-size: 28px;
      margin-bottom: 8px;
    }
    
    .data-value {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 4px;
    }
    
    .data-label {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    /* 成就徽章 */
    .achievements {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 32px;
    }
    
    .achievements-title {
      font-size: 14px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .achievement-grid {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    
    .achievement {
      background: #ffffff;
      padding: 10px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      color: #92400e;
      border: 1px solid #fcd34d;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .achievement-icon {
      font-size: 16px;
    }
    
    /* 底部信息 */
    .footer {
      background: #f9fafb;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    
    .footer p {
      margin: 4px 0;
      color: #9ca3af;
      font-size: 12px;
    }
    
    .footer a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }
    
    /* 响应式 */
    @media only screen and (max-width: 600px) {
      .data-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .banner-title {
        font-size: 28px;
      }
      
      .content {
        padding: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 顶部横幅 -->
    <div class="top-banner">
      <div class="banner-content">
        <h1 class="banner-title">今日成就 🏆</h1>
        <p class="banner-subtitle">${user.username} 的工作报告</p>
        <div class="date-badge">${date}</div>
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div class="content">
      <!-- 用户问候 -->
      <div class="greeting">
        <p class="greeting-text">你好，<strong>${user.username}</strong>！这是你今天的工作成果。</p>
      </div>
      
      <!-- 工作进度 -->
      <div class="progress-section">
        <div class="progress-label">
          <span class="progress-title">📊 工作进度</span>
          <span class="progress-value">${hoursText}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${progress}%"></div>
        </div>
      </div>
      
      <!-- 数据卡片 -->
      <div class="data-grid">
        <div class="data-card">
          <div class="data-icon">📁</div>
          <div class="data-value">${workData?.project_count || 0}</div>
          <div class="data-label">项目</div>
        </div>
        <div class="data-card">
          <div class="data-icon">🎬</div>
          <div class="data-value">${workData?.composition_count || 0}</div>
          <div class="data-label">合成</div>
        </div>
        <div class="data-card">
          <div class="data-icon">🎞️</div>
          <div class="data-value">${workData?.keyframe_count || 0}</div>
          <div class="data-label">关键帧</div>
        </div>
        <div class="data-card">
          <div class="data-icon">📑</div>
          <div class="data-value">${workData?.layer_count || 0}</div>
          <div class="data-label">图层</div>
        </div>
        <div class="data-card">
          <div class="data-icon">✨</div>
          <div class="data-value">${workData?.effect_count || 0}</div>
          <div class="data-label">特效</div>
        </div>
        <div class="data-card">
          <div class="data-icon">⚡</div>
          <div class="data-value">${workData?.effect_count ? Math.round(workData.effect_count / workData.composition_count) : 0}</div>
          <div class="data-label">平均/合成</div>
        </div>
      </div>
      
      <!-- 成就徽章 -->
      <div class="achievements">
        <div class="achievements-title">🏅 今日成就</div>
        <div class="achievement-grid">
          ${hours >= 8 ? '<div class="achievement"><span class="achievement-icon">💪</span> 工作达人</div>' : ''}
          ${workData?.keyframe_count >= 500 ? '<div class="achievement"><span class="achievement-icon">🎯</span> 关键帧大师</div>' : ''}
          ${workData?.composition_count >= 20 ? '<div class="achievement"><span class="achievement-icon">🎨</span> 合成专家</div>' : ''}
          ${workData?.effect_count >= 100 ? '<div class="achievement"><span class="achievement-icon">✨</span> 特效魔术师</div>' : ''}
          <div class="achievement"><span class="achievement-icon">🌟</span> 持续进步</div>
        </div>
      </div>
      
      <!-- 页脚 -->
      <div class="footer">
        <p>📧 此邮件由 RuAlive 自动生成</p>
        <p>© ${new Date().getFullYear()} RuAlive. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}