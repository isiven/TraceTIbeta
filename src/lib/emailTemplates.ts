const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TraceTI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .logo { text-align: center; margin-bottom: 24px; }
    .logo-text { color: #00a651; font-size: 24px; font-weight: bold; }
    .btn { display: inline-block; padding: 12px 24px; background: #00a651; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; }
    .btn:hover { background: #008c45; }
    .footer { text-align: center; margin-top: 24px; color: #6b7280; font-size: 12px; }
    .alert-red { background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; }
    .alert-yellow { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; }
    .alert-green { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; border-radius: 8px; }
    .stat { display: inline-block; text-align: center; padding: 16px; }
    .stat-value { font-size: 32px; font-weight: bold; color: #00a651; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-text">TraceTI</span>
      </div>
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TraceTI. All rights reserved.</p>
      <p>
        <a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a> ·
        <a href="{{app_url}}/settings/notifications" style="color: #6b7280;">Manage preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

export const licenseExpiringTemplate = (data: {
  userName: string;
  licenseName: string;
  vendor: string;
  expirationDate: string;
  daysLeft: number;
  licenseId: string;
  appUrl: string;
}) => baseTemplate(`
  <h2 style="margin-top: 0;">⚠️ License Expiring Soon</h2>

  <p>Hi ${data.userName},</p>

  <p>Your license is expiring soon and requires attention:</p>

  <div class="${data.daysLeft <= 7 ? 'alert-red' : 'alert-yellow'}">
    <p style="margin: 0; font-weight: 600;">${data.licenseName}</p>
    <p style="margin: 8px 0 0 0; font-size: 14px;">
      Vendor: ${data.vendor}<br>
      Expires: ${data.expirationDate}<br>
      <strong>${data.daysLeft} days remaining</strong>
    </p>
  </div>

  <p>To avoid service interruption, please renew this license before it expires.</p>

  <p style="text-align: center; margin: 32px 0;">
    <a href="${data.appUrl}/licenses" class="btn">
      View License Details
    </a>
  </p>

  <p style="color: #6b7280; font-size: 14px;">
    Need help? Contact your vendor or reply to this email.
  </p>
`);

export const licenseExpiredTemplate = (data: {
  userName: string;
  licenseName: string;
  vendor: string;
  expirationDate: string;
  licenseId: string;
  appUrl: string;
}) => baseTemplate(`
  <h2 style="margin-top: 0;">🚨 License Expired</h2>

  <p>Hi ${data.userName},</p>

  <p>The following license has expired:</p>

  <div class="alert-red">
    <p style="margin: 0; font-weight: 600;">${data.licenseName}</p>
    <p style="margin: 8px 0 0 0; font-size: 14px;">
      Vendor: ${data.vendor}<br>
      Expired on: ${data.expirationDate}
    </p>
  </div>

  <p><strong>Action Required:</strong> Please renew this license immediately to restore service.</p>

  <p style="text-align: center; margin: 32px 0;">
    <a href="${data.appUrl}/licenses" class="btn">
      View License Details
    </a>
  </p>
`);

export const hardwareWarrantyExpiringTemplate = (data: {
  userName: string;
  hardwareName: string;
  brand: string;
  expirationDate: string;
  daysLeft: number;
  hardwareId: string;
  appUrl: string;
}) => baseTemplate(`
  <h2 style="margin-top: 0;">⚠️ Hardware Warranty Expiring Soon</h2>

  <p>Hi ${data.userName},</p>

  <p>The warranty for the following hardware is expiring soon:</p>

  <div class="${data.daysLeft <= 7 ? 'alert-red' : 'alert-yellow'}">
    <p style="margin: 0; font-weight: 600;">${data.hardwareName}</p>
    <p style="margin: 8px 0 0 0; font-size: 14px;">
      Brand: ${data.brand}<br>
      Warranty Expires: ${data.expirationDate}<br>
      <strong>${data.daysLeft} days remaining</strong>
    </p>
  </div>

  <p>Consider renewing the warranty or planning for replacement if needed.</p>

  <p style="text-align: center; margin: 32px 0;">
    <a href="${data.appUrl}/hardware" class="btn">
      View Hardware Details
    </a>
  </p>
`);

export const contractExpiringTemplate = (data: {
  userName: string;
  contractName: string;
  vendor: string;
  expirationDate: string;
  daysLeft: number;
  contractId: string;
  appUrl: string;
}) => baseTemplate(`
  <h2 style="margin-top: 0;">⚠️ Support Contract Expiring Soon</h2>

  <p>Hi ${data.userName},</p>

  <p>Your support contract is expiring soon:</p>

  <div class="${data.daysLeft <= 7 ? 'alert-red' : 'alert-yellow'}">
    <p style="margin: 0; font-weight: 600;">${data.contractName}</p>
    <p style="margin: 8px 0 0 0; font-size: 14px;">
      Vendor: ${data.vendor}<br>
      Expires: ${data.expirationDate}<br>
      <strong>${data.daysLeft} days remaining</strong>
    </p>
  </div>

  <p>Please renew this contract to maintain support coverage.</p>

  <p style="text-align: center; margin: 32px 0;">
    <a href="${data.appUrl}/subscriptions" class="btn">
      View Contract Details
    </a>
  </p>
`);

export const welcomeTemplate = (data: {
  userName: string;
  companyName: string;
  loginUrl: string;
}) => baseTemplate(`
  <h2 style="margin-top: 0;">🎉 Welcome to TraceTI!</h2>

  <p>Hi ${data.userName},</p>

  <p>Your account for <strong>${data.companyName}</strong> is ready. TraceTI helps you track and manage all your IT assets, licenses, and contracts in one place.</p>

  <div class="alert-green">
    <p style="margin: 0; font-weight: 600;">Getting Started</p>
    <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 14px;">
      <li>Add your first license or hardware asset</li>
      <li>Set up expiration alerts</li>
      <li>Invite your team members</li>
    </ul>
  </div>

  <p style="text-align: center; margin: 32px 0;">
    <a href="${data.loginUrl}" class="btn">
      Go to Dashboard
    </a>
  </p>

  <p style="color: #6b7280; font-size: 14px;">
    Questions? Reply to this email for help.
  </p>
`);

export const invitationTemplate = (data: {
  inviterName: string;
  inviterEmail: string;
  companyName: string;
  role: string;
  inviteUrl: string;
  expiresIn: string;
}) => baseTemplate(`
  <h2 style="margin-top: 0;">👋 You've been invited!</h2>

  <p><strong>${data.inviterName}</strong> (${data.inviterEmail}) has invited you to join <strong>${data.companyName}</strong> on TraceTI.</p>

  <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="margin: 0;">
      <strong>Role:</strong> ${data.role}<br>
      <strong>Organization:</strong> ${data.companyName}
    </p>
  </div>

  <p style="text-align: center; margin: 32px 0;">
    <a href="${data.inviteUrl}" class="btn">
      Accept Invitation
    </a>
  </p>

  <p style="color: #6b7280; font-size: 14px;">
    This invitation expires ${data.expiresIn}. If you didn't expect this invitation, you can ignore this email.
  </p>
`);

export const weeklySummaryTemplate = (data: {
  userName: string;
  companyName: string;
  weekOf: string;
  stats: {
    totalAssets: number;
    expiringSoon: number;
    expired: number;
    newThisWeek: number;
  };
  expiringItems: Array<{ name: string; type: string; daysLeft: number }>;
  appUrl: string;
}) => baseTemplate(`
  <h2 style="margin-top: 0;">📊 Weekly Summary</h2>

  <p>Hi ${data.userName}, here's your weekly report for <strong>${data.companyName}</strong>.</p>
  <p style="color: #6b7280; font-size: 14px;">Week of ${data.weekOf}</p>

  <div style="text-align: center; margin: 24px 0;">
    <div class="stat">
      <div class="stat-value">${data.stats.totalAssets}</div>
      <div class="stat-label">Total Assets</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color: #f59e0b;">${data.stats.expiringSoon}</div>
      <div class="stat-label">Expiring Soon</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color: #ef4444;">${data.stats.expired}</div>
      <div class="stat-label">Expired</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color: #22c55e;">${data.stats.newThisWeek}</div>
      <div class="stat-label">New This Week</div>
    </div>
  </div>

  ${data.expiringItems.length > 0 ? `
    <div class="alert-yellow">
      <p style="margin: 0 0 8px 0; font-weight: 600;">⚠️ Requires Attention</p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
        ${data.expiringItems.map(item => `
          <li>${item.name} (${item.type}) - ${item.daysLeft} days left</li>
        `).join('')}
      </ul>
    </div>
  ` : `
    <div class="alert-green">
      <p style="margin: 0; font-weight: 600;">✅ All Clear!</p>
      <p style="margin: 8px 0 0 0; font-size: 14px;">No items expiring in the next 30 days.</p>
    </div>
  `}

  <p style="text-align: center; margin: 32px 0;">
    <a href="${data.appUrl}/dashboard" class="btn">
      View Full Dashboard
    </a>
  </p>
`);

export const userJoinedTemplate = (data: {
  userName: string;
  newUserName: string;
  newUserEmail: string;
  role: string;
  companyName: string;
  appUrl: string;
}) => baseTemplate(`
  <h2 style="margin-top: 0;">✅ Team Member Joined</h2>

  <p>Hi ${data.userName},</p>

  <p><strong>${data.newUserName}</strong> (${data.newUserEmail}) has accepted your invitation and joined <strong>${data.companyName}</strong>.</p>

  <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="margin: 0;">
      <strong>Name:</strong> ${data.newUserName}<br>
      <strong>Email:</strong> ${data.newUserEmail}<br>
      <strong>Role:</strong> ${data.role}
    </p>
  </div>

  <p style="text-align: center; margin: 32px 0;">
    <a href="${data.appUrl}/team" class="btn">
      View Team
    </a>
  </p>
`);

export const paymentFailedTemplate = (data: {
  userName: string;
  companyName: string;
  amount: string;
  currency: string;
  reason: string;
  retryDate: string;
  appUrl: string;
}) => baseTemplate(`
  <h2 style="margin-top: 0;">🚨 Payment Failed</h2>

  <p>Hi ${data.userName},</p>

  <p>We were unable to process your payment for <strong>${data.companyName}</strong>.</p>

  <div class="alert-red">
    <p style="margin: 0; font-weight: 600;">Payment Details</p>
    <p style="margin: 8px 0 0 0; font-size: 14px;">
      Amount: ${data.amount} ${data.currency}<br>
      Reason: ${data.reason}<br>
      Next retry: ${data.retryDate}
    </p>
  </div>

  <p><strong>Action Required:</strong> Please update your payment method to avoid service interruption.</p>

  <p style="text-align: center; margin: 32px 0;">
    <a href="${data.appUrl}/settings/billing" class="btn">
      Update Payment Method
    </a>
  </p>
`);

export const planLimitWarningTemplate = (data: {
  userName: string;
  companyName: string;
  planName: string;
  resourceType: string;
  currentUsage: number;
  limit: number;
  percentage: number;
  appUrl: string;
}) => baseTemplate(`
  <h2 style="margin-top: 0;">⚠️ Plan Limit Warning</h2>

  <p>Hi ${data.userName},</p>

  <p>Your organization <strong>${data.companyName}</strong> is approaching the limits of your <strong>${data.planName}</strong> plan.</p>

  <div class="alert-yellow">
    <p style="margin: 0; font-weight: 600;">${data.resourceType} Usage</p>
    <p style="margin: 8px 0 0 0; font-size: 14px;">
      Current: ${data.currentUsage} / ${data.limit}<br>
      <strong>${data.percentage}% of limit reached</strong>
    </p>
  </div>

  <p>Consider upgrading your plan to avoid hitting the limit.</p>

  <p style="text-align: center; margin: 32px 0;">
    <a href="${data.appUrl}/settings/billing" class="btn">
      Upgrade Plan
    </a>
  </p>
`);

export function getEmailTemplate(template: string, data: any): string {
  const templates: Record<string, (data: any) => string> = {
    'license-expiring': licenseExpiringTemplate,
    'license-expired': licenseExpiredTemplate,
    'hardware-warranty-expiring': hardwareWarrantyExpiringTemplate,
    'contract-expiring': contractExpiringTemplate,
    'welcome': welcomeTemplate,
    'invitation': invitationTemplate,
    'weekly-summary': weeklySummaryTemplate,
    'user-joined': userJoinedTemplate,
    'payment-failed': paymentFailedTemplate,
    'plan-limit-warning': planLimitWarningTemplate
  };

  return templates[template]?.(data) || baseTemplate(`<p>${JSON.stringify(data)}</p>`);
}
