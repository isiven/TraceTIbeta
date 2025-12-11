import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function getAdditionalRecipients(supabase: any, userId: string): Promise<string[]> {
  const { data: recipients } = await supabase
    .from('notification_recipients')
    .select('email')
    .eq('user_id', userId);

  return recipients?.map((r: any) => r.email) || [];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const appUrl = Deno.env.get('APP_URL') || 'https://app.traceti.com';

    const { data: organizations } = await supabase
      .from('organizations')
      .select('*');

    let sentCount = 0;

    for (const org of organizations || []) {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('organization_id', org.id)
        .in('role', ['super_admin', 'admin']);

      for (const admin of admins || []) {
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('preferences, email_enabled')
          .eq('user_id', admin.id)
          .maybeSingle();

        if (!prefs || (prefs.email_enabled !== false && prefs.preferences?.['weekly_summary'] !== false)) {
          const stats = await getOrganizationStats(supabase, org.id);
          const expiringItems = await getExpiringItems(supabase, org.id);

          const today = new Date();
          const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          const weekOf = weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

          const additionalRecipients = await getAdditionalRecipients(supabase, admin.id);

          const emailPayload: any = {
            to: admin.email,
            subject: `📊 Weekly Summary - ${org.name}`,
            template: 'weekly-summary',
            data: {
              userName: admin.full_name || 'there',
              companyName: org.name,
              weekOf,
              stats,
              expiringItems,
              appUrl
            }
          };

          if (additionalRecipients.length > 0) {
            emailPayload.cc = additionalRecipients;
          }

          await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify(emailPayload)
          });

          sentCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sentCount,
        organizations: organizations?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending weekly summaries:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getOrganizationStats(supabase: any, orgId: string) {
  const today = new Date();
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const { data: licenses } = await supabase
    .from('licenses')
    .select('id, expiration_date, created_at')
    .eq('organization_id', orgId);

  const { data: hardware } = await supabase
    .from('hardware')
    .select('id, warranty_expiration, created_at')
    .eq('organization_id', orgId);

  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, end_date, created_at')
    .eq('organization_id', orgId);

  const totalAssets = (licenses?.length || 0) + (hardware?.length || 0) + (contracts?.length || 0);

  let expiringSoon = 0;
  let expired = 0;
  let newThisWeek = 0;

  for (const license of licenses || []) {
    if (license.expiration_date) {
      const expDate = new Date(license.expiration_date);
      if (expDate < today) expired++;
      else if (expDate <= in30Days) expiringSoon++;
    }
    if (new Date(license.created_at) >= weekAgo) newThisWeek++;
  }

  for (const hw of hardware || []) {
    if (hw.warranty_expiration) {
      const expDate = new Date(hw.warranty_expiration);
      if (expDate < today) expired++;
      else if (expDate <= in30Days) expiringSoon++;
    }
    if (new Date(hw.created_at) >= weekAgo) newThisWeek++;
  }

  for (const contract of contracts || []) {
    if (contract.end_date) {
      const expDate = new Date(contract.end_date);
      if (expDate < today) expired++;
      else if (expDate <= in30Days) expiringSoon++;
    }
    if (new Date(contract.created_at) >= weekAgo) newThisWeek++;
  }

  return {
    totalAssets,
    expiringSoon,
    expired,
    newThisWeek
  };
}

async function getExpiringItems(supabase: any, orgId: string) {
  const today = new Date();
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const items: Array<{ name: string; type: string; daysLeft: number }> = [];

  const { data: licenses } = await supabase
    .from('licenses')
    .select('software_name, name, expiration_date')
    .eq('organization_id', orgId)
    .gte('expiration_date', today.toISOString().split('T')[0])
    .lte('expiration_date', in30Days.toISOString().split('T')[0])
    .not('expiration_date', 'is', null)
    .limit(5);

  for (const license of licenses || []) {
    const expDate = new Date(license.expiration_date);
    const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    items.push({
      name: license.software_name || license.name,
      type: 'License',
      daysLeft
    });
  }

  const { data: hardware } = await supabase
    .from('hardware')
    .select('name, warranty_expiration')
    .eq('organization_id', orgId)
    .gte('warranty_expiration', today.toISOString().split('T')[0])
    .lte('warranty_expiration', in30Days.toISOString().split('T')[0])
    .not('warranty_expiration', 'is', null)
    .limit(5);

  for (const hw of hardware || []) {
    const expDate = new Date(hw.warranty_expiration);
    const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    items.push({
      name: hw.name,
      type: 'Hardware',
      daysLeft
    });
  }

  return items.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 5);
}
