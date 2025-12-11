import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  to: string;
  cc?: string[];
  subject: string;
  template: string;
  data: any;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { to, cc, subject, template, data }: EmailRequest = await req.json();

    const html = getEmailTemplate(template, data);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const emailPayload: any = {
      from: 'TraceTI <notifications@traceti.com>',
      to: [to],
      subject,
      html
    };

    if (cc && cc.length > 0) {
      emailPayload.cc = cc;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error('Resend error:', result);
      throw new Error(result.message || 'Failed to send email');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('email_log').insert({
      email_to: to,
      subject,
      template,
      status: 'sent',
      resend_id: result.id,
      metadata: data
    });

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error sending email:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

function getEmailTemplate(template: string, data: any): string {
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
    </div>
  </div>
</body>
</html>
`;

  const templates: Record<string, (data: any) => string> = {
    'license-expiring': (d) => baseTemplate(`
      <h2 style="margin-top: 0;">⚠️ License Expiring Soon</h2>
      <p>Hi ${d.userName},</p>
      <p>Your license is expiring soon and requires attention:</p>
      <div class="${d.daysLeft <= 7 ? 'alert-red' : 'alert-yellow'}">
        <p style="margin: 0; font-weight: 600;">${d.licenseName}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px;">
          Vendor: ${d.vendor}<br>
          Expires: ${d.expirationDate}<br>
          <strong>${d.daysLeft} days remaining</strong>
        </p>
      </div>
      <p>To avoid service interruption, please renew this license before it expires.</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${d.appUrl}/licenses" class="btn">View License Details</a>
      </p>
    `),
    'welcome': (d) => baseTemplate(`
      <h2 style="margin-top: 0;">🎉 Welcome to TraceTI!</h2>
      <p>Hi ${d.userName},</p>
      <p>Your account for <strong>${d.companyName}</strong> is ready. TraceTI helps you track and manage all your IT assets, licenses, and contracts in one place.</p>
      <div class="alert-green">
        <p style="margin: 0; font-weight: 600;">Getting Started</p>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 14px;">
          <li>Add your first license or hardware asset</li>
          <li>Set up expiration alerts</li>
          <li>Invite your team members</li>
        </ul>
      </div>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${d.loginUrl}" class="btn">Go to Dashboard</a>
      </p>
    `)
  };

  return templates[template]?.(data) || baseTemplate(`<p>${JSON.stringify(data)}</p>`);
}
