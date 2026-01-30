/**
 * 生成工作警告 / 低活跃提醒邮件 HTML
 * @param {Object} user - 用户信息
 * @param {Object} workData - 工作数据
 * @param {Object} config - 配置（包含紧急联系人及阈值）
 * @returns {string} HTML 字符串
 */
export function generateWarningEmail(user, workData, config) {
  // 安全取值 & 默认值
  const username      = user?.username        || '同事';
  const email         = user?.email           || '';

  const workHours     = Number(workData?.work_hours)     || 0;
  const projectCount  = workData?.project_count  || 0;
  const lastWorkDate  = workData?.last_work_date || '—';

  const emergencyName  = config?.emergency_name  || '管理员';
  const emergencyEmail = config?.emergency_email || 'admin@example.com';
  const minWorkHours   = Number(config?.thresholds?.minWorkHours) || 6;

  // 格式化日期（当前日期为系统时间或传入）
  const today = new Date(); // 或从外部传入
  const dateStr = today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }); // 示例：2026年1月30日 星期五

  const hoursText = workHours >= 1 
    ? `${workHours}小时` 
    : `${Math.round(workHours * 60)}分钟`;

  const shortfall = Math.max(0, minWorkHours - workHours);
  const shortfallText = shortfall > 0 ? `（还差 ${shortfall} 小时）` : '';

  // ────────────────────────────────────────────────
  // HTML（警告风格：红色调、强 CTA）
  // ────────────────────────────────────────────────
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>工作提醒 - ${dateStr}</title>
</head>
<body style="margin:0; padding:0; background-color:#f9f1f1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f9f1f1; padding:20px 0;">
    <tr>
      <td align="center">

        <table role="presentation" width="100%" style="max-width:600px; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.1);">

          <!-- 头部 - 警告色 -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444, #f87171); padding:32px 24px; text-align:center; color:white;">
              <h1 style="margin:0; font-size:30px; font-weight:700;">工作提醒</h1>
              <p style="margin:12px 0 0; font-size:16px; opacity:0.95;">${dateStr}</p>
            </td>
          </tr>

          <!-- 主要警示内容 -->
          <tr>
            <td style="padding:32px 24px 20px; font-size:16px; line-height:1.6; color:#1f2937;">
              <p style="margin:0 0 20px;">Hi，<strong>${username}</strong></p>
              
              <p style="margin:0 0 24px; font-weight:500; color:#991b1b;">
                系统检测到您今日的工作时长 <strong style="color:#b91c1c; font-size:1.15em;">${hoursText}</strong> ${shortfallText}，
                <br>明显低于公司最低目标（${minWorkHours}小时）。
              </p>

              <p style="margin:0 0 16px;">
                这可能会影响项目进度与团队整体计划。
                请合理安排时间，尽快补足今日工作量，或说明情况。
              </p>
            </td>
          </tr>

          <!-- 数据概览（简洁版） -->
          <tr>
            <td style="padding:0 24px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:0 8px; width:50%;">
                    <div style="background:#fef2f2; border-radius:10px; padding:20px 16px; text-align:center; border:1px solid #fecaca;">
                      <div style="font-size:32px; font-weight:700; color:#b91c1c;">${hoursText}</div>
                      <div style="margin-top:8px; font-size:14px; color:#7f1d1d;">今日工作时长</div>
                      <div style="margin-top:10px; font-size:13px; color:#991b1b; font-weight:500;">未达标</div>
                    </div>
                  </td>
                  <td style="padding:0 8px; width:50%;">
                    <div style="background:#fefce8; border-radius:10px; padding:20px 16px; text-align:center; border:1px solid #fef08a;">
                      <div style="font-size:32px; font-weight:700; color:#a16207;">${projectCount}</div>
                      <div style="margin-top:8px; font-size:14px; color:#713f12;">今日项目数</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 行动呼吁 -->
          <tr>
            <td style="padding:0 24px 32px; text-align:center;">
              <p style="margin:0 0 20px; font-size:15px; color:#374151; font-weight:500;">
                请在24小时内：
              </p>
              <p style="margin:0 0 28px; font-size:15px; line-height:1.5;">
                1. 继续完成今日剩余工作<br>
                2. 或回复本邮件 / 联系下方人员说明情况
              </p>

              <a href="mailto:${emergencyEmail}" style="display:inline-block; padding:14px 32px; background:#dc2626; color:white; font-weight:600; text-decoration:none; border-radius:8px; font-size:16px;">
                立即联系 ${emergencyName}
              </a>
            </td>
          </tr>

          <!-- 紧急联系 & 免责 -->
          <tr>
            <td style="padding:24px; background:#f1f5f9; text-align:center; font-size:14px; color:#4b5563; border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 16px;">
                如有特殊情况，请尽快联系：
                <br><strong>${emergencyName}</strong> 
                <a href="mailto:${emergencyEmail}" style="color:#dc2626; text-decoration:none; font-weight:500;">${emergencyEmail}</a>
              </p>
              <p style="margin:16px 0 0; font-size:13px; color:#6b7280;">
                这是一封自动发送的提醒邮件，请勿直接回复（除非说明情况）。
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