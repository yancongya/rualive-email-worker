/**
 * 生成每日工作总结邮件 HTML（幽默风格）
 * @param {Object} user - 用户信息
 * @param {Object} workData - 工作数据
 * @param {Object} config - 配置（包含紧急联系人及阈值）
 * @returns {string} HTML 字符串
 */
export function generateDailySummaryHumorEmail(user, workData, config) {
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

  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const hoursText = workHours >= 1 ? `${workHours}小时` : `${Math.round(workHours * 60)}分钟`;
  const isLowWorkTime = workHours < minWorkHours;

  const hoursDecimal = workHours.toFixed(1);
  const minutes = Math.round((workHours % 1) * 60);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>工作日报</title></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;color:#eeeeee;font-family:system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
<tr><td align="center" style="padding:24px 16px;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#1a1a1a;border:1px solid #333333;border-radius:8px;overflow:hidden;margin:0 auto;">
    
    <!-- Header -->
    <tr><td style="padding:16px 12px;background:#FF6B35;color:#000000;text-align:center;font-weight:800;font-size:16px;letter-spacing:-0.5px;">
      <!-- Use a table for header alignment to be safe in Outlook -->
      <table align="center" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-right:8px;"><span style="font-size:20px;line-height:1;display:inline-block;vertical-align:middle;">📅</span></td>
          <td style="font-weight:bold; font-size:16px;">[日报] ${dateStr} 摆烂日报</td>
        </tr>
      </table>
    </td></tr>

    <!-- Body -->
    <tr><td style="padding:24px 24px 12px 24px;line-height:1.6;font-size:15px;color:#cccccc;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        <tr>
          <td width="36" valign="top"><span style="font-size:28px;line-height:1;display:inline-block;vertical-align:middle;">🤖</span></td>
          <td valign="middle" style="padding-left:10px; font-size:18px; font-weight:bold; color:#ffffff;">哈喽 ${username}，今天是在工位上仰卧起坐了吗？</td>
        </tr>
      </table>
      
      <p style="margin:0 0 12px;">工时 <span style="color:#FF6B35;font-weight:bold;">${hoursDecimal}</span> 小时。属于是那种"虽然没大用但也不能把你开了"的水平。</p>
      <p style="margin:0;">为了房贷车贷，明天再演得像一点吧。</p>
      
    </td></tr>

    <!-- Highlight Metric -->
    <tr><td align="center" style="padding:0 24px 24px;">
       <div style="background:#252525;border:1px dashed #444;border-radius:8px;padding:12px;display:inline-block;min-width:200px;text-align:center;">
          <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
            <tr>
              <td style="padding-right:6px;"><span style="font-size:18px;line-height:1;display:inline-block;vertical-align:middle;">⏰</span></td>
              <td style="color:#888;font-size:12px;">今日有效工时</td>
            </tr>
          </table>
          <div style="color:#fff;font-size:24px;font-weight:bold;margin-top:4px;">${Math.floor(workHours)}小时 ${minutes}分钟</div>
       </div>
    </td></tr>

    <!-- Data Grid -->
    <tr><td style="padding:0 24px 24px;">
    <!-- Table 1: Top 3 Metrics -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:8px;width:100%;">
      <tr>
        <td width="33.33%" style="background:#222;border:1px solid #333;border-radius:8px;padding:16px 8px;text-align:center;vertical-align:top;">
          <div style="height:48px;display:flex;align-items:center;justify-content:center;"><span style="font-size:42px;line-height:1;display:inline-block;vertical-align:middle;">📁</span></div>
          <span style="color:#888888;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-top:8px;display:block;">项目数</span>
          <span style="color:#eeeeee;font-size:18px;font-weight:bold;margin-top:4px;display:block;font-family:monospace;">${projectCount}</span>
        </td>
        <td width="33.33%" style="background:#222;border:1px solid #333;border-radius:8px;padding:16px 8px;text-align:center;vertical-align:top;">
          <div style="height:48px;display:flex;align-items:center;justify-content:center;"><span style="font-size:42px;line-height:1;display:inline-block;vertical-align:middle;">🎬</span></div>
          <span style="color:#888888;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-top:8px;display:block;">合成数</span>
          <span style="color:#eeeeee;font-size:18px;font-weight:bold;margin-top:4px;display:block;font-family:monospace;">${compositionCount}</span>
        </td>
        <td width="33.33%" style="background:#222;border:1px solid #333;border-radius:8px;padding:16px 8px;text-align:center;vertical-align:top;">
          <div style="height:48px;display:flex;align-items:center;justify-content:center;"><span style="font-size:42px;line-height:1;display:inline-block;vertical-align:middle;">💎</span></div>
          <span style="color:#888888;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-top:8px;display:block;">关键帧</span>
          <span style="color:#eeeeee;font-size:18px;font-weight:bold;margin-top:4px;display:block;font-family:monospace;">${keyframeCount}</span>
        </td>
      </tr>
    </table>

    <!-- Table 2: Bottom 2 Metrics (Evenly Spaced) -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:8px;width:100%;margin-top:-4px;">
      <tr>
        <td width="50%" style="background:#222;border:1px solid #333;border-radius:8px;padding:16px 8px;text-align:center;vertical-align:top;">
          <div style="height:48px;display:flex;align-items:center;justify-content:center;"><span style="font-size:42px;line-height:1;display:inline-block;vertical-align:middle;">📚</span></div>
          <span style="color:#888888;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-top:8px;display:block;">图层数</span>
          <span style="color:#eeeeee;font-size:18px;font-weight:bold;margin-top:4px;display:block;font-family:monospace;">${layerCount}</span>
        </td>
        <td width="50%" style="background:#222;border:1px solid #333;border-radius:8px;padding:16px 8px;text-align:center;vertical-align:top;">
           <div style="height:48px;display:flex;align-items:center;justify-content:center;"><span style="font-size:42px;line-height:1;display:inline-block;vertical-align:middle;">✨</span></div>
           <span style="color:#888888;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-top:8px;display:block;">特效总数</span>
           <span style="color:#eeeeee;font-size:18px;font-weight:bold;margin-top:4px;display:block;font-family:monospace;">${effectCount}</span>
        </td>
      </tr>
    </table>
  </td></tr>

    <!-- Footer Meta -->
    <tr><td style="padding:0 24px 24px;text-align:center;">
      <span style="font-size:12px;color:#666;">最后一次假装在工作: <span style="color:#999;">${lastWorkDate}</span></span>
    </td></tr>

    <!-- CTA (Integrated into body) -->
    <tr><td style="padding:0 20px 32px;text-align:center;">
       <!-- Divider -->
       <div style="height:1px;background:#333;margin:0 12px 24px;"></div>
       
       <div style="margin:0 0 16px;font-size:14px;color:#bbb;font-weight:bold;display:flex;align-items:center;justify-content:center;gap:6px;">
         <span>下班了下班了（并不是）</span> <span style="font-size:16px;line-height:1;display:inline-block;vertical-align:middle;">🏃</span>
      </div>
       
      <!-- Action Button Style Link -->
      <table align="center" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center" style="border-radius: 4px; border: 1px solid #444; background: #222;">
            <a href="mailto:${emergencyEmail}" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color: #eeeeee; text-decoration: none; padding: 10px 20px; display: inline-block;">
              🚒 有事找救火队长: ${emergencyName}
            </a>
          </td>
        </tr>
      </table>
       
    </td></tr>
  </table>

  <!-- Signature (Outside Card) -->
  <p style="margin:16px 0 0;text-align:center;font-size:11px;color:#444;">
    RuAlive v6 · 自动阴阳系统 · 别回我（doge）<br><span style="opacity:0.5">Generated by AI</span>
  </p>

</td></tr></table></body></html>
  `.trim();
}