/**
 * 生成每日工作总结邮件 HTML
 * @param {Object} user - 用户信息
 * @param {Object} workData - 工作数据
 * @param {Object} config - 配置（包含紧急联系人及阈值）
 * @returns {string} HTML 字符串
 */
export function generateDailySummaryEmail(user, workData, config) {
  // 安全取值 & 默认值
  const username = user?.username || '同事';
  const email = user?.email || '';

  const workHours = Number(workData?.work_hours) || 0;
  const projectCount = workData?.project_count || 0;
  const compositionCount = workData?.composition_count || 0;
  const keyframeCount = workData?.keyframe_count || 0;
  const layerCount = workData?.layer_count || 0;
  const effectCount = workData?.effect_count || 0;
  const lastWorkDate = workData?.last_work_date || '—';

  const emergencyName = config?.emergency_name || '管理员';
  const emergencyEmail = config?.emergency_email || 'admin@example.com';
  const minWorkHours = Number(config?.thresholds?.minWorkHours) || 6;

  // 格式化
  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }); // 2026年2月3日 星期二

  const hoursText = workHours >= 1 ? `${workHours}小时` : `${Math.round(workHours * 60)}分钟`;
  const isLowWorkTime = workHours < minWorkHours;

  // ────────────────────────────────────────────────
  // HTML 主体（内联样式 + 表格布局 + 响应式）
  // ────────────────────────────────────────────────
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>每日工作简报 - ${dateStr}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <!-- 外层容器 -->
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f4f4f9; padding:20px 0;">
    <tr>
      <td align="center">

        <!-- 主内容区域（最大宽度600px） -->
        <table role="presentation" width="100%" style="max-width:600px; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          
          <!-- 头部 -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding:32px 24px; text-align:center; color:white;">
              <h1 style="margin:0; font-size:28px; font-weight:600;">每日工作简报</h1>
              <p style="margin:12px 0 0; font-size:15px; opacity:0.95;">${dateStr}</p>
            </td>
          </tr>

          <!-- 欢迎 & 问候 -->
          <tr>
            <td style="padding:32px 24px 16px; font-size:16px; line-height:1.6; color:#1f2937;">
              <p style="margin:0 0 20px;">Hi，<strong>${username}</strong></p>
              <p style="margin:0;">这是你今天的创作数据小结，希望对你有所帮助～</p>
            </td>
          </tr>

          <!-- 数据卡片区域 -->
          <tr>
            <td style="padding:0 24px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <!-- 工作时长卡片 -->
                  <td style="padding:0 6px 12px; width:50%; box-sizing:border-box;">
                    <div style="background:#f0f9ff; border-radius:10px; padding:20px 16px; text-align:center; border:1px solid #bae6fd;">
                      <div style="font-size:28px; font-weight:700; color:#0369a1;">${hoursText}</div>
                      <div style="margin-top:8px; font-size:14px; color:#475569;">今日工作时长</div>
                      ${
                        isLowWorkTime
                          ? `<div style="margin-top:10px; font-size:13px; color:#dc2626; font-weight:500;">低于目标 ${minWorkHours} 小时</div>`
                          : `<div style="margin-top:10px; font-size:13px; color:#16a34a;">达成目标</div>`
                      }
                    </div>
                  </td>

                  <!-- 项目数卡片 -->
                  <td style="padding:0 6px 12px; width:50%; box-sizing:border-box;">
                    <div style="background:#f0fdf4; border-radius:10px; padding:20px 16px; text-align:center; border:1px solid #bbf7d0;">
                      <div style="font-size:28px; font-weight:700; color:#15803d;">${projectCount}</div>
                      <div style="margin-top:8px; font-size:14px; color:#475569;">今日项目数</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 6px; width:50%;">
                    <div style="background:#fefce8; border-radius:10px; padding:16px; text-align:center; border:1px solid #fef08a;">
                      <div style="font-size:24px; font-weight:600; color:#a16207;">${compositionCount}</div>
                      <div style="font-size:13px; color:#713f12; margin-top:4px;">合成数量</div>
                    </div>
                  </td>
                  <td style="padding:0 6px; width:50%;">
                    <div style="background:#f3e8ff; border-radius:10px; padding:16px; text-align:center; border:1px solid #e9d5ff;">
                      <div style="font-size:24px; font-weight:600; color:#7e22ce;">${keyframeCount}</div>
                      <div style="font-size:13px; color:#6b21a8; margin-top:4px;">关键帧数量</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 更多数据（可选折叠风格） -->
          <tr>
            <td style="padding:0 24px 24px; font-size:14px; color:#4b5563;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="8" style="background:#f8fafc; border-radius:8px;">
                <tr>
                  <td>图层总数</td>
                  <td align="right"><strong>${layerCount}</strong></td>
                </tr>
                <tr>
                  <td>特效使用次数</td>
                  <td align="right"><strong>${effectCount}</strong></td>
                </tr>
                <tr>
                  <td>最后工作日期</td>
                  <td align="right"><strong>${lastWorkDate}</strong></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 底部提示 & 紧急联系 -->
          <tr>
            <td style="padding:24px; background:#f1f5f9; text-align:center; font-size:14px; color:#4b5563; border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 16px;">
                如有任何问题或需要协助，欢迎随时联系：
                <br><strong>${emergencyName}</strong> 
                <a href="mailto:${emergencyEmail}" style="color:#6366f1; text-decoration:none;">${emergencyEmail}</a>
              </p>
              <p style="margin:16px 0 0; font-size:13px; color:#6b7280;">
                这是一封自动发送的邮件，请勿直接回复。
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}