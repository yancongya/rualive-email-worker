/**
 * 生成工作警告邮件 HTML（幽默风格 - 告状版）
 * @param {Object} user - 用户信息
 * @param {Object} workData - 工作数据
 * @param {Object} config - 配置（包含紧急联系人及阈值）
 * @returns {string} HTML 字符串
 */
export function generateWarningHumorEmail(user, workData, config) {
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
  const shortfall = Math.max(0, minWorkHours - workHours);

  const hoursDecimal = workHours.toFixed(1);
  const minutes = Math.round((workHours % 1) * 60);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>亲友预警通知</title></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;color:#eeeeee;font-family:system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
<tr><td align="center" style="padding:24px 16px;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#1a1a1a;border:2px solid #FF3535;border-radius:8px;overflow:hidden;margin:0 auto;">
    
    <!-- Header -->
    <tr><td style="padding:16px 12px;background:#FF3535;color:#000000;text-align:center;font-weight:800;font-size:16px;letter-spacing:-0.5px;">
      <table align="center" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-right:8px;"><span style="font-size:24px;line-height:1;display:inline-block;vertical-align:middle;">⚠️</span></td>
          <td style="font-weight:bold; font-size:16px;">[告状] 您的朋友 ${username} 快没了</td>
        </tr>
      </table>
    </td></tr>

    <!-- Body -->
    <tr><td style="padding:24px 24px 12px 24px;line-height:1.6;font-size:15px;color:#cccccc;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        <tr>
          <td width="36" valign="top"><span style="font-size:28px;line-height:1;display:inline-block;vertical-align:middle;">🤖</span></td>
          <td valign="middle" style="padding-left:10px; font-size:18px; font-weight:bold; color:#ffffff;">
            致 ${emergencyName} <span style="font-size:12px;opacity:0.6;font-weight:normal;">(救火队员)</span>:
          </td>
        </tr>
      </table>
      
      <!-- Skull Decoration -->
      <div style="float:right; margin-left:16px; margin-bottom:16px;"><span style="font-size:48px;line-height:1;display:inline-block;vertical-align:middle;">💀</span></div>
      
      
    <p style="margin:0 0 12px;">很抱歉以这种方式打扰你。系统在 <strong>${username}</strong> 的"职业生涯预警"设置里发现了你的联系方式。</p>
    <p style="margin:0 0 12px;">我们实在没招了。这位大神今天只工做了 <span style="color:#FF6B35;font-weight:bold;font-size:18px;">${hoursDecimal}</span> 小时。</p>
    <p style="margin:0;">系统原本想直接报警（误），但觉得还是先通知你比较好。看来他/她最近不仅是在摸鱼，简直是在当海王。🐟</p>
    
    <div style="margin:16px 0; padding:12px; background:rgba(255,53,53,0.1); border-left:3px solid #FF3535; font-size:13px; color:#ffaaaa;">
      <strong>AI 甚至怀疑：</strong><br>
      1. 键盘被猫踩坏了<br>
      2. 人被外星人抓走了<br>
      3. 正在给《黑神话：悟空》贡献日活
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
      <tr>
        <td width="24" valign="middle"><span style="font-size:20px;line-height:1;display:inline-block;vertical-align:middle;">🔥</span></td>
        <td valign="middle" style="padding-left:8px; color:#ddd;">作为监护人（朋友），这边建议您直接一个电话过去骂醒他。</td>
      </tr>
    </table>
  
    </td></tr>

    <!-- Highlight Metric for Friend to See -->
    <tr><td align="center" style="padding:0 24px 24px;">
       <div style="background:#301111;border:1px dashed #FF3535;border-radius:8px;padding:12px;display:inline-block;min-width:200px;text-align:center;">
          <span style="color:#aa5555;font-size:12px;">${username} 的摆烂实录</span><br>
          <span style="color:#fff;font-size:24px;font-weight:bold;margin-top:4px;display:block;">${Math.floor(workHours)}小时 ${minutes}分钟</span>
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
      <span style="font-size:12px;color:#666;">系统检测到最后一次微弱的生命迹象: <span style="color:#999;">${lastWorkDate}</span></span>
    </td></tr>

    <!-- CTA (Integrated) -->
    <tr><td style="padding:0 20px 32px;text-align:center;">
       <!-- Divider -->
       <div style="height:1px;background:#444444;margin:0 12px 24px;"></div>
       
       <p style="margin:0 0 16px;font-size:14px;color:#ff8888;font-weight:bold;">别让我们难做，快去捞人！</p>
       
      <!-- Action Buttons -->
      <table align="center" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center" style="border-radius: 4px;" bgcolor="#FF6B35">
            <a href="mailto:${email}?subject=你被系统通报了&body=大哥，系统发邮件给我说你只工作了${hoursDecimal}小时，你还好吗？" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color: #000000; text-decoration: none; padding: 10px 20px; border: 1px solid #FF6B35; display: inline-block; font-weight: bold;">
              📩 发邮件骂他/她
            </a>
          </td>
        </tr>
      </table>
       
      <p style="margin:16px 0 0;font-size:11px;color:#555;">(如果不点击，系统可能会自动将此人简历投递给竞争对手)</p>
    </td></tr>
  </table>

  <!-- Signature (Outside Card) -->
  <p style="margin:16px 0 0;text-align:center;font-size:11px;color:#444;">
    RuAlive v6 · 自动告状系统 · 莫得感情<br><span style="opacity:0.5">Generated by AI</span>
  </p>
</td></tr></table></body></html>
  `.trim();
}